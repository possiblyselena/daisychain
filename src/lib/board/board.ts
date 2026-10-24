/**
 * Talks to a MicroPython board over USB using the browser's Web Serial API.
 *
 * MicroPython has two modes on its serial port:
 * - the normal REPL (">>>"), which we show in the console so people can type into it, and
 * - the "raw REPL", a quiet mode made for tools: we send code, end it with Ctrl-D, and the
 *   board replies "OK", then the program's output, then \x04, then any error, then \x04>.
 * We use raw mode to run code, check files and save files.
 */
import ssd1306Source from './ssd1306.py?raw';

export type BoardStatus = 'disconnected' | 'idle' | 'busy' | 'running';
export type OutputKind = 'out' | 'err' | 'info';

const CTRL_A = '\x01'; // enter raw REPL
const CTRL_B = '\x02'; // leave raw REPL
const CTRL_C = '\x03'; // stop the running program
const CTRL_D = '\x04'; // run (raw REPL) / soft reboot (normal REPL)

const RAW_PROMPT = 'raw REPL; CTRL-B to exit\r\n>';
const NORMAL_PROMPT = '>>> ';

// USB vendor IDs for Espressif's built-in USB and common USB-serial chips, so the port picker
// only shows things that are likely to be a board.
const USB_VENDORS = [0x303a, 0x10c4, 0x1a86, 0x0403];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BoardError extends Error {}

export class Board {
	/** Called with text for the console. */
	onOutput: (text: string, kind: OutputKind) => void = () => {};
	/** Called whenever the status changes. */
	onStatus: (status: BoardStatus) => void = () => {};

	private port: SerialPort | null = null;
	private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
	private readLoop: Promise<void> | null = null;
	private encoder = new TextEncoder();
	private decoder = new TextDecoder();
	private writeQueue: Promise<void> = Promise.resolve();

	/**
	 * Where incoming text goes:
	 * - 'console': straight to the console (normal REPL)
	 * - 'capture': into `rx`, for us to read (raw REPL commands)
	 * - 'program': a program started with run(); output streams to the console
	 */
	private mode: 'console' | 'capture' | 'program' = 'console';
	private rx = '';
	private rxWaiters: (() => void)[] = [];
	private programPhase: 'out' | 'err' | 'prompt' = 'out';
	private programError = '';
	private quiet = false;
	/** Settles when the program started by run() has ended and the board is ready again. */
	private programDone: Promise<void> = Promise.resolve();
	private resolveProgramDone = () => {};
	private hasDriver = false;
	private _status: BoardStatus = 'disconnected';

	static get isSupported() {
		return typeof navigator !== 'undefined' && !!navigator.serial;
	}

	get status() {
		return this._status;
	}

	private setStatus(status: BoardStatus) {
		this._status = status;
		this.onStatus(status);
	}

	// ---------------------------------------------------------------- connecting

	async connect() {
		if (!navigator.serial) throw new BoardError('This browser can’t talk to USB devices.');
		const port = await navigator.serial.requestPort({
			filters: USB_VENDORS.map((usbVendorId) => ({ usbVendorId }))
		});
		await port.open({ baudRate: 115200 });
		this.port = port;
		this.hasDriver = false;
		navigator.serial.addEventListener('disconnect', this.handleUnplug);
		this.readLoop = this.startReading(port);
		this.setStatus('idle');

		// Stop whatever is running and check MicroPython answers.
		this.mode = 'capture';
		this.rx = '';
		await this.write(`\r${CTRL_C}${CTRL_C}\r`);
		try {
			try {
				await this.waitFor(NORMAL_PROMPT, 1500);
			} catch {
				// Maybe it was left in raw mode by an earlier session: leave it and look again.
				await this.write(`${CTRL_B}\r`);
				await this.waitFor(NORMAL_PROMPT, 1500);
			}
			this.onOutput('Connected! Press Run to send your code to the board.\r\n', 'info');
			this.mode = 'console';
			this.onOutput(NORMAL_PROMPT, 'out');
		} catch {
			this.mode = 'console';
			this.onOutput(
				'Connected, but MicroPython didn’t answer. Try pressing the RST button on your board, ' +
					'or set the board up with MicroPython first.\r\n',
				'err'
			);
		}
	}

	async disconnect() {
		const port = this.port;
		if (!port) return;
		this.port = null;
		navigator.serial?.removeEventListener('disconnect', this.handleUnplug);
		try {
			await this.reader?.cancel();
		} catch {
			// Already gone.
		}
		await this.readLoop;
		try {
			await port.close();
		} catch {
			// Already closed (e.g. unplugged).
		}
		this.mode = 'console';
		this.resolveProgramDone();
		this.setStatus('disconnected');
	}

	/** Resolves once the program started by run() has ended. */
	whenFinished() {
		return this.programDone;
	}

	/** Stops a program started by run() and waits for the board to be ready for the next one. */
	private async settle() {
		if (this.mode === 'program') await this.write(CTRL_C);
		await Promise.race([this.programDone, sleep(3000)]);
		if (this.mode === 'program') this.mode = 'console';
	}

	private handleUnplug = (event: Event) => {
		if ((event as Event & { target: SerialPort }).target !== this.port) return;
		this.onOutput('\r\nBoard unplugged.\r\n', 'info');
		void this.disconnect();
	};

	private async startReading(port: SerialPort) {
		while (port.readable && this.port === port) {
			this.reader = port.readable.getReader();
			try {
				while (true) {
					const { value, done } = await this.reader.read();
					if (done) break;
					if (value) this.handleIncoming(this.decoder.decode(value, { stream: true }));
				}
			} catch {
				// The device went away or the read was cancelled.
			} finally {
				this.reader.releaseLock();
				this.reader = null;
			}
		}
	}

	// ---------------------------------------------------------------- incoming data

	private handleIncoming(text: string) {
		if (this.mode === 'console') {
			this.onOutput(text, 'out');
		} else if (this.mode === 'capture') {
			this.rx += text;
			this.rxWaiters.splice(0).forEach((wake) => wake());
		} else {
			this.handleProgramOutput(text);
		}
	}

	/** Splits a running program's output into normal output and errors. */
	private handleProgramOutput(text: string) {
		let rest = text;
		while (rest) {
			if (this.programPhase === 'prompt') {
				// After the error section the board prints ">" and is ready again.
				if (rest.includes('>')) void this.finishProgram();
				return;
			}
			const end = rest.indexOf(CTRL_D);
			const chunk = end === -1 ? rest : rest.slice(0, end);
			// Errors are collected and shown once complete, so we can explain them.
			if (this.programPhase === 'out') {
				if (chunk) this.onOutput(chunk, 'out');
			} else {
				this.programError += chunk;
			}
			if (end === -1) return;
			if (this.programPhase === 'err') this.showProgramError(this.programError);
			this.programPhase = this.programPhase === 'out' ? 'err' : 'prompt';
			rest = rest.slice(end + 1);
		}
	}

	private showProgramError(error: string) {
		if (!error.trim()) return;
		if (error.includes('KeyboardInterrupt')) {
			this.onOutput('\r\n■ Stopped.\r\n', 'info');
			return;
		}
		this.onOutput(error.replace(/\r?\n/g, '\r\n'), 'err');
		const hint = explainError(error);
		if (hint) this.onOutput(`💡 ${hint}\r\n`, 'info');
	}

	/** Waits until `token` arrives; returns everything before it. */
	private async waitFor(token: string, timeoutMs = 3000): Promise<string> {
		const deadline = Date.now() + timeoutMs;
		while (true) {
			const index = this.rx.indexOf(token);
			if (index !== -1) {
				const before = this.rx.slice(0, index);
				this.rx = this.rx.slice(index + token.length);
				return before;
			}
			const remaining = deadline - Date.now();
			if (remaining <= 0) throw new BoardError(`The board didn’t reply in time.`);
			await new Promise<void>((resolve) => {
				const timer = setTimeout(resolve, remaining);
				this.rxWaiters.push(() => {
					clearTimeout(timer);
					resolve();
				});
			});
		}
	}

	// ---------------------------------------------------------------- sending

	/** Sends text to the board. Writes are queued so two can never overlap. */
	private write(text: string) {
		const job = this.writeQueue.then(() => this.writeNow(text));
		this.writeQueue = job.catch(() => {});
		return job;
	}

	/** Sends text in small pieces so the board's USB buffer doesn't overflow. */
	private async writeNow(text: string) {
		const writable = this.port?.writable;
		if (!writable) throw new BoardError('No board connected.');
		const bytes = this.encoder.encode(text);
		const writer = writable.getWriter();
		try {
			for (let i = 0; i < bytes.length; i += 256) {
				await writer.write(bytes.subarray(i, i + 256));
				if (bytes.length > 256) await sleep(10);
			}
		} finally {
			writer.releaseLock();
		}
	}

	/** Lets people type into the normal REPL from the console. */
	async sendKeys(keys: string) {
		if (this.port && this.mode !== 'capture') await this.write(keys);
	}

	private async enterRawRepl() {
		this.mode = 'capture';
		this.rx = '';
		await this.write(`\r${CTRL_C}${CTRL_C}`); // stop anything that's running
		await sleep(100);
		for (let attempt = 0; attempt < 3; attempt++) {
			this.rx = '';
			await this.write(`\r${CTRL_A}`);
			try {
				await this.waitFor(RAW_PROMPT, 1500);
				return;
			} catch {
				await this.write(CTRL_C);
			}
		}
		throw new BoardError(
			'Couldn’t get the board’s attention. Press RST on the board, then try again.'
		);
	}

	private async exitRawRepl(showPrompt = true) {
		this.mode = 'capture';
		this.rx = '';
		await this.write(CTRL_B);
		try {
			await this.waitFor(NORMAL_PROMPT, 2000);
		} catch {
			// Not fatal: the console just won't show a fresh prompt.
		}
		this.mode = 'console';
		if (showPrompt) this.onOutput(NORMAL_PROMPT, 'out');
	}

	/** Runs a short command in raw mode and returns what it printed. */
	private async exec(code: string, timeoutMs = 5000) {
		this.rx = '';
		await this.write(code + CTRL_D);
		await this.waitFor('OK', 2000);
		const out = await this.waitFor(CTRL_D, timeoutMs);
		const err = await this.waitFor(CTRL_D, 2000);
		await this.waitFor('>', 2000);
		if (err.trim()) throw new BoardError(err.trim());
		return out;
	}

	private async writeFile(path: string, content: string) {
		const hex = Array.from(this.encoder.encode(content), (b) => b.toString(16).padStart(2, '0'));
		const lines = [
			`from binascii import unhexlify as u`,
			`f = open(${JSON.stringify(path)}, 'wb')`
		];
		for (let i = 0; i < hex.length; i += 256)
			lines.push(`f.write(u('${hex.slice(i, i + 256).join('')}'))`);
		lines.push('f.close()');
		await this.exec(lines.join('\n'), 15000);
	}

	/** Copies the OLED driver onto the board if the code needs it and it isn't there yet. */
	private async ensureDriver(code: string) {
		if (this.hasDriver || !/\bssd1306\b/.test(code)) return;
		const files = await this.exec(`import os\nprint('ssd1306.py' in os.listdir())`);
		if (files.trim() !== 'True') {
			this.onOutput('Copying the screen driver (ssd1306.py) onto your board…\r\n', 'info');
			await this.writeFile('ssd1306.py', ssd1306Source);
		}
		this.hasDriver = true;
	}

	// ---------------------------------------------------------------- public actions

	/**
	 * Runs code on the board without saving it. Output streams to the console.
	 * `quiet` skips the "Running…/Finished" messages (errors still show).
	 */
	async run(code: string, { quiet = false } = {}) {
		await this.settle();
		this.setStatus('busy');
		this.quiet = quiet;
		try {
			await this.enterRawRepl();
			await this.ensureDriver(code);
			if (!quiet) this.onOutput('\r\n▶ Running your code…\r\n', 'info');
			this.rx = '';
			await this.write(code + CTRL_D);
			await this.waitFor('OK', 3000);
			// From here on the program is running: stream its output.
			this.programPhase = 'out';
			this.programError = '';
			this.programDone = new Promise((resolve) => (this.resolveProgramDone = resolve));
			this.mode = 'program';
			this.setStatus('running');
			const leftover = this.rx;
			this.rx = '';
			if (leftover) this.handleProgramOutput(leftover);
		} catch (error) {
			this.mode = 'console';
			this.setStatus(this.port ? 'idle' : 'disconnected');
			throw error;
		}
	}

	private async finishProgram() {
		if (this.mode !== 'program') return;
		const quietSuccess = this.quiet && !this.programError.trim();
		if (!this.programError.trim() && !this.quiet) this.onOutput('\r\n■ Finished.\r\n', 'info');
		try {
			await this.exitRawRepl(!quietSuccess);
		} catch {
			this.mode = 'console';
		}
		this.setStatus(this.port ? 'idle' : 'disconnected');
		this.resolveProgramDone();
	}

	/** Stops the running program. */
	async stop() {
		if (!this.port) return;
		await this.write(CTRL_C);
		if (this.mode === 'program') {
			// If the program ignores the first Ctrl-C, try once more.
			await sleep(500);
			if (this.mode === 'program') await this.write(CTRL_C);
		}
	}

	/** Saves the code as main.py (runs on every power-up), then restarts it. */
	async save(code: string) {
		await this.settle();
		this.setStatus('busy');
		try {
			await this.enterRawRepl();
			await this.ensureDriver(code);
			await this.writeFile('main.py', code);
			this.onOutput(
				'\r\n✓ Saved to your board as main.py — it runs whenever the board powers on.\r\n',
				'info'
			);
			await this.exitRawRepl(false);
			// Soft reboot so the saved program starts now; its output shows in the console.
			await this.write(CTRL_D);
			this.setStatus('idle');
		} catch (error) {
			this.mode = 'console';
			this.setStatus(this.port ? 'idle' : 'disconnected');
			throw error;
		}
	}
}

/** Plain-English hints for errors beginners hit most. */
function explainError(error: string): string | null {
	if (/ENODEV|Errno 19/.test(error))
		return 'The board can’t find your screen. Check the SDA/SCL wires and the pin numbers in your code.';
	if (/ETIMEDOUT|Errno 116/.test(error))
		return 'The screen didn’t respond. Check that VCC goes to 3.3V and GND to GND.';
	if (/ImportError.*ssd1306/.test(error))
		return 'The screen driver is missing. Press Run again and it will be copied over.';
	if (/SyntaxError|IndentationError/.test(error))
		return 'Python couldn’t read a line of your code. Check the line number above for typos or spacing.';
	if (/NameError/.test(error))
		return 'You used a name Python doesn’t know yet. Check the spelling, or that you imported it.';
	return null;
}

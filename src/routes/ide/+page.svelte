<script lang="ts">
	import { onMount } from 'svelte';
	import { Board, type BoardStatus } from '#lib/board/board.ts';
	import CodeEditor from '#lib/components/ide/CodeEditor.svelte';
	import SerialConsole from '#lib/components/ide/SerialConsole.svelte';
	import DoodlePad from '#lib/components/ide/DoodlePad.svelte';
	import DaisyChainPanel from '#lib/components/ide/DaisyChainPanel.svelte';
	import BlockEditor from '#lib/components/ide/BlockEditor.svelte';
	import TutorPanel from '#lib/components/ide/TutorPanel.svelte';
	import { doodleProgram, hexToPixels, oledSetup } from '#lib/board/oled.ts';

	// Starter program: the OLED "hello world". The top line shows yellow, the rest blue.
	const STARTER_CODE = `${oledSetup}

oled.fill(0)
oled.text("Daisy Chain!", 0, 0)
oled.text("hello :]", 0, 16)
oled.show()

print("Hello from your hairclip!")
`;
	const STORAGE_KEY = 'daisychain:code';

	const tabs = [
		{ id: 'blocks', label: 'blocks' },
		{ id: 'python', label: 'python' },
		{ id: 'doodle', label: 'doodle' }
	] as const;
	type TabId = (typeof tabs)[number]['id'];
	let activeTab = $state<TabId>('python');

	let code = $state(loadCode());
	// The MicroPython made from the blocks tab (kept up to date while that tab is open).
	let blocksCode = $state('');
	// Run and Save use the blocks when the blocks tab is open, otherwise the python code.
	const programToRun = $derived(activeTab === 'blocks' && blocksCode ? blocksCode : code);
	let status = $state<BoardStatus>('disconnected');
	let message = $state('');
	let terminal: SerialConsole | undefined = $state();

	const supported = Board.isSupported;
	const board = new Board();
	board.onStatus = (s) => (status = s);
	let lastError = $state('');
	board.onOutput = (text, kind) => {
		terminal?.write(text, kind);
		if (kind === 'err') lastError += text;
	};

	const connected = $derived(status !== 'disconnected');
	const canSend = $derived(status === 'idle' || status === 'running');

	function loadCode() {
		try {
			return localStorage.getItem(STORAGE_KEY) ?? STARTER_CODE;
		} catch {
			return STARTER_CODE;
		}
	}

	// Remember the person's code if they refresh the page.
	$effect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, code);
		} catch {
			// Storage blocked (e.g. a private window): the code just won't be remembered.
		}
	});

	async function attempt(action: () => Promise<void>) {
		message = '';
		try {
			await action();
		} catch (error) {
			// Closing the port picker without choosing a board isn't worth an error message.
			if (error instanceof DOMException && error.name === 'NotFoundError') return;
			message = error instanceof Error ? error.message : String(error);
			terminal?.write(`\r\n${message}\r\n`, 'err');
		}
	}

	const toggleConnection = () => attempt(() => (connected ? board.disconnect() : board.connect()));
	const run = () => {
		lastError = '';
		return attempt(() => board.run(programToRun));
	};
	const stop = () => attempt(() => board.stop());
	const save = () => attempt(() => board.save(programToRun));

	// Doodle tab: show the drawing on the board, or turn it into Python code.
	// Daisy chain: doodles friends send from their phones.
	const showFriendDoodle = (hex: string, quiet: boolean) => sendDoodle(hexToPixels(hex), quiet);
	const announceDoodle = (from: string | null) =>
		terminal?.write(`\r\n🌼 New doodle from ${from ?? 'a friend'}!\r\n`, 'info');

	async function sendDoodle(pixels: Uint8Array, quiet: boolean) {
		await attempt(async () => {
			await board.run(doodleProgram(pixels), { quiet });
			await board.whenFinished();
		});
	}

	function openDoodleAsCode(pixels: Uint8Array) {
		if (!confirm('Replace the code in the python tab with your doodle?')) return;
		code = doodleProgram(pixels);
		activeTab = 'python';
	}

	function openBlocksAsCode(blocks: string) {
		if (!confirm('Replace the code in the python tab with the code from your blocks?')) return;
		code = blocks;
		activeTab = 'python';
	}

	function resetCode() {
		if (confirm('Replace your code with the starter example?')) code = STARTER_CODE;
	}

	// Let go of the USB port when leaving the page.
	onMount(() => () => void board.disconnect());

	const statusText: Record<BoardStatus, string> = {
		disconnected: 'No board connected',
		idle: 'Board connected',
		busy: 'Sending to your board…',
		running: 'Running on your board'
	};

	const buttonClass =
		'rounded-md border-2 border-black bg-white px-2 py-2 font-karma text-[20px] font-bold hover:bg-daisy disabled:cursor-not-allowed disabled:opacity-40';
</script>

<svelte:head>
	<title>IDE · Daisy Chain</title>
</svelte:head>

<main class="mx-auto max-w-[1280px] px-4 pb-16 md:px-[38px]">
	<h1
		class="pt-10 text-[32px] leading-tight font-medium md:pt-[55px] md:text-[52.667px] md:leading-normal"
	>
		Coding your firmware!
	</h1>

	{#if !supported}
		<p class="mt-4 rounded-md border-2 border-black bg-daisy px-4 py-3 font-inter text-[18px]">
			To connect your board, open this page in <strong>Chrome</strong> or <strong>Edge</strong> on a computer.
			Other browsers can’t talk to USB devices yet.
		</p>
	{/if}

	<div class="mt-8 grid gap-10 lg:mt-[41px] lg:grid-cols-[minmax(0,1fr)_692px] lg:gap-[40px]">
		<!-- Left: board controls -->
		<section aria-label="Your board" class="flex flex-col items-center">
			<div class="flex w-full max-w-[340px] flex-col gap-3 font-inter text-[18px]">
				<p class="flex items-center gap-2" aria-live="polite">
					<span
						class="size-3 rounded-full {status === 'running'
							? 'bg-green-500'
							: connected
								? 'bg-daisy ring-2 ring-black'
								: 'bg-black/25'}"
						aria-hidden="true"
					></span>
					{statusText[status]}
				</p>
				<button
					type="button"
					onclick={toggleConnection}
					disabled={!supported || status === 'busy'}
					class="rounded-md border-2 border-black bg-daisy px-4 py-2 font-karma text-[22px] font-bold hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{connected ? 'Disconnect' : 'Connect board'}
				</button>
				<div class="grid grid-cols-3 gap-2">
					<button type="button" onclick={run} disabled={!canSend} class={buttonClass}>▶ Run</button>
					<button type="button" onclick={stop} disabled={!connected} class={buttonClass}
						>■ Stop</button
					>
					<button
						type="button"
						onclick={save}
						disabled={!canSend}
						title="Save as main.py so it runs whenever the board powers on"
						class={buttonClass}
					>
						Save
					</button>
				</div>
				{#if message}
					<p class="text-[15px] text-red-700" role="alert">{message}</p>
				{/if}
			</div>

			<div class="mt-8 w-full max-w-[340px]">
				<DaisyChainPanel {canSend} onShow={showFriendDoodle} onArrive={announceDoodle} />
			</div>
		</section>

		<!-- Right: coding panel and console -->
		<section aria-label="Code" class="flex min-w-0 flex-col gap-4">
			<div class="flex h-[538px] flex-col border-2 border-black bg-[#d9d9d9]">
				<div
					role="tablist"
					aria-label="Ways to code"
					class="flex h-[42.83px] shrink-0 items-end gap-5 border-b-2 border-black bg-daisy px-3"
				>
					{#each tabs as tab (tab.id)}
						<button
							type="button"
							role="tab"
							id="tab-{tab.id}"
							aria-selected={activeTab === tab.id}
							aria-controls="panel-{tab.id}"
							onclick={() => (activeTab = tab.id)}
							class="text-[26px] leading-[38px] font-medium aria-selected:underline aria-selected:decoration-2 aria-selected:underline-offset-4 md:text-[33.333px]"
						>
							{tab.label}
						</button>
					{/each}
					{#if activeTab === 'python'}
						<button
							type="button"
							onclick={resetCode}
							class="mb-2 ml-auto font-inter text-[14px] text-black/60 hover:text-black hover:underline"
						>
							reset example
						</button>
					{/if}
				</div>
				<div
					id="panel-{activeTab}"
					role="tabpanel"
					aria-labelledby="tab-{activeTab}"
					class="min-h-0 flex-1"
				>
					{#if activeTab === 'python'}
						<CodeEditor bind:value={code} label="Python code" />
					{:else if activeTab === 'doodle'}
						<DoodlePad {canSend} onSend={sendDoodle} onOpenAsCode={openDoodleAsCode} />
					{:else}
						<BlockEditor onCode={(c) => (blocksCode = c)} onOpenAsCode={openBlocksAsCode} />
					{/if}
				</div>
			</div>

			<div class="h-[220px] border-2 border-black bg-black">
				<SerialConsole bind:this={terminal} onInput={(keys) => void board.sendKeys(keys)} />
			</div>
			<TutorPanel code={programToRun} error={lastError} tab={activeTab} />
		</section>
	</div>
</main>

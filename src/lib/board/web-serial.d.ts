// Minimal types for the Web Serial API (Chrome/Edge), which TypeScript doesn't ship yet.
// https://developer.mozilla.org/docs/Web/API/Web_Serial_API

interface SerialPortFilter {
	usbVendorId?: number;
	usbProductId?: number;
}

interface SerialOptions {
	baudRate: number;
}

interface SerialPortInfo {
	usbVendorId?: number;
	usbProductId?: number;
}

interface SerialPort extends EventTarget {
	readonly readable: ReadableStream<Uint8Array> | null;
	readonly writable: WritableStream<Uint8Array> | null;
	open(options: SerialOptions): Promise<void>;
	close(): Promise<void>;
	getInfo(): SerialPortInfo;
}

interface Serial extends EventTarget {
	requestPort(options?: { filters?: SerialPortFilter[] }): Promise<SerialPort>;
	getPorts(): Promise<SerialPort[]>;
}

interface Navigator {
	readonly serial?: Serial;
}

<script lang="ts">
	import { onMount } from 'svelte';
	import { Terminal } from '@xterm/xterm';
	import '@xterm/xterm/css/xterm.css';
	import type { OutputKind } from '#lib/board/board.ts';

	type Props = {
		/** Called with whatever the person types, so it can be sent to the board. */
		onInput?: (data: string) => void;
	};

	let { onInput }: Props = $props();

	let host: HTMLDivElement;
	let terminal: Terminal | undefined;
	const pending: string[] = [];

	const COLORS: Record<OutputKind, [string, string]> = {
		out: ['', ''],
		err: ['\x1b[31m', '\x1b[0m'], // red
		info: ['\x1b[33m', '\x1b[0m'] // yellow
	};

	/** Prints text from the board (or our own messages) in the console. */
	export function write(text: string, kind: OutputKind = 'out') {
		const [start, end] = COLORS[kind];
		const out = start + text + end;
		if (terminal) terminal.write(out);
		else pending.push(out);
	}

	export function clear() {
		terminal?.clear();
	}

	onMount(() => {
		const fontSize = 14;
		const fontFamily = "ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";
		terminal = new Terminal({
			fontSize,
			fontFamily,
			convertEol: false,
			cursorBlink: true,
			theme: { background: '#000000', foreground: '#f2f2f2', cursor: '#ffed76' }
		});
		terminal.open(host);
		pending.splice(0).forEach((text) => terminal!.write(text));
		const input = terminal.onData((data) => onInput?.(data));

		// Size the terminal to fill its box: measure one character in the same font.
		const probe = document.createElement('span');
		probe.style.cssText = `position:absolute;visibility:hidden;font:${fontSize}px ${fontFamily};white-space:pre`;
		probe.textContent = 'W'.repeat(20);
		document.body.appendChild(probe);
		const charWidth = probe.getBoundingClientRect().width / 20;
		probe.remove();
		const fit = () => {
			const { clientWidth, clientHeight } = host;
			const cols = Math.max(20, Math.floor((clientWidth - 8) / charWidth));
			const rows = Math.max(4, Math.floor(clientHeight / (fontSize * 1.2)));
			terminal?.resize(cols, rows);
		};
		fit();
		const observer = new ResizeObserver(fit);
		observer.observe(host);

		return () => {
			observer.disconnect();
			input.dispose();
			terminal?.dispose();
			terminal = undefined;
		};
	});
</script>

<div bind:this={host} class="size-full overflow-hidden p-1"></div>

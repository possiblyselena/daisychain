<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { OLED, hexToPixels, pixelsToHex } from '#lib/board/oled.ts';
	import { OLED_COLORS } from '#lib/board/draw.ts';

	type Props = {
		/** Where to remember the drawing between visits. */
		storageKey: string;
		/** Called after every change (a finished stroke, undo, clear or invert). */
		onChange?: (pixels: Uint8Array) => void;
		/** Start with the thick brush (handy on phones, where pixels are tiny). */
		thick?: boolean;
	};

	let { storageKey, onChange, thick = false }: Props = $props();

	const { width: W, height: H, yellowRows } = OLED;
	const SCALE = 5; // canvas pixels per screen pixel
	const COLORS = OLED_COLORS;

	let canvas: HTMLCanvasElement;
	let pixels = loadPixels();
	const history: Uint8Array[] = [];

	let tool = $state<'draw' | 'erase'>('draw');
	// Only the starting brush comes from the prop; after that the person picks.
	let brush = $state<1 | 3>(untrack(() => thick) ? 3 : 1);
	let canUndo = $state(false);

	/** A copy of the current drawing. */
	export function getPixels() {
		return pixels.slice();
	}

	function loadPixels() {
		try {
			const saved = localStorage.getItem(storageKey);
			if (saved) return hexToPixels(saved);
		} catch {
			// No saved doodle.
		}
		return new Uint8Array(W * H);
	}

	function changed() {
		try {
			localStorage.setItem(storageKey, pixelsToHex(pixels));
		} catch {
			// Storage blocked: the doodle just won't survive a refresh.
		}
		onChange?.(pixels.slice());
	}

	// ---------------------------------------------------------------- drawing on the canvas

	function paintPixel(ctx: CanvasRenderingContext2D, x: number, y: number) {
		const on = pixels[y * W + x];
		ctx.fillStyle = on ? (y < yellowRows ? COLORS.yellow : COLORS.blue) : COLORS.off;
		ctx.fillRect(x * SCALE, y * SCALE, SCALE - 1, SCALE - 1);
	}

	function render() {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.fillStyle = COLORS.grid;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) paintPixel(ctx, x, y);
	}

	function setPixel(x: number, y: number) {
		const value = tool === 'draw' ? 1 : 0;
		const ctx = canvas.getContext('2d');
		const offset = brush === 3 ? 1 : 0;
		for (let dy = -offset; dy <= offset; dy++) {
			for (let dx = -offset; dx <= offset; dx++) {
				const px = x + dx;
				const py = y + dy;
				if (px < 0 || py < 0 || px >= W || py >= H) continue;
				pixels[py * W + px] = value;
				if (ctx) paintPixel(ctx, px, py);
			}
		}
	}

	/** Fills in every pixel between two points, so fast strokes don't leave gaps. */
	function drawLine(x0: number, y0: number, x1: number, y1: number) {
		const dx = Math.abs(x1 - x0);
		const dy = -Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx + dy;
		while (true) {
			setPixel(x0, y0);
			if (x0 === x1 && y0 === y1) break;
			const e2 = 2 * err;
			if (e2 >= dy) {
				err += dy;
				x0 += sx;
			}
			if (e2 <= dx) {
				err += dx;
				y0 += sy;
			}
		}
	}

	function toPixel(event: PointerEvent) {
		const rect = canvas.getBoundingClientRect();
		return {
			x: Math.min(W - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * W))),
			y: Math.min(H - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * H)))
		};
	}

	let last: { x: number; y: number } | null = null;

	function startStroke(event: PointerEvent) {
		if (event.button !== 0) return;
		canvas.setPointerCapture(event.pointerId);
		pushHistory();
		last = toPixel(event);
		setPixel(last.x, last.y);
	}

	function continueStroke(event: PointerEvent) {
		if (!last) return;
		const point = toPixel(event);
		drawLine(last.x, last.y, point.x, point.y);
		last = point;
	}

	function endStroke() {
		if (!last) return;
		last = null;
		changed();
	}

	// ---------------------------------------------------------------- buttons

	function pushHistory() {
		history.push(pixels.slice());
		if (history.length > 30) history.shift();
		canUndo = true;
	}

	function undo() {
		const previous = history.pop();
		if (!previous) return;
		pixels = previous;
		canUndo = history.length > 0;
		render();
		changed();
	}

	function clear() {
		pushHistory();
		pixels = new Uint8Array(W * H);
		render();
		changed();
	}

	function invert() {
		pushHistory();
		pixels = pixels.map((p) => (p ? 0 : 1));
		render();
		changed();
	}

	onMount(render);

	const toolClass = (active: boolean) =>
		`rounded-md border-2 border-black px-3 py-1 font-inter text-[15px] ${active ? 'bg-daisy font-bold' : 'bg-white hover:bg-daisy/50'}`;
</script>

<div class="flex flex-col gap-3 font-inter">
	<!-- Tools -->
	<div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Drawing tools">
		<button
			type="button"
			class={toolClass(tool === 'draw')}
			aria-pressed={tool === 'draw'}
			onclick={() => (tool = 'draw')}
		>
			Draw
		</button>
		<button
			type="button"
			class={toolClass(tool === 'erase')}
			aria-pressed={tool === 'erase'}
			onclick={() => (tool = 'erase')}
		>
			Erase
		</button>
		<span class="mx-1 h-6 w-px bg-black/20" aria-hidden="true"></span>
		<button
			type="button"
			class={toolClass(brush === 1)}
			aria-pressed={brush === 1}
			onclick={() => (brush = 1)}
		>
			Thin
		</button>
		<button
			type="button"
			class={toolClass(brush === 3)}
			aria-pressed={brush === 3}
			onclick={() => (brush = 3)}
		>
			Thick
		</button>
		<span class="mx-1 h-6 w-px bg-black/20" aria-hidden="true"></span>
		<button type="button" class={toolClass(false)} onclick={undo} disabled={!canUndo}>↶ Undo</button
		>
		<button type="button" class={toolClass(false)} onclick={invert}>Invert</button>
		<button type="button" class={toolClass(false)} onclick={clear}>Clear</button>
	</div>

	<!-- The screen: 128 × 64 pixels -->
	<canvas
		bind:this={canvas}
		width={W * SCALE}
		height={H * SCALE}
		onpointerdown={startStroke}
		onpointermove={continueStroke}
		onpointerup={endStroke}
		onpointercancel={endStroke}
		class="aspect-[2/1] w-full max-w-[600px] cursor-crosshair touch-none self-center rounded-sm border-2 border-black [image-rendering:pixelated]"
		aria-label="Drawing grid, {W} by {H} pixels, matching the OLED screen"
	></canvas>
	<p class="-mt-1 self-center text-[13px] text-black/60">
		{W} × {H} pixels — the top {yellowRows} rows glow yellow and the rest blue, just like the real screen.
	</p>
</div>

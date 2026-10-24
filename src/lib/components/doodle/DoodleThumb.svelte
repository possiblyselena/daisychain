<script lang="ts">
	import { OLED } from '#lib/board/oled.ts';
	import { drawOled } from '#lib/board/draw.ts';

	type Props = { pixels: string; label: string; class?: string };

	let { pixels, label, class: className = '' }: Props = $props();

	let canvas: HTMLCanvasElement;
	$effect(() => drawOled(canvas, pixels, 2));
</script>

<div role="img" aria-label={label} class={className}>
	<canvas
		bind:this={canvas}
		width={OLED.width * 2}
		height={OLED.height * 2}
		class="block aspect-[2/1] w-full [image-rendering:pixelated]"
		aria-hidden="true"
	></canvas>
</div>

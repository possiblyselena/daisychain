<script lang="ts">
	import { onMount } from 'svelte';

	// A short trail of fading daisy-yellow dots that follows the mouse.
	let canvas: HTMLCanvasElement;

	onMount(() => {
		// No trail on touch screens, or for people who prefer less motion.
		if (matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const dots: { x: number; y: number; life: number }[] = [];
		let frame = 0;

		function resize() {
			canvas.width = innerWidth * devicePixelRatio;
			canvas.height = innerHeight * devicePixelRatio;
			ctx!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
		}

		function draw() {
			ctx!.clearRect(0, 0, innerWidth, innerHeight);
			for (const dot of dots) {
				dot.life -= 0.04; // fades out in about 0.4 seconds
				const life = Math.max(dot.life, 0);
				ctx!.globalAlpha = life;
				ctx!.fillStyle = '#ffd23f';
				ctx!.beginPath();
				ctx!.arc(dot.x, dot.y, 6 * life, 0, Math.PI * 2);
				ctx!.fill();
			}
			while (dots.length && dots[0].life <= 0) dots.shift();
			// Stop animating once the trail is gone, so an idle page uses no CPU.
			frame = dots.length ? requestAnimationFrame(draw) : 0;
		}

		function onMove(event: PointerEvent) {
			if (event.pointerType !== 'mouse') return;
			dots.push({ x: event.clientX, y: event.clientY, life: 1 });
			if (!frame) frame = requestAnimationFrame(draw);
		}

		resize();
		addEventListener('resize', resize);
		addEventListener('pointermove', onMove);
		return () => {
			removeEventListener('resize', resize);
			removeEventListener('pointermove', onMove);
			cancelAnimationFrame(frame);
		};
	});
</script>

<!-- pointer-events-none: the trail never gets in the way of clicks -->
<canvas
	bind:this={canvas}
	class="pointer-events-none fixed inset-0 z-50 size-full"
	aria-hidden="true"
></canvas>

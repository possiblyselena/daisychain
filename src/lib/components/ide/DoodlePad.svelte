<script lang="ts">
	import PixelGrid from '#lib/components/doodle/PixelGrid.svelte';

	type Props = {
		/** Whether a board is connected and ready for a new drawing. */
		canSend: boolean;
		/** Shows the drawing on the board. `quiet` skips console messages (used for live mode). */
		onSend: (pixels: Uint8Array, quiet: boolean) => Promise<void>;
		/** Turns the drawing into Python code in the editor. */
		onOpenAsCode: (pixels: Uint8Array) => void;
	};

	let { canSend, onSend, onOpenAsCode }: Props = $props();

	let grid: PixelGrid;
	let live = $state(false);
	let sending = false;
	let sendAgain = false;

	/** Sends the drawing; if more drawing happens meanwhile, sends once more at the end. */
	async function send(quiet = false) {
		if (sending) {
			sendAgain = true;
			return;
		}
		if (!canSend) return;
		sending = true;
		try {
			do {
				sendAgain = false;
				await onSend(grid.getPixels(), quiet);
			} while (sendAgain && live);
		} finally {
			sending = false;
		}
	}
</script>

<div class="flex size-full flex-col gap-3 overflow-auto p-3 font-inter">
	<PixelGrid
		bind:this={grid}
		storageKey="daisychain:doodle"
		onChange={() => live && void send(true)}
	/>

	<!-- Sending -->
	<div class="mt-auto flex flex-wrap items-center gap-3">
		<button
			type="button"
			onclick={() => send(false)}
			disabled={!canSend}
			class="rounded-md border-2 border-black bg-daisy px-4 py-2 font-karma text-[20px] font-bold hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
		>
			Show on my screen
		</button>
		<label class="flex items-center gap-2 text-[15px]">
			<input type="checkbox" bind:checked={live} class="size-4 accent-black" />
			Live: update the screen as I draw
		</label>
		<button
			type="button"
			onclick={() => onOpenAsCode(grid.getPixels())}
			class="ml-auto text-[14px] text-black/60 hover:text-black hover:underline"
		>
			see it as Python code
		</button>
		{#if !canSend}
			<p class="w-full text-[14px] text-black/60">Connect your board to send your doodle to it.</p>
		{/if}
	</div>
</div>

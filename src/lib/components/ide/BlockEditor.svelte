<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		/** Called with the MicroPython the blocks turn into, whenever they change. */
		onCode: (code: string) => void;
		/** Opens the generated code in the python tab. */
		onOpenAsCode: (code: string) => void;
	};

	let { onCode, onOpenAsCode }: Props = $props();

	const STORAGE_KEY = 'daisychain:blocks';
	const DOODLE_KEY = 'daisychain:doodle';

	let host: HTMLDivElement;
	let code = $state('');
	let loading = $state(true);

	const readStorage = (key: string) => {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	};

	onMount(() => {
		let disposed = false;
		let cleanup = () => {};

		(async () => {
			// Blockly is big, so it only loads when the blocks tab is opened.
			const [{ Blockly, daisyTheme, toolbox, starterWorkspace, workspaceToPython }] =
				await Promise.all([
					import('#lib/blocks/daisy-blocks.ts'),
					document.fonts?.ready // block sizes depend on the Karma font being loaded
				]);
			if (disposed) return;

			const workspace = Blockly.inject(host, {
				toolbox,
				theme: daisyTheme,
				renderer: 'daisychain',
				trashcan: true,
				sounds: false,
				move: { scrollbars: true, drag: true, wheel: true },
				zoom: { controls: true, startScale: 0.9, maxScale: 2, minScale: 0.4 }
			});

			try {
				const saved = readStorage(STORAGE_KEY);
				Blockly.serialization.workspaces.load(
					saved ? JSON.parse(saved) : starterWorkspace,
					workspace
				);
			} catch {
				Blockly.serialization.workspaces.load(starterWorkspace, workspace);
			}

			// Blocks that aren't under an "on start" are greyed out, since they won't run.
			workspace.addChangeListener(Blockly.Events.disableOrphans);

			const update = () => {
				code = workspaceToPython(workspace, readStorage(DOODLE_KEY));
				onCode(code);
				try {
					localStorage.setItem(
						STORAGE_KEY,
						JSON.stringify(Blockly.serialization.workspaces.save(workspace))
					);
				} catch {
					// Storage blocked: blocks just won't survive a refresh.
				}
			};
			workspace.addChangeListener((event: { isUiEvent?: boolean }) => {
				if (!event.isUiEvent) update();
			});
			update();

			const resize = new ResizeObserver(() => Blockly.svgResize(workspace));
			resize.observe(host);
			loading = false;

			cleanup = () => {
				resize.disconnect();
				workspace.dispose();
			};
		})();

		return () => {
			disposed = true;
			cleanup();
		};
	});
</script>

<div class="relative size-full">
	<div bind:this={host} class="daisy-blocks absolute inset-0"></div>
	{#if loading}
		<p class="absolute inset-0 grid place-items-center font-inter text-[18px] text-black/50">
			Loading blocks…
		</p>
	{/if}
	<button
		type="button"
		onclick={() => onOpenAsCode(code)}
		class="absolute top-3 right-3 z-10 rounded-md border-2 border-black bg-white px-3 py-1 font-inter text-[14px] hover:bg-daisy"
	>
		see it as Python code
	</button>
</div>

<style>
	/* Tailwind makes every <svg> display:block, which un-hides parts Blockly hides with
	   display="none" (like the scrollbar of a closed toolbox flyout). */
	.daisy-blocks :global(svg[display='none']) {
		display: none;
	}

	/* Values sitting in a slot (numbers, text) look like the grey hexagon slots in the design. */
	.daisy-blocks :global(.blocklyShadow > .blocklyPath) {
		fill: #d9d9d9;
		stroke: none;
	}
	.daisy-blocks :global(.blocklyShadow .blocklyEditableField > rect.blocklyFieldRect) {
		fill: transparent !important;
		stroke: none !important;
	}
	.daisy-blocks :global(.blocklyShadow .blocklyText) {
		fill: #333;
	}
	.daisy-blocks :global(.blocklyShadow .blocklyImageField) {
		display: none;
	}
</style>

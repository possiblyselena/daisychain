<script lang="ts">
	import { onMount } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { python } from '@codemirror/lang-python';
	import { indentUnit } from '@codemirror/language';

	type Props = { value: string; label?: string };

	let { value = $bindable(), label = 'Code editor' }: Props = $props();

	let host: HTMLDivElement;
	let view: EditorView | undefined;

	// If the code is replaced from outside (e.g. "reset example"), show the new code.
	$effect(() => {
		const next = value;
		if (view && next !== view.state.doc.toString()) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } });
		}
	});

	onMount(() => {
		view = new EditorView({
			doc: value,
			parent: host,
			extensions: [
				basicSetup,
				python(),
				indentUnit.of('    '),
				EditorView.contentAttributes.of({ 'aria-label': label }),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) value = update.state.doc.toString();
				}),
				EditorView.theme({
					'&': { height: '100%', backgroundColor: '#d9d9d9', fontSize: '16px' },
					'&.cm-focused': { outline: 'none' },
					'.cm-scroller': {
						fontFamily: "ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace"
					},
					'.cm-gutters': { backgroundColor: '#cfcfcf', border: 'none', color: '#555' },
					'.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#cbcbcb' }
				})
			]
		});
		return () => view?.destroy();
	});
</script>

<div bind:this={host} class="size-full"></div>

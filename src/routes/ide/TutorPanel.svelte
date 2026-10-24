<script lang="ts">
	import { ConvexError } from 'convex/values';
	import { useAction } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api.js';

	type Props = { code: string; error: string; tab: string };
	let { code, error, tab }: Props = $props();

	let messages = $state<{ from: 'you' | 'tutor'; text: string }[]>([]);
	let question = $state('');
	let thinking = $state(false);

	const ask = useAction(api.tutor.ask);

	async function send(text: string) {
		text = text.trim();
		if (!text || thinking) return;
		messages.push({ from: 'you', text });
		question = '';
		thinking = true;
		try {
			const answer = await ask({ question: text, code, error: error.slice(-2000), tab });
			messages.push({ from: 'tutor', text: answer });
		} catch (e) {
			const text = e instanceof ConvexError ? String(e.data) : 'Sorry, something went wrong. Try again!';
			messages.push({ from: 'tutor', text });
		} finally {
			thinking = false;
		}
	}

	const chip =
		'rounded-md border-2 border-black bg-white px-3 py-1 text-[15px] hover:bg-daisy disabled:opacity-40';
</script>

<section aria-label="AI tutor" class="flex flex-col gap-3 border-2 border-black bg-white p-3 font-inter">
	<h2 class="font-karma text-[24px] font-bold">Ask the tutor 🌼</h2>

	<div class="flex max-h-[300px] flex-col gap-2 overflow-y-auto" aria-live="polite">
		{#each messages as message, i (i)}
			<p
				class="rounded-md px-3 py-2 whitespace-pre-wrap {message.from === 'you'
					? 'self-end bg-daisy'
					: 'self-start bg-[#d9d9d9]'}"
			>
				{message.text}
			</p>
		{/each}
		{#if thinking}<p class="text-black/60">Thinking…</p>{/if}
	</div>

	<div class="flex flex-wrap gap-2">
		{#if error}
			<button type="button" class={chip} disabled={thinking} onclick={() => send('Explain my error and give me a hint to fix it.')}>
				Explain my error
			</button>
		{/if}
		<button type="button" class={chip} disabled={thinking} onclick={() => send('What does my code do?')}>
			What does my code do?
		</button>
		<button type="button" class={chip} disabled={thinking} onclick={() => send('Give me an idea for something to add next.')}>
			Give me an idea
		</button>
	</div>

	<form class="flex gap-2" onsubmit={(e) => { e.preventDefault(); send(question); }}>
		<input
			bind:value={question}
			maxlength="500"
			placeholder="Ask anything about your code…"
			aria-label="Your question"
			class="min-w-0 flex-1 rounded-md border-2 border-black px-3 py-2"
		/>
		<button type="submit" disabled={thinking} class="rounded-md border-2 border-black bg-daisy px-4 font-karma text-[18px] font-bold disabled:opacity-40">
			Ask
		</button>
	</form>
	<p class="text-[13px] text-black/60">Answers come from Google Gemini and can be wrong.</p>
</section>
<script lang="ts">
	import { page } from '$app/state';
	import { useMutation, useQuery } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { api } from '../../../convex/_generated/api.js';
	import { pixelsToHex } from '#lib/board/oled.ts';
	import PixelGrid from '#lib/components/doodle/PixelGrid.svelte';

	// A friend's page for sending a doodle to someone's hairclip, e.g. /to/sparkly-bunny-42.
	const slug = $derived(page.params.slug ?? '');
	const clip = useQuery(api.clips.get, () => ({ slug }));
	const sendDoodle = useMutation(api.doodles.send);

	let grid: PixelGrid | undefined = $state();
	let name = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');
	let error = $state('');

	async function send() {
		if (!grid || status === 'sending') return;
		status = 'sending';
		error = '';
		try {
			await sendDoodle({ slug, pixels: pixelsToHex(grid.getPixels()), from: name.trim() || null });
			status = 'sent';
		} catch (e) {
			status = 'error';
			error = e instanceof ConvexError ? String(e.data) : 'Couldn’t send your doodle. Try again?';
		}
	}
</script>

<svelte:head>
	<title>Send a doodle · Daisy Chain</title>
</svelte:head>

<main class="mx-auto max-w-[720px] px-4 pt-8 pb-16 md:pt-[55px]">
	<h1 class="text-[34px] leading-tight font-medium md:text-[52.667px] md:leading-normal">
		Send a doodle 🌼
	</h1>

	{#if clip.isLoading}
		<p class="mt-4 font-inter text-[18px] text-black/60">Finding the hairclip…</p>
	{:else if !clip.data}
		<p class="mt-4 font-inter text-[18px]">
			This hairclip link doesn’t exist. Check the link with the person who shared it.
		</p>
	{:else}
		<p class="mt-2 font-inter text-[18px]">
			Draw something and it’ll pop up on <strong>{clip.data.slug}</strong>’s hairclip screen!
		</p>

		<div class="mt-6">
			<PixelGrid bind:this={grid} storageKey="daisychain:friend-doodle" thick />
		</div>

		<form
			class="mt-6 flex flex-col gap-4 font-inter"
			onsubmit={(event) => {
				event.preventDefault();
				void send();
			}}
		>
			<label class="flex flex-col gap-1 text-[16px]">
				Your name (optional)
				<input
					bind:value={name}
					maxlength="24"
					autocomplete="nickname"
					placeholder="so they know who it’s from"
					class="rounded-md border-2 border-black px-3 py-2 text-[18px]"
				/>
			</label>
			<button
				type="submit"
				disabled={status === 'sending'}
				class="rounded-md border-2 border-black bg-daisy px-6 py-3 font-karma text-[26px] font-bold hover:brightness-95 disabled:opacity-50"
			>
				{status === 'sending' ? 'Sending…' : 'Send 🌼'}
			</button>
			<p aria-live="polite" class="min-h-6 text-[16px]">
				{#if status === 'sent'}
					Sent! It’ll show up on their hairclip in a second. Draw another?
				{:else if status === 'error'}
					<span class="text-red-700">{error}</span>
				{/if}
			</p>
			<p class="text-[14px] text-black/60">Be kind: your doodle shows up on someone’s head! 💛</p>
		</form>
	{/if}
</main>

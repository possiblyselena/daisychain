<script lang="ts">
	import { untrack } from 'svelte';
	import { useMutation, useQuery } from 'convex-svelte';
	import { renderSVG } from 'uqr';
	import { api } from '../../../convex/_generated/api.js';
	import DoodleThumb from '#lib/components/doodle/DoodleThumb.svelte';

	type Doodle = { _id: string; _creationTime: number; pixels: string; from: string | null };

	type Props = {
		/** Whether a board is connected and ready. */
		canSend: boolean;
		/** Shows a doodle (hex pixels) on the board. */
		onShow: (pixels: string, quiet: boolean) => Promise<void>;
		/** Lets the IDE mention new doodles in the console. */
		onArrive?: (from: string | null) => void;
	};

	let { canSend, onShow, onArrive }: Props = $props();

	const STORAGE_KEY = 'daisychain:clip';
	let slug = $state(loadSlug());
	let autoShow = $state(true);
	let copied = $state(false);
	let creating = $state(false);
	let error = $state('');

	const createClip = useMutation(api.clips.create);
	const doodles = useQuery(api.doodles.latest, () => (slug ? { slug } : 'skip'));

	const link = $derived(slug ? `${location.origin}/to/${slug}` : '');
	const qrSvg = $derived(link ? renderSVG(link, { border: 1 }) : '');

	function loadSlug() {
		try {
			return localStorage.getItem(STORAGE_KEY);
		} catch {
			return null;
		}
	}

	async function getLink() {
		creating = true;
		error = '';
		try {
			slug = await createClip({});
			try {
				localStorage.setItem(STORAGE_KEY, slug);
			} catch {
				// Storage blocked: you'll get a new link next visit.
			}
		} catch {
			error = 'Couldn’t make a link. Is `npx convex dev` running?';
		} finally {
			creating = false;
		}
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(link);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// Clipboard blocked: the link is still visible to copy by hand.
		}
	}

	// When a new doodle arrives, mention it and (if allowed) show it on the board.
	// Doodles that were already there when the page opened aren't replayed.
	let seen: Set<string> | null = null;
	$effect(() => {
		const list = doodles.data as Doodle[] | undefined;
		if (!list) return;
		untrack(() => {
			if (!seen) {
				seen = new Set(list.map((d) => d._id));
				return;
			}
			const fresh = list.filter((d) => !seen!.has(d._id));
			if (!fresh.length) return;
			fresh.forEach((d) => seen!.add(d._id));
			const newest = fresh[0];
			onArrive?.(newest.from);
			if (autoShow && canSend) void onShow(newest.pixels, true);
		});
	});

	function timeAgo(time: number) {
		const seconds = Math.round((Date.now() - time) / 1000);
		if (seconds < 60) return 'just now';
		if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
		return `${Math.round(seconds / 3600)} h ago`;
	}
</script>

<section
	aria-labelledby="daisy-chain-title"
	class="w-full max-w-[340px] rounded-md border-2 border-black p-4 font-inter"
>
	<h2 id="daisy-chain-title" class="font-karma text-[26px] font-bold">Daisy chain 🌼</h2>

	{#if !slug}
		<p class="mt-1 text-[15px]">
			Let friends send doodles to your hairclip from their phones. They show up on your screen live!
		</p>
		<button
			type="button"
			onclick={getLink}
			disabled={creating}
			class="mt-3 w-full rounded-md border-2 border-black bg-daisy px-4 py-2 font-karma text-[20px] font-bold hover:brightness-95 disabled:opacity-50"
		>
			{creating ? 'Making your link…' : 'Get my share link'}
		</button>
		{#if error}<p class="mt-2 text-[14px] text-red-700" role="alert">{error}</p>{/if}
	{:else}
		<p class="mt-1 text-[15px]">Friends can scan this or open the link to send you a doodle:</p>
		<div class="mx-auto mt-3 w-[180px]" role="img" aria-label="QR code for {link}">
			{@html qrSvg}
		</div>
		<div class="mt-3 flex items-center gap-2">
			<a
				href={link}
				target="_blank"
				rel="noopener"
				class="min-w-0 flex-1 text-[14px] break-all underline"
			>
				{link}
			</a>
			<button
				type="button"
				onclick={copyLink}
				class="shrink-0 rounded-md border-2 border-black bg-white px-2 py-1 text-[14px] hover:bg-daisy"
			>
				{copied ? 'Copied!' : 'Copy'}
			</button>
		</div>

		<label class="mt-3 flex items-start gap-2 text-[15px]">
			<input type="checkbox" bind:checked={autoShow} class="mt-1 size-4 accent-black" />
			Show new doodles on my screen automatically
		</label>
		{#if !canSend}
			<p class="mt-1 text-[14px] text-black/60">Connect your board to receive doodles.</p>
		{/if}

		<h3 class="mt-4 font-karma text-[20px] font-bold">Latest doodles</h3>
		{#if doodles.isLoading}
			<p class="text-[14px] text-black/60">Loading…</p>
		{:else if !doodles.data?.length}
			<p class="text-[14px] text-black/60">None yet. Share your link!</p>
		{:else}
			<ul class="mt-2 flex flex-col gap-3">
				{#each doodles.data as doodle (doodle._id)}
					<li class="flex items-center gap-3">
						<DoodleThumb
							pixels={doodle.pixels}
							label="Doodle from {doodle.from ?? 'someone'}"
							class="w-[128px] shrink-0 border border-black"
						/>
						<div class="min-w-0 flex-1 text-[14px]">
							<p class="truncate font-bold">{doodle.from ?? 'Someone'}</p>
							<p class="text-black/60">{timeAgo(doodle._creationTime)}</p>
							<button
								type="button"
								onclick={() => onShow(doodle.pixels, false)}
								disabled={!canSend}
								class="mt-1 rounded-md border-2 border-black bg-white px-2 py-0.5 hover:bg-daisy disabled:opacity-40"
							>
								Show
							</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</section>

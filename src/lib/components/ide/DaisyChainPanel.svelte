<script lang="ts">
	import { untrack } from 'svelte';
	import { useMutation, useQuery } from 'convex-svelte';
	import type { FunctionReturnType } from 'convex/server';
	import { ConvexError } from 'convex/values';
	import { renderSVG } from 'uqr';
	import { api } from '../../../convex/_generated/api.js';
	import DoodleThumb from '#lib/components/doodle/DoodleThumb.svelte';

	type Doodle = FunctionReturnType<typeof api.doodles.latest>[number];

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
	const OWNER_KEY_STORAGE = 'daisychain:clip-owner-key';
	let slug = $state(loadSlug());
	// Secret that proves this browser owns the hairclip, so only you can delete its doodles.
	const ownerKey = loadOwnerKey();
	let autoShow = $state(true);
	let copied = $state(false);
	let creating = $state(false);
	let error = $state('');

	const createClip = useMutation(api.clips.create);
	const removeDoodle = useMutation(api.doodles.remove);
	const doodles = useQuery(api.doodles.latest, () => (slug ? { slug } : 'skip'));

	const link = $derived(slug ? `${location.origin}/to/${slug}` : '');
	const qrSvg = $derived(link ? renderSVG(link, { border: 1 }) : '');

	// Flipping through doodles: newest first. Remember which one is showing by its id,
	// so it stays put when a new doodle arrives or another one is deleted.
	const list = $derived(doodles.data ?? []);
	let selectedId = $state<Doodle['_id'] | null>(null);
	const index = $derived(
		Math.max(
			0,
			list.findIndex((d) => d._id === selectedId)
		)
	);
	const current = $derived<Doodle | undefined>(list[index]);
	let deleting = $state(false);
	let deleteError = $state('');

	function loadSlug() {
		try {
			return localStorage.getItem(STORAGE_KEY);
		} catch {
			return null;
		}
	}

	function loadOwnerKey() {
		const fresh = crypto.randomUUID();
		try {
			const saved = localStorage.getItem(OWNER_KEY_STORAGE);
			if (saved) return saved;
			localStorage.setItem(OWNER_KEY_STORAGE, fresh);
		} catch {
			// Storage blocked: the key only lasts for this visit.
		}
		return fresh;
	}

	const newer = () => (selectedId = list[index - 1]?._id ?? selectedId);
	const older = () => (selectedId = list[index + 1]?._id ?? selectedId);

	async function deleteCurrent() {
		const doodle = current;
		if (!doodle) return;
		if (!confirm(`Delete this doodle from ${doodle.from ?? 'someone'}? This can’t be undone.`)) {
			return;
		}
		// Afterwards, show the next older doodle (or the newer one if this was the oldest).
		selectedId = (list[index + 1] ?? list[index - 1])?._id ?? null;
		deleting = true;
		deleteError = '';
		try {
			await removeDoodle({ id: doodle._id, ownerKey });
		} catch (e) {
			selectedId = doodle._id;
			deleteError =
				e instanceof ConvexError ? String(e.data) : 'Couldn’t delete that doodle. Try again!';
		} finally {
			deleting = false;
		}
	}

	async function getLink() {
		creating = true;
		error = '';
		try {
			slug = await createClip({ ownerKey });
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

	// When a new doodle arrives, flip to it, mention it and (if allowed) show it on the board.
	// Doodles that were already there when the page opened aren't replayed.
	let seen: Set<string> | null = null;
	$effect(() => {
		const latest = doodles.data;
		if (!latest) return;
		untrack(() => {
			if (!seen) {
				seen = new Set(latest.map((d) => d._id));
				return;
			}
			const fresh = latest.filter((d) => !seen!.has(d._id));
			if (!fresh.length) return;
			fresh.forEach((d) => seen!.add(d._id));
			const newest = fresh[0];
			selectedId = newest._id;
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
		{:else if !current}
			<p class="text-[14px] text-black/60">None yet. Share your link!</p>
		{:else}
			<div class="mt-2">
				<DoodleThumb
					pixels={current.pixels}
					label="Doodle from {current.from ?? 'someone'}"
					class="w-full border-2 border-black"
				/>

				<!-- Flip through: ◀ newer, ▶ older -->
				<div class="mt-2 flex items-center gap-2">
					<button
						type="button"
						onclick={newer}
						disabled={index === 0}
						aria-label="Newer doodle"
						class="shrink-0 rounded-md border-2 border-black bg-white px-3 py-1 text-[16px] hover:bg-daisy disabled:opacity-30"
					>
						◀
					</button>
					<div class="min-w-0 flex-1 text-center text-[14px]" aria-live="polite">
						<p class="truncate font-bold">{current.from ?? 'Someone'}</p>
						<p class="text-black/60">
							{timeAgo(current._creationTime)} · {index + 1} of {list.length}
						</p>
					</div>
					<button
						type="button"
						onclick={older}
						disabled={index === list.length - 1}
						aria-label="Older doodle"
						class="shrink-0 rounded-md border-2 border-black bg-white px-3 py-1 text-[16px] hover:bg-daisy disabled:opacity-30"
					>
						▶
					</button>
				</div>

				<div class="mt-2 flex flex-wrap gap-2 text-[15px]">
					<button
						type="button"
						onclick={() => onShow(current.pixels, false)}
						disabled={!canSend}
						class="flex-1 rounded-md border-2 border-black bg-daisy px-2 py-1 font-bold whitespace-nowrap hover:brightness-95 disabled:opacity-40"
					>
						Show on screen
					</button>
					<button
						type="button"
						onclick={deleteCurrent}
						disabled={deleting}
						class="flex-1 rounded-md border-2 border-black bg-white px-2 py-1 whitespace-nowrap text-red-700 hover:bg-red-50 disabled:opacity-40"
					>
						{deleting ? 'Deleting…' : 'Delete'}
					</button>
				</div>
				{#if deleteError}
					<p class="mt-2 text-[14px] text-red-700" role="alert">{deleteError}</p>
				{/if}
			</div>
		{/if}
	{/if}
</section>

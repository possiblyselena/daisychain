<script lang="ts" module>
	export type Reel = {
		/** Instagram reel ID: the part after /reel/ in the link. */
		id: string;
		/** Creator's Instagram handle, without the @. */
		handle: string;
		/** Thumbnail image (9:16). */
		thumb: string;
	};
</script>

<script lang="ts">
	type Props = {
		reels: Reel[];
		label?: string;
		/** Seconds each card takes to scroll past; higher is slower. */
		secondsPerCard?: number;
	};

	let { reels, label = 'Creator videos', secondsPerCard = 7 }: Props = $props();

	const reelUrl = (id: string) => `https://www.instagram.com/reel/${id}/`;
</script>

<!--
	An endless, auto-scrolling row. The list is rendered twice and the track slides left by
	exactly one copy, so the loop is seamless. It pauses on hover or keyboard focus, and turns
	into a normal swipeable row for people who prefer reduced motion.
-->
<div class="marquee" role="region" aria-label={label}>
	<div class="track" style="--duration: {reels.length * secondsPerCard}s">
		{#each [0, 1] as copy (copy)}
			<ul
				class="flex shrink-0 {copy === 1 ? 'motion-reduce:hidden' : ''}"
				aria-hidden={copy === 1 ? 'true' : undefined}
			>
				{#each reels as reel (reel.id)}
					<li class="shrink-0 pr-6 md:pr-[47px]">
						<a
							href={reelUrl(reel.id)}
							target="_blank"
							rel="noopener noreferrer"
							tabindex={copy === 1 ? -1 : undefined}
							aria-label="Watch @{reel.handle}'s hairclip on Instagram"
							class="group block w-[180px] md:w-[259px]"
						>
							<div class="relative aspect-[9/16] overflow-hidden bg-black/5">
								<img
									src={reel.thumb}
									alt=""
									width="540"
									height="960"
									loading="lazy"
									class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								<span
									class="absolute top-1/2 left-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-[22px] text-white opacity-80 transition-opacity group-hover:opacity-100"
									aria-hidden="true"
								>
									▶
								</span>
							</div>
							<p class="mt-2 font-inter text-[16px] group-hover:underline md:text-[18px]">
								@{reel.handle}
							</p>
						</a>
					</li>
				{/each}
			</ul>
		{/each}
	</div>
</div>

<style>
	.marquee {
		overflow: hidden;
		/* Soften the edges so cards fade in and out instead of being cut off. */
		mask-image: linear-gradient(to right, transparent, black 4%, black 96%, transparent);
	}

	.track {
		display: flex;
		width: max-content;
		animation: marquee var(--duration) linear infinite;
	}

	.marquee:hover .track,
	.marquee:focus-within .track {
		animation-play-state: paused;
	}

	@keyframes marquee {
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee {
			overflow-x: auto;
			mask-image: none;
		}

		.track {
			animation: none;
		}
	}
</style>

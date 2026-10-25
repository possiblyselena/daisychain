<script lang="ts">
	import heroPcb from '#lib/assets/landing/hero-pcb.png';
	import esp32Board from '#lib/assets/parts/esp32-c3-devboard.webp';
	import sensorBoard from '#lib/assets/landing/sensor-board.png';
	import oled from '#lib/assets/landing/oled.png';
	import selena from '#lib/assets/landing/selena.png';
	import footerBg from '#lib/assets/landing/footer.svg';
	import pcbModel from '#lib/assets/models/daisychain.glb?url';
	import PcbViewer from '#lib/components/PcbViewer.svelte';
	import ReelCarousel, { type Reel } from '#lib/components/ReelCarousel.svelte';
	import mewtru from '#lib/assets/creators/mewtru.webp';
	import zoeylix from '#lib/assets/creators/zoeylix.webp';
	import sagecadence from '#lib/assets/creators/sagecadence.webp';
	import tinahelloworld from '#lib/assets/creators/tinahelloworld.webp';
	import meshtimes from '#lib/assets/creators/meshtimes.webp';
	import littlebitaisha from '#lib/assets/creators/littlebitaisha.webp';

	// Where the "Get Started Here." button goes.
	const getStartedHref = '/get-started';

	type Part = {
		name: string;
		blurb: string;
		src: string;
		// Desktop positions match the Figma layout; on phones the parts sit in a row.
		class: string;
		// Keeps the tooltip on screen on narrow viewports.
		tipClass: string;
	};

	const parts: Part[] = [
		{
			name: 'ESP32-C3 microcontroller',
			blurb: 'The brain of your hairclip. It runs your code and talks to the screen and sensors.',
			src: esp32Board,
			class: 'md:absolute md:left-[111px] md:top-0 md:h-[120px] md:w-[161px]',
			tipClass: 'left-0 md:left-1/2 md:-translate-x-1/2'
		},
		{
			name: 'Motion sensor',
			blurb: 'Senses tilt and movement, so your clip can react when you nod or shake your head.',
			src: sensorBoard,
			class: 'md:absolute md:left-0 md:top-[106px] md:h-[129px] md:w-[140px]',
			tipClass: 'left-1/2 -translate-x-1/2'
		},
		{
			name: 'OLED screen',
			blurb: 'A tiny 128×64 display for text, animations, and pixel art.',
			src: oled,
			class: 'md:absolute md:left-[305px] md:top-[87px] md:size-[190px]',
			tipClass: 'right-0 md:right-auto md:left-1/2 md:-translate-x-1/2'
		}
	];

	// Instagram reels from creators who built their own hairclips.
	// `id` is the part after /reel/ in the link; thumbnails live in src/lib/assets/creators.
	const creatorReels: Reel[] = [
		{ id: 'DdFNvpARXFX', handle: 'mewtru', thumb: mewtru },
		{ id: 'Dd4etFMRgWp', handle: 'zoeylix', thumb: zoeylix },
		{ id: 'DeJ8u0ZTpNZ', handle: 'sagecadence_', thumb: sagecadence },
		{ id: 'Defm9bXhpdV', handle: 'tinahelloworld', thumb: tinahelloworld },
		{ id: 'DdcJwrEtD6B', handle: 'meshtimes', thumb: meshtimes },
		{ id: 'Dej_VvGtXQv', handle: 'littlebitaisha', thumb: littlebitaisha }
	];
</script>

<svelte:head>
	<title>Daisy Chain</title>
</svelte:head>

<main class="mx-auto max-w-[1280px] px-4 md:px-[47px]">
	<!-- Hero: fills the first screen, like the Figma frame (1280×832). -->
	<section
		class="flex min-h-[calc(100svh-75px)] flex-col items-center justify-center py-[clamp(24px,6svh,80px)]"
	>
		<h1 class="text-center text-[24px] leading-tight font-medium md:text-[40px] md:leading-normal">
			Learn how to Design + Program a Hardware Hairclip
		</h1>
		<!--
			The board shrinks to fit short screens: its width is capped by the space left after
			the navbar, heading and button (463px on desktop), times the board's aspect ratio.
		-->
		<PcbViewer
			src={pcbModel}
			poster={heroPcb}
			posterSize={{ width: 1022, height: 606 }}
			posterCrop={{ x: 27, y: 109, width: 963, height: 413 }}
			alt="The Daisy Chain hairclip circuit board, with an OLED screen and the words Daisy Chain in pixel lettering"
			class="my-[clamp(16px,4svh,40px)] aspect-[963/413] w-[min(872px,100%,max(280px,calc((100svh_-_463px)_*_2.33)))]"
		/>
		<a href={getStartedHref} class="text-[48px] leading-tight md:text-[78.654px] md:leading-normal">
			Get Started Here.
		</a>
	</section>

	<!-- What is a hardware hairclip -->
	<section
		id="what-is-it"
		class="mt-14 grid scroll-mt-24 gap-8 md:mt-[59px] md:grid-cols-[minmax(0,1fr)_530px] md:pl-[11px]"
	>
		<div>
			<h2 class="text-[32px] md:text-[45.162px]">what is a hardware hairclip?</h2>
			<p
				class="mt-2 max-w-[529px] font-inter text-[20px] leading-normal md:ml-[10px] md:text-[30.042px]"
			>
				It’s a wearable electronic hairclip! You can customize however you want with different
				displays and sensors. Hover the ones on the right to learn more what they do :]
			</p>
		</div>

		<!-- Hoverable parts -->
		<ul
			class="flex items-center justify-center gap-4 md:relative md:mt-[17px] md:block md:h-[235px] md:w-[495px]"
		>
			{#each parts as part (part.name)}
				<li class="group relative h-[96px] w-[110px] {part.class}">
					<button
						type="button"
						class="block size-full cursor-help rounded-md transition-transform duration-150 group-hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-black"
						aria-describedby="tip-{part.name}"
					>
						<img src={part.src} alt={part.name} class="pointer-events-none size-full object-contain" />
					</button>
					<div
						id="tip-{part.name}"
						role="tooltip"
						class="pointer-events-none invisible absolute bottom-full z-10 mb-2 w-56 rounded-md {part.tipClass} md:w-60 border-2 border-black bg-daisy px-3 py-2 font-inter text-[15px] leading-snug opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
					>
						<strong class="block font-karma text-[18px]">{part.name}</strong>
						{part.blurb}
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Creator examples -->
	<section class="mt-16 md:mt-[65px]">
		<h2 class="text-[28px] md:pl-[10px] md:text-[43.565px]">
			Here’s some examples of creators who have made their own!
		</h2>
		<div class="mt-6 md:mt-[29px]">
			<ReelCarousel reels={creatorReels} label="Hairclips made by other creators" />
		</div>
	</section>

	<!-- About -->
	<section id="about" class="mt-16 scroll-mt-24 pb-14 md:mt-[76px] md:pb-[53px] md:pl-[11px]">
		<h2 class="text-[28px] md:pl-[10px] md:text-[39.697px]">who made this cool &amp; awesome tool?</h2>
		<div class="mt-6 flex flex-col gap-8 md:mt-[29px] md:flex-row md:gap-[70px]">
			<img
				src={selena}
				alt="Selena on stage giving a talk, with a slide behind her that says Hi I'm Selena!"
				width="446"
				height="357"
				class="aspect-[446/357] w-full shrink-0 object-cover md:w-[446px]"
			/>
			<p class="font-inter text-[20px] leading-normal md:mt-[23px] md:max-w-[667px] md:text-[34.066px]">
				hello I’m selena and I’m currently a gap year at Hack Club! my job is to get more teens
				into making cool technical projects and daisy chain was built to achieve this. firmware is
				really freaking hard - especially once you’re starting out and hopefully this tool makes it
				a bit easier.
			</p>
		</div>
	</section>
</main>

<!-- Footer -->
<footer class="relative h-[71px]">
	<img src={footerBg} alt="" width="1280" height="71" class="absolute inset-0 block size-full" />
	<p
		class="relative mx-auto flex h-full max-w-[1280px] items-center px-4 text-[26px] font-bold md:px-[10px] md:text-[41.214px]"
	>
		this project is <a href="https://github.com/possiblyselena/daisychain" class="px-3 underline"> open-source </a>  (please make it better!)
	</p>
</footer>

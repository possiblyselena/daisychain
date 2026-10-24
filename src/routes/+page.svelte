<script lang="ts">
	import heroPcb from '#lib/assets/landing/hero-pcb.png';
	import esp32Board from '#lib/assets/landing/esp32-board.png';
	import sensorBoard from '#lib/assets/landing/sensor-board.png';
	import oled from '#lib/assets/landing/oled.png';
	import creatorExample from '#lib/assets/landing/creator-example.png';
	import selena from '#lib/assets/landing/selena.png';
	import footerBg from '#lib/assets/landing/footer.svg';
	import pcbModel from '#lib/assets/models/daisychain.glb?url';
	import PcbViewer from '#lib/components/PcbViewer.svelte';

	// Where the "Get Started" links go. Point this at the IDE route once it exists.
	const getStartedHref = '#what-is-it';

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
			name: 'ESP32 microcontroller',
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

	// Placeholder creator posts from the design (all the same image for now).
	const creators = Array.from({ length: 4 }, (_, i) => ({
		src: creatorExample,
		alt: `Creator example ${i + 1}: a hand holding a magic 8 ball hairclip with a round screen`
	}));
</script>

<svelte:head>
	<title>Daisy Chain</title>
</svelte:head>

<div class="min-h-screen bg-white font-karma text-black">
	<!-- Navbar -->
	<header class="sticky top-0 z-20 border-2 border-black bg-daisy">
		<nav
			class="mx-auto flex h-[71px] max-w-[1280px] items-center justify-between gap-4 px-4 text-[20px] font-bold md:px-[19px] md:text-[35px]"
		>
			<a href="/" class="whitespace-nowrap">Daisy Chain</a>
			<div class="flex gap-4 md:gap-[66px]">
				<a href={getStartedHref} class="whitespace-nowrap hover:underline">Get Started</a>
				<a href="#about" class="whitespace-nowrap hover:underline">About</a>
			</div>
		</nav>
	</header>

	<main class="mx-auto max-w-[1280px] px-4 md:px-[47px]">
		<!-- Hero -->
		<section class="flex flex-col items-center pt-12 md:pt-[71px]">
			<h1
				class="w-full text-center text-[32px] leading-tight font-medium md:text-left md:text-[52.667px] md:leading-normal"
			>
				Learn how to Design + Program a Hardware Hairclip
			</h1>
			<PcbViewer
				src={pcbModel}
				poster={heroPcb}
				alt="The Daisy Chain hairclip circuit board, with an OLED screen and the words Daisy Chain in pixel lettering"
				class="-mt-4 aspect-[925/549] w-full max-w-[925px] md:-mt-[22px]"
			/>
			<a
				href={getStartedHref}
				class="-mt-4 text-[48px] leading-normal md:-mt-[37px] md:text-[78.654px]"
			>
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
							<img src={part.src} alt={part.name} class="pointer-events-none size-full object-cover" />
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
			<ul class="mt-6 grid grid-cols-2 gap-4 md:mt-[29px] md:grid-cols-4 md:gap-[47px]">
				{#each creators as creator, i (i)}
					<li>
						<img
							src={creator.src}
							alt={creator.alt}
							width="259"
							height="466"
							class="aspect-[259/466] w-full object-cover"
						/>
					</li>
				{/each}
			</ul>
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
			this project is open-source!
		</p>
	</footer>
</div>

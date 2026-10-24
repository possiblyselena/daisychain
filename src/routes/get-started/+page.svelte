<script lang="ts">
	// "Get Started" page from the Figma "Wiring and Schematic" frame.
	// The per-component guides (IMU, distance sensor, microphone) aren't built yet.
	import WiringDiagram from '#lib/components/schematic/WiringDiagram.svelte';
	import devboard from '#lib/assets/parts/esp32-c3-devboard.webp';
	import display from '#lib/assets/landing/oled.png';
	import imu from '#lib/assets/landing/sensor-board.png';
	import distanceSensor from '#lib/assets/parts/distance-sensor.png';

	type Component = {
		name: string;
		image?: { src: string; alt: string; class: string };
		/** Extra classes, e.g. to stagger the row like the design. */
		class?: string;
	};

	const otherComponents: Component[] = [
		{
			name: 'IMU',
			image: { src: imu, alt: 'IMU motion sensor board', class: 'h-[211px] w-[229px]' }
		},
		{
			name: 'Distance Sensor',
			image: {
				src: distanceSensor,
				alt: 'Ultrasonic distance sensor board',
				class: 'size-[240px] md:size-[299px]'
			},
			class: 'md:mt-[61px]'
		},
		{ name: 'Microphone', class: 'md:mt-[10px]' }
	];

	// Which component's "coming soon" note is showing.
	let opened = $state<string | null>(null);
</script>

<svelte:head>
	<title>Get Started · Daisy Chain</title>
</svelte:head>

<main class="mx-auto max-w-[1280px] px-4 pb-20 md:px-[37px] md:pb-[120px]">
	<h1
		class="pt-10 text-[32px] leading-tight font-medium md:pt-[55px] md:text-[52.667px] md:leading-normal"
	>
		Getting Started with your Schematic
	</h1>

	<!-- Your two main parts -->
	<section aria-label="Your parts" class="mt-10 grid gap-12 md:mt-[4px] md:grid-cols-2 md:gap-8">
		<figure class="flex flex-col items-center justify-end">
			<img
				src={devboard}
				alt="ESP32-C3 dev board with an ESP32-C3-MINI-1 module, BOOT and EN buttons, and labelled pins"
				width="800"
				height="661"
				class="h-auto w-[300px] object-contain md:w-[400px]"
			/>
			<figcaption class="mt-6 font-inter text-[28px] md:mt-[55px] md:text-[52px]">
				this is your devboard!
			</figcaption>
		</figure>
		<figure class="flex flex-col items-center justify-end">
			<img
				src={display}
				alt="OLED display module"
				width="407"
				height="407"
				class="size-[280px] object-contain md:size-[407px]"
			/>
			<figcaption class="mt-6 font-inter text-[28px] md:mt-0 md:text-[52px]">
				this is your display!
			</figcaption>
		</figure>
	</section>

	<!-- Wiring -->
	<section class="mt-16 md:mt-[77px]">
		<h2
			class="text-center text-[28px] leading-tight font-medium md:text-[52.667px] md:leading-normal"
		>
			Here’s how the wiring works
		</h2>
		<div class="mt-8">
			<WiringDiagram />
		</div>
	</section>

	<!-- Other components -->
	<section class="mt-16 md:mt-[60px]">
		<h2 class="text-[28px] leading-tight font-medium md:text-[52.667px] md:leading-normal">
			Want to know how wiring other components works?
		</h2>
		<p class="mt-2 text-right text-[24px] font-medium md:mt-0 md:text-[52.667px]">
			Click them to learn more!
		</p>

		<ul class="mt-10 grid items-start gap-12 sm:grid-cols-3 md:mt-[30px]">
			{#each otherComponents as part (part.name)}
				<li class="flex justify-center {part.class ?? ''}">
					<button
						type="button"
						onclick={() => (opened = opened === part.name ? null : part.name)}
						aria-expanded={opened === part.name}
						class="group flex flex-col items-center rounded-lg p-2 focus-visible:outline-2 focus-visible:outline-black"
					>
						{#if part.image}
							<img
								src={part.image.src}
								alt={part.image.alt}
								class="object-contain transition-transform duration-150 group-hover:scale-105 {part
									.image.class}"
							/>
						{:else}
							<span
								class="grid h-[211px] w-[229px] place-items-center rounded-lg border-2 border-dashed border-black/30 font-inter text-[18px] text-black/50"
							>
								photo coming soon
							</span>
						{/if}
						<span
							class="mt-2 text-[32px] font-medium whitespace-nowrap group-hover:underline md:text-[52.667px]"
						>
							{part.name}
						</span>
						{#if opened === part.name}
							<span
								role="status"
								class="mt-2 rounded-md border-2 border-black bg-daisy px-3 py-1 font-inter text-[16px]"
							>
								Wiring guide coming soon!
							</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Next step -->
	<div class="mt-16 flex justify-center md:mt-[80px]">
		<a
			href="/ide"
			class="rounded-md border-2 border-black bg-daisy px-6 py-3 text-[28px] font-bold hover:brightness-95 md:text-[40px]"
		>
			Start coding your firmware →
		</a>
	</div>
</main>

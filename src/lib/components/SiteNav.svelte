<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/get-started', label: 'Get Started' },
		{ href: '/ide', label: 'Firmware' },
		{ href: '/#about', label: 'About' }
	];
</script>

<header class="sticky top-0 z-20 border-2 border-black bg-daisy">
	<nav
		class="mx-auto flex h-[71px] max-w-[1280px] items-center justify-between gap-3 px-3 text-[16px] font-bold sm:gap-4 sm:px-4 sm:text-[20px] md:px-[19px] md:text-[28px] lg:text-[35px]"
	>
		<a href="/" class="whitespace-nowrap">Daisy Chain</a>
		<div class="flex gap-3 sm:gap-4 md:gap-[48px] lg:gap-[66px]">
			{#each links as link (link.href)}
				<a
					href={link.href}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}
					class="whitespace-nowrap hover:underline aria-[current=page]:underline"
				>
					{link.label}
				</a>
			{/each}
		</div>
	</nav>
</header>

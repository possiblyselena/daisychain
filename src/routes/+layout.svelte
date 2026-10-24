<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import SiteNav from '#lib/components/SiteNav.svelte';
	import { setupConvex } from 'convex-svelte';
	import { PUBLIC_CONVEX_URL } from '$app/env/public';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Connect every page to the Convex backend (URL comes from .env.local).
	setupConvex(PUBLIC_CONVEX_URL);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Karma:wght@400;500;700&display=swap"
	/>
</svelte:head>

<div class="min-h-screen bg-white font-karma text-black">
	<SiteNav />
	{@render children()}
</div>

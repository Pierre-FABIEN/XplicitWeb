<script lang="ts">
	import '../app.css';

	import { initializeLayoutState, setupNavigationEffect, isClient } from './layout.svelte';

	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$shadcn/sonner';

	import SmoothScrollBar from '$lib/components/smoothScrollBar/SmoothScrollBar.svelte';
	import {
		firstLoadComplete,
		setFirstOpen,
		setRessourceToValide
	} from '$lib/store/initialLoaderStore';
	import Loader from '$lib/components/loader/Loader.svelte';
	import { page } from '$app/stores';
	import NavigationMenu from '$lib/components/navigation/NavigationMenu.svelte';
	import Breadcrumb from '$lib/components/navigation/Breadcrumb.svelte';
	import Cart from '$lib/components/cart/Cart.svelte';
	import { setCart } from '$lib/store/Data/cartStore';
	import { startSync } from '$lib/store/Data/cartSync';
	import { da } from '@faker-js/faker';
	import Threltre from '$lib/components/threlte/Threltre.svelte';

	let { children, data } = $props();

	$effect(() => {
		const unsubscribe = page.subscribe((currentPage) => {
			initializeLayoutState(currentPage);
		});
		setupNavigationEffect();

		setFirstOpen(true);
		setRessourceToValide(true);

		const items = data.pendingOrder;
		if (items) {
			setCart(items.id, items.userId, items.items, items.total);
		}
		startSync();

		return unsubscribe;
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
	<meta name="viewport" content="width=device-width" />
	<link rel="manifest" href="/pwa/manifest.webmanifest" />
	<meta name="theme-color" content="#4285f4" />
</svelte:head>

{#if !$firstLoadComplete}
	<!-- <Loader /> -->
{/if}
{#if $isClient}
	<div class="wappper">
		<ModeWatcher />

		<div class="container">
			<Cart {data} />
			<div class="iconeNav flex justify-end place-items-center px-5 py-2">
				<Breadcrumb />
				<NavigationMenu />
			</div>
			<SmoothScrollBar>
				<main class="mainLayout">
					<!-- Threltre avec texture dynamique -->
					<div class="canva">
						<Threltre />
					</div>
					<div class="content">
						{@render children()}
					</div>
				</main>
			</SmoothScrollBar>
		</div>
		<Toaster />
	</div>
{/if}

<style lang="scss" global>
	.container {
		width: 100%;
		padding: 0;
		margin: 0;
		max-width: none;
		overflow: hidden;
	}

	.mainLayout {
		max-width: 100vw;
		overflow: hidden;
	}

	.iconeNav {
		position: absolute;
		z-index: 100;
		background-color: rgba(0, 0, 0, 0.75);
		border-top-left-radius: 5px;
		right: 0%;
		bottom: 0px;
	}
	.canva {
		position: absolute;
		width: 100vw;
		height: 100vh;
		z-index: 1;
	}

	.content {
		position: absolute;
		z-index: 10;
	}
</style>

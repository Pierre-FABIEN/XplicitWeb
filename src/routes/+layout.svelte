<script lang="ts">
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/raleway';
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
	import Threltre from '$lib/components/threlte/Threltre.svelte';
	import BackgroundCanvas from '$lib/components/BackgroundCanvas.svelte';
	import Options from '$lib/components/navigation/Options.svelte';

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
		<BackgroundCanvas />
		<ModeWatcher />

		<div class="container">
			<div class="iconeNav ccc">
				<nav
					class="bg-white/10 backdrop-blur-3xl shadow-xl border border-[#ffffff88] rounded-[16px] flex justify-end items-center p-2 space-x-4"
				>
					<ul class="rcs">
						<li class="ccc">
							<a href="/"> Accueil </a>
						</li>
						<li class="ccc">
							<a href="/atelier"> L'atelier </a>
						</li>
						<li class="ccc">
							<a href="/catalogue"> catalogue </a>
						</li>
						<li class="ccc">
							<a href="/blog"> Blog </a>
						</li>
						<li class="ccc">
							<a href="/blog"> Contact </a>
						</li>
					</ul>
					<Options />
					<Cart {data} />
					<!-- <Breadcrumb />
					<NavigationMenu /> -->
				</nav>
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
		bottom: 10px;
		width: 100%;

		nav {
			transition: all 0.3s ease;

			ul {
				li {
					a {
						display: flex;
						align-items: center;
						justify-content: center;
						border-radius: 16px;
						height: 40px;
						padding: 0px 20px;
						font-family: 'Open Sans Variable', sans-serif;
						text-transform: uppercase;
						margin: 0px 5px;
						font-weight: 600;
						transition: all 0.3s ease;
						background: white;
						color: black;

						&:hover {
							transform: translateY(-1px);
							background: rgba(255, 255, 255, 0.5);
						}
					}
				}
			}
			&:hover {
				transform: translateY(-5px);
				box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.3);
				background: rgba(255, 255, 255, 0.5);
			}
		}
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
		width: 100vw;
		height: 100vh;
	}

	.wrapper {
		transition: background-color 0.5s ease-in-out;
	}
</style>

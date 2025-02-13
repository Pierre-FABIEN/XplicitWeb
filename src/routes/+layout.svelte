<script lang="ts">
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/raleway';
	import '../app.css';

	import { initializeLayoutState, setupNavigationEffect, isClient } from './layout.svelte';

	import { ModeWatcher } from 'mode-watcher';
	import Toaster from '$lib/components/shadcn/ui/sonner/sonner.svelte';

	import SmoothScrollBar from '$lib/components/smoothScrollBar/SmoothScrollBar.svelte';
	import {
		firstLoadComplete,
		setFirstOpen,
		setRessourceToValide
	} from '$lib/store/initialLoaderStore';
	import Loader from '$lib/components/loader/Loader.svelte';
	import { page } from '$app/stores';
	import Cart from '$lib/components/cart/Cart.svelte';
	import { setCart } from '$lib/store/Data/cartStore';
	import { startSync } from '$lib/store/Data/cartSync';
	import Threltre from '$lib/components/threlte/Threltre.svelte';
	import BackgroundCanvas from '$lib/components/BackgroundCanvas.svelte';
	import Options from '$lib/components/navigation/Options.svelte';
	import SmoothScrollBarStore from '$lib/store/SmoothScrollBarStore';

	let { children, data } = $props();
	let cartInitialized = $state(false);
	$effect(() => {
		const unsubscribe = page.subscribe((currentPage) => {
			initializeLayoutState(currentPage);
		});
		setupNavigationEffect();

		console.log(data);

		setFirstOpen(true);
		setRessourceToValide(true);

		if (data.user === null) {
		} else {
			const items = data.pendingOrder;

			if (!cartInitialized) {
				setCart(items.id, items.userId, items.items, items.subtotal, items.tax, items.total);
				cartInitialized = true;
			}

			startSync();
		}

		return unsubscribe;
	});

	let contentRef: HTMLElement | null = $state(null);
	let contentHeight = $state(0);

	$effect(() => {
		if (!contentRef) return;

		const observer = new ResizeObserver(() => {
			if (contentRef) {contentHeight = contentRef.clientHeight;}
			
			updateSmoothScroll();
		});
		observer.observe(contentRef);

		return () => observer.disconnect();
	});

	function updateSmoothScroll() {
		let scrollbarInstance;
		SmoothScrollBarStore.update((state) => {
			scrollbarInstance = state.smoothScroll;
			return state;
		});

		if (scrollbarInstance) {
			scrollbarInstance.update();
		}
	}
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

		<div class="container ccc">
			<div class="iconeNav ccc">
				<nav
					class="backdrop-blur-3xl shadow-xl border border-[#ffffff88] rounded-[16px] flex justify-end items-center p-2 space-x-4"
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
							<a href="/contact"> Contact </a>
						</li>
					</ul>
					<Options />
					<Cart {data} />
					<!-- <Breadcrumb />
					<NavigationMenu /> -->
				</nav>
			</div>
			<div class="wrapperScroll">
				<SmoothScrollBar>
					<main class="mainLayout">
						<!-- Threltre avec texture dynamique -->
						<div class="canva">
							<Threltre />
						</div>
						<div class="content ccc" bind:this={contentRef}>
							{@render children()}
						</div>
					</main>
				</SmoothScrollBar>
			</div>
		</div>
		<Toaster />
	</div>
{/if}

<style lang="scss">
	.container {
		width: 100vw;
		height: 100vh;
		padding: 0;
		margin: 0;
		max-width: none;
		overflow: hidden;
		position: relative;
	}

	.mainLayout {
		max-width: 100vw;
		overflow: hidden;
	}

	.wrapperScroll {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
	}

	.iconeNav {
		position: absolute;
		z-index: 10;
		bottom: 10px;
		width: 100%;
		max-width: 80vw;

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
						font-family: 'Raleway Variable', sans-serif;

						margin: 0px 5px;

						transition: all 0.3s ease;
						font-weight: 500;
						//color: white;

						&:hover {
							transform: translateY(-1px);
							background: rgba(255, 255, 255, 0.1);
						}
					}
				}
			}
			&:hover {
				transform: translateY(-5px);
				box-shadow: 0px 8px 30px rgba(0, 0, 0, 0.3);
				background: rgba(255, 255, 255, 0.05);
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
		z-index: 1;
	}
</style>

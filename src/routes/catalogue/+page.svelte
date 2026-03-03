<script lang="ts">
	// --- Imports ---
	import '@fontsource-variable/raleway';
	import * as Card from '$shadcn/card/index.js';
	import * as Carousel from '$shadcn/carousel/index.js';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { textureStore } from '$lib/store/scene3DStore';
	import gsap from 'gsap';
	import DOMPurify from 'dompurify';
	import SEO from '$lib/components/SEO.svelte';

	// --- Svelte 5 Runes ---
	let { data } = $props();

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	/** Strip HTML tags for SSR / initial render (safe plain text). */
	function stripTags(html: string): string {
		return html.replace(/<[^>]*>/g, '').trim();
	}

	/** Sanitize HTML for safe display (client-only). */
	function sanitizeDescription(html: string): string {
		return typeof window !== 'undefined' ? DOMPurify.sanitize(html || '') : stripTags(html || '');
	}

	// This $state boolean will ensure our GSAP animation only runs once
	let hasAnimated = $state(false);

	/**
	 * @effect
	 * @description This effect runs once the component is mounted, then triggers the GSAP stagger animation on all cards.
	 */
	$effect(() => {
		// If the animation is already done, do nothing
		if (hasAnimated) return;

		// Once the effect is triggered, set hasAnimated to true
		hasAnimated = true;

		// Select all cards with the `.cardStagger` class
		const cards = document.querySelectorAll('.cardStagger');

		// Apply a GSAP "from" animation with stagger
		gsap.from(cards, {
			y: -30,
			duration: 0.25,
			stagger: 0.15,
			ease: 'power2.out'
		});
	});
</script>

<!-- SEO pour la page catalogue -->
<SEO pageKey="catalogue" />

<!-- 
  The carousel is wrapped in a parent div that uses the "fly" transition.
  We also add a .cardStagger class to each Card.Root for GSAP to target.
-->
<div class="w-[100vw] min-h-[320px] absolute left-0 top-0 ccc overflow-visible">
	<div transition:fly={{ y: -300, duration: 600 }} class="w-[100vw] min-h-[320px] ccc overflow-visible">
		<Carousel.Root
			opts={{
				align: 'start'
			}}
			orientation="horizontal"
			class="w-[100%] ccc wrapperCarousel overflow-visible"
		>
			<Carousel.Content class="w-[100vw] min-h-[320px]">
				{#each data.Products as product (product.id)}
					<Carousel.Item class="p-5 md:basis-[400px]">
						<Card.Root
							class="cardStagger bg-[#171717] border border-[#ffffff88] rounded-[16px] flex justify-end items-center p-2 space-x-4"
							style="border-color: {product.colorProduct}"
							onmouseenter={() => textureStore.set(product.images[0])}
						>
							<Card.Content
								class="flex flex-col items-center justify-center space-y-3 ccs"
							>
								<h3
									class="titleHome text-xl font-semibold"
									style="-webkit-text-stroke: 1px {product.colorProduct}"
								>
									{product.name}
								</h3>

								{#if product.description}
									<div class="product-description text-sm text-left text-white/90">
										{#if mounted}
											{@html sanitizeDescription(product.description)}
										{:else}
											{stripTags(product.description)}
										{/if}
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>
	</div>
</div>

<style lang="scss">
	.titleHome {
		text-align: center;
		font-family: 'Open Sans Variable', sans-serif;
		font-style: italic;
		text-align: left;
		font-size: 50px;
		margin-bottom: 12px;
		-webkit-text-stroke: 1px black;
		color: transparent;
		text-transform: uppercase;
		font-weight: 900;
	}

	p {
		font-family: 'Raleway Variable', sans-serif;
	}

	.product-description {
		font-family: 'Raleway Variable', sans-serif;
		line-height: 1.4;
		max-width: 100%;
		padding: 0 0.5rem;
	}

	.product-description :global(p),
	.product-description :global(ul),
	.product-description :global(ol) {
		margin: 0.25em 0;
	}
</style>
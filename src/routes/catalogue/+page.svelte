<script lang="ts">
	// --- Imports ---
	import '@fontsource-variable/raleway';
	import * as Card from '$shadcn/card/index.js';
	import * as Carousel from '$shadcn/carousel/index.js';
	import Button from '$lib/components/shadcn/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
	import { textureStore } from '$lib/store/textureStore';
	import { addToCart } from '$lib/store/Data/cartStore';
	import gsap from 'gsap'; // <-- Import GSAP

	// --- Svelte 5 Runes ---
	// Access props from the parent
	let { data } = $props();

	/**
	 * @function addCart
	 * @param {string} productId - The product ID to add to the cart
	 * @description Checks if user is logged in, then adds the product to the cart.
	 */
	function addCart(productId: string) {
		// If user is not logged in, show an error toast
		if (data.user === null) {
			toast.error('Veuillez vous connecter pour ajouter au panier.');
		} else {
			// Find the product by its ID
			const item = data.Products.find((product) => product.id === productId);
			if (!item) {
				console.error(`Produit introuvable pour l'id: ${productId}`);
				return;
			}
			// Create an item to add to the cart
			const result = {
				id: crypto.randomUUID(),
				quantity: 24,
				price: item.price,
				product: {
					id: item.id,
					name: item.name,
					price: item.price,
					images: item.images[0],
					stock: item.stock
				}
			};
			// Add the product to the cart
			addToCart(result);
			console.log('Produit ajouté au panier :', result);
		}
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
			opacity: 0,
			y: -30,
			duration: 0.25,
			stagger: 0.15,
			ease: 'power2.out'
		});
	});
</script>

<!-- 
  The carousel is wrapped in a parent div that uses the "fly" transition.
  We also add a .cardStagger class to each Card.Root for GSAP to target.
-->
<div class="w-[100vw] h-[300px] absolute left-0 top-0 ccc">
	<div transition:fly={{ y: -300, duration: 600 }} class="w-[100vw] h-[300px] ccc">
		<Carousel.Root
			opts={{
				align: 'start'
			}}
			orientation="horizontal"
			class="w-[100%] ccc wrapperCarousel"
		>
			<Carousel.Content class="w-[100vw] h-[300px]">
				{#each data.Products as product (product.id)}
					<Carousel.Item class="p-5 md:basis-[400px]">
						<Card.Root
							class="cardStagger bg-transparent backdrop-blur-2xl shadow-xl border border-[#ffffff88] rounded-[16px] flex justify-end items-center p-2 space-x-4"
							style="border-color: {product.colorProduct}"
							onmouseenter={() => textureStore.set(product.images[0])}
						>
							<Card.Content
								class="w-[400px] h-[200px] flex flex-col items-center justify-center p-6 space-y-4"
							>
								<h3
									class="titleHome text-xl font-semibold"
									style="-webkit-text-stroke: 2px {product.colorProduct}"
								>
									{product.name}
								</h3>

								<p class="text-sm text-left">
									{product.description}
								</p>

								<div class="rcb w-[100%]">
									<p class="text-lg font-medium text-indigo-600">
										{product.price} €
									</p>
									<Button onclick={() => addCart(product.id)}>Acheter</Button>
								</div>
							</Card.Content>
						</Card.Root>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>
	</div>
</div>

<style>
	.titleHome {
		text-align: center;
		font-family: 'Open Sans Variable', sans-serif;
		font-style: italic;
		text-align: left;
		font-size: 57px;
		margin-bottom: 12px;
		-webkit-text-stroke: 2px black;
		color: transparent;
		text-transform: uppercase;
		font-weight: 900;
		width: 100%;
	}

	p {
		font-family: 'Raleway Variable', sans-serif;
	}
</style>

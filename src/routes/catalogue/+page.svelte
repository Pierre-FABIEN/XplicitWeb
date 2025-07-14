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
	 * @param {number} quantity - The quantity of the product to add to the cart
	 * @description Checks if user is logged in, then adds the product to the cart.
	 */
	function addCart(productId: string, quantity: number) {
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
				quantity: quantity,
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
<div class="w-[100vw] h-[200px] absolute left-0 top-0 ccc">
	<div transition:fly={{ y: -300, duration: 600 }} class="w-[100vw] h-[200px] ccc">
		<Carousel.Root
			opts={{
				align: 'start'
			}}
			orientation="horizontal"
			class="w-[100%] ccc wrapperCarousel"
		>
			<Carousel.Content class="w-[100vw] h-[200px]">
				{#each data.Products as product (product.id)}
					<Carousel.Item class="p-5 md:basis-[400px]">
						<Card.Root
							class="cardStagger bg-[#171717] border border-[#ffffff88] rounded-[16px] flex justify-end items-center p-2 space-x-4"
							style="border-color: {product.colorProduct}"
							onmouseenter={() => textureStore.set(product.images[0])}
						>
							<Card.Content
								class=" h-[160px] flex flex-col items-center justify-center space-y-4 ccs"
							>
								<h3
									class="titleHome text-xl font-semibold"
									style="-webkit-text-stroke: 1px {product.colorProduct}"
								>
									{product.name}
								</h3>

								<!-- <p class="text-sm text-left">
									{product.description}
								</p> -->

								<div class="flex items-center justify-center gap-4">
									<div
										class="price ccc"
										onclick={() => addCart(product.id, 24)}
										onkeydown={(e) =>
											(e.key === 'Enter' || e.key === ' ') && addCart(product.id, 24)}
										role="button"
										tabindex="0"
									>
										<div class="price-number">
											{Math.floor(product.price * 24)}€
											<sup class="price-cents">
												{String(Math.round(((product.price * 24) % 1) * 100)).padStart(2, '0')}
											</sup>
											<span class="price-quantity">
												<sup>x</sup>24
											</span>
										</div>
									</div>
									<div
										class="price"
										onclick={() => addCart(product.id, 48)}
										onkeydown={(e) =>
											(e.key === 'Enter' || e.key === ' ') && addCart(product.id, 48)}
										role="button"
										tabindex="0"
									>
										<div class="price-number">
											{Math.floor(product.price * 48)}€
											<sup class="price-cents">
												{String(Math.round(((product.price * 48) % 1) * 100)).padStart(2, '0')}
											</sup>
											<span class="price-quantity">
												<sup>x</sup>48
											</span>
										</div>
									</div>
									<div
										class="price"
										onclick={() => addCart(product.id, 72)}
										onkeydown={(e) =>
											(e.key === 'Enter' || e.key === ' ') && addCart(product.id, 72)}
										role="button"
										tabindex="0"
									>
										<div class="price-number">
											{Math.floor(product.price * 72)}€
											<sup class="price-cents">
												{String(Math.round(((product.price * 72) % 1) * 100)).padStart(2, '0')}
											</sup>
											<span class="price-quantity">
												<sup>x</sup>72
											</span>
										</div>
									</div>
								</div>
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

	.price {
		cursor: pointer;
		position: relative;
		width: 100px;
		height: 60px;
		.price-number {
			position: absolute;
			color: white;
			text-decoration: none;
			transform: scale(1);
			transition: transform 0.5s ease-in-out;
			font-family: 'Open Sans Variable', sans-serif;
			font-style: italic;
			text-align: left;
			-webkit-text-stroke: 1px white;
			text-align: center;
			font-size: 30px;
			text-transform: black;
			font-weight: 900;
			color: black;
			z-index: 1;
			top: 15px;

			&:hover {
				transform: scale(1.2);

				sup {
					transform: scale(0.5);
				}
			}

			.price-quantity {
				font-size: 25px;
				position: absolute;
				left: 20px;
				top: -17px;
				transform: rotate(-10deg);
				z-index: -1;
				color: white;

				sup {
					font-size: 20px;
				}
			}

			.price-cents {
				left: -7px !important;
			}
		}
	}
</style>

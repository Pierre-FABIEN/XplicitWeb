<script lang="ts">
	import '@fontsource-variable/raleway';
	import * as Card from '$shadcn/card/index.js';
	import * as Carousel from '$shadcn/carousel/index.js';
	import { textureStore } from '$lib/store/textureStore';
	import Button from '$lib/components/shadcn/ui/button/button.svelte';
	import { addToCart } from '$lib/store/Data/cartStore';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	// Fonction pour ajouter un produit au panier
	const addCart = (productId: string) => {
		// Trouve le produit correspondant
		if (data.user === null) {
			toast.error('Veuillez vous connecter pour ajouter au panier.');
		} else {
			const item = data.Products.find((product) => product.id === productId);

			if (!item) {
				console.error(`Produit introuvable pour l'id: ${productId}`);
				return;
			}

			// Crée un objet structuré pour le panier
			const result = {
				id: crypto.randomUUID(), // Identifiant unique pour l'article
				quantity: 24, // Par défaut, ajoute 1 unité
				price: item.price,
				product: {
					id: item.id,
					name: item.name,
					price: item.price,
					images: item.images[0],
					stock: item.stock
				}
			};

			// Ajoute l'article au panier
			addToCart(result);
			console.log('Produit ajouté au panier :', result);
		}
	};
</script>

<div class="h-[100vh] absolute left-0 top-0 ccc">
	<div class="h-[100vh] ccc">
		<Carousel.Root
			opts={{
				align: 'start'
			}}
			orientation="vertical"
			class="w-[100%] ccc wrapperCarousel"
		>
			<Carousel.Content class="-mt-1 h-[100vh] py-10">
				{#each data.Products as product (product.id)}
					<Carousel.Item class="p-5 md:basis-[220px]">
						<Card.Root
							style="border-color: {product.colorProduct}"
							class="bg-transparent backdrop-blur-3xl shadow-xl border border-[#ffffff88] rounded-[16px] flex justify-end items-center p-2 space-x-4"
							onmouseenter={() => {
								textureStore.set(product.images[0]);
							}}
						>
							<Card.Content
								class="w-[400px] h-[200px] flex flex-col items-center justify-center p-6 space-y-4"
							>
								<!-- Nom du produit -->
								<h3
									style="-webkit-text-stroke: 2px {product.colorProduct}"
									class="titleHome text-xl font-semibold"
								>
									{product.name}
								</h3>

								<!-- Description -->
								<p class="text-sm text-left">
									{product.description}
								</p>

								<!-- Prix -->
								<div class="rcb w-[100%]">
									<p class="text-lg font-medium text-indigo-600">{product.price} €</p>

									<Button onclick={() => addCart(product.id)}>Acheter</Button>
								</div>
							</Card.Content>
						</Card.Root>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<Carousel.Previous
				style="		
				position: absolute;
				top: 45%;
				right: -50px;
				left: unset;
				transform: translateY(-50%) rotate(90deg);
				z-index: 1;
				"
			/>
			<Carousel.Next
				style="		
				position: absolute;
				bottom: 45%;
				right: -50px;
				left: unset;
				transform: translateY(-50%) rotate(90deg);
				z-index: 1;
				"
			/>
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

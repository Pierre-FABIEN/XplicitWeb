<script lang="ts">
	import { Button } from '$shadcn/button';
	import Threltre from '$lib/components/threlte/Threltre.svelte';
	import { addToCart } from '$lib/store/Data/cartStore'; // Fonction pour ajouter au panier

	// Exemple de données pour l'article
	const article = {
		id: '1',
		product: {
			id: '123',
			name: 'Super Widget',
			price: 29.99,
			images: ['/images/widget.jpg']
		},
		quantity: 1,
		price: 29.99
	};

	function handleAddToCart() {
		// Ajout de l'article au panierm
		addToCart(article);
		console.log('Article ajouté au panier :', article);
	}
</script>

<div class="h-screen w-screen">
	<Button onclick={handleAddToCart}>ajouter au panier</Button>
	<Threltre />
</div>

<script lang="ts">
	import { resetCart } from '$lib/store/Data/cartStore';

	// On reset le panier dès que la page est consultée
	$effect(() => {
		resetCart(); // Vide le panier et affiche un toast de succès
	});
</script>

<svelte:head>
	<title>Commande confirmée</title>
	<meta name="description" content="Merci pour votre commande. Votre panier a été réinitialisé." />
</svelte:head>

<div class="min-h-screen flex flex-col justify-center items-center text-center p-8">
	<h1 class="text-3xl font-bold mb-4">Merci pour votre commande !</h1>
	<p class="text-lg mb-6">
		Votre commande a bien été prise en compte. Un email de confirmation va vous être envoyé.
	</p>
	<a href="/" class="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition">
		Retour à l'accueil
	</a>
</div>

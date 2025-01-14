<script lang="ts">
	// Importations nécessaires
	import * as Select from '$shadcn/select/index.js';
	import Trash from 'lucide-svelte/icons/trash';

	import { cart, removeFromCart, updateCartItemQuantity } from '$lib/store/Data/cartStore';
	import Button from '$shadcn/button/button.svelte';

	import { loadStripe } from '@stripe/stripe-js';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { OrderSchema } from '$lib/schema/order/order.js';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/shadcn/ui/input/index.js';

	// Variables d'environnement
	const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

	// Gestion des états avec `$state`
	let stripe = $state(null);
	let selectedAddressId = $state<string | undefined>(undefined);

	let { data } = $props();

	let createPayment = superForm(data.IOrderSchema, {
		validators: zodClient(OrderSchema),
		id: 'createPayment',
		resetForm: true
	});

	// Déstructuration du formulaire
	const {
		form: createPaymentData,
		enhance: createPaymentEnhance,
		message: createPaymentMessage
	} = createPayment;

	// Charger Stripe à la montée du composant
	$effect(() => {
		(async () => {
			stripe = await loadStripe(stripePublishableKey);
		})();
	});

	// Gestion des événements pour le panier
	function handleRemoveFromCart(productId: string) {
		removeFromCart(productId);
	}

	function changeQuantity(productId: string, quantity: number) {
		updateCartItemQuantity(productId, quantity);
	}

	/**
	 * Valide la quantité saisie.
	 * Si elle dépasse les limites (min ou stock), elle est corrigée.
	 */
	function validateQuantity(item, event) {
		const inputElement = event.target as HTMLInputElement;
		let quantity = parseInt(inputElement.value, 10);

		// Correction automatique si la quantité dépasse les limites
		if (isNaN(quantity) || quantity < 1) {
			quantity = 1; // Valeur minimale autorisée
		} else if (quantity > item.product.stock) {
			quantity = item.product.stock; // Limite maximale (stock)
		}

		// Met à jour le champ et le store `cart`
		inputElement.value = String(quantity);
		changeQuantity(item.product.id, quantity);
	}

	function selectAddress(addressId: string) {
		selectedAddressId = addressId;
	}

	function handleCheckout() {
		if (!selectedAddressId) {
			toast.error('Veuillez choisir une adresse.');
		}
	}

	// Synchroniser les données du formulaire
	$effect(() => {
		console.log(createPaymentData, 'uhiuhuih');

		$createPaymentData.orderId = data.pendingOrder.id;

		if (selectedAddressId) {
			$createPaymentData.addressId = selectedAddressId;
		}
	});

	let quantityOptions = $state([
		{ label: '24 packs de 24 canettes (576 unités)', value: 576 },
		{ label: '1/4 de palette : 30 packs (720 unités)', value: 720 },
		{ label: '1/2 palette : 60 packs (1 440 unités)', value: 1440 },
		{ label: '1 palette : 120 packs (2 880 unités)', value: 2880 },
		{ label: '3 palettes : 360 packs (8 640 unités)', value: 8640 }
	]);

	$effect(() => {
		const allNonCustom = $cart.items.every((item) => !item.custom || item.custom.length === 0);

		if (allNonCustom) {
			console.log('Tous les articles sont non-custom.');
			// Appliquez le traitement spécifique ici
			// Exemple : ajuster le prix de livraison
			const livraisonBase = 10; // Prix de base de la livraison
			const livraisonReduction = 0.8; // Réduction de 20% si tous les articles sont non-custom
			const livraisonPrix = livraisonBase * livraisonReduction;

			console.log(`Prix de livraison ajusté : ${livraisonPrix}€`);
		} else {
			console.log('La commande contient des articles custom.');
			// Appliquez un traitement différent si nécessaire
		}
	});
</script>

<!-- Interface utilisateur -->
<div class="ccc w-screen h-screen">
	<div class="ctc w-[80vw]">
		<!-- Liste des adresses -->
		<div class="container mx-auto p-4 cart w-[100%]">
			<h2 class="text-2xl font-bold mb-4 mt-5">Vos adresses</h2>
			<div class="clc">
				{#if data?.addresses?.length > 0}
					{#each data.addresses as address}
						<button
							class="cursor-pointer border rounded p-2 m-2 min-w-[400px] rcb {selectedAddressId ===
							address.id
								? 'border-green-400'
								: ''}"
							onclick={() => selectAddress(address.id)}
						>
							<div class="clc">
								<p class="text-sm text-muted-foreground">Destinataire: {address.recipient}</p>
								<p class="text-sm text-muted-foreground">Rue: {address.street}</p>
								<p class="text-sm text-muted-foreground">Ville: {address.city}</p>
								<p class="text-sm text-muted-foreground">Code postal: {address.zip}</p>
								<p class="text-sm text-muted-foreground">Pays: {address.country}</p>
							</div>
						</button>
					{/each}
				{:else}
					<p class="text-gray-600">Aucune adresse présente.</p>
				{/if}
				<Button class="mt-4">
					<a data-sveltekit-preload-data href="/auth/settings/address">Créer une adresse</a>
				</Button>
			</div>
		</div>

		<!-- Panier -->
		<div class="container mx-auto p-4 cart w-[100%]">
			{#if $cart?.items?.length > 0}
				<div class="ccc max-h-[80vh]">
					{#each $cart.items as item (item.id)}
						<div class="p-4 border rounded-lg shadow-sm flex rcb w-[100%] mb-2">
							<img
								src={(item.custom?.length > 0 && item.custom[0].image) ||
									(Array.isArray(item.product.images)
										? item.product.images[0]
										: item.product.images) ||
									''}
								alt={item.product.name}
								class="w-20 h-20 object-cover mr-5"
							/>
							<div class="flex-1 clb">
								<h3 class="text-lg font-semibold">
									{item.product.name}
									{#if item.custom?.length > 0}
										<span class="text-sm font-normal text-gray-500">Custom</span>
									{/if}
								</h3>
								<p class="text-gray-600">${item.product.price.toFixed(1)}€</p>
								<div>
									{#if item.custom?.length > 0}
										<select
											class="border rounded px-3 py-2 w-full"
											onchange={(e) =>
												changeQuantity(
													item.product.id,
													parseInt(e.target.value),
													item.custom[0]?.id
												)}
										>
											<option value="" disabled selected>Select a quantity option...</option>
											{#each quantityOptions as option}
												<option value={option.value} selected={item.quantity === option.value}>
													{option.label}
												</option>
											{/each}
										</select>
									{:else}
										<Input
											type="number"
											class="border p-2 rounded w-[60px]"
											value={item.quantity}
											oninput={(e) => validateQuantity(item, e)}
											min="1"
											max={item.product.stock}
										/>
									{/if}
								</div>
							</div>
							<div class="text-right crb items-end h-[100%]">
								<p class="text-lg font-semibold">
									{(item.price * item.quantity).toFixed(1)}€
								</p>
								<button
									onclick={() => handleRemoveFromCart(item.product.id)}
									class="text-red-600 hover:text-red-800 mt-2"
								>
									<Trash />
								</button>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 p-4 border-t rounded-none">
					<!-- Subtotal -->
					<div class="flex justify-between">
						<span class="text-lg">Subtotal:</span>
						<span class="text-lg">
							${$cart.subtotal?.toFixed(2) || '0.00'}€
						</span>
					</div>
					<!-- Tax (TVA) -->
					<div class="flex justify-between mt-2">
						<span class="text-lg">TVA (5,5%):</span>
						<span class="text-lg">
							${$cart.tax?.toFixed(2) || '0.00'}€
						</span>
					</div>
					<!-- Total -->
					<div class="flex justify-between mt-2">
						<span class="text-xl font-semibold">Total:</span>
						<span class="text-xl font-semibold">
							${$cart.total?.toFixed(2) || '0.00'}€
						</span>
					</div>
				</div>
			{:else}
				<p class="text-gray-600">Votre panier est vide.</p>
			{/if}

			<!-- Formulaire de paiement -->
			<div class="crc w-[100%]">
				<form method="POST" action="?/checkout" use:createPaymentEnhance onsubmit={handleCheckout}>
					<input type="hidden" name="orderId" bind:value={$createPaymentData.orderId} />
					<input type="hidden" name="addressId" bind:value={$createPaymentData.addressId} />
					<Button type="submit">Payer</Button>
				</form>
			</div>
		</div>
	</div>
</div>

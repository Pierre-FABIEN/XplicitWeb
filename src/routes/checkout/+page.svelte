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

	let quantityOptions = $state(
		Array.from({ length: 10 }, (_, i) => i + 1).map((value) => ({
			value,
			label: value.toString()
		}))
	);

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
		createPaymentData.orderId = data.pendingOrder.id;
		if (selectedAddressId) {
			createPaymentData.addressId = selectedAddressId;
		}
	});

	console.log(data);
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
							{#if item.product.images?.[0]}
								<img
									src={item.product.images[0]}
									alt={item.product.name}
									class="w-20 h-20 object-cover mr-4"
								/>
							{/if}
							<div class="flex-1 clb">
								<h3 class="text-lg font-semibold">{item.product.name}</h3>
								<p class="text-gray-600">${item.product.price.toFixed(1)}€</p>
								<div>
									<Input
										type="number"
										class="border p-2 rounded w-[60px]"
										bind:value={item.quantity}
										oninput={(e) => validateQuantity(item, e)}
										min="1"
										max={item.product.stock}
									/>
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
					<div class="flex justify-between items-center">
						<span class="text-xl font-semibold">Total:</span>
						<span class="text-xl font-semibold">
							{$cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(1)}€
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

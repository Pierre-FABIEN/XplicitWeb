<script lang="ts">
	import { loadStripe } from '@stripe/stripe-js';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import SmoothScrollBar from '$lib/components/smoothScrollBar/SmoothScrollBar.svelte';

	import Trash from 'lucide-svelte/icons/trash';
	import Button from '$shadcn/button/button.svelte';
	import { Input } from '$lib/components/shadcn/ui/input/index.js';

	import { OrderSchema } from '$lib/schema/order/order.js';
	import { toast } from 'svelte-sonner';

	// Le store du panier
	import {
		cart as cartStore,
		removeFromCart,
		updateCartItemQuantity
	} from '$lib/store/Data/cartStore';

	// Runes Svelte 5
	let stripe = $state(null);
	let selectedAddressId = $state<string | undefined>(undefined);
	let selectedAddressObj = $state<any>(undefined);

	// Plus de cartValue local, on utilise $cartStore directement.
	let shippingOptions = $state<any[]>([]);
	let selectedShippingOption = $state<string | null>(null);
	let shippingCost = $state<number>(0);
	let servicePoints = $state<any[]>([]);

	let { data } = $props();

	// superForm
	let createPayment = superForm(data.IOrderSchema, {
		validators: zodClient(OrderSchema),
		id: 'createPayment',
		resetForm: true
	});

	const { form: createPaymentData, enhance: createPaymentEnhance } = createPayment;

	$effect(() => {
		(async () => {
			stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
		})();
	});

	function selectAddress(addressId: string) {
		selectedAddressId = addressId;
		selectedAddressObj = data.addresses.find((a) => a.id === addressId);

		selectedShippingOption = null;
		shippingCost = 0;
		shippingOptions = [];

		fetchSendcloudShippingOptions();
	}

	// Calcul dynamique du poids, directement depuis $cartStore
	function computeTotalWeight() {
		return $cartStore.items.reduce((acc, item) => {
			const baseWeight = item.quantity * 0.125;
			const customExtra = item.custom?.length > 0 ? 0.666 : 0;
			return acc + baseWeight + customExtra;
		}, 0);
	}

	function computeTotalQuantity() {
		return $cartStore.items.reduce((acc, item) => acc + item.quantity, 0);
	}

	async function fetchSendcloudShippingOptions() {
		if (!selectedAddressObj) {
			toast.error('Veuillez sélectionner une adresse.');
			return;
		}
		if (!$cartStore.items.length) {
			toast.error('Votre panier est vide.');
			return;
		}

		try {
			console.log(selectedAddressObj, 'selectedAddressObj');

			const totalWeight = computeTotalWeight(); // Fonction locale qui calcule le poids total du panier
			const totalQuantity = computeTotalQuantity(); // Fonction locale qui calcule le nombre d'articles total

			const res = await fetch('/api/sendcloud/shipping-options', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to_country_code: selectedAddressObj.stateLetter, // ex : 'FR'
					to_postal_code: selectedAddressObj.zip, // Code postal
					weight: {
						value: totalWeight.toFixed(3), // On suppose que totalWeight est en kg
						unit: 'kg'
					},
					quantity: totalQuantity
				})
			});

			if (!res.ok) {
				throw new Error('Erreur lors de la récupération des options.');
			}

			const result = await res.json();
			shippingOptions = result.data || [];

			if (!shippingOptions.length) {
				toast.error("Aucune option de livraison n'a été trouvée.");
			} else {
				console.log('Options de livraison reçues:', shippingOptions);
			}
		} catch (err) {
			console.error('❌ Erreur API Sendcloud:', err);
			toast.error('Impossible de récupérer les options de livraison.');
		}
	}

	function chooseShippingOption(chosenOption: any) {
		// On n’a plus un simple code, mais l’objet complet
		console.log('Option choisie:', chosenOption);

		selectedShippingOption = chosenOption.code;

		if (chosenOption?.quotes?.[0]?.price?.total?.value) {
			shippingCost = parseFloat(chosenOption.quotes[0].price.total.value);
		} else {
			shippingCost = 0;
		}

		const carrierCode = chosenOption?.carrier?.code; // ou chosenOption?.carrier_code ?

		// Vérifier si c’est un point relais
		const isServicePoint = chosenOption?.functionalities?.last_mile === 'service_point';
		if (isServicePoint && carrierCode) {
			fetchServicePoints(carrierCode);
		}
	}

	async function fetchServicePoints(carrierCode: string) {
		if (!selectedAddressObj) {
			toast.error('Veuillez sélectionner une adresse.');
			return;
		}

		try {
			const res = await fetch('/api/sendcloud/service-points', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to_country_code: selectedAddressObj.stateLetter, // ex: "FR"
					to_postal_code: selectedAddressObj.zip, // Code postal
					radius: 20000, // 20 km en mètres
					carriers: carrierCode // ex: "colisprive"
				})
			});

			if (!res.ok) {
				throw new Error('Erreur de récupération des points relais');
			}
			const data = await res.json();

			// Stocker les points relais reçus
			servicePoints = data;
			console.log('✅ Points relais reçus:', servicePoints);

			if (!servicePoints.length) {
				toast.error('Aucun point relais trouvé pour ce transporteur.');
			}
		} catch (err) {
			console.error('❌ Erreur fetchServicePoints :', err);
			toast.error('Impossible de récupérer les points relais.');
		}
	}

	function handleRemoveFromCart(productId: string) {
		removeFromCart(productId);

		// Une fois le store mis à jour, on vérifie si le panier n'est pas vide
		if ($cartStore.items.length === 0) {
			// Pas de recalcul, on vide juste les infos
			shippingOptions = [];
			shippingCost = 0;
			selectedShippingOption = null;
		} else {
			// Relance la requête pour mettre à jour les tarifs et options
			fetchSendcloudShippingOptions();
		}
	}

	function changeQuantity(productId: string, quantity: number) {
		updateCartItemQuantity(productId, quantity);
	}

	function validateQuantity(item, event) {
		const inputElement = event.target as HTMLInputElement;
		let quantity = parseInt(inputElement.value, 10);

		if (isNaN(quantity) || quantity < 1) {
			quantity = 1;
		} else if (quantity > item.product.stock) {
			quantity = item.product.stock;
		}

		inputElement.value = String(quantity);
		changeQuantity(item.product.id, quantity);
	}

	function handleCheckout(event: Event) {
		// Empêche le comportement par défaut de la soumission
		event.preventDefault();

		if (!selectedAddressId) {
			toast.error('Veuillez choisir une adresse.');
			return;
		}
		if (!selectedShippingOption) {
			toast.error('Veuillez choisir un mode de livraison.');
			return;
		}

		// Mise à jour des données du superform
		$createPaymentData.shippingCost = shippingCost.toString();
		$createPaymentData.shippingOption = selectedShippingOption;

		console.log(
			'Checkout avec option de livraison:',
			selectedShippingOption,
			'coût:',
			shippingCost
		);
	}

	$effect(() => {
		$createPaymentData.orderId = data.pendingOrder.id;
		if (selectedAddressId) {
			$createPaymentData.addressId = selectedAddressId;
		}
	});
</script>

<!-- =========================================== -->
<!-- TEMPLATE / UI -->
<!-- =========================================== -->
<div class="ccc w-screen h-screen">
	<SmoothScrollBar>
		<div class="ctc w-[100vw] mb-[200px]">
			<!-- Liste d'adresses -->
			<div class="container mx-auto p-4">
				<h2 class="text-2xl font-bold mb-4 mt-5">Vos adresses</h2>
				<div class="clc">
					{#if data?.addresses?.length > 0}
						{#each data.addresses as address}
							<button
								class="border rounded p-2 m-2 min-w-[400px]
								{selectedAddressId === address.id ? 'border-green-400' : ''}"
								onclick={() => selectAddress(address.id)}
							>
								<p class="text-sm text-muted-foreground">
									Destinataire: {address.first_name}
									{address.last_name}
								</p>
								<p class="text-sm text-muted-foreground">Rue: {address.street}</p>
								<p class="text-sm text-muted-foreground">Ville: {address.city}</p>
								<p class="text-sm text-muted-foreground">Code postal: {address.zip}</p>
								<p class="text-sm text-muted-foreground">Pays: {address.country}</p>
							</button>
						{/each}
					{:else}
						<p class="text-gray-600">Aucune adresse renseignée.</p>
					{/if}

					<Button class="mt-4">
						<a data-sveltekit-preload-data href="/auth/settings/address">Créer une adresse</a>
					</Button>
				</div>
			</div>

			<!-- Panier -->
			<div class="container mx-auto p-4">
				{#if $cartStore.items.length > 0}
					<!-- Affichage des items en direct depuis $cartStore -->
					<div class="ccc max-h-[80vh]">
						{#each $cartStore.items as item (item.id)}
							<div class="p-4 border rounded-lg shadow-sm flex justify-between w-[100%] mb-2">
								<div class="flex">
									<img
										src={(item.custom?.length > 0 && item.custom[0].image) ||
											(Array.isArray(item.product.images)
												? item.product.images[0]
												: item.product.images) ||
											''}
										alt={item.product.name}
										class="w-20 h-20 object-cover mr-5"
									/>
									<div class="flex-1 flex flex-col justify-between">
										<h3 class="text-lg font-semibold">{item.product.name}</h3>
										<p class="text-gray-600">{item.product.price.toFixed(2)}€</p>

										<!-- Quantité -->
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
												<option value="" disabled selected>Sélectionnez une quantité...</option>
												<option value="576" selected={item.quantity === 576}>
													24 packs de 24 canettes (576 unités)
												</option>
												<option value="720" selected={item.quantity === 720}>
													1/4 de palette (720 unités)
												</option>
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
								<div class="text-right flex flex-col justify-between items-end">
									<p class="text-lg font-semibold">
										{(item.price * item.quantity).toFixed(2)}€
									</p>
									<button
										onclick={() => handleRemoveFromCart(item.product.id)}
										class="text-red-600 hover:text-red-800"
									>
										<Trash />
									</button>
								</div>
							</div>
						{/each}
					</div>

					<hr class="my-5" />

					<!-- Options de livraison -->
					{#each shippingOptions as option (option.code)}
						<div class="mb-4 p-2 border rounded">
							<div class="flex items-center">
								<input
									id={option.code}
									type="radio"
									name="shippingOption"
									value={option.code}
									checked={selectedShippingOption === option.code}
									onchange={() => chooseShippingOption(option)}
								/>
								<label for={option.code} class="ml-2">
									<strong>{option.carrier.name}</strong> – {option.product.name}
									({option.quotes?.[0]?.price?.total?.value
										? option.quotes[0].price.total.value + ' €'
										: 'Prix indisponible'})
								</label>
							</div>
							<!-- Informations supplémentaires (deadline, signature, etc.) -->
							<!-- ... -->
						</div>
					{/each}

					<!-- Récapitulatif et paiement -->
					<div class="mt-4 p-4 border-t rounded-none">
						<div class="flex justify-between">
							<span class="text-lg">Sous-total (HT) :</span>
							<span class="text-lg">{$cartStore.subtotal.toFixed(2)}€</span>
						</div>
						<div class="flex justify-between mt-2">
							<span class="text-lg">Livraison :</span>
							<span class="text-lg">
								{shippingCost > 0
									? `${shippingCost.toFixed(2)}€`
									: selectedShippingOption
										? 'En cours...'
										: 'Non sélectionné'}
							</span>
						</div>
						<div class="flex justify-between mt-2">
							<span class="text-xl font-semibold">Total TTC :</span>
							<span class="text-xl font-semibold">
								{($cartStore.total + shippingCost).toFixed(2)}€
							</span>
						</div>
						<div class="flex justify-between mt-2">
							<span class="text-lg">TVA (5,5%) :</span>
							<span class="text-lg">{$cartStore.tax.toFixed(2)}€</span>
						</div>
					</div>
				{:else}
					<p class="text-gray-600">Votre panier est vide.</p>
				{/if}

				<!-- Formulaire de paiement -->
				<div class="mt-4">
					<form
						method="POST"
						action="?/checkout"
						use:createPaymentEnhance
						onsubmit={handleCheckout}
					>
						<input type="hidden" name="orderId" bind:value={$createPaymentData.orderId} />
						<input type="hidden" name="addressId" bind:value={$createPaymentData.addressId} />
						<input
							type="hidden"
							name="shippingOption"
							bind:value={$createPaymentData.shippingOption}
						/>
						<input type="hidden" name="shippingCost" bind:value={$createPaymentData.shippingCost} />

						<Button type="submit">Payer</Button>
					</form>
				</div>
			</div>
		</div>
	</SmoothScrollBar>
</div>

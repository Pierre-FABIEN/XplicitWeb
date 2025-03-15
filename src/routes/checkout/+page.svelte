<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import { MapLibre, Marker, Popup } from 'svelte-maplibre-gl';
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
		setShippingCostHT,
		updateCartItemQuantity
	} from '$lib/store/Data/cartStore';

	let { data } = $props();

	// Runes Svelte 5
	let stripe = $state(null);
	let selectedAddressId = $state<string | undefined>(undefined);
	let selectedAddressObj = $state<any>(undefined);

	// Plus de cartValue local, on utilise $cartStore directement.
	let shippingOptions = $state<any[]>([]);
	let selectedShippingOption = $state<string | null>(null);
	let shippingCost = $state<number>(0);

	let servicePoints = $state<any[]>([]);

	let zoom = $state(12);
	let centerCoordinates = $state<[number, number]>([2.3522, 48.8566]);
	let selectedPoint = $state<any>(null);
	let showMap = $state(false);

	let shippingTax = $derived(shippingCost * 0.055);
	let totalTTC = $derived($cartStore.subtotal + $cartStore.tax + shippingCost + shippingTax);

	// Offset pour la popup (optionnel, reprenant l’exemple maplibre)
	let offset = $state(24);
	let offsets: maplibregl.Offset = $derived({
		top: [0, offset],
		bottom: [0, -offset],
		left: [offset + 12, 0],
		right: [-offset - 12, 0],
		center: [0, 0],
		'top-left': [offset, offset],
		'top-right': [-offset, offset],
		'bottom-left': [offset, -offset],
		'bottom-right': [-offset, -offset]
	});

	// superForm
	let createPayment = superForm(data.IOrderSchema, {
		validators: zodClient(OrderSchema),
		id: 'createPayment',
		resetForm: true
	});

	const { form: createPaymentData, enhance: createPaymentEnhance } = createPayment;

	/**
	 * Effect: whenever we "read" servicePoints, if it's non-empty,
	 * we recenter the map on the first point. This replaces onMount usage.
	 */
	$effect(() => {
		if (servicePoints.length > 0) {
			centerCoordinates = [servicePoints[0].longitude, servicePoints[0].latitude];
		}
	});

	$effect(() => {
		console.log($createPaymentData, 'khsblsihjbsliub');
	});

	$effect(() => {
		if (selectedPoint) {
			$createPaymentData.servicePointId = selectedPoint.id.toString();
			$createPaymentData.servicePointPostNumber = selectedPoint.extra_data?.shop_ref || '';
			$createPaymentData.servicePointLatitude = selectedPoint.latitude;
			$createPaymentData.servicePointLongitude = selectedPoint.longitude;
			$createPaymentData.servicePointType = selectedPoint.shop_type || null;
			$createPaymentData.servicePointExtraRefCab = selectedPoint.extra_data?.ref_cab || '';
			$createPaymentData.servicePointExtraShopRef = selectedPoint.extra_data?.shop_ref || '';
		} else {
			// Réinitialisation si aucun point sélectionné
			$createPaymentData.servicePointId = '';
			$createPaymentData.servicePointPostNumber = '';
			$createPaymentData.servicePointLatitude = '';
			$createPaymentData.servicePointLongitude = '';
			$createPaymentData.servicePointType = null;
			$createPaymentData.servicePointExtraRefCab = '';
			$createPaymentData.servicePointExtraShopRef = '';
		}
	});

	/**
	 * Called when the user clicks a marker. We set our local selectedPoint,
	 * then call onSelect(point). This is a callback-prop approach
	 * instead of an event dispatcher.
	 */
	function handleMarkerClick(point: any) {
		selectedPoint = point;
	}

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
		console.log('Option choisie:', chosenOption);

		selectedShippingOption = chosenOption.code;

		const costHT = parseFloat(chosenOption.quotes?.[0]?.price?.total?.value || 0);
		setShippingCostHT(costHT);

		if (chosenOption?.quotes?.[0]?.price?.total?.value) {
			shippingCost = parseFloat(chosenOption.quotes[0].price.total.value);
		} else {
			shippingCost = 0;
		}

		const carrierCode = chosenOption?.carrier?.code;
		// Vérifier si c’est un point relais
		const isServicePoint = chosenOption?.functionalities?.last_mile === 'service_point';

		if (isServicePoint && carrierCode) {
			// On affiche la carte et on récupère les points relais
			showMap = true;
			fetchServicePoints(carrierCode);
		} else {
			// Si ce n’est pas un point relais, on masque la carte et on reset les données du point
			showMap = false;
			selectedPoint = null;
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
					radius: 5000, // 20 km en mètres
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

		// Vérification si un point relais est requis
		if (showMap && !selectedPoint) {
			toast.error('Veuillez sélectionner un point relais.');
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

					{#if showMap}
						<MapLibre
							class="w-full h-[500px]"
							style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
							{zoom}
							center={centerCoordinates}
						>
							{#each servicePoints as point}
								<Marker lnglat={[point.longitude, point.latitude]}>
									{#snippet content()}
										<!-- Visuel du marker -->
										<div class="bg-blue-600 text-white p-2 rounded cursor-pointer"></div>
									{/snippet}
									<!-- Popup à l’intérieur du Marker -->
									<Popup class="text-black" offset={offsets} open={selectedPoint?.id === point.id}>
										<div class="p-2">
											<h3 class="font-bold mb-1">{point.name}</h3>
											<p>Adresse : {point.street}</p>
											<p>{point.postal_code} {point.city}</p>
											<button onclick={() => handleMarkerClick(point)}>Valider</button>
										</div>
									</Popup>
								</Marker>
							{/each}
						</MapLibre>
					{/if}

					{#if selectedPoint}
						<div class="border p-2 mt-3">
							<h3 class="font-bold">Selected Point:</h3>
							<p>ID: {selectedPoint.id}</p>
							<p>Name: {selectedPoint.name}</p>
							<!-- You can display more fields like address, postal code, city, etc. -->
						</div>
					{/if}

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
									? shippingCost.toFixed(2) + '€'
									: selectedShippingOption
										? 'En cours...'
										: 'Non sélectionné'}
							</span>
						</div>

						<div class="flex justify-between mt-2">
							<span class="text-lg">TVA (5,5%) :</span>
							<span class="text-lg">{$cartStore.tax.toFixed(2)}€</span>
						</div>
						<div class="flex justify-between mt-2">
							<span class="text-xl font-semibold">Total TTC :</span>
							<span class="text-xl font-semibold">{totalTTC.toFixed(2)}€</span>
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

						<input
							type="hidden"
							name="servicePointId"
							bind:value={$createPaymentData.servicePointId}
						/>
						<input
							type="hidden"
							name="servicePointPostNumber"
							bind:value={$createPaymentData.servicePointPostNumber}
						/>
						<input
							type="hidden"
							name="servicePointLatitude"
							bind:value={$createPaymentData.servicePointLatitude}
						/>
						<input
							type="hidden"
							name="servicePointLongitude"
							bind:value={$createPaymentData.servicePointLongitude}
						/>
						<input
							type="hidden"
							name="servicePointType"
							bind:value={$createPaymentData.servicePointType}
						/>
						<input
							type="hidden"
							name="servicePointExtraRefCab"
							bind:value={$createPaymentData.servicePointExtraRefCab}
						/>
						<input
							type="hidden"
							name="servicePointExtraShopRef"
							bind:value={$createPaymentData.servicePointExtraShopRef}
						/>

						<Button type="submit">Payer</Button>
					</form>
				</div>
			</div>
		</div>
	</SmoothScrollBar>
</div>

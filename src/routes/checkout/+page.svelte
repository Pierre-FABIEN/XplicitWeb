<script lang="ts">
	import maplibregl from 'maplibre-gl';

	import * as Card from '$shadcn/card/index.js';
	import { loadStripe } from '@stripe/stripe-js';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import SmoothScrollBar from '$lib/components/smoothScrollBar/SmoothScrollBar.svelte';
	import AddressSelector from '$lib/components/checkout/AddressSelector.svelte';
	import ShippingOptions from '$lib/components/checkout/ShippingOptions.svelte';
	import ServicePointMap from '$lib/components/checkout/ServicePointMap.svelte';
	import CartSummary from '$lib/components/checkout/CartSummary.svelte';
	import {
		CreditCard
	} from 'lucide-svelte';
	import Button from '$shadcn/button/button.svelte';
	import { OrderSchema } from '$lib/schema/order/order.js';
	import { toast } from 'svelte-sonner';
	import {
		cart as cartStore,
		removeFromCart,
		setShippingCostHT,
		updateCartItemQuantity
	} from '$lib/store/Data/cartStore';
	import SEO from '$lib/components/SEO.svelte';
	
	let { data } = $props();

	// Options de quantité pour les articles personnalisés
	let customQuantityOptions = $state([
		{ label: '24 packs de 24 canettes (576 unités)', value: 576 },
		{ label: '1/4 de palette : 30 packs (720 unités)', value: 720 },
		{ label: '1/2 palette : 60 packs (1 440 unités)', value: 1440 },
		{ label: '1 palette : 120 packs (2 880 unités)', value: 2880 },
		{ label: '3 palettes : 360 packs (8 640 unités)', value: 8640 }
	]);

	// Fonction pour calculer le prix des canettes personnalisées
	function getCustomCanPrice(quantity: number): number {
		switch (quantity) {
			case 576:
				return 1.60;
			case 720:
				return 1.40;
			case 1440:
				return 0.99;
			case 2880:
				return 0.79;
			case 8640:
				return 0.69;
			default:
				return 1.60;
		}
	}

	// Runes Svelte 5
	let stripe = $state(null);
	let selectedAddressId = $state<string | undefined>(undefined);

	// Plus de cartValue local, on utilise $cartStore directement.
	let shippingOptions = $state<any[]>([]);
	let selectedShippingOption = $state<string | null>(null);
	let selectedShippingCarrier = $state<string | null>(null);
	let shippingCost = $state<number>(0);

	let servicePoints = $state<any[]>([]);
	let isLoadingServicePoints = $state(false); // ✅ Nouvel état de chargement

	let zoom = $state(12);
	let centerCoordinates = $state<[number, number]>([2.3522, 48.8566]); // Paris par défaut
	let selectedPoint = $state<any>(null);
	let showMap = $state(false);

	let totalTTC = $derived($cartStore.subtotal + $cartStore.tax + shippingCost);

	// Détecter si la commande contient des canettes personnalisées
	let hasCustomItems = $derived($cartStore.items.some(item => item.custom?.length > 0));
	
	// Si la commande contient des personnalisations, on désactive la livraison
	$effect(() => {
		if (hasCustomItems) {
			shippingOptions = [];
			selectedShippingOption = 'no_shipping';
			shippingCost = 0;
			showMap = false;
			selectedPoint = null;
		}
	});

	// Surveiller les changements du panier et de l'adresse pour recharger les options de livraison
	// Ne pas recharger quand on sélectionne une option de livraison
	let previousCartItemsCount = $state(0);
	let previousAddressId = $state<string | undefined>(undefined);
	
	$effect(() => {
		const currentCartItemsCount = $cartStore.items.length;
		const currentAddressId = selectedAddressId;
		
		// Vérifier si le panier ou l'adresse a changé
		const cartChanged = currentCartItemsCount !== previousCartItemsCount;
		const addressChanged = currentAddressId !== previousAddressId;
		
		// Mettre à jour les valeurs précédentes
		previousCartItemsCount = currentCartItemsCount;
		previousAddressId = currentAddressId;
		
		// Ne recharger que si le panier ou l'adresse a vraiment changé
		if ((cartChanged || addressChanged) && currentAddressId && !hasCustomItems && currentCartItemsCount > 0) {
			fetchShippoShippingOptions();
		} else if (currentAddressId && !hasCustomItems && currentCartItemsCount > 0 && previousCartItemsCount === 0) {
			fetchShippoShippingOptions();
		}
	});

	// Offset pour la popup (optionnel, reprenant l'exemple maplibre)
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
		resetForm: true,
		onUpdate: () => {},
		onSubmit: () => {},
		onResult: () => {}
	});

	const { form: createPaymentData, enhance: createPaymentEnhance } = createPayment;

	/**
	 * Effect: Centrer la carte sur l'adresse du client quand on sélectionne un point relais
	 */
	$effect(() => {
		if (showMap && selectedAddressId) {
			const selectedAddress = getSelectedAddress();
			if (selectedAddress) {
				// Géocodage dynamique de l'adresse
				getCoordinatesFromAddress(selectedAddress).then(clientCoordinates => {
					centerCoordinates = clientCoordinates;
				}).catch(() => {
					centerCoordinates = [1.3542, 44.0167];
				});
			}
		}
	});

	/**
	 * Effect: Centrer sur le premier point relais quand ils sont chargés
	 */
	$effect(() => {
		if (servicePoints.length > 0 && showMap) {
			// Optionnel : centrer sur le premier point relais trouvé
			// centerCoordinates = [servicePoints[0].longitude, servicePoints[0].latitude];
		}
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
		// Plus besoin de validation, l'API filtre déjà les points relais compatibles
		selectedPoint = point;
	}

	$effect(() => {
		(async () => {
			stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
		})();
	});

	// Helper function to get selected address
	function getSelectedAddress() {
		return data.addresses?.find((a) => a.id === selectedAddressId);
	}

	// Helper function to get coordinates from address (géocodage dynamique)
	async function getCoordinatesFromAddress(address: any): Promise<[number, number]> {
		// Si l'adresse a déjà des coordonnées, les utiliser
		if (address.latitude && address.longitude) {
			return [address.longitude, address.latitude];
		}

		try {
			// Géocodage dynamique avec OpenStreetMap Nominatim
			const query = encodeURIComponent(`${address.street || ''} ${address.zip} ${address.city} France`);
			const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=fr`);
			
			if (response.ok) {
				const data = await response.json();
				if (data && data.length > 0) {
					const coords: [number, number] = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
					return coords;
				}
			}
		} catch {
		}

		// Fallback : coordonnées approximatives basées sur le code postal
		const postalCode = address.zip;
		const city = address.city?.toLowerCase();

		// Coordonnées approximatives pour quelques villes françaises
		const cityCoordinates: Record<string, [number, number]> = {
			'montauban': [1.3542, 44.0167],
			'toulouse': [1.4437, 43.6047],
			'paris': [2.3522, 48.8566],
			'lyon': [4.8357, 45.7640],
			'marseille': [5.3698, 43.2965],
			'nice': [7.2619, 43.7102],
			'nantes': [-1.5536, 47.2184],
			'strasbourg': [7.7521, 48.5734],
			'montpellier': [3.8767, 43.6110],
			'bordeaux': [-0.5792, 44.8378]
		};

		// Chercher par nom de ville
		if (city && cityCoordinates[city]) {
			return cityCoordinates[city];
		}

		// Fallback final : Montauban
		return [1.3542, 44.0167];
	}

	// Helper function to reset shipping state
	function resetShippingState() {
		selectedShippingOption = null;
		selectedShippingCarrier = null;
		shippingCost = 0;
		shippingOptions = [];
		showMap = false;
		selectedPoint = null;
		servicePoints = [];
	}

	function selectAddress(addressId: string) {
		selectedAddressId = addressId;

		resetShippingState();

		// Ne pas récupérer les options de livraison si la commande contient des personnalisations
		if (!hasCustomItems) {
			fetchShippoShippingOptions();
		}
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

	async function fetchShippoShippingOptions() {
		const selectedAddress = getSelectedAddress();
		if (!selectedAddress) {
			toast.error('Veuillez sélectionner une adresse.');
			return;
		}
		if (!$cartStore.items.length) {
			toast.error('Votre panier est vide.');
			return;
		}

		try {
			// Calculer le poids et la quantité totaux
			const totalWeight = computeTotalWeight();
			const totalQuantity = computeTotalQuantity();

			// Préparer la requête pour Shippo
			const requestBody = {
				from_country_code: 'FR',                        // Expéditeur (toujours France)
				to_country_code: selectedAddress.stateLetter,    // ex: 'FR'
				from_postal_code: import.meta.env.VITE_SHIPPO_SENDER_POSTAL_CODE || '31620', // Code postal expéditeur depuis .env
				to_postal_code: selectedAddress.zip,             // ex: '31500'
				weight: {
					value: totalWeight,                          // Poids en kg (ex: 9.0)
					unit: 'kilogram'                             // Unité attendue par Shippo
				},
				prefer_service_point: import.meta.env.VITE_SHIPPO_PREFER_SERVICE_POINT === 'true', // Préférence point relais depuis .env
				max_options: parseInt(import.meta.env.VITE_SHIPPO_MAX_OPTIONS || '10'), // Nombre max d'options depuis .env
				// Données de l'adresse client pour Shippo
				client_address: {
					name: `${selectedAddress.firstName || ''} ${selectedAddress.lastName || ''}`.trim(),
					company: selectedAddress.company || '',
					street: selectedAddress.street || '',
					city: selectedAddress.city || '',
					phone: selectedAddress.phone || '',
					email: selectedAddress.email || ''
				}
			};

			const res = await fetch('/api/shippo/shipping-options', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody)
			});

			if (!res.ok) {
				const errorText = await res.text().catch(() => 'Erreur inconnue');
				throw new Error(`Erreur ${res.status}: ${errorText}`);
			}

			const result = await res.json();
			shippingOptions = result.data || [];

			if (!shippingOptions.length) {
				toast.error("Aucune option de livraison n'a été trouvée.");
			}
		} catch {
			toast.error('Impossible de récupérer les options de livraison.');
		}
	}

	// Stocker le code du transporteur de l'option sélectionnée
	let selectedCarrierCode = '';

	function chooseShippingOption(chosenOption: any) {
		selectedShippingOption = chosenOption.id; // Nouvelle structure : option.id au lieu de option.code
		selectedShippingCarrier = chosenOption.carrierCode; // Récupérer le carrier

		const costHT = parseFloat(chosenOption.price || 0);
		setShippingCostHT(costHT);

		if (chosenOption?.price) {
			shippingCost = parseFloat(chosenOption.price);
		} else {
			shippingCost = 0;
		}

		const carrierCode = chosenOption?.carrierCode; // Nouvelle structure : option.carrierCode
		// Vérifier si c'est un point relais
		const isServicePoint = chosenOption?.type === 'service_point';

		// Réinitialiser le point relais sélectionné lors du changement d'option
		selectedPoint = null;

		if (isServicePoint && carrierCode) {
			// Stocker le code du transporteur pour validation
			selectedCarrierCode = carrierCode;
			// On affiche la carte et on récupère les points relais
			showMap = true;
			// ✅ Vider la liste des points relais avant de récupérer les nouveaux
			servicePoints = [];
			fetchServicePoints(carrierCode);
		} else {
			// Si ce n'est pas un point relais, on masque la carte et on reset les données du point
			showMap = false;
			selectedPoint = null;
			selectedCarrierCode = '';
			// ✅ Vider aussi la liste des points relais
			servicePoints = [];
		}
	}

	async function fetchServicePoints(carrierCode: string) {
		const selectedAddress = getSelectedAddress();
		if (!selectedAddress) {
			toast.error('Veuillez sélectionner une adresse.');
			return;
		}

		try {
			isLoadingServicePoints = true;
			
			const res = await fetch('/api/shippo/service-points', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					to_country_code: selectedAddress.stateLetter, // ex: "FR"
					to_postal_code: selectedAddress.zip, // Code postal
					radius: 5000, // 5 km en mètres
					carriers: carrierCode, // ex: "colissimo"
					client_address: {
						city: selectedAddress.city,
						zip: selectedAddress.zip,
						street: selectedAddress.street
					}
				})
			});

			if (!res.ok) {
				const errorText = await res.text().catch(() => 'Erreur inconnue');
				throw new Error('Erreur de récupération des points relais');
			}
			
			const data = await res.json();
			servicePoints = data;

			if (!servicePoints.length) {
				toast.error('Aucun point relais trouvé pour ce transporteur.');
			}
		} catch {
			toast.error('Impossible de récupérer les points relais.');
		} finally {
			isLoadingServicePoints = false; // ✅ Fin du chargement
		}
	}

	function handleRemoveFromCart(productId: string) {
		removeFromCart(productId);

		// Une fois le store mis à jour, on vérifie si le panier n'est pas vide
		if ($cartStore.items.length === 0) {
			// Pas de recalcul, on vide juste les infos
			resetShippingState();
		} else {
			// Relance la requête pour mettre à jour les tarifs et options
			fetchShippoShippingOptions();
		}
	}

	function changeQuantity(productId: string, quantity: number, customId?: string) {
		updateCartItemQuantity(productId, quantity, customId);
		
		// Recharger les options de livraison après changement de quantité
		if (selectedAddressId && !hasCustomItems) {
			resetShippingState();
			fetchShippoShippingOptions();
		}
	}



	function handleCheckout(_event: Event) {
		if (!selectedAddressId) {
			toast.error('Veuillez choisir une adresse.');
			return false;
		}
		if (!selectedShippingOption && !hasCustomItems) {
			toast.error('Veuillez choisir un mode de livraison.');
			return false;
		}
		if (showMap && !selectedPoint && !hasCustomItems) {
			toast.error('Veuillez sélectionner un point relais.');
			return false;
		}

		$createPaymentData.shippingCost = shippingCost.toString();
		$createPaymentData.shippingOption = selectedShippingOption;
		$createPaymentData.shippingCarrier = selectedShippingCarrier || '';
		
		if (selectedPoint) {
			$createPaymentData.servicePointLatitude = selectedPoint.latitude.toString();
			$createPaymentData.servicePointLongitude = selectedPoint.longitude.toString();
		}

		return true;
	}

	$effect(() => {
		$createPaymentData.orderId = data.pendingOrder.id;
		if (selectedAddressId) {
			$createPaymentData.addressId = selectedAddressId;
		}
	});


</script>

<!-- SEO pour la page checkout -->
<SEO pageKey="checkout" />

<div class="min-h-screen w-[100vw]">
	<SmoothScrollBar>
		<div class="container mx-auto px-4 py-8 max-w-7xl">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-[100px]">
				<!-- Section Adresse -->
				<div class="space-y-6">
					<AddressSelector
						addresses={data?.addresses || []}
						selectedAddressId={selectedAddressId}
						onAddressSelect={selectAddress}
					/>

					
					<ShippingOptions
						shippingOptions={shippingOptions}
						selectedShippingOption={selectedShippingOption}
						onShippingOptionSelect={chooseShippingOption}
						hasCustomItems={hasCustomItems}
					/>
				</div>

				<!-- Colonne de droite - Panier et Paiement -->
				<div class="space-y-6">
					<ServicePointMap
						{showMap}
						{isLoadingServicePoints}
						{servicePoints}
						{selectedPoint}
										{zoom}
						{centerCoordinates}
						{offsets}
						onMarkerClick={handleMarkerClick}
					/>
					<CartSummary
						items={$cartStore.items}
						subtotal={$cartStore.subtotal}
						tax={$cartStore.tax}
						{hasCustomItems}
						{shippingCost}
						{selectedShippingOption}
						{customQuantityOptions}
						{getCustomCanPrice}
						onRemoveFromCart={handleRemoveFromCart}
						onChangeQuantity={changeQuantity}
					/>
					<!-- Formulaire de paiement -->
					{#if $cartStore.items.length > 0}
						<Card.Root>
							<div class="p-6">
								<form
									method="POST"
									action="?/checkout"
									use:createPaymentEnhance
									onsubmit={(e) => handleCheckout(e)}
								>
									<input type="hidden" name="orderId" bind:value={$createPaymentData.orderId} />
									<input type="hidden" name="addressId" bind:value={$createPaymentData.addressId} />
									<input
										type="hidden"
										name="shippingOption"
										bind:value={$createPaymentData.shippingOption}
									/>
									<input
										type="hidden"
										name="shippingCarrier"
										bind:value={$createPaymentData.shippingCarrier}
									/>
									<input
										type="hidden"
										name="shippingCost"
										bind:value={$createPaymentData.shippingCost}
									/>

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

									<Button type="submit" class="w-full" size="lg">
										<CreditCard class="w-4 h-4 mr-2" />
										Payer {totalTTC.toFixed(2)}€
									</Button>
								</form>
							</div>
						</Card.Root>
					{/if}
				</div>
			</div>
		</div>
	</SmoothScrollBar>
</div>

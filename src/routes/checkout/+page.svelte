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

	// Options de quantité pour les articles non-personnalisés
	let quantityOptions = $state([24, 48, 72]);

	// Options de quantité pour les articles personnalisés
	let customQuantityOptions = $state([
		{ label: '24 packs de 24 canettes (576 unités)', value: 576 },
		{ label: '1/4 de palette : 30 packs (720 unités)', value: 720 },
		{ label: '1/2 palette : 60 packs (1 440 unités)', value: 1440 },
		{ label: '1 palette : 120 packs (2 880 unités)', value: 2880 },
		{ label: '3 palettes : 360 packs (8 640 unités)', value: 8640 }
	]);

	// Calculer le total des quantités pour les commandes non-personnalisées
	let totalNonCustomQuantity = $derived(
		$cartStore.items
			.filter(item => !item.custom || (Array.isArray(item.custom) && item.custom.length === 0))
			.reduce((acc, item) => acc + item.quantity, 0)
	);

	// Fonction pour vérifier si on peut ajouter une quantité
	function canAddQuantity(newQuantity: number, currentQuantity: number, isCustom: boolean): boolean {
		if (isCustom) return true; // Pas de limite pour les personnalisées
		
		const otherItemsQuantity = totalNonCustomQuantity - currentQuantity;
		return (otherItemsQuantity + newQuantity) <= 72;
	}

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

	// Surveiller les changements du panier pour recharger les options de livraison
	$effect(() => {
		if (selectedAddressId && !hasCustomItems && $cartStore.items.length > 0) {
			// Recharger les options de livraison quand le panier change
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
		onUpdate: ({ form }) => {
			console.log('🔄 [SUPERFORM] onUpdate appelé:', {
				timestamp: new Date().toISOString(),
				valid: form.valid,
				data: form.data,
				errors: form.errors,
				message: form.message
			});
			if (form.valid) {
				console.log('✅ [SUPERFORM] Formulaire de paiement validé:', form.data);
			} else {
				console.log('❌ [SUPERFORM] Erreurs de validation:', form.errors);
			}
		},
		onSubmit: ({ cancel }) => {
			console.log('🚀 [SUPERFORM] onSubmit appelé:', {
				timestamp: new Date().toISOString(),
				cancel: cancel
			});
		},
		onResult: ({ result }) => {
			console.log('📡 [SUPERFORM] onResult appelé:', {
				timestamp: new Date().toISOString(),
				result: result,
				type: result.type,
				status: result.status
			});
		}
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
					console.log('📍 [FRONTEND] Centrage carte sur adresse client:', {
						timestamp: new Date().toISOString(),
						address: selectedAddress.city,
						postal: selectedAddress.zip,
						coordinates: centerCoordinates
					});
				}).catch(error => {
					console.error('❌ [FRONTEND] Erreur géocodage:', error);
					// Fallback vers Montauban
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
					console.log('📍 [FRONTEND] Géocodage réussi:', {
						timestamp: new Date().toISOString(),
						address: `${address.city} ${address.zip}`,
						coordinates: coords,
						osm_result: data[0].display_name
					});
					return coords;
				}
			}
		} catch (error) {
			console.warn('⚠️ [FRONTEND] Géocodage échoué, utilisation du fallback:', error);
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

			console.log('🚀 [FRONTEND SHIPPO] Demande d\'options de livraison:', {
				timestamp: new Date().toISOString(),
				address: {
					country: selectedAddress.stateLetter,
					postal: selectedAddress.zip,
					city: selectedAddress.city
				},
				cart: {
					items_count: $cartStore.items.length,
					total_weight: totalWeight,
					total_quantity: totalQuantity,
					has_custom_items: hasCustomItems
				}
			});

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

			console.log('📤 [FRONTEND SHIPPO] Payload envoyé à l\'API:', {
				timestamp: new Date().toISOString(),
				requestBody
			});

			const res = await fetch('/api/shippo/shipping-options', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody)
			});

			console.log('📡 [FRONTEND SHIPPO] Réponse API reçue:', {
				timestamp: new Date().toISOString(),
				status: res.status,
				statusText: res.statusText,
				ok: res.ok
			});

			if (!res.ok) {
				const errorText = await res.text().catch(() => 'Erreur inconnue');
				console.error('❌ [FRONTEND SHIPPO] Erreur API:', {
					timestamp: new Date().toISOString(),
					status: res.status,
					error: errorText
				});
				throw new Error(`Erreur ${res.status}: ${errorText}`);
			}

			const result = await res.json();
			
			console.log('✅ [FRONTEND SHIPPO] Données reçues:', {
				timestamp: new Date().toISOString(),
				options_count: result.data?.length || 0,
				meta: result.meta,
				filtering: result.filtering,
				options: result.data?.map(opt => ({
					id: opt.id,
					carrier: opt.carrierCode,
					type: opt.type,
					price: opt.price,
					product: opt.productName
				}))
			});
			
			shippingOptions = result.data || [];

			if (!shippingOptions.length) {
				console.warn('⚠️ [FRONTEND SHIPPO] Aucune option de livraison trouvée');
				toast.error("Aucune option de livraison n'a été trouvée.");
			} else {
				console.log('🎯 [FRONTEND SHIPPO] Options de livraison chargées:', {
					timestamp: new Date().toISOString(),
					count: shippingOptions.length,
					types: {
						service_point: shippingOptions.filter(o => o.type === 'service_point').length,
						home_delivery: shippingOptions.filter(o => o.type === 'home_delivery').length
					}
				});
			}
		} catch (err) {
			console.error('❌ [FRONTEND SHIPPO] Erreur API Shippo:', {
				timestamp: new Date().toISOString(),
				error: err,
				message: err instanceof Error ? err.message : 'Erreur inconnue'
			});
			toast.error('Impossible de récupérer les options de livraison.');
		}
	}

	// Stocker le code du transporteur de l'option sélectionnée
	let selectedCarrierCode = '';

	function chooseShippingOption(chosenOption: any) {
		console.log('🎯 [FRONTEND] Option de livraison sélectionnée:', {
			timestamp: new Date().toISOString(),
			option: {
				id: chosenOption.id,
				carrier: chosenOption.carrierCode,
				type: chosenOption.type,
				price: chosenOption.price,
				product: chosenOption.productName
			},
			rawOption: chosenOption // Log complet pour debug
		});

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
		const isServicePoint = chosenOption?.type === 'service_point'; // Nouvelle structure : option.type

		console.log('🔄 [FRONTEND] Traitement de l\'option:', {
			timestamp: new Date().toISOString(),
			is_service_point: isServicePoint,
			carrier_code: carrierCode,
			shipping_cost: shippingCost
		});

		// ✅ TOUJOURS réinitialiser le point relais sélectionné lors du changement d'option
		selectedPoint = null;

		if (isServicePoint && carrierCode) {
			console.log('📍 [FRONTEND] Option point relais - récupération des points:', {
				timestamp: new Date().toISOString(),
				carrier: carrierCode
			});
			
			// Stocker le code du transporteur pour validation
			selectedCarrierCode = carrierCode;
			// On affiche la carte et on récupère les points relais
			showMap = true;
			// ✅ Vider la liste des points relais avant de récupérer les nouveaux
			servicePoints = [];
			fetchServicePoints(carrierCode);
		} else {
			console.log('🏠 [FRONTEND] Option livraison domicile:', {
				timestamp: new Date().toISOString()
			});
			
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
			isLoadingServicePoints = true; // ✅ Début du chargement
			
			console.log('📍 [FRONTEND SHIPPO] Demande de points relais:', {
				timestamp: new Date().toISOString(),
				carrier: carrierCode,
				address: {
					country: selectedAddress.stateLetter,
					postal: selectedAddress.zip
				}
			});
			
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

			console.log('📡 [FRONTEND SHIPPO] Réponse points relais:', {
				timestamp: new Date().toISOString(),
				status: res.status,
				ok: res.ok
			});

			if (!res.ok) {
				const errorText = await res.text().catch(() => 'Erreur inconnue');
				console.error('❌ [FRONTEND SHIPPO] Erreur points relais:', errorText);
				throw new Error('Erreur de récupération des points relais');
			}
			
			const data = await res.json();

			// Stocker les points relais reçus
			servicePoints = data;
			
			console.log('✅ [FRONTEND SHIPPO] Points relais reçus:', {
				timestamp: new Date().toISOString(),
				count: servicePoints.length,
				carrier: carrierCode
			});

			if (!servicePoints.length) {
				toast.error('Aucun point relais trouvé pour ce transporteur.');
			}
		} catch (err) {
			console.error('❌ [FRONTEND SHIPPO] Erreur fetchServicePoints:', err);
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
		console.log('🔄 changeQuantity appelée:', { productId, quantity, customId });
		console.log('📦 Avant mise à jour - Store:', $cartStore.items);
		
		updateCartItemQuantity(productId, quantity, customId);
		
		console.log('📦 Après mise à jour - Store:', $cartStore.items);
		console.log('💰 Nouveau sous-total:', $cartStore.subtotal);
		console.log('🧾 Nouvelle TVA:', $cartStore.tax);
		
		// Recharger les options de livraison après changement de quantité
		if (selectedAddressId && !hasCustomItems) {
			resetShippingState();
			fetchShippoShippingOptions();
		}
	}



	function handleCheckout(event: Event) {
		console.log('🚀 [SUPERFORM] handleCheckout appelé:', {
			timestamp: new Date().toISOString(),
			event: event.type,
			target: event.target,
			selectedAddressId,
			selectedShippingOption,
			showMap,
			selectedPoint,
			hasCustomItems,
			shippingCost,
			createPaymentData: $createPaymentData
		});

		// Validation avant soumission
		if (!selectedAddressId) {
			console.log('❌ [SUPERFORM] Validation échouée: Pas d\'adresse sélectionnée');
			toast.error('Veuillez choisir une adresse.');
			return false;
		}
		// Pour les commandes personnalisées, on accepte 'no_shipping' comme option valide
		if (!selectedShippingOption && !hasCustomItems) {
			console.log('❌ [SUPERFORM] Validation échouée: Pas d\'option de livraison sélectionnée');
			toast.error('Veuillez choisir un mode de livraison.');
			return false;
		}

		// Vérification si un point relais est requis
		if (showMap && !selectedPoint && !hasCustomItems) {
			console.log('❌ [SUPERFORM] Validation échouée: Point relais requis mais non sélectionné');
			toast.error('Veuillez sélectionner un point relais.');
			return false;
		}

		// Mise à jour des données du superform
		$createPaymentData.shippingCost = shippingCost.toString();
		$createPaymentData.shippingOption = selectedShippingOption;
		$createPaymentData.shippingCarrier = selectedShippingCarrier || '';
		
		// Conversion des coordonnées en strings si nécessaire
		if (selectedPoint) {
			$createPaymentData.servicePointLatitude = selectedPoint.latitude.toString();
			$createPaymentData.servicePointLongitude = selectedPoint.longitude.toString();
		}

		console.log('✅ [SUPERFORM] Validation OK, données mises à jour:', {
			shippingCost: $createPaymentData.shippingCost,
			shippingOption: $createPaymentData.shippingOption,
			orderId: $createPaymentData.orderId,
			addressId: $createPaymentData.addressId,
			servicePointLatitude: $createPaymentData.servicePointLatitude,
			servicePointLongitude: $createPaymentData.servicePointLongitude,
			selectedPoint: selectedPoint
		});

		// Si tout est OK, on peut procéder au checkout
		console.log('✅ [SUPERFORM] Validation OK, soumission du formulaire...');
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
						{quantityOptions}
						{customQuantityOptions}
						{totalNonCustomQuantity}
						{canAddQuantity}
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
									onsubmit={(e) => {
										console.log('🎯 [FORM] Formulaire soumis:', {
											timestamp: new Date().toISOString(),
											event: e,
											formData: new FormData(e.target as HTMLFormElement)
										});
										return handleCheckout(e);
									}}
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

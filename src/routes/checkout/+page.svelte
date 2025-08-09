<script lang="ts">
	import maplibregl from 'maplibre-gl';
	import { MapLibre, Marker, Popup } from 'svelte-maplibre-gl';
	import * as Popover from '$shadcn/popover/index.js';
	import * as Command from '$shadcn/command/index.js';
	import * as Card from '$shadcn/card/index.js';
	import { loadStripe } from '@stripe/stripe-js';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import SmoothScrollBar from '$lib/components/smoothScrollBar/SmoothScrollBar.svelte';
	import {
		Package,
		MapPin,
		CreditCard,
		ShoppingCart,
		Trash,
		Check,
		ChevronsUpDown
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
	import { tick } from 'svelte';
	
	let { data } = $props();

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

	// Options de quantité pour les articles non-personnalisés (comme dans Cart.svelte)
	let quantityOptions = $state([24, 48, 72]);

	// Options de quantité pour les articles personnalisés (comme dans Cart.svelte)  
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

	// Fonction pour vérifier si on peut ajouter une quantité (comme dans Cart.svelte)
	function canAddQuantity(newQuantity: number, currentQuantity: number, isCustom: boolean): boolean {
		if (isCustom) return true; // Pas de limite pour les personnalisées
		
		const otherItemsQuantity = totalNonCustomQuantity - currentQuantity;
		return (otherItemsQuantity + newQuantity) <= 72;
	}

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

	let totalTTC = $derived($cartStore.subtotal + $cartStore.tax + shippingCost);
	let addressOpen = $state(false);
	let addressTriggerRef = $state<HTMLButtonElement>(null!);

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

	/* Selected address prettified for the trigger button */
	const addressLabel = $derived(
		selectedAddressObj
			? `${selectedAddressObj.first_name} ${selectedAddressObj.last_name} — ${selectedAddressObj.street}, ${selectedAddressObj.city}`
			: 'Sélectionnez une adresse…'
	);

	/** Closes the popover and restores focus (a11y) */
	function closeAddressPopover() {
		addressOpen = false;
		tick().then(() => addressTriggerRef?.focus());
	}

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

		// Ne pas récupérer les options de livraison si la commande contient des personnalisations
		if (!hasCustomItems) {
			fetchSendcloudShippingOptions();
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
			//console.log(selectedAddressObj, 'selectedAddressObj');

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
				//console.log('Options de livraison reçues:', shippingOptions);
			}
		} catch (err) {
			console.error('❌ Erreur API Sendcloud:', err);
			toast.error('Impossible de récupérer les options de livraison.');
		}
	}

	function chooseShippingOption(chosenOption: any) {
		//console.log('Option choisie:', chosenOption);

		selectedShippingOption = chosenOption.code;

		const costHT = parseFloat(chosenOption.quotes?.[0]?.price?.total?.value || 0);
		setShippingCostHT(costHT);

		if (chosenOption?.quotes?.[0]?.price?.total?.value) {
			shippingCost = parseFloat(chosenOption.quotes[0].price.total.value);
		} else {
			shippingCost = 0;
		}

		const carrierCode = chosenOption?.carrier?.code;
		// Vérifier si c'est un point relais
		const isServicePoint = chosenOption?.functionalities?.last_mile === 'service_point';

		if (isServicePoint && carrierCode) {
			// On affiche la carte et on récupère les points relais
			showMap = true;
			fetchServicePoints(carrierCode);
		} else {
			// Si ce n'est pas un point relais, on masque la carte et on reset les données du point
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
			//console.log('✅ Points relais reçus:', servicePoints);

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

	function changeQuantity(productId: string, quantity: number, customId?: string) {
		updateCartItemQuantity(productId, quantity, customId);
	}



	function handleCheckout(event: Event) {
		// Empêche le comportement par défaut de la soumission
		event.preventDefault();

		if (!selectedAddressId) {
			toast.error('Veuillez choisir une adresse.');
			return;
		}
		// Pour les commandes personnalisées, on accepte 'no_shipping' comme option valide
		if (!selectedShippingOption && !hasCustomItems) {
			toast.error('Veuillez choisir un mode de livraison.');
			return;
		}

		// Vérification si un point relais est requis
		if (showMap && !selectedPoint && !hasCustomItems) {
			toast.error('Veuillez sélectionner un point relais.');
			return;
		}

		// Mise à jour des données du superform
		$createPaymentData.shippingCost = shippingCost.toString();
		$createPaymentData.shippingOption = selectedShippingOption;

		// console.log(
		// 	'Checkout avec option de livraison:',
		// 	selectedShippingOption,
		// 	'coût:',
		// 	shippingCost
		// );
	}

	$effect(() => {
		$createPaymentData.orderId = data.pendingOrder.id;
		if (selectedAddressId) {
			$createPaymentData.addressId = selectedAddressId;
		}
	});
</script>

<div class="min-h-screen w-[100vw]">
	<SmoothScrollBar>
		<div class="container mx-auto px-4 py-8 max-w-7xl">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-[100px]">
				<!-- Section Adresse -->
				<div class="space-y-6">
					<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
						<div class="p-6 flex flex-col space-y-1.5">
							<h3
								class="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2"
							>
								<MapPin class="w-5 h-5" />
								Adresse de livraison
							</h3>
						</div>
						<div class="p-6 pt-0">
							<div class="space-y-4">
								{#if data?.addresses?.length > 0}
									<Popover.Root bind:open={addressOpen}>
										<Popover.Trigger bind:ref={addressTriggerRef}>
											{#snippet child({ props })}
												<Button
													variant="outline"
													class="w-full justify-between"
													{...props}
													role="combobox"
													aria-expanded={addressOpen}
													aria-controls="address-combobox"
												>
													{addressLabel}
													<ChevronsUpDown class="opacity-50" />
												</Button>
											{/snippet}
										</Popover.Trigger>

										<Popover.Content class="w-[340px] p-0" id="address-combobox">
											<Command.Root>
												<Command.Input placeholder="Rechercher…" />

												<Command.List>
													<Command.Empty>Aucun résultat.</Command.Empty>

													<Command.Group value="addresses">
														{#each data.addresses as address (address.id)}
															<Command.Item
																value={`${address.first_name} ${address.last_name} ${address.street} ${address.city} ${address.country}`}
																onSelect={() => {
																	selectAddress(address.id);
																	closeAddressPopover();
																}}
																class="flex flex-col items-start px-2 py-1.5 gap-0.5"
															>
																<Check
																	class={`address-${selectedAddressId === address.id ? 'selected' : 'unselected'} ${true ? 'shrink-0' : ''}`}
																/>

																<span class="text-sm">
																	{address.first_name}
																	{address.last_name}
																</span>
																<span class="text-xs text-muted-foreground">
																	{address.street}, {address.city}
																	{address.zip}, {address.country}
																</span>
															</Command.Item>
														{/each}
													</Command.Group>
												</Command.List>
											</Command.Root>
										</Popover.Content>
									</Popover.Root>
								{:else}
									<p class="text-muted-foreground">Aucune adresse renseignée.</p>
								{/if}

								<Button variant="outline" class="w-full">
									<a
										data-sveltekit-preload-data
										href="/auth/settings/address"
										class="flex items-center gap-2"
									>
										<MapPin class="w-4 h-4" />
										Créer une adresse
									</a>
								</Button>
							</div>
						</div>
					</div>

					{#if shippingOptions.length > 0}
						<Card.Root>
							<Card.Header>
								<Card.Title class="flex items-center gap-2">
									<Package class="w-5 h-5" />
									Options de livraison
								</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="space-y-4">
									{#each shippingOptions as option (option.code)}
										<div
											class="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
										>
											<input
												id={option.code}
												type="radio"
												name="shippingOption"
												value={option.code}
												checked={selectedShippingOption === option.code}
												onchange={() => chooseShippingOption(option)}
												class="h-4 w-4 border-primary"
											/>
											<label for={option.code} class="flex-1 cursor-pointer">
												<div class="font-medium">{option.carrier.name}</div>
												<div class="text-sm text-muted-foreground">
													{option.product.name}
												</div>
												<div class="text-sm font-medium mt-1">
													{option.quotes?.[0]?.price?.total?.value
														? option.quotes[0].price.total.value + ' €'
														: 'Prix indisponible'}
												</div>
											</label>
										</div>
									{/each}
								</div>
							</Card.Content>
						</Card.Root>
					{:else if hasCustomItems}
						<Card.Root>
							<Card.Header>
								<Card.Title class="flex items-center gap-2">
									<Package class="w-5 h-5" />
									Livraison - Commandes personnalisées
								</Card.Title>
							</Card.Header>
							<Card.Content>
								<div class="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
									<p class="text-sm text-blue-700 dark:text-blue-300">
										📦 <strong>Commande personnalisée détectée</strong><br/>
										Les commandes avec canettes personnalisées ne nécessitent pas de frais de livraison.
										Votre commande sera traitée sans coût de transport supplémentaire.
									</p>
								</div>
							</Card.Content>
						</Card.Root>
					{/if}
				</div>

				<!-- Colonne de droite - Panier et Paiement -->
				<div class="space-y-6">
					{#if showMap}
						<Card.Root>
							<Card.Header>
								<Card.Title class="flex items-center gap-2">
									<MapPin class="w-5 h-5" />
									Points relais disponibles
								</Card.Title>
							</Card.Header>
							<Card.Content>
								<MapLibre
									class="w-full h-[400px] rounded-lg overflow-hidden"
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
											<!-- Popup à l'intérieur du Marker -->
											<Popup
												class="text-black"
												offset={offsets}
												open={selectedPoint?.id === point.id}
											>
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

								{#if selectedPoint}
									<div class="mt-4 p-4 rounded-lg border bg-accent/50">
										<h3 class="font-semibold mb-2">Point relais sélectionné</h3>
										<p class="text-sm">{selectedPoint.name}</p>
										<p class="text-sm text-muted-foreground">
											{selectedPoint.street}, {selectedPoint.postal_code}
											{selectedPoint.city}
										</p>
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					{/if}
					<Card.Root>
						<div class="p-6 flex flex-col space-y-1.5">
							<h3
								class="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2"
							>
								<ShoppingCart class="w-5 h-5" />
								Votre panier
							</h3>
						</div>
						<div class="p-6 pt-0">
							{#if $cartStore.items.length > 0}
								<div class="space-y-4">
									{#each $cartStore.items as item (item.id)}
										<div class="flex gap-4 p-4 rounded-lg border bg-background">
											<img
												src={(item.custom?.length > 0 && item.custom[0].image) ||
													(Array.isArray(item.product.images)
														? item.product.images[0]
														: item.product.images) ||
													''}
												alt={item.product.name}
												class="w-24 h-24 object-cover rounded-md"
											/>
											<div class="flex-1 space-y-2">
												<div class="flex justify-between">
													<h3 class="font-medium">{item.product.name}</h3>
													<button
														onclick={() => handleRemoveFromCart(item.product.id)}
														class="text-destructive hover:text-destructive/80"
													>
														<Trash class="w-4 h-4" />
													</button>
												</div>
												<p class="text-sm text-muted-foreground">
													{#if item.custom?.length > 0}
														{getCustomCanPrice(item.quantity).toFixed(2)}€ l'unité
													{:else}
														{item.product.price.toFixed(2)}€ l'unité
													{/if}
												</p>

												{#if item.custom?.length > 0}
													<!-- Custom items: Use predefined quantity options -->
													<div class="flex gap-2 flex-wrap">
														{#each customQuantityOptions as option}
															<button
																class="px-3 py-1 border rounded text-sm {item.quantity === option.value ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600'}"
																onclick={() => changeQuantity(item.product.id, option.value, item.custom[0]?.id)}
															>
																{option.value}
															</button>
														{/each}
													</div>
												{:else}
													<!-- Non-custom items: Use buttons with quantity limit -->
													<div class="flex gap-2">
														{#each quantityOptions as option}
															<button
																class="px-3 py-1 border rounded text-sm {item.quantity === option ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600'} {!canAddQuantity(option, item.quantity, false) ? 'opacity-50 cursor-not-allowed' : ''}"
																onclick={() => canAddQuantity(option, item.quantity, false) && changeQuantity(item.product.id, option)}
																disabled={!canAddQuantity(option, item.quantity, false)}
															>
																{option}
															</button>
														{/each}
													</div>
													{#if totalNonCustomQuantity > 72}
														<p class="text-xs text-red-500 mt-1">Limite de 72 unités atteinte pour les commandes non-personnalisées</p>
													{/if}
												{/if}

												<p class="text-right font-medium">
													{#if item.custom?.length > 0}
														{(getCustomCanPrice(item.quantity) * item.quantity).toFixed(2)}€
													{:else}
														{(item.price * item.quantity).toFixed(2)}€
													{/if}
												</p>
											</div>
										</div>
									{/each}
								</div>

								<div class="mt-6 space-y-4 rounded-lg border p-4 bg-muted/50">
									<div class="flex justify-between text-sm">
										<span>Sous-total (HT)</span>
										<span>{$cartStore.subtotal.toFixed(2)}€</span>
									</div>
									<div class="flex justify-between text-sm">
										<span>Livraison</span>
										<span>
											{hasCustomItems 
												? 'Gratuit (commande personnalisée)'
												: shippingCost > 0
													? shippingCost.toFixed(2) + '€'
													: selectedShippingOption
														? 'En cours...'
														: 'Non sélectionné'}
										</span>
									</div>
									<div class="flex justify-between text-sm">
										<span>TVA (5,5%)</span>
										<span>{$cartStore.tax.toFixed(2)}€</span>
									</div>
									<div class="flex justify-between text-lg font-semibold pt-2 border-t">
										<span>Total TTC</span>
										<span>{totalTTC.toFixed(2)}€</span>
									</div>
								</div>

								<form
									method="POST"
									action="?/checkout"
									use:createPaymentEnhance
									onsubmit={handleCheckout}
									class="mt-6"
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
							{:else}
								<div class="text-center py-8">
									<ShoppingCart class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
									<p class="text-muted-foreground">Votre panier est vide.</p>
								</div>
							{/if}
						</div>
					</Card.Root>
				</div>
			</div>
		</div>
	</SmoothScrollBar>
</div>

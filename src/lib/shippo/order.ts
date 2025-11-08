import { createShippoClientFromEnv } from './client';
import { SHIPPO_CONFIG } from './config';
import type { Transaction } from '@prisma/client';
import { prisma } from '$lib/server';

/**
 * Cache pour les carrier accounts (évite de les récupérer à chaque fois)
 */
let carrierAccountsCache: Map<string, string> | null = null;
let carrierAccountsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère l'object_id d'un carrier account (Shippo ou propre)
 */
async function getCarrierAccountId(shippoClient: any, carrier: string): Promise<string | null> {
	// Vérifier le cache
	const now = Date.now();
	if (carrierAccountsCache && (now - carrierAccountsCacheTime) < CACHE_DURATION) {
		const cached = carrierAccountsCache.get(carrier.toLowerCase());
		if (cached) {
			console.log(`✅ [SHIPPO] Utilisation du carrier account ${carrier} en cache:`, cached);
			return cached;
		}
	}

	try {
		console.log(`🔍 [SHIPPO] Récupération des carrier accounts ${carrier}...`);
		const accounts = await shippoClient.getCarrierAccounts();
		
		// Logger tous les carrier accounts disponibles pour debug
		console.log(`📋 [SHIPPO] Carrier accounts disponibles (${accounts.length}):`, 
			accounts.map((acc: any) => ({
				object_id: acc.object_id,
				carrier: acc.carrier,
				active: acc.active,
				is_shippo_account: acc.is_shippo_account
			}))
		);
		
		// Normaliser le nom du carrier recherché
		const normalizedCarrier = carrier.toLowerCase().trim();
		
		// Chercher le compte du carrier (Shippo ou propre) avec plusieurs stratégies
		// 1. Correspondance exacte
		let carrierAccount = accounts.find((acc: any) => 
			acc.carrier?.toLowerCase().trim() === normalizedCarrier && acc.active
		);
		
		// 2. Correspondance partielle (si pas trouvé)
		if (!carrierAccount) {
			carrierAccount = accounts.find((acc: any) => {
				const accCarrier = acc.carrier?.toLowerCase().trim() || '';
				return (accCarrier.includes(normalizedCarrier) || normalizedCarrier.includes(accCarrier)) && acc.active;
			});
		}
		
		// 3. Correspondance avec variantes connues
		if (!carrierAccount) {
			const variants: Record<string, string[]> = {
				'chronopost': ['chronopost', 'chrono', 'chrono_post'],
				'colissimo': ['colissimo', 'colis', 'colis_simo']
			};
			
			const carrierVariants = variants[normalizedCarrier] || [normalizedCarrier];
			carrierAccount = accounts.find((acc: any) => {
				const accCarrier = acc.carrier?.toLowerCase().trim() || '';
				return carrierVariants.some(variant => accCarrier.includes(variant) || variant.includes(accCarrier)) && acc.active;
			});
		}

		if (carrierAccount) {
			// Mettre en cache
			if (!carrierAccountsCache) {
				carrierAccountsCache = new Map();
			}
			carrierAccountsCache.set(carrier.toLowerCase(), carrierAccount.object_id);
			carrierAccountsCacheTime = now;
			
			console.log(`✅ [SHIPPO] Carrier account ${carrier} trouvé:`, {
				object_id: carrierAccount.object_id,
				carrier: carrierAccount.carrier,
				is_shippo_account: carrierAccount.is_shippo_account,
				active: carrierAccount.active
			});
			
			return carrierAccount.object_id;
		}

		console.warn(`⚠️ [SHIPPO] Aucun carrier account ${carrier} actif trouvé parmi ${accounts.length} comptes disponibles`);
		console.warn(`⚠️ [SHIPPO] Comptes actifs disponibles:`, 
			accounts.filter((acc: any) => acc.active).map((acc: any) => acc.carrier)
		);
		return null;
	} catch (error) {
		console.error(`❌ [SHIPPO] Erreur lors de la récupération des carrier accounts ${carrier}:`, error);
		return null;
	}
}

/**
 * Crée directement une étiquette Shippo à partir d'une transaction payée
 * Utilise les données déjà calculées dans la transaction
 */
export async function createShippoLabel(transaction: any) {
	console.log('🏷️ [SHIPPO LABEL] Création de l\'étiquette:', {
		transactionId: transaction.id,
		orderId: transaction.orderId,
		status: transaction.status
	});

	try {
		const shippoClient = createShippoClientFromEnv();
		
		// Utiliser directement les données de la transaction
		console.log('✅ [SHIPPO LABEL] Utilisation des données de la transaction:', {
			shippingCarrier: transaction.shippingCarrier,
			shippingCost: transaction.shippingCost,
			packageDimensions: `${transaction.package_length}x${transaction.package_width}x${transaction.package_height}cm`,
			packageWeight: `${transaction.package_weight}kg`
		});

		// Créer l'adresse expéditeur
		const senderAddress = await shippoClient.createAddress({
			name: SHIPPO_CONFIG.SENDER.name,
			company: SHIPPO_CONFIG.SENDER.company,
			street1: SHIPPO_CONFIG.SENDER.street1,
			city: SHIPPO_CONFIG.SENDER.city,
			state: SHIPPO_CONFIG.SENDER.state,
			zip: SHIPPO_CONFIG.SENDER.zip,
			country: SHIPPO_CONFIG.SENDER.country,
			phone: SHIPPO_CONFIG.SENDER.phone,
			email: SHIPPO_CONFIG.SENDER.email
		});

		console.log('✅ [SHIPPO LABEL] Adresse expéditeur créée:', senderAddress.object_id);

		// Créer l'adresse destinataire avec les données de la transaction
		const recipientAddress = await shippoClient.createAddress({
			name: `${transaction.address_first_name} ${transaction.address_last_name}`,
			company: transaction.address_company || '',
			street1: `${transaction.address_street_number} ${transaction.address_street}`,
			city: transaction.address_city,
			state: transaction.address_state || '',
			zip: transaction.address_zip,
			country: transaction.address_country_code,
			phone: transaction.address_phone || '',
			email: ''
		});

		console.log('✅ [SHIPPO LABEL] Adresse destinataire créée:', recipientAddress.object_id);

		// Créer le colis avec les dimensions de la transaction
		const parcel = await shippoClient.createParcel({
			length: transaction.package_length.toString(),
			width: transaction.package_width.toString(),
			height: transaction.package_height.toString(),
			distance_unit: 'cm' as const,
			weight: transaction.package_weight.toString(),
			mass_unit: 'kg' as const
		});

		console.log('✅ [SHIPPO LABEL] Colis créé:', parcel.object_id);

		// Récupérer le carrier account si nécessaire
		let carrierAccountId: string | null = null;
		if (transaction.shippingCarrier === 'colissimo' || transaction.shippingCarrier === 'chronopost') {
			carrierAccountId = await getCarrierAccountId(shippoClient, transaction.shippingCarrier);
			if (carrierAccountId) {
				console.log(`✅ [SHIPPO LABEL] Utilisation du carrier account ${transaction.shippingCarrier}:`, carrierAccountId);
			} else {
				console.warn(`⚠️ [SHIPPO LABEL] Carrier account ${transaction.shippingCarrier} non trouvé`);
				console.warn(`⚠️ [SHIPPO LABEL] ATTENTION: Pour utiliser ${transaction.shippingCarrier}, vous devez configurer un carrier account dans votre dashboard Shippo.`);
				console.warn(`⚠️ [SHIPPO LABEL] Tentative sans carrier account spécifique (Shippo utilisera ses comptes par défaut si disponibles)`);
			}
		}

		// Créer l'expédition avec le carrier account spécifique si disponible
		const shipmentParams: any = {
			address_from: senderAddress.object_id,
			address_to: recipientAddress.object_id,
			parcels: [parcel.object_id]
		};

		// Si on a un carrier account spécifique, l'utiliser
		if (carrierAccountId) {
			shipmentParams.carrier_accounts = [carrierAccountId];
		}

		const shipment = await shippoClient.createShipment(shipmentParams);

		console.log('✅ [SHIPPO LABEL] Expédition créée:', shipment.object_id);

		// Utiliser directement le tarif sélectionné par l'utilisateur
		console.log('✅ [SHIPPO LABEL] Utilisation du tarif sélectionné:', {
			shippingOption: transaction.shippingOption,
			shippingCarrier: transaction.shippingCarrier,
			shippingCost: transaction.shippingCost
		});

		// Déterminer le nom du service en fonction du type de livraison
		const isHomeDelivery = !transaction.servicePointId || transaction.servicePointId === '' || transaction.servicePointId === 'null';
		let serviceName = '';
		if (transaction.shippingCarrier === 'chronopost') {
			serviceName = isHomeDelivery ? 'Chrono Domicile' : 'Chrono Point Relais';
		} else if (transaction.shippingCarrier === 'colissimo') {
			serviceName = isHomeDelivery ? 'Colissimo Domicile' : 'Point Retrait';
		} else {
			serviceName = isHomeDelivery ? 'Livraison à domicile' : 'Point Retrait';
		}

		// Créer l'objet rate directement avec les données du checkout
		const selectedRate = {
			object_id: transaction.shippingOption, // L'ID du tarif sélectionné par l'utilisateur
			carrier: transaction.shippingCarrier,
			servicelevel: { 
				name: serviceName
			},
			amount: transaction.shippingCost.toString()
		};

		// Ajouter les informations du point de retrait si disponibles
		const pickupPointInfo = {
			servicePointId: transaction.servicePointId || '',
			servicePointPostNumber: transaction.servicePointPostNumber || '',
			servicePointExtraRefCab: transaction.servicePointExtraRefCab || '',
			servicePointExtraShopRef: transaction.servicePointExtraShopRef || ''
		};

		console.log('📍 [SHIPPO LABEL] Informations point de retrait:', {
			...pickupPointInfo,
			hasServicePointId: !!pickupPointInfo.servicePointId && pickupPointInfo.servicePointId !== '',
			isHomeDelivery: !pickupPointInfo.servicePointId || pickupPointInfo.servicePointId === '',
			carrier: transaction.shippingCarrier,
			willAddPickupPoint: !!(pickupPointInfo.servicePointId && 
				pickupPointInfo.servicePointId !== '' && 
				(transaction.shippingCarrier === 'colissimo' || transaction.shippingCarrier === 'chronopost'))
		});

		console.log('✅ [SHIPPO LABEL] Tarif reconstruit:', {
			object_id: selectedRate.object_id,
			carrier: selectedRate.carrier,
			service: selectedRate.servicelevel.name,
			amount: selectedRate.amount
		});

		// Essayer d'abord avec l'object_id du checkout
		let transactionResult;
		try {
			console.log('🔄 [SHIPPO LABEL] Tentative avec l\'object_id du checkout:', selectedRate.object_id);
			
			// Préparer les paramètres de la transaction
			const transactionParams: any = {
				rate: selectedRate.object_id,
				async: false
			};

			// Ajouter les informations du point de retrait pour Colissimo et Chronopost
			const shouldAddPickupPoint = !!(transaction.shippingCarrier === 'colissimo' || transaction.shippingCarrier === 'chronopost') && 
				!!pickupPointInfo.servicePointId && 
				pickupPointInfo.servicePointId !== '';
			
			console.log('🔍 [SHIPPO LABEL] Vérification ajout point de retrait:', {
				carrier: transaction.shippingCarrier,
				hasServicePointId: !!pickupPointInfo.servicePointId && pickupPointInfo.servicePointId !== '',
				servicePointId: pickupPointInfo.servicePointId || '(vide)',
				isColissimoOrChronopost: transaction.shippingCarrier === 'colissimo' || transaction.shippingCarrier === 'chronopost',
				shouldAddPickupPoint: !!shouldAddPickupPoint // S'assurer que c'est un booléen
			});
			
			if (shouldAddPickupPoint) {
				// Pour Colissimo, ajouter le préfixe à l'ID du point de retrait
				let pickupPointId = pickupPointInfo.servicePointId;
				if (transaction.shippingCarrier === 'colissimo') {
					// Pour Colissimo, utiliser le préfixe RC (Relais Colis)
					const prefix = 'RC';
					pickupPointId = `${prefix}${pickupPointInfo.servicePointId}`;
					console.log('🔧 [SHIPPO LABEL] Préfixe Colissimo ajouté:', { original: pickupPointInfo.servicePointId, prefixed: pickupPointId });
				}
				// Pour Chronopost, l'ID est utilisé tel quel (pas de préfixe nécessaire)

				// Construire l'objet pickup_point selon le carrier
				if (transaction.shippingCarrier === 'chronopost') {
					// Pour Chronopost, certains champs peuvent être optionnels
					transactionParams.pickup_point = {
						id: pickupPointId,
						...(pickupPointInfo.servicePointPostNumber && { post_number: pickupPointInfo.servicePointPostNumber }),
						...(pickupPointInfo.servicePointExtraRefCab && { extra_ref_cab: pickupPointInfo.servicePointExtraRefCab }),
						...(pickupPointInfo.servicePointExtraShopRef && { extra_shop_ref: pickupPointInfo.servicePointExtraShopRef })
					};
				} else {
					// Pour Colissimo, tous les champs sont généralement requis
					transactionParams.pickup_point = {
						id: pickupPointId,
						post_number: pickupPointInfo.servicePointPostNumber,
						extra_ref_cab: pickupPointInfo.servicePointExtraRefCab,
						extra_shop_ref: pickupPointInfo.servicePointExtraShopRef
					};
				}
				console.log('📍 [SHIPPO LABEL] Point de retrait ajouté pour', transaction.shippingCarrier, ':', transactionParams.pickup_point);
			}

			transactionResult = await shippoClient.createTransaction(transactionParams);
			
			// Vérifier si la transaction a échoué (même si pas d'exception)
			// Les rates peuvent expirer, donc même si le statut est ERROR, on essaie le fallback
			// pour obtenir un nouveau rate frais
			if (transactionResult.status === 'ERROR') {
				console.warn('⚠️ [SHIPPO LABEL] Transaction échouée avec l\'object_id du checkout, probablement rate expiré, fallback vers les tarifs actuels');
				// Déclencher le fallback pour obtenir un nouveau rate
				throw new Error(`Rate expiré ou invalide: ${transactionResult.messages?.[0]?.text || 'Erreur inconnue'}`);
			}
			
			console.log('✅ [SHIPPO LABEL] Étiquette créée avec l\'object_id du checkout');
		} catch (error) {
			console.warn('⚠️ [SHIPPO LABEL] Object_id du checkout invalide ou expiré, fallback vers les tarifs actuels:', error instanceof Error ? error.message : 'Erreur inconnue');
			
			// Fallback : récupérer les tarifs actuels du shipment et trouver le bon
			console.log('📊 [SHIPPO LABEL] Récupération des tarifs du shipment...');
			const rates = await shippoClient.getShipmentRates(shipment.object_id);
			console.log('📊 [SHIPPO LABEL] Tarifs disponibles pour fallback:', rates.length);
			
			if (rates.length === 0) {
				throw new Error('Aucun tarif disponible pour ce shipment. Vérifiez que les carrier accounts sont correctement configurés dans Shippo.');
			}
			
			// Fonction helper pour détecter le carrier d'un rate
			const detectCarrier = (rate: any): string | null => {
				if (rate.carrier) return rate.carrier.toLowerCase();
				const serviceName = rate.servicelevel?.name?.toLowerCase() || '';
				
				// Détection explicite par mots-clés
				if (serviceName.includes('chrono')) return 'chronopost';
				if (serviceName.includes('colis') || serviceName.includes('colissimo')) return 'colissimo';
				
				// Pour "Domicile" ou "Point Retrait" sans autre indication, utiliser le carrier de la transaction
				// car ces services sont spécifiques à Colissimo en France
				if (serviceName.includes('domicile') || serviceName.includes('point retrait') || serviceName.includes('relais')) {
					// Si le carrier de la transaction est colissimo ou chronopost, l'utiliser
					if (transaction.shippingCarrier === 'colissimo' || transaction.shippingCarrier === 'chronopost') {
						return transaction.shippingCarrier;
					}
					// Par défaut, "Domicile" et "Point Retrait" sont généralement Colissimo
					if (serviceName.includes('domicile') || serviceName.includes('point retrait')) {
						return 'colissimo';
					}
					// "Relais" peut être Chronopost
					if (serviceName.includes('relais')) {
						return 'chronopost';
					}
				}
				
				return null;
			};

			// Fonction helper pour détecter le type de livraison d'un rate
			const detectDeliveryType = (rate: any): 'home_delivery' | 'service_point' | null => {
				const serviceName = rate.servicelevel?.name?.toLowerCase() || '';
				if (serviceName.includes('point retrait') || serviceName.includes('relais') || serviceName.includes('point relais')) {
					return 'service_point';
				}
				if (serviceName.includes('domicile') || serviceName.includes('home') || serviceName.includes('chrono 10') || serviceName.includes('chrono 13') || serviceName.includes('chrono 18')) {
					return 'home_delivery';
				}
				return null;
			};

			// Déterminer le type de livraison attendu depuis la transaction
			const expectedDeliveryType = pickupPointInfo.servicePointId && pickupPointInfo.servicePointId !== ''
				? 'service_point'
				: 'home_delivery';

			console.log('🔍 [SHIPPO LABEL] Type de livraison attendu:', {
				expectedDeliveryType,
				hasServicePoint: !!(pickupPointInfo.servicePointId && pickupPointInfo.servicePointId !== '')
			});

			let fallbackRate = rates.find((rate: any) => {
				const rateCarrier = detectCarrier(rate);
				const rateDeliveryType = detectDeliveryType(rate);
				const carrierMatch = rateCarrier === transaction.shippingCarrier;
				const deliveryTypeMatch = rateDeliveryType === expectedDeliveryType;
				const priceMatch = Math.abs(parseFloat(rate.amount) - parseFloat(transaction.shippingCost)) < 0.01;
				
				return carrierMatch && deliveryTypeMatch && priceMatch;
			});

			if (!fallbackRate) {
				console.warn('⚠️ [SHIPPO LABEL] Aucun tarif correspondant trouvé, recherche par transporteur et type uniquement');
				fallbackRate = rates.find((rate: any) => {
					const rateCarrier = detectCarrier(rate);
					const rateDeliveryType = detectDeliveryType(rate);
					return rateCarrier === transaction.shippingCarrier && rateDeliveryType === expectedDeliveryType;
				});
			}

			if (!fallbackRate) {
				console.warn('⚠️ [SHIPPO LABEL] Aucun tarif du transporteur et type trouvé, recherche par transporteur uniquement (sans type)');
				// Essayer de trouver un rate du même carrier, même si le type ne correspond pas exactement
				fallbackRate = rates.find((rate: any) => {
					const rateCarrier = detectCarrier(rate);
					return rateCarrier === transaction.shippingCarrier;
				});
			}

			if (!fallbackRate) {
				console.warn('⚠️ [SHIPPO LABEL] Aucun tarif du transporteur trouvé, recherche par type uniquement');
				// Dernier recours : chercher par type uniquement
				fallbackRate = rates.find((rate: any) => {
					const rateDeliveryType = detectDeliveryType(rate);
					return rateDeliveryType === expectedDeliveryType;
				});
			}

			if (!fallbackRate) {
				console.warn('⚠️ [SHIPPO LABEL] Aucun tarif du type trouvé, utilisation du moins cher du transporteur et type');
				// Filtrer d'abord par carrier ET type, puis prendre le moins cher
				const ratesOfCarrierAndType = rates.filter((rate: any) => {
					const rateCarrier = detectCarrier(rate);
					const rateDeliveryType = detectDeliveryType(rate);
					return rateCarrier === transaction.shippingCarrier && rateDeliveryType === expectedDeliveryType;
				});
				
				if (ratesOfCarrierAndType.length > 0) {
					fallbackRate = ratesOfCarrierAndType.reduce((cheapest: any, current: any) => 
						parseFloat(current.amount) < parseFloat(cheapest.amount) ? current : cheapest
					);
				} else {
					// Filtrer par carrier uniquement
					const ratesOfCarrier = rates.filter((rate: any) => {
						const rateCarrier = detectCarrier(rate);
						return rateCarrier === transaction.shippingCarrier;
					});
					
					if (ratesOfCarrier.length > 0) {
						console.warn('⚠️ [SHIPPO LABEL] Utilisation du moins cher du transporteur (type différent)');
						fallbackRate = ratesOfCarrier.reduce((cheapest: any, current: any) => 
							parseFloat(current.amount) < parseFloat(cheapest.amount) ? current : cheapest
						);
					} else {
						// Dernier recours : prendre le moins cher du type attendu
						console.warn('⚠️ [SHIPPO LABEL] Utilisation du moins cher du type attendu');
						const ratesOfExpectedType = rates.filter((rate: any) => {
							const rateDeliveryType = detectDeliveryType(rate);
							return rateDeliveryType === expectedDeliveryType;
						});
						
						if (ratesOfExpectedType.length > 0) {
							fallbackRate = ratesOfExpectedType.reduce((cheapest: any, current: any) => 
								parseFloat(current.amount) < parseFloat(cheapest.amount) ? current : cheapest
							);
						} else {
							// Dernier recours absolu : prendre le moins cher de tous
							console.warn('⚠️ [SHIPPO LABEL] Utilisation du moins cher de tous');
							fallbackRate = rates.reduce((cheapest: any, current: any) => 
								parseFloat(current.amount) < parseFloat(cheapest.amount) ? current : cheapest
							);
						}
					}
				}
			}

			console.log('🔄 [SHIPPO LABEL] Utilisation du tarif fallback:', {
				object_id: fallbackRate.object_id,
				carrier: fallbackRate.carrier,
				service: fallbackRate.servicelevel?.name,
				amount: fallbackRate.amount
			});

			// Préparer les paramètres de la transaction avec le point de retrait si nécessaire
			const fallbackTransactionParams: any = {
				rate: fallbackRate.object_id,
				async: false
			};

			// Déterminer le carrier réel du rate fallback en utilisant la même fonction
			const fallbackCarrier = detectCarrier(fallbackRate) || transaction.shippingCarrier;

			console.log('🔍 [SHIPPO LABEL] Carrier du rate fallback:', {
				rateCarrier: fallbackRate.carrier,
				detectedCarrier: fallbackCarrier,
				transactionCarrier: transaction.shippingCarrier
			});

			// Ajouter les informations du point de retrait seulement si le rate supporte les points de retrait
			// et si on a un point de retrait dans les données
			const shouldAddPickupPointFallback = !!(pickupPointInfo.servicePointId && 
				pickupPointInfo.servicePointId !== '' &&
				(fallbackCarrier === 'colissimo' || fallbackCarrier === 'chronopost'));
			
			console.log('🔍 [SHIPPO LABEL] Vérification ajout point de retrait (fallback):', {
				fallbackCarrier,
				hasServicePointId: !!pickupPointInfo.servicePointId && pickupPointInfo.servicePointId !== '',
				servicePointId: pickupPointInfo.servicePointId || '(vide)',
				isColissimoOrChronopost: fallbackCarrier === 'colissimo' || fallbackCarrier === 'chronopost',
				shouldAddPickupPointFallback: !!shouldAddPickupPointFallback // S'assurer que c'est un booléen
			});
			
			if (shouldAddPickupPointFallback) {
				let pickupPointId = pickupPointInfo.servicePointId;
				if (fallbackCarrier === 'colissimo') {
					const prefix = 'RC';
					pickupPointId = `${prefix}${pickupPointInfo.servicePointId}`;
					console.log('🔧 [SHIPPO LABEL] Préfixe Colissimo ajouté (fallback):', { original: pickupPointInfo.servicePointId, prefixed: pickupPointId });
				}
				// Pour Chronopost, l'ID est utilisé tel quel (pas de préfixe nécessaire)

				// Construire l'objet pickup_point selon le carrier
				if (fallbackCarrier === 'chronopost') {
					// Pour Chronopost, certains champs peuvent être optionnels
					fallbackTransactionParams.pickup_point = {
						id: pickupPointId,
						...(pickupPointInfo.servicePointPostNumber && { post_number: pickupPointInfo.servicePointPostNumber }),
						...(pickupPointInfo.servicePointExtraRefCab && { extra_ref_cab: pickupPointInfo.servicePointExtraRefCab }),
						...(pickupPointInfo.servicePointExtraShopRef && { extra_shop_ref: pickupPointInfo.servicePointExtraShopRef })
					};
				} else {
					// Pour Colissimo, tous les champs sont généralement requis
					fallbackTransactionParams.pickup_point = {
						id: pickupPointId,
						post_number: pickupPointInfo.servicePointPostNumber,
						extra_ref_cab: pickupPointInfo.servicePointExtraRefCab,
						extra_shop_ref: pickupPointInfo.servicePointExtraShopRef
					};
				}
				console.log('📍 [SHIPPO LABEL] Point de retrait ajouté pour fallback:', fallbackTransactionParams.pickup_point);
			} else if (pickupPointInfo.servicePointId) {
				console.warn('⚠️ [SHIPPO LABEL] Point de retrait disponible mais carrier du rate ne le supporte pas:', {
					fallbackCarrier,
					hasPickupPoint: !!pickupPointInfo.servicePointId
				});
			}

			transactionResult = await shippoClient.createTransaction(fallbackTransactionParams);
			
			// Vérifier immédiatement si le fallback a aussi échoué
			if (transactionResult.status === 'ERROR') {
				console.error('❌ [SHIPPO LABEL] Erreur lors de la création de l\'étiquette (fallback):', {
					messages: transactionResult.messages,
					rate: transactionResult.rate,
					carrier: transaction.shippingCarrier,
					hasPickupPoint: !!(pickupPointInfo.servicePointId && pickupPointInfo.servicePointId !== '')
				});

				// Vérifier si c'est une erreur de credentials
				const hasCredentialError = transactionResult.messages?.some((msg: any) => 
					msg.text?.toLowerCase().includes('identifiant') || 
					msg.text?.toLowerCase().includes('mot de passe') || 
					msg.text?.toLowerCase().includes('apikey') ||
					msg.text?.toLowerCase().includes('api key') ||
					msg.code === '10'
				);

				// Vérifier si c'est une erreur de point de retrait
				const hasPickupPointError = transactionResult.messages?.some((msg: any) => 
					msg.text?.toLowerCase().includes('pickup point') ||
					msg.text?.toLowerCase().includes('point retrait') ||
					msg.text?.toLowerCase().includes('invalid') ||
					msg.text?.toLowerCase().includes('prefix')
				);

				// Vérifier si c'est une erreur de service
				const hasServiceError = transactionResult.messages?.some((msg: any) => 
					msg.text?.toLowerCase().includes('service was failed') ||
					msg.text?.toLowerCase().includes('shipping service')
				);

				if (hasCredentialError) {
					const errorMessage = `Erreur de configuration du carrier account ${transaction.shippingCarrier}: Les credentials (identifiant/mot de passe ou apiKey) ne sont pas configurés dans votre compte Shippo. Veuillez configurer le carrier account ${transaction.shippingCarrier} dans le dashboard Shippo avec les bonnes credentials.`;
					console.error('❌ [SHIPPO LABEL]', errorMessage);
					throw new Error(errorMessage);
				}

				if (hasPickupPointError && pickupPointInfo.servicePointId) {
					const errorMessage = `Erreur avec le point de retrait ${transaction.shippingCarrier}: Le format du point de retrait n'est pas valide. Vérifiez que les informations du point de retrait sont correctes.`;
					console.error('❌ [SHIPPO LABEL]', errorMessage);
					throw new Error(errorMessage);
				}

				if (hasServiceError) {
					// Vérifier si c'est dû à un carrier account manquant
					const carrierAccountId = await getCarrierAccountId(shippoClient, transaction.shippingCarrier);
					if (!carrierAccountId) {
						const errorMessage = `Erreur avec le service ${transaction.shippingCarrier}: Aucun carrier account ${transaction.shippingCarrier} n'est configuré dans votre compte Shippo. Veuillez configurer un carrier account ${transaction.shippingCarrier} dans le dashboard Shippo avec vos credentials (identifiant/mot de passe ou API key). Sans carrier account configuré, Shippo ne peut pas créer d'étiquettes pour ${transaction.shippingCarrier}.`;
						console.error('❌ [SHIPPO LABEL]', errorMessage);
						throw new Error(errorMessage);
					}
					
					const errorMessage = `Erreur avec le service ${transaction.shippingCarrier}: Le service de livraison a échoué. Cela peut être dû à un rate expiré, des credentials invalides ou manquants dans le carrier account, ou un problème de configuration. Vérifiez votre compte Shippo et les credentials du carrier account ${transaction.shippingCarrier}.`;
					console.error('❌ [SHIPPO LABEL]', errorMessage);
					throw new Error(errorMessage);
				}

				// Erreur générique
				const errorMessages = transactionResult.messages?.map((msg: any) => msg.text).join(', ') || 'Erreur inconnue';
				throw new Error(`Erreur lors de la création de l'étiquette ${transaction.shippingCarrier}: ${errorMessages}`);
			}
		}

		console.log('🏷️ [SHIPPO LABEL] Étiquette créée:', {
			transactionId: transactionResult.object_id,
			labelUrl: transactionResult.label_url,
			trackingNumber: transactionResult.tracking_number,
			status: transactionResult.status
		});

		// Debug détaillé si erreur
		if (transactionResult.status && transactionResult.status !== 'SUCCESS') {
			console.error('❌ [SHIPPO LABEL] Détails de l\'erreur:', {
				messages: transactionResult.messages,
				label_file_type: transactionResult.label_file_type,
				metadata: transactionResult.metadata,
				rate: transactionResult.rate,
				tracking_status: transactionResult.tracking_status,
				tracking_url_provider: transactionResult.tracking_url_provider
			});

			// Vérifier si c'est une erreur de credentials
			const hasCredentialError = transactionResult.messages?.some((msg: any) => 
				msg.text?.toLowerCase().includes('identifiant') || 
				msg.text?.toLowerCase().includes('mot de passe') || 
				msg.text?.toLowerCase().includes('apikey') ||
				msg.text?.toLowerCase().includes('api key') ||
				msg.code === '10'
			);

			if (hasCredentialError) {
				const errorMessage = `Erreur de configuration du carrier account ${transaction.shippingCarrier}: Les credentials (identifiant/mot de passe ou apiKey) ne sont pas configurés dans votre compte Shippo. Veuillez configurer le carrier account ${transaction.shippingCarrier} dans le dashboard Shippo avec les bonnes credentials.`;
				console.error('❌ [SHIPPO LABEL]', errorMessage);
				throw new Error(errorMessage);
			}
		}

		return {
			success: true,
			shippoTransactionId: transactionResult.object_id,
			labelUrl: transactionResult.label_url || '',
			trackingNumber: transactionResult.tracking_number || '',
			carrier: selectedRate.carrier,
			service: selectedRate.servicelevel?.name,
			shippingCost: selectedRate.amount,
			status: transactionResult.status
		};

	} catch (error) {
		console.error('❌ [SHIPPO LABEL] Erreur lors de la création:', error);
		throw error;
	}
}

/**
 * Crée une commande Shippo à partir d'une transaction payée (DEPRECATED)
 * @deprecated Utiliser createShippoLabel à la place
 */
export async function createShippoOrder(transaction: any) {
	console.log('🚀 [SHIPPO ORDER] Création de la commande:', {
		transactionId: transaction.id,
		orderId: transaction.orderId,
		status: transaction.status
	});

	try {
		const shippoClient = createShippoClientFromEnv();
		
		// Récupérer les données de la commande depuis la base de données
		const order = await getOrderDetails(transaction.orderId);
		if (!order) {
			throw new Error(`Commande ${transaction.orderId} introuvable`);
		}

		// Créer l'adresse expéditeur
		const senderAddress = await shippoClient.createAddress({
			name: SHIPPO_CONFIG.SENDER.name,
			company: SHIPPO_CONFIG.SENDER.company,
			street1: SHIPPO_CONFIG.SENDER.street1,
			city: SHIPPO_CONFIG.SENDER.city,
			state: SHIPPO_CONFIG.SENDER.state,
			zip: SHIPPO_CONFIG.SENDER.zip,
			country: SHIPPO_CONFIG.SENDER.country,
			phone: SHIPPO_CONFIG.SENDER.phone,
			email: SHIPPO_CONFIG.SENDER.email
		});

		console.log('✅ [SHIPPO ORDER] Adresse expéditeur créée:', senderAddress.object_id);

		// Créer l'adresse destinataire
		const recipientAddress = await shippoClient.createAddress({
			name: order.address.name,
			company: order.address.company || '',
			street1: order.address.street,
			city: order.address.city,
			state: order.address.state || '',
			zip: order.address.zip,
			country: order.address.country,
			phone: order.address.phone || '',
			email: order.address.email || ''
		});

		console.log('✅ [SHIPPO ORDER] Adresse destinataire créée:', recipientAddress.object_id);

		// Calculer le poids de la commande
		const calculatedWeight = order.items.reduce((total: number, item: any) => {
			const itemWeight = item.weight || 0.125; // 125g par défaut par item
			return total + (itemWeight * item.quantity);
		}, 0);
		
		console.log('📦 [SHIPPO ORDER] Poids calculé:', {
			calculatedWeight,
			orderItems: order.items.map(item => ({
				quantity: item.quantity,
				weight: item.weight,
				name: item.name
			}))
		});

		// Dimensions simples selon le poids
		let dimensions;
		if (calculatedWeight <= 3) {
			dimensions = { length: 40, width: 30, height: 20 };
		} else if (calculatedWeight <= 6) {
			dimensions = { length: 50, width: 40, height: 30 };
		} else {
			dimensions = { length: 60, width: 50, height: 40 };
		}
		
		console.log('📦 [SHIPPO ORDER] Emballage sélectionné:', {
			dimensions: `${dimensions.length}x${dimensions.width}x${dimensions.height}cm`,
			weight: `${calculatedWeight}kg`,
			method: 'Simple Package Selection',
			carrier: 'auto'
		});
		
		const parcel = await shippoClient.createParcel({
			length: dimensions.length,
			width: dimensions.width,
			height: dimensions.height,
			distance_unit: 'cm' as const,
			weight: calculatedWeight,
			mass_unit: 'kg' as const
		});

		console.log('✅ [SHIPPO ORDER] Colis créé:', parcel.object_id);

		// Créer l'expédition
		const shipment = await shippoClient.createShipment({
			address_from: senderAddress.object_id,
			address_to: recipientAddress.object_id,
			parcels: [parcel.object_id]
		});

		console.log('✅ [SHIPPO ORDER] Expédition créée:', shipment.object_id);

		// Récupérer les tarifs disponibles
		const rates = shipment.rates || [];
		console.log('📊 [SHIPPO ORDER] Tarifs disponibles:', rates.length);
		
		// Log détaillé de tous les tarifs pour debug
		console.log('🔍 [SHIPPO ORDER] Détail des tarifs:', rates.map((rate: any) => ({
			object_id: rate.object_id,
			carrier: rate.carrier,
			service: rate.servicelevel?.name,
			amount: rate.amount,
			attributes: rate.attributes
		})));
		
		// Trouver le tarif correspondant aux informations de la commande
		console.log('✅ [SHIPPO ORDER] Recherche du tarif correspondant:', {
			shippingCarrier: order.shippingCarrier,
			shippingCost: order.shippingCost,
			tarifsDisponibles: rates.length
		});

		// Chercher le tarif qui correspond au transporteur et au prix de la commande
		let selectedRate = rates.find((rate: any) => {
			// Correspondance par transporteur (même si carrier est undefined)
			const carrierMatch = rate.carrier === order.shippingCarrier || 
				(order.shippingCarrier === 'chronopost' && rate.servicelevel?.name?.toLowerCase().includes('chrono')) ||
				(order.shippingCarrier === 'colissimo' && rate.servicelevel?.name?.toLowerCase().includes('colis')) ||
				(order.shippingCarrier === 'colissimo' && rate.servicelevel?.name?.toLowerCase().includes('point retrait'));
			
			// Correspondance par prix (tolérance de 0.01€)
			const priceMatch = Math.abs(parseFloat(rate.amount) - (order.shippingCost || 0)) < 0.01;
			
			console.log(`🔍 [SHIPPO ORDER] Test tarif ${rate.object_id}:`, {
				carrier: rate.carrier,
				service: rate.servicelevel?.name,
				amount: rate.amount,
				carrierMatch,
				priceMatch,
				commandeCarrier: order.shippingCarrier,
				commandePrix: order.shippingCost
			});
			
			return carrierMatch && priceMatch;
		});

		if (!selectedRate) {
			console.warn('⚠️ [SHIPPO ORDER] Tarif exact non trouvé, recherche par transporteur uniquement');
			// Fallback : chercher par transporteur uniquement
			selectedRate = rates.find((rate: any) => {
				const carrierMatch = rate.carrier === order.shippingCarrier || 
					(order.shippingCarrier === 'chronopost' && rate.servicelevel?.name?.toLowerCase().includes('chrono')) ||
					(order.shippingCarrier === 'colissimo' && rate.servicelevel?.name?.toLowerCase().includes('colis')) ||
					(order.shippingCarrier === 'colissimo' && rate.servicelevel?.name?.toLowerCase().includes('point retrait'));
				
				console.log(`🔍 [SHIPPO ORDER] Test transporteur ${rate.object_id}:`, {
					carrier: rate.carrier,
					service: rate.servicelevel?.name,
					carrierMatch
				});
				
				return carrierMatch;
			});
		}

		if (!selectedRate) {
			console.warn('⚠️ [SHIPPO ORDER] Aucun tarif trouvé, utilisation du moins cher');
			selectedRate = rates.reduce((cheapest: any, current: any) => 
				parseFloat(current.amount) < parseFloat(cheapest.amount) ? current : cheapest
			);
		}

		console.log('✅ [SHIPPO ORDER] Tarif sélectionné:', {
			object_id: selectedRate.object_id,
			carrier: selectedRate.carrier,
			service: selectedRate.servicelevel?.name,
			amount: selectedRate.amount
		});

		// Créer la transaction (étiquette)
		const transactionResult = await shippoClient.createTransaction({
			rate: selectedRate.object_id,
			async: false
		});

		console.log('🏷️ [SHIPPO ORDER] Étiquette créée:', {
			transactionId: transactionResult.object_id,
			labelUrl: transactionResult.label_url,
			trackingNumber: transactionResult.tracking_number,
			status: transactionResult.status
		});

		// Vérifier le statut de l'étiquette
		const isLabelReady = transactionResult.status === 'SUCCESS' && transactionResult.label_url;
		
		if (isLabelReady) {
			console.log('✅ [SHIPPO ORDER] Étiquette prête immédiatement');
		} else {
			console.log('⏳ [SHIPPO ORDER] Étiquette en cours de traitement, statut:', transactionResult.status);
		}

		// Mettre à jour la transaction en base avec les infos Shippo
		await updateTransactionWithShippoData(transaction.id, {
			shippoTransactionId: transactionResult.object_id,
			labelUrl: transactionResult.label_url,
			trackingNumber: transactionResult.tracking_number,
			carrier: selectedRate.carrier,
			service: selectedRate.servicelevel?.name,
			shippingCost: selectedRate.amount
		});

		return {
			success: true,
			shippoTransactionId: transactionResult.object_id,
			labelUrl: transactionResult.label_url || '',
			trackingNumber: transactionResult.tracking_number || '',
			carrier: selectedRate.carrier,
			service: selectedRate.servicelevel?.name,
			shippingCost: selectedRate.amount,
			status: transactionResult.status
		};

	} catch (error) {
		console.error('❌ [SHIPPO ORDER] Erreur lors de la création:', error);
		throw error;
	}
}


/**
 * Récupère les détails d'une commande depuis la base de données
 */
async function getOrderDetails(orderId: string) {
	console.log('📋 [SHIPPO ORDER] Récupération des détails de la commande:', orderId);
	
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		include: {
			address: true,
			items: {
				include: {
					product: true
				}
			}
		}
	});

	if (!order) {
		throw new Error(`Commande ${orderId} introuvable`);
	}

	if (!order.address) {
		throw new Error(`Adresse manquante pour la commande ${orderId}`);
	}

	// Récupérer les champs supplémentaires avec une requête brute pour MongoDB
	const orderWithShipping = await prisma.$runCommandRaw({
		find: 'orders',
		filter: { _id: { $oid: orderId } },
		projection: { shippingOption: 1, shippingCarrier: 1, shippingCost: 1 }
	}) as any;

	const shippingData = orderWithShipping.cursor?.firstBatch?.[0] || {};

	return {
		id: order.id,
		shippingOption: shippingData.shippingOption,
		shippingCarrier: shippingData.shippingCarrier,
		shippingCost: shippingData.shippingCost,
		address: {
			name: `${order.address.first_name} ${order.address.last_name}`,
			company: order.address.company || '',
			street: `${order.address.street_number} ${order.address.street}`,
			city: order.address.city,
			state: order.address.state,
			zip: order.address.zip,
			country: order.address.country_code,
			phone: order.address.phone,
			email: '' // Pas d'email dans l'adresse
		},
		items: order.items.map(item => ({
			quantity: item.quantity,
			weight: 0.125, // 125g par canette
			name: item.product.name
		}))
	};
}

/**
 * Met à jour la transaction avec les données Shippo
 */
async function updateTransactionWithShippoData(transactionId: string, shippoData: any) {
	// TODO: Implémenter la mise à jour Prisma
	console.log('💾 [SHIPPO ORDER] Mise à jour transaction:', {
		transactionId,
		shippoData
	});
}

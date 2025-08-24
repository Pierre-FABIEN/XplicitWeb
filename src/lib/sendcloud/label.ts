import dotenv from 'dotenv';
import { prisma } from '$lib/server';

dotenv.config();

// Constante pour activer/désactiver les logs de debug
const DEBUG = false;

// Fonction helper pour les logs conditionnels
function debugLog(...args: any[]) {
	if (DEBUG) {
		debugLog(...args);
	}
}

/**
 * Crée une étiquette d'expédition Sendcloud pour une transaction donnée (SYNCHRONE).
 * Récupère directement l'étiquette PDF dans la réponse.
 * @param {Object} transaction - Les données de la transaction.
 */
export async function createSendcloudLabel(transaction: any) {
	debugLog('\n🏷️ === CRÉATION ÉTIQUETTE SENDCLOUD ===');
	debugLog('📋 Transaction reçue:', {
		id: transaction.id,
		shippingOption: transaction.shippingOption,
		orderId: transaction.orderId
	});

	// ✅ LOG COMPLET DE LA TRANSACTION
	debugLog('🔍 === ANALYSE COMPLÈTE DE LA TRANSACTION ===');
	debugLog('📋 Transaction complète (JSON):', JSON.stringify(transaction, null, 2));
	debugLog('📋 Clés disponibles dans transaction:', Object.keys(transaction));
	debugLog('📋 Type de transaction:', typeof transaction);
	debugLog('📋 Transaction est un objet:', transaction !== null && typeof transaction === 'object');
	
	// ✅ LOG DES CHAMPS SPÉCIFIQUES
	debugLog('🔍 === CHAMPS SPÉCIFIQUES DE LA TRANSACTION ===');
	debugLog('📍 servicePointId:', {
		valeur: transaction.servicePointId,
		type: typeof transaction.servicePointId,
		existe: transaction.servicePointId !== undefined,
		nonVide: transaction.servicePointId && transaction.servicePointId.toString().trim() !== ''
	});
	debugLog('📍 servicePointPostNumber:', {
		valeur: transaction.servicePointPostNumber,
		type: typeof transaction.servicePointPostNumber,
		existe: transaction.servicePointPostNumber !== undefined,
		nonVide: transaction.servicePointPostNumber && transaction.servicePointPostNumber.toString().trim() !== ''
	});
	debugLog('📍 servicePointName:', transaction.servicePointName);
	debugLog('📍 servicePointAddress:', transaction.servicePointAddress);
	debugLog('📍 servicePointCity:', transaction.servicePointCity);
	debugLog('📍 servicePointZip:', transaction.servicePointZip);
	debugLog('📍 servicePointCountry:', transaction.servicePointCountry);
	debugLog('🏁 === FIN ANALYSE TRANSACTION ===\n');

	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');


	debugLog('🔑 Authentification Sendcloud configurée');

	// ✅ Attendre que la commande soit disponible dans Sendcloud
	debugLog('⏳ Attente que la commande soit disponible dans Sendcloud...');
	await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes

	// Vérifier que la commande existe et récupérer son ID Sendcloud
	const orderNumber = `ORDER-${transaction.id}`;
	debugLog('🔍 Vérification de l\'existence de la commande:', orderNumber);

	let sendcloudOrderId = null;
	try {
		const checkResponse = await fetch(`https://panel.sendcloud.sc/api/v3/orders/?order_number=${orderNumber}`, {
			method: 'GET',
			headers: {
				Authorization: `Basic ${base64Auth}`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			}
		});

		debugLog('📥 Réponse de vérification de commande:', {
			status: checkResponse.status,
			statusText: checkResponse.statusText,
			ok: checkResponse.ok,
			headers: Object.fromEntries(checkResponse.headers.entries())
		});

		if (checkResponse.ok) {
			const checkData = await checkResponse.json();
			debugLog('✅ Commande trouvée dans Sendcloud:', {
				status: checkData.status,
				data_count: checkData.data?.length || 0
			});
			
			// ✅ LOG COMPLET DE LA RÉPONSE SENDCLOUD
			debugLog('🔍 === ANALYSE COMPLÈTE DE LA RÉPONSE SENDCLOUD ===');
			debugLog('📋 Réponse complète (JSON):', JSON.stringify(checkData, null, 2));
			debugLog('📋 Clés disponibles dans checkData:', Object.keys(checkData));
			debugLog('📋 Type de checkData:', typeof checkData);
			
			if (checkData.data && Array.isArray(checkData.data)) {
				debugLog('📋 checkData.data est un tableau de longueur:', checkData.data.length);
				checkData.data.forEach((item: any, index: number) => {
					debugLog(`📋 Item ${index}:`, {
						id: item.id,
						type: item.type,
						clés: Object.keys(item),
						attributes: item.attributes ? Object.keys(item.attributes) : 'Pas d\'attributs',
						relationships: item.relationships ? Object.keys(item.relationships) : 'Pas de relations'
					});
					
					// ✅ LOG DÉTAILLÉ DE CHAQUE ITEM
					if (item.attributes) {
						debugLog(`🔍 Attributs de l'item ${index}:`, JSON.stringify(item.attributes, null, 2));
					}
					if (item.relationships) {
						debugLog(`🔍 Relations de l'item ${index}:`, JSON.stringify(item.relationships, null, 2));
					}
				});
			} else {
				debugLog('⚠️ checkData.data n\'est pas un tableau ou est undefined');
				debugLog('📋 Type de checkData.data:', typeof checkData.data);
				debugLog('📋 Valeur de checkData.data:', checkData.data);
			}
			debugLog('🏁 === FIN ANALYSE RÉPONSE SENDCLOUD ===\n');
			
			// Récupérer l'ID interne de la commande Sendcloud
			if (checkData.data && checkData.data.length > 0) {
				sendcloudOrderId = checkData.data[0].id;
				debugLog('🎯 ID de commande Sendcloud récupéré:', sendcloudOrderId);
				
				// ✅ LOG DÉTAILLÉ DE LA COMMANDE TROUVÉE
				const foundOrder = checkData.data[0];
				debugLog('🔍 === COMMANDE SENDCLOUD TROUVÉE ===');
				debugLog('📋 Commande complète:', JSON.stringify(foundOrder, null, 2));
				debugLog('📋 ID de la commande:', foundOrder.id);
				debugLog('📋 Type de la commande:', foundOrder.type);
				
				if (foundOrder.attributes) {
					debugLog('📋 Attributs de la commande:');
					Object.entries(foundOrder.attributes).forEach(([key, value]) => {
						debugLog(`  - ${key}:`, {
							valeur: value,
							type: typeof value,
							existe: value !== undefined && value !== null
						});
					});
				}
				
				if (foundOrder.relationships) {
					debugLog('📋 Relations de la commande:');
					Object.entries(foundOrder.relationships).forEach(([key, value]) => {
						debugLog(`  - ${key}:`, {
							valeur: value,
							type: typeof value,
							existe: value !== undefined && value !== null
						});
					});
				}
				debugLog('🏁 === FIN COMMANDE SENDCLOUD TROUVÉE ===\n');
			}
		} else {
			debugLog('⚠️ Commande pas encore disponible, nouvelle tentative dans 3 secondes...');
			await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3 secondes de plus
			
			// Nouvelle tentative
			const retryResponse = await fetch(`https://panel.sendcloud.sc/api/v3/orders/?order_number=${orderNumber}`, {
				method: 'GET',
				headers: {
					Authorization: `Basic ${base64Auth}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			});
			
			debugLog('📥 Réponse de retry:', {
				status: retryResponse.status,
				statusText: retryResponse.statusText,
				ok: retryResponse.ok
			});
			
			if (retryResponse.ok) {
				const retryData = await retryResponse.json();
				debugLog('📋 Données de retry:', JSON.stringify(retryData, null, 2));
				
				if (retryData.data && retryData.data.length > 0) {
					sendcloudOrderId = retryData.data[0].id;
					debugLog('🎯 ID de commande Sendcloud récupéré après retry:', sendcloudOrderId);
				}
			}
		}
	} catch (error) {
		debugLog('⚠️ Erreur lors de la vérification, continuation...');
		console.error('❌ Détail de l\'erreur:', error);
	}

	if (!sendcloudOrderId) {
		console.error('❌ Impossible de récupérer l\'ID de commande Sendcloud');
		return;
	}

	// ✅ Vérifier si la commande a un point relais
	const hasServicePoint = transaction.servicePointId;
	debugLog('📍 Commande avec point relais:', hasServicePoint ? 'Oui' : 'Non');
	
	// ✅ LOG DÉTAILLÉ DE LA DÉTECTION DU POINT RELAIS
	debugLog('🔍 === ANALYSE DÉTECTION POINT RELAIS ===');
	debugLog('📍 servicePointId brut:', transaction.servicePointId);
	debugLog('📍 servicePointId type:', typeof transaction.servicePointId);
	debugLog('📍 servicePointId existe:', transaction.servicePointId !== undefined);
	debugLog('📍 servicePointId non vide:', transaction.servicePointId && transaction.servicePointId.toString().trim() !== '');
	debugLog('📍 hasServicePoint calculé:', hasServicePoint);
	debugLog('📍 hasServicePoint type:', typeof hasServicePoint);
	debugLog('📍 hasServicePoint truthy:', !!hasServicePoint);
	debugLog('🏁 === FIN ANALYSE DÉTECTION POINT RELAIS ===\n');

	// ✅ Si la commande a un point relais, on doit l'utiliser correctement avec to_service_point
	// selon la documentation Sendcloud
	if (hasServicePoint) {
		debugLog('✅ Commande avec point relais détectée. Utilisation de to_service_point selon la documentation Sendcloud...');
		debugLog('🔍 Détails du point relais à utiliser:', {
			id: transaction.servicePointId,
			post_number: transaction.servicePointPostNumber,
			name: transaction.servicePointName,
			address: transaction.servicePointAddress,
			city: transaction.servicePointCity,
			zip: transaction.servicePointZip,
			country: transaction.servicePointCountry
		});
		
		// ✅ BONNE PRATIQUE SENDCLOUD : Récupérer les méthodes d'expédition compatibles avec ce point relais
		debugLog('🔍 === RÉCUPÉRATION MÉTHODES COMPATIBLES POINT RELAIS ===');
		try {
			const servicePointId = transaction.servicePointId;
			const senderAddressId = process.env.SENDCLOUD_SENDER_ADDRESS_ID;
			
			debugLog('📋 Paramètres de recherche:', {
				servicePointId,
				senderAddressId,
				shippingMethodId: transaction.shippingMethodId
			});
			
			// ✅ Appel à l'API Sendcloud pour récupérer les méthodes compatibles
			const methodsResponse = await fetch(
				`https://panel.sendcloud.sc/api/v2/shipping_methods?service_point_id=${servicePointId}${senderAddressId ? `&sender_address=${senderAddressId}` : ''}`,
				{
					method: 'GET',
					headers: {
						Authorization: `Basic ${base64Auth}`,
						'Content-Type': 'application/json',
						Accept: 'application/json'
					}
				}
			);
			
			debugLog('📥 Réponse méthodes compatibles:', {
				status: methodsResponse.status,
				statusText: methodsResponse.statusText,
				ok: methodsResponse.ok
			});
			
			if (methodsResponse.ok) {
				const methodsData = await methodsResponse.json();
				debugLog('✅ Méthodes compatibles récupérées:', {
					count: methodsData.shipping_methods?.length || 0
				});
				
				// ✅ LOG COMPLET DES MÉTHODES COMPATIBLES
				debugLog('🔍 === ANALYSE MÉTHODES COMPATIBLES ===');
				
				if (methodsData.shipping_methods && Array.isArray(methodsData.shipping_methods)) {
					debugLog('📋 Méthodes disponibles:', methodsData.shipping_methods.length);
					
					// ✅ Filtrer par poids et trouver la meilleure méthode
					const currentWeight = transaction.package_weight || 6;
					const compatibleMethods = methodsData.shipping_methods.filter((method: any) => {
						const minWeight = parseFloat(method.min_weight || '0');
						const maxWeight = parseFloat(method.max_weight || '999999');
						const isCompatible = currentWeight >= minWeight && currentWeight <= maxWeight;
						

						return isCompatible;
					});
					
					debugLog('✅ Méthodes compatibles après filtrage poids:', compatibleMethods.length);
					
					if (compatibleMethods.length > 0) {
						// ✅ Prendre la première méthode compatible (ou appliquer un scoring)
						const bestMethod = compatibleMethods[0];
						debugLog('🎯 Meilleure méthode sélectionnée:', {
							id: bestMethod.id,
							name: bestMethod.name,
							carrier: bestMethod.carrier,
							price: bestMethod.countries?.[0]?.price
						});
						
						// ✅ Mettre à jour l'ID de méthode d'expédition
						transaction.shippingMethodId = bestMethod.id;
						debugLog('🔄 ID de méthode d\'expédition mis à jour:', transaction.shippingMethodId);
					} else {
						debugLog('⚠️ Aucune méthode compatible trouvée après filtrage poids');
					}
				}
				debugLog('🏁 === FIN ANALYSE MÉTHODES COMPATIBLES ===\n');
			} else {
				debugLog('⚠️ Erreur lors de la récupération des méthodes compatibles');
				const errorText = await methodsResponse.text();
				debugLog('📋 Erreur:', errorText);
			}
		} catch (error) {
			debugLog('⚠️ Erreur lors de la récupération des méthodes compatibles:', error);
		}
	} else {
		debugLog('ℹ️ Pas de point relais détecté, création d\'étiquette standard...');
	}

	const endpoint = 'https://panel.sendcloud.sc/api/v2/parcels';

	// ✅ BONNE PRATIQUE SENDCLOUD : Revalider l'ID de méthode juste avant la création
	debugLog('🔍 === REVALIDATION ID MÉTHODE AVANT CRÉATION ===');
	try {
		const servicePointId = transaction.servicePointId;
		const senderAddressId = process.env.SENDCLOUD_SENDER_ADDRESS_ID;
		const currentMethodId = transaction.shippingMethodId;
		
		debugLog('📋 Paramètres de revalidation:', {
			servicePointId,
			senderAddressId,
			currentMethodId
		});
		
		// ✅ Revalidation immédiate de la méthode sélectionnée
		const revalidationResponse = await fetch(
			`https://panel.sendcloud.sc/api/v2/shipping_methods?service_point_id=${servicePointId}${senderAddressId ? `&sender_address=${senderAddressId}` : ''}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Basic ${base64Auth}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			}
		);
		
		debugLog('📥 Réponse de revalidation:', {
			status: revalidationResponse.status,
			statusText: revalidationResponse.statusText,
			ok: revalidationResponse.ok
		});
		
		if (revalidationResponse.ok) {
			const revalidationData = await revalidationResponse.json();
			debugLog('✅ Méthodes compatibles revalidées:', {
				count: revalidationData.shipping_methods?.length || 0
			});
			
			// ✅ Vérifier que notre méthode est toujours valide
			const currentWeight = transaction.package_weight || 6;
			const validMethods = revalidationData.shipping_methods?.filter((method: any) => {
				const minWeight = parseFloat(method.min_weight || '0');
				const maxWeight = parseFloat(method.max_weight || '999999');
				const isCompatible = currentWeight >= minWeight && currentWeight <= maxWeight;

				return isCompatible;
			}) || [];
			
			debugLog('✅ Méthodes valides après revalidation:', validMethods.length);
			
			// ✅ Vérifier si notre méthode actuelle est toujours valide
			const isCurrentMethodValid = validMethods.some((method: any) => method.id === currentMethodId);
			
			if (isCurrentMethodValid) {
				debugLog('✅ Notre méthode actuelle est toujours valide:', currentMethodId);
			} else {
				debugLog('⚠️ Notre méthode actuelle n\'est plus valide, sélection d\'une nouvelle méthode...');
				
				if (validMethods.length > 0) {
					// ✅ Prendre la première méthode valide
					const newBestMethod = validMethods[0];
					debugLog('🎯 Nouvelle méthode sélectionnée:', {
						id: newBestMethod.id,
						name: newBestMethod.name,
						carrier: newBestMethod.carrier,
						price: newBestMethod.countries?.[0]?.price
					});
					
					// ✅ Mettre à jour l'ID de méthode d'expédition
					transaction.shippingMethodId = newBestMethod.id;
					debugLog('🔄 ID de méthode d\'expédition mis à jour:', transaction.shippingMethodId);
				} else {
					debugLog('❌ Aucune méthode valide trouvée lors de la revalidation');
				}
			}
			
			// ✅ BONNE PRATIQUE SENDCLOUD : Forcer l'utilisation de la méthode revalidée
			if (validMethods.length > 0) {
				// ✅ Prendre la méthode la plus récente et valide
				const mostRecentValidMethod = validMethods[0];
				debugLog('🎯 Utilisation de la méthode revalidée:', {
					id: mostRecentValidMethod.id,
					name: mostRecentValidMethod.name,
					carrier: mostRecentValidMethod.carrier,
					service_point_input: mostRecentValidMethod.service_point_input
				});
				
				// ✅ Vérification stricte que c'est bien une méthode point relais
				if (mostRecentValidMethod.service_point_input === 'required') {
					debugLog('✅ Méthode point relais confirmée (service_point_input: required)');
					
					// ✅ Mise à jour forcée de l'ID
					transaction.shippingMethodId = mostRecentValidMethod.id;
					debugLog('🔄 ID de méthode d\'expédition forcé à:', transaction.shippingMethodId);
				} else {
					debugLog('⚠️ Méthode non compatible points relais, recherche d\'une alternative...');
					
					// ✅ Chercher une méthode avec service_point_input: required
					const servicePointMethods = validMethods.filter((method: any) => method.service_point_input === 'required');
					if (servicePointMethods.length > 0) {
						const bestServicePointMethod = servicePointMethods[0];
						debugLog('🎯 Méthode point relais alternative trouvée:', {
							id: bestServicePointMethod.id,
							name: bestServicePointMethod.name,
							carrier: bestServicePointMethod.carrier
						});
						
						transaction.shippingMethodId = bestServicePointMethod.id;
						debugLog('🔄 ID de méthode d\'expédition mis à jour vers méthode point relais:', transaction.shippingMethodId);
					}
				}
			}
		} else {
			debugLog('⚠️ Erreur lors de la revalidation, utilisation de la méthode actuelle');
		}
	} catch (error) {
		debugLog('⚠️ Erreur lors de la revalidation:', error);
	}
	debugLog('🏁 === FIN REVALIDATION ID MÉTHODE ===\n');

	// ✅ CONSTRUCTION DU PAYLOAD AVEC LOGS DÉTAILLÉS
	debugLog('🔨 === CONSTRUCTION DU PAYLOAD ===');
	
	// ✅ Utiliser l'API v2 /parcels avec request_label: true pour les points relais
	const requestBody = {
		parcels: [{
			// ✅ Informations du destinataire (depuis la transaction - VRAIES DONNÉES)
			name: `${transaction.address_first_name || ''} ${transaction.address_last_name || ''}`.trim() || 'Client',
			company_name: transaction.address_company || '',
			address: transaction.address_street || 'Adresse par défaut',
			house_number: transaction.address_street_number || '',
			city: transaction.address_city || 'Ville par défaut',
			postal_code: transaction.address_zip || '00000',
			country: (transaction.address_country_code || 'FR').toUpperCase(), // ✅ Pays en majuscules
			email: transaction.customer_details_email || 'client@example.com',
			telephone: transaction.address_phone || '0606060606', // ✅ VRAI TÉLÉPHONE

			// ✅ Méthode d'expédition (ID Sendcloud - mis à jour si point relais)
			shipment: { 
				id: transaction.shippingMethodId || 413 // Fallback sur l'ID trouvé précédemment
			},
			
			// ✅ Poids et dimensions (VRAIES DONNÉES)
			weight: (transaction.package_weight || 6).toString(),
			
			// ✅ Création synchrone de l'étiquette
			request_label: true,
			
			// ✅ Point relais (si applicable)
			...(hasServicePoint ? {
				to_service_point: parseInt(transaction.servicePointId),
				to_post_number: transaction.servicePointPostNumber || ''
			} : {})
		}]
	};

	// ✅ LOG DÉTAILLÉ DU PAYLOAD CONSTRUIT
	debugLog('📤 Payload construit:', {
		parcels_count: requestBody.parcels.length,
		first_parcel: {
			name: requestBody.parcels[0].name,
			shipment_id: requestBody.parcels[0].shipment.id,
			weight: requestBody.parcels[0].weight,
			request_label: requestBody.parcels[0].request_label,
			...(hasServicePoint ? {
				to_service_point: requestBody.parcels[0].to_service_point,
				to_post_number: requestBody.parcels[0].to_post_number
			} : {})
		}
	});

	// ✅ LOG COMPLET DU PAYLOAD
	debugLog('🔍 Payload complet (JSON):', JSON.stringify(requestBody, null, 2));
	debugLog('🔍 Structure du payload:', {
		parcels: {
			count: requestBody.parcels.length,
			first_parcel: {
				name: requestBody.parcels[0].name,
				company_name: requestBody.parcels[0].company_name,
				address: requestBody.parcels[0].address,
				city: requestBody.parcels[0].city,
				postal_code: requestBody.parcels[0].postal_code,
				country: requestBody.parcels[0].country,
				shipment_id: requestBody.parcels[0].shipment.id,
				weight: requestBody.parcels[0].weight,
				request_label: requestBody.parcels[0].request_label,
				to_service_point: requestBody.parcels[0].to_service_point,
				to_post_number: requestBody.parcels[0].to_post_number
			}
		}
	});
	debugLog('🏁 === FIN CONSTRUCTION PAYLOAD ===\n');

	// Appel à l'API Sendcloud
	debugLog('🚀 Envoi de la requête à Sendcloud...');
	debugLog('🎯 Endpoint:', endpoint);
	debugLog('🔑 Headers:', {
		Authorization: `Basic ${base64Auth.substring(0, 20)}...`,
		'Content-Type': 'application/json',
		Accept: 'application/json'
	});
	
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	debugLog('📥 Réponse reçue:', {
		status: response.status,
		statusText: response.statusText,
		ok: response.ok
	});

	if (!response.ok) {
		const txt = await response.text();
		console.error('❌ Erreur lors de la création de l\'étiquette Sendcloud (sync):', txt);
		console.error('📋 Status:', response.status, response.statusText);
		console.error('📤 Payload envoyé:', JSON.stringify(requestBody, null, 2));
		
		// ✅ LOG DÉTAILLÉ DE L'ERREUR
		debugLog('🔍 === ANALYSE DE L\'ERREUR ===');
		try {
			const errorJson = JSON.parse(txt);
			debugLog('📋 Erreur parsée (JSON):', JSON.stringify(errorJson, null, 2));
			
			if (errorJson.errors && Array.isArray(errorJson.errors)) {
				debugLog('📋 Détail des erreurs:');
				errorJson.errors.forEach((error: any, index: number) => {
					debugLog(`  Erreur ${index + 1}:`, {
						status: error.status,
						code: error.code,
						detail: error.detail,
						source: error.source,
						pointer: error.source?.pointer
					});
				});
			}
		} catch (parseError) {
			debugLog('⚠️ Impossible de parser l\'erreur en JSON:', parseError);
			debugLog('📋 Erreur brute:', txt);
		}
		debugLog('🏁 === FIN ANALYSE ERREUR ===\n');
		
		return;
	}

	const responseData = await response.json();
	debugLog('✅ Réponse Sendcloud reçue:', {
		status: responseData.status || 'unknown',
		data_count: responseData.parcels?.length || 0
	});

	// ✅ LOG COMPLET DE LA RÉPONSE SUCCÈS
	debugLog('🔍 === ANALYSE RÉPONSE SUCCÈS ===');
	debugLog('📋 Réponse complète (JSON):', JSON.stringify(responseData, null, 2));
	debugLog('📋 Clés disponibles dans responseData:', Object.keys(responseData));
	debugLog('📋 Type de responseData:', typeof responseData);
	
	// ✅ L'API v2 /parcels retourne directement un tableau de parcels
	if (responseData.parcels && Array.isArray(responseData.parcels)) {
		debugLog('📋 responseData.parcels est un tableau de longueur:', responseData.parcels.length);
		responseData.parcels.forEach((parcel: any, index: number) => {
			debugLog(`📋 Parcel ${index}:`, {
				clés: Object.keys(parcel),
				type: typeof parcel
			});
			debugLog(`📋 Contenu du parcel ${index}:`, JSON.stringify(parcel, null, 2));
		});
	} else {
		debugLog('⚠️ responseData.parcels n\'est pas un tableau ou est undefined');
		debugLog('📋 Type de responseData.parcels:', typeof responseData.parcels);
		debugLog('📋 Valeur de responseData.parcels:', responseData.parcels);
	}
	debugLog('🏁 === FIN ANALYSE RÉPONSE SUCCÈS ===\n');

	// -- Récupération correcte : responseData.parcels est un tableau contenant les parcels créés
	const [parcel] = responseData.parcels || [];
	if (!parcel) {
		console.error('❌ Pas de parcels dans la réponse Sendcloud');
		console.error('📋 Réponse complète:', responseData);
		return;
	}

	// ✅ LOG DÉTAILLÉ DU COLIS
	debugLog('🔍 === ANALYSE DU COLIS ===');
	debugLog('📋 Colis complet:', JSON.stringify(parcel, null, 2));
	debugLog('📋 Clés disponibles dans parcel:', Object.keys(parcel));
	debugLog('📋 Type de parcel:', typeof parcel);
	
	// ✅ L'API v2 /parcels retourne des champs différents
	const parcelId = parcel.id || parcel.parcel_id;
	const trackingNumber = parcel.tracking_number;
	const trackingUrl = parcel.label?.label_printer_url || parcel.label_url;
	
	debugLog('📦 Données de colis extraites:', {
		parcel_id: parcelId,
		tracking_number: trackingNumber ? 'Oui' : 'Non',
		tracking_url: trackingUrl ? 'Oui' : 'Non'
	});
	
	// ✅ LOG DÉTAILLÉ DES CHAMPS DU COLIS
	debugLog('📋 Tous les champs du colis:');
	Object.entries(parcel).forEach(([key, value]) => {
		debugLog(`  - ${key}:`, {
			valeur: value,
			type: typeof value,
			existe: value !== undefined && value !== null
		});
	});
	debugLog('🏁 === FIN ANALYSE COLIS ===\n');

	// Vérification que la transaction existe vraiment
	debugLog('🔍 Vérification de l\'existence de la transaction en base...');
	const existingTransaction = await prisma.transaction.findUnique({
		where: { id: transaction.id.toString() }
	});

	if (!existingTransaction) {
		console.error(`❌ La transaction avec l'ID ${transaction.id} n'existe pas.`);
		return;
	}

	debugLog('✅ Transaction trouvée en base, mise à jour...');

	// Mise à jour des infos Sendcloud dans la transaction
	await prisma.transaction.update({
		where: { id: transaction.id.toString() },
		data: {
			sendcloudParcelId: parcelId,
			trackingNumber: trackingNumber,
			trackingUrl: trackingUrl
		}
	});

	debugLog('✅ Transaction mise à jour avec les informations Sendcloud');
	debugLog('🏁 === FIN CRÉATION ÉTIQUETTE SENDCLOUD ===\n');
}

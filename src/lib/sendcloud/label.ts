import dotenv from 'dotenv';
import { prisma } from '$lib/server';

dotenv.config();

/**
 * Crée une étiquette d'expédition Sendcloud pour une transaction donnée (SYNCHRONE).
 * Récupère directement l'étiquette PDF dans la réponse.
 * @param {Object} transaction - Les données de la transaction.
 */
export async function createSendcloudLabel(transaction: any) {
	console.log('\n🏷️ === CRÉATION ÉTIQUETTE SENDCLOUD ===');
	console.log('📋 Transaction reçue:', {
		id: transaction.id,
		shippingOption: transaction.shippingOption,
		orderId: transaction.orderId
	});

	// ✅ LOG COMPLET DE LA TRANSACTION
	console.log('🔍 === ANALYSE COMPLÈTE DE LA TRANSACTION ===');
	console.log('📋 Transaction complète (JSON):', JSON.stringify(transaction, null, 2));
	console.log('📋 Clés disponibles dans transaction:', Object.keys(transaction));
	console.log('📋 Type de transaction:', typeof transaction);
	console.log('📋 Transaction est un objet:', transaction !== null && typeof transaction === 'object');
	
	// ✅ LOG DES CHAMPS SPÉCIFIQUES
	console.log('🔍 === CHAMPS SPÉCIFIQUES DE LA TRANSACTION ===');
	console.log('📍 servicePointId:', {
		valeur: transaction.servicePointId,
		type: typeof transaction.servicePointId,
		existe: transaction.servicePointId !== undefined,
		nonVide: transaction.servicePointId && transaction.servicePointId.toString().trim() !== ''
	});
	console.log('📍 servicePointPostNumber:', {
		valeur: transaction.servicePointPostNumber,
		type: typeof transaction.servicePointPostNumber,
		existe: transaction.servicePointPostNumber !== undefined,
		nonVide: transaction.servicePointPostNumber && transaction.servicePointPostNumber.toString().trim() !== ''
	});
	console.log('📍 servicePointName:', transaction.servicePointName);
	console.log('📍 servicePointAddress:', transaction.servicePointAddress);
	console.log('📍 servicePointCity:', transaction.servicePointCity);
	console.log('📍 servicePointZip:', transaction.servicePointZip);
	console.log('📍 servicePointCountry:', transaction.servicePointCountry);
	console.log('🏁 === FIN ANALYSE TRANSACTION ===\n');

	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	if (!process.env.SENDCLOUD_INTEGRATION_ID) {
		console.error("❌ L'ID d'intégration Sendcloud est manquant !");
		return;
	}

	console.log('🔑 Authentification Sendcloud configurée');
	console.log('🔧 ID d\'intégration:', process.env.SENDCLOUD_INTEGRATION_ID);

	// ✅ Attendre que la commande soit disponible dans Sendcloud
	console.log('⏳ Attente que la commande soit disponible dans Sendcloud...');
	await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes

	// Vérifier que la commande existe et récupérer son ID Sendcloud
	const orderNumber = `ORDER-${transaction.id}`;
	console.log('🔍 Vérification de l\'existence de la commande:', orderNumber);

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

		console.log('📥 Réponse de vérification de commande:', {
			status: checkResponse.status,
			statusText: checkResponse.statusText,
			ok: checkResponse.ok,
			headers: Object.fromEntries(checkResponse.headers.entries())
		});

		if (checkResponse.ok) {
			const checkData = await checkResponse.json();
			console.log('✅ Commande trouvée dans Sendcloud:', {
				status: checkData.status,
				data_count: checkData.data?.length || 0
			});
			
			// ✅ LOG COMPLET DE LA RÉPONSE SENDCLOUD
			console.log('🔍 === ANALYSE COMPLÈTE DE LA RÉPONSE SENDCLOUD ===');
			console.log('📋 Réponse complète (JSON):', JSON.stringify(checkData, null, 2));
			console.log('📋 Clés disponibles dans checkData:', Object.keys(checkData));
			console.log('📋 Type de checkData:', typeof checkData);
			
			if (checkData.data && Array.isArray(checkData.data)) {
				console.log('📋 checkData.data est un tableau de longueur:', checkData.data.length);
				checkData.data.forEach((item: any, index: number) => {
					console.log(`📋 Item ${index}:`, {
						id: item.id,
						type: item.type,
						clés: Object.keys(item),
						attributes: item.attributes ? Object.keys(item.attributes) : 'Pas d\'attributs',
						relationships: item.relationships ? Object.keys(item.relationships) : 'Pas de relations'
					});
					
					// ✅ LOG DÉTAILLÉ DE CHAQUE ITEM
					if (item.attributes) {
						console.log(`🔍 Attributs de l'item ${index}:`, JSON.stringify(item.attributes, null, 2));
					}
					if (item.relationships) {
						console.log(`🔍 Relations de l'item ${index}:`, JSON.stringify(item.relationships, null, 2));
					}
				});
			} else {
				console.log('⚠️ checkData.data n\'est pas un tableau ou est undefined');
				console.log('📋 Type de checkData.data:', typeof checkData.data);
				console.log('📋 Valeur de checkData.data:', checkData.data);
			}
			console.log('🏁 === FIN ANALYSE RÉPONSE SENDCLOUD ===\n');
			
			// Récupérer l'ID interne de la commande Sendcloud
			if (checkData.data && checkData.data.length > 0) {
				sendcloudOrderId = checkData.data[0].id;
				console.log('🎯 ID de commande Sendcloud récupéré:', sendcloudOrderId);
				
				// ✅ LOG DÉTAILLÉ DE LA COMMANDE TROUVÉE
				const foundOrder = checkData.data[0];
				console.log('🔍 === COMMANDE SENDCLOUD TROUVÉE ===');
				console.log('📋 Commande complète:', JSON.stringify(foundOrder, null, 2));
				console.log('📋 ID de la commande:', foundOrder.id);
				console.log('📋 Type de la commande:', foundOrder.type);
				
				if (foundOrder.attributes) {
					console.log('📋 Attributs de la commande:');
					Object.entries(foundOrder.attributes).forEach(([key, value]) => {
						console.log(`  - ${key}:`, {
							valeur: value,
							type: typeof value,
							existe: value !== undefined && value !== null
						});
					});
				}
				
				if (foundOrder.relationships) {
					console.log('📋 Relations de la commande:');
					Object.entries(foundOrder.relationships).forEach(([key, value]) => {
						console.log(`  - ${key}:`, {
							valeur: value,
							type: typeof value,
							existe: value !== undefined && value !== null
						});
					});
				}
				console.log('🏁 === FIN COMMANDE SENDCLOUD TROUVÉE ===\n');
			}
		} else {
			console.log('⚠️ Commande pas encore disponible, nouvelle tentative dans 3 secondes...');
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
			
			console.log('📥 Réponse de retry:', {
				status: retryResponse.status,
				statusText: retryResponse.statusText,
				ok: retryResponse.ok
			});
			
			if (retryResponse.ok) {
				const retryData = await retryResponse.json();
				console.log('📋 Données de retry:', JSON.stringify(retryData, null, 2));
				
				if (retryData.data && retryData.data.length > 0) {
					sendcloudOrderId = retryData.data[0].id;
					console.log('🎯 ID de commande Sendcloud récupéré après retry:', sendcloudOrderId);
				}
			}
		}
	} catch (error) {
		console.log('⚠️ Erreur lors de la vérification, continuation...');
		console.error('❌ Détail de l\'erreur:', error);
	}

	if (!sendcloudOrderId) {
		console.error('❌ Impossible de récupérer l\'ID de commande Sendcloud');
		return;
	}

	// ✅ Vérifier si la commande a un point relais
	const hasServicePoint = transaction.servicePointId;
	console.log('📍 Commande avec point relais:', hasServicePoint ? 'Oui' : 'Non');
	
	// ✅ LOG DÉTAILLÉ DE LA DÉTECTION DU POINT RELAIS
	console.log('🔍 === ANALYSE DÉTECTION POINT RELAIS ===');
	console.log('📍 servicePointId brut:', transaction.servicePointId);
	console.log('📍 servicePointId type:', typeof transaction.servicePointId);
	console.log('📍 servicePointId existe:', transaction.servicePointId !== undefined);
	console.log('📍 servicePointId non vide:', transaction.servicePointId && transaction.servicePointId.toString().trim() !== '');
	console.log('📍 hasServicePoint calculé:', hasServicePoint);
	console.log('📍 hasServicePoint type:', typeof hasServicePoint);
	console.log('📍 hasServicePoint truthy:', !!hasServicePoint);
	console.log('🏁 === FIN ANALYSE DÉTECTION POINT RELAIS ===\n');

	// ✅ Si la commande a un point relais, on doit l'utiliser correctement avec to_service_point
	// selon la documentation Sendcloud
	if (hasServicePoint) {
		console.log('✅ Commande avec point relais détectée. Utilisation de to_service_point selon la documentation Sendcloud...');
		console.log('🔍 Détails du point relais à utiliser:', {
			id: transaction.servicePointId,
			post_number: transaction.servicePointPostNumber,
			name: transaction.servicePointName,
			address: transaction.servicePointAddress,
			city: transaction.servicePointCity,
			zip: transaction.servicePointZip,
			country: transaction.servicePointCountry
		});
		
		// ✅ BONNE PRATIQUE SENDCLOUD : Récupérer les méthodes d'expédition compatibles avec ce point relais
		console.log('🔍 === RÉCUPÉRATION MÉTHODES COMPATIBLES POINT RELAIS ===');
		try {
			const servicePointId = transaction.servicePointId;
			const senderAddressId = process.env.SENDCLOUD_SENDER_ADDRESS_ID;
			
			console.log('📋 Paramètres de recherche:', {
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
			
			console.log('📥 Réponse méthodes compatibles:', {
				status: methodsResponse.status,
				statusText: methodsResponse.statusText,
				ok: methodsResponse.ok
			});
			
			if (methodsResponse.ok) {
				const methodsData = await methodsResponse.json();
				console.log('✅ Méthodes compatibles récupérées:', {
					count: methodsData.shipping_methods?.length || 0
				});
				
				// ✅ LOG COMPLET DES MÉTHODES COMPATIBLES
				console.log('🔍 === ANALYSE MÉTHODES COMPATIBLES ===');
				console.log('📋 Réponse complète (JSON):', JSON.stringify(methodsData, null, 2));
				
				if (methodsData.shipping_methods && Array.isArray(methodsData.shipping_methods)) {
					console.log('📋 Méthodes disponibles:', methodsData.shipping_methods.length);
					
					// ✅ Filtrer par poids et trouver la meilleure méthode
					const currentWeight = transaction.package_weight || 6;
					const compatibleMethods = methodsData.shipping_methods.filter((method: any) => {
						const minWeight = parseFloat(method.min_weight || '0');
						const maxWeight = parseFloat(method.max_weight || '999999');
						const isCompatible = currentWeight >= minWeight && currentWeight <= maxWeight;
						

						return isCompatible;
					});
					
					console.log('✅ Méthodes compatibles après filtrage poids:', compatibleMethods.length);
					
					if (compatibleMethods.length > 0) {
						// ✅ Prendre la première méthode compatible (ou appliquer un scoring)
						const bestMethod = compatibleMethods[0];
						console.log('🎯 Meilleure méthode sélectionnée:', {
							id: bestMethod.id,
							name: bestMethod.name,
							carrier: bestMethod.carrier,
							price: bestMethod.countries?.[0]?.price
						});
						
						// ✅ Mettre à jour l'ID de méthode d'expédition
						transaction.shippingMethodId = bestMethod.id;
						console.log('🔄 ID de méthode d\'expédition mis à jour:', transaction.shippingMethodId);
					} else {
						console.log('⚠️ Aucune méthode compatible trouvée après filtrage poids');
					}
				}
				console.log('🏁 === FIN ANALYSE MÉTHODES COMPATIBLES ===\n');
			} else {
				console.log('⚠️ Erreur lors de la récupération des méthodes compatibles');
				const errorText = await methodsResponse.text();
				console.log('📋 Erreur:', errorText);
			}
		} catch (error) {
			console.log('⚠️ Erreur lors de la récupération des méthodes compatibles:', error);
		}
	} else {
		console.log('ℹ️ Pas de point relais détecté, création d\'étiquette standard...');
	}

	const endpoint = 'https://panel.sendcloud.sc/api/v2/parcels';

	// ✅ BONNE PRATIQUE SENDCLOUD : Revalider l'ID de méthode juste avant la création
	console.log('🔍 === REVALIDATION ID MÉTHODE AVANT CRÉATION ===');
	try {
		const servicePointId = transaction.servicePointId;
		const senderAddressId = process.env.SENDCLOUD_SENDER_ADDRESS_ID;
		const currentMethodId = transaction.shippingMethodId;
		
		console.log('📋 Paramètres de revalidation:', {
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
		
		console.log('📥 Réponse de revalidation:', {
			status: revalidationResponse.status,
			statusText: revalidationResponse.statusText,
			ok: revalidationResponse.ok
		});
		
		if (revalidationResponse.ok) {
			const revalidationData = await revalidationResponse.json();
			console.log('✅ Méthodes compatibles revalidées:', {
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
			
			console.log('✅ Méthodes valides après revalidation:', validMethods.length);
			
			// ✅ Vérifier si notre méthode actuelle est toujours valide
			const isCurrentMethodValid = validMethods.some((method: any) => method.id === currentMethodId);
			
			if (isCurrentMethodValid) {
				console.log('✅ Notre méthode actuelle est toujours valide:', currentMethodId);
			} else {
				console.log('⚠️ Notre méthode actuelle n\'est plus valide, sélection d\'une nouvelle méthode...');
				
				if (validMethods.length > 0) {
					// ✅ Prendre la première méthode valide
					const newBestMethod = validMethods[0];
					console.log('🎯 Nouvelle méthode sélectionnée:', {
						id: newBestMethod.id,
						name: newBestMethod.name,
						carrier: newBestMethod.carrier,
						price: newBestMethod.countries?.[0]?.price
					});
					
					// ✅ Mettre à jour l'ID de méthode d'expédition
					transaction.shippingMethodId = newBestMethod.id;
					console.log('🔄 ID de méthode d\'expédition mis à jour:', transaction.shippingMethodId);
				} else {
					console.log('❌ Aucune méthode valide trouvée lors de la revalidation');
				}
			}
			
			// ✅ BONNE PRATIQUE SENDCLOUD : Forcer l'utilisation de la méthode revalidée
			if (validMethods.length > 0) {
				// ✅ Prendre la méthode la plus récente et valide
				const mostRecentValidMethod = validMethods[0];
				console.log('🎯 Utilisation de la méthode revalidée:', {
					id: mostRecentValidMethod.id,
					name: mostRecentValidMethod.name,
					carrier: mostRecentValidMethod.carrier,
					service_point_input: mostRecentValidMethod.service_point_input
				});
				
				// ✅ Vérification stricte que c'est bien une méthode point relais
				if (mostRecentValidMethod.service_point_input === 'required') {
					console.log('✅ Méthode point relais confirmée (service_point_input: required)');
					
					// ✅ Mise à jour forcée de l'ID
					transaction.shippingMethodId = mostRecentValidMethod.id;
					console.log('🔄 ID de méthode d\'expédition forcé à:', transaction.shippingMethodId);
				} else {
					console.log('⚠️ Méthode non compatible points relais, recherche d\'une alternative...');
					
					// ✅ Chercher une méthode avec service_point_input: required
					const servicePointMethods = validMethods.filter((method: any) => method.service_point_input === 'required');
					if (servicePointMethods.length > 0) {
						const bestServicePointMethod = servicePointMethods[0];
						console.log('🎯 Méthode point relais alternative trouvée:', {
							id: bestServicePointMethod.id,
							name: bestServicePointMethod.name,
							carrier: bestServicePointMethod.carrier
						});
						
						transaction.shippingMethodId = bestServicePointMethod.id;
						console.log('🔄 ID de méthode d\'expédition mis à jour vers méthode point relais:', transaction.shippingMethodId);
					}
				}
			}
		} else {
			console.log('⚠️ Erreur lors de la revalidation, utilisation de la méthode actuelle');
		}
	} catch (error) {
		console.log('⚠️ Erreur lors de la revalidation:', error);
	}
	console.log('🏁 === FIN REVALIDATION ID MÉTHODE ===\n');

	// ✅ CONSTRUCTION DU PAYLOAD AVEC LOGS DÉTAILLÉS
	console.log('🔨 === CONSTRUCTION DU PAYLOAD ===');
	
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
	console.log('📤 Payload construit:', {
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
	console.log('🔍 Payload complet (JSON):', JSON.stringify(requestBody, null, 2));
	console.log('🔍 Structure du payload:', {
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
	console.log('🏁 === FIN CONSTRUCTION PAYLOAD ===\n');

	// Appel à l'API Sendcloud
	console.log('🚀 Envoi de la requête à Sendcloud...');
	console.log('🎯 Endpoint:', endpoint);
	console.log('🔑 Headers:', {
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

	console.log('📥 Réponse reçue:', {
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
		console.log('🔍 === ANALYSE DE L\'ERREUR ===');
		try {
			const errorJson = JSON.parse(txt);
			console.log('📋 Erreur parsée (JSON):', JSON.stringify(errorJson, null, 2));
			
			if (errorJson.errors && Array.isArray(errorJson.errors)) {
				console.log('📋 Détail des erreurs:');
				errorJson.errors.forEach((error: any, index: number) => {
					console.log(`  Erreur ${index + 1}:`, {
						status: error.status,
						code: error.code,
						detail: error.detail,
						source: error.source,
						pointer: error.source?.pointer
					});
				});
			}
		} catch (parseError) {
			console.log('⚠️ Impossible de parser l\'erreur en JSON:', parseError);
			console.log('📋 Erreur brute:', txt);
		}
		console.log('🏁 === FIN ANALYSE ERREUR ===\n');
		
		return;
	}

	const responseData = await response.json();
	console.log('✅ Réponse Sendcloud reçue:', {
		status: responseData.status || 'unknown',
		data_count: responseData.parcels?.length || 0
	});

	// ✅ LOG COMPLET DE LA RÉPONSE SUCCÈS
	console.log('🔍 === ANALYSE RÉPONSE SUCCÈS ===');
	console.log('📋 Réponse complète (JSON):', JSON.stringify(responseData, null, 2));
	console.log('📋 Clés disponibles dans responseData:', Object.keys(responseData));
	console.log('📋 Type de responseData:', typeof responseData);
	
	// ✅ L'API v2 /parcels retourne directement un tableau de parcels
	if (responseData.parcels && Array.isArray(responseData.parcels)) {
		console.log('📋 responseData.parcels est un tableau de longueur:', responseData.parcels.length);
		responseData.parcels.forEach((parcel: any, index: number) => {
			console.log(`📋 Parcel ${index}:`, {
				clés: Object.keys(parcel),
				type: typeof parcel
			});
			console.log(`📋 Contenu du parcel ${index}:`, JSON.stringify(parcel, null, 2));
		});
	} else {
		console.log('⚠️ responseData.parcels n\'est pas un tableau ou est undefined');
		console.log('📋 Type de responseData.parcels:', typeof responseData.parcels);
		console.log('📋 Valeur de responseData.parcels:', responseData.parcels);
	}
	console.log('🏁 === FIN ANALYSE RÉPONSE SUCCÈS ===\n');

	// -- Récupération correcte : responseData.parcels est un tableau contenant les parcels créés
	const [parcel] = responseData.parcels || [];
	if (!parcel) {
		console.error('❌ Pas de parcels dans la réponse Sendcloud');
		console.error('📋 Réponse complète:', responseData);
		return;
	}

	// ✅ LOG DÉTAILLÉ DU COLIS
	console.log('🔍 === ANALYSE DU COLIS ===');
	console.log('📋 Colis complet:', JSON.stringify(parcel, null, 2));
	console.log('📋 Clés disponibles dans parcel:', Object.keys(parcel));
	console.log('📋 Type de parcel:', typeof parcel);
	
	// ✅ L'API v2 /parcels retourne des champs différents
	const parcelId = parcel.id || parcel.parcel_id;
	const trackingNumber = parcel.tracking_number;
	const trackingUrl = parcel.label?.label_printer_url || parcel.label_url;
	
	console.log('📦 Données de colis extraites:', {
		parcel_id: parcelId,
		tracking_number: trackingNumber ? 'Oui' : 'Non',
		tracking_url: trackingUrl ? 'Oui' : 'Non'
	});
	
	// ✅ LOG DÉTAILLÉ DES CHAMPS DU COLIS
	console.log('📋 Tous les champs du colis:');
	Object.entries(parcel).forEach(([key, value]) => {
		console.log(`  - ${key}:`, {
			valeur: value,
			type: typeof value,
			existe: value !== undefined && value !== null
		});
	});
	console.log('🏁 === FIN ANALYSE COLIS ===\n');

	// Vérification que la transaction existe vraiment
	console.log('🔍 Vérification de l\'existence de la transaction en base...');
	const existingTransaction = await prisma.transaction.findUnique({
		where: { id: transaction.id.toString() }
	});

	if (!existingTransaction) {
		console.error(`❌ La transaction avec l'ID ${transaction.id} n'existe pas.`);
		return;
	}

	console.log('✅ Transaction trouvée en base, mise à jour...');

	// Mise à jour des infos Sendcloud dans la transaction
	await prisma.transaction.update({
		where: { id: transaction.id.toString() },
		data: {
			sendcloudParcelId: parcelId,
			trackingNumber: trackingNumber,
			trackingUrl: trackingUrl
		}
	});

	console.log('✅ Transaction mise à jour avec les informations Sendcloud');
	console.log('🏁 === FIN CRÉATION ÉTIQUETTE SENDCLOUD ===\n');
}

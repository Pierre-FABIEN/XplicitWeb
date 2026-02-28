/**
 * Route API Shippo pour les options de livraison
 * API Shippo pour la gestion des expéditions
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createShippoClientForProject } from '$lib/shippo';
import { validateShippoConfig } from '$lib/shippo';

export const POST: RequestHandler = async ({ request }) => {

	let requestBody;
	try {
		requestBody = await request.json();
		console.log('📥 [API SHIPPO] Données reçues:', {
			hasRequestBody: !!requestBody,
			keys: requestBody ? Object.keys(requestBody) : [],
			fromCountry: requestBody?.from_country_code,
			toCountry: requestBody?.to_country_code,
			weight: requestBody?.weight
		});
	} catch (parseError) {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	
	try {

		const {
			from_country_code = 'FR',
			to_country_code,
			from_postal_code = process.env.SHIPPO_SENDER_POSTAL_CODE || '31620', // Code postal expéditeur depuis .env
			to_postal_code,
			weight,
			prefer_service_point = process.env.SHIPPO_PREFER_SERVICE_POINT === 'true',
			max_options = parseInt(process.env.SHIPPO_MAX_OPTIONS || '10'),
			// Nouvelles données client pour l'adresse destinataire
			client_address = {}
		} = requestBody;

		// Validation des données requises
		if (!to_country_code || !to_postal_code || !weight) {
			return json({ 
				error: 'Données manquantes: to_country_code, to_postal_code et weight sont requis' 
			}, { status: 400 });
		}

		// Vérifier la configuration Shippo
		const config = validateShippoConfig();
		if (!config.isValid) {
			return json({ 
				error: 'Configuration Shippo invalide',
				details: config.errors
			}, { status: 500 });
		}

		// Créer le client Shippo
		let client;
		try {
			client = createShippoClientForProject();
		} catch (clientError) {
			throw new Error(`Erreur création client: ${clientError instanceof Error ? clientError.message : 'Erreur inconnue'}`);
		}

		// Créer les adresses Shippo
		
		let senderAddress, recipientAddress;
		
		try {
		// Adresse expéditeur (votre entreprise) - depuis .env
		senderAddress = await client.createAddress({
			name: process.env.SHIPPO_SENDER_NAME || 'Votre Entreprise',
			company: process.env.SHIPPO_SENDER_COMPANY || 'Mon E-commerce',
			street1: process.env.SHIPPO_SENDER_ADDRESS || '123 Rue de l\'Expéditeur',
			city: process.env.SHIPPO_SENDER_CITY || 'Toulouse',
			zip: from_postal_code,
			country: from_country_code,
			phone: process.env.SHIPPO_SENDER_PHONE || '0123456789',
			email: process.env.SHIPPO_SENDER_EMAIL || 'expedition@votre-entreprise.com',
			is_residential: false
		});

			// Adresse destinataire (utiliser les vraies données du client)
			recipientAddress = await client.createAddress({
				name: client_address.name || 'Client',
				company: client_address.company || '',
				street1: client_address.street || `${to_postal_code} ${client_address.city || 'Ville'}`,
				city: client_address.city || 'Ville',
				zip: to_postal_code,
				country: to_country_code,
				phone: client_address.phone || '',
				email: client_address.email || '',
				is_residential: true
			});
		} catch (addressError) {
			throw new Error(`Erreur création adresses: ${addressError instanceof Error ? addressError.message : 'Erreur inconnue'}`);
		}

		console.log('✅ [API SHIPPO] Adresses créées:', {
			sender: senderAddress.object_id,
			recipient: recipientAddress.object_id
		});

		// Créer le colis avec dimensions simples
		
		// Dimensions simples selon le poids
		const weightValue = parseFloat(requestBody.weight?.value || '6');
		let dimensions;
		if (weightValue <= 3) {
			dimensions = { length: 40, width: 30, height: 20 };
		} else if (weightValue <= 6) {
			dimensions = { length: 50, width: 40, height: 30 };
		} else {
			dimensions = { length: 60, width: 50, height: 40 };
		}
		
		console.log('📦 [API SHIPPO] Dimensions sélectionnées:', {
			dimensions: `${dimensions.length}x${dimensions.width}x${dimensions.height}cm`,
			weight: `${weightValue}kg`
		});
		
		const parcel = await client.createParcel({
			length: dimensions.length,
			width: dimensions.width,
			height: dimensions.height,
			distance_unit: 'cm' as const,
			weight: weightValue,
			mass_unit: 'kg' as const
		});


		// Créer le shipment
		const shipment = await client.createShipment({
			address_from: senderAddress.object_id,
			address_to: recipientAddress.object_id,
			parcels: [parcel.object_id],
			carrier_accounts: [], // Utiliser tous les transporteurs disponibles
			metadata: `Checkout ${Date.now()}`
		});


		// Récupérer les rates
		const rates = await client.getShipmentRates(shipment.object_id);


		// Log détaillé des rates pour debug
		console.log('🔍 [API SHIPPO] Détail des rates reçus:', rates.map(rate => ({
			object_id: rate.object_id,
			carrier: rate.carrier,
			service: rate.servicelevel?.name,
			amount: rate.amount
		})));

		// Convertir les rates Shippo vers le format attendu par le frontend
		const shippingOptions = rates.map(rate => {
			// Déterminer le type de livraison
			let type = 'home_delivery';
			if (rate.servicelevel?.token?.includes('service_point') || 
				rate.servicelevel?.token?.includes('pickup') ||
				rate.servicelevel?.token?.includes('shop2shop') ||
				rate.servicelevel?.name?.toLowerCase().includes('point relais') ||
				rate.servicelevel?.name?.toLowerCase().includes('point retrait') ||
				rate.servicelevel?.name?.toLowerCase().includes('relais')) {
				type = 'service_point';
			}

			// Déterminer le transporteur
			let carrierCode = (rate.carrier || 'unknown').toLowerCase();
			console.log('🔍 [API SHIPPO] Détection carrier:', {
				rateCarrier: rate.carrier,
				initialCarrierCode: carrierCode,
				serviceName: rate.servicelevel?.name
			});
			
			if (carrierCode.includes('colissimo')) {
				carrierCode = 'colissimo';
			} else if (carrierCode.includes('chronopost')) {
				carrierCode = 'chronopost';
			} else if (carrierCode.includes('dpd')) {
				carrierCode = 'dpd';
			} else if (carrierCode.includes('ups')) {
				carrierCode = 'ups';
			}
			
			// Détection basée sur le nom du service si carrier est inconnu
			if (carrierCode === 'unknown') {
				const serviceName = (rate.servicelevel?.name || '').toLowerCase();
				
				if (serviceName.includes('chrono')) {
					carrierCode = 'chronopost';
				} else if (serviceName.includes('colissimo')) {
					carrierCode = 'colissimo';
				} else if (serviceName.includes('dpd')) {
					carrierCode = 'dpd';
				} else if (serviceName.includes('ups')) {
					carrierCode = 'ups';
				} else if (serviceName.includes('domicile') || serviceName.includes('point retrait')) {
					carrierCode = 'colissimo'; // Services Colissimo typiques
				} else if (serviceName.includes('dpd') || serviceName.includes('pickup')) {
					carrierCode = 'dpd'; // Services DPD typiques
				}
				
			}

			const option = {
				id: rate.object_id,
				carrierCode: carrierCode,
				type: type,
				price: parseFloat(rate.amount), // Convertir en nombre
				currency: rate.currency,
				productName: rate.servicelevel.name,
				estimatedDays: rate.days,
				// Données Shippo pour référence
				shippoRateId: rate.object_id,
				shippoShipmentId: shipment.object_id,
				shippoSenderAddressId: senderAddress.object_id,
				shippoRecipientAddressId: recipientAddress.object_id,
				shippoParcelId: parcel.object_id
			};
			
			console.log('📦 [API SHIPPO] Option créée:', {
				id: option.id,
				carrierCode: option.carrierCode,
				type: option.type,
				productName: option.productName,
				price: option.price
			});
			
			return option;
		});

		// Filtrer selon les préférences
		let filteredOptions = shippingOptions;
		
		if (prefer_service_point) {
			// Prioriser les points relais
			filteredOptions = [
				...shippingOptions.filter(opt => opt.type === 'service_point'),
				...shippingOptions.filter(opt => opt.type === 'home_delivery')
			];
		}

		// Limiter le nombre d'options
		filteredOptions = filteredOptions.slice(0, max_options);

		console.log('🎯 [API SHIPPO] Options filtrées:', {
			total: shippingOptions.length,
			filtered: filteredOptions.length,
			types: {
				service_point: filteredOptions.filter(o => o.type === 'service_point').length,
				home_delivery: filteredOptions.filter(o => o.type === 'home_delivery').length
			}
		});

		// Réponse au format compatible avec le frontend existant
		const response = {
			data: filteredOptions,
			meta: {
				total: filteredOptions.length,
				shipment_id: shipment.object_id,
				from_country: from_country_code,
				to_country: to_country_code,
				weight: weight.value,
				weight_unit: weight.unit
			},
			filtering: {
				prefer_service_point,
				max_options,
				applied_filters: ['carrier_availability', 'service_type']
			}
		};

		console.log('✅ [API SHIPPO] Réponse envoyée:', {
			options_count: response.data.length,
			meta: response.meta
		});

		return json(response);

	} catch (error) {
		
		// Fallback : utiliser des données simulées
		
		const simulatedOptions = [
			{
				id: 'colissimo_home_1',
				carrierCode: 'colissimo',
				type: 'home_delivery',
				price: 8.50,
				currency: 'EUR',
				productName: 'Colissimo Home',
				estimatedDays: 2,
				shippoRateId: 'rate_fallback_1',
				shippoShipmentId: 'ship_fallback_1',
				shippoSenderAddressId: 'addr_sender_fallback',
				shippoRecipientAddressId: 'addr_recipient_fallback',
				shippoParcelId: 'parcel_fallback_1'
			},
			{
				id: 'colissimo_point_1',
				carrierCode: 'colissimo',
				type: 'service_point',
				price: 6.50,
				currency: 'EUR',
				productName: 'Colissimo Point Relais',
				estimatedDays: 2,
				shippoRateId: 'rate_fallback_2',
				shippoShipmentId: 'ship_fallback_2',
				shippoSenderAddressId: 'addr_sender_fallback',
				shippoRecipientAddressId: 'addr_recipient_fallback',
				shippoParcelId: 'parcel_fallback_2'
			},
			{
				id: 'chronopost_home_1',
				carrierCode: 'chronopost',
				type: 'home_delivery',
				price: 12.90,
				currency: 'EUR',
				productName: 'Chronopost 24H',
				estimatedDays: 1,
				shippoRateId: 'rate_fallback_3',
				shippoShipmentId: 'ship_fallback_3',
				shippoSenderAddressId: 'addr_sender_fallback',
				shippoRecipientAddressId: 'addr_recipient_fallback',
				shippoParcelId: 'parcel_fallback_3'
			},
			{
				id: 'dpd_home_1',
				carrierCode: 'dpd',
				type: 'home_delivery',
				price: 9.90,
				currency: 'EUR',
				productName: 'DPD Classic',
				estimatedDays: 2,
				shippoRateId: 'rate_fallback_4',
				shippoShipmentId: 'ship_fallback_4',
				shippoSenderAddressId: 'addr_sender_fallback',
				shippoRecipientAddressId: 'addr_recipient_fallback',
				shippoParcelId: 'parcel_fallback_4'
			}
		];

		// Filtrer selon les préférences
		let filteredOptions = simulatedOptions;
		
		if (requestBody.prefer_service_point) {
			filteredOptions = [
				...simulatedOptions.filter(opt => opt.type === 'service_point'),
				...simulatedOptions.filter(opt => opt.type === 'home_delivery')
			];
		}

		// Limiter le nombre d'options
		filteredOptions = filteredOptions.slice(0, requestBody.max_options);

		const fallbackResponse = {
			data: filteredOptions,
			meta: {
				total: filteredOptions.length,
				shipment_id: 'ship_fallback',
				from_country: requestBody.from_country_code,
				to_country: requestBody.to_country_code,
				weight: requestBody.weight.value,
				weight_unit: requestBody.weight.unit,
				fallback: true,
				shippo_error: error instanceof Error ? error.message : 'Erreur inconnue'
			},
			filtering: {
				prefer_service_point: requestBody.prefer_service_point,
				max_options: requestBody.max_options,
				applied_filters: ['fallback_data', 'carrier_availability']
			}
		};

		console.log('✅ [API SHIPPO] Réponse fallback envoyée:', {
			options_count: fallbackResponse.data.length,
			fallback: true,
			shippo_error: fallbackResponse.meta.shippo_error
		});

		return json(fallbackResponse);
	}
};

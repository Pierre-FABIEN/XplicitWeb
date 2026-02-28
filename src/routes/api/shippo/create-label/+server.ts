/**
 * Route API Shippo pour créer une étiquette après paiement
 * API Shippo pour la génération d'étiquettes d'expédition
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createShippoClientForProject } from '$lib/shippo';
import { quickLabelPurchase } from '$lib/shippo';

export const POST: RequestHandler = async ({ request }) => {

	try {
		const body = await request.json();

		const {
			transactionId,
			orderData,
			shippingOption,
			servicePointData
		} = body;

		// Validation des données requises
		if (!transactionId || !orderData || !shippingOption) {
			return json({ 
				error: 'Données manquantes: transactionId, orderData et shippingOption sont requis' 
			}, { status: 400 });
		}

		// Préparer les données de transaction pour Shippo
		const shippoTransactionData = {
			id: transactionId,
			amount: orderData.amount || 0,
			currency: orderData.currency || 'EUR',
			status: 'paid',
			
			// Adresse destinataire
			address_first_name: orderData.address_first_name || '',
			address_last_name: orderData.address_last_name || '',
			address_company: orderData.address_company || '',
			address_phone: orderData.address_phone || '',
			address_street: orderData.address_street || '',
			address_street_number: orderData.address_street_number || '',
			address_city: orderData.address_city || '',
			address_zip: orderData.address_zip || '',
			address_country_code: orderData.address_country_code || 'FR',
			customer_details_email: orderData.customer_details_email || '',
			
			// Adresse expéditeur (votre entreprise)
			sender_name: 'Votre Entreprise',
			sender_company: 'Mon E-commerce',
			sender_address: '123 Rue de l\'Expéditeur',
			sender_city: 'Toulouse',
			sender_postal_code: '31620',
			sender_country: 'FR',
			sender_telephone: '0123456789',
			sender_email: 'expedition@votre-entreprise.com',
			
			// Colis
			package_length: orderData.package_length || 40,
			package_width: orderData.package_width || 30,
			package_height: orderData.package_height || 20,
			package_dimension_unit: 'cm',
			package_weight: orderData.package_weight || 1.0,
			package_weight_unit: 'kg',
			
			// Produits
			products: orderData.products || [],
			
			// Point relais (si applicable)
			...(servicePointData ? {
				servicePointId: servicePointData.id,
				servicePointName: servicePointData.name,
				servicePointAddress: servicePointData.address,
				servicePointCity: servicePointData.city,
				servicePointZip: servicePointData.postal_code,
				servicePointCountry: servicePointData.country,
				servicePointLatitude: servicePointData.latitude,
				servicePointLongitude: servicePointData.longitude,
				servicePointType: servicePointData.shop_type,
				servicePointPostNumber: servicePointData.extra_data?.shop_ref || ''
			} : {}),
			
			// Métadonnées
			createdAt: new Date(),
			order_number: orderData.order_number || `ORDER-${transactionId}`
		};

		console.log('🚀 [API SHIPPO] Création de l\'étiquette avec les données:', {
			transactionId,
			hasServicePoint: !!servicePointData,
			packageWeight: shippoTransactionData.package_weight,
			productsCount: shippoTransactionData.products.length
		});

		// Créer l'étiquette avec Shippo
		const result = await quickLabelPurchase(shippoTransactionData, {
			preferredCarriers: ['colissimo', 'chronopost', 'dpd'],
			labelFileType: 'PDF',
			preferCheapest: true
		});

		console.log('✅ [API SHIPPO] Étiquette créée:', {
			status: result.labelResult.status,
			trackingNumber: result.labelResult.trackingNumber,
			labelUrl: result.labelResult.labelUrl,
			cost: result.metadata.totalCost,
			carrier: result.metadata.carrier
		});

		// Réponse au format compatible avec votre système existant
		const response = {
			success: result.labelResult.status === 'SUCCESS',
			transactionId: transactionId,
			shippoTransactionId: result.transaction.object_id,
			shippoShipmentId: result.shipment.object_id,
			shippoRateId: result.selectedRate.object_id,
			trackingNumber: result.labelResult.trackingNumber,
			trackingUrl: result.labelResult.trackingUrl,
			labelUrl: result.labelResult.labelUrl,
			cost: result.metadata.totalCost,
			currency: result.metadata.currency,
			carrier: result.metadata.carrier,
			service: result.metadata.service,
			estimatedDays: result.metadata.estimatedDays,
			// Adresses Shippo pour référence
			shippoSenderAddressId: result.addresses.senderAddressId,
			shippoRecipientAddressId: result.addresses.recipientAddressId,
			shippoServicePointAddressId: result.addresses.servicePointAddressId,
			// Messages d'erreur si applicable
			messages: result.labelResult.messages || []
		};

		if (result.labelResult.status === 'SUCCESS') {
			return json(response);
		} else {
			return json(response, { status: 400 });
		}

	} catch (error) {
		
		return json({ 
			success: false,
			error: 'Erreur lors de la création de l\'étiquette',
			details: error instanceof Error ? error.message : 'Erreur inconnue'
		}, { status: 500 });
	}
};

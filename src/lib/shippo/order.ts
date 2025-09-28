import { createShippoClientFromEnv } from './client';
import { SHIPPO_CONFIG } from './config';
import type { Transaction } from '@prisma/client';
import { prisma } from '$lib/server';

/**
 * Crée une commande Shippo à partir d'une transaction payée
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
		
		// Utiliser les informations de la commande au lieu de chercher dans les tarifs Shippo
		// Car les object_id changent à chaque requête Shippo
		console.log('✅ [SHIPPO ORDER] Utilisation des informations de la commande:', {
			shippingOption: order.shippingOption,
			shippingCarrier: order.shippingCarrier,
			shippingCost: order.shippingCost
		});

		// Créer un objet rate basé sur les informations de la commande
		const selectedRate = {
			object_id: order.shippingOption || rates[0]?.object_id, // Utiliser l'ID de la commande ou le premier disponible
			carrier: order.shippingCarrier || 'colissimo',
			servicelevel: { name: order.shippingCarrier === 'chronopost' ? 'Chrono Point Relais' : 'Point Retrait' },
			amount: order.shippingCost?.toString() || '0'
		};

		console.log('✅ [SHIPPO ORDER] Tarif reconstruit depuis la commande:', {
			object_id: selectedRate.object_id,
			carrier: selectedRate.carrier,
			service: selectedRate.servicelevel.name,
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

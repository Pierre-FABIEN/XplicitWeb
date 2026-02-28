import { createShippoClientFromEnv } from './client';
import type { Transaction } from '@prisma/client';

/**
 * Crée une étiquette Shippo à partir d'une transaction payée
 * Cette fonction est appelée après le paiement réussi
 */
export async function createShippoLabel(transaction: any) {
	console.log('🏷️ [SHIPPO LABEL] Création de l\'étiquette:', {
		transactionId: transaction.id,
		orderId: transaction.orderId,
		status: transaction.status
	});

	try {
		// Vérifier que la transaction est payée
		if (transaction.status !== 'paid') {
			throw new Error(`Transaction ${transaction.id} n'est pas payée (status: ${transaction.status})`);
		}

		// Si on a déjà une étiquette Shippo, ne pas en créer une nouvelle
		if (transaction.shippoTransactionId) {
			return {
				success: true,
				alreadyExists: true,
				shippoTransactionId: transaction.shippoTransactionId,
				labelUrl: transaction.labelUrl,
				trackingNumber: transaction.trackingNumber
			};
		}

		// Créer la commande Shippo (qui inclut la création de l'étiquette)
		const orderResult = await createShippoOrder(transaction);
		
		console.log('✅ [SHIPPO LABEL] Étiquette créée avec succès:', {
			shippoTransactionId: orderResult.shippoTransactionId,
			labelUrl: orderResult.labelUrl,
			trackingNumber: orderResult.trackingNumber
		});

		return orderResult;

	} catch (error) {
		throw error;
	}
}

/**
 * Récupère le statut d'une étiquette Shippo
 */
export async function getShippoLabelStatus(shippoTransactionId: string) {

	try {
		const shippoClient = createShippoClientFromEnv();
		const transaction = await shippoClient.getTransaction(shippoTransactionId);
		
		console.log('📊 [SHIPPO LABEL] Statut récupéré:', {
			status: transaction.status,
			labelUrl: transaction.label_url,
			trackingNumber: transaction.tracking_number
		});

		return {
			status: transaction.status,
			labelUrl: transaction.label_url,
			trackingNumber: transaction.tracking_number,
			carrier: (transaction as any).rate?.carrier,
			service: (transaction as any).rate?.servicelevel?.name
		};

	} catch (error) {
		throw error;
	}
}

/**
 * Annule une étiquette Shippo
 */
export async function cancelShippoLabel(shippoTransactionId: string) {

	try {
		const shippoClient = createShippoClientFromEnv();
		
		// Note: Shippo ne permet pas l'annulation des étiquettes déjà créées
		// On peut seulement marquer la transaction comme annulée côté base
		
		return {
			success: false,
			message: 'Annulation non supportée par Shippo'
		};

	} catch (error) {
		throw error;
	}
}

// Import de la fonction createShippoOrder depuis le fichier order.ts
import { createShippoOrder } from './order';

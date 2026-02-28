/**
 * Vérifie le statut des étiquettes Shippo en attente
 * et met à jour les URLs et numéros de suivi quand disponibles
 */

import { createShippoClientFromEnv } from './client';
import { prisma } from '$lib/server/prisma';

/**
 * Vérifie toutes les transactions avec des étiquettes Shippo en attente
 */
export async function checkPendingShippoLabels() {

	try {
		const shippoClient = createShippoClientFromEnv();

		// Récupérer toutes les transactions avec des étiquettes Shippo mais sans URL
		const pendingTransactions = await prisma.transaction.findMany({
			where: {
				shippoTransactionId: { not: null },
				OR: [
					{ labelUrl: null },
					{ labelUrl: '' },
					{ trackingNumber: null },
					{ trackingNumber: '' }
				]
			},
			include: {
				order: true
			}
		});


		for (const transaction of pendingTransactions) {
			if (!transaction.shippoTransactionId) continue;

			try {
				
				const shippoTransaction = await shippoClient.getTransaction(transaction.shippoTransactionId);
				
				console.log(`📊 [SHIPPO CHECK] Statut Shippo:`, {
					transactionId: transaction.shippoTransactionId,
					status: shippoTransaction.status,
					hasLabelUrl: !!shippoTransaction.label_url,
					hasTrackingNumber: !!shippoTransaction.tracking_number
				});

				// Si l'étiquette est prête, mettre à jour la base
				if (shippoTransaction.status === 'SUCCESS' && shippoTransaction.label_url) {
					await prisma.transaction.update({
						where: { id: transaction.id },
						data: {
							labelUrl: shippoTransaction.label_url,
							trackingNumber: shippoTransaction.tracking_number || '',
							// Mettre à jour aussi les métadonnées si disponibles
							...(shippoTransaction.carrier && { carrier: shippoTransaction.carrier }),
							...(shippoTransaction.servicelevel?.name && { service: shippoTransaction.servicelevel.name })
						}
					});

					console.log(`✅ [SHIPPO CHECK] Transaction mise à jour: ${transaction.id}`, {
						labelUrl: shippoTransaction.label_url,
						trackingNumber: shippoTransaction.tracking_number
					});
				} else if (shippoTransaction.status === 'ERROR') {
					
					// Marquer comme erreur dans la base
					await prisma.transaction.update({
						where: { id: transaction.id },
						data: {
							status: 'shipping_error',
							errorMessage: `Erreur Shippo: ${shippoTransaction.messages?.[0]?.text || 'Erreur inconnue'}`
						}
					});
				}

			} catch (error) {
			}
		}


	} catch (error) {
	}
}

/**
 * Vérifie une transaction spécifique
 */
export async function checkSpecificShippoLabel(transactionId: string) {

	try {
		const shippoClient = createShippoClientFromEnv();
		const shippoTransaction = await shippoClient.getTransaction(transactionId);

		console.log(`📊 [SHIPPO CHECK] Résultat:`, {
			transactionId,
			status: shippoTransaction.status,
			labelUrl: shippoTransaction.label_url,
			trackingNumber: shippoTransaction.tracking_number,
			carrier: shippoTransaction.carrier,
			service: shippoTransaction.servicelevel?.name
		});

		return {
			status: shippoTransaction.status,
			labelUrl: shippoTransaction.label_url,
			trackingNumber: shippoTransaction.tracking_number,
			carrier: shippoTransaction.carrier,
			service: shippoTransaction.servicelevel?.name,
			messages: shippoTransaction.messages
		};

	} catch (error) {
		throw error;
	}
}

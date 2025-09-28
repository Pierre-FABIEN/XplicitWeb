/**
 * Route API pour vérifier le statut des étiquettes Shippo
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkPendingShippoLabels, checkSpecificShippoLabel } from '$lib/shippo/status-checker';

export const POST: RequestHandler = async ({ request }) => {
	console.log('🔍 [API SHIPPO] Vérification du statut des étiquettes');

	try {
		const { action, transactionId } = await request.json();

		if (action === 'check_all') {
			console.log('📋 [API SHIPPO] Vérification de toutes les étiquettes en attente');
			await checkPendingShippoLabels();
			
			return json({
				success: true,
				message: 'Vérification terminée',
				action: 'check_all'
			});
		}

		if (action === 'check_specific' && transactionId) {
			console.log(`🔍 [API SHIPPO] Vérification spécifique: ${transactionId}`);
			const result = await checkSpecificShippoLabel(transactionId);
			
			return json({
				success: true,
				result,
				action: 'check_specific'
			});
		}

		return json({
			success: false,
			error: 'Action non reconnue ou transactionId manquant'
		}, { status: 400 });

	} catch (error) {
		console.error('❌ [API SHIPPO] Erreur lors de la vérification:', error);
		
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Erreur inconnue'
		}, { status: 500 });
	}
};

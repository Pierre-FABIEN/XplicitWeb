/**
 * Endpoint de test pour vérifier la configuration Shippo
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateShippoConfiguration } from '$lib/shippo/config';

export const GET: RequestHandler = async () => {

	try {
		// Vérifier la configuration
		const configValid = validateShippoConfiguration();

		// Vérifier les variables d'environnement
		const envCheck = {
			hasApiToken: !!process.env.SHIPPO_API_TOKEN,
			hasSenderName: !!process.env.SHIPPO_SENDER_NAME,
			hasSenderCity: !!process.env.SHIPPO_SENDER_CITY,
			hasSenderPostal: !!process.env.SHIPPO_SENDER_POSTAL_CODE,
			apiTokenPrefix: process.env.SHIPPO_API_TOKEN?.substring(0, 10) + '...'
		};

		return json({
			success: true,
			message: 'Configuration Shippo OK',
			config: configValid,
			environment: envCheck,
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Erreur inconnue',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

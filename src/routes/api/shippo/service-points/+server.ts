/**
 * Route API Shippo pour les points relais
 * API Shippo pour la gestion des points de collecte
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createShippoClientForProject } from '$lib/shippo';

export const POST: RequestHandler = async ({ request }) => {
	console.log('📍 [API SHIPPO] Demande de points relais reçue');

	try {
		const body = await request.json();
		console.log('📥 [API SHIPPO] Données reçues:', body);

		const {
			to_country_code,
			to_postal_code,
			radius = 5000, // Rayon en mètres
			carriers // Transporteur spécifique
		} = body;

		// Validation des données requises
		if (!to_country_code || !to_postal_code) {
			return json({ 
				error: 'Données manquantes: to_country_code et to_postal_code sont requis' 
			}, { status: 400 });
		}

		// Créer le client Shippo
		const client = createShippoClientForProject();

		// Pour Shippo, nous devons utiliser l'API des transporteurs pour récupérer les points relais
		// Note: Shippo ne fournit pas directement une API de points relais comme les autres services
		// Nous allons simuler les points relais basés sur le transporteur et la localisation

		console.log('🔍 [API SHIPPO] Recherche de points relais pour:', {
			carrier: carriers,
			country: to_country_code,
			postal_code: to_postal_code,
			radius: radius
		});

		// Simulation de points relais basés sur le transporteur et la localisation
		// Dans un vrai projet, vous devriez intégrer avec l'API spécifique du transporteur
		const servicePoints = generateServicePoints(carriers, to_postal_code, to_country_code, body.client_address);

		console.log('✅ [API SHIPPO] Points relais générés:', servicePoints.length);

		return json(servicePoints);

	} catch (error) {
		console.error('❌ [API SHIPPO] Erreur:', error);
		
		return json({ 
			error: 'Erreur lors de la récupération des points relais',
			details: error instanceof Error ? error.message : 'Erreur inconnue'
		}, { status: 500 });
	}
};

/**
 * Génère des points relais simulés basés sur le transporteur et la localisation
 * Dans un vrai projet, vous devriez utiliser l'API spécifique du transporteur
 */
function generateServicePoints(carrier: string, postalCode: string, country: string, clientAddress?: any) {
	// Coordonnées de base basées sur l'adresse du client ou Montauban par défaut
	let baseLat = 44.0167; // Montauban par défaut
	let baseLng = 1.3542;
	
	// Si on a l'adresse du client, utiliser ses coordonnées
	if (clientAddress?.city?.toLowerCase() === 'montauban') {
		baseLat = 44.0167;
		baseLng = 1.3542;
	} else if (clientAddress?.city?.toLowerCase() === 'toulouse') {
		baseLat = 43.6047;
		baseLng = 1.4437;
	} else if (clientAddress?.city?.toLowerCase() === 'paris') {
		baseLat = 48.8566;
		baseLng = 2.3522;
	}
	
	console.log('📍 [API SHIPPO] Génération points relais autour de:', {
		city: clientAddress?.city || 'Montauban',
		coordinates: [baseLng, baseLat],
		carrier: carrier
	});
	const basePoints = [
		{
			id: 1,
			name: 'Relais Colis - Pharmacie Centrale',
			address: '12 Rue de Rivoli',
			city: clientAddress?.city || 'Montauban',
			postal_code: postalCode,
			country: country,
			latitude: baseLat,
			longitude: baseLng,
			shop_type: 'pharmacy',
			extra_data: {
				ref_cab: 'RC001',
				shop_ref: 'PHARM001'
			},
			opening_hours: {
				monday: '08:00-20:00',
				tuesday: '08:00-20:00',
				wednesday: '08:00-20:00',
				thursday: '08:00-20:00',
				friday: '08:00-20:00',
				saturday: '09:00-19:00',
				sunday: '10:00-18:00'
			}
		},
		{
			id: 2,
			name: 'Chronopost Shop2Shop - Tabac Presse',
			address: '45 Avenue des Champs',
			city: clientAddress?.city || 'Montauban',
			postal_code: postalCode,
			country: country,
			latitude: baseLat + 0.001,
			longitude: baseLng + 0.001,
			shop_type: 'tobacco',
			extra_data: {
				ref_cab: 'CHR001',
				shop_ref: 'TABAC001'
			},
			opening_hours: {
				monday: '07:00-21:00',
				tuesday: '07:00-21:00',
				wednesday: '07:00-21:00',
				thursday: '07:00-21:00',
				friday: '07:00-21:00',
				saturday: '08:00-20:00',
				sunday: '09:00-19:00'
			}
		},
		{
			id: 3,
			name: 'DPD Pickup - Supermarché',
			address: '78 Boulevard Saint-Germain',
			city: clientAddress?.city || 'Montauban',
			postal_code: postalCode,
			country: country,
			latitude: baseLat - 0.002,
			longitude: baseLng + 0.003,
			shop_type: 'supermarket',
			extra_data: {
				ref_cab: 'DPD001',
				shop_ref: 'SUPER001'
			},
			opening_hours: {
				monday: '08:30-21:00',
				tuesday: '08:30-21:00',
				wednesday: '08:30-21:00',
				thursday: '08:30-21:00',
				friday: '08:30-21:00',
				saturday: '08:30-20:00',
				sunday: '09:00-19:00'
			}
		},
		{
			id: 4,
			name: 'Relais Colis - Boulangerie',
			address: '23 Rue de la Paix',
			city: clientAddress?.city || 'Montauban',
			postal_code: postalCode,
			country: country,
			latitude: baseLat + 0.003,
			longitude: baseLng - 0.001,
			shop_type: 'bakery',
			extra_data: {
				ref_cab: 'RC002',
				shop_ref: 'BOUL001'
			},
			opening_hours: {
				monday: '06:00-20:00',
				tuesday: '06:00-20:00',
				wednesday: '06:00-20:00',
				thursday: '06:00-20:00',
				friday: '06:00-20:00',
				saturday: '06:00-19:00',
				sunday: '07:00-18:00'
			}
		},
		{
			id: 5,
			name: 'Chronopost Shop2Shop - Bureau de Poste',
			address: '56 Rue du Commerce',
			city: clientAddress?.city || 'Montauban',
			postal_code: postalCode,
			country: country,
			latitude: baseLat - 0.001,
			longitude: baseLng - 0.002,
			shop_type: 'post_office',
			extra_data: {
				ref_cab: 'CHR002',
				shop_ref: 'POST001'
			},
			opening_hours: {
				monday: '08:00-18:00',
				tuesday: '08:00-18:00',
				wednesday: '08:00-18:00',
				thursday: '08:00-18:00',
				friday: '08:00-18:00',
				saturday: '08:00-12:00',
				sunday: 'closed'
			}
		}
	];

	// Filtrer selon le transporteur
	let filteredPoints = basePoints;
	
	if (carrier === 'colissimo' || carrier === 'colisprive') {
		filteredPoints = basePoints.filter(point => 
			point.name.includes('Relais Colis')
		);
	} else if (carrier === 'chronopost') {
		filteredPoints = basePoints.filter(point => 
			point.name.includes('Chronopost')
		);
	} else if (carrier === 'dpd') {
		filteredPoints = basePoints.filter(point => 
			point.name.includes('DPD')
		);
	}

	// Ajouter des variations de coordonnées pour simuler différents emplacements
	const variations = [
		{ lat: 0.001, lng: 0.001 },
		{ lat: -0.002, lng: 0.003 },
		{ lat: 0.003, lng: -0.001 },
		{ lat: -0.001, lng: -0.002 },
		{ lat: 0.002, lng: 0.002 }
	];

	return filteredPoints.map((point, index) => ({
		...point,
		id: point.id + (index * 100), // Éviter les doublons d'ID
		latitude: point.latitude + (variations[index]?.lat || 0),
		longitude: point.longitude + (variations[index]?.lng || 0),
		// Ajouter des informations spécifiques à Shippo
		shippo_carrier: carrier,
		distance: Math.floor(Math.random() * 2000) + 500, // Distance simulée en mètres
		available: true
	}));
}

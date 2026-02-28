/**
 * Configuration Shippo
 * Configuration centralisée pour l'intégration Shippo
 */

// Configuration de base Shippo
export const SHIPPO_CONFIG = {
	// Configuration de l'expéditeur
	SENDER: {
		name: process.env.SHIPPO_SENDER_NAME || 'CustomYourCanWeb',
		company: process.env.SHIPPO_SENDER_COMPANY || 'CustomYourCanWeb',
		street1: process.env.SHIPPO_SENDER_STREET || '123 Rue de la Paix',
		city: process.env.SHIPPO_SENDER_CITY || 'Montauban',
		state: process.env.SHIPPO_SENDER_STATE || 'Occitanie',
		zip: process.env.SHIPPO_SENDER_POSTAL_CODE || '82000',
		country: process.env.SHIPPO_SENDER_COUNTRY || 'FR',
		phone: process.env.SHIPPO_SENDER_PHONE || '+33123456789',
		email: process.env.SHIPPO_SENDER_EMAIL || 'contact@customyourcan.com'
	},

	// Configuration du colis par défaut
	DEFAULT_PACKAGE: {
		length: parseInt(process.env.SHIPPO_DEFAULT_LENGTH || '50'),
		width: parseInt(process.env.SHIPPO_DEFAULT_WIDTH || '40'),
		height: parseInt(process.env.SHIPPO_DEFAULT_HEIGHT || '30'),
		dimension_unit: 'cm' as const,
		weight: parseFloat(process.env.SHIPPO_DEFAULT_WEIGHT || '1.0'),
		weight_unit: 'kg' as const
	},

	// Transporteurs préférés
	PREFERRED_CARRIERS: [
		'colissimo',
		'chronopost',
		'colisprive',
		'ups'
	],

	// Options de livraison
	SHIPPING_OPTIONS: {
		prefer_service_point: process.env.SHIPPO_PREFER_SERVICE_POINT === 'true',
		max_options: parseInt(process.env.SHIPPO_MAX_OPTIONS || '10')
	},

	// Points relais
	SERVICE_POINTS: {
		max_points: parseInt(process.env.SHIPPO_MAX_SERVICE_POINTS || '5'),
		radius_km: parseInt(process.env.SHIPPO_SERVICE_POINT_RADIUS || '10')
	}
};

/**
 * Valide la configuration Shippo
 */
export function validateShippoConfiguration(): boolean {
	const requiredEnvVars = [
		'SHIPPO_API_TOKEN',
		'SHIPPO_SENDER_NAME',
		'SHIPPO_SENDER_CITY',
		'SHIPPO_SENDER_POSTAL_CODE'
	];

	const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
	if (missingVars.length > 0) {
		return false;
	}
	return true;
}

/**
 * Configure Shippo pour l'environnement actuel
 */
export function configureShippoForEnvironment() {
	return {
		apiToken: process.env.SHIPPO_API_TOKEN,
		sender: SHIPPO_CONFIG.SENDER,
		defaultPackage: SHIPPO_CONFIG.DEFAULT_PACKAGE,
		preferredCarriers: SHIPPO_CONFIG.PREFERRED_CARRIERS,
		shippingOptions: SHIPPO_CONFIG.SHIPPING_OPTIONS,
		servicePoints: SHIPPO_CONFIG.SERVICE_POINTS
	};
}

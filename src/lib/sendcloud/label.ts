import dotenv from 'dotenv';
import { prisma } from '$lib/server';

dotenv.config();

/**
 * Crée une étiquette d'expédition Sendcloud pour une transaction donnée (SYNCHRONE).
 * Récupère directement l'étiquette PDF dans la réponse.
 * @param {Object} transaction - Les données de la transaction.
 */
export async function createSendcloudLabel(transaction) {
	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	if (!process.env.SENDCLOUD_INTEGRATION_ID) {
		console.error("❌ L'ID d'intégration Sendcloud est manquant !");
		return;
	}

	// Endpoint synchrone
	const endpoint = 'https://panel.sendcloud.sc/api/v3/orders/create-label-sync';

	// Prépare le corps de la requête
	const requestBody = {
		integration_id: parseInt(process.env.SENDCLOUD_INTEGRATION_ID),
		sender_address_id: process.env.SENDCLOUD_SENDER_ADDRESS_ID
			? parseInt(process.env.SENDCLOUD_SENDER_ADDRESS_ID)
			: undefined,
		brand_id: process.env.SENDCLOUD_BRAND_ID ? parseInt(process.env.SENDCLOUD_BRAND_ID) : undefined,
		ship_with: {
			type: 'shipping_option_code',
			properties: {
				shipping_option_code: transaction.shippingOption
			}
		},
		order: {
			order_id: transaction.id.toString(),
			order_number: `ORDER-${transaction.id}`,
			apply_shipping_rules: false
		},
		label_details: {
			mime_type: 'application/pdf',
			dpi: 72
		}
	};

	console.log('📤 Payload (Label Sync) => Sendcloud:', JSON.stringify(requestBody, null, 2));

	// Appel à l'API Sendcloud
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	if (!response.ok) {
		const txt = await response.text();
		console.error('❌ Erreur lors de la création de l’étiquette Sendcloud (sync):', txt);
		return;
	}

	const responseData = await response.json();
	console.log('✅ Étiquette Sendcloud (sync) créée avec succès:', responseData);

	// -- Récupération correcte : responseData.data est un tableau contenant un objet
	const [parcel] = responseData.data;
	if (!parcel) {
		console.error('❌ Pas de data dans la réponse Sendcloud');
		return;
	}

	const { parcel_id, tracking_number, tracking_url } = parcel;

	// Vérification que la transaction existe vraiment
	const existingTransaction = await prisma.transaction.findUnique({
		where: { id: transaction.id.toString() }
	});

	if (!existingTransaction) {
		console.error(`❌ La transaction avec l'ID ${transaction.id} n'existe pas.`);
		return;
	}

	// Mise à jour des infos Sendcloud dans la transaction
	await prisma.transaction.update({
		where: { id: transaction.id.toString() },
		data: {
			sendcloudParcelId: parcel_id,
			trackingNumber: tracking_number,
			trackingUrl: tracking_url
		}
	});

	console.log(`✅ Transaction ${transaction.id} mise à jour avec l’étiquette PDF :`);
}

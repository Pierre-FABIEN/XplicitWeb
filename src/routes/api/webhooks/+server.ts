import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { prisma } from '$lib/server/index';
import dotenv from 'dotenv';
import { createShippoLabel } from '$lib/shippo/order';
import { resetCart } from '$lib/store/Data/cartStore';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function deduceWeightBracket(order: any): number {
	if (!order || !order.items || !Array.isArray(order.items)) {
		return 3; // Valeur par défaut pour éviter que tout crashe
	}

	// Calcul du poids total
	const totalWeight = order.items.reduce((acc: number, item: any) => {
		const productWeight = item.product?.weight ?? 0.124; // Poids par défaut si non défini
		const customExtra = item.custom?.length > 0 ? 0.666 : 0; // Poids supplémentaire si custom
		return acc + productWeight * item.quantity + customExtra;
	}, 0);

	// Déterminer le bracket correspondant
	if (totalWeight <= 3) return 3;
	if (totalWeight <= 6) return 6;
	return 9;
}

/**
 * Détermine le carrier depuis l'option de livraison sélectionnée
 */
function getCarrierFromShippingOption(shippingOption: string): string {
	// Les shippingOption sont des IDs de rates Shippo, on doit les mapper aux carriers
	// Pour l'instant, on utilise une logique simple basée sur les noms
	if (shippingOption.includes('colissimo') || shippingOption.includes('colis')) {
		return 'colissimo';
	}
	if (shippingOption.includes('chronopost') || shippingOption.includes('chrono')) {
		return 'chronopost';
	}
	if (shippingOption.includes('dpd')) {
		return 'dpd';
	}
	// Par défaut, utiliser colissimo
	return 'colissimo';
}

/**
 * Détermine les dimensions du colis selon le poids
 */
function getPackageDimensions(weight: number): {length: number, width: number, height: number} {
	if (weight <= 3) {
		return { length: 40, width: 30, height: 20 }; // Petit colis
	}
	if (weight <= 6) {
		return { length: 50, width: 40, height: 30 }; // Colis moyen
	}
	if (weight <= 9) {
		return { length: 60, width: 50, height: 40 }; // Grand colis
	}
	// Pour les colis très lourds
	return { length: 70, width: 60, height: 50 };
}

/**
 * Génère les données de méthode d'expédition pour Shippo
 * Version simplifiée sans la complexité Sendcloud
 */
async function getShippingMethodData(shippingOption: string, weightBracket: number, order: any, carrierFromOrder?: string) {
	
	// Utiliser le carrier depuis la commande si disponible, sinon le deviner
	const carrier = carrierFromOrder || getCarrierFromShippingOption(shippingOption);
	
	// Déterminer les dimensions selon le poids
	const dimensions = getPackageDimensions(weightBracket);
	
	const dynamicMethod = {
		id: Date.now(), // ID simple
		name: `${carrier.charAt(0).toUpperCase() + carrier.slice(1)} - ${weightBracket}kg`,
		length: dimensions.length,
		width: dimensions.width,
		height: dimensions.height,
		unit: 'cm',
		weight: weightBracket,
		weightUnit: 'kg',
		volume: dimensions.length * dimensions.width * dimensions.height,
		volumeUnit: 'cm3',
		carrier: carrier,
		service: 'standard' // Service par défaut
	};
	
	return dynamicMethod;
}

/**
 * Gère la fin d'une session de paiement
 * 1) On enregistre la transaction en base (dans une transaction courte)
 * 2) On appelle Shippo hors transaction
 */
async function handleCheckoutSession(session: Stripe.Checkout.Session) {

	const orderId = session.metadata?.orderId || session.metadata?.order_id;
	if (!orderId) {
		return;
	}


	// Récupérer les détails de la commande
	const order = await prisma.order.findUnique({
				where: { id: orderId },
		include: {
			items: {
				include: {
					product: true,
					custom: true
				}
			},
			address: true
				}
			});
			
			if (!order) {
		const allOrders = await prisma.order.findMany({
			select: { id: true, status: true, createdAt: true },
			orderBy: { createdAt: 'desc' },
			take: 5
		});
		return;
	}

	// Récupérer les champs supplémentaires avec une requête brute pour MongoDB
	const orderWithShipping = await prisma.$runCommandRaw({
		find: 'orders',
		filter: { _id: { $oid: orderId } },
		projection: { shippingOption: 1, shippingCarrier: 1, shippingCost: 1 }
	}) as any;

	const shippingData = orderWithShipping.cursor?.firstBatch?.[0] || {};

	// Calculer le poids et générer les données de méthode d'expédition
			const weightBracket = deduceWeightBracket(order);

	// Utiliser le carrier depuis les métadonnées Stripe ou depuis la commande
	const carrierFromStripe = session.metadata?.shipping_carrier;
	const carrierFromOrder = shippingData.shippingCarrier;
	const finalCarrier = carrierFromStripe || carrierFromOrder || 'colissimo';
	const shippingMethodData = await getShippingMethodData(order.shippingOption || 'default', weightBracket, order, finalCarrier);

	// Préparer les données de transaction
			const transactionData = {
				stripePaymentId: session.id,
		orderId: order.id,
		userId: order.userId,
		amount: (session.amount_total || 0) / 100, // Convertir de centimes en euros
		currency: session.currency || 'eur',
				customer_details_email: session.customer_details?.email || '',
				customer_details_name: session.customer_details?.name || '',
				customer_details_phone: session.customer_details?.phone || '',
		status: session.payment_status === 'paid' ? 'paid' : 'pending',
		shippingOption: shippingData.shippingOption || '',
		shippingCarrier: shippingData.shippingCarrier || finalCarrier,
		shippingCost: shippingData.shippingCost || 0,
		shippingMethodId: shippingMethodData.id,
		shippingMethodName: shippingMethodData.name,
		package_length: shippingMethodData.length,
		package_width: shippingMethodData.width,
		package_height: shippingMethodData.height,
		package_dimension_unit: shippingMethodData.unit,
		package_weight: shippingMethodData.weight,
		package_weight_unit: shippingMethodData.weightUnit,
		package_volume: shippingMethodData.volume,
		package_volume_unit: shippingMethodData.volumeUnit,
		address_first_name: order.address?.first_name || '',
		address_last_name: order.address?.last_name || '',
		address_phone: order.address?.phone || '',
		address_company: order.address?.company || '',
		address_street_number: order.address?.street_number || '',
		address_street: order.address?.street || '',
		address_city: order.address?.city || '',
		address_county: order.address?.county || '',
		address_state: order.address?.state || '',
		address_stateLetter: order.address?.stateLetter || '',
		address_state_code: order.address?.state_code || '',
		address_zip: order.address?.zip || '',
		address_country: order.address?.country || '',
		address_country_code: order.address?.country_code || '',
		address_ISO_3166_1_alpha_3: order.address?.ISO_3166_1_alpha_3 || '',
		address_type: order.address?.type || 'SHIPPING',
		servicePointId: order.servicePointId || '',
		servicePointPostNumber: order.servicePointPostNumber || '',
		servicePointLatitude: order.servicePointLatitude || '',
		servicePointLongitude: order.servicePointLongitude || '',
		servicePointType: order.servicePointType || '',
		servicePointExtraRefCab: order.servicePointExtraRefCab || '',
		servicePointExtraShopRef: order.servicePointExtraShopRef || '',
		products: order.items.map(item => ({
					id: item.productId,
			name: item.product?.name || 'Produit inconnu',
					quantity: item.quantity,
			price: item.price,
			custom: item.custom
		}))
			};

	// Créer la transaction en base
	const createdTransaction = await prisma.transaction.create({
				data: transactionData
			});

	// Si le paiement est réussi, créer la commande et l'étiquette Shippo
	if (session.payment_status === 'paid') {
		
		try {
			// Créer directement l'étiquette Shippo avec les données de la transaction
			const shippoOrderResult = await createShippoLabel(createdTransaction);

		} catch (error) {
		}

		// Réinitialiser le panier
		try {
			resetCart();
		} catch (error) {
		}
	} else {
	}

}

export const POST = async ({ request }) => {
	const body = await request.text();
	const sig = request.headers.get('stripe-signature') || '';

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
	} catch (err) {
		return json({ error: 'Invalid signature' }, { status: 400 });
	}


	try {
		switch (event.type) {
			case 'checkout.session.completed':
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSession(session);
				break;

			case 'payment_intent.succeeded':
				break;

			case 'payment_intent.payment_failed':
				break;

			default:
		}

		return json({ received: true });
	} catch (error) {
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
};
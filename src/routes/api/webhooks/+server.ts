import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { prisma } from '$lib/server/index';
import dotenv from 'dotenv';
import { getUserIdByOrderId } from '$lib/prisma/order/prendingOrder';
import { createSendcloudOrder } from '$lib/sendcloud/order';
import { createSendcloudLabel } from '$lib/sendcloud/label';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const shippingMethodMap = {
	'colisprive:domicile/dropoff,kg,signature': {
		3: {
			id: 4727,
			name: 'Colis Privé Domicile - Signature 2-3kg',
			length: 40,
			width: 30,
			height: 20,
			unit: 'cm',
			weight: 3,
			weightUnit: 'kg',
			volume: 24000,
			volumeUnit: 'cm3'
		},
		6: {
			id: 4730,
			name: 'Colis Privé Domicile - Signature 5-6kg',
			length: 50,
			width: 40,
			height: 30,
			unit: 'cm',
			weight: 6,
			weightUnit: 'kg',
			volume: 60000,
			volumeUnit: 'cm3'
		},
		9: {
			id: 4733,
			name: 'Colis Privé Domicile - Signature 8-9kg',
			length: 60,
			width: 50,
			height: 40,
			unit: 'cm',
			weight: 9,
			weightUnit: 'kg',
			volume: 120000,
			volumeUnit: 'cm3'
		}
	},
	'colisprive:service_point/dropoff': {
		3: {
			id: 4751,
			name: 'Colis Privé Point Relais 2-3kg',
			length: 40,
			width: 30,
			height: 20,
			unit: 'cm',
			weight: 3,
			weightUnit: 'kg',
			volume: 24000,
			volumeUnit: 'cm3'
		},
		6: {
			id: 4754,
			name: 'Colis Privé Point Relais 5-6kg',
			length: 50,
			width: 40,
			height: 30,
			unit: 'cm',
			weight: 6,
			weightUnit: 'kg',
			volume: 60000,
			volumeUnit: 'cm3'
		},
		9: {
			id: 4757,
			name: 'Colis Privé Point Relais 8-9kg',
			length: 60,
			width: 50,
			height: 40,
			unit: 'cm',
			weight: 9,
			weightUnit: 'kg',
			volume: 120000,
			volumeUnit: 'cm3'
		}
	},
	'colissimo:home/signature,fr': {
		3: {
			id: 1096,
			name: 'Colissimo Home Signature 2-3kg',
			length: 40,
			width: 30,
			height: 20,
			unit: 'cm',
			weight: 3,
			weightUnit: 'kg',
			volume: 24000,
			volumeUnit: 'cm3'
		},
		6: {
			id: 1099,
			name: 'Colissimo Home Signature 5-6kg',
			length: 50,
			width: 40,
			height: 30,
			unit: 'cm',
			weight: 6,
			weightUnit: 'kg',
			volume: 60000,
			volumeUnit: 'cm3'
		},
		9: {
			id: 1102,
			name: 'Colissimo Home Signature 8-9kg',
			length: 60,
			width: 50,
			height: 40,
			unit: 'cm',
			weight: 9,
			weightUnit: 'kg',
			volume: 120000,
			volumeUnit: 'cm3'
		}
	}
};

function deduceWeightBracket(order) {
	if (!order || !order.items || !Array.isArray(order.items)) {
		console.warn("⚠️ Impossible de calculer le poids : 'order.items' est invalide.");
		return 3; // Valeur par défaut pour éviter que tout crashe
	}

	// Calcul du poids total
	const totalWeight = order.items.reduce((acc, item) => {
		const productWeight = item.product?.weight ?? 0.124; // Poids par défaut si non défini
		const customExtra = item.custom?.length > 0 ? 0.666 : 0; // Poids supplémentaire si custom
		return acc + productWeight * item.quantity + customExtra;
	}, 0);

	console.log(`⚖️ Poids total calculé : ${totalWeight.toFixed(2)} kg`);

	// Déterminer le bracket correspondant
	if (totalWeight <= 3) return 3;
	if (totalWeight <= 6) return 6;
	return 9;
}

/**
 * Récupère l'objet { id, name } à partir de la map, selon la clé shippingOption et le bracket de poids.
 */
function getShippingMethodData(shippingOption, weightBracket) {
	console.log(shippingOption, 'shippingOptionliughhliuhg');
	console.log(weightBracket, 'weightBracketliughhliuhg');

	const methodMap = shippingMethodMap[shippingOption];
	if (!methodMap) {
		console.warn(`⚠️ Aucune correspondance dans shippingMethodMap pour : "${shippingOption}"`);
		return null;
	}
	return methodMap[weightBracket] ?? null;
}

export async function POST({ request }) {
	const sig = request.headers.get('stripe-signature');
	const body = await request.text(); // Récupère le corps brut

	let event;

	try {
		event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
		console.log('✅ Webhook verified and received:', event);
	} catch (err) {
		console.error('⚠️ Webhook signature verification failed.', err.message);
		return json({ error: 'Webhook signature verification failed.' }, { status: 400 });
	}

	// Handle the event
	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;
			console.log('✅ Checkout session completed:', session);
			await handleCheckoutSession(session);
			break;
		}

		case 'payment_intent.succeeded': {
			const paymentIntent = event.data.object;
			console.log('✅ Payment intent succeeded:', paymentIntent);
			break;
		}

		case 'charge.succeeded': {
			const charge = event.data.object;
			console.log('✅ Charge succeeded:', charge);
			break;
		}

		default:
			console.warn(`⚠️ Unhandled event type: ${event.type}`);
	}
	return json({ received: true }, { status: 200 });
}

/**
 * Gère la fin d'une session de paiement
 * 1) On enregistre la transaction en base (dans une transaction courte)
 * 2) On appelle Sendcloud hors transaction
 */
async function handleCheckoutSession(session: Stripe.Checkout.Session) {
	const orderId = session.metadata.order_id;
	if (!orderId) {
		console.error('⚠️ Order ID is missing in the session metadata');
		return;
	}

	// Récupération de l’utilisateur lié à la commande
	const user = await getUserIdByOrderId(orderId);
	if (!user || !user.userId) {
		console.error('⚠️ User ID is missing for the provided order ID');
		return;
	}

	const userId = user.userId;

	let createdTransaction;

	try {
		// (1) ENREGISTREMENT EN DB via une transaction Prisma courte
		createdTransaction = await prisma.$transaction(async (prismaTx) => {
			// Récupère la commande
			const order = await prismaTx.order.findUnique({
				where: { id: orderId },
				include: {
					user: true,
					address: true,
					items: { include: { product: true, custom: true } }
				}
			});
			if (!order) throw new Error(`⚠️ Order ${orderId} not found`);
			if (!order.address) throw new Error(`⚠️ Order ${orderId} has no associated address`);

			// Calcul du bracket de poids
			const weightBracket = deduceWeightBracket(order);
			const shippingMethodData = getShippingMethodData(order.shippingOption, weightBracket);

			// Crée la transaction dans la BDD
			const newTx = await prismaTx.transaction.create({
				data: {
					// Liens Stripe
					stripePaymentId: session.id,
					amount: (session.amount_total ?? 0) / 100,
					currency: session.currency ?? 'eur',
					customer_details_email: session.customer_details?.email || '',
					customer_details_name: session.customer_details?.name || '',
					customer_details_phone: session.customer_details?.phone || '',
					status: session.payment_status || 'unknown',
					orderId: orderId,
					createdAt: session.created ? new Date(session.created * 1000) : new Date(),

					// Infos transport
					shippingOption: order.shippingOption ?? '',
					shippingCost: parseFloat(order.shippingCost?.toString() ?? '0'),

					// Méthode d'expédition
					shippingMethodId: shippingMethodData?.id ?? null,
					shippingMethodName: shippingMethodData?.name ?? null,

					// Dimensions + Poids
					package_length: shippingMethodData?.length ?? null,
					package_width: shippingMethodData?.width ?? null,
					package_height: shippingMethodData?.height ?? null,
					package_dimension_unit: shippingMethodData?.unit ?? 'cm',
					package_weight: shippingMethodData?.weight ?? null,
					package_weight_unit: shippingMethodData?.weightUnit ?? 'kg',
					package_volume: shippingMethodData?.volume ?? null,
					package_volume_unit: shippingMethodData?.volumeUnit ?? 'cm3',

					// Adresse
					address_first_name: order.address.first_name,
					address_last_name: order.address.last_name,
					address_phone: order.address.phone,
					address_company: order.address.company,
					address_street_number: order.address.street_number,
					address_street: order.address.street,
					address_city: order.address.city,
					address_county: order.address.county,
					address_state: order.address.state,
					address_stateLetter: order.address.stateLetter,
					address_state_code: order.address.state_code,
					address_zip: order.address.zip,
					address_country: order.address.country,
					address_country_code: order.address.country_code,
					address_ISO_3166_1_alpha_3: order.address.ISO_3166_1_alpha_3,
					address_type: order.address.type,

					// 📍 Point Relais
					servicePointId: order.servicePointId ?? null,
					servicePointPostNumber: order.servicePointPostNumber ?? null,
					servicePointLatitude: order.servicePointLatitude ?? null,
					servicePointLongitude: order.servicePointLongitude ?? null,
					servicePointType: order.servicePointType ?? null,
					servicePointExtraRefCab: order.servicePointExtraRefCab ?? null,
					servicePointExtraShopRef: order.servicePointExtraShopRef ?? null,

					// Produits (JSON)
					products: order.items.map((item) => ({
						id: item.productId,
						name: item.product.name,
						price: item.product.price,
						quantity: item.quantity,
						description: item.product.description,
						stock: item.product.stock,
						images: item.product.images,
						customizations: item.custom.map((c) => ({
							id: c.id,
							image: c.image,
							userMessage: c.userMessage,
							createdAt: c.createdAt,
							updatedAt: c.updatedAt
						}))
					})),

					// Relation utilisateur
					user: { connect: { id: userId } }
				}
			});

			return newTx;
		});
	} catch (error) {
		console.error(`⚠️ Failed to create transaction for order ${orderId}:`, error);
		return; // on arrête ici si l’enregistrement DB a échoué
	}

	console.log('Nouvelle transaction créée =>', createdTransaction?.id);

	// (2) APPEL A SENDCLOUD en dehors de la transaction
	try {
		if (createdTransaction.status === 'paid') {
			await createSendcloudOrder(createdTransaction);
			await createSendcloudLabel(createdTransaction);
		}
	} catch (error) {
		console.error(
			`⚠️ Erreur lors de la création du label / order Sendcloud pour la transaction ${createdTransaction.id} :`,
			error
		);
		// Pas de rollback, car la transaction est déjà commise en DB
		// => éventuellement, on peut mettre à jour le statut si on veut
	}
}

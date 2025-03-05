import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { prisma } from '$lib/server/index';
import dotenv from 'dotenv';
import { getUserIdByOrderId } from '$lib/prisma/order/prendingOrder';
import { getAllProducts } from '$lib/prisma/products/products';
import { createSendcloudOrder } from '$lib/sendcloud/order';
import { createSendcloudParcel } from '$lib/sendcloud/parcel';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Tableau de correspondance entre :
 *  - la clé d'expédition (ex : "colisprive:domicile/dropoff,kg,signature")
 *  - le bracket de poids (3, 6 ou 9)
 *  - l'id et le nom du service associé
 */
const shippingMethodMap = {
	'colisprive:domicile/dropoff,kg,signature': {
		3: { id: 4727, name: 'Colis Privé Domicile - Signature 2-3kg' },
		6: { id: 4730, name: 'Colis Privé Domicile - Signature 5-6kg' },
		9: { id: 4733, name: 'Colis Privé Domicile - Signature 8-9kg' }
	},
	'colisprive:service_point/dropoff': {
		3: { id: 4751, name: 'Colis Privé Point Relais 2-3kg' },
		6: { id: 4754, name: 'Colis Privé Point Relais 5-6kg' },
		9: { id: 4757, name: 'Colis Privé Point Relais 8-9kg' }
	},
	'colissimo:home/signature,fr': {
		3: { id: 1096, name: 'Colissimo Home Signature 2-3kg' },
		6: { id: 1099, name: 'Colissimo Home Signature 5-6kg' },
		9: { id: 1102, name: 'Colissimo Home Signature 8-9kg' }
	}
};

function deduceWeightBracket(order) {
	if (!order || !order.items || !Array.isArray(order.items)) {
		console.warn("⚠️ Impossible de calculer le poids : 'order.items' est invalide.");
		return 3; // Valeur par défaut pour éviter que tout crashe
	}

	// Calcul du poids total
	const totalWeight = order.items.reduce((acc, item) => {
		const productWeight = item.product?.weight ?? 0.125; // Poids par défaut si non défini
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

async function handleCheckoutSession(session) {
	const orderId = session.metadata.order_id;
	console.log('ℹ️ Session metadata:', session.metadata);

	if (!orderId) {
		console.error('⚠️ Order ID is missing in the session metadata');
		return;
	}

	// 🔍 Récupérer l'utilisateur lié à la commande
	const user = await getUserIdByOrderId(orderId);
	if (!user || !user.userId) {
		console.error('⚠️ User ID is missing for the provided order ID');
		return;
	}

	const userId = user.userId;

	try {
		await prisma.$transaction(async (prisma) => {
			// 🔍 Récupérer la commande et ses infos
			const order = await prisma.order.findUnique({
				where: { id: orderId },
				include: {
					user: true,
					address: true,
					items: { include: { product: true, custom: true } }
				}
			});

			if (!order) throw new Error(`⚠️ Order ${orderId} not found`);
			if (!order.address) throw new Error(`⚠️ Order ${orderId} has no associated address`);

			// Déduction du bracket de poids et des infos d’expédition
			const weightBracket = deduceWeightBracket(order);
			const shippingMethodData = getShippingMethodData(order.shippingOption, weightBracket);

			// ✅ Enregistrer la transaction
			const transaction = await prisma.transaction.create({
				data: {
					stripePaymentId: session.id,
					amount: session.amount_total / 100,
					currency: session.currency,
					customer_details_email: session.customer_details?.email || '',
					customer_details_name: session.customer_details?.name || '',
					customer_details_phone: session.customer_details?.phone || '',
					status: session.payment_status,
					orderId: orderId,
					createdAt: new Date(session.created * 1000),

					// Infos transport
					shippingOption: order.shippingOption ?? '',
					shippingCost: parseFloat(order.shippingCost?.toString() ?? '0'),

					// On peut également stocker l'id et le nom du service choisi
					shippingMethodId: shippingMethodData?.id ?? null,
					shippingMethodName: shippingMethodData?.name ?? null,

					// ➡️ Nouveau : récupération des données d'adresse
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

					// Produits
					products: order.items.map((item) => ({
						id: item.productId,
						name: item.product.name,
						price: item.product.price,
						quantity: item.quantity,
						description: item.product.description,
						stock: item.product.stock,
						images: item.product.images,
						customizations: item.custom.map((custom) => ({
							id: custom.id,
							image: custom.image,
							userMessage: custom.userMessage,
							createdAt: custom.createdAt,
							updatedAt: custom.updatedAt
						}))
					})),

					// Relation utilisateur
					user: { connect: { id: userId } }
				}
			});
			console.log(transaction, 'dixuhvxdliuhgdxliugh');

			// Si le paiement est bien "paid", on envoie la commande vers Sendcloud
			if (transaction.status === 'paid') {
				await createSendcloudOrder(transaction);
			}

			// Création du colis via Sendcloud
			const parcel = await createSendcloudParcel(transaction);
			if (parcel) {
				console.log('📦 Colis enregistré dans la base de données :', parcel.tracking_number);

				await prisma.transaction.update({
					where: { id: transaction.id },
					data: {
						sendcloudParcelId: String(parcel.id),
						trackingNumber: parcel.tracking_number,
						trackingUrl: parcel.tracking_url
					}
				});
			}
		});
	} catch (error) {
		console.error(`⚠️ Failed to process order ${orderId}:`, error);
	}
}

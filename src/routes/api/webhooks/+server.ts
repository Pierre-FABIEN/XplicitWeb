import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { prisma } from '$lib/server/index';
import dotenv from 'dotenv';
import { getUserIdByOrderId } from '$lib/prisma/order/prendingOrder';
import { getAllProducts } from '$lib/prisma/products/products';
import { VITE_SENDCLOUD_PUBLIC_KEY, VITE_SENDCLOUD_SECRET_KEY } from '$env/static/private';

dotenv.config();
const sendcloudApiUrl = 'https://panel.sendcloud.sc/api/v2/parcels';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST({ request }) {
	const sig = request.headers.get('stripe-signature');
	const body = await request.text(); // Utilisez request.text() pour obtenir le corps brut

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
		case 'checkout.session.completed':
			const session = event.data.object;
			console.log('✅ Checkout session completed:', session);
			await handleCheckoutSession(session);
			break;

		case 'payment_intent.succeeded':
			const paymentIntent = event.data.object;
			console.log('✅ Payment intent succeeded:', paymentIntent);
			break;

		case 'charge.succeeded':
			const charge = event.data.object;
			console.log('✅ Charge succeeded:', charge);
			break;

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
			console.log(`ℹ️ Processing order ID: ${orderId}`);

			// 🔍 Récupérer la commande et ses infos
			const order = await prisma.order.findUnique({
				where: { id: orderId },
				include: { user: true, address: true, items: { include: { product: true, custom: true } } }
			});
			if (!order) throw new Error(`⚠️ Order ${orderId} not found`);
			if (!order.address) throw new Error(`⚠️ Order ${orderId} has no associated address`);

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
					shippingOption: order.shippingOption,
					shippingCost: parseFloat(order.shippingCost?.toString() ?? '0'),
					app_user_name: order.user.name ?? order.user.username ?? 'Unknown',
					app_user_email: order.user.email,
					app_user_recipient: order.address.recipient,
					app_user_street: order.address.street,
					app_user_city: order.address.city,
					app_user_state: order.address.state,
					app_user_zip: order.address.zip,
					app_user_country: order.address.country,
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
					user: { connect: { id: userId } }
				}
			});
			console.log(`✅ Transaction ${session.id} recorded successfully.`);

			const sendcloudParcel = await createSendcloudParcel(order);
			if (sendcloudParcel) {
				console.log('📦 Colis créé sur Sendcloud:', sendcloudParcel);

				// Mettre à jour la transaction avec le tracking
				await prisma.transaction.update({
					where: { id: transaction.id },
					data: {
						sendcloudParcelId: String(sendcloudParcel.id),
						trackingNumber: sendcloudParcel.tracking_number,
						trackingUrl: sendcloudParcel.tracking_url
					}
				});

				// 🏷 **Demander l’étiquette d’expédition**
				await requestShippingLabel(sendcloudParcel.id);
			} else {
				console.error('❌ Erreur lors de la création du colis Sendcloud.');
			}
		});
	} catch (error) {
		console.error(`⚠️ Failed to process order ${orderId}:`, error);
	}
}

/**
 * Crée un colis dans Sendcloud sans demander immédiatement une étiquette.
 */
async function createSendcloudParcel(order) {
	try {
		const headers = {
			'Content-Type': 'application/json',
			Authorization:
				'Basic ' +
				Buffer.from(
					`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
				).toString('base64')
		};

		console.log(order, 'param order sdfgdfgssfdgf');

		// Exemple d'utilisation
		const senderAddressId = await getSenderAddress();
		console.log("ID de l'adresse d'expédition:", senderAddressId);

		const payload = {
			parcel: {
				name: order.address.recipient,
				company_name: order.user.name ?? 'Inconnu',
				address: order.address.street,
				house_number: order.address.houseNumber ?? '',
				city: order.address.city,
				postal_code: order.address.zip,
				country: order.address.country === 'France' ? 'FR' : order.address.country,
				telephone: order.user.phone ?? '',
				email: order.user.email,
				weight: order.items.reduce((acc, item) => acc + item.quantity * 0.125, 0),
				shipping_method_checkout_name: order.shippingOption,
				total_order_value: order.items.reduce(
					(sum, item) => sum + item.product.price * item.quantity,
					0
				),
				total_order_value_currency: 'EUR',
				sender_address: senderAddressId,
				quantity: 1,
				is_return: false,
				request_label: false
			}
		};

		console.log('📦 Envoi de la demande de création de colis:', JSON.stringify(payload, null, 2));

		const response = await fetch(sendcloudApiUrl, {
			method: 'POST',
			headers,
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		if (!response.ok) throw new Error(`Erreur Sendcloud: ${JSON.stringify(result)}`);

		console.log('✅ Colis créé:', result);
		return {
			id: result.parcel.id,
			tracking_number: result.parcel.tracking_number,
			tracking_url: result.parcel.tracking_url
		};
	} catch (error) {
		console.error('⚠️ Erreur lors de la création du colis:', error);
		return null;
	}
}

/**
 * Demande une étiquette d’expédition pour un colis existant dans Sendcloud.
 */
async function requestShippingLabel(parcelId) {
	try {
		const headers = {
			'Content-Type': 'application/json',
			Authorization:
				'Basic ' +
				Buffer.from(
					`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
				).toString('base64')
		};

		const payload = {
			parcel: {
				id: parcelId,
				request_label: true
			}
		};

		console.log('🏷 Demande d’étiquette d’expédition:', JSON.stringify(payload, null, 2));

		const response = await fetch(sendcloudApiUrl, {
			method: 'PUT',
			headers,
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		if (!response.ok) throw new Error(`Erreur Sendcloud: ${JSON.stringify(result)}`);

		console.log('✅ Étiquette d’expédition demandée:', result);
		return result;
	} catch (error) {
		console.error('⚠️ Erreur lors de la demande d’étiquette d’expédition:', error);
		return null;
	}
}

async function getSenderAddress() {
	const authString = `${VITE_SENDCLOUD_PUBLIC_KEY}:${VITE_SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	try {
		const response = await fetch('https://panel.sendcloud.sc/api/v2/user/addresses/sender', {
			method: 'GET',
			headers: {
				Authorization: `Basic ${base64Auth}`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`Erreur Sendcloud: ${await response.text()}`);
		}

		const data = await response.json();

		if (data.sender_addresses.length === 0) {
			throw new Error("Aucune adresse d'expédition trouvée");
		}

		return data.sender_addresses[0].id; // Prend le premier ID disponible
	} catch (error) {
		console.error('Erreur lors de la récupération du sender_address:', error);
		return null;
	}
}

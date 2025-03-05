import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { prisma } from '$lib/server/index';
import dotenv from 'dotenv';
import { getUserIdByOrderId } from '$lib/prisma/order/prendingOrder';
import { getAllProducts } from '$lib/prisma/products/products';
import { createSendcloudOrder } from '$lib/sendcloud/order';
import { createSendcloudParcel } from '$lib/sendcloud/parcel';

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
					shippingOption: order.shippingOption ?? '',
					shippingCost: parseFloat(order.shippingCost?.toString() ?? '0'),

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
					user: { connect: { id: userId } }
				}
			});

			if (transaction.status === 'paid') {
				// 5. Appel vers Sendcloud
				await createSendcloudOrder(transaction);
			}

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

			// Envoi du colis via Sendcloud
			//const sendcloudParcel = await createSendcloudParcel(transaction);
			// if (sendcloudParcel) {
			// 	console.log('📦 Colis créé sur Sendcloud:', sendcloudParcel);

			// 	// Mettre à jour la transaction avec le tracking
			// 	await prisma.transaction.update({
			// 		where: { id: transaction.id },
			// 		data: {
			// 			sendcloudParcelId: String(sendcloudParcel.id),
			// 			trackingNumber: sendcloudParcel.tracking_number,
			// 			trackingUrl: sendcloudParcel.tracking_url
			// 		}
			// 	});

			// 	// 🏷 **Demander l’étiquette d’expédition**
			// 	await requestShippingLabel(sendcloudParcel, order.shippingOption);
			// } else {
			// 	console.error('❌ Erreur lors de la création du colis Sendcloud.');
			// }
		});
	} catch (error) {
		console.error(`⚠️ Failed to process order ${orderId}:`, error);
	}
}

// async function createSendcloudParcel(transaction) {
// 	try {
// 		const headers = {
// 			'Content-Type': 'application/json',
// 			Authorization:
// 				'Basic ' +
// 				Buffer.from(
// 					`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
// 				).toString('base64')
// 		};

// 		console.log(transaction, 'param transaction Sendcloud');

// 		// Récupération de l'ID de l'adresse d'expédition
// 		const senderAddressId = await getSenderAddress();
// 		if (!senderAddressId) {
// 			throw new Error('❌ Impossible de récupérer l’adresse de l’expéditeur sur Sendcloud.');
// 		}

// 		// Calcul du poids total du colis
// 		const totalWeight = transaction.products.reduce((acc, item) => acc + item.quantity * 0.125, 0);

// 		// Construction du payload Sendcloud
// 		const payload = {
// 			parcel: {
// 				name: `${transaction.address_first_name} ${transaction.address_last_name}`.trim(),
// 				company_name: transaction.address_company ?? '',
// 				address: transaction.address_street,
// 				house_number: transaction.address_street_number ?? '',
// 				city: transaction.address_city,
// 				postal_code: transaction.address_zip,
// 				country: transaction.address_country_code.toUpperCase(),
// 				telephone: transaction.address_phone ?? '',
// 				email: transaction.customer_details_email,

// 				weight: totalWeight.toFixed(3), // Format "0.000"
// 				shipping_method_checkout_name: transaction.shippingOption ?? '',
// 				total_order_value: transaction.products.reduce(
// 					(sum, item) => sum + item.price * item.quantity,
// 					0
// 				),
// 				total_order_value_currency: 'EUR',

// 				// Adresse de l'expéditeur
// 				sender_address: senderAddressId,

// 				quantity: 1,
// 				is_return: false,
// 				request_label: false
// 			}
// 		};

// 		console.log('📦 Envoi de la demande de création de colis:', JSON.stringify(payload, null, 2));

// 		// Requête Sendcloud
// 		const response = await fetch(sendcloudApiUrl, {
// 			method: 'POST',
// 			headers,
// 			body: JSON.stringify(payload)
// 		});

// 		const result = await response.json();
// 		if (!response.ok) throw new Error(`Erreur Sendcloud: ${JSON.stringify(result)}`);

// 		console.log('✅ Colis créé:', result);
// 		return {
// 			id: result.parcel.id,
// 			tracking_number: result.parcel.tracking_number,
// 			tracking_url: result.parcel.tracking_url
// 		};
// 	} catch (error) {
// 		console.error('⚠️ Erreur lors de la création du colis:', error);
// 		return null;
// 	}
// }

// async function requestShippingLabel(sendcloudParcel, shippingOption) {
// 	console.log(sendcloudParcel, '🚀 Colis à traiter pour l’étiquette');
// 	console.log(shippingOption, '📦 Option d’expédition');

// 	try {
// 		const headers = {
// 			'Content-Type': 'application/json',
// 			Authorization:
// 				'Basic ' +
// 				Buffer.from(
// 					`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
// 				).toString('base64')
// 		};

// 		// 🔍 Récupérer l'ID de la méthode d'expédition
// 		const formattedShippingOption = shippingOption.split(',')[0]; // Nettoyage du nom
// 		const shippingMethodId = await getShippingMethodId(formattedShippingOption);
// 		if (!shippingMethodId) {
// 			throw new Error(`Aucune méthode d'expédition trouvée pour ${shippingOption}`);
// 		}
// 		console.log("✅ ID de la méthode d'expédition:", shippingMethodId);

// 		const payload = {
// 			parcel: {
// 				id: sendcloudParcel.id,
// 				shipping_method: shippingMethodId, // 🔥 Ajout de l'ID obligatoire
// 				request_label: true
// 			}
// 		};

// 		console.log('🏷 Demande d’étiquette d’expédition:', JSON.stringify(payload, null, 2));

// 		const response = await fetch(sendcloudApiUrl, {
// 			method: 'PUT',
// 			headers,
// 			body: JSON.stringify(payload)
// 		});

// 		const result = await response.json();
// 		if (!response.ok) throw new Error(`Erreur Sendcloud: ${JSON.stringify(result)}`);

// 		console.log('✅ Étiquette d’expédition demandée:', result);
// 		return result;
// 	} catch (error) {
// 		console.error('⚠️ Erreur lors de la demande d’étiquette d’expédition:', error);
// 		return null;
// 	}
// }

// async function getSenderAddress() {
// 	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
// 	const base64Auth = Buffer.from(authString).toString('base64');

// 	try {
// 		const response = await fetch('https://panel.sendcloud.sc/api/v2/user/addresses/sender', {
// 			method: 'GET',
// 			headers: {
// 				Authorization: `Basic ${base64Auth}`,
// 				'Content-Type': 'application/json',
// 				Accept: 'application/json'
// 			}
// 		});

// 		if (!response.ok) {
// 			throw new Error(`Erreur Sendcloud: ${await response.text()}`);
// 		}

// 		const data = await response.json();

// 		if (data.sender_addresses.length === 0) {
// 			throw new Error("Aucune adresse d'expédition trouvée");
// 		}

// 		return data.sender_addresses[0].id; // Prend le premier ID disponible
// 	} catch (error) {
// 		console.error('Erreur lors de la récupération du sender_address:', error);
// 		return null;
// 	}
// }

// async function getShippingMethodId(shippingMethodName) {
// 	try {
// 		const headers = {
// 			Authorization:
// 				'Basic ' +
// 				Buffer.from(
// 					`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
// 				).toString('base64'),
// 			'Content-Type': 'application/json',
// 			Accept: 'application/json'
// 		};

// 		const response = await fetch('https://panel.sendcloud.sc/api/v2/shipping_methods', {
// 			method: 'GET',
// 			headers
// 		});

// 		if (!response.ok) {
// 			throw new Error(`Erreur Sendcloud: ${await response.text()}`);
// 		}

// 		const data = await response.json();
// 		console.log(
// 			'📦 Méthodes d’expédition disponibles:',
// 			JSON.stringify(data.shipping_methods, null, 2)
// 		);

// 		// 🔍 Trouver la méthode qui correspond
// 		const method = data.shipping_methods.find((m) =>
// 			m.name.toLowerCase().includes(shippingMethodName.toLowerCase())
// 		);

// 		if (!method) {
// 			throw new Error(
// 				`❌ Aucune méthode d'expédition trouvée pour "${shippingMethodName}". Vérifie la liste des méthodes récupérées ci-dessus.`
// 			);
// 		}

// 		console.log(`✅ Méthode trouvée : ${method.name} → ID : ${method.id}`);
// 		return method.id;
// 	} catch (error) {
// 		console.error('Erreur lors de la récupération de shipping_method:', error);
// 		return null;
// 	}
// }

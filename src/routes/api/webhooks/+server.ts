import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import prisma from '$server';
import dotenv from 'dotenv';
import { getUserIdByOrderId } from '$server/user/getUserIdByOrderId';
import { createTransactionInvalidated } from '$server/transaction/createTransactionInvalidated';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: '2024-06-20'
});

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
			console.log('✅ Checkout Session:', session);
			// Fulfill the purchase
			try {
				await handleCheckoutSession(session);
			} catch (error) {
				console.error('⚠️ Error handling checkout session:', error);
			}
			break;
		case 'charge.failed':
			const charge = event.data.object;
			console.log('⚠️ Charge Failed:', charge);
			try {
				await handleChargeFailed(charge);
			} catch (error) {
				console.error('⚠️ Error handling charge failed:', error);
			}
			break;
		default:
			console.warn(`Unhandled event type ${event.type}`);
	}

	return json({ received: true }, { status: 200 });
}

async function handleCheckoutSession(session) {
	const orderId = session.metadata.order_id;

	if (!orderId) {
		console.error('⚠️ Order ID is missing in the session metadata');
		return;
	}

	const user = await getUserIdByOrderId(orderId);

	if (!user || !user.userId) {
		console.error('⚠️ User ID is missing for the provided order ID');
		return;
	}

	const userId = user.userId;

	try {
		// Start a transaction to ensure atomicity
		await prisma.$transaction(async (prisma) => {
			// Fetch order and user details
			const order = await prisma.order.findUnique({
				where: { id: orderId },
				include: {
					user: true,
					address: true,
					items: {
						include: {
							product: true
						}
					}
				}
			});

			if (!order) {
				throw new Error(`Order ${orderId} not found`);
			}

			if (!order.address) {
				throw new Error(`Order ${orderId} has no associated address`);
			}

			const transactionData = {
				stripePaymentId: session.id,
				amount: session.amount_total / 100,
				currency: session.currency,
				customer_details_email: session.customer_details ? session.customer_details.email : '',
				customer_details_name: session.customer_details ? session.customer_details.name : '',
				customer_details_phone: session.customer_details ? session.customer_details.phone : '',
				status: session.payment_status,
				orderId: orderId,
				userId: userId,
				createdAt: new Date(session.created * 1000),
				app_user_name: order.user.name,
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
					quantity: item.quantity
				}))
			};

			// Create the transaction record
			await prisma.transaction.create({ data: transactionData });
			console.log(`✅ Transaction ${session.id} recorded successfully.`);

			// Deduct the quantities from the products in stock
			for (const item of order.items) {
				const newStock = item.product.stock - item.quantity;
				if (newStock < 0) {
					throw new Error(`Not enough stock for product ID ${item.productId}`);
				}

				await prisma.product.update({
					where: { id: item.productId },
					data: { stock: newStock }
				});
			}

			// Delete order items
			await prisma.orderItem.deleteMany({
				where: { orderId: orderId }
			});
			console.log(`✅ Order items for order ${orderId} deleted successfully.`);

			// Delete the order
			await prisma.order.delete({
				where: { id: orderId }
			});
			console.log(`✅ Order ${orderId} deleted successfully.`);
		});
	} catch (error) {
		console.error(`⚠️ Failed to process order ${orderId}:`, error);
	}
}

async function handleChargeFailed(charge) {
	const paymentIntentId = charge.payment_intent;

	const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
	console.log('⚠️ Payment Intent:', paymentIntent);

	const amount = paymentIntent.amount;

	const currency = paymentIntent.currency;

	const status = charge.status;

	const stripePaymentId = paymentIntent.id;

	const userId = paymentIntent.metadata.user_id;

	const orderId = paymentIntent.metadata.order_id;

	const order = await prisma.order.findUnique({
		where: { id: orderId },
		include: {
			user: true,
			address: true,
			items: {
				include: {
					product: true
				}
			}
		}
	});

	if (!order) {
		throw new Error(`Order ${orderId} not found`);
	}

	if (!order.address) {
		throw new Error(`Order ${orderId} has no associated address`);
	}

	const dataTransaction = {
		stripePaymentId: stripePaymentId,
		amount: amount,
		currency: currency,
		customer_details_email: charge.billing_details.email,
		customer_details_name: charge.billing_details.name,
		customer_details_phone: charge.billing_details.phone,
		status: status,
		orderId: orderId,
		userId: userId,
		createdAt: Date.now(),
		app_user_name: order.user.name,
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
			quantity: item.quantity
		}))
	};

	try {
		// Log the failed payment attempt
		await createTransactionInvalidated(dataTransaction, userId, orderId);

		console.log(`⚠️ Payment failed for paymentIntent ${paymentIntent.id} has been logged.`);
	} catch (error) {
		console.error(`⚠️ Error handling payment intent failed for order ${orderId}:`, error);
	}
}

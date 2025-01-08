import { OrderSchema } from '$lib/schema/order/order';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { getUserAddresses } from '$lib/prisma/addresses/addresses';
import { getOrderById, updateOrder } from '$lib/prisma/order/prendingOrder';
import { json, redirect, type Actions } from '@sveltejs/kit';

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
	apiVersion: '2024-06-20'
});

export const load = (async ({ locals }) => {
	console.log(locals);

	const userId = locals.user.id;
	const IOrderSchema = await superValidate(zod(OrderSchema));
	const addresses = await getUserAddresses(userId);
	return {
		addresses,
		IOrderSchema
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	checkout: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(OrderSchema));

		console.log(form, 'uojhlodfiuhjdifuh');

		const orderId = form.data.orderId;
		const addressId = form.data.addressId;

		const order = await getOrderById(orderId);

		const userId = order.userId;

		console.log(order, 'order');

		if (!order) {
			return json({ error: 'Order not found' }, { status: 404 });
		}

		await updateOrder(orderId, addressId);

		console.log(orderId, 'rolsdghdlkrgjh');

		const lineItems = order.items.map((item) => ({
			price_data: {
				currency: 'eur', // Changer 'usd' en 'eur' pour utiliser les euros
				product_data: {
					name: item.product.name
				},
				unit_amount: item.price * 100 // Stripe s'attend à des montants en centimes
			},
			quantity: item.quantity
		}));

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: lineItems,
			mode: 'payment',
			success_url: `${request.headers.get('origin')}/profile`,
			cancel_url: `${request.headers.get('origin')}/profile`,
			metadata: {
				order_id: orderId
			},
			payment_intent_data: {
				metadata: {
					user_id: userId,
					order_id: orderId
				}
			}
		});

		redirect(303, session.url);
	}
};

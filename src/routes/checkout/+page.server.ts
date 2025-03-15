import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';
import Stripe from 'stripe';
import dotenv from 'dotenv';

import { json, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { getOrderById, updateOrder } from '$lib/prisma/order/prendingOrder';
import { getUserAddresses } from '$lib/prisma/addresses/addresses';
import { OrderSchema } from '$lib/schema/order/order';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const load = (async ({ locals }) => {
	// Récupérer l'utilisateur
	const userId = locals.user.id;
	// Préparer la validation Superform
	const IOrderSchema = await superValidate(zod(OrderSchema));
	// Charger les adresses
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

		console.log('Form data validated =>', form);

		// 1) Extract fields
		const {
			orderId,
			addressId,
			shippingOption,
			shippingCost,
			servicePointId,
			servicePointPostNumber,
			servicePointLatitude,
			servicePointLongitude,
			servicePointType,
			servicePointExtraRefCab,
			servicePointExtraShopRef
		} = form.data;

		// Basic checks
		if (!orderId || !addressId || !shippingOption || !shippingCost) {
			return json({ error: 'Veuillez sélectionner une option de livraison.' }, { status: 400 });
		}

		// 2) Get the order from DB
		const order = await getOrderById(orderId);
		if (!order) {
			return json({ error: 'Commande introuvable' }, { status: 404 });
		}
		const userId = order.userId;

		// 3) Update the order in DB with shipping info
		const updatedOrder = await updateOrder(
			orderId,
			addressId,
			shippingOption,
			shippingCost, // ex: "16.76"
			servicePointId,
			servicePointPostNumber,
			servicePointLatitude,
			servicePointLongitude,
			servicePointType,
			servicePointExtraRefCab,
			servicePointExtraShopRef
		);

		const lineItems = order.items.map((item) => {
			// item.price = 10 => c'est du HT
			const tvaRate = 0.055;
			const ttcPrice = item.price * (1 + tvaRate); // 10 * 1.055 = 10.55

			return {
				price_data: {
					currency: 'eur',
					product_data: { name: item.product.name },
					unit_amount: Math.round(ttcPrice * 100)
				},
				quantity: item.quantity
			};
		});

		// 5) Add a single lineItem for shipping if shippingCost > 0
		const shippingCostFloat = parseFloat(updatedOrder.shippingCost.toString());
		if (shippingCostFloat > 0) {
			lineItems.push({
				price_data: {
					currency: 'eur',
					product_data: {
						name: 'Frais de port'
					},
					unit_amount: Math.round(shippingCostFloat * 100) // shippingCost is TTC => just multiply by 100
				},
				quantity: 1
			});
		}

		// 6) Create the Stripe Checkout Session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: lineItems,
			mode: 'payment',
			success_url: `${request.headers.get('origin')}/checkout/success`,
			cancel_url: `${request.headers.get('origin')}/auth`,
			metadata: {
				order_id: orderId,
				shipping_option: shippingOption,
				shipping_cost: updatedOrder.shippingCost
			},
			payment_intent_data: {
				metadata: {
					user_id: userId,
					order_id: orderId
				}
			}
		});

		// 7) Redirect user to Stripe checkout
		throw redirect(303, session.url);
	}
};

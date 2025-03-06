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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const load = (async ({ locals }) => {
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

		console.log('formData', formData);

		const form = await superValidate(formData, zod(OrderSchema));

		console.log(form, '🔍 Validation des données');

		// Récupération des champs validés
		// Récupération des champs validés
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

		if (!orderId || !addressId || !shippingOption || !shippingCost) {
			return json(
				{ error: 'Données invalides. Veuillez sélectionner une option de livraison.' },
				{ status: 400 }
			);
		}

		const order = await getOrderById(orderId);
		if (!order) {
			return json({ error: 'Commande introuvable' }, { status: 404 });
		}

		const userId = order.userId;

		// ✅ Mise à jour de la commande avec l'option de livraison choisie
		await updateOrder(
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
		);

		// Création des éléments Stripe
		const lineItems = order.items.map((item) => ({
			price_data: {
				currency: 'eur',
				product_data: { name: item.product.name },
				unit_amount: item.price * 100
			},
			quantity: item.quantity
		}));

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: lineItems,
			mode: 'payment',
			success_url: `${request.headers.get('origin')}/auth`,
			cancel_url: `${request.headers.get('origin')}/auth`,
			metadata: {
				order_id: orderId,
				shipping_option: shippingOption,
				shipping_cost: shippingCost
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

import { stripe } from '$lib/server/stripe';
import type { RequestHandler } from '@sveltejs/kit';
import type { CartItem } from '../cart';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Récupération des données envoyées par le client
		const data = await request.json();
		console.log('Données reçues depuis le client:', data);

		const cartItems: CartItem[] = data.items;

		if (!cartItems || cartItems.length === 0) {
			console.error('Erreur : Aucun item reçu dans le panier.');
			return new Response(JSON.stringify({ error: 'Le panier est vide.' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Construction des line_items pour Stripe
		const lineItems = cartItems.map((item) => {
			if (!item.name || !item.price || !item.amount) {
				console.warn('Item mal formé:', item);
			}
			return {
				price_data: {
					currency: 'USD',
					product_data: {
						name: item.name,
						images: [] // Vous pouvez ajouter des URLs d'images ici
					},
					unit_amount: Math.round(item.price * 100) // Vérification pour éviter les erreurs de format
				},
				quantity: item.amount
			};
		});

		console.log('line_items générés pour Stripe:', lineItems);

		// Création de la session Stripe
		const session = await stripe.checkout.sessions.create({
			line_items: lineItems,
			shipping_address_collection: {
				allowed_countries: ['NO'] // Pays autorisés
			},
			mode: 'payment',
			success_url: `http://localhost:1000/stripe/success`,
			cancel_url: `http://localhost:1000/stripe/cancel`,
			phone_number_collection: {
				enabled: true // Collecte des numéros de téléphone
			}
		});

		console.log('Session Stripe créée avec succès:', session);

		return new Response(
			JSON.stringify({
				url: session.url
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	} catch (error) {
		console.error('Erreur lors de la création de la session Stripe:', error);
		return new Response(
			JSON.stringify({ error: 'Erreur serveur, veuillez réessayer plus tard.' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};

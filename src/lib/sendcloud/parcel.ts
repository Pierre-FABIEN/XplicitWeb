import dotenv from 'dotenv';
dotenv.config();

export async function createSendcloudOrder(transaction) {
	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	if (!transaction.address_first_name || !transaction.orderId) {
		console.error('❌ Erreur : Adresse de livraison ou Order ID manquant !');
		return;
	}

	console.log('🚚 Shipping Method ID :', transaction.shippingMethodId);

	const totalWeight = transaction.products.reduce((acc, product) => {
		const baseWeight = product.quantity * 0.124; // Poids de base
		const customExtra = product.customizations?.length > 0 ? 0.666 : 0; // Poids supplémentaire si customisation
		const productWeight = baseWeight + customExtra;

		console.log(`⚖️ Poids de ${product.name}: ${productWeight.toFixed(3)} kg`);
		return acc + productWeight;
	}, 0);

	if (totalWeight <= 0) {
		console.error('❌ Erreur : Le poids total du colis est invalide (0 kg) !');
		return;
	}

	// 3️⃣ Création du payload pour Sendcloud (V3)
	const requestBody = [
		{
			order_id: `ORDER-${transaction.id}`,
			order_number: transaction.id,
			order_details: {
				integration: { id: 7 }, // Remplace par ton vrai ID d'intégration
				status: { code: 'fulfilled', message: 'Fulfilled' },
				order_created_at: new Date().toISOString(),
				order_items: transaction.products.map((product) => ({
					name: product.name,
					quantity: product.quantity,
					total_price: {
						value: Number((product.price * product.quantity).toFixed(2)),
						currency: transaction.currency.toUpperCase()
					}
				}))
			},
			payment_details: {
				total_price: {
					value: Number(transaction.amount.toFixed(2)),
					currency: transaction.currency.toUpperCase()
				},
				status: { code: 'paid', message: 'Paid' }
			},
			shipping_address: {
				name: `${transaction.address_first_name} ${transaction.address_last_name}`,
				address_line_1: transaction.address_street,
				house_number: transaction.address_street_number?.toString() ?? ' ',
				postal_code: transaction.address_zip,
				city: transaction.address_city,
				country_code: transaction.address_country_code.toUpperCase(),
				email: transaction.customer_details_email || '',
				phone_number: transaction.address_phone || ''
			},
			shipping_details: {
				is_local_pickup: false,
				delivery_indicator: 'Standard',
				measurement: {
					weight: {
						value: Number(totalWeight.toFixed(3)),
						unit: 'kg'
					}
				}
			}
		}
	];

	console.log(
		'📤 Payload de la commande envoyée à Sendcloud V3:',
		JSON.stringify(requestBody, null, 2)
	);

	// 4️⃣ Envoi de la requête à Sendcloud (V3)
	const response = await fetch('https://panel.sendcloud.sc/api/v3/orders', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	// 5️⃣ Vérification de la réponse
	if (!response.ok) {
		const txt = await response.text();
		console.error('❌ Sendcloud /v3/orders/ error:', txt);
		return;
	}

	const orderData = await response.json();
	console.log('✅ Commande créée avec succès ! Order ID:', orderData[0].order_id);

	return orderData[0]; // Retourne la première commande créée
}

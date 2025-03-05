import dotenv from 'dotenv';
dotenv.config();

export async function createSendcloudOrder(transaction) {
	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	if (!process.env.SENDCLOUD_INTEGRATION_ID) {
		console.error("❌ L'ID d'intégration Sendcloud est manquant !");
		return;
	}

	// 1️⃣ Vérification des produits dans la transaction
	if (!transaction.products || transaction.products.length === 0) {
		console.error('❌ Erreur : Aucun produit trouvé dans la transaction !');
		return;
	}

	console.log('📦 Liste des produits dans la transaction :');
	transaction.products.forEach((product, index) => {
		console.log(
			`   - Produit ${index + 1}: ${product.name}, Quantité: ${product.quantity}, Personnalisations: ${product.customizations?.length ?? 0}`
		);
	});

	// 2️⃣ Calcul du poids total
	const totalWeight = transaction.products.reduce((acc, product) => {
		const baseWeight = product.quantity * 0.125; // Poids de base
		const customExtra = product.customizations?.length > 0 ? 0.666 : 0; // Poids supplémentaire si custom
		const productWeight = baseWeight + customExtra;

		console.log(`   ⚖️ Calcul du poids pour ${product.name}: ${productWeight.toFixed(3)} kg`);
		return acc + productWeight;
	}, 0);

	if (totalWeight <= 0) {
		console.error('❌ Erreur : Le poids total du colis est invalide (0 kg) !');
		return;
	}

	console.log(`✅ Poids total du colis : ${totalWeight.toFixed(2)} kg`);

	// 4️⃣ Construction du payload Sendcloud
	const requestBody = [
		{
			order_id: transaction.id.toString(),
			order_number: `ORDER-${transaction.id}`,
			order_details: {
				integration: { id: parseInt(process.env.SENDCLOUD_INTEGRATION_ID) },
				status: { code: 'fulfilled', message: 'Paid in full' },
				order_created_at: new Date().toISOString(),
				order_updated_at: new Date().toISOString(),
				order_items: transaction.products.map((product) => ({
					name: product.name,
					quantity: product.quantity,
					total_price: {
						value: product.price * product.quantity,
						currency: 'EUR'
					}
				}))
			},
			payment_details: {
				total_price: {
					value:
						parseFloat(transaction.shippingCost) +
						transaction.products.reduce((acc, itm) => acc + itm.price * itm.quantity, 0),
					currency: 'EUR'
				},
				status: { code: 'paid', message: 'Paid' }
			},
			shipping_address: {
				name: `${transaction.address_first_name} ${transaction.address_last_name}`,
				address_line_1: transaction.address_street,
				house_number: transaction.address_street_number?.toString() ?? ' ',
				postal_code: transaction.address_zip,
				city: transaction.address_city,
				country_code: transaction.address_country_code,
				phone_number: transaction.address_phone ?? ''
			},
			shipping_details: {
				measurement: {
					weight: {
						value: totalWeight.toFixed(2),
						unit: 'kg'
					}
				}
			}
		}
	];

	console.log('📤 Payload envoyé à Sendcloud:', JSON.stringify(requestBody, null, 2));

	// 5️⃣ Envoi de la requête à Sendcloud
	const response = await fetch('https://panel.sendcloud.sc/api/v3/orders/', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	// 6️⃣ Gestion des erreurs Sendcloud
	if (!response.ok) {
		const txt = await response.text();
		console.error('❌ Sendcloud /v3/orders/ error:', txt);
		return;
	}

	console.log('✅ Sendcloud order created successfully');
}

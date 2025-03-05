import dotenv from 'dotenv';
dotenv.config();

export async function createSendcloudParcel(transaction) {
	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	if (!transaction.address_first_name || !transaction.orderId) {
		console.error('❌ Erreur : Adresse de livraison ou Order ID manquant !');
		return;
	}

	console.log(transaction.shippingOption, 'hglgihygliygliug');

	// 2️⃣ Calcul du poids total du colis
	const totalWeight = transaction.products.reduce((acc, product) => {
		const baseWeight = product.quantity * (product.weight || 0.2); // Poids en kg
		console.log(`   ⚖️ Calcul du poids pour ${product.name}: ${baseWeight.toFixed(3)} kg`);
		return acc + baseWeight;
	}, 0);

	if (totalWeight <= 0) {
		console.error('❌ Erreur : Le poids total du colis est invalide (0 kg) !');
		return;
	}

	const shippingMethodId = await getShippingMethodId(
		transaction.shippingOption.split(',')[0], // Nom formaté
		transaction.address_stateLetter, // Pays de destination
		transaction.address_zip, // Code postal destination
		'31000' // Code postal de l'expéditeur (à remplacer par celui de ton entrepôt)
	);

	// 3️⃣ Création du payload pour Sendcloud
	const requestBody = {
		parcel: {
			name: `${transaction.address_first_name} ${transaction.address_last_name}`,
			company_name: transaction.address_company || '',
			address: transaction.address_street,
			house_number: transaction.address_street_number?.toString() ?? ' ',
			city: transaction.address_city,
			postal_code: transaction.address_zip,
			country: transaction.address_country_code.toUpperCase(),
			email: transaction.customer_details_email || '',
			telephone: transaction.address_phone || '',
			weight: Number(totalWeight.toFixed(3)), // ✅ Assurer que c'est un nombre
			order_number: `ORDER-${transaction.id}`,
			request_label: true, // ✅ Demande immédiate de l’étiquette
			quantity: 1, // ✅ Correction
			total_order_value_currency: transaction.currency.toUpperCase(),
			total_order_value: Number(transaction.amount.toFixed(2)), // ✅ Assurer que c'est un nombre
			shipment: {
				id: Number(shippingMethodId) // ✅ Correction pour s'assurer que c'est bien un nombre
			},
			parcel_items: transaction.products.map((product) => ({
				description: product.name,
				quantity: product.quantity,
				weight: Number((product.weight || 0.2).toFixed(3)), // ✅ Correction : éviter les `null`
				value: Number((product.price * product.quantity).toFixed(2)) // ✅ Correction du `value`
			}))
		}
	};

	console.log('📤 Payload du colis envoyé à Sendcloud:', JSON.stringify(requestBody, null, 2));

	// 4️⃣ Envoi de la requête à Sendcloud
	const response = await fetch('https://panel.sendcloud.sc/api/v2/parcels', {
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
		console.error('❌ Sendcloud /v2/parcels/ error:', txt);
		return;
	}

	const parcelData = await response.json();
	console.log('✅ Colis créé avec succès ! Tracking:', parcelData.parcel.tracking_number);
	console.log('📄 Étiquette d’expédition :', parcelData.parcel.label.normal_printer);

	return parcelData.parcel;
}

async function getShippingMethodId(
	shippingOptionName, // ex. "Colissimo, Chronopost" => on prend la 1ère partie
	destinationCountry, // ex. "FR"
	destinationPostalCode, // ex. "75001"
	originPostalCode // ex. "31000"
) {
	// 1) Construire l'authentification Basic
	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	// 2) Construire l’URL pour récupérer les méthodes d’expédition
	//    On peut filtrer par sender_address si nécessaire (ex: ?sender_address=123456)
	const senderAddressId = process.env.SENDCLOUD_SENDER_ADDRESS_ID;
	const url = `https://panel.sendcloud.sc/api/v2/shipping_methods?sender_address=${senderAddressId}`;

	// 3) Faire l’appel à l’API
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Basic ${base64Auth}`,
			Accept: 'application/json'
		}
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('❌ Erreur lors de la récupération des shipping methods:', errorText);
		return null;
	}

	// 4) Parser la réponse
	const data = await response.json();
	// Normalement, data.shipping_methods contient la liste des méthodes disponibles
	// sous forme d’un tableau d’objets.

	if (!data || !data.shipping_methods || !Array.isArray(data.shipping_methods)) {
		console.error('❌ Format de réponse inattendu pour les shipping methods:', data);
		return null;
	}

	// 5) Chercher la méthode d’expédition qui correspond à ton shippingOptionName
	//    (Ici on utilise un matching « naïf » sur le nom, fais la logique adaptée à ton cas)
	const foundMethod = data.shipping_methods.find((method) => {
		// Parfois, method.name peut contenir « Colissimo », « Chronopost », etc.
		// On compare en ignorant la casse, par exemple :
		return method.name.toLowerCase().includes(shippingOptionName.toLowerCase());
	});

	if (!foundMethod) {
		console.warn('⚠️ Aucun shipping method trouvé pour :', shippingOptionName);
		return null;
	}

	// Optionnel : vérifier la couverture (cover) du pays ou du code postal, etc.
	// Dans la réponse, tu peux avoir un champ type:
	// method.countries, method.zones, etc. => ça dépend des transporteurs
	// => Fais les vérifications si besoin

	console.log('✅ Méthode d’expédition trouvée :', foundMethod.name, '(ID:', foundMethod.id, ')');
	return foundMethod.id;
}

export { getShippingMethodId };

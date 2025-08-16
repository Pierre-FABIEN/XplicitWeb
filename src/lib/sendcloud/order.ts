import dotenv from 'dotenv';
dotenv.config();

/**
 * Crée une commande dans Sendcloud en utilisant les données de la transaction.
 * @param {Object} transaction - Les données de la transaction.
 */
export async function createSendcloudOrder(transaction: any) {
	console.log('\n📦 === CRÉATION COMMANDE SENDCLOUD ===');
	console.log('📋 Transaction reçue:', {
		id: transaction.id,
		amount: transaction.amount,
		shippingOption: transaction.shippingOption,
		shippingCost: transaction.shippingCost,
		shippingMethodName: transaction.shippingMethodName
	});

	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	console.log('🔑 Authentification Sendcloud configurée');

	// Récupérer le transporteur réel du point relais si il y en a un
	let servicePointCarrier = null;
	if (transaction.servicePointId) {
		try {
			console.log('🔍 Récupération du transporteur du point relais...');
			// Utiliser l'endpoint de recherche avec l'ID du point relais
			const spResponse = await fetch(`https://servicepoints.sendcloud.sc/api/v2/service-points/?id=${transaction.servicePointId}`, {
				method: 'GET',
				headers: {
					Authorization: `Basic ${base64Auth}`,
					Accept: 'application/json'
				}
			});

			if (spResponse.ok) {
				const spData = await spResponse.json();
				console.log('📥 Données du point relais reçues:', spData);
				
				// Chercher le point relais dans la réponse
				if (spData.service_points && spData.service_points.length > 0) {
					const servicePoint = spData.service_points[0];
					servicePointCarrier = servicePoint.carrier?.code || servicePoint.carrier;
					console.log('✅ Transporteur du point relais récupéré:', servicePointCarrier);
					console.log('📋 Détails du point relais:', {
						id: servicePoint.id,
						name: servicePoint.name,
						carrier: servicePoint.carrier
					});
				} else {
					console.warn('⚠️ Aucun point relais trouvé avec cet ID');
				}
			} else {
				console.warn('⚠️ Impossible de récupérer le transporteur du point relais, utilisation de l\'option de livraison');
			}
		} catch (error) {
			console.warn('⚠️ Erreur lors de la récupération du transporteur du point relais:', error);
		}
	}

	// Fallback : utiliser le transporteur de l'option de livraison si on n'a pas pu récupérer celui du point relais
	if (!servicePointCarrier && transaction.shippingOption) {
		servicePointCarrier = transaction.shippingOption.split(':')[0];
		console.log('🔄 Utilisation du transporteur de l\'option de livraison comme fallback:', servicePointCarrier);
	}

	// Vérification finale
	if (!servicePointCarrier) {
		console.error('❌ Impossible de déterminer le transporteur du point relais');
		return;
	}

	// ---------------------
	// 1) Construire le payload
	// ---------------------
	console.log('🔨 Construction du payload...');

	const requestBody = [
		{
			order_id: `ORDER-${transaction.id}`,
			order_number: `ORDER-${transaction.id}`, // ✅ Ajout du champ manquant
			order_details: {
				integration: {
					id: parseInt(process.env.SENDCLOUD_INTEGRATION_ID || '0')
				},
				status: { code: 'fulfilled', message: 'Paid in full' },
				order_created_at: new Date().toISOString(),
				order_updated_at: new Date().toISOString(),
				order_items: transaction.products.map((product: any) => ({
					name: product.name,
					quantity: product.quantity,
					total_price: {
						value: (product.price * product.quantity).toFixed(2),
						currency: 'EUR'
					},
					measurement: {
						weight: {
							value: 0.124, // poids unitaire par produit
							unit: 'kg'
						}
					}
				}))
			},
			payment_details: {
				total_price: {
					value: transaction.amount.toFixed(2),
					currency: 'EUR'
				},
				status: { code: 'paid', message: 'Paid' }
			},
			shipping_address: {
				name: `${transaction.address_first_name} ${transaction.address_last_name}`,
				address_line_1: transaction.address_street,
				house_number: transaction.address_street_number?.toString() ?? '',
				postal_code: transaction.address_zip,
				city: transaction.address_city,
				country_code: transaction.address_country_code,
				phone_number: transaction.address_phone ?? '',
				email: transaction.customer_details_email,
				company_name: transaction.address_company
			},
			shipping_details: {
				is_local_pickup: false,
				delivery_indicator: transaction.shippingMethodName,
				measurement: {
					dimension: {
						length: transaction.package_length,
						width: transaction.package_width,
						height: transaction.package_height,
						unit: transaction.package_dimension_unit
					},
					weight: {
						value: transaction.package_weight,
						unit: transaction.package_weight_unit
					},
					volume: {
						value: transaction.package_volume,
						unit: transaction.package_volume_unit
					}
				}
			},
			// ✅ Déplacement de service_point_details au bon endroit
			...(transaction.servicePointId
				? {
						service_point_details: {
							id: transaction.servicePointId.toString(),
							post_number: transaction.servicePointPostNumber || '',
							latitude: transaction.servicePointLatitude || '',
							longitude: transaction.servicePointLongitude || '',
							type: transaction.servicePointType || '',
							// Le champ carrier n'est pas accepté par l'API Sendcloud
							extra_data: {
								ref_cab: transaction.servicePointExtraRefCab || '',
								shop_ref: transaction.servicePointExtraShopRef || ''
							}
						}
					}
				: {})
		}
	];

	console.log('📤 Payload construit:', {
		order_id: requestBody[0].order_id,
		amount: requestBody[0].payment_details.total_price.value,
		currency: requestBody[0].payment_details.total_price.currency,
		shipping_address: {
			name: requestBody[0].shipping_address.name,
			address_line_1: requestBody[0].shipping_address.address_line_1,
			country_code: requestBody[0].shipping_address.country_code
		},
		measurements: {
			dimensions: `${requestBody[0].shipping_details.measurement.dimension.length}x${requestBody[0].shipping_details.measurement.dimension.width}x${requestBody[0].shipping_details.measurement.dimension.height}${requestBody[0].shipping_details.measurement.dimension.unit}`,
			weight: `${requestBody[0].shipping_details.measurement.weight.value}${requestBody[0].shipping_details.measurement.weight.unit}`,
			volume: `${requestBody[0].shipping_details.measurement.volume.value}${requestBody[0].shipping_details.measurement.volume.unit}`
		},
		has_service_point: !!transaction.servicePointId,
		service_point_carrier: transaction.servicePointId ? servicePointCarrier : 'N/A',
		integration_id: requestBody[0].order_details.integration.id
	});

	// ---------------------
	// 2) Exécuter la requête
	// ---------------------
	console.log('🚀 Envoi de la requête à Sendcloud...');
	
	const response = await fetch('https://panel.sendcloud.sc/api/v3/orders/', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
			// Optionnel : Pour Tech Partners
			// 'Sendcloud-Partner-Id': '<YOUR_PARTNER_UUID>'
		},
		body: JSON.stringify(requestBody)
	});

	console.log('📥 Réponse reçue:', {
		status: response.status,
		statusText: response.statusText,
		ok: response.ok
	});

	if (!response.ok) {
		const txt = await response.text();
		console.error('❌ Erreur lors de la création de la commande Sendcloud:', txt);
		console.error('📋 Status:', response.status, response.statusText);
		console.error('📤 Payload envoyé:', JSON.stringify(requestBody, null, 2));
		return;
	}

	const responseData = await response.json();
	console.log('✅ Commande Sendcloud créée avec succès:', {
		status: responseData.status || 'unknown',
		data_count: responseData.data?.length || 0
	});
	
	console.log('🏁 === FIN CRÉATION COMMANDE SENDCLOUD ===\n');
}

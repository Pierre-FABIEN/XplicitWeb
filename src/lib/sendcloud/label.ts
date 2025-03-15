import dotenv from 'dotenv';
import { prisma } from '$lib/server';

dotenv.config();
/**
 * Creates a shipping label in Sendcloud (SYNC) for a given transaction/order.
 * This endpoint returns the PDF label inline.
 *
 * @param {any} transaction - The transaction object from your database
 * @returns {Promise<void>}
 */
export async function createSendcloudLabel(transaction) {
	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	if (!process.env.SENDCLOUD_INTEGRATION_ID) {
		console.error('❌ Missing SENDCLOUD_INTEGRATION_ID in environment');
		return;
	}

	// Synchronous label creation endpoint
	const endpoint = 'https://panel.sendcloud.sc/api/v3/orders/create-label-sync';

	// We check if shippingOption is home or service point
	// If you have to send 'to_service_point', do it here, but only if it's a pickup shipping
	const isPickup =
		transaction.shippingOption?.includes('pickup') ||
		transaction.shippingOption?.includes('service_point');

	// Build request body
	const requestBody = {
		integration_id: parseInt(process.env.SENDCLOUD_INTEGRATION_ID, 10),
		sender_address_id: process.env.SENDCLOUD_SENDER_ADDRESS_ID
			? parseInt(process.env.SENDCLOUD_SENDER_ADDRESS_ID, 10)
			: undefined,
		brand_id: process.env.SENDCLOUD_BRAND_ID
			? parseInt(process.env.SENDCLOUD_BRAND_ID, 10)
			: undefined,
		ship_with: {
			type: 'shipping_option_code',
			properties: {
				// shipping_option_code must match exactly your shippingOption
				// e.g. "colissimo:home/signature,fr" or "colissimo:pick-up,fr"
				shipping_option_code: transaction.shippingOption
			}
		},
		order: {
			order_id: transaction.id.toString(),
			order_number: `ORDER-${transaction.id}`,
			apply_shipping_rules: false,

			// If it is indeed a pickup method, you must pass "to_service_point" here
			...(isPickup && transaction.servicePointId
				? {
						to_service_point: {
							// The ID of the pickup point
							id: parseInt(transaction.servicePointId.toString(), 10),
							// The carrier name must match (e.g. "colissimo")
							carrier: transaction.servicePointCarrier || 'colissimo'
						}
					}
				: {})
		},
		label_details: {
			mime_type: 'application/pdf',
			dpi: 72
		}
	};

	console.log('📤 Payload (Label Sync) => Sendcloud:', JSON.stringify(requestBody, null, 2));

	// Call the API
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify(requestBody)
	});

	if (!response.ok) {
		const txt = await response.text();
		console.error('❌ Error creating the Sendcloud label (sync):', txt);
		return;
	}

	const responseData = await response.json();
	console.log('✅ Label created successfully:', responseData);

	// You should have responseData.data as an array
	const [parcel] = responseData.data || [];
	if (!parcel) {
		console.error('❌ No data in the Sendcloud label response');
		return;
	}

	const { parcel_id, tracking_number, tracking_url } = parcel;

	// Check if the transaction truly exists in DB
	const existingTransaction = await prisma.transaction.findUnique({
		where: { id: transaction.id.toString() }
	});

	if (!existingTransaction) {
		console.error(`❌ Transaction with ID ${transaction.id} does not exist`);
		return;
	}

	// Update the transaction with the new Sendcloud data
	await prisma.transaction.update({
		where: { id: transaction.id.toString() },
		data: {
			sendcloudParcelId: parcel_id,
			trackingNumber: tracking_number,
			trackingUrl: tracking_url
		}
	});

	console.log(`✅ Transaction ${transaction.id} updated with PDF label info`);
}

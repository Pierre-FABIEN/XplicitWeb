// C:\Web\XplicitWeb\src\routes\api\shipping\sendcloud\+server.ts

import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { VITE_SENDCLOUD_PUBLIC_KEY, VITE_SENDCLOUD_SECRET_KEY } from '$env/static/private';

/**
 * We include an additional `quantity` field so that
 * we can adapt the package dimensions based on 24, 48, or 72 cans.
 */
const shippingRequestSchema = z.object({
	to_country_code: z.string(), // ex: "FR"
	to_postal_code: z.string(), // ex: "31500"
	weight: z.object({
		value: z.string(), // ex: "9"
		unit: z.enum(['kg', 'g', 'lbs', 'oz'])
	}),
	/**
	 * New field: quantity
	 * We assume the client passes it so we can determine
	 * the right box dimensions on the server side.
	 */
	quantity: z.number().int().optional()
});

export async function POST({ request }) {
	// 1. Parse the JSON payload
	let payload: unknown;
	try {
		payload = await request.json();
	} catch (err) {
		throw error(400, 'Invalid JSON payload');
	}

	// 2. Zod validation
	const parseResult = shippingRequestSchema.safeParse(payload);
	if (!parseResult.success) {
		throw error(400, {
			message: 'Request body validation failed',
			issues: parseResult.error.issues
		});
	}

	// Extract validated fields
	const { to_country_code, to_postal_code, weight, quantity } = parseResult.data;

	// 3. Construct Basic Auth
	const authString = `${VITE_SENDCLOUD_PUBLIC_KEY}:${VITE_SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	/**
	 * 4. Determine the dimensions based on the quantity
	 *    (24, 48, or 72). You can tweak these dimensions
	 *    according to your actual packaging requirements.
	 */
	let dimensions = {};

	// We switch on the quantity if it exists
	if (quantity !== undefined) {
		switch (quantity) {
			case 24:
				dimensions = {
					length: '30',
					width: '20',
					height: '15',
					unit: 'cm'
				};
				break;
			case 48:
				dimensions = {
					length: '40',
					width: '30',
					height: '20',
					unit: 'cm'
				};
				break;
			case 72:
				dimensions = {
					length: '50',
					width: '30',
					height: '30',
					unit: 'cm'
				};
				break;
			default:
				// If needed, set a fallback or do nothing.
				// The default is already above.
				break;
		}
	}

	try {
		/**
		 * 5. Build the final body for Sendcloud
		 *    We do not transmit any dimension from the client.
		 *    We overwrite them on the server side based on quantity.
		 */
		const requestBody = {
			// Sender (always the same)
			from_country_code: 'FR',
			from_postal_code: '75001',

			// Dimensions adapted from the "quantity" logic
			dimensions,

			// Fields validated from the client
			to_country_code,
			to_postal_code,
			weight,

			// Hardcoded functionalities
			functionalities: { signature: true },

			// Use Sendcloud Broker
			direct_contract_only: false,

			// Indicate domestic shipping (France → France)
			service_area: 'domestic'
		};

		console.log('dimensions', requestBody);

		// 6. Call the Sendcloud API
		const response = await fetch('https://panel.sendcloud.sc/api/v3/fetch-shipping-options', {
			method: 'POST',
			headers: {
				Authorization: `Basic ${base64Auth}`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		// 7. Check status
		if (!response.ok) {
			const rawText = await response.text();
			console.error('Sendcloud raw response:', rawText);
			throw error(response.status, 'Failed to fetch shipping options from Sendcloud');
		}

		// 8. Parse and return the data to the client
		const data = await response.json();
		console.log('Sendcloud shipping data:', data);

		return json(data);
	} catch (err) {
		console.error('Sendcloud fetch error:', err);
		throw error(500, 'Internal Server Error when calling Sendcloud API');
	}
}

import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

const requestSchema = z.object({
	to_country_code: z.string(), // ex: "FR"
	to_postal_code: z.string(), // ex: "31500"
	radius: z.number().default(20000), // Rayon en mètres
	carriers: z.string().optional() // ex: "colisprive"
});

export async function POST({ request }) {
	try {
		// 1️⃣ Lire et valider le JSON reçu
		const payload = await request.json();
		const parseResult = requestSchema.safeParse(payload);
		if (!parseResult.success) {
			throw error(400, { message: 'Invalid request body', issues: parseResult.error.issues });
		}

		const { to_country_code, to_postal_code, radius, carriers } = parseResult.data;

		// 2️⃣ Authentification Sendcloud (Basic Auth)
		const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
		const base64Auth = Buffer.from(authString).toString('base64');

		// 3️⃣ Construire l’URL de requête à Sendcloud
		const spUrl = new URL('https://servicepoints.sendcloud.sc/api/v2/service-points');
		spUrl.searchParams.set('country', to_country_code);
		spUrl.searchParams.set('address', to_postal_code);
		spUrl.searchParams.set('radius', String(radius));

		if (carriers) {
			spUrl.searchParams.set('carriers', carriers);
		}

		// console.log('📌 Requête envoyée à Sendcloud:', spUrl.toString());

		// 4️⃣ Envoyer la requête à Sendcloud
		const response = await fetch(spUrl.toString(), {
			method: 'GET',
			headers: {
				Authorization: `Basic ${base64Auth}`,
				Accept: 'application/json'
			}
		});

		// 5️⃣ Gérer les erreurs éventuelles
		if (!response.ok) {
			const raw = await response.text();
			console.error('❌ Sendcloud Error Response:', raw);
			throw error(response.status, `Failed to fetch service points: ${response.statusText}`);
		}

		// 6️⃣ Convertir la réponse et la renvoyer au client
		const servicePointsData = await response.json();
		return json(servicePointsData);
	} catch (err) {
		console.error('🚨 Erreur lors de l’appel à Sendcloud:', err);
		throw error(500, 'Internal Server Error');
	}
}

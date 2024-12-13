import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { SECRET_OPENCAGEDATA_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	if (!query) {
		return json({ error: 'Query parameter is missing' }, { status: 400 });
	}

	const response = await fetch(
		`https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${SECRET_OPENCAGEDATA_KEY}&countrycode=fr`
	);
	const data = await response.json();

	return json(data);
};

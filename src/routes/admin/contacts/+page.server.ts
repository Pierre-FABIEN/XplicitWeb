import { getAllContactSubmissions } from '$lib/prisma/contact/contact';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const contactSubmissions = await getAllContactSubmissions();

	return {
		contactSubmissions
	};
}) satisfies PageServerLoad; 
import { getContactSubmissionById } from '$lib/prisma/contact/contact';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { id } = params;
	
	const contactSubmission = await getContactSubmissionById(id);
	
	if (!contactSubmission) {
		throw error(404, 'Message de contact non trouvé');
	}

	return {
		contactSubmission
	};
}) satisfies PageServerLoad; 
import { fail, message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { contactSchema } from '$lib/schema/contact/contactSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { createContactSubmission } from '$lib/prisma/contact/contact';
import { contactFormLimiter, getClientIP } from '$lib/server/rate-limiter';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(contactSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		// Appliquer le limiteur de débit
		const ip = getClientIP(event);
		const success = contactFormLimiter.consume(ip, 1);
		if (!success) {
			return fail(429, { message: 'Trop de requêtes. Veuillez réessayer plus tard.' });
		}

		const form = await superValidate(event, zod(contactSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			await createContactSubmission(form.data);
			return message(form, 'Votre message a bien été envoyé !');
		} catch (error) {
			console.error('Error saving contact message:', error);
			return fail(500, { form, message: 'La sauvegarde de votre message a échoué.' });
		}
	}
};

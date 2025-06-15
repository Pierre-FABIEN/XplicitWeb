import { fail, message, superValidate } from 'sveltekit-superforms';
import type { Actions, PageServerLoad } from './$types';
import { contactSchema } from '$lib/schema/contact/contactSchema';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(contactSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(contactSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		// TODO: Implement email sending logic here

		return message(form, 'Votre message a bien été envoyé !');
	}
};

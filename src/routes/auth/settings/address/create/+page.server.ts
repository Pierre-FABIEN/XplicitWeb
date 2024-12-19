import type { Actions, PageServerLoad } from './$types';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { createAddressSchema } from '$lib/schema/addresses/addressSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { createAddress } from '$lib/prisma/addresses/addresses';

export const load: PageServerLoad = async (event) => {
	// Initialize superform for the createAddressSchema
	const IcreateAddressSchema = await superValidate(zod(createAddressSchema));

	const userId = event.locals.user.id;

	return {
		IcreateAddressSchema,
		userId
	};
};

export const actions: Actions = {
	createAddress: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(createAddressSchema));

		if (!form.valid) {
			return fail(400, { message: 'Validation failed', form });
		}

		const { recipient, street, city, state, zip, country, userId } = form.data;

		try {
			await createAddress({
				recipient,
				street,
				city,
				state,
				zip,
				country,
				userId
			});

			return message(form, 'Address created successfully');
		} catch (error) {
			console.error('Error creating address:', error);
			return fail(500, { message: 'Address creation failed' });
		}
	}
};

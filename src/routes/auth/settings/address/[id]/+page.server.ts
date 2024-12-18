import { updateAddressSchema } from '$lib/schema/auth/addressSchema';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { getAddressById, updateAddress } from '$lib/prisma/addresses/addresses';

export const load = (async (event) => {
	const address = await getAddressById(event.params.id);

	if (!address) {
		return fail(404, { message: 'Address not found' });
	}

	const initialData = {
		id: address.id,
		recipient: address.recipient, // Assumed 'name' should be 'recipient'
		street: address.street,
		city: address.city,
		state: address.state,
		zip: address.zip,
		country: address.country
	};

	const IupdateAddressSchema = await superValidate(initialData, zod(updateAddressSchema));

	return {
		IupdateAddressSchema
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	updateAddress: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(updateAddressSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const id = formData.get('id') as string;
		const recipient = formData.get('recipient') as string;
		const street = formData.get('street') as string;
		const city = formData.get('city') as string;
		const state = formData.get('state') as string;
		const zip = formData.get('zip') as string;
		const country = formData.get('country') as string;

		await updateAddress(id, { recipient, street, city, state, zip, country });

		return message(form, 'Address updated successfully');
	}
};

import { updateAddressSchema } from '$lib/schema/auth/addressSchema';
import { prisma } from '$lib/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { fail, message, superValidate } from 'sveltekit-superforms';

export const load = (async (event) => {
	const address = await prisma.address.findUnique({
		where: { id: event.params.id }
	});

	if (!address) {
		console.log('Address not found');
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
		console.log('Received form data:', formData);

		const form = await superValidate(formData, zod(updateAddressSchema));
		console.log('Form validation result:', form);

		if (!form.valid) {
			console.log('Validation errors:', form.errors);
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
		console.log('Address updated successfully');

		return message(form, 'Address updated successfully');
	}
};

interface UpdateAddressData {
	recipient: string;
	street: string;
	city: string;
	state: string;
	zip: string;
	country: string;
}

const updateAddress = async (id: string, data: UpdateAddressData) => {
	try {
		const updatedAddress = await prisma.address.update({
			where: { id },
			data
		});
		return updatedAddress;
	} catch (error) {
		console.error('Error updating address:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
};
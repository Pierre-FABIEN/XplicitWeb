// src/routes/dashboard/addresses/[id]/+page.server.ts
import type { PageServerLoad } from '../[id]/$types';
import { type Actions } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { updateAddressSchema } from '$lib/schema/auth/addressSchema';
import { prisma } from '$lib/server';

export const load: PageServerLoad = async ({ params }) => {
	console.log('Loading address data for ID:', params.id);

	try {
		const address = await getAddressById(params.id);

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
		console.log('Loaded address data:', IupdateAddressSchema);

		return {
			IupdateAddressSchema
		};
	} catch (error) {
		console.error('Error loading address:', error);
		return fail(500, { message: 'Error loading address' });
	}
};

export const actions: Actions = {
	updateAddress: async ({ request }) => {
		console.log('updateAddress action initiated.');

		try {
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

			message(form, 'Address updated successfully');
			return {
				form,
				redirect: '/profile'
			};
		} catch (error) {
			console.error('Error updating address:', error);
			return fail(500, { message: 'Address update failed' });
		}
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

const getAddressById = async (id: string) => {
	try {
		const address = await prisma.address.findUnique({
			where: { id }
		});
		console.log('Address retrieved:', address);
		return address;
	} catch (error) {
		console.error('Error fetching address:', error);
		throw new Error('Could not fetch address');
	} finally {
		await prisma.$disconnect();
	}
};

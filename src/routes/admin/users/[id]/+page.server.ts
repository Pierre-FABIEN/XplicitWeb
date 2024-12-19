import type { PageServerLoad } from './$types';
import { type Actions } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { updateUserAndAddressSchema } from '$lib/schema/addresses/updateUserAndAddressSchema';
import { getUsersById, updateUserRole } from '$lib/prisma/user/user';
import { getUserAddresses, updateAddress } from '$lib/prisma/addresses/addresses';

export const load: PageServerLoad = async ({ params }) => {
	console.log('Loading user data for ID:', params.id);

	const user = await getUsersById(params.id);
	const addresses = await getUserAddresses(params.id);

	if (!user) {
		console.log('User not found');
		return fail(404, { message: 'User not found' });
	}

	const initialData = {
		id: user.id,
		role: user.role,
		addresses: addresses.map((address) => ({
			id: address.id,
			recipient: address.recipient,
			street: address.street,
			city: address.city,
			state: address.state,
			zip: address.zip,
			country: address.country
		}))
	};

	const IupdateUserAndAddressSchema = await superValidate(
		initialData,
		zod(updateUserAndAddressSchema)
	);

	return {
		initialData,
		IupdateUserAndAddressSchema
	};
};

export const actions: Actions = {
	updateUserAndAddresses: async ({ request }) => {
		console.log('updateUserAndAddresses action initiated.');

		const formData = await request.formData();
		console.log('Received form data:', formData);

		// Extract JSON data from formData
		const jsonData = formData.get('__superform_json');
		if (!jsonData) {
			return fail(400, { message: 'Invalid form data' });
		}

		// Parse the JSON data
		let parsedData;

		try {
			parsedData = JSON.parse(jsonData.toString());
		} catch (error) {
			console.error('Error parsing JSON data:', error);
			return fail(400, { message: 'Invalid JSON data' });
		}

		console.log('Parsed form data:', parsedData);

		// Extract user and addresses information
		const userId = parsedData[1];
		const userType = parsedData[2];
		const addressesIndexes = parsedData[3]; // This contains the indexes of addresses in the parsedData

		const addresses = addressesIndexes.map((index: number) => {
			const address = parsedData[index];
			console.log('Address:', address);

			return {
				id: parsedData[address.id],
				recipient: parsedData[address.recipient],
				street: parsedData[address.street],
				city: parsedData[address.city],
				state: parsedData[address.state],
				zip: parsedData[address.zip],
				country: parsedData[address.country]
			};
		});

		// Structuring the final data
		const finalData = {
			id: userId,
			role: userType,
			addresses
		};

		console.log('Structured data:', finalData);

		const form = await superValidate(finalData, zod(updateUserAndAddressSchema));

		if (!form.valid) {
			console.log('Validation errors:', form.errors);
			return fail(400, { form });
		}

		try {
			const { id, role, addresses } = form.data;
			console.log('Updating user and addresses with ID:', id, 'and role:', role);
			const user = await getUsersById(id);

			console.log('User:', user);

			// Update user data
			const userUpdateResult = await updateUserRole(id, role);

			// Update each address
			const addressUpdateResults = await Promise.all(
				addresses.map((address) =>
					updateAddress(address.id, {
						recipient: address.recipient,
						street: address.street,
						city: address.city,
						state: address.state,
						zip: address.zip,
						country: address.country
					})
				)
			);

			console.log('User update result:', userUpdateResult);
			console.log('Address update results:', addressUpdateResults);

			return message(form, 'User and addresses updated successfully');
		} catch (error) {
			console.error('Error updating user and addresses:', error);
			return fail(500, { message: 'User and addresses update failed' });
		}
	}
};

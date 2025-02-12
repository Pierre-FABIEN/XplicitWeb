import type { PageServerLoad } from './$types';
import { type Actions } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { updateUserAndAddressSchema } from '$lib/schema/addresses/updateUserAndAddressSchema';
import { getUsersById, updateUserMFA, updateUserRole } from '$lib/prisma/user/user';
import { getUserAddresses, updateAddress } from '$lib/prisma/addresses/addresses';
import { updateUserSecurity } from '$lib/prisma/user/updateUserSecurity';
import { serializeData } from '$lib/utils/serializeData';

export const load: PageServerLoad = async ({ params }) => {
	console.log('Loading user data for ID:', params.id);

	const userFetched = await getUsersById(params.id);
	const addresses = await getUserAddresses(params.id);

	console.log(userFetched, 'userFetched');
	console.log(addresses, 'addresses');

	if (!userFetched) {
		console.log('User not found');
		return fail(404, { message: 'User not found' });
	}

	const userSelected = serializeData(userFetched);

	const initialData = {
		id: userSelected?.id || '',
		role: userSelected?.role || 'USER',
		isMfaEnabled: userSelected.isMfaEnabled || false,
		passwordHash: '',
		addresses: addresses.map((address) => ({
			id: address?.id || '',
			recipient: address?.recipient || '',
			street: address?.street || '',
			city: address?.city || '',
			state: address?.state || '',
			zip: address?.zip || '',
			country: address?.country || ''
		}))
	};

	const IupdateUserAndAddressSchema = await superValidate(
		initialData,
		zod(updateUserAndAddressSchema)
	);

	return {
		initialData,
		IupdateUserAndAddressSchema,
		userSelected
	};
};

export const actions: Actions = {
	updateUserAndAddresses: async ({ request }) => {
		console.log('updateUserAndAddresses action initiated.');

		const formData = await request.formData();
		console.log('Received form data:', formData);

		// Extraction des données JSON
		const jsonData = formData.get('__superform_json');
		if (!jsonData) {
			return fail(400, { message: 'Invalid form data' });
		}

		let parsedData;
		try {
			parsedData = JSON.parse(jsonData.toString());
		} catch (error) {
			console.error('Error parsing JSON data:', error);
			return fail(400, { message: 'Invalid JSON data' });
		}

		// Extraction des données utilisateur
		const userId = parsedData[1];
		const userRole = parsedData[2];
		const isMfaEnabled = parsedData[3];
		const passwordHash = parsedData[4] ? parsedData[4].trim() : null;
		const addressesIndexes = parsedData[5];

		// Vérifier si addressesIndexes est bien un tableau avant de faire `.map()`
		const addresses = Array.isArray(addressesIndexes)
			? addressesIndexes.map((index: number) => ({
					id: parsedData[index + 1], // Décalage pour récupérer l'adresse
					recipient: parsedData[index + 2],
					street: parsedData[index + 3],
					city: parsedData[index + 4],
					state: parsedData[index + 5],
					zip: parsedData[index + 6],
					country: parsedData[index + 7]
				}))
			: [];

		// Structuration des données finales
		const finalData = {
			id: userId,
			role: userRole,
			isMfaEnabled,
			passwordHash,
			addresses
		};

		console.log('Structured data:', finalData);

		// Validation des données avec Zod
		const form = await superValidate(finalData, zod(updateUserAndAddressSchema));
		if (!form.valid) {
			console.log('Validation errors:', form.errors);
			return fail(400, { form });
		}

		try {
			const { id, role, isMfaEnabled, passwordHash, addresses } = form.data;
			console.log('Updating user and addresses with ID:', id, 'and role:', role);

			// Vérifier si l'utilisateur existe
			const user = await getUsersById(id);
			if (!user) {
				return fail(404, { message: 'User not found' });
			}

			// Mise à jour du rôle utilisateur
			await updateUserRole(id, role);

			if (passwordHash !== null) {
				await updateUserSecurity(id, { isMfaEnabled, passwordHash });
			}

			await updateUserMFA(id, {
				isMfaEnabled: isMfaEnabled
			});

			// Mise à jour de la sécurité (MFA & mot de passe chiffré)

			// Mise à jour des adresses
			await Promise.all(
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

			console.log('User and addresses updated successfully');
			return message(form, 'User and addresses updated successfully');
		} catch (error) {
			console.error('Error updating user and addresses:', error);
			return fail(500, { message: 'User and addresses update failed' });
		}
	}
};

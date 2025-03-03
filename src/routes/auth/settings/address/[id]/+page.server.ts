import { updateAddressSchema } from '$lib/schema/addresses/addressSchema';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { getAddressById, updateAddress } from '$lib/prisma/addresses/addresses';

export const load: PageServerLoad = async (event) => {
	// 🔒 Vérification de l'authentification
	if (!event.locals.user) {
		return fail(401, { message: 'Unauthorized' });
	}

	const address = await getAddressById(event.params.id);

	if (!address) {
		return fail(404, { message: 'Address not found' });
	}

	// 📌 Pré-remplissage des données du formulaire
	const initialData = {
		id: address.id,
		first_name: address.first_name,
		last_name: address.last_name,
		phone: address.phone,
		company: address.company ?? '',
		street_number: address.street_number ?? '',
		street: address.street,
		city: address.city,
		county: address.county ?? '',
		state: address.state ?? '',
		stateLetter: address.stateLetter,
		state_code: address.state_code ?? '',
		zip: address.zip,
		country: address.country,
		country_code: address.country_code,
		ISO_3166_1_alpha_3: address.ISO_3166_1_alpha_3,
		type: address.type
	};

	// 📜 Validation initiale avec Superform + Zod
	const IupdateAddressSchema = await superValidate(initialData, zod(updateAddressSchema));

	return {
		IupdateAddressSchema
	};
};

export const actions: Actions = {
	updateAddress: async ({ request, locals }) => {
		// 🔒 Vérification de l'authentification
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const form = await superValidate(formData, zod(updateAddressSchema));

		if (!form.valid) {
			return fail(400, { message: 'Validation failed', form });
		}

		const userId = locals.user.id;

		const id = form.data.id;
		const {
			first_name,
			last_name,
			phone,
			company,
			street_number,
			street,
			city,
			county,
			state,
			stateLetter,
			state_code,
			zip,
			country,
			country_code,
			ISO_3166_1_alpha_3,
			type
		} = form.data;

		try {
			await updateAddress(id, {
				userId, // Ajout de userId (récupéré depuis `locals.user.id`)
				first_name,
				last_name,
				phone,
				company,
				street_number,
				street,
				city,
				county,
				state,
				stateLetter,
				state_code,
				zip,
				country,
				country_code,
				ISO_3166_1_alpha_3,
				type,
				updatedAt: new Date() // Mise à jour automatique
			});

			return message(form, 'Address updated successfully');
		} catch (error: any) {
			console.error('❌ Error updating address:', error);

			if (error.code === 'P2025') {
				// Prisma Error P2025 -> Enregistrement non trouvé
				return fail(404, { message: 'Address not found', form });
			}

			return fail(500, { message: 'Address update failed', form });
		}
	}
};

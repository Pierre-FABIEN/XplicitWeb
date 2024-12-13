import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { updateAgenceSchema } from '$lib/schema/crud/agenciesSchema';
import { prisma } from '$lib/server';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ params }) => {
	const agence = await prisma.agence.findUnique({
		where: { id: params.id }
	});

	const directors = await prisma.director.findMany();

	if (!agence) {
		redirect(302, '/agencies/not-found');
	}

	const updateAgence = await superValidate(agence, zod(updateAgenceSchema));

	return {
		agence,
		directors,
		updateAgence
	};
};

export const actions = {
	update: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(updateAgenceSchema));

		if (!form.valid) {
			return message(form, 'Invalid data');
		}

		const agenceId = form.data.id;

		if (!agenceId) {
			return message(form, 'Agence ID is required');
		}

		try {
			await prisma.agence.update({
				where: { id: agenceId },
				data: {
					street: form.data.street,
					city: form.data.city,
					state: form.data.state,
					zip: form.data.zip,
					country: form.data.country,
					directorId: form.data.directorId
				}
			});

			return message(form, 'Agence updated successfully');
		} catch (error) {
			console.error('Error updating agence:', error);
			return fail(500, {
				error: 'Failed to update agence',
				form
			});
		}
	}
};

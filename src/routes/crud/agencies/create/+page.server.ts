import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { createAgenceSchema } from '$lib/schema/crud/agenciesSchema';
import { prisma } from '$lib/server';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const directors = await prisma.director.findMany();

	const createAgence = await superValidate(zod(createAgenceSchema));

	return {
		createAgence,
		directors
	};
};

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(createAgenceSchema));

		if (!form.valid) {
			return message(form, 'Invalid data');
		}

		try {
			await prisma.agence.create({
				data: {
					street: form.data.street,
					city: form.data.city,
					state: form.data.state,
					zip: form.data.zip,
					country: form.data.country,
					createdAt: form.data.createdAt,
					director: {
						connect: { id: form.data.directorId }
					}
				}
			});

			return message(form, 'Agence created successfully');
		} catch (error) {
			console.error('Error creating agence:', error);
			return fail(500, {
				error: 'Failed to create agence',
				form
			});
		}
	}
};

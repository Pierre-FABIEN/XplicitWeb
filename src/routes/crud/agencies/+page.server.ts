import { prisma } from '$lib/server';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { deleteAgenceSchema } from '$lib/schema/crud/agenciesSchema';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const agencies = await prisma.agence.findMany({
		select: {
			id: true,
			street: true,
			city: true,
			state: true,
			zip: true,
			country: true,
			director: {
				select: {
					id: true,
					name: true,
					email: true,
					age: true,
					isActive: true
				}
			}
		}
	});

	const deleteAgence = await superValidate(zod(deleteAgenceSchema));

	return {
		agencies,
		deleteAgence
	};
};

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(deleteAgenceSchema));

		if (!form.valid || !form.data.id) {
			return fail(400, {
				form,
				error: 'Invalid or missing ID'
			});
		}

		try {
			await prisma.agence.delete({
				where: { id: form.data.id }
			});

			return message(form, 'Agence deleted successfully');
		} catch (error) {
			console.error('Error deleting agence:', error);
			return fail(500, { error: 'Failed to delete agence', form });
		}
	}
};

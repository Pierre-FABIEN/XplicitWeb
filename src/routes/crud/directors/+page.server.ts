import { prisma } from '$lib/server';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { deleteDirectorSchema } from '$lib/schema/crud/directorsSchema';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const directors = await prisma.director.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			age: true,
			isActive: true,
			agencies: {
				select: {
					id: true,
					street: true,
					city: true,
					state: true,
					zip: true,
					country: true
				}
			}
		}
	});

	const deleteDirector = await superValidate(zod(deleteDirectorSchema));

	return {
		directors,
		deleteDirector
	};
};

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(deleteDirectorSchema));

		if (!form.valid || !form.data.id) {
			return fail(400, {
				form,
				error: 'Invalid or missing ID'
			});
		}

		try {
			await prisma.director.delete({
				where: { id: form.data.id }
			});

			return message(form, 'Director deleted successfully');
		} catch (error) {
			console.error('Error deleting directors:', error);
			return fail(500, { error: 'Failed to delete directors', form });
		}
	}
};

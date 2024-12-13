import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { updateDirectorSchema } from '$lib/schema/crud/directorsSchema';
import { prisma } from '$lib/server';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ params }) => {
	const directors = await prisma.director.findUnique({
		where: { id: params.id }
	});

	if (!directors) {
		redirect(302, '/directors/not-found');
	}

	const updateDirector = await superValidate(directors, zod(updateDirectorSchema));

	return { updateDirector };
};

export const actions = {
	update: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(updateDirectorSchema));

		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid data'
			});
		}

		try {
			await prisma.director.update({
				where: { id: form.data.id },
				data: {
					name: form.data.name,
					email: form.data.email,
					age: form.data.age,
					isActive: form.data.isActive
				}
			});

			return message(form, 'Director updated successfully');
		} catch (error) {
			console.error('Error updating directors:', error);
			return fail(500, {
				error: 'Failed to update directors',
				form
			});
		}
	}
};

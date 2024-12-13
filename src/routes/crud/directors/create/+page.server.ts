import { fail, message, superValidate } from 'sveltekit-superforms';
import { createDirectorSchema } from '$lib/schema/crud/directorsSchema';
import { prisma } from '$lib/server';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const form = await superValidate(zod(createDirectorSchema));

	return { form };
};

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(createDirectorSchema));

		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid data'
			});
		}

		try {
			await prisma.director.create({
				data: {
					name: form.data.name,
					email: form.data.email,
					age: form.data.age,
					isActive: form.data.isActive,
					createdAt: form.data.createdAt
				}
			});

			return message(form, 'Director created successfully');
		} catch (error) {
			console.error('Error creating directors:', error);
			return fail(500, {
				error: 'Failed to create directors',
				form
			});
		}
	}
};

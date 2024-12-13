import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { createProductSchema } from '$lib/schema/crud/productsSchema';
import { prisma } from '$lib/server';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const agencies = await prisma.agence.findMany();
	const form = await superValidate(zod(createProductSchema));

	return {
		agencies,
		form
	};
};

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(createProductSchema));

		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid data'
			});
		}

		try {
			await prisma.product.create({
				data: {
					name: form.data.name,
					stock: form.data.stock,
					price: form.data.price,
					agenceId: form.data.agenceId,
					createdAt: form.data.createdAt
				}
			});

			return message(form, 'Product created successfully');
		} catch (error) {
			console.error('Error creating product:', error);
			return fail(500, {
				error: 'Failed to create product',
				form
			});
		}
	}
};

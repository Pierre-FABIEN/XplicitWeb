import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { updateProductSchema } from '$lib/schema/crud/productsSchema';
import { prisma } from '$lib/server';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ params }) => {
	const product = await prisma.product.findUnique({
		where: { id: params.id },
		include: { agence: true }
	});

	const agencies = await prisma.agence.findMany();

	if (!product) {
		redirect(302, '/products/not-found');
	}

	const updateProduct = await superValidate(product, zod(updateProductSchema));

	return {
		product,
		agencies,
		updateProduct
	};
};

export const actions = {
	update: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(updateProductSchema));

		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid data'
			});
		}

		const productId = form.data.id;

		if (!productId) {
			return fail(400, {
				form,
				error: 'Product ID is required'
			});
		}

		try {
			await prisma.product.update({
				where: { id: productId },
				data: {
					name: form.data.name,
					stock: form.data.stock,
					price: form.data.price,
					agenceId: form.data.agenceId
				}
			});

			return message(form, 'Product updated successfully');
		} catch (error) {
			console.error('Error updating product:', error);
			return fail(500, {
				error: 'Failed to update product',
				form
			});
		}
	}
};

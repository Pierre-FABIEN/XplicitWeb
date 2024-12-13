import { prisma } from '$lib/server';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { deleteProductSchema } from '$lib/schema/crud/productsSchema.js';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const products = await prisma.product.findMany({
		include: {
			agence: {
				include: {
					director: true
				}
			}
		}
	});

	const deleteProduct = await superValidate(zod(deleteProductSchema));

	return {
		products,
		deleteProduct
	};
};

export const actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();

		const form = await superValidate(formData, zod(deleteProductSchema));

		if (!form.valid || !form.data.id) {
			return fail(400, {
				form,
				error: 'Invalid or missing ID'
			});
		}

		try {
			await prisma.product.delete({
				where: { id: form.data.id }
			});

			return message(form, 'Product deleted successfully');
		} catch (error) {
			console.error('Error deleting product:', error);
			return fail(500, { error: 'Failed to delete product', form });
		}
	}
};

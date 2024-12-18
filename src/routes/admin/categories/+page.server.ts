// +page.server.ts
import type { PageServerLoad } from './$types';
import { type Actions } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { deleteCategorySchema } from '$lib/schema/categories/deleteCategorySchema';

import { getAllcategories, getCategoriesById } from '$lib/prisma/categories/categories';
import { deleteProductCategoriesByCategoryId } from '$lib/prisma/categories/categories';
import { deleteCategoryById } from '$lib/prisma/categories/categories';

export const load: PageServerLoad = async () => {
	const IdeleteCategorySchema = await superValidate(zod(deleteCategorySchema));
	const categories = await getAllcategories();
	return {
		categories,
		IdeleteCategorySchema
	};
};

export const actions: Actions = {
	deleteCategory: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod(deleteCategorySchema));
		const id = formData.get('id') as string;
		console.log('Received id:', id);
		if (!id) {
			console.log('No id provided');
			return fail(400, { message: 'Category ID is required' });
		}
		try {
			// Vérifier si la catégorie existe
			const existingCategory = await getCategoriesById(id);
			if (!existingCategory) {
				console.log('Category not found:', id);
				return fail(400, { message: 'Category not found' });
			}
			console.log('Category found:', existingCategory);

			// Supprimer les relations de catégorie associées au produit
			const deletedProductCategories = await deleteProductCategoriesByCategoryId(id);
			console.log('Deleted product categories:', deletedProductCategories);

			// Supprimer la catégorie
			const deletedCategory = await deleteCategoryById(id);
			console.log('Deleted category:', deletedCategory);
			return message(form, 'Category deleted successfully');
		} catch (error) {
			console.error('Error deleting category:', error);
			return fail(500, { message: 'Category deletion failed' });
		}
	}
};

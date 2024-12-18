// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { type Actions } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import cloudinary from '$lib/server/cloudinary';

import { deleteProductSchema } from '$lib/schema/products/productSchema';
import { deleteCategorySchema } from '$lib/schema/categories/deleteCategorySchema';

import {
	deleteCategoryById,
	deleteProductCategories,
	getCategoriesById
} from '$lib/prisma/categories/categories';
import { deleteProductById, getProductById } from '$lib/prisma/products/products';

export const load: PageServerLoad = async () => {
	const IdeleteProductSchema = await superValidate(zod(deleteProductSchema));
	const IdeleteCategorySchema = await superValidate(zod(deleteCategorySchema));

	return {
		IdeleteCategorySchema,
		IdeleteProductSchema
	};
};

export const actions: Actions = {
	deleteProduct: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod(deleteProductSchema));
		const id = formData.get('id') as string;
		console.log('Received id:', id);
		if (!id) {
			console.log('No id provided');
			return fail(400, { message: 'Product ID is required' });
		}
		try {
			const existingProduct = await getProductById(id);
			if (!existingProduct) {
				console.log('Product not found:', id);
				return fail(400, { message: 'Product not found' });
			}
			console.log('Product found:', existingProduct);

			const images = existingProduct.images;
			for (const imageUrl of images) {
				const publicId = getPublicIdFromUrl(imageUrl);
				if (publicId) {
					try {
						const result = await cloudinary.uploader.destroy(`products/${publicId}`);
						console.log('Delete Result:', result);
						if (result.result !== 'ok' && result.result !== 'not found') {
							console.error('Error deleting image from Cloudinary:', result);
							return fail(500, { message: 'Failed to delete image from Cloudinary' });
						}
					} catch (error) {
						console.error('Error deleting image from Cloudinary:', error);
						return fail(500, { message: 'Failed to delete image from Cloudinary' });
					}
				}
			}

			const deletedCategories = await deleteProductCategories(id);
			console.log('Deleted product categories:', deletedCategories);

			const deletedProduct = await deleteProductById(id);
			console.log('Deleted product:', deletedProduct);
			return message(form, 'Product deleted successfully');
		} catch (error) {
			console.error('Error deleting product:', error);
			return fail(500, { message: 'Product deletion failed' });
		}
	},
	deleteCategory: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod(deleteCategorySchema));
		const categoryId = formData.get('categoryId') as string;
		console.log('Received categoryId:', categoryId);
		if (!categoryId) {
			console.log('No categoryId provided');
			return fail(400, { message: 'Category ID is required' });
		}
		try {
			const existingCategory = await getCategoriesById(categoryId);
			if (!existingCategory) {
				console.log('Category not found:', categoryId);
				return fail(400, { message: 'Category not found' });
			}
			console.log('Category found:', existingCategory);

			const deletedProductCategories = await deleteProductCategories(categoryId);
			console.log('Deleted product categories:', deletedProductCategories);

			const deletedCategory = await deleteCategoryById(categoryId);
			console.log('Deleted category:', deletedCategory);
			return message(form, 'Category deleted successfully');
		} catch (error) {
			console.error('Error deleting category:', error);
			return fail(500, { message: 'Category deletion failed' });
		}
	}
};

const getPublicIdFromUrl = (url: string): string | null => {
	const regex = /\/([^/]+)\.[a-z]+$/;
	const match = url.match(regex);
	return match ? match[1] : null;
};

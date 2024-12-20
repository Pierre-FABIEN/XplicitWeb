import { getAllProducts } from '$lib/prisma/products/products';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { createCustomSchema } from '$lib/schema/products/customSchema';

export const load = (async () => {
	const IcreateCustomSchema = await superValidate(zod(createCustomSchema));

	const products = await getAllProducts();

	return {
		IcreateCustomSchema,
		products
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	createCustom: async ({ request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData);
		console.log(data);
	}
};

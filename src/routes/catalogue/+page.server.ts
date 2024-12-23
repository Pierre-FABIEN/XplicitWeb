import { getAllProducts } from '$lib/prisma/products/products';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const Products = await getAllProducts();

	return {
		Products
	};
}) satisfies PageServerLoad;

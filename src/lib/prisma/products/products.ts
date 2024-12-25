import { prisma } from '$lib/server';

export const createProduct = async (productData: {
	name: string;
	description: string;
	price: number;
	stock: number;
	images: string[];
	slug: string;
	colorProduct: string;
}) => {
	return prisma.product.create({
		data: productData
	});
};

export const getProductById = async (productId: string) => {
	return await prisma.product.findUnique({
		where: { id: productId },
		include: { categories: true }
	});
};

export const deleteProductById = async (productId: string) => {
	// Supprime d'abord les OrderItems associés au produit
	await prisma.orderItem.deleteMany({
		where: { productId: productId }
	});

	// Ensuite, supprime les catégories associées si nécessaire
	await prisma.productCategory.deleteMany({
		where: { productId: productId }
	});

	// Finalement, supprime le produit lui-même
	return await prisma.product.delete({
		where: { id: productId }
	});
};

export const connectProductToCategories = async (productId: string, categoryIds: string[]) => {
	return prisma.productCategory.createMany({
		data: categoryIds.map((categoryId) => ({
			productId,
			categoryId
		}))
	});
};

export const getAllProducts = async () => {
	try {
		const products = await prisma.product.findMany({
			include: {
				categories: {
					include: {
						category: true
					}
				}
			}
		});
		return products;
	} catch (error) {
		console.error('Error fetching products:', error);
		throw new Error('Could not fetch products');
	}
};

export const updateProductById = async (productId: string, data: any) => {
	return await prisma.product.update({
		where: { id: productId },
		data: data
	});
};

import { prisma } from '$lib/server';

export const getCategoriesById = async (categoryId: string) => {
	return await prisma.category.findUnique({
		where: { id: categoryId }
	});
};

export const deleteCategoryById = async (categoryId: string) => {
	return await prisma.category.delete({
		where: { id: categoryId }
	});
};

export const deleteProductCategories = async (productId: string) => {
	return await prisma.productCategory.deleteMany({
		where: { productId: productId }
	});
};

export const createCategory = async (data: { name: string; description?: string }) => {
	return await prisma.category.create({
		data
	});
};

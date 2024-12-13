import { prisma } from '$lib/server';

export const load = async () => {
	const agenciesWithStock = await prisma.agence.findMany({
		select: {
			street: true,
			city: true,
			products: {
				select: {
					stock: true
				}
			}
		}
	});

	const stockData = agenciesWithStock.map((agence) => {
		return {
			agence: `${agence.street}, ${agence.city}`,
			totalStock: agence.products.reduce((acc, product) => acc + product.stock, 0)
		};
	});

	return {
		stockData
	};
};

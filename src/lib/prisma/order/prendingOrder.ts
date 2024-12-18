import { prisma } from '$lib/server';

export const findPendingOrder = async (userId: string) => {
	return await prisma.order.findFirst({
		where: {
			userId: userId,
			status: 'PENDING'
		},
		include: {
			items: {
				include: {
					product: true
				}
			}
		}
	});
};

export const createPendingOrder = async (userId: string) => {
	const order = await prisma.order.create({
		data: {
			userId: userId,
			status: 'PENDING'
		}
	});
	return { ...order, items: [] };
};

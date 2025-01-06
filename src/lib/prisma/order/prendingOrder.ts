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

export async function updateOrderItems(orderId: string, items: any[]) {
	console.log('Start updating order items...');
	console.log(`Order ID: ${orderId}`);
	console.log('Items to set:', JSON.stringify(items, null, 2));

	try {
		// 1) Vérifiez si la commande existe
		const orderExists = await prisma.order.findUnique({
			where: { id: orderId }
		});
		if (!orderExists) {
			throw new Error(`Order with ID ${orderId} not found.`);
		}

		// 2) Récupérer tous les orderItems existants
		const existingOrderItems = await prisma.orderItem.findMany({
			where: { orderId },
			select: { id: true }
		});

		// 3) Supprimer d’abord tous les Custom liés aux orderItems existants
		if (existingOrderItems.length > 0) {
			const orderItemIds = existingOrderItems.map((item) => item.id);

			await prisma.custom.deleteMany({
				where: {
					orderItemId: { in: orderItemIds }
				}
			});

			// 4) Supprimer ensuite tous les orderItems
			await prisma.orderItem.deleteMany({
				where: { orderId }
			});
		}

		// 5) Créer les nouveaux items
		for (const item of items) {
			const orderItemData: any = {
				orderId,
				productId: item.product.id,
				quantity: item.quantity,
				price: item.price
			};

			if (item.custom && item.custom.image && item.custom.userMessage) {
				orderItemData.custom = {
					create: {
						image: item.custom.image,
						userMessage: item.custom.userMessage
					}
				};
			}

			await prisma.orderItem.create({
				data: orderItemData
			});
		}

		// 6) Recalculer le total
		const allItems = await prisma.orderItem.findMany({
			where: { orderId }
		});
		const total = allItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

		// 7) Mettre à jour le total de la commande
		const updatedOrder = await prisma.order.update({
			where: { id: orderId },
			data: { total }
		});

		return updatedOrder;
	} catch (error) {
		console.error('Error while updating order items:', error);
		throw error;
	}
}

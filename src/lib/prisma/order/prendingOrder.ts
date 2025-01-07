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
					product: true,
					custom: true
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

export async function updateOrderItems(orderId: string, incomingItems: any[]) {
	console.log('--- Start updating order items (non-destructive) ---');
	console.log(`Order ID: ${orderId}`);
	console.log('New items:', JSON.stringify(incomingItems, null, 2));

	try {
		// 1) Vérifier si la commande existe
		console.log('Step 1: Checking if the order exists...');
		const orderExists = await prisma.order.findUnique({
			where: { id: orderId }
		});
		if (!orderExists) {
			throw new Error(`Order with ID ${orderId} not found.`);
		}
		console.log('Order found:', orderExists);

		// 2) Récupérer tous les orderItems existants pour cette commande
		console.log('Step 2: Retrieving existing order items...');
		const existingOrderItems = await prisma.orderItem.findMany({
			where: { orderId },
			include: { custom: true }
		});
		console.log('Existing order items:', existingOrderItems);

		// On récupère leurs IDs pour savoir ensuite lesquels supprimer
		const existingOrderItemIds = existingOrderItems.map((oi) => oi.id);

		// Cette liste contiendra les IDs des orderItems qu'on souhaite conserver ou créer
		const keptOrCreatedIds: string[] = [];

		// 3) Boucler sur chaque nouvel item à *upsert* (update ou create)
		console.log('Step 3: Upserting new/updated items...');
		for (const newItem of incomingItems) {
			// Vérifie si l'item est déjà en base (via l’ID)
			const matchingExistingItem = existingOrderItems.find((oi) => oi.id === newItem.id);

			if (matchingExistingItem) {
				// --- Mise à jour (UPDATE) d'un item existant ---
				console.log(`Updating existing orderItem ID: ${matchingExistingItem.id}`);

				// Prépare la data d’update
				const dataToUpdate: any = {
					quantity: newItem.quantity,
					price: newItem.price,
					productId: newItem.product?.id
				};

				// Gestion de la custom :
				// - Si "newItem.custom" est un tableau (cas multi-custom)
				//   ou un objet unique (cas single custom).
				//   Ici, on illustre la gestion d’un seul custom (le plus courant).
				if (newItem.custom && newItem.custom.image && newItem.custom.userMessage) {
					// Soit on fait un upsert sur le custom existant
					// (pour éviter de le supprimer puis le recréer).
					// S'il y a plusieurs custom, il faudra faire une boucle ou un traitement spécifique.
					dataToUpdate.custom = {
						upsert: {
							where: { id: newItem.custom.id ?? '' },
							update: {
								image: newItem.custom.image,
								userMessage: newItem.custom.userMessage
							},
							create: {
								image: newItem.custom.image,
								userMessage: newItem.custom.userMessage
							}
						}
					};
				} else {
					// Si pas de nouveau custom envoyé, on ne touche pas à l'existant
					// (On pourrait le supprimer si la logique métier l’exige, à adapter).
				}

				const updatedItem = await prisma.orderItem.update({
					where: { id: matchingExistingItem.id },
					data: dataToUpdate,
					include: { custom: true, product: true }
				});
				console.log('Updated orderItem:', updatedItem);

				keptOrCreatedIds.push(matchingExistingItem.id);
			} else {
				// --- Création (CREATE) d'un nouvel item ---
				console.log('Creating new order item (no matching ID found)');

				const dataToCreate: any = {
					orderId,
					productId: newItem.product?.id,
					quantity: newItem.quantity,
					price: newItem.price
				};

				// Gestion de la custom en création
				if (newItem.custom && newItem.custom.image && newItem.custom.userMessage) {
					dataToCreate.custom = {
						create: {
							image: newItem.custom.image,
							userMessage: newItem.custom.userMessage
						}
					};
				}

				const createdOrderItem = await prisma.orderItem.create({
					data: dataToCreate,
					include: { custom: true, product: true }
				});
				console.log('Created orderItem:', createdOrderItem);

				keptOrCreatedIds.push(createdOrderItem.id);
			}
		}

		// 4) Supprimer les orderItems (et leurs customs) non présents dans la nouvelle liste
		const itemsToDelete = existingOrderItemIds.filter((id) => !keptOrCreatedIds.includes(id));

		if (itemsToDelete.length > 0) {
			console.log(`Step 4: Deleting items no longer in the list: ${itemsToDelete}`);

			// Supprimer d’abord les customs correspondants
			await prisma.custom.deleteMany({
				where: {
					orderItemId: { in: itemsToDelete }
				}
			});

			// Puis supprimer les orderItems
			await prisma.orderItem.deleteMany({
				where: {
					id: { in: itemsToDelete }
				}
			});
			console.log('Deleted the items no longer needed');
		} else {
			console.log('No order items to delete - everything is kept or updated.');
		}

		// 5) Recalculer le total
		console.log('Step 5: Calculating new total...');
		const allItems = await prisma.orderItem.findMany({
			where: { orderId }
		});
		const total = allItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
		console.log(`New total calculated: ${total}`);

		// 6) Mettre à jour le total de la commande
		console.log('Step 6: Updating the order total...');
		await prisma.order.update({
			where: { id: orderId },
			data: { total }
		});

		// 7) Récupérer la commande finale avec items + custom
		console.log('Step 7: Fetching updated order with items + custom...');
		const updatedOrderWithItems = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				items: {
					include: {
						product: true,
						custom: true
					}
				}
			}
		});

		console.log('--- Successfully updated order items ---');
		console.log('Final updated order:', updatedOrderWithItems);

		// 8) Retourner la commande mise à jour
		return updatedOrderWithItems;
	} catch (error) {
		console.error('Error while updating order items (non-destructive):', error);
		throw error;
	}
}

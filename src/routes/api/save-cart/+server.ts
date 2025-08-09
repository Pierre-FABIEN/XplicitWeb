import { updateOrderItems } from '$lib/prisma/order/prendingOrder';
import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	try {
		const { id, items } = await request.json();

		// Validation de l'ID
		if (!id) {
			console.error('Error updating order: Order ID is missing');
			return json({ error: 'Order ID is missing' }, { status: 400 });
		}

		// console.log('Updating order:', id);
		// console.log('New items:', items);

		const updatedOrder = await updateOrderItems(id, items);

		return new Response(JSON.stringify(updatedOrder), {
			status: 200
		});
	} catch (error) {
		console.error('Error updating order:', error);
		return new Response(JSON.stringify({ error: 'Failed to update order items' }), { status: 500 });
	}
};

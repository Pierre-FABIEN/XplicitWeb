import { updateOrderItems } from '$lib/prisma/order/prendingOrder';

export const POST = async ({ request }) => {
	try {
		const { id, items } = await request.json();

		console.log('Updating order:', id);
		console.log('New items:', items);

		const updatedOrder = await updateOrderItems(id, items);

		return new Response(JSON.stringify(updatedOrder), {
			status: 200
		});
	} catch (error) {
		console.error('Error updating order:', error);
		return new Response(JSON.stringify({ error: 'Failed to update order items' }), { status: 500 });
	}
};

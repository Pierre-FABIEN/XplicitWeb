import { OrderSchema } from '$lib/schema/order/order';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { getUserAddresses } from '$lib/prisma/addresses/addresses';

export const load = (async ({ locals }) => {
	console.log(locals);

	const userId = locals.user.id;
	const IOrderSchema = await superValidate(zod(OrderSchema));
	const addresses = await getUserAddresses(userId);
	return {
		addresses,
		IOrderSchema
	};
}) satisfies PageServerLoad;

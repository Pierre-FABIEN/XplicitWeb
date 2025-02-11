import type { PageServerLoad } from './$types';
import { getTransactionsByUserId } from '$lib/prisma/transaction/getTransactionsByUserId';

export const load = (async ({ locals }) => {
	// Récupérer l'ID depuis l'URL
	const userId = locals.user.id;

	// Récupérer la transaction
	const transaction = await getTransactionsByUserId(userId);

	return {
		transaction
	};
}) satisfies PageServerLoad;

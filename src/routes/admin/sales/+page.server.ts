import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { deleteUserSchema } from '$lib/schema/users/userSchema';
import { getAllUsers } from '$lib/prisma/user/user';

// Fonction de chargement côté serveur
export const load: PageServerLoad = async () => {
	const IdeleteUserSchema = await superValidate(zod(deleteUserSchema));

	const allUsers = await getAllUsers();

	return {
		IdeleteUserSchema,
		allUsers
	};
};

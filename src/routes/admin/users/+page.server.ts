import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { message, superValidate } from 'sveltekit-superforms';
import { deleteUserSchema } from '$lib/schema/users/userSchema';
import { deleteUser, getAllUsers } from '$lib/prisma/user/user';

// Fonction de chargement côté serveur
export const load: PageServerLoad = async () => {
	const IdeleteUserSchema = await superValidate(zod(deleteUserSchema));

	const allUsers = await getAllUsers();

	return {
		IdeleteUserSchema,
		allUsers
	};
};

// Action pour supprimer un utilisateur
export const actions: Actions = {
	deleteUser: async ({ request }) => {
		const formData = await request.formData();
		console.log('Received form data:', formData);

		const id = formData.get('id') as string;

		const form = await superValidate(formData, zod(deleteUserSchema));

		try {
			await deleteUser(id);

			return message(form, 'User deleted successfully');
		} catch (error) {
			console.error('Error deleting user:', error);
			return { error: 'Failed to delete user' };
		}
	}
};

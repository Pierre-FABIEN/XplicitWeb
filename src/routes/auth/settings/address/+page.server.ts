import { deleteAddressSchema } from '$lib/schema/auth/addressSchema';
import { prisma } from '$lib/server';
import { redirect, type Actions } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async (event) => {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, '/auth/login');
	}
	if (!event.locals.user.googleId) {
		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
			return redirect(302, '/auth/2fa');
		}
	}
	const userId = event.locals.user.id;

	const address = await prisma.address.findMany({
		where: { userId }
	});

	const IdeleteAddressSchema = await superValidate(zod(deleteAddressSchema));

	return {
		IdeleteAddressSchema,
		address
	};
};

export const actions: Actions = {
	deleteAddress: async ({ request }) => {
		const formData = await request.formData();
		console.log(formData, 'form data');

		const form = await superValidate(formData, zod(deleteAddressSchema));

		console.log(form, 'form');
		if (!form.valid) return fail(400, { form });

		try {
			const addressId = formData.get('id') as string;

			await prisma.address.delete({
				where: { id: addressId }
			});

			return message(form, 'Address deleted successfully');
		} catch (error: any) {
			console.error('Error deleting address:', error);
			return fail(500, { form, error: 'An error occurred while deleting the address' });
		}
	}
};
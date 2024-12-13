import { getUserFromEmail } from '$lib/lucia/user';
import {
	createPasswordResetSession,
	invalidateUserPasswordResetSessions,
	sendPasswordResetEmail,
	setPasswordResetSessionTokenCookie
} from '$lib/lucia/passwordReset';
import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import { generateSessionToken } from '$lib/lucia/session';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions, RequestEvent } from './$types';
import { message, superValidate } from 'sveltekit-superforms';
import { forgotPasswordSchema } from '$lib/schema/auth/forgotPasswordSchema';
import { zod } from 'sveltekit-superforms/adapters';

const ipBucket = new RefillingTokenBucket<string>(3, 60);
const userBucket = new RefillingTokenBucket<number>(3, 60);

export const load = async (event) => {
	if (event.locals.session !== null && event.locals.user !== null) {
		return redirect(302, '/auth/');
	}

	const forgotForm = await superValidate(event, zod(forgotPasswordSchema));

	return {
		forgotForm
	};
};

export const actions: Actions = {
	forgotPassword: async (event: RequestEvent) => {
		// TODO: Assumes X-Forwarded-For is always included.
		const formData = await event.request.formData();
		const form = await superValidate(formData, zod(forgotPasswordSchema));
		const { email } = form.data;
		if (!form.valid) {
			return fail(400, { form });
		}

		const clientIP = event.request.headers.get('X-Forwarded-For');
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			return message(form, 'Too many requests');
		}

		const user = await getUserFromEmail(email);

		if (user === null) {
			return message(form, 'Account does not exist');
		}
		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			return message(form, 'Too many requests');
		}

		if (!userBucket.consume(user.id, 1)) {
			return message(form, 'Too many requests');
		}

		await invalidateUserPasswordResetSessions(user.id);
		const sessionToken = generateSessionToken();
		const session = await createPasswordResetSession(sessionToken, user.id, user.email);
		sendPasswordResetEmail(session.email, session.code);
		setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);
		return redirect(302, '/auth/reset-password/verify-email');
	}
};

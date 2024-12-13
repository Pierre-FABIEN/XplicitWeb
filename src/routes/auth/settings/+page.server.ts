import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from '$lib/lucia/email-verification';
import { fail, redirect } from '@sveltejs/kit';
import { checkEmailAvailability } from '$lib/lucia/email';
import { verifyPasswordHash } from '$lib/lucia/password';
import { getUserPasswordHash, getUserRecoverCode, updateUserPassword } from '$lib/lucia/user';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/lucia/session';
import { ExpiringTokenBucket } from '$lib/lucia/rate-limit';
import { message, superValidate } from 'sveltekit-superforms';
import { emailSchema, passwordSchema } from '$lib/schema/auth/settingsSchemas';
import { zod } from 'sveltekit-superforms/adapters';

import type { Actions, RequestEvent } from './$types';
import type { SessionFlags } from '$lib/lucia/session';

const passwordUpdateBucket = new ExpiringTokenBucket<string>(5, 60 * 30);

export const load = async (event: RequestEvent) => {
	let recoveryCode: string | null = null;

	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, '/auth/login');
	}
	if (!event.locals.user.googleId) {
		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
			return redirect(302, '/auth/2fa');
		}

		// Récupérer le code de récupération si l'utilisateur utilise l'authentification à deux facteurs
		if (event.locals.user.registered2FA) {
			recoveryCode = await getUserRecoverCode(event.locals.user.id);
		}
	}
	// Initialiser les formulaires Superform
	const passwordForm = await superValidate(event, zod(passwordSchema));
	const emailForm = await superValidate(event, zod(emailSchema));

	return {
		recoveryCode,
		user: event.locals.user,
		passwordForm,
		emailForm
	};
};

export const actions: Actions = {
	password: async (event: RequestEvent) => {
		if (event.locals.session === null || event.locals.user === null) {
			return fail(401, { form: { message: 'Not authenticated' } });
		}
		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
			return fail(403, { form: { message: 'Forbidden' } });
		}
		if (!passwordUpdateBucket.check(event.locals.session.id, 1)) {
			return fail(429, { form: { message: 'Too many requests' } });
		}

		// Valider le formulaire avec Superform
		const form = await superValidate(event, zod(passwordSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { password, new_password } = form.data;

		const passwordHash = await getUserPasswordHash(event.locals.user.id);
		const validPassword = await verifyPasswordHash(passwordHash, password);
		if (!validPassword) {
			return fail(400, { form: { message: 'Incorrect password', form } });
		}

		passwordUpdateBucket.reset(event.locals.session.id);
		await invalidateUserSessions(event.locals.user.id);
		await updateUserPassword(event.locals.user.id, new_password);

		const sessionToken = generateSessionToken();
		const sessionFlags: SessionFlags = {
			twoFactorVerified: event.locals.session.twoFactorVerified
		};
		const session = await createSession(sessionToken, event.locals.user.id, sessionFlags);
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return message(form, 'Password modified successfully');
	},

	email: async (event: RequestEvent) => {
		if (event.locals.session === null || event.locals.user === null) {
			return fail(401, { form: { message: 'Not authenticated' } });
		}
		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
			return fail(403, { form: { message: 'Forbidden' } });
		}
		if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
			return fail(429, { form: { message: 'Too many requests' } });
		}

		// Valider le formulaire avec Superform
		const form = await superValidate(event, zod(emailSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { email } = form.data;

		// Vérifier la disponibilité de l'email
		const emailAvailable = await checkEmailAvailability(email);
		if (!emailAvailable) {
			return fail(400, { form: { message: 'This email is already used', form } });
		}

		const verificationRequest = await createEmailVerificationRequest(event.locals.user.id, email);
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);

		redirect(302, '/auth/verify-email');
	}
};

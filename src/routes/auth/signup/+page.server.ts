import { fail, redirect } from '@sveltejs/kit';
import { checkEmailAvailability } from '$lib/lucia/email';
import { createUser } from '$lib/lucia/user';
import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/lucia/session';
import {
	createEmailVerificationRequest,
	sendVerificationEmail,
	setEmailVerificationRequestCookie
} from '$lib/lucia/email-verification';

import type { SessionFlags } from '$lib/lucia/session';
import type { Actions, PageServerLoadEvent, RequestEvent } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { signupSchema } from '$lib/schema/auth/signupSchema';
import { zod } from 'sveltekit-superforms/adapters';

const ipBucket = new RefillingTokenBucket<string>(3, 10);

export const load = async (event: PageServerLoadEvent) => {
	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) {
			return redirect(302, '/auth/verify-email');
		}
		if (!event.locals.user.googleId) {
			if (!event.locals.user.registered2FA) {
				return redirect(302, '/auth/2fa/setup');
			}
			if (!event.locals.session.twoFactorVerified) {
				return redirect(302, '/auth/2fa');
			}
		}
		return redirect(302, '/auth/');
	}

	const form = await superValidate(zod(signupSchema));

	return { form };
};

export const actions: Actions = {
	signup: async (event: RequestEvent) => {
		const clientIP = event.request.headers.get('X-Forwarded-For');

		// Vérifier le rate limit
		if (clientIP !== null && !ipBucket.check(clientIP, 1)) {
			return fail(429, {
				message: 'Too many requests'
			});
		}

		// Valider le formulaire avec Superform et Zod
		const form = await superValidate(event, zod(signupSchema));

		// Si la validation échoue, retourner les erreurs
		if (!form.valid) {
			return fail(400, { form });
		}

		// Vérifier si l'email est déjà utilisé
		const emailAvailable = await checkEmailAvailability(form.data.email);
		if (!emailAvailable) {
			form.errors.email = ['Cet email est déjà utilisé.'];
			return fail(400, { form });
		}

		// Consommer le token du rate limit
		if (clientIP !== null && !ipBucket.consume(clientIP, 1)) {
			return fail(429, {
				message: 'Too many requests'
			});
		}

		// Créer l'utilisateur
		const user = await createUser(form.data.email, form.data.username, form.data.password);

		// Créer la demande de vérification de l'email
		const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);

		sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
		setEmailVerificationRequestCookie(event, emailVerificationRequest);

		// Créer une session pour l'utilisateur
		const sessionFlags: SessionFlags = {
			twoFactorVerified: false
		};

		const sessionToken = generateSessionToken();

		const session = await createSession(sessionToken, user.id, sessionFlags);

		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		// Rediriger vers la configuration de la 2FA
		redirect(302, '/auth/2fa/setup');
	}
};

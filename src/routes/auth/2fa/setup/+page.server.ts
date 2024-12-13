import { createTOTPKeyURI, verifyTOTP } from '@oslojs/otp';
import { fail, redirect } from '@sveltejs/kit';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { updateUserTOTPKey } from '$lib/lucia/user';
import { setSessionAs2FAVerified } from '$lib/lucia/session';
import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import { message, superValidate } from 'sveltekit-superforms';
import { totpSchema } from '$lib/schema/auth/totpSchema';
import { renderSVG } from 'uqr';

import type { Actions, RequestEvent } from './$types';
import { zod } from 'sveltekit-superforms/adapters';

const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);

export const load = async (event: RequestEvent) => {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, '/auth/login');
	}
	if (!event.locals.user.emailVerified) {
		return redirect(302, '/auth/verify-email');
	}
	if (!event.locals.user.googleId) {
		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
			return redirect(302, '/auth/2fa');
		}
	}

	// Générer la clé TOTP et le QR code
	const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	const keyURI = createTOTPKeyURI('Demo', event.locals.user.username, totpKey, 30, 6);

	// Générer le QR code
	const qrcode = renderSVG(keyURI);

	// Valider le formulaire avec Superform
	const totpForm = await superValidate(event, zod(totpSchema));

	return {
		encodedTOTPKey,
		qrcode,
		totpForm
	};
};

export const actions: Actions = {
	setuptotp: async (event: RequestEvent) => {
		const formData = await event.request.formData();

		const form = await superValidate(formData, zod(totpSchema));

		if (event.locals.session === null || event.locals.user === null) {
			return message(form, 'Not authenticated');
		}
		if (!event.locals.user.emailVerified) {
			return message(form, 'Email not verified');
		}
		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
			return message(form, 'Two-factor already set up');
		}
		if (!totpUpdateBucket.check(event.locals.user.id, 1)) {
			return message(form, 'Too many requests');
		}

		if (!form.valid) {
			return message(form, 'Form validation failed');
		}

		const { encodedTOTPKey, code } = form.data;

		if (encodedTOTPKey.length !== 28) {
			return message(form, 'Invalid encoded key length');
		}

		let key: Uint8Array;
		try {
			key = decodeBase64(encodedTOTPKey);
		} catch (error) {
			console.error('Erreur lors du décodage de la clé :', error);
			return message(form, 'Invalid encoded key format');
		}

		if (key.byteLength !== 20) {
			return message(form, 'Invalid key length');
		}

		try {
			const isValid = verifyTOTP(key, 30, 6, code);

			if (!isValid) {
				return message(form, 'Invalid TOTP code');
			}
		} catch (error) {
			return fail(500, { message: 'Internal server error', form });
		}

		await updateUserTOTPKey(event.locals.session.userId, key);
		await setSessionAs2FAVerified(event.locals.session.id);

		// Utilisez `redirect` pour rediriger correctement
		redirect(302, '/auth/recovery-code');
	}
};

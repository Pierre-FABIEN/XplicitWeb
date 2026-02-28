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
import { auth } from '$lib/lucia';

const totpUpdateBucket = new RefillingTokenBucket<number>(3, 60 * 10);

export const load = async (event: RequestEvent) => {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, '/auth/login');
	}
	if (!event.locals.user.emailVerified) {
		return redirect(302, '/auth/verify-email');
	}

	//console.log(event.locals, 'slkrjghxkgujh SETUP');
	if (!event.locals.user.googleId || !event.locals.user.isMfaEnabled) {
		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
			if (event.locals.user.isMfaEnabled) {
				return redirect(302, '/auth/2fa');
			}
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
		//console.log('Début de l’action setup TOTP');

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

		//console.log('Données reçues:', { encodedTOTPKey, code });

		if (encodedTOTPKey.length !== 28) {
			return message(form, 'Invalid encoded key length');
		}

		let key: Uint8Array;
		try {
			key = decodeBase64(encodedTOTPKey);
			//console.log('Clé décodée avec succès:', key);
		} catch (error) {
			return message(form, 'Invalid encoded key format');
		}

		if (key.byteLength !== 20) {
			return message(form, 'Invalid key length');
		}

		try {
			//console.log('Validation du code TOTP...');
			const isValid = verifyTOTP(key, 30, 6, code);

			if (!isValid) {
				return message(form, 'Invalid TOTP code');
			}
			//console.log('Code TOTP valide.');
		} catch (error) {
			return fail(500, { message: 'Internal server error', form });
		}

		try {
			//console.log('Mise à jour de la clé TOTP dans la base de données...');
			await updateUserTOTPKey(event.locals.session.userId, key);
			//console.log('Clé TOTP mise à jour avec succès.');

			//console.log('Marquage de la session comme vérifiée pour la 2FA...');
			await setSessionAs2FAVerified(event.locals.session.id);

			//console.log('Session marquée comme vérifiée.');
			event.locals.session.twoFactorVerified = true;
			// après avoir mis à jour la BDD et marqué la session comme vérifiée
			event.locals.user.isMfaEnabled = true;
			event.locals.user.registered2FA = true;
		} catch (error) {
			return fail(500, { message: 'Internal server error', form });
		}

		//console.log('Redirection vers la page des codes de récupération.');
		return redirect(303, '/auth/recovery-code');
	}
};

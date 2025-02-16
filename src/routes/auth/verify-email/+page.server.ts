import { fail, redirect } from '@sveltejs/kit';
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendVerificationEmail,
	sendVerificationEmailBucket,
	setEmailVerificationRequestCookie
} from '$lib/lucia/email-verification';
import { invalidateUserPasswordResetSessions } from '$lib/prisma/passwordResetSession/passwordResetSession';
import { updateUserEmailAndSetEmailAsVerified } from '$lib/lucia/user';
import { ExpiringTokenBucket } from '$lib/lucia/rate-limit';

import type { Actions, RequestEvent } from './$types';

import { verifyCodeSchema } from '$lib/schema/auth/verifyCodeSchema';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';

const bucket = new ExpiringTokenBucket<number>(5, 60 * 30);

export const load = async (event: RequestEvent) => {
	if (event.locals.user === null) {
		return redirect(302, '/auth/login');
	}

	const verifyCode = await superValidate(zod(verifyCodeSchema));

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);

	if (verificationRequest === null || Date.now() >= verificationRequest.expiresAt.getTime()) {
		if (event.locals.user.emailVerified) {
			return redirect(302, '/auth/');
		}
		// Note: We don't need rate limiting since it takes time before requests expire
		verificationRequest = await createEmailVerificationRequest(
			event.locals.user.id,
			event.locals.user.email
		);
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);
	}

	return {
		verifyCode,
		email: verificationRequest.email
	};
};

export const actions: Actions = {
	verifyCode: verifyCode,
	resendCode: resendEmail
};

async function verifyCode(event: RequestEvent) {
	if (event.locals.session === null || event.locals.user === null) {
		return fail(401, {
			verify: {
				message: 'Not authenticated'
			}
		});
	}
	if (event.locals.user.isMfaEnabled) {
		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
			return fail(403, {
				verify: {
					message: 'Forbidden'
				}
			});
		}
	}
	if (!bucket.check(event.locals.user.id, 1)) {
		return fail(429, {
			verify: {
				message: 'Too many requests'
			}
		});
	}

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) {
		return fail(401, {
			verify: {
				message: 'Not authenticated'
			}
		});
	}
	const formData = await event.request.formData();
	const code = formData.get('code');
	if (typeof code !== 'string') {
		return fail(400, {
			verify: {
				message: 'Invalid or missing fields'
			}
		});
	}
	if (code === '') {
		return fail(400, {
			verify: {
				message: 'Enter your code'
			}
		});
	}
	if (!bucket.consume(event.locals.user.id, 1)) {
		return fail(400, {
			verify: {
				message: 'Too many requests'
			}
		});
	}
	if (Date.now() >= verificationRequest.expiresAt.getTime()) {
		verificationRequest = await createEmailVerificationRequest(
			verificationRequest.userId,
			verificationRequest.email
		);
		sendVerificationEmail(verificationRequest.email, verificationRequest.code);
		return {
			verify: {
				message: 'The verification code was expired. We sent another code to your inbox.'
			}
		};
	}
	if (verificationRequest.code !== code) {
		return fail(400, {
			verify: {
				message: 'Incorrect code.'
			}
		});
	}
	deleteUserEmailVerificationRequest(event.locals.user.id);
	invalidateUserPasswordResetSessions(event.locals.user.id);
	updateUserEmailAndSetEmailAsVerified(event.locals.user.id, verificationRequest.email);
	deleteEmailVerificationRequestCookie(event);

	if (!event.locals.user.registered2FA) {
		if (event.locals.user.isMfaEnabled) {
			return redirect(302, '/auth/2fa/setup');
		}
	}
	return redirect(302, '/auth/');
}

async function resendEmail(event: RequestEvent) {
	if (event.locals.session === null || event.locals.user === null) {
		return fail(401, {
			resend: {
				message: 'Not authenticated'
			}
		});
	}
	if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
		return fail(403, {
			resend: {
				message: 'Forbidden'
			}
		});
	}
	if (!sendVerificationEmailBucket.check(event.locals.user.id, 1)) {
		return fail(429, {
			resend: {
				message: 'Too many requests'
			}
		});
	}

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);

	if (verificationRequest === null) {
		if (event.locals.user.emailVerified) {
			return fail(403, {
				resend: {
					message: 'Forbidden'
				}
			});
		}
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			return fail(429, {
				resend: {
					message: 'Too many requests'
				}
			});
		}
		verificationRequest = await createEmailVerificationRequest(
			event.locals.user.id,
			event.locals.user.email
		);
	} else {
		if (!sendVerificationEmailBucket.consume(event.locals.user.id, 1)) {
			return fail(429, {
				resend: {
					message: 'Too many requests'
				}
			});
		}
		verificationRequest = await createEmailVerificationRequest(
			event.locals.user.id,
			verificationRequest.email
		);
	}

	sendVerificationEmail(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(event, verificationRequest);
	return {
		resend: {
			message: 'A new code was sent to your inbox.'
		}
	};
}

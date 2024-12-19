import { fail, redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/lucia/session';

import type { Actions, PageServerLoadEvent, RequestEvent } from './$types';

export const load = async (event: PageServerLoadEvent) => {
	if (event.locals.session === null || event.locals.user === null) {
		return redirect(302, '/auth/login');
	}
	if (!event.locals.user.emailVerified) {
		return redirect(302, '/auth/verify-email');
	}

	console.log(event.locals.user, 'slkrjghxkgujh');

	if (!event.locals.user.googleId) {
		if (!event.locals.user.isMfaEnabled) {
			return;
		}

		if (!event.locals.user.registered2FA) {
					if (event.locals.user.isMfaEnabled) {
		return redirect(302, '/auth/2fa/setup');
	}
		}
		if (!event.locals.session.twoFactorVerified) {
			if (event.locals.user.isMfaEnabled) {
				return redirect(302, '/auth/2fa');
			}
		}
	}
	return {
		user: event.locals.user
	};
};
export const actions: Actions = {
	signout: async (event: RequestEvent) => {
		if (event.locals.session === null) {
			return fail(401, {
				message: 'Not authenticated'
			});
		}
		invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		return redirect(302, 'auth/login');
	}
};

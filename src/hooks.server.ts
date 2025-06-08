// -----------------------------------------------------------------------------
// hooks.server.ts — Rate-limit + Auth + pendingOrder + DevTools + Email guards
// -----------------------------------------------------------------------------

import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';

import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import { auth } from '$lib/lucia';
import type { User } from '$lib/lucia/user';
import type { Session } from '$lib/lucia/session';

import { createPendingOrder, findPendingOrder } from '$lib/prisma/order/prendingOrder';
import { getUserByIdPrisma } from '$lib/prisma/user/user';
import { findSessionById } from '$lib/prisma/session/sessions';

/* -------------------------------------------------------------------------- */
/*  Utils                                                                     */
/* -------------------------------------------------------------------------- */

function log(...args: unknown[]) {
	console.log('[hooks]', ...args);
}

const bucket = new RefillingTokenBucket<string>(100, 1); // 100 req / 1 s

function clientIP(event: Parameters<Handle>[0]['event']): string {
	const xff = event.request.headers.get('x-forwarded-for');
	if (xff) return xff.split(',')[0]!.trim();
	try {
		return event.getClientAddress();
	} catch {
		return '127.0.0.1';
	}
}

/* -------------------------------------------------------------------------- */
/*  Guards                                                                    */
/* -------------------------------------------------------------------------- */

const devtoolsGuard: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/.well-known/appspecific/')) {
		log('DevTools guard → 204');
		return new Response(null, { status: 204 });
	}
	return resolve(event);
};

const rateLimit: Handle = async ({ event, resolve }) => {
	const ip = clientIP(event);
	if (!bucket.consume(ip, 1)) {
		log('Rate-limit BLOCK', ip);
		return new Response('Too many requests', { status: 429 });
	}
	return resolve(event);
};

const cookieGuard: Handle = async ({ event, resolve }) => {
	const cookie = event.request.headers.get('cookie') ?? '';
	if (/[^\u0020-\u007E]/.test(cookie)) {
		log('Bad cookie header');
		return new Response('Bad Cookie', { status: 400 });
	}
	return resolve(event);
};

/* -------------------------------------------------------------------------- */
/*  Auth (Lucia v3)                                                           */
/* -------------------------------------------------------------------------- */

const authHandle: Handle = async ({ event, resolve }) => {
	/* 1. Extraction du cookie session */
	const sid = event.cookies.get(auth.sessionCookieName);
	console.log('[hooks] Session ID from cookie (sid):', sid);

	let session: Session | null = null;
	let user: User | null = null;

	if (sid) {
		const res = await auth.validateSession(sid);
		console.log('[hooks] Raw result from auth.validateSession:', res);
		const luciaSession = res.session;
		const luciaUser = res.user;

		console.log('[hooks] Lucia Session object from validateSession:', luciaSession);
		console.log('[hooks] Lucia User object from validateSession:', luciaUser);

		/* Rafraîchissement des données utilisateur */
		if (luciaUser) {
			const freshUser = await getUserByIdPrisma(luciaUser.id);
			if (freshUser) {
				console.log('fresh user data in hooks:', freshUser);
				const registered2FA = freshUser.totpKey !== null;
				console.log('calculated registered2FA in hooks:', registered2FA);
				user = {
					id: freshUser.id,
					email: freshUser.email,
					username: freshUser.username,
					emailVerified: freshUser.emailVerified,
					registered2FA: registered2FA,
					googleId: freshUser.googleId,
					name: freshUser.name,
					picture: freshUser.picture,
					role: freshUser.role,
					isMfaEnabled: freshUser.isMfaEnabled,
					totpKey: freshUser.totpKey
				};
			}
		}

		/* Rafraîchissement des données de session */
		if (luciaSession) {
			const dbSession = await findSessionById(luciaSession.id);
			console.log('[hooks] dbSession from findSessionById:', dbSession);
			if (dbSession) {
				session = {
					id: dbSession.id,
					userId: dbSession.userId,
					expiresAt: dbSession.expiresAt,
					twoFactorVerified: dbSession.twoFactorVerified,
					oauthProvider: dbSession.oauthProvider,
					fresh: luciaSession.fresh
				};
				console.log('[hooks] Mapped session object for event.locals:', session);
			}
		}

		/* Rotation du cookie si session fraîche */
		if (session?.fresh) {
			const c = auth.createSessionCookie(session.id);
			event.cookies.set(c.name, c.value, { path: '/', ...c.attributes });
		}

		/* Session invalide ➜ effacement */
		if (!session) {
			const blank = auth.createBlankSessionCookie();
			event.cookies.set(blank.name, blank.value, { path: '/', ...blank.attributes });
		}
	}

	/* 2. Enrichissement de locals */
	event.locals = {
		...event.locals,
		session,
		user,
		role: user?.role ?? null,
		isMfaEnabled: user?.isMfaEnabled ?? false,
		registered2FA: user?.registered2FA ?? false,
		pendingOrder: user
			? ((await findPendingOrder(user.id)) ?? (await createPendingOrder(user.id)))
			: null
	};

	console.log('[hooks] event.locals.session before redirect logic:', event.locals.session);
	console.log('[hooks] event.locals.user before redirect logic:', event.locals.user);

	/* 3. Redirections MFA */
	if (user && user.isMfaEnabled) {
		// A. Secret pas encore enregistré ➜ /auth/2fa/setup
		if (!user.registered2FA) {
			if (!event.url.pathname.startsWith('/auth/2fa/setup')) {
				throw redirect(302, '/auth/2fa/setup');
			}
		}

		// B. Secret enregistré mais session non vérifiée ➜ /auth/2fa
		else if (session && !session.twoFactorVerified) {
			if (!event.url.pathname.startsWith('/auth/2fa')) {
				throw redirect(302, '/auth/2fa');
			}
		}
	}

	/* 4. Exemple : page settings accessible seulement connecté */
	if (event.url.pathname.startsWith('/auth/settings') && !user) {
		throw redirect(302, '/auth/login');
	}

	return resolve(event);
};

/* -------------------------------------------------------------------------- */
/*  Chaîne finale                                                             */
/* -------------------------------------------------------------------------- */

export const handle: Handle = sequence(devtoolsGuard, cookieGuard, rateLimit, authHandle);

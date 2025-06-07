// -----------------------------------------------------------------------------
// hooks.server.ts — Rate-limit + Auth + pendingOrder + DevTools + Email guards
// -----------------------------------------------------------------------------

import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';

import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import { auth } from '$lib/lucia';

import { createPendingOrder, findPendingOrder } from '$lib/prisma/order/prendingOrder';
import { getUserByIdPrisma } from '$lib/prisma/user/user';

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
	log('Rate-limit OK', ip);
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
/*  Auth (Lucia v3) – avec enrichissement utilisateur                         */
/* -------------------------------------------------------------------------- */

const authHandle: Handle = async ({ event, resolve }) => {
	/* 1. Debug : header cookie brut */
	log('Cookie header reçu ➜', event.request.headers.get('cookie') ?? '(none)');

	/* 2. Récupération du SID */
	const sid = event.cookies.get(auth.sessionCookieName);
	log('Lucia attend ➜', auth.sessionCookieName, '| valeur ➜', sid ?? '(undefined)');

	let session: import('lucia').Session | null = null;
	let user: import('lucia').User | null = null;

	if (sid) {
		/* 3. Validation côté Lucia */
		const res = await auth.validateSession(sid);
		session = res.session;
		user = res.user;
		log('validateSession ➜', res);

		/* 3.1  Rafraîchissement de l’utilisateur depuis la BDD
		       → on récupère les colonnes manquantes (emailVerified, 2FA, etc.) */
		if (user) {
			const fresh = await getUserByIdPrisma(user.id);
			if (fresh) {
				user = {
					...user,
					emailVerified: fresh.emailVerified,
					registered2FA: fresh.totpKey !== null,
					isMfaEnabled: fresh.isMfaEnabled,
					role: fresh.role
				};
			}
		}

		/* 3.2  Rotation du cookie si session fraîche */
		if (session?.fresh) {
			const c = auth.createSessionCookie(session.id);
			event.cookies.set(c.name, c.value, { path: '/', ...c.attributes });
		}

		/* 3.3  Session invalide → blank cookie */
		if (!session) {
			const blank = auth.createBlankSessionCookie();
			event.cookies.set(blank.name, blank.value, { path: '/', ...blank.attributes });
		}
	} else {
		log('Aucun SID trouvé ➜ utilisateur anonyme');
	}

	/* 4. locals enrichis */
	event.locals = {
		...event.locals,
		session,
		user,
		role: user?.role ?? null,
		isMfaEnabled: user?.isMfaEnabled ?? false,
		pendingOrder: user
			? ((await findPendingOrder(user.id)) ?? (await createPendingOrder(user.id)))
			: null
	};

	log('locals.user ➜', user ? `${user.id} | emailVerified=${user.emailVerified}` : null);
	log('locals.session ➜', session?.id ?? null);

	/* 5. Ex. : verrou access settings (redir. centralisée si tu veux) */
	if (event.url.pathname.startsWith('/auth/settings') && !user) {
		throw redirect(302, '/auth/login');
	}

	return resolve(event);
};

/* -------------------------------------------------------------------------- */
/*  Chaîne finale                                                             */
/* -------------------------------------------------------------------------- */

export const handle: Handle = sequence(devtoolsGuard, cookieGuard, rateLimit, authHandle);

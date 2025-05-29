// -----------------------------------------------------------------------------
// hooks.server.ts — Rate-limit + Auth + “pending order” + DevTools + Email guards
// -----------------------------------------------------------------------------

import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import { auth } from '$lib/lucia';
import { createPendingOrder, findPendingOrder } from '$lib/prisma/order/prendingOrder';

/* -------------------------------------------------------------------------- */
/*  Utils                                                                     */
/* -------------------------------------------------------------------------- */

/** Petit helper de log — préfixé pour filtrer facilement dans la console */
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
/*  Auth (Lucia v3)                                                           */
/* -------------------------------------------------------------------------- */

const authHandle: Handle = async ({ event, resolve }) => {
	const sid = event.cookies.get(auth.sessionCookieName);

	let session: import('lucia').Session | null = null;
	let user: import('lucia').User | null = null;

	if (sid) {
		const res = await auth.validateSession(sid);
		session = res.session;
		user = res.user;

		if (session && session.fresh) {
			const c = auth.createSessionCookie(session.id);
			event.cookies.set(c.name, c.value, { path: '/', ...c.attributes });
		}

		if (!session) {
			const blank = auth.createBlankSessionCookie();
			event.cookies.set(blank.name, blank.value, { path: '/', ...blank.attributes });
		}
	}

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

	log('Incoming request', event.url.pathname, '| session id =', session?.id ?? '∅');
	log('locals', {
		user: user?.id ?? null,
		role: event.locals.role,
		pendingOrder: !!event.locals.pendingOrder
	});

	// 👇 Redirection automatique si l’email est déjà vérifié et qu’on accède encore à /auth/verify-email
	if (user?.emailVerified && event.url.pathname === '/auth/verify-email') {
		log('Email déjà vérifié → redirect to /auth/');
		throw redirect(302, '/auth/');
	}

	return resolve(event);
};

/* -------------------------------------------------------------------------- */
/*  Chaîne finale                                                             */
/* -------------------------------------------------------------------------- */

export const handle: Handle = sequence(devtoolsGuard, cookieGuard, rateLimit, authHandle);

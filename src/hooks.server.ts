// -----------------------------------------------------------------------------
// hooks.server.ts — Rate-limit + Auth + “pending order” + DevTools guard
// -----------------------------------------------------------------------------

import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import { auth } from '$lib/lucia';
import { createPendingOrder, findPendingOrder } from '$lib/prisma/order/prendingOrder';

/* -------- Guard pour les requêtes DevTools Chrome -------- */
const devtoolsGuard: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/.well-known/appspecific/')) {
		return new Response(null, { status: 204 });
	}
	return resolve(event);
};

/* -------- Rate-limit -------- */
const bucket = new RefillingTokenBucket<string>(100, 1);
function clientIP(event: Parameters<Handle>[0]['event']): string {
	const xff = event.request.headers.get('x-forwarded-for');
	if (xff) return xff.split(',')[0]!.trim();
	try {
		return event.getClientAddress();
	} catch {
		return '127.0.0.1';
	}
}
const rateLimit: Handle = async ({ event, resolve }) => {
	if (!bucket.consume(clientIP(event), 1))
		return new Response('Too many requests', { status: 429 });
	return resolve(event);
};

/* -------- Cookie guard -------- */
const cookieGuard: Handle = async ({ event, resolve }) => {
	if (/[^\u0020-\u007E]/.test(event.request.headers.get('cookie') ?? ''))
		return new Response('Bad Cookie', { status: 400 });
	return resolve(event);
};

/* -------- Auth (Lucia v3) -------- */
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
			event.cookies.set(c.name, c.value, { path: '.', ...c.attributes });
		}
		if (!session) {
			const blank = auth.createBlankSessionCookie();
			event.cookies.set(blank.name, blank.value, { path: '.', ...blank.attributes });
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

	return resolve(event);
};

/* -------- Chaîne finale -------- */
export const handle: Handle = sequence(devtoolsGuard, cookieGuard, rateLimit, authHandle);

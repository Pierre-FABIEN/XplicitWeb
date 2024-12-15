import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import {
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie
} from '$lib/lucia/session';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

// Rate limiting setup
const bucket = new RefillingTokenBucket<string>(100, 1);

const rateLimitHandle: Handle = async ({ event, resolve }) => {
	const clientIP = event.request.headers.get('X-Forwarded-For') ?? '';
	if (!bucket.consume(clientIP, 1)) {
		return new Response('Too many requests', { status: 429 });
	}
	return resolve(event);
};

// Authentication setup
const authHandle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session') ?? null;

	if (!token) {
		// Pas de token, utilisateur non connecté
		event.locals.user = null;
		event.locals.session = null;
		event.locals.role = null; // Définit le rôle comme null pour les utilisateurs non authentifiés
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);

	if (session) {
		// Prolonge la durée de vie du cookie de session
		setSessionTokenCookie(event, token, session.expiresAt);

		// Ajoute les informations utilisateur et le rôle dans les locaux
		event.locals.session = session;
		event.locals.user = user;
		event.locals.role = user.role; // Stocke directement le rôle depuis le user
	} else {
		// Token invalide ou expiré
		deleteSessionTokenCookie(event);
		event.locals.session = null;
		event.locals.user = null;
		event.locals.role = null; // Définit le rôle comme null
	}

	return resolve(event);
};

// Combined handle
export const handle = sequence(rateLimitHandle, authHandle);

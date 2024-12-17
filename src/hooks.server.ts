import { RefillingTokenBucket } from '$lib/lucia/rate-limit';
import {
	validateSessionToken,
	setSessionTokenCookie,
	deleteSessionTokenCookie
} from '$lib/lucia/session';
import { sequence } from '@sveltejs/kit/hooks';
import { prisma } from '$lib/server'; // Prisma pour accéder à la BDD
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

// Authentication and pending order setup
const authHandle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session') ?? null;

	// Initialisation des locaux
	event.locals.session = null;
	event.locals.user = null;
	event.locals.role = null;
	event.locals.pendingOrder = null;

	if (!token) {
		// Pas de token, utilisateur non connecté
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(token);

	if (session) {
		// Prolonge la durée de vie du cookie
		setSessionTokenCookie(event, token, session.expiresAt);

		// Mettre à jour les informations locales
		event.locals.session = session;
		event.locals.user = user;
		event.locals.role = user.role;

		// Récupérer ou créer la commande en attente
		let pendingOrder = await prisma.order.findFirst({
			where: {
				userId: user.id,
				status: 'PENDING'
			},
			include: {
				items: {
					include: {
						product: true
					}
				}
			}
		});

		if (!pendingOrder) {
			pendingOrder = await prisma.order.create({
				data: {
					userId: user.id,
					status: 'PENDING'
				}
			});
		}

		event.locals.pendingOrder = pendingOrder;
	} else {
		// Token invalide ou expiré
		deleteSessionTokenCookie(event);
	}

	return resolve(event);
};

// Combined handle
export const handle = sequence(rateLimitHandle, authHandle);

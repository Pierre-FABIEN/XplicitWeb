import { prisma } from '$lib/server';
import { ObjectId } from 'mongodb'; // Import ObjectId pour MongoDB
import type { RequestEvent } from '@sveltejs/kit';
import type { User } from './user';

export interface SessionFlags {
	twoFactorVerified: boolean;
}

export interface Session extends SessionFlags {
	id: string;
	expiresAt: Date;
	userId: string;
	oauthProvider?: string;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };

// Génère un token de session (identifiant MongoDB valide)
export function generateSessionToken(): string {
	return new ObjectId().toString(); // Génère un ObjectId valide
}

// Crée une nouvelle session
export async function createSession(
	token: string,
	userId: string,
	flags: SessionFlags,
	oauthProvider?: string
): Promise<Session> {
	// Vérifie que userId est un ObjectId valide
	if (!ObjectId.isValid(userId)) {
		throw new Error('Invalid user ID format');
	}

	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // Expiration dans 30 jours

	try {
		const session = await prisma.session.create({
			data: {
				id: token,
				userId, // MongoDB ObjectId
				expiresAt,
				twoFactorVerified: flags.twoFactorVerified,
				oauthProvider
			}
		});
		return session;
	} catch (error) {
		console.error('Erreur lors de la création de la session :', error);
		throw new Error('Erreur lors de la création de la session.');
	}
}

// Valide le token de session
export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	try {
		const result = await prisma.session.findUnique({
			where: { id: token },
			include: { user: true }
		});

		if (!result) {
			return { session: null, user: null };
		}

		// Vérifie l'expiration de la session
		if (Date.now() >= result.expiresAt.getTime()) {
			await prisma.session.delete({ where: { id: token } });
			return { session: null, user: null };
		}

		// Prolonge la session si elle est proche de l'expiration
		if (Date.now() >= result.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
			const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
			await prisma.session.update({
				where: { id: token },
				data: { expiresAt: newExpiresAt }
			});
			result.expiresAt = newExpiresAt;
		}

		const session: Session = {
			id: result.id,
			userId: result.userId,
			expiresAt: result.expiresAt,
			twoFactorVerified: result.twoFactorVerified,
			oauthProvider: result.oauthProvider
		};

		const user: User = {
			id: result.user.id,
			email: result.user.email,
			username: result.user.username,
			emailVerified: result.user.emailVerified,
			registered2FA: result.user.totpKey !== null,
			googleId: result.user.googleId,
			name: result.user.name,
			picture: result.user.picture
		};

		return { session, user };
	} catch (error) {
		console.error('Erreur lors de la validation de la session :', error);
		return { session: null, user: null };
	}
}

// Invalide une session spécifique
export async function invalidateSession(sessionId: string): Promise<void> {
	try {
		await prisma.session.delete({ where: { id: sessionId } });
	} catch (error) {
		console.warn("Erreur lors de l'invalidation de la session :", error.message);
	}
}

// Invalide toutes les sessions d'un utilisateur
export async function invalidateUserSessions(userId: string): Promise<void> {
	if (!ObjectId.isValid(userId)) {
		throw new Error('Invalid user ID format');
	}

	try {
		await prisma.session.deleteMany({ where: { userId } });
	} catch (error) {
		console.warn("Erreur lors de l'invalidation des sessions de l'utilisateur :", error.message);
	}
}

// Définit le cookie du token de session
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('session', token, {
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		expires: expiresAt
	});
}

// Supprime le cookie du token de session
export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set('session', '', {
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		maxAge: 0
	});
}

// Marque la session comme vérifiée pour la 2FA
export async function setSessionAs2FAVerified(sessionId: string): Promise<void> {
	await prisma.session.update({
		where: { id: sessionId },
		data: { twoFactorVerified: true }
	});
}

// Gestion des sessions OAuth pour Google
export async function handleGoogleOAuth(
	event: RequestEvent,
	googleId: string,
	email: string,
	name: string,
	picture: string
): Promise<SessionValidationResult> {
	let user = await prisma.user.findUnique({ where: { googleId } });

	if (!user) {
		user = await prisma.user.create({
			data: {
				googleId,
				email,
				name,
				picture,
				emailVerified: true
			}
		});
	}

	const token = generateSessionToken();
	const session = await createSession(token, user.id, { twoFactorVerified: false }, 'google');
	setSessionTokenCookie(event, token, session.expiresAt);

	return { session, user };
}

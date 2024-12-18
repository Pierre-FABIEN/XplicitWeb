import { generateRandomOTP } from './utils';
import { ObjectId } from 'mongodb'; // Import ObjectId pour les identifiants MongoDB
import type { RequestEvent } from '@sveltejs/kit';
import type { User } from './user';
import {
	createPasswordResetSessionPrisma,
	deletePasswordResetSession,
	findPasswordResetSession
} from '$lib/prisma/passwordResetSession/passwordResetSession';

export interface PasswordResetSession {
	id: string;
	userId: string;
	email: string;
	expiresAt: Date;
	code: string;
	emailVerified: boolean;
	twoFactorVerified: boolean;
}

export type PasswordResetSessionValidationResult =
	| { session: PasswordResetSession; user: User }
	| { session: null; user: null };

// Crée une session de réinitialisation de mot de passe
export async function createPasswordResetSession(
	userId: string,
	email: string
): Promise<PasswordResetSession> {
	// Génère un nouvel identifiant MongoDB pour la session
	const sessionId = new ObjectId().toString();

	// Crée une nouvelle session
	const session: PasswordResetSession = {
		id: sessionId,
		userId,
		email,
		expiresAt: new Date(Date.now() + 1000 * 60 * 10), // Expire dans 10 minutes
		code: generateRandomOTP(),
		emailVerified: false,
		twoFactorVerified: false
	};

	// Ajoutez les champs dans la requête Prisma
	await createPasswordResetSessionPrisma(session);

	return session;
}

// Valide le token de session de réinitialisation
export async function validatePasswordResetSessionToken(
	token: string
): Promise<PasswordResetSessionValidationResult> {
	if (!ObjectId.isValid(token)) {
		throw new Error('Invalid session token format');
	}

	const sessionId = token; // L'identifiant est déjà valide en tant qu'ObjectId
	const result = await findPasswordResetSession(sessionId);

	if (!result || Date.now() >= result.expiresAt.getTime()) {
		await deletePasswordResetSession(sessionId);
		return { session: null, user: null };
	}

	const session: PasswordResetSession = {
		id: result.id,
		userId: result.userId,
		email: result.email,
		code: result.code,
		expiresAt: result.expiresAt,
		emailVerified: result.emailVerified,
		twoFactorVerified: result.twoFactorVerified
	};

	const user: User = {
		id: result.user.id,
		email: result.user.email,
		username: result.user.username,
		emailVerified: result.user.emailVerified,
		registered2FA: result.user.totpKey !== null
	};

	return { session, user };
}

// Valide la requête de session de réinitialisation à partir des cookies
export async function validatePasswordResetSessionRequest(
	event: RequestEvent
): Promise<PasswordResetSessionValidationResult> {
	const token = event.cookies.get('password_reset_session') ?? null;
	if (!token || !ObjectId.isValid(token)) {
		return { session: null, user: null };
	}
	const result = await validatePasswordResetSessionToken(token);
	if (result.session === null) {
		deletePasswordResetSessionTokenCookie(event);
	}
	return result;
}

// Définit le cookie de session de réinitialisation de mot de passe
export function setPasswordResetSessionTokenCookie(
	event: RequestEvent,
	token: string,
	expiresAt: Date
): void {
	event.cookies.set('password_reset_session', token, {
		expires: expiresAt,
		sameSite: 'lax',
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD
	});
}

// Supprime le cookie de session de réinitialisation de mot de passe
export function deletePasswordResetSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set('password_reset_session', '', {
		maxAge: 0,
		sameSite: 'lax',
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD
	});
}

// Envoie un email de réinitialisation de mot de passe
export function sendPasswordResetEmail(email: string, code: string): void {
	console.log(`To ${email}: Your reset code is ${code}`);
}

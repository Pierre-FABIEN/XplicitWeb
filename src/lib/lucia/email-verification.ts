import { prisma } from '$lib/server';
import { generateRandomOTP } from './utils';
import { ExpiringTokenBucket } from './rate-limit';
import { ObjectId } from 'mongodb'; // Import de ObjectId
import type { RequestEvent } from '@sveltejs/kit';

export interface EmailVerificationRequest {
	id: string;
	userId: string;
	code: string;
	email: string;
	expiresAt: Date;
}

// Récupère une requête de vérification d'email pour un utilisateur
export async function getUserEmailVerificationRequest(
	userId: string,
	id: string
): Promise<EmailVerificationRequest | null> {
	// Validation de l'identifiant
	if (!ObjectId.isValid(id)) {
		throw new Error('Invalid email verification request ID');
	}

	const request = await prisma.emailVerificationRequest.findUnique({
		where: {
			id,
			userId
		}
	});

	if (!request) {
		return null;
	}

	return {
		id: request.id,
		userId: request.userId,
		code: request.code,
		email: request.email,
		expiresAt: request.expiresAt
	};
}

// Crée une nouvelle requête de vérification d'email
export async function createEmailVerificationRequest(
	userId: string,
	email: string
): Promise<EmailVerificationRequest> {
	// Supprime les requêtes existantes pour éviter les doublons
	await deleteUserEmailVerificationRequest(userId);

	// Génération d'un nouvel identifiant
	const id = new ObjectId().toString(); // Utilisation d'un ObjectId valide
	const code = generateRandomOTP();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // Expiration dans 10 minutes

	const request = await prisma.emailVerificationRequest.create({
		data: {
			id,
			userId,
			code,
			email,
			expiresAt
		}
	});

	return {
		id: request.id,
		userId: request.userId,
		code: request.code,
		email: request.email,
		expiresAt: request.expiresAt
	};
}

// Supprime toutes les requêtes de vérification d'email pour un utilisateur
export async function deleteUserEmailVerificationRequest(userId: string): Promise<void> {
	await prisma.emailVerificationRequest.deleteMany({
		where: { userId }
	});
}

// Envoie un email de vérification
export function sendVerificationEmail(email: string, code: string): void {
	console.log(`To ${email}: Your verification code is ${code}`);
}

// Définit un cookie pour la requête de vérification d'email
export function setEmailVerificationRequestCookie(
	event: RequestEvent,
	request: EmailVerificationRequest
): void {
	event.cookies.set('email_verification', request.id, {
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		expires: request.expiresAt
	});
}

// Supprime le cookie de la requête de vérification d'email
export function deleteEmailVerificationRequestCookie(event: RequestEvent): void {
	event.cookies.set('email_verification', '', {
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		maxAge: 0
	});
}

// Récupère une requête de vérification d'email à partir des cookies
export async function getUserEmailVerificationRequestFromRequest(
	event: RequestEvent
): Promise<EmailVerificationRequest | null> {
	if (event.locals.user === null) {
		return null;
	}

	const id = event.cookies.get('email_verification') ?? null;
	if (!id || !ObjectId.isValid(id)) {
		return null;
	}

	const request = await getUserEmailVerificationRequest(event.locals.user.id, id);
	if (!request) {
		deleteEmailVerificationRequestCookie(event);
	}

	return request;
}

// Limiteur de taux pour l'envoi des emails de vérification
export const sendVerificationEmailBucket = new ExpiringTokenBucket<string>(3, 60 * 10);

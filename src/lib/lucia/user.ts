import { hashPassword } from './password';
import { encryptString } from './encryption';
import { generateRandomRecoveryCode } from './utils';
import { ObjectId } from 'mongodb';
import { decryptToString, decrypt, encrypt } from './encryption';
import {
	createUserInDatabase,
	createUserWithGoogleOAuth,
	getUserByEmailPrisma,
	getUserByGoogleIdPrisma,
	getUserPasswordHashPrisma,
	getUserRecoveryAndGoogleId,
	getUserTotpKey,
	updateUserEmail,
	updateUserPasswordPrisma,
	updateUserRecoveryCode,
	updateUserTotpKey,
	verifyUserEmail
} from '$lib/prisma/user/user';

// Interface utilisateur unifiée
export interface User {
	id: string;
	email: string;
	username: string | null;
	emailVerified: boolean;
	registered2FA: boolean;
	googleId?: string;
	name?: string;
	picture?: string;
}

// Crée un nouvel utilisateur avec email et mot de passe + 2FA
export async function createUser(email: string, username: string, password: string): Promise<User> {
	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedRecoveryCode = encryptString(recoveryCode);
	const encryptedRecoveryCodeString = Buffer.from(encryptedRecoveryCode).toString('base64');

	const user = await createUserInDatabase(
		email,
		username,
		passwordHash,
		encryptedRecoveryCodeString,
		'CLIENT',
		false,
		null,
		null
	);

	// Convertit null en undefined pour correspondre au type User
	return {
		...user,
		registered2FA: user.totpKey !== null,
		googleId: user.googleId ?? undefined,
		name: user.name ?? undefined,
		picture: user.picture ?? undefined
	};
}

// Vérifie si un ID est un ObjectId valide
function isValidObjectId(id: string): boolean {
	return ObjectId.isValid(id);
}

// Récupère un utilisateur par email
export async function getUserFromEmail(email: string): Promise<User | null> {
	const user = await getUserByEmailPrisma(email);
	return user ? { ...user, registered2FA: user.totpKey !== null } : null;
}

// Récupère un utilisateur par Google ID
export async function getUserFromGoogleId(googleId: string): Promise<User | null> {
	const user = await getUserByGoogleIdPrisma(googleId);
	return user ? { ...user, registered2FA: false } : null;
}

// Mise à jour du mot de passe utilisateur
export async function updateUserPassword(userId: string, password: string): Promise<void> {
	if (!isValidObjectId(userId)) {
		throw new Error('Invalid user ID format');
	}
	const passwordHash = await hashPassword(password);
	await updateUserPasswordPrisma(userId, passwordHash);
}

// Met à jour l'email et vérifie
export async function updateUserEmailAndSetEmailAsVerified(
	userId: string,
	email: string
): Promise<void> {
	if (!isValidObjectId(userId)) {
		throw new Error('Invalid user ID format');
	}
	await updateUserEmail(userId, email);
}

// Vérifie et met à jour la vérification de l'email
export async function setUserAsEmailVerifiedIfEmailMatches(
	userId: string,
	email: string
): Promise<boolean> {
	if (!isValidObjectId(userId)) {
		throw new Error('Invalid user ID format');
	}
	const result = await verifyUserEmail(userId, email);
	return result.count > 0;
}

// Réinitialise le code de récupération
export async function resetUserRecoveryCode(userId: string): Promise<string> {
	if (!isValidObjectId(userId)) {
		throw new Error('Invalid user ID format');
	}
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedCode = encryptString(recoveryCode);
	await updateUserRecoveryCode(userId, encryptedCode);
	return recoveryCode;
}

// Gestion des sessions OAuth
export async function handleGoogleOAuth(
	googleId: string,
	email: string,
	name: string,
	picture: string
): Promise<User> {
	let user = await getUserFromGoogleId(googleId);
	if (!user) {
		user = await createUserWithGoogleOAuth({
			googleId,
			email,
			name,
			picture
		});
	}
	return {
		...user,
		registered2FA: false // Assure que l'utilisateur n'a pas encore configuré la 2FA
	};
}
export async function updateUserTOTPKey(userId: string, key: Uint8Array): Promise<void> {
	const encryptedKey = encrypt(key);
	await updateUserTotpKey(userId, encryptedKey);
}

export async function getUserRecoverCode(userId: number): Promise<string> {
	const user = await getUserRecoveryAndGoogleId(userId);
	if (!user || user.googleId || !user.recoveryCode) {
		throw new Error('Recovery code not available for this user.');
	}
	return decryptToString(user.recoveryCode);
}

export async function getUserTOTPKey(userId: number): Promise<Uint8Array | null> {
	const user = await getUserTotpKey(userId);

	return user && user.totpKey ? decrypt(user.totpKey) : null;
}

export async function getUserPasswordHash(userId?: number, email?: string): Promise<string | null> {
	if (!userId && !email) throw new Error('Missing user identifier: userId or email is required.');
	const whereClause = userId ? { id: userId } : { email };
	const user = await getUserPasswordHashPrisma(whereClause);
	if (!user) throw new Error('User not found.');
	return user.passwordHash;
}

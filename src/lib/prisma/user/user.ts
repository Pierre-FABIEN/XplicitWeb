import { prisma } from '$lib/server';

export const findUserWithRecoveryCode = async (userId: string) => {
	return await prisma.user.findUnique({
		where: { id: userId },
		select: { recoveryCode: true }
	});
};

export const findUserByGoogleId = async (googleId: string) => {
	return await prisma.user.findUnique({
		where: { googleId }
	});
};

export const createUserWithGoogleOAuth = async (data: {
	googleId: string;
	email: string;
	name: string;
	picture: string;
}) => {
	return await prisma.user.create({
		data: {
			googleId: data.googleId,
			email: data.email,
			name: data.name,
			picture: data.picture,
			role: 'CLIENT',
			emailVerified: true,
			addresses: {
				create: []
			},
			orders: {
				create: []
			},
			transactions: {
				create: []
			}
		}
	});
};

export const createUserInDatabase = async (data: {
	email: string;
	username: string;
	passwordHash: string;
	recoveryCode: string;
	role: string;
	emailVerified: boolean;
	totpKey: string | null;
	googleId?: string;
}) => {
	return await prisma.user.create({
		data: {
			...data,
			// Relations initialisées à vide
			addresses: { create: [] },
			orders: { create: [] },
			transactions: { create: [] },
			sessions: { create: [] },
			emailVerificationRequests: { create: [] },
			passwordResetSessions: { create: [] }
		}
	});
};

export const getUserByEmailPrisma = async (email: string) => {
	return await prisma.user.findUnique({
		where: { email },
		select: {
			id: true,
			email: true,
			username: true,
			emailVerified: true,
			totpKey: true,
			googleId: true,
			name: true,
			picture: true
		}
	});
};

export const getUserByGoogleIdPrisma = async (googleId: string) => {
	return await prisma.user.findUnique({
		where: { googleId },
		select: {
			id: true,
			email: true,
			username: true,
			emailVerified: true,
			totpKey: true,
			googleId: true,
			name: true,
			picture: true
		}
	});
};

export const updateUserPasswordPrisma = async (userId: string, passwordHash: string) => {
	return await prisma.user.update({
		where: { id: userId },
		data: { passwordHash }
	});
};

export const updateUserEmail = async (userId: string, email: string) => {
	return await prisma.user.update({
		where: { id: userId },
		data: {
			email,
			emailVerified: true // Marque l'email comme vérifié
		}
	});
};

export const verifyUserEmail = async (userId: string, email: string) => {
	return await prisma.user.updateMany({
		where: {
			id: userId,
			email
		},
		data: {
			emailVerified: true
		}
	});
};

export const updateUserRecoveryCode = async (userId: string, encryptedCode: string) => {
	return await prisma.user.update({
		where: { id: userId },
		data: {
			recoveryCode: encryptedCode
		}
	});
};

export const updateUserTotpKey = async (userId: string, encryptedKey: string) => {
	return await prisma.user.update({
		where: { id: userId },
		data: {
			totpKey: encryptedKey
		}
	});
};

export const getUserTotpKey = async (
	userId: string
): Promise<{ totpKey: string | null } | null> => {
	return await prisma.user.findUnique({
		where: { id: userId },
		select: {
			totpKey: true // Récupère uniquement la clé TOTP
		}
	});
};

export const getUserPasswordHashPrisma = async (whereClause: {
	id?: string;
	email?: string;
}): Promise<{ passwordHash: string | null } | null> => {
	return await prisma.user.findUnique({
		where: whereClause,
		select: {
			passwordHash: true // Récupère uniquement le hash du mot de passe
		}
	});
};

export const getUserRecoveryAndGoogleId = async (
	userId: string
): Promise<{ recoveryCode: string | null; googleId: string | null } | null> => {
	return await prisma.user.findUnique({
		where: { id: userId },
		select: {
			recoveryCode: true,
			googleId: true
		}
	});
};

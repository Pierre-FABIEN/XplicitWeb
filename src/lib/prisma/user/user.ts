import { prisma } from '$lib/server';

export const findUserWithRecoveryCode = async (userId: string) => {
	return await prisma.user.findUnique({
		where: { id: userId },
		select: {
			recoveryCode: true
			// Ajoutez createdAt: true si nécessaire
		}
	});
};

export const findUserByGoogleId = async (googleId: string) => {
	return await prisma.user.findUnique({
		where: { googleId }
		// Ajoutez createdAt: true si nécessaire, par exemple :
		// select: { googleId: true, email: true, createdAt: true, ... }
	});
};

export const createUserWithGoogleOAuth = async (
	googleId: string,
	email: string,
	name: string,
	picture: string
) => {
	return await prisma.user.create({
		data: {
			googleId,
			email,
			name,
			picture,
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

export const createUserInDatabase = async (
	email: string,
	username: string,
	passwordHash: string,
	recoveryCode: string,
	role: string,
	emailVerified: boolean,
	totpKey: string | null,
	googleId?: string | null
) => {
	console.log('Creating user:', {
		email,
		username,
		passwordHash,
		recoveryCode,
		role,
		emailVerified,
		totpKey,
		googleId
	});

	return await prisma.user.create({
		data: {
			email,
			username,
			passwordHash,
			recoveryCode,
			role,
			emailVerified,
			totpKey,
			googleId,
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

// 1. On ajoute createdAt dans la sélection, car on retourne déjà un ensemble de champs utilisateur
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
			picture: true,
			isMfaEnabled: true,
			createdAt: true // Ajout de la date de création
		}
	});
};

// 2. Idem ici
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
			picture: true,
			createdAt: true // Ajout de la date de création
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
			// Ajoutez createdAt: true si nécessaire
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
			// Ajoutez createdAt: true si nécessaire
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
			// Ajoutez createdAt: true si nécessaire
		}
	});
};

export const getAllUsers = async () => {
	try {
		// Comme on utilise include, Prisma renvoie tous les champs scalaires, dont createdAt
		const users = await prisma.user.findMany({
			include: {
				addresses: true,
				orders: {
					include: {
						address: true
					}
				}
			}
		});

		return users;
	} catch (error) {
		console.error('Error fetching users:', error);
		throw new Error('Could not fetch users');
	} finally {
		await prisma.$disconnect();
	}
};

export async function deleteUser(userId: string) {
	try {
		// Désassocier les transactions de l'utilisateur
		await prisma.transaction.updateMany({
			where: { userId },
			data: { userId: null }
		});

		// Supprimer les commandes associées à l'utilisateur
		await prisma.order.deleteMany({
			where: { userId }
		});

		// Supprimer l'utilisateur
		await prisma.user.delete({
			where: { id: userId }
		});

		return { success: true };
	} catch (error) {
		throw new Error('Error deleting user: ' + error.message);
	}
}

export const updateUserRole = async (id: string, role: string) => {
	try {
		const updatedUser = await prisma.user.update({
			where: { id },
			data: { role }
		});
		console.log('User role updated:', updatedUser);
		return updatedUser;
	} catch (error) {
		console.error('Error updating user role:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
};

export async function getUsersById(userId: string) {
	// Ici, on récupère déjà tout par défaut
	return await prisma.user.findUnique({
		where: { id: userId }
	});
}

export async function getUserMFA(userId: string) {
	return await prisma.user.findUnique({
		where: { id: userId },
		select: { isMfaEnabled: true }
	});
}

export async function updateUserMFA(userId: string, data: { isMfaEnabled: boolean }) {
	return await prisma.user.update({
		where: { id: userId },
		data: { isMfaEnabled: data.isMfaEnabled }
	});
}

export async function latestUsers() {
	const users = await prisma.user.findMany({
		orderBy: { id: 'desc' },
		take: 5,
		select: {
			id: true,
			email: true,
			username: true,
			createdAt: true,
			totpKey: true,
			name: true
		}
	});

	// Sérialisation des champs nécessaires
	return users.map((user) => ({
		...user,
		createdAt: user.createdAt.toISOString(), // Date en ISO
		totpKey: user.totpKey ? Array.from(user.totpKey) : null // Uint8Array -> tableau
	}));
}

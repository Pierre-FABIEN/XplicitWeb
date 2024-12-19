import { PrismaClient } from '@prisma/client';
import { createCipheriv, randomBytes } from 'crypto';
import { decodeBase64 } from '@oslojs/encoding';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.ENCRYPTION_KEY) {
	throw new Error('ENCRYPTION_KEY is not defined in the environment variables.');
}

const key = decodeBase64(process.env.ENCRYPTION_KEY);
const prisma = new PrismaClient();

// Fonction de chiffrement
const encrypt = (data) => {
	const iv = randomBytes(16); // IV aléatoire
	const cipher = createCipheriv('aes-128-gcm', key, iv);
	const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, ciphertext, tag]);
};

// Fonction pour générer un code de récupération à 8 chiffres
const generateRecoveryCode = () => {
	return Math.floor(10000000 + Math.random() * 90000000).toString();
};

async function main() {
	console.log('Début du nettoyage et du peuplement de la base de données...');

	try {
		// Suppression des données existantes
		await prisma.$transaction([
			prisma.blogPostTag.deleteMany(),
			prisma.blogComment.deleteMany(),
			prisma.blogPost.deleteMany(),
			prisma.blogCategory.deleteMany(),
			prisma.author.deleteMany(),
			prisma.tag.deleteMany(),
			prisma.orderStatusHistory.deleteMany(),
			prisma.orderItem.deleteMany(),
			prisma.order.deleteMany(),
			prisma.address.deleteMany(),
			prisma.transaction.deleteMany(),
			prisma.productCategory.deleteMany(),
			prisma.product.deleteMany(),
			prisma.category.deleteMany(),
			prisma.session.deleteMany(),
			prisma.emailVerificationRequest.deleteMany(),
			prisma.passwordResetSession.deleteMany(),
			prisma.user.deleteMany()
		]);
		console.log('Toutes les données existantes ont été supprimées.');

		// Génération d'une clé TOTP aléatoire et chiffrement
		const totpKey = randomBytes(32);
		const encryptedTotpKey = encrypt(totpKey);

		// Convertir en Buffer pour Prisma
		const totpKeyBuffer = Buffer.from(encryptedTotpKey);

		const recoveryCode = generateRecoveryCode();
		const encryptedRecoveryCode = encrypt(Buffer.from(recoveryCode, 'utf-8')).toString('base64');

		console.log('Recovery Code (clair) :', recoveryCode);

		// Hash statique pour l'administrateur
		const passwordHash =
			'$argon2id$v=19$m=19456,t=2,p=1$2h/u9dvpXqr5PiPa19tlBA$ZUYyS8+NjOxTodAaDO1ez5oVToWRfKCQWRabAe8sIgk';

		// Création de l'utilisateur administrateur
		const adminUser = await prisma.user.create({
			data: {
				email: 'xplicitdrink.dev@gmail.com',
				username: 'Admin',
				passwordHash: passwordHash,
				emailVerified: true,
				role: 'ADMIN',
				name: 'Admin User',
				totpKey: totpKeyBuffer,
				recoveryCode: encryptedRecoveryCode,
				googleId: undefined,
				isMfaEnabled: true,
			}
		});

		console.log('Utilisateur administrateur créé :', adminUser);
		console.log('Clé TOTP (chiffrée) :', encryptedTotpKey.toString('base64'));
		console.log('Recovery Code (8 chiffres) :', recoveryCode);
	} catch (error) {
		console.error('Erreur lors du nettoyage et du peuplement :', error);
	} finally {
		await prisma.$disconnect();
	}
}

main();

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
		// Démarrage d'une transaction pour supprimer toutes les données
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
				isMfaEnabled: false
			}
		});

		console.log('Utilisateur administrateur créé :', adminUser);

		console.log('Nettoyage complet. Toutes les données existantes ont été supprimées.');

		// Création des catégories
		const categories = await prisma.category.createMany({
			data: [
				{ name: 'Beverages', createdAt: new Date(), updatedAt: new Date() },
				{ name: 'Snacks', createdAt: new Date(), updatedAt: new Date() },
				{ name: 'Desserts', createdAt: new Date(), updatedAt: new Date() }
			]
		});

		console.log(`${categories.count} catégories créées.`);

		// Récupération des catégories pour assignation aux produits
		const beverageCategory = await prisma.category.findFirst({ where: { name: 'Beverages' } });
		const snackCategory = await prisma.category.findFirst({ where: { name: 'Snacks' } });

		const products = [
			{
				_id: '676476b4f216ed08d1b0c692',
				name: 'Black',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 10,
				stock: 10,
				images: [
					'https://res-console.cloudinary.com/dedmxt8ta/thumbnails/v1/image/upload/v1734637235/cHJvZHVjdHMvdTU3MHMzeXE1c3JpYjR6enZ1d2U=/drilldown'
				],
				slug: 'black',
				createdAt: '2024-12-19T19:40:36.809+00:00',
				updatedAt: '2024-12-19T19:40:36.809+00:00',
				categories: beverageCategory?.id
			},
			{
				_id: '676476cdf216ed08d1b0c694',
				name: 'Dragon',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 10,
				stock: 10,
				images: [
					'https://res-console.cloudinary.com/dedmxt8ta/thumbnails/v1/image/upload/v1734637259/cHJvZHVjdHMvZWptcXR1a21kZmRvbWhienZxdWc=/drilldown'
				],
				slug: 'dragon',
				createdAt: '2024-12-19T19:41:01.519+00:00',
				updatedAt: '2024-12-19T19:41:01.519+00:00',
				categories: snackCategory?.id
			},
			{
				_id: '676476f6f216ed08d1b0c696',
				name: 'Fresh',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 10,
				stock: 10,
				images: [
					'https://res-console.cloudinary.com/dedmxt8ta/thumbnails/v1/image/upload/v1734637301/cHJvZHVjdHMvanA3cm5saWdsb2g4eGp4ZHcwMW0=/drilldown'
				],
				slug: 'fresh',
				createdAt: '2024-12-19T19:41:42.780+00:00',
				updatedAt: '2024-12-19T19:41:42.780+00:00',
				categories: beverageCategory?.id
			},
			{
				_id: '6764770cf216ed08d1b0c698',
				name: 'Wild',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 10,
				stock: 10,
				images: [
					'https://res.cloudinary.com/dedmxt8ta/image/upload/fl_preserve_transparency/v1734637323/products/rmwynwjtowb45p1ffsep.jpg?_s=public-apps'
				],
				slug: 'wild',
				createdAt: '2024-12-19T19:42:04.914+00:00',
				updatedAt: '2024-12-19T19:42:04.914+00:00',
				categories: snackCategory?.id
			}
		];

		for (const product of products) {
			const createdProduct = await prisma.product.create({
				data: {
					name: product.name,
					description: product.description,
					price: product.price,
					stock: product.stock,
					images: product.images,
					slug: product.slug,
					categories: {
						create: {
							categoryId: product.categories
						}
					},
					createdAt: new Date(),
					updatedAt: new Date()
				}
			});
			console.log(`Produit créé : ${createdProduct.name}`);
		}
		console.log('Produits fictifs créés avec succès.');
	} catch (error) {
		console.error('Erreur lors du nettoyage et du peuplement :', error);
	} finally {
		await prisma.$disconnect();
	}
}

main();

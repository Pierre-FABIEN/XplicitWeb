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
			// Supprimer les relations dépendantes
			prisma.blogPostTag.deleteMany(),
			prisma.blogComment.deleteMany(),
			prisma.blogPost.deleteMany(),
			prisma.blogCategory.deleteMany(),
			prisma.blogAuthor.deleteMany(),
			prisma.blogTag.deleteMany(),
			prisma.custom.deleteMany(), // Supprimer les personnalisations avant les OrderItem
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
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1736256236/black_ljftei.png'],
				slug: 'black',
				colorProduct: '#6554E3',
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
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1736256236/dragon_zwpsh4.png'],
				slug: 'dragon',
				colorProduct: '#EB3BE6',
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
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1736256236/wild_tftmjn.png'],
				slug: 'fresh',
				colorProduct: '#48DAE5',
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
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1736256236/fresh_goefxv.png'],
				slug: 'wild',
				colorProduct: '#5BEA53',
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
					colorProduct: product.colorProduct,
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

		// Création d'auteurs
		let author = await prisma.blogAuthor.findUnique({
			where: { id: adminUser.id }
		});

		if (!author) {
			author = await prisma.blogAuthor.create({
				data: {
					id: adminUser.id,
					name: adminUser.name
				}
			});
		}

		console.log('Auteur créé:', author);

		// Création de catégories de blog
		const technologyCategory = await prisma.blogCategory.create({
			data: {
				name: 'Technologie',
				description: 'Tout sur les dernières technologies et innovations.'
			}
		});

		const healthCategory = await prisma.blogCategory.create({
			data: {
				name: 'Santé',
				description: 'Conseils de santé, nouvelles découvertes médicales et plus encore.'
			}
		});

		console.log('Catégories créées:', technologyCategory, healthCategory);

		// Création de tags
		const tag1 = await prisma.blogTag.create({
			data: { name: 'Tech' }
		});

		const tag2 = await prisma.blogTag.create({
			data: { name: 'Health' }
		});

		console.log('Tags créés:', tag1, tag2);

		// Création d'articles de blog
		const post1 = await prisma.blogPost.create({
			data: {
				title: 'Le futur de la technologie',
				content: 'Contenu détaillé sur les prochaines grandes innovations.',
				slug: 'le-futur-de-la-technologie',
				published: true,
				author: {
					connect: { id: adminUser.id }
				},
				category: {
					connect: { id: technologyCategory.id }
				}
			}
		});

		// Association des tags aux articles
		await prisma.blogPostTag.create({
			data: {
				postId: post1.id,
				tagId: tag1.id
			}
		});

		const post2 = await prisma.blogPost.create({
			data: {
				title: 'Améliorer votre santé quotidienne',
				content: 'Des astuces pratiques pour vivre une vie plus saine.',
				slug: 'ameliorer-votre-sante-quotidienne',
				published: true,
				author: {
					connect: { id: adminUser.id }
				},
				category: {
					connect: { id: healthCategory.id }
				}
			}
		});

		// Association des tags aux articles
		await prisma.blogPostTag.create({
			data: {
				postId: post2.id,
				tagId: tag2.id
			}
		});

		console.log('Articles de blog créés:', post1, post2);
	} catch (error) {
		console.error('Erreur lors du nettoyage et du peuplement :', error);
	} finally {
		await prisma.$disconnect();
	}
}

main();

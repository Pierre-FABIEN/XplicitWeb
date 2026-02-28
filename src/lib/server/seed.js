import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {

	try {
		// Supprimer les données existantes dans le bon ordre
		await prisma.$transaction([
			prisma.postTag.deleteMany(),
			prisma.comment.deleteMany(),
			prisma.post.deleteMany(),
			prisma.author.deleteMany(),
			prisma.category.deleteMany(),
			prisma.tag.deleteMany(),
			prisma.chat.deleteMany(),
			prisma.user.deleteMany(),
			prisma.session.deleteMany(),
			prisma.product.deleteMany(),
			prisma.agence.deleteMany(),
			prisma.director.deleteMany()
		]);

		// Création des directeurs
		const directors = await createEntities(5, () =>
			prisma.director.create({
				data: {
					name: faker.person.fullName(),
					email: faker.internet.email(),
					age: faker.number.int({ min: 30, max: 60 }),
					isActive: faker.datatype.boolean()
				}
			})
		);

		// Création des agences
		const agencies = await createEntities(directors.length, (i) =>
			prisma.agence.create({
				data: {
					street: faker.location.streetAddress(),
					city: faker.location.city(),
					state: faker.location.state(),
					zip: faker.location.zipCode(),
					country: faker.location.country(),
					directorId: directors[i].id
				}
			})
		);

		// Création des produits
		const products = await createEntities(agencies.length, (i) =>
			prisma.product.create({
				data: {
					name: faker.commerce.productName(),
					stock: faker.number.int({ min: 10, max: 500 }),
					price: parseFloat(faker.commerce.price({ min: 10, max: 1000, dec: 2 })),
					agenceId: agencies[i].id
				}
			})
		);

		// Création des chats
		const chats = await createEntities(3, () =>
			prisma.chat.create({
				data: {
					client_id: faker.string.uuid(),
					color: faker.color.rgb(),
					message: faker.lorem.sentence(),
					avatar: faker.image.avatar()
				}
			})
		);

		// Création des catégories
		const categories = await createEntities(5, () =>
			prisma.category.create({
				data: {
					name: faker.lorem.word(),
					description: faker.lorem.sentence()
				}
			})
		);

		// Création des tags
		const tags = await createEntities(10, () =>
			prisma.tag.create({
				data: {
					name: faker.lorem.word()
				}
			})
		);

		// Création des auteurs
		const authors = await createEntities(5, () =>
			prisma.author.create({
				data: {
					name: faker.person.fullName()
				}
			})
		);

		// Création des articles
		const posts = await createEntities(10, () =>
			prisma.post.create({
				data: {
					title: faker.lorem.sentence(),
					content: faker.lorem.paragraphs(3),
					slug: faker.lorem.slug(),
					published: faker.datatype.boolean(),
					authorId: authors[faker.number.int({ min: 0, max: authors.length - 1 })].id,
					categoryId: categories[faker.number.int({ min: 0, max: categories.length - 1 })].id
				}
			})
		);

		// Création des commentaires
		const comments = await createEntities(posts.length * 3, (i) =>
			prisma.comment.create({
				data: {
					content: faker.lorem.sentence(),
					author: faker.person.fullName(),
					postId: posts[Math.floor(i / 3)].id
				}
			})
		);

		// Création des relations Post <-> Tag via PostTag
		const postTags = await createEntities(posts.length * 2, (i) =>
			prisma.postTag.create({
				data: {
					postId: posts[Math.floor(i / 2)].id,
					tagId: tags[faker.number.int({ min: 0, max: tags.length - 1 })].id
				}
			})
		);

	} catch (error) {
	} finally {
		await prisma.$disconnect();
	}
}

// Fonction utilitaire pour créer des entités
async function createEntities(count, createFn) {
	const results = [];
	for (let i = 0; i < count; i++) {
		results.push(await createFn(i));
	}
	return results;
}

main();

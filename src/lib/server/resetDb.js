import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Début du peuplement de la base de données...');

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
		console.log('Toutes les données existantes ont été supprimées.');
	} catch (error) {
		console.error('Erreur lors du peuplement :', error);
	} finally {
		await prisma.$disconnect();
	}
}

main();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Début du nettoyage et du peuplement de la base de données...');

	try {
		// Supprimer les données existantes dans le bon ordre pour respecter les contraintes des relations
		await prisma.$transaction([
			// Suppression des relations et des dépendances
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

		// Insérer de nouvelles données (optionnel)
		console.log('Insertion de données initiales...');

		console.log('Peuplement initial terminé.');
	} catch (error) {
		console.error('Erreur lors du nettoyage et du peuplement :', error);
	} finally {
		await prisma.$disconnect();
	}
}

main();

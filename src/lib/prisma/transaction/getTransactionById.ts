import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTransactionById = async (id: string) => {
	try {
		// Requête pour obtenir une transaction par ID
		const transaction = await prisma.transaction.findUnique({
			where: {
				id: id
			}
		});

		// Affiche la transaction récupérée
		console.log(transaction);

		return transaction;
	} catch (error) {
		console.error('Error retrieving transaction: ', error);
	} finally {
		// Déconnecte Prisma Client à la fin
		await prisma.$disconnect();
	}
};

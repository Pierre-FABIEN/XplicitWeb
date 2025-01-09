import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllTransactions = async () => {
	try {
		// Requête pour obtenir toutes les transactions
		const transactions = await prisma.transaction.findMany();

		// Affiche les transactions récupérées
		console.log(transactions);

		return transactions;
	} catch (error) {
		console.error('Error retrieving transactions: ', error);
	} finally {
		// Déconnecte Prisma Client à la fin
		await prisma.$disconnect();
	}
};

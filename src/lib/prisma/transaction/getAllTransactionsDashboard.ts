import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllTransactionsDashboard = async () => {
	try {
		// Requête pour obtenir les dates, montants, statuts et utilisateurs des transactions
		const transactions = await prisma.transaction.findMany({
			select: {
				createdAt: true,
				amount: true,
				status: true,
				app_user_email: true // Inclure l'email de l'utilisateur pour identifier les comptes
			}
		});

		// Affiche les transactions récupérées
		console.log(transactions, 'orfigodcfiguhoiuh');

		return transactions;
	} catch (error) {
		console.error('Error retrieving transactions: ', error);
	} finally {
		// Déconnecte Prisma Client à la fin
		await prisma.$disconnect();
	}
};

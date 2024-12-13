import { PrismaClient } from '@prisma/client';
import type { PageServerLoad } from './$types';

const prisma = new PrismaClient();
const ARTICLES_PER_PAGE = 6; // Nombre d'articles par page

export const load = (async ({ url }) => {
	// Récupère le numéro de page depuis les paramètres d'URL
	const page = parseInt(url.searchParams.get('page') || '1', 10);

	// Requête pour récupérer les articles nécessaires
	const [articles, totalArticles] = await Promise.all([
		prisma.post.findMany({
			skip: (page - 1) * ARTICLES_PER_PAGE,
			take: ARTICLES_PER_PAGE,
			include: {
				author: true,
				category: true,
				tags: {
					include: {
						tag: true
					}
				}
			}
		}),
		prisma.post.count() // Compte total des articles
	]);

	// Calcul du nombre total de pages
	const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);

	// Retourne les articles pour la page actuelle et les informations de pagination
	return {
		articles,
		pagination: {
			currentPage: page,
			totalPages
		}
	};
}) satisfies PageServerLoad;

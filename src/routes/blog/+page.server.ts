import type { PageServerLoad } from './$types';
import { getPaginatedPosts } from '$lib/prisma/posts/posts';

const ARTICLES_PER_PAGE = 6; // Nombre d'articles par page

export const load = (async ({ url }) => {
	// Récupère le numéro de page depuis les paramètres d'URL
	const page = parseInt(url.searchParams.get('page') || '1', 10);

	// Requête pour récupérer les articles nécessaires
	const { articles, totalArticles } = await getPaginatedPosts(page, ARTICLES_PER_PAGE);

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

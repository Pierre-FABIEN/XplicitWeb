import type { PageServerLoad } from './$types';
import { getArticleBySlug } from '$lib/prisma/posts/posts';

export const load = (async ({ params }) => {
	const { slug } = params;

	// Requête pour récupérer l'article par son slug
	const article = await getArticleBySlug(slug);

	// Si l'article n'existe pas, lever une erreur
	if (!article) {
		throw new Error('Article not found');
	}

	return {
		article
	};
}) satisfies PageServerLoad;

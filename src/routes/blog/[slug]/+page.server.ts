import { PrismaClient } from '@prisma/client';
import type { PageServerLoad } from './$types';

const prisma = new PrismaClient();

export const load = (async ({ params }) => {
	const { slug } = params;

	// Requête pour récupérer l'article par son slug
	const article = await prisma.post.findUnique({
		where: { slug },
		include: {
			author: true,
			category: true,
			tags: {
				include: {
					tag: true
				}
			}
		}
	});

	// Si l'article n'existe pas, lever une erreur
	if (!article) {
		throw new Error('Article not found');
	}

	return {
		article
	};
}) satisfies PageServerLoad;

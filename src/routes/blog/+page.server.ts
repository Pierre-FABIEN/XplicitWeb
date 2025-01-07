import { getAllPosts } from '$lib/prisma/BlogPost/BlogPost.js';
import type { PageServerLoad } from './$types';

export const load = (async () => {
	const posts = await getAllPosts();
	// Retourne les articles pour la page actuelle et les informations de pagination
	return {
		posts
	};
}) satisfies PageServerLoad;

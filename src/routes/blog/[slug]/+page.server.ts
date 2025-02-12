import { getPostBySlug } from '$lib/prisma/blogPost/blogPost';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { slug } = params;

	const post = await getPostBySlug(slug);
	return {
		post
	};
}) satisfies PageServerLoad;

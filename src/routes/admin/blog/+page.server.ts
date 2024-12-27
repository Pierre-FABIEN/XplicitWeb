// +page.server.ts
import type { PageServerLoad } from './$types';
import { type Actions } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { deleteBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema';

import { getPostById } from '$lib/prisma/BlogPost/BlogPost';
import { deletePost } from '$lib/prisma/BlogPost/BlogPost';
import { getAllPosts } from '$lib/prisma/BlogPost/BlogPost';

export const load: PageServerLoad = async () => {
	const BlogPost = await getAllPosts();
	const IdeleteBlogPostSchema = await superValidate(zod(deleteBlogPostSchema));

	return {
		IdeleteBlogPostSchema,
		BlogPost
	};
};

export const actions: Actions = {
	deleteBlogPost: async ({ request }) => {
		console.log('deletePost action initiated.', request);

		const formData = await request.formData();
		console.log(formData, 'form data');

		const form = await superValidate(formData, zod(deleteBlogPostSchema));
		const id = formData.get('id') as string;
		console.log('Received id:', id);
		if (!id) {
			console.log('No id provided');
			return fail(400, { message: 'Post ID is required' });
		}
		try {
			// Vérifier si la catégorie existe
			const existingPost = await getPostById(id);
			if (!existingPost) {
				console.log('Post not found:', id);
				return fail(400, { message: 'Post not found' });
			}
			console.log('Post found:', existingPost);

			// Supprimer la catégorie
			const deletedPost = await deletePost(id);
			console.log('Deleted category:', deletedPost);
			return message(form, 'Post deleted successfully');
		} catch (error) {
			console.error('Error deleting category:', error);
			return fail(500, { message: 'Post deletion failed' });
		}
	}
};

import type { PageServerLoad } from './$types';
import type { Actions } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { updateBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema';
import {
	getAllCategoriesPosts,
	getAllTagsPosts,
	getPostById,
	updatePost
} from '$lib/prisma/blogPost/blogPost';

export const load: PageServerLoad = async ({ params }) => {
	const blogPost = await getPostById(params.id);
	const AllCategoriesPost = await getAllCategoriesPosts();
	const AllTagsPost = await getAllTagsPosts();

	if (!blogPost) {
		return fail(404, { message: 'Blog post not found' });
	}

	const initialData = {
		id: blogPost.id,
		title: blogPost.title,
		content: blogPost.content,
		categoryId: blogPost.categoryId || undefined,
		tagIds: blogPost.tags.map((tag) => tag.id),
		published: blogPost.published,
		authorId: blogPost.authorId
	};

	const IupdateBlogPostSchema = await superValidate(initialData, zod(updateBlogPostSchema));

	return {
		AllTagsPost,
		AllCategoriesPost,
		IupdateBlogPostSchema
	};
};

export const actions: Actions = {
	updatePost: async ({ request }) => {
		const formData = await request.formData();
		console.log('Form data:', formData);

		const form = await superValidate(formData, zod(updateBlogPostSchema));
		console.log('Form data:', form);

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await updatePost(form.data);

			return message(form, 'Post updated successfully');
		} catch (error) {
			console.error('Error updating blog post:', error);
			return fail(500, { message: 'Failed to update post' });
		}
	}
};

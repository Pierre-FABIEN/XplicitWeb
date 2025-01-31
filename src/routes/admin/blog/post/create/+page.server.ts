import type { PageServerLoad } from './$types';
import type { Actions } from '@sveltejs/kit';
import { superValidate, fail, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { createBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema';

import { createPost, getAllCategoriesPosts, getAllTagsPosts } from '$lib/prisma/blogPost/blogPost';

import { slugify } from '$lib/prisma/slugify';

// Fonction de chargement
export const load: PageServerLoad = async () => {
	const AllCategoriesPost = await getAllCategoriesPosts();

	const AllTagsPost = await getAllTagsPosts();

	const IcreateBlogPostSchema = await superValidate(zod(createBlogPostSchema));

	return {
		AllCategoriesPost,
		AllTagsPost,
		IcreateBlogPostSchema
	};
};

export const actions: Actions = {
	createPost: async ({ request }) => {
		console.log('createPost action initiated.');

		const formData = await request.formData();
		console.log('Received form data:', formData);

		// Convertir formData en un objet plat
		const raw = Object.fromEntries(formData);

		// Convertir tagIds en tableau
		if (raw.tagIds) {
			raw.tagIds = raw.tagIds.split(',');
		}

		// Convertir le champ `published` en booléen
		raw.published = raw.published === 'on';

		// On passe ensuite "raw" au superValidate
		const form = await superValidate(raw, zod(createBlogPostSchema));
		console.log('Form validation result:', form);

		if (!form.valid) {
			console.log('Validation errors:', form.errors);
			return fail(400, { form });
		}

		// Ensuite vous utilisez form.data comme d’habitude
		const { title, content, authorId, published } = form.data;
		const slug = slugify(title);

		try {
			console.log('Creating new post with title:', form.data.title);
			await createPost(title, content, authorId, slug, published);
			return message(form, 'Post created successfully');
		} catch (error) {
			console.error('Error creating post:', error);
			return fail(500, { message: 'Post creation failed' });
		}
	}
};

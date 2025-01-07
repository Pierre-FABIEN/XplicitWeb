import { superValidate, message, fail } from 'sveltekit-superforms';
import { createBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema.js';
import { zod } from 'sveltekit-superforms/adapters';
import {
	createPost,
	getAllCategoriesPosts,
	getAllTagsPosts
} from '$lib/prisma/BlogPost/BlogPost.js';
import { upsertAuthor } from '$lib/prisma/authors/authors';
import { createCategory } from '$lib/prisma/categories/categories';

export const load = async () => {
	const form = await superValidate(zod(createBlogPostSchema));
	const category = await getAllCategoriesPosts();
	const tags = await getAllTagsPosts();

	return { form, category, tags };
};
export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		// Validation du formulaire
		const form = await superValidate(formData, zod(createBlogPostSchema));

		if (!form.valid) {
			console.error('Données invalides :', form.errors);
			return fail(400, { form, error: 'Données invalides' });
		}

		const { title, content, authorName, category, tags, published } = form.data;

		try {
			// Vérifier ou créer l'auteur
			const author = await upsertAuthor(authorName);
			// Gestion des catégories
			// Corriger le parsing du champ `category`

			const parsedCategories = JSON.parse(category).filter((category) => category.checked);

			const categoryConnect = await Promise.all(
				parsedCategories.map(async (category) => {
					if (!category.id) {
						const newCategory = await createCategory({
							name: category.name,
							description: category.description || 'Default description'
						});
						return { id: newCategory.id };
					}
					return { id: category.id };
				})
			);

			// Gestion des tags
			// Corriger le parsing du champ `tags`
			const parsedTags = JSON.parse(tags[0]).filter((tag) => tag.checked);

			const tagConnectOrCreate = parsedTags.map((tag) => ({
				where: { name: tag.name },
				create: { name: tag.name }
			}));

			// Créer le post avec les relations
			await createPost({
				title,
				content,
				published,
				authorId: author.id,
				categoryId: categoryConnect[0].id,
				tagConnectOrCreate
			});

			return message(form, 'Article créé avec succès !');
		} catch (error) {
			console.error('Erreur lors de la création de l’article :', error);
			return fail(500, { error: 'Une erreur s’est produite lors de la création de l’article.' });
		}
	}
};

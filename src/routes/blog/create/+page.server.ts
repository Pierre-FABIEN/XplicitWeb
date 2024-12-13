import { prisma } from '$lib/server';
import { superValidate, message, fail } from 'sveltekit-superforms';
import { createPostSchema } from '$lib/schema/blog/articleSchema.js';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const form = await superValidate(zod(createPostSchema));

	const category = await prisma.category.findMany({ select: { id: true, name: true } });
	const tags = await prisma.tag.findMany({ select: { id: true, name: true } });

	return { form, category, tags };
};
export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();

		// Validation du formulaire
		const form = await superValidate(formData, zod(createPostSchema));

		if (!form.valid) {
			console.error('Données invalides :', form.errors);
			return fail(400, { form, error: 'Données invalides' });
		}

		const { title, content, authorName, category, tags, published } = form.data;

		try {
			// Vérifier ou créer l'auteur
			const author = await prisma.author.upsert({
				where: { name: authorName },
				create: { name: authorName },
				update: {}
			});

			// Gestion des catégories
			// Corriger le parsing du champ `category`

			const parsedCategories = JSON.parse(category).filter((category) => category.checked);

			const categoryConnect = await Promise.all(
				parsedCategories.map(async (category) => {
					if (!category.id) {
						const newCategory = await prisma.category.create({ data: { name: category.name } });
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
			await prisma.post.create({
				data: {
					title,
					content,
					slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
					published,
					author: {
						connect: { id: author.id }
					},
					category: {
						connect: categoryConnect[0] // Associer une seule catégorie
					},
					tags: {
						create: tagConnectOrCreate.map((tag) => ({
							tag: {
								connectOrCreate: tag
							}
						}))
					}
				}
			});

			return message(form, 'Article créé avec succès !');
		} catch (error) {
			console.error('Erreur lors de la création de l’article :', error);
			return fail(500, { error: 'Une erreur s’est produite lors de la création de l’article.' });
		}
	}
};

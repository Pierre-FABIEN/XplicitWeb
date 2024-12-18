import { prisma } from '$lib/server';

export const getPaginatedPosts = async (page: number, ARTICLES_PER_PAGE: number) => {
	const [articles, totalArticles] = await Promise.all([
		prisma.post.findMany({
			skip: (page - 1) * ARTICLES_PER_PAGE,
			take: ARTICLES_PER_PAGE,
			include: {
				author: true,
				category: true,
				tags: {
					include: {
						tag: true
					}
				}
			}
		}),
		prisma.post.count()
	]);

	return { articles, totalArticles };
};

export const getArticleBySlug = async (slug: string) => {
	return await prisma.post.findUnique({
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
};

export const getAllCategories = async () => {
	return await prisma.category.findMany({
		select: {
			id: true,
			name: true
		}
	});
};

export const getAllTags = async () => {
	return await prisma.tag.findMany({
		select: {
			id: true,
			name: true
		}
	});
};

export const createPost = async ({
	title,
	content,
	published,
	slug,
	authorId,
	categoryId,
	tagConnectOrCreate,
	extraData = {}
}: {
	title: string;
	content: string;
	published: boolean;
	slug?: string;
	authorId: string;
	categoryId: string;
	tagConnectOrCreate: Array<{ where: { name: string }; create: { name: string } }>;
	extraData?: object;
}) => {
	return await prisma.post.create({
		data: {
			title,
			content,
			slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
			published,
			author: {
				connect: { id: authorId }
			},
			category: {
				connect: { id: categoryId }
			},
			tags: {
				create: tagConnectOrCreate.map((tag) => ({
					tag: {
						connectOrCreate: tag
					}
				}))
			},
			...extraData // Ajouter des champs supplémentaires si nécessaire
		}
	});
};

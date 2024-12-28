import { prisma } from '$lib/server';

export const getAllCategoriesPosts = async () => {
	try {
		const categories = await prisma.blogCategory.findMany({
			include: {
				posts: true
			}
		});
		return categories;
	} catch (error) {
		console.error('Error retrieving categories with posts:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const getAllTagsPosts = async () => {
	try {
		const tags = await prisma.blogTag.findMany({
			include: {
				posts: {
					include: {
						post: true
					}
				}
			}
		});
		return tags;
	} catch (error) {
		console.error('Error retrieving tags with posts:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const getPostById = async (id: string) => {
	try {
		const post = await prisma.blogPost.findUnique({
			where: { id },
			include: {
				author: true
			}
		});
		return post;
	} catch (error) {
		console.error('Error retrieving post:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const createPost = async (
	title: string,
	content: string,
	authorId: string,
	slug: string,
	published: boolean
) => {
	try {
		const post = await prisma.blogPost.create({
			data: {
				title,
				content,
				authorId,
				slug,
				published,
				createdAt: new Date()
			}
		});
		return post;
	} catch (error) {
		console.error('Error creating post:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const deletePost = async (id: string) => {
	console.log('Deleting post with id:', id);

	try {
		const post = await prisma.blogPost.delete({
			where: { id }
		});
		return post;
	} catch (error) {
		console.error('Error deleting post:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const getAllPosts = async () => {
	try {
		const posts = await prisma.blogPost.findMany({
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

		console.log('All posts:', posts);

		return posts;
	} catch (error) {
		console.error('Error retrieving posts:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const getPostBySlug = async (slug: string) => {
	try {
		const post = await prisma.blogPost.findUnique({
			where: { slug },
			include: {
				author: true
			}
		});
		return post;
	} catch (error) {
		console.error('Error retrieving post:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const updatePost = async (id: string, title: string, content: string) => {
	try {
		const post = await prisma.blogPost.update({
			where: { id },
			data: {
				title,
				content
			}
		});
		return post;
	} catch (error) {
		console.error('Error updating post:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const getTagById = async (id: string) => {
	try {
		return await prisma.blogTag.findUnique({
			where: { id }
		});
	} catch (error) {
		console.error('Error retrieving tag by ID:', error);
		throw error;
	}
};

export const deleteTag = async (id: string) => {
	try {
		// Début d'une transaction
		const result = await prisma.$transaction(async (prisma) => {
			// Supprimer d'abord toutes les entrées BlogPostTag liées au tag
			await prisma.blogPostTag.deleteMany({
				where: { tagId: id }
			});

			// Puis supprimer le tag
			return prisma.blogTag.delete({
				where: { id }
			});
		});

		console.log('Deleted tag and all related BlogPostTag entries:', result);
		return result;
	} catch (error) {
		console.error('Error deleting tag:', error);
		throw error;
	}
};

export const getCategoryById = async (id: string) => {
	try {
		return await prisma.blogCategory.findUnique({
			where: { id }
		});
	} catch (error) {
		console.error('Error retrieving category by ID:', error);
		throw error;
	}
};

export const deleteCategory = async (id: string) => {
	try {
		await prisma.$transaction(async (prisma) => {
			// Re-assigner les posts à `null` avant de supprimer la catégorie
			await prisma.blogPost.updateMany({
				where: { categoryId: id },
				data: { categoryId: null }
			});

			// Supprimer la catégorie
			return prisma.blogCategory.delete({
				where: { id }
			});
		});
		return 'Category deleted successfully';
	} catch (error) {
		console.error('Error deleting category:', error);
		throw error;
	}
};

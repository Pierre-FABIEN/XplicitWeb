import { prisma } from '$lib/server';

// POST

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

export const updatePost = async (data: {
	id: string;
	title: string;
	content: string;
	authorId: string;
	categoryId: string;
	tagIds: string[];
	published: boolean;
}) => {
	return prisma.blogPost.update({
		where: { id: data.id },
		data: {
			title: data.title,
			content: data.content,
			categoryId: data.categoryId,
			published: data.published,
			tags: {
				set: data.tagIds.map((tagId) => ({ id: tagId }))
			}
		}
	});
};

export const getPostById = async (id: string) => {
	try {
		const post = await prisma.blogPost.findUnique({
			where: { id },
			include: {
				author: true,
				tags: true
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

// CATEGORIES
// Récupérer une catégorie par ID
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

// Créer une nouvelle catégorie
export const createCategory = async (name?: string, description?: string) => {
	try {
		return await prisma.blogCategory.create({
			data: {
				name: name ?? '',
				description: description
			}
		});
	} catch (error) {
		console.error('Error creating category:', error);
		throw error;
	}
};

// Mettre à jour une catégorie existante
export const updateCategory = async (id: string, data: { name?: string; description?: string }) => {
	try {
		return await prisma.blogCategory.update({
			where: { id },
			data
		});
	} catch (error) {
		console.error('Error updating category:', error);
		throw error;
	}
};

// Supprimer une catégorie
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

// Récupérer toutes les catégories avec les posts associés
export const getAllCategoriesPosts = async () => {
	try {
		return await prisma.blogCategory.findMany({
			include: {
				posts: true
			}
		});
	} catch (error) {
		console.error('Error retrieving categories with posts:', error);
		throw error;
	}
};

// TAGS
// Récupérer un tag par ID
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

// Créer un nouveau tag
export const createTag = async (name: string) => {
	try {
		return await prisma.blogTag.create({
			data: {
				name
			}
		});
	} catch (error) {
		console.error('Error creating tag:', error);
		throw error;
	}
};

// Mettre à jour un tag existant
export const updateTag = async (id: string, data: { name?: string }) => {
	try {
		return await prisma.blogTag.update({
			where: { id },
			data
		});
	} catch (error) {
		console.error('Error updating tag:', error);
		throw error;
	}
};

// Supprimer un tag
export const deleteTag = async (id: string) => {
	try {
		await prisma.$transaction(async (prisma) => {
			// Supprimer toutes les entrées BlogPostTag liées au tag
			await prisma.blogPostTag.deleteMany({
				where: { tagId: id }
			});

			// Supprimer le tag
			return prisma.blogTag.delete({
				where: { id }
			});
		});
		return 'Tag deleted successfully';
	} catch (error) {
		console.error('Error deleting tag:', error);
		throw error;
	}
};

// Récupérer tous les tags avec les posts associés
export const getAllTagsPosts = async () => {
	try {
		return await prisma.blogTag.findMany({
			include: {
				posts: {
					include: {
						post: true
					}
				}
			}
		});
	} catch (error) {
		console.error('Error retrieving tags with posts:', error);
		throw error;
	}
};

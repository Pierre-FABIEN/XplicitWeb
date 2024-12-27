import { prisma } from '$lib/server';

export const getAllCategoriesPosts = async () => {
	try {
		const posts = await prisma.blogCategory.findMany({});
		return posts;
	} catch (error) {
		console.error('Error retrieving posts:', error);
	} finally {
		await prisma.$disconnect();
	}
};

export const getAllTagsPosts = async () => {
	try {
		const posts = await prisma.blogTag.findMany({});
		return posts;
	} catch (error) {
		console.error('Error retrieving posts:', error);
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
	slug: string
) => {
	try {
		const post = await prisma.blogPost.create({
			title,
			content,
			authorId,
			slug,
			createdAt: new Date()
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
				author: true
			}
		});
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

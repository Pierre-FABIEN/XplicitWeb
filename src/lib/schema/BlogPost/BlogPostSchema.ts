import { z } from 'zod';

// Schema for creating a blog post
const createBlogPostSchema = z.object({
	title: z
		.string()
		.min(1, { message: 'Title is required and cannot be empty' })
		.describe('The title of the blog post'),
	content: z
		.string()
		.min(1, { message: 'Content is required and cannot be empty' })
		.describe('The content of the blog post'),
	published: z.boolean().describe('Whether the blog post is published or not'),
	authorId: z.string(),
	categoryId: z.string().nullable().describe('The category ID for the blog post'),
	tagIds: z.array(z.string()).nullable().describe('Array of tag IDs associated with the blog post')
});

// Schema for updating a blog post
const updateBlogPostSchema = z.object({
	id: z.string(),
	title: z
		.string()
		.min(1, { message: 'Title is required and cannot be empty' })
		.describe('The title of the blog post'),
	content: z
		.string()
		.min(1, { message: 'Content is required and cannot be empty' })
		.describe('The content of the blog post'),
	published: z.boolean().describe('Whether the blog post is published or not'),
	authorId: z.string(),
	categoryId: z.string().optional().describe('The category ID for the blog post'),
	tagIds: z.array(z.string()).optional().describe('Array of tag IDs associated with the blog post')
});

// Schema for deleting a blog post
const deleteBlogPostSchema = z.object({
	id: z.string()
});

// Infer types from schemas
type CreateBlogPost = z.infer<typeof createBlogPostSchema>;
type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;
type DeleteBlogPost = z.infer<typeof deleteBlogPostSchema>;

// Exports
export { createBlogPostSchema, updateBlogPostSchema, deleteBlogPostSchema };
export type { CreateBlogPost, UpdateBlogPost, DeleteBlogPost };

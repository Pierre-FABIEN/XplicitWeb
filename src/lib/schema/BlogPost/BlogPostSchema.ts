import { z } from 'zod';

const createBlogPostSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	content: z.string().min(1, 'Content is required'),
	published: z.boolean(),
	authorId: z.string(),
	categoryId: z.string().optional(),
	tagIds: z.array(z.string()).optional()
});

const deleteBlogPostSchema = z.object({
	id: z.string()
});

type CreateBlogPost = z.infer<typeof createBlogPostSchema>;
type DeleteBlogPost = z.infer<typeof deleteBlogPostSchema>;

export { createBlogPostSchema, deleteBlogPostSchema };
export type { CreateBlogPost, DeleteBlogPost };

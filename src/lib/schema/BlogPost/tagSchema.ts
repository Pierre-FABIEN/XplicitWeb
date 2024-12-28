import { z } from 'zod';

// Schémas pour les Tags de Blog

const createBlogTagSchema = z.object({
	name: z.string().min(1, 'Tag name is required')
});

const deleteBlogTagSchema = z.object({
	id: z.string()
});

type CreateBlogTag = z.infer<typeof createBlogTagSchema>;
type DeleteBlogTag = z.infer<typeof deleteBlogTagSchema>;

export { createBlogTagSchema, deleteBlogTagSchema };
export type { CreateBlogTag, DeleteBlogTag };

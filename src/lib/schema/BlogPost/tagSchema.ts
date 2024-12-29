import { z } from 'zod';

// Schémas pour les Tags de Blog

const createBlogTagSchema = z.object({
	name: z.string().min(1, 'Tag name is required')
});

const updateBlogTagSchema = z.object({
	id: z.string(),
	name: z.string().min(1, 'Tag name is required')
});

const deleteBlogTagSchema = z.object({
	id: z.string()
});

type CreateBlogTag = z.infer<typeof createBlogTagSchema>;
type DeleteBlogTag = z.infer<typeof deleteBlogTagSchema>;
type UpdateBlogTag = z.infer<typeof updateBlogTagSchema>;

export { createBlogTagSchema, deleteBlogTagSchema, updateBlogTagSchema };
export type { CreateBlogTag, DeleteBlogTag, UpdateBlogTag };

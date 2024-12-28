import { z } from 'zod';

// Schémas pour les Catégories de Blog
const createBlogCategorySchema = z.object({
	name: z.string().min(1, 'Category name is required'),
	description: z.string().optional() // Description facultative
});

const deleteBlogCategorySchema = z.object({
	id: z.string()
});

// Déductions des types pour un usage en TypeScript
type CreateBlogCategory = z.infer<typeof createBlogCategorySchema>;
type DeleteBlogCategory = z.infer<typeof deleteBlogCategorySchema>;

// Exportation des schémas et des types
export { createBlogCategorySchema, deleteBlogCategorySchema };
export type { CreateBlogCategory, DeleteBlogCategory };

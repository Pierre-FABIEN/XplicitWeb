import { z } from 'zod';

// Schéma pour créer une catégorie
const createBlogCategorySchema = z.object({
	name: z.string().min(1, 'Category name is required'),
	description: z.string().optional()
});

// Schéma pour mettre à jour une catégorie
const updateBlogCategorySchema = z.object({
	id: z.string(),
	name: z.string().min(1, 'Category name is required'),
	description: z.string().optional()
});

// Schéma pour supprimer une catégorie
const deleteBlogCategorySchema = z.object({
	id: z.string()
});
// Déductions des types pour un usage en TypeScript
type CreateBlogCategory = z.infer<typeof createBlogCategorySchema>;
type DeleteBlogCategory = z.infer<typeof deleteBlogCategorySchema>;
type UpdateBlogCategory = z.infer<typeof updateBlogCategorySchema>;

// Exportation des schémas et des types
export { createBlogCategorySchema, deleteBlogCategorySchema, updateBlogCategorySchema };
export type { CreateBlogCategory, DeleteBlogCategory, UpdateBlogCategory };

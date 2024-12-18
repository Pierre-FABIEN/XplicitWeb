import { z } from 'zod';

// Schéma pour la création d'une catégorie
const createCategorySchema = z.object({
	name: z.string().min(3, 'Name is required')
});

// Schéma pour la mise à jour d'une catégorie
const updateCategorySchema = z.object({
	id: z.string(),
	name: z.string().min(3, 'Name is required')
});

// Schéma pour la suppression d'une catégorie
const deleteCategorySchema = z.object({
	id: z.string()
});

// Types TypeScript inférés des schémas Zod
type CreateCategory = z.infer<typeof createCategorySchema>;
type UpdateCategory = z.infer<typeof updateCategorySchema>;
type DeleteCategory = z.infer<typeof deleteCategorySchema>;

export { createCategorySchema, updateCategorySchema, deleteCategorySchema };
export type { CreateCategory, UpdateCategory, DeleteCategory };

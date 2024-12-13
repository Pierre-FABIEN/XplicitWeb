import { z } from 'zod';

// Common fields schema
const productFieldsSchema = {
	name: z.string().min(2, 'Product name is required'),
	stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
	price: z.number().min(0, 'Price must be a non-negative number'),
	createdAt: z.date().default(new Date()),
	agenceId: z.string().min(1, 'Agence ID is required')
};

// Create Product Schema
export const createProductSchema = z.object(productFieldsSchema);

// Update Product Schema
export const updateProductSchema = z.object({
	id: z.string().min(1).optional(),
	...z.object(productFieldsSchema).partial().shape
});

// Delete Product Schema
export const deleteProductSchema = z.object({
	id: z.string().min(1, 'ID is required').optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;

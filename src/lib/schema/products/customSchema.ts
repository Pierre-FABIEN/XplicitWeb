import { z } from 'zod';

const MAX_FILE_SIZE = 1024 * 1024 * 1; // 1MB
const ACCEPTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Schema for creating a custom field
const createCustomSchema = z.object({
	productId: z.string().min(1, 'Product ID is required'),
	image: z
		.instanceof(File)
		.refine(
			(file) => file.size <= MAX_FILE_SIZE,
			`Max image size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
		)
		.refine(
			(file) => ACCEPTED_IMAGE_MIME_TYPES.includes(file.type),
			'Only .jpg, .jpeg, .png, and .webp are supported.'
		),
	quantity: z
		.number()
		.min(1, 'Quantity must be at least 1')
		.max(100, 'Quantity must not exceed 100'),
	message: z.string().max(500, 'Message must not exceed 500 characters')
});

// Schema for updating a custom field
const updateCustomSchema = z.object({
	id: z.string().min(1, 'Custom ID is required'),
	productId: z.string().min(1, 'Product ID is required'),
	image: z
		.instanceof(File)
		.optional()
		.refine(
			(file) => !file || file.size <= MAX_FILE_SIZE,
			`Max image size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
		)
		.refine(
			(file) => !file || ACCEPTED_IMAGE_MIME_TYPES.includes(file.type),
			'Only .jpg, .jpeg, .png, and .webp are supported.'
		),
	quantity: z
		.number()
		.min(1, 'Quantity must be at least 1')
		.max(100, 'Quantity must not exceed 100')
		.optional(),
	message: z.string().max(500, 'Message must not exceed 500 characters').optional()
});

// Schema for deleting a custom field
const deleteCustomSchema = z.object({
	id: z.string().min(1, 'Custom ID is required')
});

// TypeScript types inferred from the Zod schemas
type CreateCustom = z.infer<typeof createCustomSchema>;
type UpdateCustom = z.infer<typeof updateCustomSchema>;
type DeleteCustom = z.infer<typeof deleteCustomSchema>;

export { createCustomSchema, updateCustomSchema, deleteCustomSchema };
export type { CreateCustom, UpdateCustom, DeleteCustom };
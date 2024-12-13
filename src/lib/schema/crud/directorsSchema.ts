import { z } from 'zod';

// Common fields schema
const directorFieldsSchema = {
	name: z.string().min(2, 'Name is required'),
	email: z.string().email('Invalid email address'),
	age: z.number().int().positive('Age must be a positive integer'),
	isActive: z.boolean().default(true),
	createdAt: z.date().default(new Date())
};

// Create Director Schema
export const createDirectorSchema = z.object(directorFieldsSchema);

// Update Director Schema
export const updateDirectorSchema = z.object({
	id: z.string().min(1).optional(),
	...z.object(directorFieldsSchema).partial().shape
});

// Delete Director Schema
export const deleteDirectorSchema = z.object({
	id: z.string().min(1, 'ID is required').optional()
});

export type CreateDirectorInput = z.infer<typeof createDirectorSchema>;
export type UpdateDirectorInput = z.infer<typeof updateDirectorSchema>;
export type DeleteDirectorInput = z.infer<typeof deleteDirectorSchema>;

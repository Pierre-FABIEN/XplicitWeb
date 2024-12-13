import { z } from 'zod';

// Common fields schema
const agenceFieldsSchema = {
	street: z.string().min(2, 'Street is required'),
	city: z.string().min(2, 'City is required'),
	state: z.string().min(2, 'State is required'),
	zip: z
		.string()
		.regex(/^\d+$/, 'ZIP code must contain only numbers')
		.min(5, 'ZIP code must be at least 5 digits long')
		.max(5, 'ZIP code must have 5 digits maximum'),
	country: z.string().min(2, 'Country is required'),
	directorId: z.string().min(1, 'User is required'),
	createdAt: z.date().default(new Date())
};

// Create Agence Schema
export const createAgenceSchema = z.object(agenceFieldsSchema);

// Update Agence Schema
export const updateAgenceSchema = z.object({
	id: z.string().min(1).optional(),
	...z.object(agenceFieldsSchema).partial().shape
});

// Delete Agence Schema
export const deleteAgenceSchema = z.object({
	id: z.string().min(1, 'ID is required').optional()
});

export type CreateAgenceInput = z.infer<typeof createAgenceSchema>;
export type UpdateAgenceInput = z.infer<typeof updateAgenceSchema>;
export type DeleteAgenceInput = z.infer<typeof deleteAgenceSchema>;

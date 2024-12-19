import { z } from 'zod';

// Schema for creating an Address
export const createAddressSchema = z.object({
	recipient: z.string().min(3, 'recipient is required'),
	street: z.string().min(3, 'Street is required'),
	city: z.string().min(3, 'City is required'),
	state: z.string().min(3, 'State is required'),
	zip: z.string().min(3, 'Zip is required'),
	country: z.string().min(3, 'Country is required'),
	userId: z.string()
});

export const updateAddressSchema = z.object({
	id: z.string(),
	recipient: z.string().min(3, 'Recipient is required and should be at least 3 characters long'),
	street: z.string().min(3, 'Street is required and should be at least 3 characters long'),
	city: z.string().min(3, 'City is required and should be at least 3 characters long'),
	state: z.string().min(2, 'State is required and should be at least 2 characters long'),
	zip: z.string().min(3, 'ZIP code is required and should be at least 3 characters long'),
	country: z.string().min(3, 'Country is required and should be at least 3 characters long')
});

// Schema for deleting an Address
export const deleteAddressSchema = z.object({
	id: z.string()
});

export type CreateAddressSchema = z.infer<typeof createAddressSchema>;
export type UpdateAddressSchema = z.infer<typeof updateAddressSchema>;
export type DeleteAddressSchema = z.infer<typeof deleteAddressSchema>;

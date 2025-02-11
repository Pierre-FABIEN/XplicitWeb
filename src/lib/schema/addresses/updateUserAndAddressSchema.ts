import { z } from 'zod';

// Schema for address validation
const addressSchema = z.object({
	id: z.string(),
	recipient: z.string().min(3, 'Recipient is required and should be at least 3 characters long'),
	street: z.string().min(3, 'Street is required and should be at least 3 characters long'),
	city: z.string().min(3, 'City is required and should be at least 3 characters long'),
	state: z.string().min(2, 'State is required and should be at least 2 characters long'),
	zip: z.string().min(3, 'ZIP code is required and should be at least 3 characters long'),
	country: z.string().min(3, 'Country is required and should be at least 3 characters long')
});

// Schema for user and address update validation
const updateUserAndAddressSchema = z.object({
	id: z.string(),
	role: z.string().min(1, 'Role is required'),
	isMfaEnabled: z.boolean(),
	passwordHash: z.string().nullable().optional(),
	addresses: z.array(addressSchema)
});

type UpdateUserAndAddress = z.infer<typeof updateUserAndAddressSchema>;

export { updateUserAndAddressSchema };
export type { UpdateUserAndAddress };

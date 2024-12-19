import { z } from 'zod';

// Schéma pour la mise à jour d'un utilisateur
const updateUserSchema = z.object({
	id: z.string(),
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email format'),
	role: z.string().min(1, 'Role is required')
});

// Schéma pour la suppression d'un utilisateur
const deleteUserSchema = z.object({
	id: z.string()
});

type UpdateUser = z.infer<typeof updateUserSchema>;
type DeleteUser = z.infer<typeof deleteUserSchema>;

export { updateUserSchema, deleteUserSchema };
export type { UpdateUser, DeleteUser };

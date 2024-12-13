import { z } from 'zod';

export const createPostSchema = z.object({
	authorName: z.string().nonempty("Le nom de l'auteur est obligatoire."), // Chaîne non vide
	category: z.array(z.string()).default([]), // Tableau de chaînes, par défaut vide
	content: z.string().nonempty('Le contenu est obligatoire.'), // Chaîne non vide
	published: z.boolean().default(false), // Booléen, par défaut false
	tags: z.array(z.string()).default([]), // Tableau de chaînes, par défaut vide
	title: z
		.string()
		.min(3, { message: 'Message cannot be empty' })
		.max(50, { message: 'Message cannot exceed 50 characters' })
});

export type Article = z.infer<typeof createPostSchema>;

import { prisma } from '$lib/server';

export const upsertAuthor = async (authorName: string) => {
	return await prisma.author.upsert({
		where: { name: authorName },
		create: { name: authorName },
		update: {} // Pas de mise à jour dans ce cas
	});
};

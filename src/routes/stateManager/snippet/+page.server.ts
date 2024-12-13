import { prisma } from '$lib/server';

export const load = async () => {
	const directors = await prisma.director.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			age: true,
			isActive: true,
			agencies: {
				select: {
					id: true,
					street: true,
					city: true,
					state: true,
					zip: true,
					country: true
				}
			}
		}
	});

	return {
		directors
	};
};

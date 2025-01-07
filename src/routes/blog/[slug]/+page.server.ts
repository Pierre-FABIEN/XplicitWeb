import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { slug } = params;

	return {};
}) satisfies PageServerLoad;

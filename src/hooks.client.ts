import type { HandleClientError } from '@sveltejs/kit';

// Intercepteur de fetch pour identifier l'URL exacte qui échoue
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
	const url = input instanceof Request ? input.url : String(input);
	try {
		const response = await originalFetch(input, init);
		return response;
	} catch (err) {
		// Log uniquement les erreurs réseau (pas les erreurs HTTP)
		if (err instanceof TypeError && err.message === 'Failed to fetch') {
			console.error('[Fetch Error] URL:', url, '| Error:', err.message);
		}
		throw err;
	}
};

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
	console.error('[SvelteKit Client Error]', {
		url: event.url.href,
		status,
		message,
		error: error instanceof Error ? error.message : error
	});

	return {
		message: message ?? 'Une erreur inattendue s\'est produite.'
	};
};

import type { HandleClientError, HandleFetch } from '@sveltejs/kit';

console.warn('[hooks.client] INITIALISATION', {
	url: window.location.href,
	pathname: window.location.pathname
});

// Intercepte TOUS les fetch pour logger les succès et les erreurs
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
	const url = input instanceof Request ? input.url : String(input);
	const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

	// Logger uniquement les requêtes SvelteKit internes (__data.json) et les API
	const isInteresting = url.includes('__data.json') || url.includes('/api/');

	if (isInteresting) {
		console.warn('[hooks.client/fetch] DÉBUT', { url, method });
	}

	try {
		const response = await originalFetch(input, init);

		if (isInteresting) {
			console.warn('[hooks.client/fetch] SUCCÈS', {
				url,
				status: response.status,
				ok: response.ok,
				contentType: response.headers.get('content-type')
			});
		}

		return response;
	} catch (err) {
		// TypeError: Failed to fetch = requête annulée ou réseau indisponible
		const errMsg = err instanceof Error ? err.message : String(err);
		console.error('[hooks.client/fetch] ERREUR', {
			url,
			method,
			error: errMsg,
			// "Failed to fetch" peut venir de : requête annulée par navigation,
			// service worker bloquant, ou serveur crash avant réponse
			cause: errMsg === 'Failed to fetch' ? 'Annulé/réseau/SW' : 'Autre'
		});
		throw err;
	}
};

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
	console.error('[hooks.client/handleError]', {
		url: event.url.href,
		status,
		message,
		error: error instanceof Error ? error.message : error,
		stack: error instanceof Error ? error.stack?.slice(0, 400) : undefined
	});

	return {
		message: message ?? "Une erreur inattendue s'est produite."
	};
};

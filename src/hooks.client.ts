import type { HandleClientError } from '@sveltejs/kit';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Fallback navigation — contourne le bug "Failed to fetch" sur __data.json */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Intercepte les fetches __data.json pour déclencher un rechargement complet
   dès le premier échec réseau. Le flag évite que les tentatives successives de
   SvelteKit s'annulent mutuellement (bug : 6 assignations location.href en
   cascade qui se cancellent toutes). */
let _navFallbackInProgress = false;

const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
	const url = input instanceof Request ? input.url : String(input);

	try {
		return await originalFetch(input, init);
	} catch (err) {
		const errMsg = err instanceof Error ? err.message : String(err);
		const isNavFetch = url.includes('__data.json');
		const isNetworkError = errMsg === 'Failed to fetch' || errMsg === 'Load failed';

		if (isNavFetch && isNetworkError && !_navFallbackInProgress) {
			_navFallbackInProgress = true;
			// Extraire le chemin cible : /atelier/__data.json?... → /atelier
			const targetPath = new URL(url).pathname.replace(/\/__data\.json$/, '') || '/';
			console.warn('[hooks.client] nav fallback →', targetPath);
			window.location.href = targetPath;
		}

		throw err;
	}
};

export const handleError: HandleClientError = async ({ error, event, status, message }) => {
	const errMsg = error instanceof Error ? error.message : String(error);
	const isNetworkError = errMsg === 'Failed to fetch' || errMsg === 'Load failed';

	if (!isNetworkError) {
		console.error('[hooks.client/handleError]', {
			url: event.url.href,
			status,
			message,
			error: errMsg,
			stack: error instanceof Error ? error.stack?.slice(0, 400) : undefined
		});
	}

	return {
		message: isNetworkError ? '' : (message ?? "Une erreur inattendue s'est produite.")
	};
};

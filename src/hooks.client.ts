import type { HandleClientError } from '@sveltejs/kit';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  DIAGNOSTIC NAVIGATION — à retirer une fois le bug identifié              */
/* ─────────────────────────────────────────────────────────────────────────── */

console.warn('[hooks.client] INITIALISATION', {
	url: window.location.href,
	pathname: window.location.pathname,
	origin: window.location.origin
});

/* 1. Capture tous les clics sur <a> avant tout autre listener (phase capture)
      → permet de voir si le clic atteint bien le DOM et si preventDefault
        a déjà été appelé par un autre listener (SmoothScrollBar, overlay…) */
document.addEventListener(
	'click',
	(e: MouseEvent) => {
		const anchor = (e.target as HTMLElement).closest('a');
		if (!anchor) return;
		console.warn('[hooks.client/click] CLIC <a> détecté', {
			href: anchor.getAttribute('href'),
			resolvedHref: anchor.href,
			defaultPrevented: e.defaultPrevented,
			composedPath: e.composedPath().slice(0, 5).map((n) => (n as HTMLElement).tagName ?? n),
			dataset: { ...anchor.dataset }
		});
	},
	true // capture — avant que SvelteKit ou tout autre listener ne voie l'événement
);

/* 2. Intercepte window.location.assign / replace / href = ...
      → confirme que la navigation programmatique est bien déclenchée */
(function patchLocation() {
	const originalAssign = window.location.assign.bind(window.location);
	const originalReplace = window.location.replace.bind(window.location);

	try {
		window.location.assign = function (url: string | URL) {
			console.warn('[hooks.client/location] assign() appelé', { url: String(url) });
			originalAssign(url);
		};
		window.location.replace = function (url: string | URL) {
			console.warn('[hooks.client/location] replace() appelé', { url: String(url) });
			originalReplace(url);
		};
	} catch {
		// Firefox/Safari peuvent refuser la réécriture de location — on ignore
	}

	/* Intercept href setter (non supporté partout, meilleur effort) */
	try {
		const desc = Object.getOwnPropertyDescriptor(window.location, 'href');
		if (!desc) {
			const proto = Object.getPrototypeOf(window.location);
			const protoDesc = Object.getOwnPropertyDescriptor(proto, 'href');
			if (protoDesc?.set) {
				const originalSet = protoDesc.set;
				Object.defineProperty(proto, 'href', {
					...protoDesc,
					set(url: string) {
						console.warn('[hooks.client/location] href = appelé', { url });
						originalSet.call(this, url);
					}
				});
			}
		}
	} catch {
		// Ignoré si le navigateur refuse (cross-origin, mode strict…)
	}
})();

/* 3. beforeunload — confirme que le browser démarre bien une navigation de page */
window.addEventListener('beforeunload', () => {
	console.warn('[hooks.client/beforeunload] PAGE SE DÉCHARGE', {
		href: window.location.href
	});
});

/* 4. popstate — navigation par historique (back/forward) */
window.addEventListener('popstate', (e) => {
	console.warn('[hooks.client/popstate] événement popstate', {
		href: window.location.href,
		state: e.state
	});
});

/* 5. Intercepte TOUS les fetch pour logger les requêtes SvelteKit et API */
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
	const url = input instanceof Request ? input.url : String(input);
	const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

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
		const errMsg = err instanceof Error ? err.message : String(err);
		console.error('[hooks.client/fetch] ERREUR', {
			url,
			method,
			error: errMsg,
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

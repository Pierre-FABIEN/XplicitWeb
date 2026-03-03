self.addEventListener('install', (event) => {
	// Service Worker installé — ne pas intercepter fetch pour laisser passer
	// les requêtes SvelteKit (__data.json, _app) et éviter "Failed to fetch" sur Vercel.
});

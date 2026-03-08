// Service worker de nettoyage — vide les caches et se désenregistre automatiquement.
// Objectif : supprimer tout ancien SW (et ses caches) qui interceptait les chunks
// _app/immutable/*.js et causait "Failed to fetch" après chaque déploiement.

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
	);
	// Prise de contrôle immédiate sans attendre l'expiration de l'ancien SW.
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((names) => Promise.all(names.map((name) => caches.delete(name))))
			.then(() => self.clients.claim())
			.then(() => self.registration.unregister())
	);
});

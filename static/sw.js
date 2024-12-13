self.addEventListener('install', (event) => {
	//console.log('Service Worker installé.');
});

self.addEventListener('fetch', (event) => {
	//console.log('Requête interceptée :', event.request.url);
	// Vous pouvez ajouter des logiques de mise en cache ou d'autres comportements ici.
});

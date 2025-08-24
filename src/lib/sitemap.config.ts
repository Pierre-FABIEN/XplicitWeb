// Configuration du sitemap
export const sitemapConfig = {
	// URL de base du site
	site: 'https://xplicitdrink.com', // Domaine XPLICITDRINK®
	
	// Routes à exclure du sitemap (routes privées, admin, auth)
	excludedRoutes: [
		'/auth',
		'/admin',
		'/checkout',
		'/sitemap.xml',
		'/api',
		'/+page.svelte' // Fichier technique
	],
	
	// Configuration des priorités et fréquences par type de route
	routeConfig: {
		'/': { priority: '1.0', changefreq: 'daily' },
		'/catalogue': { priority: '0.9', changefreq: 'weekly' },
		'/blog': { priority: '0.8', changefreq: 'weekly' },
		'/contact': { priority: '0.7', changefreq: 'monthly' },
		'/atelier': { priority: '0.8', changefreq: 'weekly' }
	},
	
	// Configuration par défaut pour les routes non configurées
	defaultConfig: {
		priority: '0.5',
		changefreq: 'weekly'
	}
};

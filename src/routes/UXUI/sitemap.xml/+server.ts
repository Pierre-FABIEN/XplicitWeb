// src/routes/sitemap.xml/+server.ts

import type { RequestHandler } from './$types';

const site = 'https://votredomaine.com';

// Importer toutes les pages Svelte automatiquement
const pages = import.meta.glob('../**/+page.svelte', { eager: true });

// Fonction pour extraire les chemins des fichiers
const extractPaths = () => {
	const excludedRoutes = ['/auth/login', '/sitemap.xml']; // Routes à exclure
	const paths: string[] = [];

	for (const path in pages) {
		// Extraire le chemin relatif
		let route = path.replace('../', '').replace('/+page.svelte', '');

		// Gérer les routes dynamiques (ex: [id])
		route = route.replace(/\[.*?\]/g, '');

		// Ajouter une barre oblique au début
		if (!route.startsWith('/')) {
			route = `/${route}`;
		}

		// Exclure les routes spécifiées
		if (!excludedRoutes.includes(route)) {
			// Gérer la route racine
			if (route === '/index') {
				paths.push('/');
			} else {
				paths.push(route);
			}
		}
	}

	return paths;
};

// Fonction pour générer le sitemap XML
const generateSitemap = (paths: string[]) => {
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
    ${paths
			.map(
				(path) => `
    <url>
        <loc>${site}${path}</loc>
        <changefreq>daily</changefreq>
        <priority>0.5</priority>
    </url>`
			)
			.join('')}
</urlset>`;
};

// Handler GET pour servir le sitemap
export const GET: RequestHandler = async () => {
	const paths = extractPaths();
	const body = generateSitemap(paths);
	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};

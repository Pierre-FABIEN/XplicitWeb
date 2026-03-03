import adapter from '@sveltejs/adapter-vercel';
import { VitePWA } from 'vite-plugin-pwa';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';


/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	
	plugins: [
		VitePWA({
			// Désactivé : le SW intercepte les chunks _app/immutable/*.js et provoque
			// "Failed to fetch" en navigation (surtout après déploiement, hashes changés).
			disable: true,
			manifest: {
				// les options pour votre manifeste
				name: 'Mon App SvelteKit PWA',
				short_name: 'SvelteKitPWA',
				description: 'Une démo de PWA avec SvelteKit et Vite',
				icons: [
					// Vos icônes pour la PWA
				]
				// ... d'autres options du manifeste
			},
			workbox: {
				// les options pour workbox
				swSrc: '/sw.js',
				// Ne pas cacher les requêtes SvelteKit (navigation, __data.json, _app)
				// pour éviter "Failed to fetch" lors de la navigation sur Vercel
				runtimeCaching: [
					{
						// Uniquement les assets statiques (images, fonts, css)
						urlPattern: /\.(?:css|png|jpg|jpeg|gif|ico|woff2?|svg|webp|avif)(\?.*)?$/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'static-assets'
						}
					}
				]
			}
		})
	],
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		
		alias: {
			// this will match a file
			$lib: 'src/lib',
			$components: 'src/lib/components',
			$server: 'src/lib/server',
			$store: 'src/lib/store',
			$shadcn: 'src/lib/components/shadcn/ui'
		}
	}
};

export default config;

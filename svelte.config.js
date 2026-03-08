import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';


/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			// Augmenter la durée max pour les connexions MongoDB (cold start)
			maxDuration: 30
		}),
		
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

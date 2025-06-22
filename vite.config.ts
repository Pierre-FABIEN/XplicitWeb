import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		tailwindcss(),
		sveltekit(),
	],

	optimizeDeps: {
		exclude: ['@node-rs/argon2', '@node-rs/bcrypt'],
		force: true
	},

	resolve: {
		preserveSymlinks: true
	},

	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},

	server: {
		port: 2000,
		watch: {
			usePolling: true,
			interval: 1000
		}
	},

	preprocess: [vitePreprocess()],

	cacheDir: '.vite_cache',
	clearScreen: false,
	build: {
		rollupOptions: {
			cache: false
		}
	}
};

export default config;

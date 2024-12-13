import { sveltekit } from '@sveltejs/kit/vite';

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
	],

	resolve: {
		preserveSymlinks: true
	},

	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},

	server: {
		port: 1000
	},

	preprocess: [vitePreprocess()]
};

export default config;

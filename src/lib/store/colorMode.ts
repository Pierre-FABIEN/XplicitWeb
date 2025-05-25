// src/lib/stores/colorMode.ts
import { writable } from 'svelte/store';

export type Scheme = 'light' | 'dark';

/* ---------- helpers ---------- */
const LS_KEY = 'color-scheme';

function initial(): Scheme {
	/* 1. valeur forcée par l’utilisateur */
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem(LS_KEY) as Scheme | null;
		if (saved) return saved;
	}
	/* 2. classe présente sur <html> */
	if (typeof document !== 'undefined') {
		return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
	}
	/* 3. fallback média-query (SSR = light) */
	return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
}

/* ---------- store + API ---------- */
function createColorMode() {
	const { subscribe, set, update } = writable<Scheme>(initial());

	/* synchro classe + localStorage */
	function apply(mode: Scheme) {
		document.documentElement.classList.toggle('dark', mode === 'dark');
		localStorage.setItem(LS_KEY, mode);
		set(mode);
	}

	/* écoute change OS */
	if (typeof window !== 'undefined') {
		window
			.matchMedia('(prefers-color-scheme: dark)')
			.addEventListener('change', (e) => apply(e.matches ? 'dark' : 'light'));
	}

	return {
		subscribe,
		/** force explicitement le mode */
		set: (m: Scheme) => apply(m),
		/** bascule */
		toggle: () => update((m) => (m === 'dark' ? 'light' : 'dark'))
	};
}

export const colorMode = createColorMode();

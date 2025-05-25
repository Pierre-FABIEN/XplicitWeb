// src/lib/stores/colorMode.ts
import { readable } from 'svelte/store';
import { mode as rawMode } from 'mode-watcher'; // ce que tu utilisais avant

export const colorMode = readable<'light' | 'dark'>(rawMode(), (set) => {
	/* mode-watcher déclenche un event `change` → on met à jour le store */
	const off = rawMode((newMode: 'light' | 'dark') => set(newMode));
	return () => off(); // unsubscribe quand le composant est détruit
});

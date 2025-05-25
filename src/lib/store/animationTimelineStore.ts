import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { derived, get } from 'svelte/store';
import { browser } from '$app/environment';

import { BackgroundColorStore, LightColorStore } from './BackgroundColorStore';
import { color1Tweened, color2Tweened } from './lightColorStore';
import { colorMode } from '$lib/store/colorMode';
import { isSmall } from './mediaStore';

/* -------------------------------------------------------------------------- */
/*    1.  Stores tweenés (position/cible caméra)                              */
/* -------------------------------------------------------------------------- */
const opts = { duration: 500, easing: cubicOut };

export const cameraX = tweened(0, opts);
export const cameraY = tweened(0.3, opts);
export const cameraZ = tweened(2, opts);

export const targetX = tweened(0, opts);
export const targetY = tweened(0.5, opts);
export const targetZ = tweened(0, opts);

/** Tableaux directement utilisables dans la scène */
export const cameraPosition = derived(
	[cameraX, cameraY, cameraZ],
	([$x, $y, $z]) => [$x, $y, $z] as const
);
export const cameraTarget = derived(
	[targetX, targetY, targetZ],
	([$x, $y, $z]) => [$x, $y, $z] as const
);

/* -------------------------------------------------------------------------- */
/*    2.  Mise à jour couleurs (light/dark)                                   */
/* -------------------------------------------------------------------------- */
function setSceneColors(page: string, currentMode: 'light' | 'dark') {
	type Hex = `#${string}`;

	const palettes: Record<
		string,
		{ dark: { light: Hex; bg: Hex }; light: { light: Hex; bg: Hex } }
	> = {
		'/': {
			dark: { light: '#000000', bg: '#00021a' },
			light: { light: '#75deff', bg: '#00c2ff' }
		},
		'/atelier': {
			dark: { light: '#000000', bg: '#030911' },
			light: { light: '#75deff', bg: '#bcd6ff' }
		},
		'/catalogue': {
			dark: { light: '#000000', bg: '#00021a' },
			light: { light: '#75deff', bg: '#00c2ff' }
		},
		'/blog': {
			dark: { light: '#001606', bg: '#041208' },
			light: { light: '#66bd7d', bg: '#b5ffc9' }
		},
		'/contact': {
			dark: { light: '#090909', bg: '#15141c' },
			light: { light: '#66bd7d', bg: '#b5ffc9' }
		}
	};

	const p = palettes[page] ?? palettes['/'];
	const { light, bg } = p[currentMode];

	LightColorStore.set(light);
	BackgroundColorStore.set(bg);
	color1Tweened.set(bg);
	color2Tweened.set(bg);
}

/* -------------------------------------------------------------------------- */
/*    3.  Fonction publique                                                   */
/* -------------------------------------------------------------------------- */
export function updateCameraPosition(pathname: string): void {
	const currentMode: 'light' | 'dark' = browser ? get(colorMode) : 'light';
	const mobile = get(isSmall);

	let x = 0,
		y = 0.3,
		z = 2,
		tx = 0,
		ty = 0.5,
		tz = 0;

	switch (pathname) {
		case '/': {
			if (mobile) ([x, y, z] = [1, 1, 1]), ([tx, ty, tz] = [0, 0.7, 0]);
			else ([x, y, z] = [0.8, 0.3, 1.6]), ([tx, ty, tz] = [-0.7, 0.5, 0]);
			break;
		}
		case '/atelier': {
			[x, y, z] = [1, 1, 1];
			[tx, ty, tz] = [0, 0.5, 0];
			break;
		}
		case '/catalogue': {
			if (mobile) ([x, y, z] = [1, 1, 1]), ([tx, ty, tz] = [0, 0.7, 0]);
			else ([x, y, z] = [1, 1, 1]), ([tx, ty, tz] = [0, 0.6, 0]);
			break;
		}
		case '/blog': {
			[x, y, z] = [0.8, 0.5, 0.8];
			[tx, ty, tz] = [-0.8, 0.5, 0];
			break;
		}
		case '/contact': {
			[x, y, z] = [0.5, 2, 0.5];
			[tx, ty, tz] = [0.5, 1, 0];
			break;
		}
		// default : valeurs déjà initialisées
	}

	/* 1️⃣  met à jour la palette en fonction du mode (light/dark) */
	setSceneColors(pathname, currentMode);

	/* 2️⃣  met à jour les tweened */
	cameraX.set(x);
	cameraY.set(y);
	cameraZ.set(z);

	targetX.set(tx);
	targetY.set(ty);
	targetZ.set(tz);
}

import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { derived, get } from 'svelte/store';
import { BackgroundColorStore, LightColorStore } from './BackgroundColorStore';
import { color1Tweened, color2Tweened } from './lightColorStore';
import { mode } from 'mode-watcher';

// Stores pour la position de la caméra
export const cameraX = tweened(0, { duration: 500, easing: cubicOut });
export const cameraY = tweened(0.3, { duration: 500, easing: cubicOut });
export const cameraZ = tweened(2, { duration: 500, easing: cubicOut });

// Stores pour la cible de la caméra
export const targetX = tweened(0, { duration: 500, easing: cubicOut });
export const targetY = tweened(0.5, { duration: 500, easing: cubicOut });
export const targetZ = tweened(0, { duration: 500, easing: cubicOut });

// Stores dérivés pour obtenir des tableaux directement utilisables
export const cameraPosition = derived([cameraX, cameraY, cameraZ], ([$x, $y, $z]) => [$x, $y, $z]);
export const cameraTarget = derived([targetX, targetY, targetZ], ([$x, $y, $z]) => [$x, $y, $z]);

const currentMode = get(mode);

// Fonction pour mettre à jour les positions de la caméra et de la cible
export function updateCameraPosition(pathname: string) {
	let x = 0,
		y = 0.3,
		z = 2;
	let tx = 0,
		ty = 0.5,
		tz = 0;

	switch (pathname) {
		case '/':
			[x, y, z] = [0.8, 0.3, 1.6];
			[tx, ty, tz] = [-0.7, 0.5, 0];
			mode.subscribe((currentMode) => {
				if (currentMode === 'dark') {
					LightColorStore.set('#000000');
					BackgroundColorStore.set('#00021a');
					color2Tweened.set('#00c2ff');
					color1Tweened.set('#00c2ff');
				} else if (currentMode === 'light') {
					LightColorStore.set('#75deff');
					BackgroundColorStore.set('#00c2ff');
					color2Tweened.set('#00c2ff');
					color1Tweened.set('#00c2ff');
				}
			});

			break;
		case '/atelier':
			[x, y, z] = [0, 1, 1];
			[tx, ty, tz] = [0, 0.5, 0];
			BackgroundColorStore.set('#ffff00');
			color2Tweened.set('#ffff00');
			color1Tweened.set('#ffff00');
			break;
		case '/catalogue':
			[x, y, z] = [0.8, 0.5, 0.8];
			[tx, ty, tz] = [-0.8, 0.5, 0];
			BackgroundColorStore.set('#00ff00');
			color2Tweened.set('#00ff00');
			color1Tweened.set('#00ff00');
			break;
		default:
			[x, y, z] = [0, 0.3, 2];
			[tx, ty, tz] = [0, 0.5, 0];
			break;
	}

	// Mise à jour des stores
	cameraX.set(x);
	cameraY.set(y);
	cameraZ.set(z);

	targetX.set(tx);
	targetY.set(ty);
	targetZ.set(tz);
}

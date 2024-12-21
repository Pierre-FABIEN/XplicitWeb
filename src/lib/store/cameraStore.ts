import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { writable, derived } from 'svelte/store';

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
			break;
		case '/atelier':
			[x, y, z] = [0, 1, 1];
			[tx, ty, tz] = [0, 0.5, 0];
			break;
		case '/music':
			[x, y, z] = [2, 0.5, 3];
			[tx, ty, tz] = [0, 0.5, 0];
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

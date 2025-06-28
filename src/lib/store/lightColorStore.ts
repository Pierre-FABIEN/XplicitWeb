// src/lib/store/lightColorStore.ts
import { tweened } from 'svelte/motion';
import { linear } from 'svelte/easing';
import { writable } from 'svelte/store';
import * as THREE from 'three';

// Fonction d'interpolation des couleurs
function colorInterpolator(from: string, to: string) {
	const hexToRgb = (hex: string) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
			: [255, 255, 255];
	};

	const rgb1 = hexToRgb(from);
	const rgb2 = hexToRgb(to);

	return (t: number) => {
		const interpolated = rgb1.map((c, i) => Math.round(c + (rgb2[i] - c) * t));
		return `#${interpolated.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
	};
}

// Store principal pour les lumières (positions et rotation)
export const LightStore = writable({
	directionalLightRef: undefined as THREE.DirectionalLight | undefined,
	directionalLightRef2: undefined as THREE.DirectionalLight | undefined,
	lightPos: [2, 2, 0] as [number, number, number],
	lightPos2: [-2, 2, 0] as [number, number, number],
	rotationAngle: 0
});

// Stores tweened pour les couleurs avec interpolation personnalisée
export const color1Tweened = tweened('#ffffff', {
	duration: 800,
	easing: linear,
	interpolate: colorInterpolator
});

export const color2Tweened = tweened('#ffffff', {
	duration: 800,
	easing: linear,
	interpolate: colorInterpolator
});

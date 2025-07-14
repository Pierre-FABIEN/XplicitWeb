import { writable, derived, get } from 'svelte/store';
import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { browser } from '$app/environment';
import * as THREE from 'three';

// ============================================================================
// 1. STORES DE BASE POUR LA CAMÉRA
// ============================================================================

const cameraOpts = { duration: 800, easing: cubicOut };

export const cameraX = tweened(0, cameraOpts);
export const cameraY = tweened(0.3, cameraOpts);
export const cameraZ = tweened(2, cameraOpts);

export const targetX = tweened(0, cameraOpts);
export const targetY = tweened(0.5, cameraOpts);
export const targetZ = tweened(0, cameraOpts);

// Positions dérivées pour faciliter l'utilisation
export const cameraPosition = derived(
	[cameraX, cameraY, cameraZ],
	([$x, $y, $z]) => [$x, $y, $z] as const
);

export const cameraTarget = derived(
	[targetX, targetY, targetZ],
	([$x, $y, $z]) => [$x, $y, $z] as const
);

// ============================================================================
// 2. STORES POUR LES CONTRÔLES UTILISATEUR
// ============================================================================

// Contrôles de zoom et rotation avec transitions fluides
export const zoomLevel = tweened(1, { duration: 600, easing: cubicOut });
export const lightIntensity = tweened(8, { duration: 600, easing: cubicOut });

// Contrôles de rotation du modèle
export const modelRotation = writable({ x: 0, y: 0 });
export const targetRotation = writable({ x: 0, y: 0 });
export const isInteracting = writable(false);

// ============================================================================
// 3. STORES POUR LES TEXTURES ET MATÉRIAUX
// ============================================================================

// Texture principale du modèle
export const textureStore = writable('/BAT/Xplicitdrink Original - 2026-min.png');

// ============================================================================
// 4. STORES POUR LES LUMIÈRES
// ============================================================================

// Références aux lumières
export const LightStore = writable({
	directionalLightRef: undefined as THREE.DirectionalLight | undefined,
	directionalLightRef2: undefined as THREE.DirectionalLight | undefined,
	lightPos: [2, 2, 0] as [number, number, number],
	lightPos2: [-2, 2, 0] as [number, number, number],
	rotationAngle: 0
});

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

// Stores tweened pour les couleurs avec interpolation personnalisée
export const color1Tweened = tweened('#ffffff', {
	duration: 1000,
	easing: cubicOut,
	interpolate: colorInterpolator
});

export const color2Tweened = tweened('#ffffff', {
	duration: 1000,
	easing: cubicOut,
	interpolate: colorInterpolator
});

// ============================================================================
// 5. STORES POUR LES COULEURS D'ARRIÈRE-PLAN
// ============================================================================

import gsap from 'gsap';

// Store pour la couleur d'arrière-plan avec animation GSAP
export const BackgroundColorStore = (() => {
	const { subscribe, set: originalSet } = writable('#00021a');

	function animateColor(newColor: string) {
		let currentColor: string = '#00021a';

		// Abonnement temporaire pour obtenir la couleur actuelle
		const unsubscribe = subscribe((value) => {
			currentColor = value;
		});
		unsubscribe();

		// Animation avec GSAP
		gsap.to(
			{ color: currentColor },
			{
				color: newColor,
				duration: 1.2,
				ease: "power2.out",
				onUpdate: function () {
					originalSet(this.targets()[0].color);
				}
			}
		);
	}

	return {
		subscribe,
		set: animateColor
	};
})();

// Store pour la couleur de lumière avec animation GSAP
export const LightColorStore = (() => {
	const { subscribe, set: originalSet } = writable('#75deff');

	function animateColor(newColor: string) {
		let currentColor: string = '#75deff';

		// Abonnement temporaire pour obtenir la couleur actuelle
		const unsubscribe = subscribe((value) => {
			currentColor = value;
		});
		unsubscribe();

		// Animation avec GSAP
		gsap.to(
			{ color: currentColor },
			{
				color: newColor,
				duration: 1.2,
				ease: "power2.out",
				onUpdate: function () {
					originalSet(this.targets()[0].color);
				}
			}
		);
	}

	return {
		subscribe,
		set: animateColor
	};
})();

// Store pour le gradient
export const GradientStore = writable({
	x: 0,
	y: 0,
	radius: 1,
	colorShift: 0,
	lastTimestamp: 0
});

// ============================================================================
// 6. FONCTIONS UTILITAIRES
// ============================================================================

// Fonction pour réinitialiser les contrôles utilisateur
export function resetUserControls() {
	zoomLevel.set(1);
	lightIntensity.set(8);
	modelRotation.set({ x: 0, y: 0 });
	targetRotation.set({ x: 0, y: 0 });
	isInteracting.set(false);
}

// Fonction pour réinitialiser les contrôles de l'atelier
export function resetAtelierControls() {
	zoomLevel.set(1);
	lightIntensity.set(8);
}

// Fonction pour réinitialiser les contrôles de l'atelier avec transition fluide
export function resetAtelierControlsWithTransition() {
	// Transition fluide vers les valeurs par défaut
	zoomLevel.set(1);
	lightIntensity.set(8);
}

// Fonction pour mettre à jour la position de la caméra avec zoom
export function updateCameraWithZoom(x: number, y: number, z: number, tx: number, ty: number, tz: number) {
	const currentZoom = get(zoomLevel);
	cameraX.set(x * currentZoom);
	cameraY.set(y * currentZoom);
	cameraZ.set(z * currentZoom);
	targetX.set(tx);
	targetY.set(ty);
	targetZ.set(tz);
}

// Fonction pour obtenir la position de caméra actuelle avec zoom
export function getCurrentCameraPosition() {
	const currentZoom = get(zoomLevel);
	return {
		x: get(cameraX) * currentZoom,
		y: get(cameraY) * currentZoom,
		z: get(cameraZ) * currentZoom
	};
}

// ============================================================================
// 7. STORES DÉRIVÉS POUR LA SYNCHRONISATION
// ============================================================================

// Position de caméra avec zoom appliqué
export const cameraPositionWithZoom = derived(
	[cameraX, cameraY, cameraZ, zoomLevel],
	([$x, $y, $z, $zoom]) => [$x * $zoom, $y * $zoom, $z * $zoom] as const
);

// Intensité lumineuse avec validation
export const validatedLightIntensity = derived(
	lightIntensity,
	($intensity) => Math.max(0.1, Math.min(20, $intensity))
);

// ============================================================================
// 8. TYPES ET INTERFACES
// ============================================================================

export interface CameraPosition {
	x: number;
	y: number;
	z: number;
}

export interface ModelRotation {
	x: number;
	y: number;
}

export interface LightConfig {
	intensity: number;
	position: [number, number, number];
	color: string;
}

// ============================================================================
// 9. FONCTIONS DE GESTION DES COULEURS ET CAMÉRA
// ============================================================================

import { mode } from 'mode-watcher';
import { isSmall } from './mediaStore';

/* ---------- Palettes light/dark ------------------------------------- */
type Hex = `#${string}`;
const palettes: Record<string, { dark: { light: Hex; bg: Hex }; light: { light: Hex; bg: Hex } }> =
	{
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

// Variable pour garder trace de la page courante
let currentPage = '/';

function setSceneColors(page: string, currentMode: 'light' | 'dark') {
	// Logique pour gérer les sous-routes d'auth
	let paletteKey = page;
	if (page.startsWith('/auth')) {
		paletteKey = '/auth';
	}

	const p = palettes[paletteKey] ?? palettes['/'];
	const { light, bg } = p[currentMode];

	LightColorStore.set(light);
	BackgroundColorStore.set(bg);
	color1Tweened.set(bg);
	color2Tweened.set(bg);
}

// Fonction pour mettre à jour seulement les couleurs
export function updateSceneColors(): void {
	if (!browser) return;
	
	const currentMode: 'light' | 'dark' = mode.current ?? 'light';
	
	setSceneColors(currentPage, currentMode);
}

// API publique pour mettre à jour la position de la caméra avec transitions fluides
export function updateCameraPosition(pathname: string): void {
	const currentMode: 'light' | 'dark' = browser ? (mode.current ?? 'light') : 'light';
	const mobile = get(isSmall);

	// Sauvegarder la page courante
	currentPage = pathname;

	let x = 0,
		y = 0.3,
		z = 2,
		tx = 0,
		ty = 0.5,
		tz = 0;

	switch (pathname) {
		case '/':
			if (mobile) ([x, y, z] = [1, 1, 1]), ([tx, ty, tz] = [0, 0.7, 0]);
			else ([x, y, z] = [0.8, 0.3, 1.6]), ([tx, ty, tz] = [-0.7, 0.5, 0]);
			// Réinitialiser les contrôles de l'atelier avec transition
			resetAtelierControlsWithTransition();
			break;
		case '/atelier':
			[x, y, z] = [1, 1, 1];
			[tx, ty, tz] = [0, 0.5, 0];
			// Pas de réinitialisation dans l'atelier
			break;
		case '/catalogue':
			if (mobile) ([x, y, z] = [1, 1, 1]), ([tx, ty, tz] = [0, 0.7, 0]);
			else ([x, y, z] = [1, 1, 1]), ([tx, ty, tz] = [0, 0.6, 0]);
			// Réinitialiser les contrôles de l'atelier avec transition
			resetAtelierControlsWithTransition();
			break;
		case '/blog':
			[x, y, z] = [0.8, 0.5, 0.8];
			[tx, ty, tz] = [-0.8, 0.5, 0];
			// Réinitialiser les contrôles de l'atelier avec transition
			resetAtelierControlsWithTransition();
			break;
		case '/contact':
			[x, y, z] = [0.5, 2, 0.5];
			[tx, ty, tz] = [0.5, 1, 0];
			// Réinitialiser les contrôles de l'atelier avec transition
			resetAtelierControlsWithTransition();
			break;
	}

	/* Palette couleurs selon le thème */
	setSceneColors(pathname, currentMode);

	/* Mise à jour des tweened avec transitions fluides */
	cameraX.set(x);
	cameraY.set(y);
	cameraZ.set(z);
	targetX.set(tx);
	targetY.set(ty);
	targetZ.set(tz);
}

// ============================================================================
// 10. EXPORT DES STORES POUR LA COMPATIBILITÉ
// ============================================================================

// Exports pour compatibilité avec l'ancien code
export { zoomLevel as zoomStore };
export { lightIntensity as lightIntensityStore }; 
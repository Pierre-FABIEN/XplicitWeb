import gsap from 'gsap';
import type Scrollbar from 'smooth-scrollbar';
import { get } from 'svelte/store';
import SmoothScrollBarStore from '$lib/store/SmoothScrollBarStore';

let smoothScroll: Scrollbar | null = null;

// Fonction pour initialiser le smoothScroll et récupérer la dernière instance
const initSmoothScroll = () => {
	smoothScroll = get(SmoothScrollBarStore).smoothScroll;
};

// Fonction utilitaire pour remettre le scroll en haut
const resetScroll = () => {
	if (smoothScroll) {
		smoothScroll.scrollTo(0, 0, 500); // Ici, 500ms est la durée du scroll
	} else {
		window.scrollTo({ top: 0, behavior: 'smooth' }); // Utilisation du scroll par défaut si smoothScroll n'est pas actif
	}
};

export const enter = (node: HTMLElement, { fromPath }: { fromPath: string | null | undefined }) => {
	// Initialisation du scroll pour la transition d'entrée
	initSmoothScroll();
	resetScroll();

	const timeline = gsap.timeline();

	if (fromPath === '/transitionDemo') {
		// Animation spécifique si on vient de '/transitionDemo'
		timeline.from(node, {
			x: '100%',
			ease: 'linear',
			duration: 0.5
		});
	} else {
		// Animation par défaut
		timeline.from(node, {
			y: '100%',
			ease: 'linear',
			duration: 0.5
		});
	}
	return {
		duration: timeline.duration() * 4000
	};
};

export const exit = (node: HTMLElement, { toPath }: { toPath: string | null | undefined }) => {
	// Initialisation et remise à zéro du scroll pour la transition de sortie
	initSmoothScroll();
	resetScroll();

	const timeline = gsap.timeline();

	if (toPath === '/transitionDemo') {
		// Animation spécifique si on va vers '/transitionDemo'
		timeline.to(node, {
			x: '100%',
			ease: 'linear',
			duration: 0.5
		});
	} else {
		// Animation par défaut
		timeline.to(node, {
			y: '-100%',
			ease: 'linear',
			duration: 0.5
		});
	}
	return {
		duration: timeline.duration() * 4000
	};
};

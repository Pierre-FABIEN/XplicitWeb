// src/lib/store/BackgroundColorStore.js
import { writable } from 'svelte/store';
import gsap from 'gsap';

// Crée un store pour la couleur d'arrière-plan
export const BackgroundColorStore = (() => {
	const { subscribe, set } = writable('#ff0000'); // Couleur initiale

	// Méthode pour animer la transition de couleur
	function animateColor(newColor) {
		let currentColor;

		// Abonnement temporaire pour obtenir la couleur actuelle
		const unsubscribe = subscribe((value) => {
			currentColor = value;
		});
		unsubscribe();

		// Animation avec GSAP
		gsap.to(
			{ color: currentColor },
			{
				color: newColor, // Couleur cible
				duration: 1, // Durée de la transition
				onUpdate: function () {
					set(this.targets()[0].color); // Met à jour la couleur dans le store
				}
			}
		);
	}

	return {
		subscribe,
		set: animateColor // Remplace `set` pour inclure l'animation
	};
})();

export const GradientStore = writable({
	x: 0, // Position X
	y: 0, // Position Y
	radius: 1, // Rayon
	colorShift: 0, // Décalage de couleur
	lastTimestamp: 0 // Dernière timestamp
});

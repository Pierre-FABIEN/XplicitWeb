<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { Float, ContactShadows, SoftShadows } from '@threlte/extras';
	import Modele from './components/Modele.svelte';
	import Lights from './components/Lights/index.svelte';
	import Camera from './components/Camera.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { zoomLevel, lightIntensity, modelRotation, targetRotation, isInteracting } from '$lib/store/scene3DStore';

	const large = new MediaQuery('min-width: 736px');

	// État réactif pour la rotation actuelle et cible
	let rotation = $state({ x: 0, y: 0 });
	let lastPointerPosition = $state({ x: 0, y: 0 }); // Position précédente du pointeur

	/**
	 * Démarrage de l'interaction (clic ou touché)
	 * @param {MouseEvent | TouchEvent} event
	 */
	function onPointerDown(event: MouseEvent | TouchEvent) {
		isInteracting.set(true);

		// Gérer les événements tactiles ou souris
		if (event instanceof TouchEvent) {
			const touch = event.touches[0];
			lastPointerPosition.x = touch.clientX;
			lastPointerPosition.y = touch.clientY;
		} else {
			lastPointerPosition.x = event.clientX;
			lastPointerPosition.y = event.clientY;
		}
	}

	/**
	 * Fin de l'interaction
	 */
	function onPointerUp() {
		isInteracting.set(false);
	}

	/**
	 * Mise à jour des rotations cibles en fonction du déplacement
	 * @param {MouseEvent | TouchEvent} event
	 */
	function onPointerMove(event: MouseEvent | TouchEvent) {
		if (!$isInteracting) return;

		let clientX, clientY;

		// Gérer les événements tactiles et souris
		if (event instanceof TouchEvent) {
			const touch = event.touches[0];
			clientX = touch.clientX;
			clientY = touch.clientY;
		} else {
			clientX = event.clientX;
			clientY = event.clientY;
		}

		// Calculer le delta du mouvement
		const deltaX = (clientX - lastPointerPosition.x) * 0.01; // Sensibilité sur X
		const deltaY = (clientY - lastPointerPosition.y) * 0.01; // Sensibilité sur Y

		// Mettre à jour les rotations cibles
		const currentTarget = $targetRotation;
		const newX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, currentTarget.x - deltaY)); // Limite X
		const newY = currentTarget.y - deltaX; // Pas de limite pour Y
		targetRotation.set({ x: newX, y: newY });

		// Mettre à jour la position précédente
		lastPointerPosition.x = clientX;
		lastPointerPosition.y = clientY;
	}

	/**
	 * Animation de l'amortissement (damping)
	 */
	useTask((delta) => {
		const currentRotation = rotation;
		const currentTarget = $targetRotation;
		const newX = currentRotation.x + (currentTarget.x - currentRotation.x) * 0.1; // Amortissement sur X
		const newY = currentRotation.y + (currentTarget.y - currentRotation.y) * 0.1; // Amortissement sur Y
		rotation = { x: newX, y: newY };
		modelRotation.set(rotation);
	});

	/**
	 * Ajout des écouteurs d'événements
	 */
	$effect(() => {
		window.addEventListener('mousedown', onPointerDown);
		window.addEventListener('mouseup', onPointerUp);
		window.addEventListener('mousemove', onPointerMove);

		window.addEventListener('touchstart', onPointerDown);
		window.addEventListener('touchend', onPointerUp);
		window.addEventListener('touchmove', onPointerMove);

		return () => {
			window.removeEventListener('mousedown', onPointerDown);
			window.removeEventListener('mouseup', onPointerUp);
			window.removeEventListener('mousemove', onPointerMove);

			window.removeEventListener('touchstart', onPointerDown);
			window.removeEventListener('touchend', onPointerUp);
			window.removeEventListener('touchmove', onPointerMove);
		};
	});
</script>

<Camera />

<!-- Ombres de contact et douces pour un rendu réaliste -->
{#if large.current}
	<!-- Ombres de contact pour un rendu réaliste -->
	<ContactShadows opacity={1} scale={10} blur={1.1} far={15} resolution={556} color="#000000" />

	<!-- Ombres douces pour un éclairage naturel -->
	<SoftShadows focus={30} size={4} samples={30} />
{/if}

<!-- Modèle avec rotation animée -->
<Float
	floatIntensity={0.5}
	floatingRange={[0, 0.1]}
	position={[0, 0.5, 0]}
	rotation={[rotation.x, rotation.y, 0]}
>
	<Modele />
</Float>

<!-- Plan de base -->
<T.PlaneGeometry attach="geometry" position={[0, 0, 0]} />

<!-- Lumières -->
<Lights />

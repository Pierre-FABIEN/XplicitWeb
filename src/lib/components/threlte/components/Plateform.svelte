<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
	import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
	RectAreaLightUniformsLib.init();

	// Références des groupes pour la rotation
	let group1Ref = $state<THREE.Group | undefined>(undefined);
	let group2Ref = $state<THREE.Group | undefined>(undefined);

	// Angles de rotation pour les deux groupes
	let rotationAngle1 = $state(0); // Sens horaire
	let rotationAngle2 = $state(0); // Sens antihoraire

	// Animation pour faire tourner les groupes
	useTask((delta) => {
		const speed = 0.1; // Vitesse de rotation

		// Sens horaire pour le premier groupe
		rotationAngle1 += delta * speed;
		if (group1Ref) {
			group1Ref.rotation.y = rotationAngle1;
		}

		// Sens antihoraire pour le deuxième groupe
		rotationAngle2 -= delta * speed;
		if (group2Ref) {
			group2Ref.rotation.y = rotationAngle2;
		}
	});
</script>

<!-- Premier groupe, tourne en sens horaire -->
<T.Group bind:ref={group1Ref} position={[0, -0.3, 0]}>
	<T.RectAreaLight
		color="#ffffff"
		intensity={10}
		width={0.3}
		height={0.3}
		rotation={[2 / Math.PI, 2 / Math.PI, 0]}
		position={[0.5, 0.5, 0.5]}
	/>
	<T.RectAreaLight
		color="#ffffff"
		intensity={10}
		width={0.3}
		height={0.3}
		rotation={[-2 / Math.PI, 10, 2 / Math.PI]}
		position={[-0.5, 0.5, -0.5]}
	/>
</T.Group>

<!-- Deuxième groupe, tourne en sens antihoraire -->
<T.Group bind:ref={group2Ref} position={[0, 1.8, 0]} rotation={[10 / Math.PI, 5 / Math.PI, 0]}>
	<T.RectAreaLight
		color="#ffffff"
		intensity={10}
		width={0.3}
		height={0.3}
		rotation={[2 / Math.PI, 2 / Math.PI, 0]}
		position={[0.5, 0.5, 0.5]}
	/>
	<T.RectAreaLight
		color="#ffffff"
		intensity={10}
		width={0.3}
		height={0.3}
		rotation={[-2 / Math.PI, 10, 2 / Math.PI]}
		position={[-0.5, 0.5, -0.5]}
	/>
</T.Group>

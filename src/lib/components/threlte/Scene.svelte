<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { ContactShadows, Float, Grid, OrbitControls, SoftShadows } from '@threlte/extras';
	import * as THREE from 'three';
	import Modele from './Modele.svelte';

	let directionalLightRef = $state<THREE.DirectionalLight | undefined>(undefined);

	// Position réactive de la lumière directionnelle
	let lightPos = $state([2, 2, 0]);
	let rotationAngle = $state(0);

	// Animation de la lumière en cercle
	useTask((delta) => {
		rotationAngle += delta * 0.5;
		const radius = 2;
		lightPos[0] = Math.cos(rotationAngle) * radius;
		lightPos[1] = 2;
		lightPos[2] = Math.sin(rotationAngle) * radius;
	});

	// Effet pour orienter la lumière vers le modèle à chaque changement de position
	$effect(() => {
		// Accès à la position pour déclencher la réactivité
		lightPos[0];
		lightPos[1];
		lightPos[2];

		if (directionalLightRef) {
			directionalLightRef.lookAt(0, 0.5, 0);
		}
	});
</script>

<T.PerspectiveCamera makeDefault position={[0, 0.3, 3]}>
	<OrbitControls target={[0, 0.5, 0]} enableDamping />
</T.PerspectiveCamera>

<!-- On utilise position={lightPos} pour rendre la position réactive -->
<T.DirectionalLight
	ref={directionalLightRef}
	position={lightPos}
	intensity={1.5}
	castShadow
	shadow.mapSize.width={2048}
	shadow.mapSize.height={2048}
	shadow.bias={0.0001}
/>

<T.AmbientLight intensity={0.5} />

<Grid
	position.y={-0.001}
	cellColor="#ffffff"
	sectionColor="#ffffff"
	sectionThickness={0}
	fadeDistance={25}
	cellSize={2}
/>

<ContactShadows opacity={1} scale={10} blur={1} far={10} resolution={256} color="#000000" />
<SoftShadows focus={30} size={4} samples={30} />
<Float floatIntensity={3} floatingRange={[0, 0.1]}>
	<Modele />
</Float>

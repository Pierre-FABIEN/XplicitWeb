<script lang="ts">
	import Camera from './components/Camera.svelte';
	import { T, useTask } from '@threlte/core';
	import { ContactShadows, Float, Grid, OrbitControls, SoftShadows } from '@threlte/extras';
	import * as THREE from 'three';
	import Modele from './Modele.svelte';
	import Plateform from './components/Plateform.svelte';

	let directionalLightRef = $state<THREE.DirectionalLight | undefined>(undefined);
	let directionalLightRef2 = $state<THREE.DirectionalLight | undefined>(undefined);

	// Positions réactives des lumières directionnelles
	let lightPos: [number, number, number] = $state([2, 2, 0]);
	let lightPos2: [number, number, number] = $state([-2, 2, 0]);

	let rotationAngle = $state(0);

	// Animation de la lumière en cercle
	useTask((delta) => {
		rotationAngle += delta * 0.5;
		const radius = 2;

		// Première lumière
		lightPos[0] = Math.cos(rotationAngle) * radius;
		lightPos[1] = 2;
		lightPos[2] = Math.sin(rotationAngle) * radius;

		// Seconde lumière (dans l'angle opposé)
		lightPos2[0] = -Math.cos(rotationAngle) * radius;
		lightPos2[1] = 2;
		lightPos2[2] = -Math.sin(rotationAngle) * radius;
	});

	// Effet pour orienter les lumières vers le modèle
	$effect(() => {
		lightPos[0];
		lightPos[1];
		lightPos[2]; // déclenche la réactivité
		if (directionalLightRef) {
			directionalLightRef.lookAt(0, 0.5, 0);
		}

		lightPos2[0];
		lightPos2[1];
		lightPos2[2];
		if (directionalLightRef2) {
			directionalLightRef2.lookAt(0, 0.5, 0);
		}
	});
</script>

<Camera />

<T.DirectionalLight
	ref={directionalLightRef}
	position={lightPos}
	intensity={1.5}
	color="#ffff00"
	castShadow
	shadow.mapSize.width={4096}
	shadow.mapSize.height={4096}
	shadow.bias={0.0001}
/>

<T.DirectionalLight
	ref={directionalLightRef2}
	position={lightPos2}
	intensity={1.5}
	color="#00ffff"
	castShadow
	shadow.mapSize.width={4096}
	shadow.mapSize.height={4096}
	shadow.bias={0.0001}
/>

<T.DirectionalLight
	position={[2, 2, 2]}
	intensity={1.5}
	castShadow
	shadow.mapSize.width={4096}
	shadow.mapSize.height={4096}
	shadow.bias={0.0001}
/>

<T.AmbientLight intensity={0.5} />

<ContactShadows opacity={1} scale={10} blur={1} far={10} resolution={256} color="#000000" />
<SoftShadows focus={30} size={4} samples={30} />
<Float floatIntensity={1} floatingRange={[0, 0.05]}>
	<Modele />
</Float>

<T.PlaneGeometry attach="geometry" position={[0, 0.5, 0]} />

<Plateform />

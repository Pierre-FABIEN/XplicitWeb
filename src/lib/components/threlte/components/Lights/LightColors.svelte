<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { LightStore, color1Tweened, color2Tweened } from '$lib/store/scene3DStore';
	import { get } from 'svelte/store';
	import * as THREE from 'three';

	let directionalLightRef: THREE.DirectionalLight | undefined;
	let directionalLightRef2: THREE.DirectionalLight | undefined;

	// Animation des positions et des couleurs
	useTask((delta) => {
		const state = get(LightStore);
		state.rotationAngle += delta * 0.05;
		const radius = 2;

		// Mise à jour des positions
		state.lightPos[0] = Math.cos(state.rotationAngle) * radius;
		state.lightPos[1] = 2;
		state.lightPos[2] = Math.sin(state.rotationAngle) * radius;

		state.lightPos2[0] = -Math.cos(state.rotationAngle) * radius;
		state.lightPos2[1] = 2;
		state.lightPos2[2] = -Math.sin(state.rotationAngle) * radius;

		// Mettre à jour le store
		LightStore.set(state);
	});

	// Effet pour orienter les lumières vers le modèle
	$effect(() => {
		const state = get(LightStore);
		if (state.directionalLightRef) {
			state.directionalLightRef.lookAt(0, 0.5, 0);
		}
		if (state.directionalLightRef2) {
			state.directionalLightRef2.lookAt(0, 0.5, 0);
		}
	});
</script>

<T.DirectionalLight
	bind:ref={$LightStore.directionalLightRef}
	position={$LightStore.lightPos}
	intensity={1}
	color={$color1Tweened}
	castShadow
	shadow.mapSize.width={4096}
	shadow.mapSize.height={4096}
	shadow.bias={0.0001}
/>

<T.DirectionalLight
	bind:ref={$LightStore.directionalLightRef2}
	position={$LightStore.lightPos2}
	intensity={1}
	color={$color2Tweened}
	castShadow
	shadow.mapSize.width={4096}
	shadow.mapSize.height={4096}
	shadow.bias={0.0001}
/>

<script lang="ts">
	import * as THREE from 'three';
	import { T, useTask } from '@threlte/core';
	import { useDraco, useGltf, Align } from '@threlte/extras';
	import { textureStore } from '$lib/store/textureStore';
	import { writable } from 'svelte/store';

	export const ref = new THREE.Group();
	const dracoLoader = useDraco('/draco/');

	export const texturePngStore = writable<string>('/BAT/Xplicitdrink Original - 2026-min.png');
	let rotation = $state(0);
	let customMaterial = $state<THREE.MeshStandardMaterial | null>(null);

	// Charger le modèle GLTF
	const gltf = useGltf('/model/modele-transformed.glb', { dracoLoader });

	// Matériau pour CAN_ALU (aspect métallique réaliste)
	const canMaterial = new THREE.MeshStandardMaterial({
		color: 0xaaaaaa, // Couleur métallique de base (aluminium)
		roughness: 0.35, // Surface légèrement brillante
		metalness: 1.0, // 100% métallique
		envMapIntensity: 1.5 // Accentuer les reflets
	});

	$effect(() => {
		textureStore.subscribe((texturePng) => {
			const textureLoader = new THREE.TextureLoader();
			const loadedTexture = textureLoader.load(texturePng, (texture) => {
				texture.flipY = false;
			});

			// Mettre à jour le matériau
			customMaterial = new THREE.MeshStandardMaterial({
				map: loadedTexture,
				roughness: 0.4, // Surface légèrement brillante
				metalness: 1.0, // 100% métallique
				envMapIntensity: 1.5 // Accentuer les reflets
			});
		});
	});

	// useTask est appelé à chaque frame, delta est le temps écoulé depuis la dernière frame
	useTask((delta) => {
		rotation += delta / 7; // Incrémente la rotation sur l'axe Y
	});
</script>

<T is={ref}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<Align auto>
			<!-- CAN_ALU avec matériau métallique et rotation sur l'axe Y -->
			<T.Mesh
				castShadow
				receiveShadow
				geometry={gltf.nodes.CAN_ALU.geometry}
				material={canMaterial}
				position={[0, 0.2, 0]}
				rotation={[0, rotation, 0.2]}
				scale={5}
			/>
			<!-- Mesh_1 avec texture personnalisée -->
			{#if customMaterial}
				<T.Mesh
					castShadow
					receiveShadow
					geometry={gltf.nodes.Mesh_1.geometry}
					material={customMaterial}
					position={[0, 0.2, 0]}
					rotation={[0, rotation, 0.2]}
					scale={[5.005, 5, 5.005]}
				/>
			{/if}
		</Align>
	{:catch error}
		<slot name="error" {error} />
	{/await}

	<slot {ref} />
</T>

<script lang="ts">
	import * as THREE from 'three';
	import { T, useTask } from '@threlte/core';
	import { useDraco, useGltf } from '@threlte/extras';

	export const ref = new THREE.Group();
	const dracoLoader = useDraco('/draco/');

	// Charger le modèle GLTF
	const gltf = useGltf('/model/modele.glb', { dracoLoader });

	// Matériau pour CAN_ALU (aspect métallique réaliste)
	const canMaterial = new THREE.MeshStandardMaterial({
		color: 0xaaaaaa, // Couleur métallique de base (aluminium)
		roughness: 0.2, // Surface légèrement brillante
		metalness: 1.0, // 100% métallique
		envMapIntensity: 1.5 // Accentuer les reflets
	});

	// Matériau pour Mesh_1
	const textureLoader = new THREE.TextureLoader();
	const customTexture = textureLoader.load('/BAT/black.png', (texture) => {
		texture.flipY = false; // Inverser l'image verticalement
	});
	const customMaterial = new THREE.MeshStandardMaterial({
		map: customTexture
	});

	let rotation = 0;
	// useTask est appelé à chaque frame, delta est le temps écoulé depuis la dernière frame
	useTask((delta) => {
		rotation += delta / 4; // Incrémente la rotation sur l'axe Y
	});
</script>

<T is={ref}>
	{#await gltf}
		<slot name="fallback" />
	{:then gltf}
		<!-- CAN_ALU avec matériau métallique et rotation sur l'axe Y -->
		<T.Mesh
			castShadow
			receiveShadow
			geometry={gltf.nodes.CAN_ALU.geometry}
			material={canMaterial}
			position={[0, 0, 0]}
			rotation={[0, rotation, 0]}
			scale={5}
		/>
		<!-- Mesh_1 avec texture personnalisée -->
		<T.Mesh
			castShadow
			receiveShadow
			geometry={gltf.nodes.Mesh_1.geometry}
			material={customMaterial}
			position={[0, 0, 0]}
			rotation={[0, rotation, 0]}
			scale={[5.005, 5, 5.005]}
		/>
	{:catch error}
		<slot name="error" {error} />
	{/await}

	<slot {ref} />
</T>

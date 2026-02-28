<script lang="ts">
	import * as THREE from 'three';
	import { T, useTask } from '@threlte/core';
	import { useDraco, useGltf, Align } from '@threlte/extras';
	import { textureStore } from '$lib/store/scene3DStore';
	import { writable } from 'svelte/store';
	import type { Snippet } from 'svelte';

	export const ref = new THREE.Group();

	interface Props {
		fallback?: Snippet;
		error?: Snippet<[error: unknown]>;
		children?: Snippet<[ref: THREE.Group]>;
	}
	let { fallback, error, children }: Props = $props();
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

	// Gérer les changements de texture
	$effect(() => {
		const unsubscribe = textureStore.subscribe((texturePng) => {
			if (texturePng && texturePng !== '/BAT/Xplicitdrink Original - 2026-min.png') {				
				const textureLoader = new THREE.TextureLoader();
				textureLoader.load(
					texturePng,
					(texture) => {
						texture.flipY = false;
						texture.encoding = THREE.sRGBEncoding;
						
						// Mettre à jour le matériau avec la nouvelle texture
						customMaterial = new THREE.MeshStandardMaterial({
							map: texture,
							roughness: 0.4,
							metalness: 1.0,
							envMapIntensity: 1.5
						});
					},
					(progress) => {
					},
					(error) => {
					}
				);
			} else {
				// Utiliser la texture par défaut
				const textureLoader = new THREE.TextureLoader();
				textureLoader.load(
					texturePng,
					(texture) => {
						texture.flipY = false;
						texture.encoding = THREE.sRGBEncoding;
						
						customMaterial = new THREE.MeshStandardMaterial({
							map: texture,
							roughness: 0.4,
							metalness: 1.0,
							envMapIntensity: 1.5
						});
					}
				);
			}
		});

		return unsubscribe;
	});

	// useTask est appelé à chaque frame, delta est le temps écoulé depuis la dernière frame
	useTask((delta) => {
		rotation += delta / 7; // Incrémente la rotation sur l'axe Y
	});
</script>

<T is={ref}>
	{#await gltf}
		{#if fallback}
			{@render fallback()}
		{/if}
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
	{:catch err}
		{#if error}
			{@render error(err)}
		{/if}
	{/await}

	{#if children}
		{@render children(ref)}
	{/if}
</T>

<script lang="ts">
	import * as THREE from 'three';
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import Modele from './Modele.svelte';

	let PerspectiveCameraRef = $state<THREE.PerspectiveCamera | undefined>(undefined);
	let OrbitControlsRef = $state<any | undefined>(undefined);
</script>

<T.PerspectiveCamera
	makeDefault
	position={[0, 0.3, 1]}
	ref={PerspectiveCameraRef}
	on:create={() => {
		OrbitControlsRef.lookAt(0, 0, 0); // Oriente la caméra vers le centre du modèle
	}}
>
	<OrbitControls target={[0, 0.5, 0]} enableDamping />
</T.PerspectiveCamera>

<T.DirectionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

<T.AmbientLight intensity={0.5} />

<Modele />

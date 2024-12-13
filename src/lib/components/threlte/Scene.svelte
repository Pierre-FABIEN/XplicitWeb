<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import Modele from './Modele.svelte';
</script>

<!-- Caméra avec contrôles d'orbite -->
<T.PerspectiveCamera makeDefault position={[1, 1, 1]}>
	<OrbitControls />
</T.PerspectiveCamera>

<!-- Lumière directionnelle pour simuler une source lumineuse comme le soleil -->
<T.DirectionalLight position={[5, 10, 5]} intensity={1.5} castShadow />

<!-- Lumière ambiante pour un éclairage global doux -->
<T.AmbientLight intensity={0.5} />

<!-- Le modèle -->
<Modele />

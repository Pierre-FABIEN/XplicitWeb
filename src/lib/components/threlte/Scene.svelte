<script lang="ts">
	import Camera from './components/Camera.svelte';
	import { T } from '@threlte/core';
	import { ContactShadows, Float, SoftShadows } from '@threlte/extras';

	import Modele from './components/Modele.svelte';
	import Lights from './components/Lights/index.svelte';
</script>

<Camera />

<ContactShadows opacity={1} scale={10} blur={1.1} far={15} resolution={556} color="#000000" />
<SoftShadows focus={30} size={4} samples={30} />

<Float floatIntensity={1} floatingRange={[0, 0.05]}>
	<Modele />
</Float>

<T.PlaneGeometry attach="geometry" position={[0, 0.5, 0]} />

<Lights />

<script>
	import { T, useTask } from '@threlte/core';
	import LightColors from './LightColors.svelte';
	import LightRounded from './LightRounded.svelte';
</script>

<T.AmbientLight intensity={0.5} />

<!-- <LightRounded /> -->
<LightColors />

<T.DirectionalLight
	position={[0, 2, 2]}
	intensity={4}
	castShadow
	shadow.mapSize.width={4096}
	shadow.mapSize.height={4096}
	shadow.bias={0.0001}
/>

<T.DirectionalLight
	position={[0, 2, -2]}
	intensity={4}
	castShadow
	shadow.mapSize.width={4096}
	shadow.mapSize.height={4096}
	shadow.bias={0.0001}
/>

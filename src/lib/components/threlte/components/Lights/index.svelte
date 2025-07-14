<script>
	import { T, useTask } from '@threlte/core';
	import LightColors from './LightColors.svelte';
	import LightRounded from './LightRounded.svelte';
	import { lightIntensity } from '$lib/store/scene3DStore';
</script>

<T.AmbientLight intensity={1} />

<LightRounded />
<LightColors />

<T.DirectionalLight
	position={[0, 0.5, 2]}
	intensity={$lightIntensity}
	castShadow
	shadow.mapSize.width={4096}
	shadow.mapSize.height={4096}
	shadow.bias={0.0001}
/>

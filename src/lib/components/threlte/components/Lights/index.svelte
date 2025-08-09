<script>
	import { T, useTask } from '@threlte/core';
	import LightColors from './LightColors.svelte';
	import LightRounded from './LightRounded.svelte';
	import { lightIntensity } from '$lib/store/scene3DStore';
	import { isSmall } from '$lib/store/mediaStore';
</script>

<!-- Lumière ambiante toujours présente mais réduite sur mobile -->
<T.AmbientLight intensity={$isSmall ? 0.5 : 1} />

<!-- Lumières complexes uniquement sur desktop -->
{#if !$isSmall}
	<LightRounded />
	<LightColors />
{/if}

<!-- Lumière directionnelle simplifiée sur mobile -->
<T.DirectionalLight
	position={[0, 0.5, 2]}
	intensity={$isSmall ? $lightIntensity * 0.7 : $lightIntensity}
	castShadow={!$isSmall}
	shadow.mapSize.width={$isSmall ? 1024 : 4096}
	shadow.mapSize.height={$isSmall ? 1024 : 4096}
	shadow.bias={0.0001}
/>

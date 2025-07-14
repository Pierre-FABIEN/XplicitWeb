<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { afterNavigate } from '$app/navigation';

	// On importe les stores et la fonction depuis scene3DStore
	import {
		cameraX,
		cameraY,
		cameraZ,
		targetX,
		targetY,
		targetZ
	} from '$lib/store/scene3DStore';
	import { updateCameraPosition } from '$lib/store/scene3DStore';
	import { zoomLevel } from '$lib/store/scene3DStore';

	// MàJ de la caméra après chaque navigation
	afterNavigate(({ to }) => {
		if (!to) return;
		const { pathname } = to.url;
		updateCameraPosition(pathname);
	});
</script>

<T.PerspectiveCamera makeDefault position={[$cameraX * $zoomLevel, $cameraY * $zoomLevel, $cameraZ * $zoomLevel]}>
	<OrbitControls
		target={[$targetX, $targetY, $targetZ]}
		enableDamping
		enableZoom={false}
		enablePan={false}
		enableRotate={false}
	/>
</T.PerspectiveCamera>

<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { afterNavigate } from '$app/navigation';

	// On importe les stores et la fonction depuis animationTimelineStore
	import {
		cameraX,
		cameraY,
		cameraZ,
		targetX,
		targetY,
		targetZ,
		updateCameraPosition
	} from '$lib/store/animationTimelineStore';

	// MàJ de la caméra après chaque navigation
	afterNavigate(({ to }) => {
		const { pathname } = to.url;
		updateCameraPosition(pathname);
	});
</script>

<T.PerspectiveCamera makeDefault position={[$cameraX, $cameraY, $cameraZ]}>
	<OrbitControls
		target={[$targetX, $targetY, $targetZ]}
		enableDamping
		enableZoom={false}
		enablePan={false}
		enableRotate={false}
	/>
</T.PerspectiveCamera>

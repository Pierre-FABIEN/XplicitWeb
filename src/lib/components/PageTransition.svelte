<script lang="ts">
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let isTransitioning = $state(false);
	let currentPath = $state('');

	onMount(() => {
		currentPath = $page.url.pathname;
	});

	$effect(() => {
		const newPath = $page.url.pathname;
		if (newPath !== currentPath) {
			isTransitioning = true;
			
			// Transition de sortie
			setTimeout(() => {
				currentPath = newPath;
				isTransitioning = false;
			}, 150);
		}
	});
</script>

{#if !isTransitioning}
	<div transition:fade={{ duration: 300, delay: 150 }}>
		<slot />
	</div>
{/if}

<style>
	div {
		width: 100%;
		height: 100%;
	}
</style> 
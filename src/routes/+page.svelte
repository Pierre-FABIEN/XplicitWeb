<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { Button } from '$shadcn/button';

	// Using Svelte 5 $state for reactive state
	let isVisible = $state(false);

	// Make the button appear (run "in" transition)
	$effect(() => {
		// When component is mounted, show the button
		isVisible = true;
	});

	// Called when the button is clicked
	function handleClick() {
		// Set isVisible to false to trigger the "out" transition
		isVisible = false;
	}

	// Called when the element with the transition finishes its outro
	function handleOutroEnd() {
		// Now that the animation is done, we can safely navigate
		goto('/atelier');
	}
</script>

<div class="ccc w-screen h-screen">
	{#if isVisible}
		<!-- Apply the fly transition. 
		     "outroend" event is fired after the "out" transition completes. -->
		<div transition:fly={{ y: 50, duration: 400 }} onoutroend={handleOutroEnd}>
			<!-- We remove the href and instead use a click handler -->
			<!-- This ensures the outro transition is completed before navigation -->
			<Button onclick={handleClick}>Je customise ma cannette</Button>
		</div>
	{/if}
</div>

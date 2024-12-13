<script lang="ts">
	import { Button } from '$shadcn/button';
	import pageTransitionStore from '$lib/store/pageTransition';
	import { enter, exit } from './TransitionPage';
</script>

<div
	class="transitionDemo flex justify-center"
	in:enter={{ fromPath: $pageTransitionStore.from?.routeId }}
	out:exit={{ toPath: $pageTransitionStore.to?.routeId }}
>
	<Button href="/UXUI/transitionDemo">Transition</Button>
</div>

<style>
	.transitionDemo {
		display: flex;
		flex-direction: column;
		align-items: center;

		position: absolute;
		top: 0;
		left: 0;
		background-color: blue;
		width: 100vw;
		height: 100vh;
	}
</style>

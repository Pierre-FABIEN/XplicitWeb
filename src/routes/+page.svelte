<script lang="ts">
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/raleway';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { mode } from 'mode-watcher';

	function handleOutroEnd() {
		// Now that the animation is done, we can safely navigate
		goto('/atelier');
	}

	let strokeColor = $state('black');

	$effect(() => {
		if ($mode === 'light') {
			strokeColor = '#00021a';
		} else {
			strokeColor = '#00c2ff';
		}
	});
</script>

<div class="ccc absolute z-30 top-[25vh] left-[10vw]">
	<h1 class="titleHome" style={`-webkit-text-stroke: 2px ${strokeColor};`}>
		<span class="firstline" transition:fly={{ x: -88, duration: 100 }}> Customise ta </span>

		<span class="secondline" transition:fly={{ x: -88, duration: 100 }}> canette et </span>

		<span class="thirdline" transition:fly={{ x: -88, duration: 200 }}> commande la </span>
	</h1>
	<div
		class="ccc buttonHome"
		transition:fly={{ x: -88, duration: 500 }}
		onoutroend={handleOutroEnd}
	>
		<a style="color : {strokeColor}" href="/atelier">Commencer</a>
	</div>
</div>

<style lang="scss">
	.titleHome {
		text-align: center;
		font-family: 'Open Sans Variable', sans-serif;
		font-style: italic;
		text-align: left;
		font-size: 57px;
		-webkit-text-stroke: 2px black;
		color: transparent;
		text-transform: uppercase;
		font-weight: 900;
		width: 100%;
	}

	.firstline,
	.secondline,
	.thirdline {
		position: absolute;
	}

	.titleHome {
		width: 500px;
		height: 200px;
	}

	.firstline {
		font-size: 60px;
		width: 500px;
	}
	.secondline {
		font-size: 75px;
		width: 500px;
		top: 53px;
		left: 100px;
	}
	.thirdline {
		font-size: 56px;
		width: 500px;
		top: 130px;
	}

	.buttonHome {
		margin-top: 5vh;
		border-radius: 16px;
		a {
			font-family: 'Open Sans Variable', sans-serif;
			text-align: left;
			color: black;
			text-transform: uppercase;
			font-size: 22px;
			padding: 6px 40px;
		}
	}
</style>

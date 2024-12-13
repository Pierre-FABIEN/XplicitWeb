<script>
	import SmoothScrollBarStore from '$lib/store/SmoothScrollBarStore';

	// Déclarer les états réactifs
	let lines = $state([]);
	let scrollY = $state(0);

	// Effet pour synchroniser `scrollY` depuis le SmoothScrollBarStore
	$effect(() => {
		SmoothScrollBarStore.subscribe((state) => {
			scrollY = state.scrollY; // Mise à jour de scrollY
		});
	});

	// Effet pour mettre à jour les positions des éléments en fonction de scrollY
	$effect(() => {
		const distance = (scrollY - 30000) / 10;
		lines.forEach((element) => {
			if (element) {
				element.style.transform = `translateX(${distance}px)`;
				element.style.setProperty('--after', `${distance}px`);
				element.style.setProperty('--before', `${distance * 2}px`);
			}
		});
	});
</script>

<div class="containerLines">
	<div class="background">
		{#each Array(7) as _, index (index)}
			<picture bind:this={lines[index]} class="line"></picture>
		{/each}
	</div>
</div>

<style lang="scss">
	.containerLines {
		width: 100vw;
		height: 400vh;
		position: absolute;
		bottom: 0px;
		overflow: hidden;
		z-index: -1;
	}

	.background {
		position: absolute;
		top: 50vh;
		width: 250%;
		height: 200%;
		transform: rotate(-15deg) translate(-150px, -33%);
		opacity: 0.1;
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		justify-content: center;
		align-content: stretch;
		align-items: center;
		z-index: -1;
		overflow: hidden;

		@media screen and (max-width: 650px) {
			display: none;
		}

		.line {
			background-image: url('/background.svg');
			width: 1000%;
			height: 180px;
			transition: all 2s ease-out;
			will-change: transform;
			background-size: 560px auto;

			--after: 0px;
			--before: 0px;

			background-repeat: repeat-x;

			&:after {
				content: ' ';
				background-image: url('/background.svg');
				transform: translateY(60px) translateX(var(--after));
				width: 1000%;
				height: 60px;
				transition: all 2s ease-out;
				will-change: transform;
				position: absolute;
				background-repeat: repeat-x;
			}

			&:before {
				content: ' ';
				background-image: url('/background.svg');
				transform: translateY(120px) translateX(var(--before));
				width: 1000%;
				height: 60px;
				transition: all 2s ease-out;
				will-change: transform;
				position: absolute;
				background-repeat: repeat-x;
			}
		}
	}
</style>

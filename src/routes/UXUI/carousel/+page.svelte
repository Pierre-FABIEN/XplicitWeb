<script lang="ts">
	import EmblaCarousel from 'embla-carousel';
	import AutoScroll from 'embla-carousel-auto-scroll';

	let embla: any;
	let viewport: HTMLElement;

	const options = { loop: true, speed: 2 };
	const slides = Array.from({ length: 8 }, (_, i) => i + 1);

	$effect(() => {
		embla = EmblaCarousel(viewport, options, [AutoScroll({ playOnInit: true, speed: 2 })]);

		// Ajoute les écouteurs d'événements pour arrêter et reprendre le défilement
		viewport.addEventListener('mouseenter', handleMouseEnter);
		viewport.addEventListener('mouseleave', handleMouseLeave);
	});

	function handleMouseEnter() {
		embla.plugins().autoScroll.stop();
	}

	function handleMouseLeave() {
		embla.plugins().autoScroll.play();
	}
</script>

<div class="embla">
	<div class="embla__viewport" bind:this={viewport}>
		<div class="embla__container">
			{#each slides as slide}
				<div class="embla__slide">
					<div class="embla__slide__number">
						<span>{slide}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.embla {
		width: 100%;
		margin: auto;
		--slide-height: 19rem;
		--slide-spacing: 1rem;
		--slide-size: 45%;
	}

	.embla__viewport {
		overflow: hidden;
	}

	.embla__container {
		backface-visibility: hidden;
		display: flex;
		touch-action: pan-y pinch-zoom;
		margin-left: calc(var(--slide-spacing) * -1);
	}

	.embla__slide {
		flex: 0 0 var(--slide-size);
		min-width: 0;
		padding-left: var(--slide-spacing);
	}

	.embla__slide__number {
		box-shadow: inset 0 0 0 0.2rem var(--detail-medium-contrast);
		border-radius: 1.8rem;
		font-size: 4rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--slide-height);
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { AutoScroll } from '@splidejs/splide-extension-auto-scroll';
	import { Splide, SplideSlide } from '@splidejs/svelte-splide';
	import { partenaires } from '$lib/data';

	import '@splidejs/splide/dist/css/themes/splide-default.min.css';

	import '@splidejs/svelte-splide/css/core';
	import { hoverable } from '$UITools/Cursor/cursorHelpers';

	const splideOptions = {
		type: 'loop',
		gap: '10px',
		drag: 'free',
		arrows: false,
		pagination: false,
		perPage: 8,
		autoScroll: {
			pauseOnHover: true,
			pauseOnFocus: true,
			rewind: false,
			speed: 1
		},
		breakpoints: {
			1700: {
				perPage: 8
			},
			1400: {
				perPage: 6
			},
			1100: {
				perPage: 4
			},
			800: {
				perPage: 3
			},
			500: {
				perPage: 2
			}
		}
	};

	onMount(() => {
		const splideSlides = document.querySelectorAll('.splide__slide');
		splideSlides.forEach((slide) => {
			slide.removeAttribute('role');
		});
	});
</script>

<section class="partenaire">
	<h1 class="title">Partenaires</h1>
	<div class="paragraph">
		Nous sommes fiers de notre présence sur de nombreux événements locaux, nationaux et
		internationaux. Nous faisons enfin la différence et c'est grâce à chacun d'entre vous.
	</div>
	<div class="slider-partenaire">
		<Splide options={splideOptions} extensions={{ AutoScroll }} aria-label="Partenaires">
			{#each partenaires as partenaire}
				<SplideSlide role={partenaire.alt}>
					<a class="partenaire-link" href={partenaire.link} use:hoverable={'link'}>
						<img
							src={partenaire.image}
							alt={partenaire.alt}
							class="imgcarousel"
							height="130px"
							width="130px"
						/>
						<p>{partenaire.title}</p>
					</a>
				</SplideSlide>
			{/each}
		</Splide>
	</div>
</section>

<script lang="ts">
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/raleway';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { mode } from 'mode-watcher';
	import { Power } from 'lucide-svelte';
	import { updateCameraPosition } from '$lib/store/animationTimelineStore';
	import { isSmall } from '$lib/store/mediaStore';
	import { page } from '$app/stores';

	let animateLines = $state(false); // Contrôle de l'animation des lignes

	function handleClick() {
		goto('/atelier');
	}

	let strokeColor = $state('black');

	$effect(() => {
		strokeColor = $mode === 'light' ? '#00021a' : '#00c2ff';
	});

	const onHoverButton = () => {
		animateLines = !animateLines;
	};

	$effect(() => {
		// Les deux lectures ci-dessous sont les dépendances ;
		// le $effect se relancera si l’une change.
		const path = $page.url.pathname;
		const small = $isSmall;

		updateCameraPosition(path);
	});
</script>

<div class="containerHome ccc absolute z-30 top-[25vh] left-[10vw]">
	<h1 class="titleHome" style={`-webkit-text-stroke-color: ${strokeColor};`}>
		<span
			class="firstline {animateLines ? 'hovered' : ''}"
			transition:fly={{ x: -88, duration: 100 }}
		>
			Customise ta
		</span>

		<span
			class="secondline {animateLines ? 'hovered' : ''}"
			transition:fly={{ x: -88, duration: 100 }}
		>
			canette et
		</span>

		<span
			class="thirdline {animateLines ? 'hovered' : ''}"
			transition:fly={{ x: -88, duration: 200 }}
		>
			commande la
		</span>
	</h1>
	<button
		class="ccc buttonHome"
		transition:fly={{ x: -88, duration: 500 }}
		onclick={handleClick}
		onmouseenter={onHoverButton}
		onmouseleave={onHoverButton}
	>
		<a
			class="buttonStart rcc"
			style="color: {strokeColor}; --stroke-color: {strokeColor};"
			href="/atelier"
		>
			Commencer
			<span>
				<Power class="ml-10" />
			</span>
		</a>
	</button>
	<a class="buttonCatalogue" href="/catalogue" transition:fly={{ x: -88, duration: 600 }}>
		Notre catalogue
	</a>
</div>

<style lang="scss">
	@media screen and (max-width: 1000px) {
		.containerHome {
			top: 5vh;
			left: 50vw;
			transform: translate(-50%, 0%);
			width: 500px;
		}
	}

	@media screen and (max-width: 600px) {
		.containerHome {
			width: 400px !important;
		}
		.titleHome {
			width: 400px !important;
		}
		.firstline {
			font-size: 40px !important;
			width: 400px !important;
		}
		.secondline {
			font-size: 50px !important;
			width: 400px !important;
		}
		.thirdline {
			font-size: 40px !important;
			width: 400px !important;
		}
	}

	@media screen and (max-width: 425px) {
		.containerHome {
			width: 300px !important;
		}
		.titleHome {
			width: 300px !important;
			-webkit-text-stroke-width: 1px !important;
			height: 100px !important;
		}
		.firstline {
			font-size: 30px !important;
			width: 300px !important;
		}
		.secondline {
			font-size: 40px !important;
			width: 250px !important;
			top: 25px !important;
			left: 50px !important;
		}
		.thirdline {
			font-size: 30px !important;
			width: 300px !important;
			top: 65px !important;
		}
	}

	.titleHome {
		text-align: center;
		font-family: 'Open Sans Variable', sans-serif;
		font-style: italic;
		text-align: left;
		font-size: 57px;
		-webkit-text-stroke-color: black;
		-webkit-text-stroke-width: 2px;
		color: transparent;
		text-transform: uppercase;
		font-weight: 900;
		width: 100%;
	}

	.firstline,
	.secondline,
	.thirdline {
		position: absolute;
		transition: transform 0.4s ease-in-out;
	}

	.firstline.hovered {
		transform: translateX(40px);
	}

	.secondline.hovered {
		transform: translateX(50px);
	}

	.thirdline.hovered {
		transform: translateX(20px);
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
		transform: translateX(33px);

		a {
			font-family: 'Open Sans Variable', sans-serif;
			text-align: left;
			color: black;
			text-transform: uppercase;
			font-size: 22px;

			span {
				transform: translateY(35px);
				transition: all 0.4s ease-in-out;
			}
		}
		&:hover {
			a {
				span {
					transform: translateY(0px);
				}
			}
		}
	}

	.buttonStart {
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			z-index: -1;
			top: 0;
			left: 0;
			width: 10px;
			height: 2px;
			background-color: var(--stroke-color);
			transition: all 0.4s;
		}
		&:hover {
			&::before {
				width: 200px;
			}
		}
	}

	.buttonCatalogue {
		margin-top: 15px;
		font-family: 'Open Sans Variable', sans-serif;
		font-size: 14px;
		letter-spacing: 0px;
		transition: all 0.25s ease-in-out;

		&:hover {
			letter-spacing: 1px;
		}
	}
</style>

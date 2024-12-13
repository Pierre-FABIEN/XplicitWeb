<script>
	import { page } from '$app/stores';
	import '@fontsource-variable/open-sans';

	let currentPath = $state('');
	let activeIndex = $state(0);
	let lineHeight = $state(0);

	// Définition des liens du menu
	let links = [
		{ href: '/presentation', label: 'Présentation' },
		{ href: '/stack', label: 'Stack' },
		{ href: '/installation', label: 'Installation' },
		{ href: '/render', label: 'Setup on Render' },
		{ href: '/', label: 'Documentation' }
	];

	// Récupération du chemin actuel
	$effect(() => {
		currentPath = $page.url.pathname;
	});

	// Calcul de l'index actif basé sur l'URL
	$effect(() => {
		activeIndex = links.findIndex((l) => l.href === currentPath);
		if (activeIndex === -1) activeIndex = 0; // si aucune correspondance, premier élément par défaut
	});

	// Calcul de la hauteur du trait
	$effect(() => {
		lineHeight = (activeIndex + 1) * 30;
	});
</script>

<sidebar class="sidebarStyle">
	<nav aria-label="Navigation principale">
		<ul>
			{#each links as link, i}
				<li class={currentPath === link.href ? 'active' : ''}>
					<a href={link.href}>{link.label}</a>
				</li>
			{/each}
		</ul>
	</nav>
	<!-- Trait vertical orange -->
	<div class="line-indicator" style="height: {lineHeight}px;"></div>
</sidebar>

<style lang="scss">
	.sidebarStyle {
		width: 200px;
		position: fixed;
		font-family: 'Open Sans Variable', sans-serif;
		font-weight: 400;
		right: 5vw;
		top: 20vh;
		z-index: 1;

		display: flex;
		flex-direction: column;
		align-items: flex-start;

		nav {
			position: relative;
			ul {
				font-size: 17px;
				padding-left: 20px; // Décale le texte, place les puces
				list-style: disc; // Puces devant chaque li
				margin: 0;
				li {
					margin: 0;
					height: 30px; // Hauteur de chaque élément, utilisée pour le calcul du trait
					display: flex;
					align-items: center; // Pour centrer verticalement le texte
					transition: all 0.3s ease;
					border-bottom: 0px solid #fd4000;

					// ::after {
					// 	content: ' ';
					// 	display: block;
					// 	width: 0px;
					// 	height: 30px;
					// 	transform: translateX(-15px) translateY(-30px);
					// 	background-color: #fd4000;
					// 	transition: all 0.3s ease;
					// }

					&.active {
						color: #fd4000;

						::after {
							width: 100%;
						}
					}
				}
			}
		}

		.line-indicator {
			position: absolute;
			left: 3px; // Place le trait près des puces
			top: -16px; // Le trait démarre maintenant à 0, sans décalage négatif
			width: 1px;
			background: #fd4000;
			transition: height 0.3s ease;
		}
	}
</style>

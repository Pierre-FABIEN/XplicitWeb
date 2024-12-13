<script>
	// Supports weights 300-800
	import '@fontsource-variable/open-sans';
	import { fly } from 'svelte/transition';
</script>

<div
	in:fly={{ x: 1000, duration: 500 }}
	out:fly={{ x: -1000, duration: 500 }}
	class="flex flex-col absolute top-0 items-center justify-center mt-20 w-full max-w-5xl overflow-hidden"
>
	<h1 class="w-[100%] text-center text-9xl font-light leading-tight mb-8 text-[#fd4000]">
		Présentation
	</h1>

	<div class="container cardEffect text-center space-y-6 rounded backdrop-blur-sm">
		<!-- Header -->
		<p class="description">
			Marre de passer des heures à assembler des solutions, à configurer les grandes lignes pour
			obtenir un site complet ? Ce boilerplate est là pour simplifier votre vie ! Avec ce modèle
			prêt à l’emploi, démarrez vos projets en un éclair. Temps réel avec <strong>WebSocket</strong>
			?
			<strong>CRUD</strong>, <strong>Formulaires</strong> et <strong>validations</strong> ?
			<strong>Sitemap</strong>, <strong>authentification sécurisée</strong> en béton, gestion des
			<strong>paiements</strong> ? La <strong>3D</strong> à disposition,
			<strong>transition de pages</strong>,
			<strong>Mise en production</strong> et plus. Tout est déjà là. Fini les casses-têtes, place à
			la
			<strong>créativité</strong>. Lancez-vous et créez des sites modernes sans perdre une seconde
			sur les détails techniques. Vous avez tous les <strong>exemples</strong> et une
			<strong>documentation</strong>. Non, ce n'est pas un rêve : c'est ce boilerplate.
		</p>
		<!-- Action Buttons -->
		<div class="mt-8 flex justify-center space-x-4">
			<a href="/stack" class="presentationButton"> La stack </a>
		</div>
	</div>
</div>

<style lang="scss">
	.container {
		width: 800px;
		max-width: 80vw;
		padding: 40px 20px;
	}

	.presentationButton {
		padding: 5px 20px;
		border-radius: 5px;

		border: 1px solid #fd4000;
		box-shadow: 0px 0px 5px 2px #82828260;
		display: flex;
		align-items: center;
		justify-content: center;

		font-weight: lighter;
		cursor: pointer;
		transition: all 0.15s ease-in-out;

		&:hover {
			background-color: #fd4000;
		}
	}

	.description {
		font-family: 'Open Sans Variable', sans-serif;
		text-align: justify;
		line-height: 175%;
		padding: 5px 20px;
		font-size: 18px;
		line-height: 150%;
		font-weight: 200;
		strong {
			color: #fd4000;
		}
	}
</style>

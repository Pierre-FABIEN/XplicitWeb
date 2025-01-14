<script>
	import * as AlertDialog from '$shadcn/alert-dialog';

	let { showTutoriel, currentStep, closeTutoriel } = $props();

	const tutorialSteps = [
		{
			title: 'Vous êtes nouveau sur le site !',
			description: `
				Voulez vous acceder au tutoriel afin de comprendre comment fonctionne cet outil ?`,
			actionText: 'Tutoriel'
		},
		{
			title: "Télécharger le modèle d'exemple",
			description: `
				Nous vous conseillons dans un premier temps le téléchargement du modèle exemple qui vous
				permettra de réaliser votre canette personnalisée.`,
			actionText: 'Ensuite ?'
		},
		{
			title: 'Testez votre modèle sur le site',
			description: `
				Une fois votre modèle designé, cliquez sur le bouton à gauche : <FileSliders />
				Sélectionnez le goût que vous souhaitez dans votre canette customisée ainsi que la quantité.
				Ensuite, il ne vous reste plus qu'à le mettre dans le panier et passer en caisse.`,
			actionText: 'Autre chose ?'
		},
		{
			title: 'Donne-moi en plus !',
			description: `
				Une fois votre modèle en vision, cliquez sur le bouton à droite : <FileSliders />
				Sélectionnez les options disponibles pour les lumières et effets qui pourraient vous intéresser.`,
			actionText: 'Terminé'
		}
	];

	let currentState = $state(localStorage.getItem('disableTutorial') === 'true');

	/**
	 * Toggles the "do not show again" preference
	 * and saves it to localStorage.
	 */
	function dontShowAgain() {
		currentState = !currentState;
		localStorage.setItem('disableTutorial', currentState ? 'true' : 'false');
	}
</script>

<AlertDialog.Root bind:open={showTutoriel}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{tutorialSteps[currentStep]?.title}</AlertDialog.Title>
			<AlertDialog.Description
				>{@html tutorialSteps[currentStep]?.description}</AlertDialog.Description
			>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<div class="rcb w-[100%]">
				<!-- Checkbox with proper binding -->
				<label>
					<input type="checkbox" bind:checked={currentState} onclick={dontShowAgain} />
					Ne plus afficher ce message
				</label>
				<div class="">
					<AlertDialog.Action onclick={closeTutoriel}>Fermer</AlertDialog.Action>
					{#if currentStep > 0}
						<AlertDialog.Action onclick={() => (currentStep -= 1)}>Précédent</AlertDialog.Action>
					{/if}
					{#if currentStep < tutorialSteps.length - 1}
						<AlertDialog.Action onclick={() => (currentStep += 1)}>
							{tutorialSteps[currentStep]?.actionText}
						</AlertDialog.Action>
					{:else}
						<AlertDialog.Action onclick={closeTutoriel}>Terminé</AlertDialog.Action>
					{/if}
				</div>
			</div>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<script>
	import * as AlertDialog from '$shadcn/alert-dialog';

	let { showTutoriel } = $props();
	let currentStep = $state(0);

	// Synchronise showTutoriel avec currentStep
	$effect(() => {
		showTutoriel = currentStep !== -1;
	});

	// Ferme le dialogue et réinitialise currentStep
	function closeDialog() {
		currentStep = -1;
		showTutoriel = false;
	}

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
			<AlertDialog.Cancel onclick={closeDialog}>Cancel</AlertDialog.Cancel>
			{#if currentStep < tutorialSteps.length - 1}
				<AlertDialog.Action onclick={() => (currentStep += 1)}>
					{tutorialSteps[currentStep]?.actionText}
				</AlertDialog.Action>
			{:else}
				<AlertDialog.Action onclick={closeDialog}>Terminé</AlertDialog.Action>
			{/if}
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

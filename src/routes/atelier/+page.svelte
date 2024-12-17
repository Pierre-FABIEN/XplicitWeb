<script lang="ts">
	import { Button } from '$shadcn/button';
	import * as Sheet from '$shadcn/sheet/index.js';
	import { buttonVariants } from '$shadcn/button/index.js';
	import { Input } from '$shadcn/input/index.js';
	import { Label } from '$shadcn/label/index.js';
	import * as RadioGroup from '$lib/components/shadcn/ui/radio-group/index.js';
	import * as Tooltip from '$shadcn/tooltip/index.js';

	import { FileSliders } from 'lucide-svelte';
	import Threltre from '$lib/components/threlte/Threltre.svelte';
	import { addToCart } from '$lib/store/Data/cartStore';
	import { textureStore } from '$lib/store/textureStore';

	// Exemple de données pour l'article
	const article = {
		productId: '123', // Référence à l'ID du produit existant dans la base de données
		quantity: 1, // Quantité commandée
		price: 29.99 // Prix unitaire du produit
	};

	/**
	 * Gère le changement de fichier et met à jour le store global pour la texture.
	 * @param event - Event de l'input file
	 */
	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			if (file.type === 'image/png') {
				// Générer une URL temporaire pour l'image
				const textureUrl = URL.createObjectURL(file);

				// Mettre à jour le store global
				textureStore.set(textureUrl);

				console.log('Texture mise à jour avec succès :', textureUrl);
			} else {
				alert('Veuillez télécharger un fichier PNG.');
			}
		}
	}

	function handleAddToCart() {
		addToCart(article);
		console.log('Article ajouté au panier :', article);
	}
</script>

<div class="h-screen w-screen">
	<Sheet.Root>
		<Sheet.Trigger class={buttonVariants({ variant: 'outline' })}>
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<FileSliders />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Option</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</Sheet.Trigger>
		<Sheet.Content side="left">
			<Sheet.Header>
				<Sheet.Title>Modifier la texture</Sheet.Title>
				<Sheet.Description>
					Uploadez une nouvelle texture PNG pour l'appliquer au modèle.
				</Sheet.Description>
			</Sheet.Header>
			<div class="grid gap-4 py-4">
				<h2>Choisissez la texture de votre boisson</h2>

				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="file" class="text-right">Upload</Label>
					<Input
						id="file"
						type="file"
						accept=".png"
						onchange={handleFileUpload}
						class="col-span-3"
					/>
				</div>

				<h2>Choisissez le gout de votre boisson</h2>
				<RadioGroup.Root value="comfortable">
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="default" id="r1" />
						<Label for="r1">Default</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="comfortable" id="r2" />
						<Label for="r2">Comfortable</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="compact" id="r3" />
						<Label for="r3">Compact</Label>
					</div>
				</RadioGroup.Root>

				<h2>Choisissez le nombre de cannettes</h2>
				<RadioGroup.Root value="comfortable">
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="default" id="r1" />
						<Label for="r1">Default</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="comfortable" id="r2" />
						<Label for="r2">Comfortable</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="compact" id="r3" />
						<Label for="r3">Compact</Label>
					</div>
				</RadioGroup.Root>
			</div>
			<Sheet.Footer>
				<Button onclick={handleAddToCart}>Ajouter au panier</Button>
				<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Fermer</Sheet.Close>
			</Sheet.Footer>
		</Sheet.Content>
	</Sheet.Root>

	<!-- Threltre avec texture dynamique -->
	<Threltre />
</div>

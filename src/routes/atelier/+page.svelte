<script lang="ts">
	import { Button } from '$shadcn/button';
	import * as Sheet from '$shadcn/sheet/index.js';
	import { buttonVariants } from '$shadcn/button/index.js';
	import { Input } from '$shadcn/input/index.js';
	import { Label } from '$shadcn/label/index.js';
	import * as Tooltip from '$shadcn/tooltip/index.js';
	import * as Popover from '$lib/components/shadcn/ui/popover/index.js';

	import { Check, ChevronsUpDown, FileSliders } from 'lucide-svelte';
	import Threltre from '$lib/components/threlte/Threltre.svelte';

	import { textureStore } from '$lib/store/textureStore';
	import { tick } from 'svelte';
	import { Textarea } from '$lib/components/shadcn/ui/textarea/index.js';
	import { createCustomSchema } from '$lib/schema/products/customSchema.js';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const customForm = superForm(data.IcreateCustomSchema, {
		validators: zodClient(createCustomSchema),
		id: 'createCustom'
	});

	const { form: customData, enhance: customEnhance, message: customMessage } = customForm;
	console.log(data);

	$effect(() => {
		console.log('dhgrdr', $customData);
	});
	$effect(() => {
		$customData.image = $textureStore;
	});

	let selectedProductId = $state('');
	let selectedQuantity = $state(1);

	let openProductPopover = $state(false);
	let openQuantityPopover = $state(false);

	let triggerProductRef = $state<HTMLButtonElement>(null!);
	let triggerQuantityRef = $state<HTMLButtonElement>(null!);

	// Fermer et recentrer le bouton produit
	function closeAndFocusProductTrigger() {
		openProductPopover = false;
		tick().then(() => triggerProductRef.focus());
	}

	// Fermer et recentrer le bouton quantité
	function closeAndFocusQuantityTrigger() {
		openQuantityPopover = false;
		tick().then(() => triggerQuantityRef.focus());
	}

	// Récupérer le produit sélectionné
	const selectedProduct = $derived(
		data.products.find((product) => product.id === selectedProductId)
	);

	// Générer les options de quantité
	function generateQuantityOptions(stock: number) {
		return Array.from({ length: Math.min(stock, 10) }, (_, i) => i + 1); // Max 10
	}

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
				console.log('textureUrl', textureUrl);

				// Mettre à jour le store global
				textureStore.set(textureUrl);
				$customData.textureUrl = textureUrl;
				console.log('Texture mise à jour avec succès :', file, textureUrl);
			} else {
				alert('Veuillez télécharger un fichier PNG.');
			}
		}
	}

	$effect(() => {
		if ($customMessage === 'Custom field created successfully') {
			toast($customMessage);
		}
	});
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
			<form method="POST" action="?/createCustom" use:customEnhance>
				<Sheet.Header>
					<Sheet.Title>Modifier la texture</Sheet.Title>
					<Sheet.Description>
						Uploadez une nouvelle texture PNG pour l'appliquer au modèle.
					</Sheet.Description>
				</Sheet.Header>
				<div class="grid gap-4 py-4">
					<h2>Choisissez la texture de votre boisson</h2>

					<div class="grid grid-cols-4 items-center gap-4 border rounded p-1">
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

					<!-- Popover pour sélectionner un produit -->
					<Popover.Root bind:open={openProductPopover}>
						<Popover.Trigger bind:ref={triggerProductRef}>
							<Button
								variant="outline"
								class="justify-between w-full"
								role="combobox"
								aria-expanded={openProductPopover}
							>
								{selectedProduct?.name || 'Choisissez un produit'}
								<ChevronsUpDown class="opacity-50" />
							</Button>
						</Popover.Trigger>
						<Popover.Content class="w-[300px] p-2">
							<Popover.Content class="w-[300px] p-2">
								{#each data.products as product}
									<Button
										variant="ghost"
										class="w-full justify-between"
										onclick={() => {
											selectedProductId = product.id;
											closeAndFocusProductTrigger();
										}}
									>
										<span>{product.name}</span>
										<span class="text-sm text-gray-500">Stock: {product.stock}</span>
										{#if selectedProductId === product.id}
											<Check />
										{/if}
									</Button>
								{/each}
							</Popover.Content>
						</Popover.Content>
					</Popover.Root>

					{#if selectedProduct}
						<Popover.Root bind:open={openQuantityPopover}>
							<Popover.Trigger bind:ref={triggerQuantityRef}>
								<Button
									variant="outline"
									class="justify-between w-full"
									role="combobox"
									aria-expanded={openQuantityPopover}
								>
									Quantité: {selectedQuantity}
									<ChevronsUpDown class="opacity-50" />
								</Button>
							</Popover.Trigger>
							<Popover.Content class="w-[300px] p-2">
								{#each generateQuantityOptions(selectedProduct.stock) as quantity}
									<Button
										variant="ghost"
										class="w-full justify-between"
										onclick={() => {
											selectedQuantity = quantity;
											closeAndFocusQuantityTrigger();
										}}
									>
										<span>{quantity}</span>
										{#if selectedQuantity === quantity}
											<Check />
										{/if}
									</Button>
								{/each}
							</Popover.Content>
						</Popover.Root>
					{/if}

					<h2>Vous voulez rajouter quelque chose ?</h2>
					<Textarea placeholder="Type your message here." />
				</div>
				<Sheet.Footer>
					<Button>Ajouter au panier</Button>
					<Sheet.Close class={buttonVariants({ variant: 'outline' })}>Fermer</Sheet.Close>
				</Sheet.Footer>
			</form>
		</Sheet.Content>
	</Sheet.Root>

	<!-- Threltre avec texture dynamique -->
	<Threltre />
</div>

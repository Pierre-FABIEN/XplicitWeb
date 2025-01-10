<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { Textarea } from '$shadcn/textarea';
	import * as Sheet from '$shadcn/sheet';
	import * as Tooltip from '$shadcn/tooltip';
	import { filesFieldProxy, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createCustomSchema } from '$lib/schema/products/customSchema';
	import { toast } from 'svelte-sonner';
	import { buttonVariants } from '$shadcn/button';
	import { Box, Move3d, ShieldQuestion } from 'lucide-svelte';
	import { textureStore } from '$lib/store/textureStore.js';
	import Tutoriel from '$lib/components/Tutoriel/Tutoriel.svelte';
	import { addToCart } from '$lib/store/Data/cartStore.js';

	// Props passed from the page load function
	let { data } = $props();

	// Initialize the superForm using the schema and data from the load function
	const createCustom = superForm(data.IcreateCustomSchema, {
		validators: zodClient(createCustomSchema),
		id: 'createCustom',
		onSubmit: ({ cancel }) => {
			// Vérifiez si l'utilisateur est connecté
			if (!data.user) {
				toast.error('Veuillez vous connecter pour ajouter au panier.');
				cancel(); // Annule la soumission
			}
		},
		onResult: (dataReturn) => {
			const result = dataReturn.result.data.form.message.data;

			if (result) {
				addToCart(result);
			}

			editModel = false;
		}
	});

	const {
		form: createCustomData,
		enhance: createCustomEnhance,
		message: createCustomMessage
	} = createCustom;

	// Files proxy for image field
	const fileProxy = filesFieldProxy(createCustom, 'image');
	const { values: fileValues } = fileProxy;

	let selectedProductStock = $state(0);

	// We have an array of products from the load function
	// We will allow the user to select one productId
	let products = $state(data.products || []);
	let editModel = $state(false);

	let showTutoriel = $state(false);
	let currentStep = $state(0);

	const openTutoriel = () => {
		showTutoriel = true;
		currentStep = 0;
	};

	// Ferme le dialogue et réinitialise currentStep
	const closeTutoriel = () => {
		showTutoriel = false;
		currentStep = 0;
	};

	$effect(() => {
		// if (data.user === null) {
		// 	console.log('User is not logged in');
		// 	showTutoriel = true;
		// } else {
		// 	showTutoriel = false;
		// }
	});

	// On success, if a message is returned, we can redirect or show a toast
	$effect(() => {
		if ($createCustomMessage === 'Custom created successfully') {
			toast.success($createCustomMessage);
		}
	});

	$effect(() => {
		if ($fileValues && $fileValues.length > 0) {
			// Crée une URL locale pour l'image sélectionnée
			const url = URL.createObjectURL($fileValues[0]);
			// Met à jour le store avec la nouvelle texture
			textureStore.set(url);
		}
	});

	let quantityOptions = $state([
		{ label: '24 packs de 24 canettes (576 unités)', value: 576 },
		{ label: '1/4 de palette : 30 packs (720 unités)', value: 720 },
		{ label: '1/2 palette : 60 packs (1 440 unités)', value: 1440 },
		{ label: '1 palette : 120 packs (2 880 unités)', value: 2880 },
		{ label: '3 palettes : 360 packs (8 640 unités)', value: 8640 }
	]);

	// Fonction pour mettre à jour la quantité basée sur l'option sélectionnée
	function handleQuantityOptionChange(event: Event) {
		const selectedValue = parseInt((event.target as HTMLSelectElement).value, 10);
		if (!isNaN(selectedValue)) {
			$createCustomData.quantity = selectedValue;
		}
	}
</script>

<div class="ccc w-[100vw] absolute z-50 bottom-[-90vh] left-0">
	<div class="rcb max-w-[800px] w-[80vw]">
		<Sheet.Root bind:open={editModel}>
			<Sheet.Trigger class={`  w-[80px] h-[80px]  ${buttonVariants({ variant: 'outline' })}`}>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Box style="width: 25px; height: 25px" />
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Option</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Sheet.Trigger>
			<Sheet.Content side="left">
				<form
					method="POST"
					enctype="multipart/form-data"
					action="?/createCustom"
					use:createCustomEnhance
					class="space-y-4"
				>
					<!-- Image upload field -->
					<Form.Field name="image" form={createCustom}>
						<Form.Control>
							<Form.Label>Image</Form.Label>
							<div
								class="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center relative"
							>
								<input
									name="image"
									type="file"
									class="absolute w-full h-full opacity-0 cursor-pointer z-10"
									accept="image/png, image/jpeg, image/webp"
									bind:files={$fileValues}
								/>
								<!-- UI for dropzone -->
								<div class="pointer-events-none text-center">
									<svg
										class="mx-auto h-12 w-12 text-gray-400"
										stroke="currentColor"
										fill="none"
										viewBox="0 0 48 48"
										aria-hidden="true"
									>
										<path
											d="M28 8H20v12H8v8h12v12h8V28h12v-8H28V8z"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										></path>
									</svg>
									<p class="mt-2 text-sm text-gray-600">Click or drop an image file</p>
									<p class="text-xs text-gray-500">PNG, JPG, WEBP up to 1MB</p>
								</div>
							</div>

							<!-- Preview selected image -->
							{#if $fileValues?.length > 0}
								<div class="mt-3 flex flex-wrap gap-2">
									{#each $fileValues as image}
										<div class="relative w-[65px] h-[65px]">
											<img
												src={URL.createObjectURL(image)}
												alt=""
												class="w-full h-full object-cover rounded"
											/>
										</div>
									{/each}
								</div>
							{/if}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<!-- Product selection field -->
					<Form.Field name="productId" form={createCustom}>
						<Form.Control>
							<Form.Label>Product</Form.Label>
							<select
								name="productId"
								class="border rounded px-3 py-2 w-full"
								bind:value={$createCustomData.productId}
							>
								<option value="" disabled selected>Select a product...</option>
								{#each products as product}
									<option value={product.id}>{product.name}</option>
								{/each}
							</select>
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field name="quantity" form={createCustom}>
						<Form.Control>
							<Form.Label>Special Quantity Options</Form.Label>
							<select
								name="quantity"
								class="border rounded px-3 py-2 w-full"
								onchange={handleQuantityOptionChange}
							>
								<option value="" disabled selected>Select a quantity option...</option>
								{#each quantityOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<!-- Message field -->
					<Form.Field name="userMessage" form={createCustom}>
						<Form.Control>
							<Form.Label>Message</Form.Label>
							<Textarea name="userMessage" bind:value={$createCustomData.userMessage} />
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Button type="submit">Create Custom</Button>
				</form>
			</Sheet.Content>
		</Sheet.Root>

		<div>
			<Button onclick={openTutoriel} aria-label="Ouvrir le tutoriel">
				<ShieldQuestion style="width: 25px; height: 25px" />
			</Button>
			<Tutoriel {showTutoriel} {currentStep} {closeTutoriel} />
		</div>
	</div>
</div>

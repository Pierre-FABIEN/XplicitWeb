<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Button } from '$shadcn/button';
	import { Textarea } from '$shadcn/textarea';
	import * as Sheet from '$shadcn/sheet';
	import * as Tooltip from '$shadcn/tooltip';
	import { Slider } from '$lib/components/shadcn/ui/slider/index.js';
	import { filesFieldProxy, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createCustomSchema } from '$lib/schema/products/customSchema';
	import { toast } from 'svelte-sonner';
	import { buttonVariants } from '$shadcn/button';
	import { Box, Move3d, ShieldQuestion, ZoomIn, Sun } from 'lucide-svelte';
	import { textureStore, zoomLevel, lightIntensity } from '$lib/store/scene3DStore';
	import Tutoriel from '$lib/components/Tutoriel/Tutoriel.svelte';
	import { addToCart } from '$lib/store/Data/cartStore.js';
	import { fly } from 'svelte/transition';

	let { data } = $props();

	// Configuration superForm
	const createCustom = superForm(data.IcreateCustomSchema, {
		validators: zodClient(createCustomSchema),
		id: 'createCustom',
		onSubmit: ({ cancel }) => {
			if (!data.user) {
				toast.error('Veuillez vous connecter pour ajouter au panier.');
				cancel();
			}
		},
		onResult: (dataReturn) => {
			if (dataReturn.result.type === 'success' && dataReturn.result.data?.form?.message?.data) {
				addToCart(dataReturn.result.data.form.message.data);
			}
			editModel = false;
		}
	});

	const {
		form: createCustomData,
		enhance: createCustomEnhance,
		message: createCustomMessage
	} = createCustom;

	const fileProxy = filesFieldProxy(createCustom, 'image');
	const { values: fileValues } = fileProxy;

	let products = $state(data.products || []);
	let editModel = $state(false);

	let showTutoriel = $state(false);
	let currentStep = $state(0);

	// Variables pour les contrôles de zoom et lumière
	let zoomLevelValue = $state(1);
	let lightIntensityValue = $state(8);

	// Synchroniser avec les stores
	$effect(() => {
		zoomLevel.set(zoomLevelValue);
	});

	$effect(() => {
		lightIntensity.set(lightIntensityValue);
	});

	// Réinitialiser les contrôles quand on quitte l'atelier
	$effect(() => {
		return () => {
			// Cette fonction se déclenche quand le composant est détruit
			zoomLevel.set(1);
			lightIntensity.set(8);
		};
	});

	const openTutoriel = () => {
		showTutoriel = true;
		currentStep = 0;
	};

	const closeTutoriel = () => {
		showTutoriel = false;
		currentStep = 0;
	};

	$effect(() => {
		const disableTutorial = localStorage.getItem('disableTutorial') === 'true';
		if (data.user === null && !disableTutorial) {
			openTutoriel();
		}
	});

	$effect(() => {
		if ($createCustomMessage === 'Custom created successfully') {
			toast.success($createCustomMessage);
		}
	});

	$effect(() => {
		if ($fileValues && $fileValues.length > 0) {
			const url = URL.createObjectURL($fileValues[0]);
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

	function handleQuantityOptionChange(event: Event) {
		const selectedValue = parseInt((event.target as HTMLSelectElement).value, 10);
		if (!isNaN(selectedValue)) {
			$createCustomData.quantity = selectedValue;
		}
	}

	// Initialiser avec une quantité par défaut
	$effect(() => {
		if (!$createCustomData.quantity) {
			$createCustomData.quantity = 576; // Quantité par défaut
		}
	});
</script>

<!-- Conteneur global -->
<div class="ccc w-[100vw] absolute z-50 bottom-[-88vh] left-0">
	<div class="rcb max-w-[800px] w-[80vw]">
		<!-- 1) Bouton pour ouvrir le Sheet (enveloppé dans un <div>) -->
		<div class="rbs">
										<!-- 3) Contrôles de zoom et lumière -->

			<!-- Contrôle du zoom -->
			<div transition:fly={{ y: 100, duration: 800, opacity: 0.2, delay: 200 }}  class="flex items-center mx-5">
				<ZoomIn style="width: 20px; height: 20px" class="text-gray-600 dark:text-gray-400 m-2" />
				<div class="flex-1">
					<label for="zoom-slider" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Zoom</label>
					<Slider id="zoom-slider" type="single" bind:value={zoomLevelValue} max={3} min={0.5} step={0.1}  class="w-[120px]"/>
					<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{zoomLevelValue.toFixed(1)}x</div>
				</div>
			</div>

			<!-- Contrôle de l'intensité lumineuse -->
			<div transition:fly={{ y: 100, duration: 800, opacity: 0.2, delay: 200 }}  class="flex items-center mx-5">
				<Sun style="width: 20px; height: 20px" class="text-gray-600 dark:text-gray-400 m-2" />
				<div class="flex-1">
					<label for="light-slider" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Intensité lumineuse</label>
					<Slider id="light-slider" type="single" bind:value={lightIntensityValue} max={15} min={1} step={0.5} class="w-[120px]" />
					<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">{lightIntensityValue.toFixed(1)}</div>
				</div>
			</div>

			<div class="rbc">
				<div transition:fly={{ y: 100, duration: 400, opacity: 0.2 }}>
					<Sheet.Root bind:open={editModel}>
						<Sheet.Trigger class={`w-[80px] h-[80px] ${buttonVariants({ variant: 'outline' })}`}>
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
						<Sheet.Content side="left" class="ccs w-[80%] pt-10">
							<form
								method="POST"
								enctype="multipart/form-data"
								action="?/createCustom"
								use:createCustomEnhance
								class="space-y-4"
							>
								<!-- Image -->
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
													/>
												</svg>
												<p class="mt-2 text-sm text-gray-600">Click or drop an image file</p>
												<p class="text-xs text-gray-500">PNG, JPG, WEBP up to 1MB</p>
											</div>
										</div>

										<!-- Preview -->
										{#if $fileValues?.length > 0}
											<div class="mt-3 flex flex-wrap gap-2">
												{#each $fileValues as image}
													<div class="relative w-[65px] h-[65px]">
														<img
															src={URL.createObjectURL(image)}
															alt="preview"
															class="w-full h-full object-cover rounded"
														/>
													</div>
												{/each}
											</div>
										{/if}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<!-- Product selection -->
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

								<!-- Quantity Options -->
								<Form.Field name="quantity" form={createCustom}>
									<Form.Control>
										<Form.Label>Special Quantity Options</Form.Label>
										<select
											name="quantity"
											class="border rounded px-3 py-2 w-full"
											onchange={handleQuantityOptionChange}
											required
										>
											<option value="" disabled selected>Select a quantity option...</option>
											{#each quantityOptions as option}
												<option value={option.value} selected={$createCustomData.quantity === option.value}>{option.label}</option>
											{/each}
										</select>
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>

								<!-- Message -->
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
				</div>
		
				<div transition:fly={{ y: 100, duration: 500, opacity: 0.2, delay: 100 }}>
					<Button onclick={openTutoriel} aria-label="Ouvrir le tutoriel" class="mx-2 w-[80px] h-[80px]">
						<ShieldQuestion style="width: 25px; height: 25px" />
					</Button>
					<Tutoriel {showTutoriel} {currentStep} {closeTutoriel} />
				</div>
			</div>
		</div>
	</div>
</div>

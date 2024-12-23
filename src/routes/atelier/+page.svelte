<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { Textarea } from '$shadcn/textarea';
	import * as Sheet from '$shadcn/sheet';
	import * as AlertDialog from '$shadcn/alert-dialog';
	import * as Tooltip from '$shadcn/tooltip';
	import { filesFieldProxy, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createCustomSchema } from '$lib/schema/products/customSchema';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { buttonVariants } from '$shadcn/button';
	import { Box, Move3d, ShieldQuestion } from 'lucide-svelte';
	import { textureStore } from '$lib/store/textureStore.js';
	import Tutoriel from '$lib/components/Tutoriel/Tutoriel.svelte';

	// Props passed from the page load function
	let { data } = $props();
	// data: { IcreateCustomSchema: ReturnTypeOfSuperValidate, products: ArrayOfProducts }

	// Initialize the superForm using the schema and data from the load function
	const createCustom = superForm(data.IcreateCustomSchema, {
		validators: zodClient(createCustomSchema),
		id: 'createCustom'
	});

	const {
		form: createCustomData,
		enhance: createCustomEnhance,
		message: createCustomMessage
	} = createCustom;

	// Files proxy for image field
	const fileProxy = filesFieldProxy(createCustom, 'image');
	const { values: fileValues } = fileProxy;

	// We have an array of products from the load function
	// We will allow the user to select one productId
	let products = $state(data.products || []);

	let showTutoriel = $state(false);

	$effect(() => {
		if (data.user === null) {
			showTutoriel = false;
		} else {
			showTutoriel = true;
		}
	});

	// On success, if a message is returned, we can redirect or show a toast
	$effect(() => {
		if ($createCustomMessage === 'Custom created successfully') {
			goto('/admin/custom/');
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
</script>

<Sheet.Root>
	<Sheet.Trigger
		class={`bottom-[70px] right-[-30vw] absolute z-50 w-[80px] h-[80px] translate-x-[50%] translate-y-[-50%]  ${buttonVariants({ variant: 'outline' })}`}
	>
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

			<!-- Quantity field -->
			<Form.Field name="quantity" form={createCustom}>
				<Form.Control>
					<Form.Label>Quantity</Form.Label>
					<Input
						name="quantity"
						type="number"
						bind:value={$createCustomData.quantity}
						step="1"
						min="1"
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Message field -->
			<Form.Field name="message" form={createCustom}>
				<Form.Control>
					<Form.Label>Message</Form.Label>
					<Textarea name="message" bind:value={$createCustomData.message} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Button type="submit">Create Custom</Button>
		</form>
	</Sheet.Content>
</Sheet.Root>

<div class="absolute bottom-[70px] right-[-50vw] z-50 translate-x-[50%] translate-y-[-50%]">
	<Button onclick={() => (showTutoriel = true)}>
		<ShieldQuestion style="width: 25px; height: 25px" />
	</Button>
	<Tutoriel {showTutoriel} />
</div>

<Sheet.Root>
	<Sheet.Trigger
		class={`bottom-[70px] right-[-70vw] absolute z-50 w-[80px] h-[80px] translate-x-[50%] translate-y-[-50%]  ${buttonVariants({ variant: 'outline' })}`}
	>
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Move3d style="width: 25px; height: 25px" />
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

			<!-- Quantity field -->
			<Form.Field name="quantity" form={createCustom}>
				<Form.Control>
					<Form.Label>Quantity</Form.Label>
					<Input
						name="quantity"
						type="number"
						bind:value={$createCustomData.quantity}
						step="1"
						min="1"
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Message field -->
			<Form.Field name="message" form={createCustom}>
				<Form.Control>
					<Form.Label>Message</Form.Label>
					<Textarea name="message" bind:value={$createCustomData.message} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Button type="submit">Create Custom</Button>
		</form>
	</Sheet.Content>
</Sheet.Root>

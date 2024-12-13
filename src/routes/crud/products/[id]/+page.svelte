<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import * as Popover from '$shadcn/popover';
	import { toast } from 'svelte-sonner';

	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { updateProductSchema } from '$lib/schema/crud/productsSchema.js';

	import { goto } from '$app/navigation';

	let { data } = $props();

	const updateProductForm = superForm(data.updateProduct, {
		validators: zodClient(updateProductSchema),
		id: 'updateProductForm'
	});

	const {
		form: updateProductData,
		enhance: updateProductEnhance,
		message: updateProductMessage
	} = updateProductForm;

	let selectedAgenceName = $state('Select an agency');

	$effect(() => {
		if ($updateProductMessage === 'Product updated successfully') {
			toast.success($updateProductMessage);
			setTimeout(() => goto('/crud/products'), 0);
		}

		let agenceId = $updateProductData.agenceId;

		let selectedAgence = data.agencies.find((agence) => agence.id === agenceId);

		selectedAgenceName = selectedAgence
			? `${selectedAgence.street}, ${selectedAgence.city}`
			: 'Agency not found';
	});

	const selectAgence = (agence: any) => {
		selectedAgenceName = `${agence.street}, ${agence.city}`;
		$updateProductData.agenceId = agence.id;
	};
</script>

<div class="mx-auto mt-8 max-w-lg">
	<h1 class="text-4xl font-s text-[#fe3d00]">Update Product</h1>

	<form method="POST" action="?/update" use:updateProductEnhance>
		<div class="mb-4">
			<Form.Field name="name" form={updateProductForm}>
				<Form.Control>
					<Form.Label>Name</Form.Label>
					<Input name="name" type="text" bind:value={$updateProductData.name} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="stock" form={updateProductForm}>
				<Form.Control>
					<Form.Label>Stock</Form.Label>
					<Input name="stock" type="number" bind:value={$updateProductData.stock} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="price" form={updateProductForm}>
				<Form.Control>
					<Form.Label>Price</Form.Label>
					<Input
						name="price"
						type="number"
						step="0.01"
						bind:value={$updateProductData.price}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Dropdown Menu for Agence Selection -->
		<div class="mb-4">
			<Form.Field name="agenceId" form={updateProductForm}>
				<Form.Control>
					<Form.Label>Agence</Form.Label>
					<Popover.Root>
						<Popover.Trigger class="rounded border px-4 py-2">
							{selectedAgenceName}
						</Popover.Trigger>
						<Popover.Content>
							<div class="flex flex-col space-y-4">
								{#each data.agencies as agence}
									<button
										class="cursor-pointer rounded border p-4 shadow-md"
										onclick={() => selectAgence(agence)}
									>
										<h2 class="text-left text-sm font-semibold">{agence.street}, {agence.city}</h2>
										<hr class="my-2" />
										<div class="text-left text-sm">
											<p><strong>State:</strong> {agence.state}</p>
											<p><strong>ZIP Code:</strong> {agence.zip}</p>
											<p><strong>Country:</strong> {agence.country}</p>
										</div>
									</button>
								{/each}
							</div></Popover.Content
						>
					</Popover.Root>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Hidden inputs to store the selected agence ID and product ID -->
		<input hidden name="agenceId" bind:value={$updateProductData.agenceId} />
		<input hidden name="id" bind:value={$updateProductData.id} />

		<div class="mt-6">
			<Button type="submit">Update Product</Button>
		</div>
	</form>
</div>

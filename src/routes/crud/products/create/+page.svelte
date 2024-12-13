<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import * as Popover from '$shadcn/popover';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createProductSchema } from '$lib/schema/crud/productsSchema.js';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const createProductForm = superForm(data.form, {
		validators: zodClient(createProductSchema),
		id: 'createProductForm'
	});

	const {
		form: createProductData,
		enhance: createProductEnhance,
		message: createProductMessage
	} = createProductForm;

	$effect(() => {
		if ($createProductMessage === 'Product created successfully') {
			toast.success($createProductMessage);
			setTimeout(() => goto('/crud/products'), 0);
		}
	});

	let selectedAgenceName = $state('Select an agency');

	const selectAgence = (agence: any) => {
		selectedAgenceName = `${agence.street}, ${agence.city}`;
		$createProductData.agenceId = agence.id;
	};
</script>

<div class="mx-auto mt-8 max-w-lg">
	<h1 class="text-4xl font-s text-[#fe3d00]">Create a New Product</h1>

	<form method="POST" action="?/create" use:createProductEnhance>
		<div class="mb-4">
			<Form.Field name="name" form={createProductForm}>
				<Form.Control>
					<Form.Label>Name</Form.Label>
					<Input name="name" type="text" bind:value={$createProductData.name} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="stock" form={createProductForm}>
				<Form.Control>
					<Form.Label>Stock</Form.Label>
					<Input name="stock" type="number" bind:value={$createProductData.stock} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="price" form={createProductForm}>
				<Form.Control>
					<Form.Label>Price</Form.Label>
					<Input
						name="price"
						type="number"
						step="0.01"
						bind:value={$createProductData.price}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Dropdown Menu for Agence Selection -->
		<div class="mb-4">
			<Form.Field name="agenceId" form={createProductForm}>
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
							</div>
						</Popover.Content>
					</Popover.Root>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<input hidden name="agenceId" bind:value={$createProductData.agenceId} />

		<div class="mt-6">
			<Button type="submit">Create Product</Button>
		</div>
	</form>
</div>

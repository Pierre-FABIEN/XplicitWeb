<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { updateAddressSchema } from '$lib/schema/auth/addressSchema.js';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';

	// Importation des composants nécessaires de shadcn
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	// Initialisation du formulaire superForm
	const updateAddress = superForm(data.IupdateAddressSchema, {
		validators: zodClient(updateAddressSchema),
		id: 'updateAddress'
	});

	const { form, enhance, message } = updateAddress;

	// On récupère l'ID de l'adresse à partir des paramètres de la page
	let addressId: string;

	$effect(() => {
		const $page = get(page);
		addressId = $page.params.addressId;
	});

	let addressSuggestions: string[] = [];
	let timeoutId: ReturnType<typeof setTimeout>;

	async function fetchAddressSuggestions(query: string) {
		if (query.length < 3) {
			addressSuggestions = [];
			return;
		}

		try {
			const response = await fetch(`/api/open-cage?q=${encodeURIComponent(query)}`);
			const data = await response.json();
			addressSuggestions = data.suggestions;
		} catch (error) {
			console.error('Error fetching address suggestions:', error);
		}
	}

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fetchAddressSuggestions(input.value);
		}, 1000);
	}
	$: console.log(addressSuggestions, 'addressSuggestions');

	function selectSuggestion(suggestion) {
		const { house_number, road, city, town, village, state, postcode, country } =
			suggestion.components;
		$form.street = `${house_number || ''} ${road || ''}`.trim();
		$form.city = city || town || village || '';
		$form.state = state || '';
		$form.zip = postcode || '';
		$form.country = country || '';
		addressSuggestions = [];
	}

	// Réagir aux messages du formulaire
	$: if ($message === 'Address updated successfully') {
		toast($message);
		setTimeout(() => goto('/profile'), 2000);
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold mb-4">Update Address</h1>
	<form method="POST" action="?/updateAddress" use:enhance class="space-y-4">
		{#if addressSuggestions.length > 0}
			<h2>Suggestions:</h2>
			<ul class="rounded border p-2">
				{#each addressSuggestions as suggestion}
					<li>
						<button
							type="button"
							class="cursor-pointer"
							on:click={() => selectSuggestion(suggestion)}
						>
							{suggestion.formatted}
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		<Form.Field name="recipient" form={updateAddress}>
			<Form.Control>
				<Form.Label>Recipient</Form.Label>
				<Input type="text" bind:value={$form.recipient} />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field name="street" form={updateAddress}>
			<Form.Control>
				<Form.Label>Street</Form.Label>
				<Input type="text" on:input={handleInput} bind:value={$form.street} />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field name="city" form={updateAddress}>
			<Form.Control>
				<Form.Label>City</Form.Label>
				<Input type="text" on:input={handleInput} bind:value={$form.city} />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field name="state" form={updateAddress}>
			<Form.Control>
				<Form.Label>State</Form.Label>
				<Input type="text" on:input={handleInput} bind:value={$form.state} />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field name="zip" form={updateAddress}>
			<Form.Control>
				<Form.Label>ZIP Code</Form.Label>
				<Input type="text" on:input={handleInput} bind:value={$form.zip} />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field name="country" form={updateAddress}>
			<Form.Control>
				<Form.Label>Country</Form.Label>
				<Input type="text" on:input={handleInput} bind:value={$form.country} />
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<input type="hidden" name="id" bind:value={$form.id} />

		<Button type="submit">Save changes</Button>
	</form>
</div>

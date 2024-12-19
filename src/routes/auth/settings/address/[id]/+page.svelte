<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { toast } from 'svelte-sonner';

	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { goto } from '$app/navigation';
	import { updateAddressSchema } from '$lib/schema/addresses/addressSchema.js';
	import { Card } from '$shadcn/card';
	import ScrollArea from '$shadcn/scroll-area/scroll-area.svelte';

	let { data } = $props();

	console.log(data);

	const updateAddress = superForm(data.IupdateAddressSchema, {
		validators: zodClient(updateAddressSchema),
		id: 'updateAddress'
	});

	const {
		form: updateAddressData,
		enhance: updateAddressEnhance,
		message: updateAddressMessage
	} = updateAddress;

	let addressSuggestions: string[] = $state([]);
	let timeoutId: ReturnType<typeof setTimeout>;

	$effect(() => {
		$updateAddressData.id = data.IupdateAddressSchema?.data.id;
	});

	async function fetchAddressSuggestions(query: string) {
		if (query.length < 3) {
			addressSuggestions = [];
			return;
		}

		try {
			const response = await fetch(`/api/open-cage-data?q=${encodeURIComponent(query)}`);
			const { suggestions } = await response.json();

			if (Array.isArray(suggestions) && suggestions.length > 0) {
				addressSuggestions = suggestions;
			} else {
				addressSuggestions = []; // Aucun résultat
			}
		} catch (error) {
			console.error('Error fetching address suggestions:', error);
			addressSuggestions = [];
		}
	}

	function selectSuggestion(suggestion: any) {
		const { house_number, road, city, town, village, state, postcode, country } =
			suggestion.components;
		$updateAddressData.street = `${house_number || ''} ${road || ''}`.trim();
		$updateAddressData.city = city || town || village || '';
		$updateAddressData.state = state || '';
		$updateAddressData.zip = postcode || '';
		$updateAddressData.country = country || '';
		addressSuggestions = [];
	}

	$effect(() => {
		console.log($updateAddressMessage);

		if ($updateAddressMessage === 'Address updated successfully') {
			toast.success($updateAddressMessage);
			setTimeout(() => goto('/auth/settings/address'), 0);
		}
	});

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		clearTimeout(timeoutId);

		timeoutId = setTimeout(() => {
			fetchAddressSuggestions(input.value);
		}, 1000);
	}
</script>

<div class="mx-auto mt-8 max-w-lg">
	<h1 class="text-4xl font-s text-[#fe3d00]">Update the address</h1>

	{#if addressSuggestions.length > 0}
		<h2 class="text-xl font-semibold mb-4">Suggestions d'adresse</h2>
		<div class="space-y-4">
			<ScrollArea class="h-[200px]">
				{#each addressSuggestions as suggestion}
					<Card class="border border-gray-300 shadow-md hover:shadow-lg transition-shadow p-1">
						<div class="rcb">
							{suggestion.formatted}
							<Button
								class="cursor-pointer"
								onclick={() => selectSuggestion(suggestion)}
								onkeydown={(event) => event.code === 'Enter' && selectSuggestion(suggestion)}
							>
								Selectionner
							</Button>
						</div>
					</Card>
				{/each}
			</ScrollArea>
		</div>
	{/if}

	<form method="POST" action="?/updateAddress" use:updateAddressEnhance>
		<div class="mb-4">
			<Form.Field name="recipient" form={updateAddress}>
				<Form.Control>
					<Form.Label>Destinataire</Form.Label>
					<Input name="recipient" type="text" bind:value={$updateAddressData.recipient} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="street" form={updateAddress}>
				<Form.Control>
					<Form.Label>Street</Form.Label>
					<Input
						oninput={handleInput}
						name="street"
						type="text"
						bind:value={$updateAddressData.street}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="city" form={updateAddress}>
				<Form.Control>
					<Form.Label>City</Form.Label>
					<Input
						oninput={handleInput}
						name="city"
						type="text"
						bind:value={$updateAddressData.city}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="state" form={updateAddress}>
				<Form.Control>
					<Form.Label>State</Form.Label>
					<Input
						oninput={handleInput}
						name="state"
						type="text"
						bind:value={$updateAddressData.state}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="zip" form={updateAddress}>
				<Form.Control>
					<Form.Label>ZIP Code</Form.Label>
					<Input
						oninput={handleInput}
						name="zip"
						type="text"
						bind:value={$updateAddressData.zip}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="country" form={updateAddress}>
				<Form.Control>
					<Form.Label>Country</Form.Label>
					<Input
						oninput={handleInput}
						name="country"
						type="text"
						bind:value={$updateAddressData.country}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<input type="hidden" name="id" bind:value={$updateAddressData.id} />
		<div class="mt-6">
			<Button type="submit">update address</Button>
		</div>
	</form>
</div>

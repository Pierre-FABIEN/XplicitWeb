<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { createAddressSchema } from '$lib/schema/auth/addressSchema';

	import * as Form from '$shadcn/form';
	import { Button } from '$shadcn/button';
	import { Input } from '$shadcn/input';
	import { toast } from 'svelte-sonner';
	import { Card } from '$shadcn/card';
	import ScrollArea from '$shadcn/scroll-area/scroll-area.svelte';

	import { goto } from '$app/navigation';

	let { data } = $props();

	const createAddress = superForm(data.IcreateAddressSchema, {
		validators: zodClient(createAddressSchema),
		id: 'createAddress'
	});

	const {
		form: createAddressData,
		enhance: createAddressEnhance,
		message: createAddressMessage
	} = createAddress;

	$effect(() => {
		console.log('createAddressData:', $createAddressData);
	});

	$effect(() => {
		if ($createAddressMessage === 'Address created successfully') {
			goto('/auth/settings/address');
			toast($createAddressMessage);
		}
	});

	$effect(() => {
		$createAddressData.userId = data.userId;
	});

	let addressSuggestions = $state<string[]>([]);
	let timeoutId: ReturnType<typeof setTimeout>;

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

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		clearTimeout(timeoutId);

		timeoutId = setTimeout(() => {
			fetchAddressSuggestions(input.value);
		}, 1000);
	}

	function selectSuggestion(suggestion: any) {
		const { house_number, road, city, town, village, state, postcode, country } =
			suggestion.components;
		$createAddressData.street = `${house_number || ''} ${road || ''}`.trim();
		$createAddressData.city = city || town || village || '';
		$createAddressData.state = state || '';
		$createAddressData.zip = postcode || '';
		$createAddressData.country = country || '';
		addressSuggestions = [];
	}
</script>

<div class="container mx-auto p-6">
	<div class="max-w-xl border mx-auto rounded-md p-6">
		<h2 class="text-2xl font-semibold mb-4">Create Address</h2>

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
		<form method="POST" action="?/createAddress" use:createAddressEnhance class="space-y-4">
			<div class="space-y-2">
				<Form.Field name="recipient" form={createAddress}>
					<Form.Control>
						<Form.Label>Destinataire</Form.Label>
						<Input name="recipient" type="text" bind:value={$createAddressData.recipient} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="space-y-2">
				<Form.Field name="street" form={createAddress}>
					<Form.Control>
						<Form.Label>Rue</Form.Label>
						<Input
							name="street"
							type="text"
							oninput={handleInput}
							bind:value={$createAddressData.street}
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="space-y-2">
				<Form.Field name="city" form={createAddress}>
					<Form.Control>
						<Form.Label>Ville</Form.Label>
						<Input
							name="city"
							type="text"
							oninput={handleInput}
							bind:value={$createAddressData.city}
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="space-y-2">
				<Form.Field name="state" form={createAddress}>
					<Form.Control>
						<Form.Label>Région</Form.Label>
						<Input
							name="state"
							type="text"
							oninput={handleInput}
							bind:value={$createAddressData.state}
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="space-y-2">
				<Form.Field name="zip" form={createAddress}>
					<Form.Control>
						<Form.Label>Code postal</Form.Label>
						<Input
							name="zip"
							type="text"
							oninput={handleInput}
							bind:value={$createAddressData.zip}
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="space-y-2">
				<Form.Field name="country" form={createAddress}>
					<Form.Control>
						<Form.Label>Pays</Form.Label>
						<Input
							name="country"
							type="text"
							oninput={handleInput}
							bind:value={$createAddressData.country}
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<input type="hidden" name="userId" bind:value={$createAddressData.userId} />

			<Button type="submit" class="w-full">Save changes</Button>
		</form>
	</div>
</div>

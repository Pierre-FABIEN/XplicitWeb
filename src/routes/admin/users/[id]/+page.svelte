<!-- src/routes/dashboard/users/[id]/+page.svelte -->
<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { updateUserAndAddressSchema } from '$lib/schema/addresses/updateUserAndAddressSchema.js';
	// Importation des composants nécessaires de Shadcn
	import * as Form from '$shadcn/form';
	import * as DropdownMenu from '$shadcn/dropdown-menu';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let { data } = $props();

	if (!data || !data.IupdateUserAndAddressSchema || !data.IupdateUserAndAddressSchema.data) {
		throw new Error('Missing data for the form');
	}

	const updateUserAndAddresses = superForm(data.IupdateUserAndAddressSchema, {
		validators: zodClient(updateUserAndAddressSchema),
		id: 'updateUserAndAddresses',
		dataType: 'json',
		onResult: (data) => {
			if (data.result.data.form.message === 'User and addresses updated successfully') {
				toast.success(data.result.data.form.message);
				setTimeout(() => goto('/admin/users'), 0);
			}
		}
	});

	const { form, enhance, message } = updateUserAndAddresses;

	let addressSuggestions: any[] = $state([]);

	let selectedAddressIndex: number | null = $state(null);
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

	function handleInput(event: Event, index: number) {
		const input = event.target as HTMLInputElement;
		selectedAddressIndex = index;
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fetchAddressSuggestions(input.value);
		}, 1000);
	}

	function selectSuggestion(suggestion: any, index: any) {
		const { house_number, road, city, town, village, state, postcode, country } =
			suggestion.components;
		$form.addresses[index].street = `${house_number || ''} ${road || ''}`.trim();
		$form.addresses[index].city = city || town || village || '';
		$form.addresses[index].state = state || '';
		$form.addresses[index].zip = postcode || '';
		$form.addresses[index].country = country || '';
		addressSuggestions = [];
	}

	const roleOptions = ['ADMIN', 'CLIENT'];
</script>

<div class="min-h-screen min-w-[100vw] absolute">
	<div class="container mx-auto p-4">
		<h1 class="text-2xl font-bold mb-4">Update User and Addresses</h1>
		<form method="POST" action="?/updateUserAndAddresses" use:enhance class="space-y-4">
			<Form.Field name="role" form={updateUserAndAddresses}>
				<Form.Control>
					<Form.Label>Role</Form.Label>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button variant="outline">
								{$form.role ? $form.role : 'Select Role'}
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-56">
							<DropdownMenu.Label>Role</DropdownMenu.Label>
							<DropdownMenu.Separator />
							{#each roleOptions as option}
								<DropdownMenu.Item onclick={() => ($form.role = option)}>
									{option}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field name="isMfaEnabled" form={updateUserAndAddresses}>
				<Form.Control>
					<Form.Label>2FA Activé</Form.Label>
					<input type="checkbox" bind:checked={$form.isMfaEnabled} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field name="passwordHash" form={updateUserAndAddresses}>
				<Form.Control>
					<Form.Label>Mot de passe</Form.Label>
					<Input type="password" bind:value={$form.passwordHash} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="rts">
				{#each $form.addresses as address, index}
					<div class="address-form rounded border m-5 p-5 min-w-[500px]">
						{#if addressSuggestions.length > 0 && selectedAddressIndex === index}
							<h2>Suggestions:</h2>
							<ul class="rounded border p-2">
								{#each addressSuggestions as suggestion}
									<li>
										<button
											type="button"
											class="cursor-pointer"
											onclick={() => selectSuggestion(suggestion, index)}
										>
											{suggestion.formatted}
										</button>
									</li>
								{/each}
							</ul>
						{/if}

						<h2 class="text-2xl font-bold mb-4">{address.recipient}</h2>

						<Form.Field name={`addresses[${index}].recipient`} form={updateUserAndAddresses}>
							<Form.Control>
								<Form.Label>Recipient</Form.Label>
								<Input
									name={`addresses[${index}].recipient`}
									type="text"
									bind:value={address.recipient}
								/>
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field name={`addresses[${index}].street`} form={updateUserAndAddresses}>
							<Form.Control>
								<Form.Label>Street</Form.Label>
								<Input
									type="text"
									oninput={(event) => handleInput(event, index)}
									bind:value={address.street}
								/>
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field name={`addresses[${index}].city`} form={updateUserAndAddresses}>
							<Form.Control>
								<Form.Label>City</Form.Label>
								<Input
									name={`addresses[${index}].city`}
									type="text"
									oninput={(event) => handleInput(event, index)}
									bind:value={address.city}
								/>
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field name={`addresses[${index}].state`} form={updateUserAndAddresses}>
							<Form.Control>
								<Form.Label>State</Form.Label>
								<Input
									name={`addresses[${index}].state`}
									type="text"
									oninput={(event) => handleInput(event, index)}
									bind:value={address.state}
								/>
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field name={`addresses[${index}].zip`} form={updateUserAndAddresses}>
							<Form.Control>
								<Form.Label>ZIP Code</Form.Label>
								<Input
									name={`addresses[${index}].zip`}
									type="text"
									oninput={(event) => handleInput(event, index)}
									bind:value={address.zip}
								/>
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field name={`addresses[${index}].country`} form={updateUserAndAddresses}>
							<Form.Control>
								<Form.Label>Country</Form.Label>
								<Input
									name={`addresses[${index}].country`}
									type="text"
									oninput={(event) => handleInput(event, index)}
									bind:value={address.country}
								/>
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<input type="hidden" name={`addresses[${index}].id`} bind:value={address.id} />
					</div>
				{/each}
			</div>
			<Button type="submit">Save changes</Button>
		</form>
	</div>
</div>

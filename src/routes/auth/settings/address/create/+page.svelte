<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createAddressSchema } from '$lib/schema/addresses/addressSchema.js';

	import * as Form from '$shadcn/form';
	import { Button } from '$shadcn/button';
	import { Input } from '$shadcn/input';
	import * as Select from '$shadcn/select';
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
		if ($createAddressMessage === 'Address created successfully') {
			goto('/auth/settings/address');
			toast($createAddressMessage);
		}
	});

	$effect(() => {
		$createAddressData.userId = data.userId;
	});

	$effect(() => {
		//console.log($createAddressData);
	});

	$effect(() => {
		if (!$createAddressData.type || Array.isArray($createAddressData.type)) {
			$createAddressData.type = 'SHIPPING'; // 👈 Définit une valeur par défaut correcte
		}
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
		//console.log('Suggestion sélectionnée :', suggestion);

		// Force la conversion du Proxy en objet standard
		const components = JSON.parse(JSON.stringify(suggestion.components));

		//console.log('Données extraites après transformation :', components); // Vérification

		// Extraction sécurisée des données avec les bons noms de clés
		$createAddressData.street_number = components.house_number || '';
		$createAddressData.street = components.road || '';
		$createAddressData.city = components.city || components.town || components.village || '';
		$createAddressData.county = components.county || '';
		$createAddressData.state = components.state || '';
		$createAddressData.state_code = components.state_code || '';
		$createAddressData.zip = components.postcode || '';
		$createAddressData.country = components.country || '';
		$createAddressData.country_code = components.country_code || '';

		// 🛠 Corrige l'accès aux clés avec des tirets !
		$createAddressData.stateLetter = components['ISO_3166-1_alpha-2'] || '';
		$createAddressData.ISO_3166_1_alpha_3 = components['ISO_3166-1_alpha-3'] || '';

		// Réinitialisation des suggestions après la sélection
		addressSuggestions = [];
	}
</script>

<div class="w-[100vw] h-[100%] mx-auto px-4 py-6 space-y-6 ccc my-10">
	<div class="max-w-xl border mx-auto rounded-md p-6">
		<h2 class="text-2xl font-semibold mb-4">Créer une adresse</h2>

		{#if addressSuggestions.length > 0}
			<h2 class="text-xl font-semibold mb-4">Suggestions d'adresse</h2>
			<div class="space-y-4">
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
			</div>
		{/if}

		<form method="POST" action="?/createAddress" use:createAddressEnhance class="space-y-4">
			<!-- Prénom -->
			<Form.Field name="first_name" form={createAddress}>
				<Form.Control>
					<Form.Label>Prénom</Form.Label>
					<Input name="first_name" type="text" bind:value={$createAddressData.first_name} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Nom -->
			<Form.Field name="last_name" form={createAddress}>
				<Form.Control>
					<Form.Label>Nom</Form.Label>
					<Input name="last_name" type="text" bind:value={$createAddressData.last_name} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Téléphone -->
			<Form.Field name="phone" form={createAddress}>
				<Form.Control>
					<Form.Label>Téléphone</Form.Label>
					<Input name="phone" type="tel" bind:value={$createAddressData.phone} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Entreprise -->
			<Form.Field name="company" form={createAddress}>
				<Form.Control>
					<Form.Label>Entreprise</Form.Label>
					<Input name="company" type="text" bind:value={$createAddressData.company} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Numéro de rue -->
			<Form.Field name="street_number" form={createAddress}>
				<Form.Control>
					<Form.Label>Numéro</Form.Label>
					<Input name="street_number" type="text" bind:value={$createAddressData.street_number} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Rue -->
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

			<!-- Ville -->
			<Form.Field name="city" form={createAddress}>
				<Form.Control>
					<Form.Label>Ville</Form.Label>
					<Input name="city" type="text" bind:value={$createAddressData.city} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Code postal -->
			<Form.Field name="zip" form={createAddress}>
				<Form.Control>
					<Form.Label>Code Postal</Form.Label>
					<Input name="zip" type="text" bind:value={$createAddressData.zip} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Pays -->
			<Form.Field name="country" form={createAddress}>
				<Form.Control>
					<Form.Label>Pays</Form.Label>
					<Input name="country" type="text" bind:value={$createAddressData.country} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field name="type" form={createAddress}>
				<Form.Control>
					<Form.Label>Type d'adresse</Form.Label>
					<Select.Root bind:value={$createAddressData.type} type="single">
						<Select.Trigger class="w-full">
							<span>{$createAddressData.type || 'Sélectionner un type'}</span>
							<!-- 👈 Affiche la valeur sélectionnée -->
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="SHIPPING">Livraison</Select.Item>
							<Select.Item value="BILLING">Facturation</Select.Item>
						</Select.Content>
					</Select.Root>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			{#each Object.keys($createAddressData) as key}
				<input type="hidden" name={key} value={$createAddressData[key] ?? ''} />
			{/each}

			<Button type="submit" class="w-full">Enregistrer</Button>
		</form>
	</div>
</div>

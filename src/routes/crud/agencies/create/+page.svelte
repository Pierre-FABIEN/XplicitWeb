<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import * as Popover from '$shadcn/popover';
	import { toast } from 'svelte-sonner';

	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { createAgenceSchema } from '$lib/schema/crud/agenciesSchema';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const createAgenceForm = superForm(data.createAgence, {
		validators: zodClient(createAgenceSchema),
		id: 'createAgenceForm'
	});

	const {
		form: createAgenceData,
		enhance: createAgenceEnhance,
		message: createAgenceMessage
	} = createAgenceForm;

	let agenceSuggestions: string[] = $state([]);
	let timeoutId: ReturnType<typeof setTimeout>;

	const fetchagenceSuggestions = async (query: string) => {
		if (query.length < 3) {
			agenceSuggestions = [];
			return;
		}

		try {
			const response = await fetch(`/api/open-cage-data?q=${encodeURIComponent(query)}`);
			const data = await response.json();
			agenceSuggestions = data;
		} catch (error) {
			console.error('Error fetching address suggestions:', error);
		}
	};

	const selectSuggestion = (suggestion: any) => {
		const { house_number, road, city, town, village, state, postcode, country } =
			suggestion.components;
		$createAgenceData.street = `${house_number || ''} ${road || ''}`.trim();
		$createAgenceData.city = city || town || village || '';
		$createAgenceData.state = state || '';
		$createAgenceData.zip = postcode || '';
		$createAgenceData.country = country || '';
		agenceSuggestions = [];
	};

	$effect(() => {
		if ($createAgenceMessage === 'Agence created successfully') {
			toast.success($createAgenceMessage);
			setTimeout(() => goto('/crud/agencies'), 0);
		}
	});

	let selectedDirectorName = $state('Select a directors');

	const selectDirector = (directors: any) => {
		selectedDirectorName = directors.name;
		$createAgenceData.directorId = directors.id;
	};

	const handleInput = (event: Event) => {
		const input = event.target as HTMLInputElement;
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fetchagenceSuggestions(input.value);
		}, 1000);
	};
</script>

<div class="mx-auto mt-8 max-w-lg">
	<h1 class="text-4xl font-s text-[#fe3d00]">Create a New Agence</h1>

	{#if agenceSuggestions}
		<h2>Suggestions:</h2>
		<ul class="rounded border p-2">
			{#each agenceSuggestions.results as suggestion}
				<li>
					<button
						class="cursor-pointer"
						onclick={() => selectSuggestion(suggestion)}
						onkeydown={(event) => event.code === 'Enter' && selectSuggestion(suggestion)}
					>
						{suggestion.formatted}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<form method="POST" action="?/create" use:createAgenceEnhance>
		<div class="mb-4">
			<Form.Field name="street" form={createAgenceForm}>
				<Form.Control>
					<Form.Label>Street</Form.Label>
					<Input
						oninput={handleInput}
						name="street"
						type="text"
						bind:value={$createAgenceData.street}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="city" form={createAgenceForm}>
				<Form.Control>
					<Form.Label>City</Form.Label>
					<Input
						oninput={handleInput}
						name="city"
						type="text"
						bind:value={$createAgenceData.city}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="state" form={createAgenceForm}>
				<Form.Control>
					<Form.Label>State</Form.Label>
					<Input
						oninput={handleInput}
						name="state"
						type="text"
						bind:value={$createAgenceData.state}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="zip" form={createAgenceForm}>
				<Form.Control>
					<Form.Label>ZIP Code</Form.Label>
					<Input
						oninput={handleInput}
						name="zip"
						type="text"
						bind:value={$createAgenceData.zip}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="country" form={createAgenceForm}>
				<Form.Control>
					<Form.Label>Country</Form.Label>
					<Input
						oninput={handleInput}
						name="country"
						type="text"
						bind:value={$createAgenceData.country}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Dropdown Menu for Director Selection -->
		<div class="mb-4">
			<Form.Field name="directorId" form={createAgenceForm}>
				<Form.Control>
					<Form.Label>Director</Form.Label>
					<Popover.Root>
						<Popover.Trigger class="rounded border px-4 py-2">
							{selectedDirectorName}
						</Popover.Trigger>
						<Popover.Content>
							<div class="flex flex-col space-y-2">
								{#each data.directors as directors}
									<button
										class="rounded p-2 text-left hover:bg-gray-100"
										onclick={() => selectDirector(directors)}
									>
										{directors.name}
									</button>
								{/each}
							</div>
						</Popover.Content>
					</Popover.Root>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<input hidden name="directorId" bind:value={$createAgenceData.directorId} />

		<div class="mt-6">
			<Button type="submit">Create Agence</Button>
		</div>
	</form>
</div>

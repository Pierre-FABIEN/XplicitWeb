<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import * as Popover from '$shadcn/popover';
	import { toast } from 'svelte-sonner';

	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { updateAgenceSchema } from '$lib/schema/crud/agenciesSchema';

	import { goto } from '$app/navigation';

	let { data } = $props();

	const updateAgenceForm = superForm(data.updateAgence, {
		validators: zodClient(updateAgenceSchema),
		id: 'updateAgenceForm'
	});

	const {
		form: updateAgenceData,
		enhance: updateAgenceEnhance,
		message: updateAgenceMessage
	} = updateAgenceForm;

	let agenceSuggestions: string[] = $state([]);
	let timeoutId: ReturnType<typeof setTimeout>;
	let selectedDirectorName = $state('Select a directors');

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
		$updateAgenceData.street = `${house_number || ''} ${road || ''}`.trim();
		$updateAgenceData.city = city || town || village || '';
		$updateAgenceData.state = state || '';
		$updateAgenceData.zip = postcode || '';
		$updateAgenceData.country = country || '';
		agenceSuggestions = [];
	};

	$effect(() => {
		if ($updateAgenceMessage === 'Agence updated successfully') {
			toast.success($updateAgenceMessage);
			setTimeout(() => goto('/crud/agencies'), 0);
		}

		let directorId = $updateAgenceData.directorId;

		let selectedDirector = data.directors.find((directors) => directors.id === directorId);

		selectedDirectorName = selectedDirector ? selectedDirector.name : 'Director not found';
	});

	const selectDirector = (directors: any) => {
		selectedDirectorName = directors.name;
		$updateAgenceData.directorId = directors.id;
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

	<form method="POST" action="?/update" use:updateAgenceEnhance>
		<div class="mb-4">
			<Form.Field name="street" form={updateAgenceForm}>
				<Form.Control>
					<Form.Label>Street</Form.Label>
					<Input
						oninput={handleInput}
						name="street"
						type="text"
						bind:value={$updateAgenceData.street}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="city" form={updateAgenceForm}>
				<Form.Control>
					<Form.Label>City</Form.Label>
					<Input
						oninput={handleInput}
						name="city"
						type="text"
						bind:value={$updateAgenceData.city}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="state" form={updateAgenceForm}>
				<Form.Control>
					<Form.Label>State</Form.Label>
					<Input
						oninput={handleInput}
						name="state"
						type="text"
						bind:value={$updateAgenceData.state}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="zip" form={updateAgenceForm}>
				<Form.Control>
					<Form.Label>ZIP Code</Form.Label>
					<Input
						oninput={handleInput}
						name="zip"
						type="text"
						bind:value={$updateAgenceData.zip}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="country" form={updateAgenceForm}>
				<Form.Control>
					<Form.Label>Country</Form.Label>
					<Input
						oninput={handleInput}
						name="country"
						type="text"
						bind:value={$updateAgenceData.country}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="directorId" form={updateAgenceForm}>
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

		<input hidden name="directorId" bind:value={$updateAgenceData.directorId} />
		<input hidden name="id" bind:value={$updateAgenceData.id} />

		<div class="mt-6">
			<Button type="submit">Create Agence</Button>
		</div>
	</form>
</div>

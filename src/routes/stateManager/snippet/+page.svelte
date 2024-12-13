<script lang="ts">
	import CardSnippet from '$components/CardSnippet.svelte';

	interface Agency {
		id: string;
		street: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	}

	interface Director {
		id: string;
		name: string;
		email: string;
		age: number;
		isActive: boolean;
		agencies: Agency[];
	}

	let { data } = $props();
	let directors: Director[] = data.directors;
</script>

{#snippet agencyDisplay(agency: Agency)}
	<div class="agency rounded-md border p-4 shadow-sm">
		<p class="text-sm"><strong>ID :</strong> {agency.id}</p>
		<p class="text-sm">
			<strong>Adresse :</strong>
			{agency.street}, {agency.city}, {agency.state}, {agency.zip}, {agency.country}
		</p>
	</div>
{/snippet}

{#snippet directorDisplay(director: Director)}
	<div class="director mb-6 rounded-lg border p-6 shadow-md">
		<h2 class="mb-4 text-2xl font-semibold">{director.name}</h2>
		<div class="space-y-2">
			<p><strong>Email :</strong> {director.email}</p>
			<p><strong>Âge :</strong> {director.age}</p>
			<p><strong>Actif :</strong> {director.isActive ? 'Oui' : 'Non'}</p>
		</div>
		<h3 class="mb-4 mt-6 text-xl font-medium">Agences :</h3>
		<div class="agencies space-y-4">
			{#if director.agencies.length > 0}
				{#each director.agencies as agency}
					{@render agencyDisplay(agency)}
				{/each}
			{:else}
				<p>Aucune agence associée.</p>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet testSnippet()}
	{#each directors as director}
		<h1 class="text-2xl font-bold">{director.name}</h1>
	{/each}
{/snippet}

<main class="container mx-auto p-6">
	<h1 class="mb-8 text-center text-3xl font-bold">Liste des directeurs</h1>
	<div class="space-y-8">
		{#each directors as director}
			{@render directorDisplay(director)}
		{/each}
	</div>

	<hr class="my-12" />

	<CardSnippet {testSnippet}>
		{#snippet testNestedSnippet()}
			<h1 class="text-xl font-semibold">testNestedSnippet</h1>
		{/snippet}
	</CardSnippet>
</main>

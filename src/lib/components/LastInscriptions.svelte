<script lang="ts">
	import * as Avatar from '$shadcn/avatar/index.js';
	import * as Card from '$shadcn/card/index.js';

	let { users } = $props();

	/**
	 * Formate la date selon le pattern "HHh MMmin SSsec DD/MM/YYYY"
	 * @param dateString - date au format ISO (e.g. "2025-01-19T21:52:49.864Z")
	 * @returns une chaîne de caractère formatée (e.g. "17h 58min 56sec 28/05/2022")
	 */
	function formatDate(dateString: string) {
		const date = new Date(dateString);

		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');

		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();

		return `${hours}h ${minutes}min ${seconds}sec ${day}/${month}/${year}`;
	}
</script>

<!-- Card qui liste les derniers inscrits -->
<Card.Root>
	<Card.Header>
		<Card.Title>Latest Registrations</Card.Title>
		<Card.Description>Recent users who have joined the platform</Card.Description>
	</Card.Header>
	<Card.Content class="grid gap-6">
		<!-- On boucle sur chaque user pour l'afficher dans un bloc similaire -->
		{#each users as user}
			<div class="flex items-center justify-between space-x-4">
				<div class="flex items-center space-x-4">
					<Avatar.Root>
						{#if user.picture}
							<Avatar.Image src={user.picture} alt={user.name ?? user.email} />
						{:else}
							<Avatar.Fallback>
								{user.name?.[0] ?? user.email?.[0] ?? 'U'}
							</Avatar.Fallback>
						{/if}
					</Avatar.Root>

					<div>
						<p class="text-sm font-medium leading-none">
							{user.name ?? user.username ?? 'No Name'}
						</p>
						<p class="text-muted-foreground text-sm">{user.email}</p>
					</div>
				</div>

				<!-- On affiche la date formatée si createdAt existe -->
				{#if user.createdAt}
					<p>{formatDate(user.createdAt)}</p>
				{/if}
			</div>
		{/each}
	</Card.Content>
</Card.Root>

<script>
	import { page } from '$app/stores'; // Importation de la store $page
	import { derived } from 'svelte/store';
	import * as Breadcrumb from '../shadcn/ui/breadcrumb';

	// Décomposer l'URL pour générer les breadcrumbs
	const breadcrumbs = derived(page, ($page) => {
		// Accéder au chemin complet à partir de $page.route.id
		const path = $page.route?.id || '';

		// Diviser en segments (en supprimant les parties vides)
		const segments = path.split('/').filter(Boolean);

		// Construire les breadcrumbs
		return segments.map((segment, index) => {
			const href = '/' + segments.slice(0, index + 1).join('/'); // Recomposer l'URL partielle
			return {
				title: segment.charAt(0).toUpperCase() + segment.slice(1), // Capitaliser
				href
			};
		});
	});
</script>

<div class="breadcrumb mr-5">
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<!-- Afficher les breadcrumbs dynamiquement -->
			{#each $breadcrumbs as breadcrumb, index}
				<Breadcrumb.Item>
					{#if breadcrumb.href}
						<Breadcrumb.Link href={breadcrumb.href}>{breadcrumb.title}</Breadcrumb.Link>
					{:else}
						<Breadcrumb.Page>{breadcrumb.title}</Breadcrumb.Page>
					{/if}
				</Breadcrumb.Item>
				{#if index < $breadcrumbs.length - 1}
					<Breadcrumb.Separator />
				{/if}
			{/each}
		</Breadcrumb.List>
	</Breadcrumb.Root>
</div>

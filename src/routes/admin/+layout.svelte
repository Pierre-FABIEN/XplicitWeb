<script lang="ts">
	// Importation des composants principaux
	import * as Sidebar from '$shadcn/sidebar/index.js';
	import { Search } from 'lucide-svelte';
	import SmoothScrollBar from '$lib/components/smoothScrollBar/SmoothScrollBar.svelte';

	let { children } = $props();

	// Données de navigation
	const data = {
		versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
		navMain: [
			{
				title: 'Dashboard',
				items: [
					{ title: 'Accueil', url: '/admin' },
					{ title: 'utilisateurs', url: '/admin/users' },
					{ title: 'ventes', url: '/admin/sales' },
					{ title: 'produits', url: '/admin/products' },
					{ title: 'blog', url: '/admin/blog' }
				]
			}
		]
	};

	// Version sélectionnée
	let selectedVersion = $state(data.versions[0]);
</script>

<div class="w-screen h-screen">
	<Sidebar.Provider>
		<Sidebar.Root class="border-none">
			<!-- En-tête avec Sélecteur de version et Recherche -->
			<Sidebar.Header>
				<!-- Champ de recherche -->
				<div class="relative mt-4">
					<input type="text" placeholder="Search the docs..." class="pl-8 border rounded w-full" />
					<Search class="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
				</div>
			</Sidebar.Header>

			<!-- Contenu de la Sidebar -->
			<Sidebar.Content>
				{#each data.navMain as group}
					<Sidebar.Group>
						<Sidebar.GroupLabel>{group.title}</Sidebar.GroupLabel>
						<Sidebar.Menu>
							{#each group.items as item}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton isActive={item.isActive}>
										<a href={item.url}>{item.title}</a>
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.Group>
				{/each}
			</Sidebar.Content>
		</Sidebar.Root>

		<!-- Contenu principal -->
		<Sidebar.Inset class="border rounded-[12px] m-3 max-h-[95vh] min-h-[95vh]">
			<SmoothScrollBar>
				<header class="flex items-center gap-2 px-4 h-16">
					<Sidebar.Trigger />
				</header>

				<div class="p-4">
					{@render children?.()}
				</div>
			</SmoothScrollBar>
		</Sidebar.Inset>
	</Sidebar.Provider>
</div>

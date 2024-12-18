<script lang="ts">
	// Importation des composants principaux
	import * as Breadcrumb from '$shadcn/breadcrumb/index.js';
	import { Separator } from '$shadcn/separator/index.js';
	import * as Sidebar from '$shadcn/sidebar/index.js';
	import * as DropdownMenu from '$shadcn/dropdown-menu/index.js';
	import Search from 'lucide-svelte/icons/search';
	import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-svelte';

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
					{ title: 'produits', url: '/admin/products' },
					{ title: 'ventes', url: '/admin/sales' },
					{ title: 'blog', url: '/admin/blog' }
				]
			}
		]
	};

	// Version sélectionnée
	let selectedVersion = $state(data.versions[0]);
</script>

<!-- Sidebar principale -->
<Sidebar.Provider>
	<Sidebar.Root>
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
	<Sidebar.Inset>
		<header class="flex items-center gap-2 border-b px-4 h-16">
			<Sidebar.Trigger />
			<Separator orientation="vertical" class="h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link href="#">Building Your Application</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
					<Breadcrumb.Item>
						<Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>

		<div class="p-4">
			{@render children?.()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

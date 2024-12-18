<script lang="ts">
	// Importation des composants principaux
	import * as Breadcrumb from '$shadcn/breadcrumb/index.js';
	import { Separator } from '$shadcn/separator/index.js';
	import * as Sidebar from '$shadcn/sidebar/index.js';
	import * as DropdownMenu from '$shadcn/dropdown-menu/index.js';
	import Search from 'lucide-svelte/icons/search';
	import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-svelte';

	// Importation des composants spécifiques de la sidebar
	import NavMain from '$lib/registry/new-york/block/sidebar-08/components/nav-main.svelte';
	import NavProjects from '$lib/registry/new-york/block/sidebar-08/components/nav-projects.svelte';
	import NavSecondary from '$lib/registry/new-york/block/sidebar-08/components/nav-secondary.svelte';
	import NavUser from '$lib/registry/new-york/block/sidebar-08/components/nav-user.svelte';

	// Données de navigation
	const data = {
		versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
		navMain: [
			{
				title: 'Dashboard',
				items: [
					{ title: 'Accueil', url: '/admin' },
					{ title: 'Utilisateurs', url: '/admin/users' },
					{ title: 'Produits', url: '/admin/products' },
					{ title: 'Ventes', url: '/admin/sales' },
					{ title: 'Blog', url: '/admin/blog' }
				]
			}
		],
		navSecondary: [
			{ title: 'Support', url: '#', icon: LifeBuoy },
			{ title: 'Feedback', url: '#', icon: Send }
		],
		projects: [
			{ name: 'Design Engineering', url: '#', icon: Frame },
			{ name: 'Sales & Marketing', url: '#', icon: ChartPie },
			{ name: 'Travel', url: '#', icon: Map }
		],
		user: {
			name: 'shadcn',
			email: 'm@example.com',
			avatar: '/avatars/shadcn.jpg'
		}
	};

	// Version sélectionnée
	let selectedVersion = data.versions[0];

	// Fonction pour gérer le changement de version
	function handleVersionSelect(version: string) {
		selectedVersion = version;
	}
</script>

<Sidebar.Provider>
	<Sidebar.Root variant="inset">
		<!-- Header de la Sidebar avec Sélecteur de Version et Recherche -->
		<Sidebar.Header class="flex flex-col gap-4 p-4">
			<!-- Sélecteur de Version -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Sidebar.MenuButton size="lg" class="flex items-center gap-2 rounded-lg">
						<div
							class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
						>
							<GalleryVerticalEnd class="size-4" />
						</div>
						<div class="flex flex-col leading-none">
							<span class="font-semibold">Documentation</span>
							<span>v{selectedVersion}</span>
						</div>
						<ChevronsUpDown class="ml-auto" />
					</Sidebar.MenuButton>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" class="rounded-md shadow-lg bg-white">
					{#each data.versions as version}
						<DropdownMenu.Item
							on:select={() => handleVersionSelect(version)}
							class="px-4 py-2 hover:bg-gray-100 rounded"
						>
							v{version}
							{#if version === selectedVersion}
								<Check class="ml-auto" />
							{/if}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Champ de Recherche -->
			<div class="relative">
				<input
					type="text"
					placeholder="Search the docs..."
					class="pl-8 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<Search class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
			</div>
		</Sidebar.Header>

		<!-- Contenu de la Sidebar avec Navigation Principale, Projets et Secondaire -->
		<Sidebar.Content class="p-4 rounded-lg bg-muted/50">
			<NavMain items={data.navMain} />
			<NavProjects projects={data.projects} />
			<NavSecondary items={data.navSecondary} class="mt-auto" />
		</Sidebar.Content>

		<!-- Footer de la Sidebar avec Informations Utilisateur -->
		<Sidebar.Footer class="p-4 rounded-lg bg-muted/50">
			<NavUser user={data.user} />
		</Sidebar.Footer>
	</Sidebar.Root>

	<!-- Contenu Principal avec Header et Breadcrumb -->
	<Sidebar.Inset>
		<header class="flex items-center gap-2 border-b px-4 h-16 rounded-t-lg bg-white">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List class="flex items-center space-x-2">
					<Breadcrumb.Item class="hidden md:block">
						<Breadcrumb.Link href="#">Building Your Application</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator class="hidden md:block" />
					<Breadcrumb.Item>
						<Breadcrumb.Page>Data Fetching</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>

		<div class="p-4 bg-white rounded-b-lg">
			{#if typeof children === 'function'}
				{children()}
			{/if}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<style>
	/* Exemple de styles personnalisés si nécessaire */
	.bg-sidebar-primary {
		background-color: #4f46e5; /* Indigo-600 */
	}
	.text-sidebar-primary-foreground {
		color: white;
	}
	.bg-muted {
		background-color: #f9fafb; /* Gray-50 */
	}
</style>

<script>
	import * as Drawer from '$shadcn/drawer';
	import * as Sheet from '$shadcn/sheet';
	import { Button, buttonVariants } from '$shadcn/button';
	import {
		PresentationItems,
		crudItems,
		stateItems,
		socketItems,
		stripeItems,
		UIUXItems,
		AuthItems,
		renderProduction,
		BlogItems
	} from '$lib';
	import { Waves } from 'lucide-svelte';
	import LogoSvelte from '../LogoSvelte.svelte';
	import Options from './Options.svelte';
	import Input from '../shadcn/ui/input/input.svelte';

	// Navigation groups
	const navGroups = [
		{ title: 'Presentation', items: PresentationItems },
		{ title: 'CRUD', items: crudItems },
		{ title: 'State Management', items: stateItems },
		{ title: 'WebSocket', items: socketItems },
		{ title: 'Stripe', items: stripeItems },
		{ title: 'UI/UX', items: UIUXItems },
		{ title: 'Authentication', items: AuthItems },
		{ title: 'On Production', items: renderProduction },
		{ title: 'Blog', items: BlogItems }
	];

	let drawerOpen = false;

	// Handler to close the drawer
	function closeDrawer() {
		drawerOpen = false;
	}
</script>

<Drawer.Root open={drawerOpen} onOpenChange={(state) => (drawerOpen = state)}>
	<!-- Drawer Trigger -->
	<Drawer.Trigger
		class={buttonVariants({ variant: 'outline' }) + 'buttonMenu'}
		onclick={() => (drawerOpen = true)}
	>
		<Waves />
	</Drawer.Trigger>

	<!-- Drawer Content -->
	<Drawer.Content
		style="background: rgba(7, 10, 71, 0.6); backdrop-filter: blur(10px);"
		class="fixed inset-0 bg-gradient-to-br from-white/60 to-gray-200/40 dark:from-gray-900/60 dark:to-gray-800/40 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-500 ease-in-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
	>
		<div class="flex flex-col h-full">
			<!-- Header -->
			<Drawer.Header
				class="flex justify-between border-b border-gray-300 dark:border-gray-700 px-4 py-3"
			>
				<div class="w-[20%]">
					<Drawer.Title class="text-xl font-semibold  ">
						<a href="/" class="flex items-center">
							<div
								class="text-sidebar-primary-foreground flex items-center justify-center rounded-lg w-8 h-8"
							>
								<LogoSvelte />
							</div>

							<div class="ml-2 flex flex-col">
								<span class="truncate text-xl font-semibold leading-4">BoilerPlate</span>
								<span class="truncate text-lg leading-4">SvelteKit</span>
							</div>
						</a>
					</Drawer.Title>

					<Drawer.Description class="text-sm   mt-5">Navigation</Drawer.Description>
				</div>
				<div class="search w-[60%]">
					<Input class="mt-5" placeholder="Search..." />
				</div>
				<div class="w-[20%]">
					<div class="flex justify-center place-content-center place-items-center">
						<Options />
					</div>
				</div>
			</Drawer.Header>

			<div class="flex justify-start">
				{#each navGroups as group}
					<Sheet.Root>
						<Sheet.Trigger class="flex m-3">
							<Button
								class="flex items-center justify-between px-4 py-3   bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 rounded-lg shadow-md transition-all"
							>
								<span class="font-medium">{group.title}</span>
							</Button>
						</Sheet.Trigger>

						<!-- Disabling the overlay -->
						<Sheet.Portal>
							<Sheet.Overlay class="hidden" />
							<Sheet.Content
								side="left"
								style="background: rgba(7, 10, 71, 0.6); backdrop-filter: blur(15px);"
								class="bg-gradient-to-bl from-white/70 to-gray-200/40 dark:from-gray-900/70 dark:to-gray-800/40 backdrop-blur-3xl border border-gray-300/50 dark:border-gray-700/50 rounded-lg shadow-lg transition-all duration-500 ease-in-out data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
							>
								<Sheet.Header class="px-4 py-3 border rounded">
									<Sheet.Title class="text-lg font-semibold  ">
										{group.title}
									</Sheet.Title>
									<Sheet.Description class="text-sm  ">
										Explore all items under {group.title}.
									</Sheet.Description>
								</Sheet.Header>
								<div class="px-4 py-4 space-y-2">
									<ul class="space-y-2">
										{#each group.items as item}
											<li>
												<a
													href={item.url}
													class="flex items-center gap-3 px-4 py-2 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 rounded-md transition-all"
													onclick={closeDrawer}
												>
													<svelte:component this={item.icon} class="w-5 h-5  " />
													<span>{item.title}</span>
												</a>
											</li>
										{/each}
									</ul>
								</div>
							</Sheet.Content>
						</Sheet.Portal>
					</Sheet.Root>
				{/each}
			</div>
		</div>
	</Drawer.Content>
</Drawer.Root>

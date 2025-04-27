<script lang="ts">
	// ──────────────────────────────────────────────────────────── Deps
	import Cart from '$lib/components/cart/Cart.svelte';
	import Options from '$lib/components/navigation/Options.svelte';

	// shadcn-ui
	import * as Drawer from '$shadcn/drawer';
	import { Button, buttonVariants } from '$shadcn/button';

	// Icons
	import { Menu } from 'lucide-svelte';

	// ──────────────────────────────────────────────────────────── Data
	export let data;

	const links = [
		{ href: '/', label: 'Accueil' },
		{ href: '/atelier', label: "L'atelier" },
		{ href: '/catalogue', label: 'Catalogue' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/contact', label: 'Contact' }
	];
</script>

<!-- Desktop bar + Mobile drawer trigger ---------------------------------- -->
<div class="iconeNav ccc">
	<nav
		class="backdrop-blur-3xl shadow-xl border border-white/50 rounded-2xl flex items-center p-2 space-x-4"
	>
		<!-- ───────── Mobile Drawer (burger + sheet) -->
		<Drawer.Root>
			<Drawer.Trigger
				aria-label="Open navigation"
				class={buttonVariants({ variant: 'ghost', size: 'icon' })}
			>
				<Menu size="24" />
			</Drawer.Trigger>

			<Drawer.Content side="bottom" class="pb-8 pt-6">
				<Drawer.Header class="text-center">
					<Drawer.Title>Menu</Drawer.Title>
				</Drawer.Header>

				<ul class="my-6 flex flex-col items-center gap-4 text-lg font-medium">
					{#each links as { href, label }}
						<Drawer.Close>
							<a {href} class="block uppercase tracking-wide">{label}</a>
						</Drawer.Close>
					{/each}
				</ul>

				<div class="mt-4 flex items-center justify-center gap-6">
					<Options />
					<Cart {data} />
				</div>

				<Drawer.Footer class="mt-6 flex justify-center gap-4">
					<Button size="sm">Se connecter</Button>
					<Drawer.Close class={buttonVariants({ variant: 'outline', size: 'sm' })}>
						Fermer
					</Drawer.Close>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>

		<!-- Desktop-only utilities -->
		<div class="hidden md:block options">
			<Options />
		</div>
		<div class="hidden md:block">
			<Cart {data} />
		</div>
	</nav>
</div>

<style lang="scss">
	.iconeNav {
		position: absolute;
		left: 50vw;
		bottom: 10px;
		transform: translate(-50%, 0);
		z-index: 10;

		nav {
			transition: all 0.3s ease;

			&:hover {
				transform: translateY(-5px);
				box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
				background: rgba(255, 255, 255, 0.05);
			}
		}
	}

	.options {
		margin-left: 0px !important;
	}
</style>

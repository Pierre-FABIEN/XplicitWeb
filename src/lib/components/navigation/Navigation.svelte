<script lang="ts">
	/* ── Deps ─────────────────────────────────────────────────────────────── */
	import Cart from '$lib/components/cart/Cart.svelte';
	import Options from '$lib/components/navigation/Options.svelte';
	import * as Drawer from '$shadcn/drawer';
	import { Button, buttonVariants } from '$shadcn/button';
	import { Menu } from 'lucide-svelte';
	import { mode } from 'mode-watcher';
	import { goto } from '$app/navigation';

	/* ── Data  ────────────────────────────────────────────────────────────── */
	let { data } = $props();

	const links = [
		{ href: '/', label: 'Accueil' },
		{ href: '/atelier', label: "L'atelier" },
		{ href: '/catalogue', label: 'Catalogue' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/contact', label: 'Contact' }
	];

	/* ── State ────────────────────────────────────────────────────────────── */
	let drawerOpen = $state(false);
	let strokeColor = $derived(mode.current === 'light' ? '#00021a' : '#00c2ff');

	/* ── Navigation + diagnostic ──────────────────────────────────────────── */
	async function goTo(e: MouseEvent, href: string) {
		e.preventDefault();
		drawerOpen = false;

		const urlBefore = window.location.href;
		console.error('[Nav] ① CLIC sur', href, '| URL actuelle:', urlBefore);

		try {
			await goto(href);
			console.error('[Nav] ② goto() résolu | URL maintenant:', window.location.href);
		} catch (err) {
			console.error('[Nav] ② goto() ERREUR:', err, '→ fallback window.location');
			window.location.href = href;
			return;
		}

		// Vérifie 800ms après si l'URL a réellement changé
		setTimeout(() => {
			const urlAfter = window.location.href;
			if (urlAfter === urlBefore) {
				console.error('[Nav] ③ ❌ URL INCHANGÉE 800ms après goto() — navigation bloquée !');
			} else {
				console.error('[Nav] ③ ✅ URL changée vers', urlAfter);
			}
		}, 800);
	}
</script>

<!-- Barre desktop + burger mobile --------------------------------------- -->
<div class="iconeNav ccc">
	<nav
		class="backdrop-blur-3xl shadow-xl border border-white/50 rounded-2xl
			   flex items-center p-2 space-x-4"
	>
		<!-- ─── Drawer mobile -->
		<Drawer.Root bind:open={drawerOpen}>
			<Drawer.Trigger
				aria-label="Open navigation"
				class={buttonVariants({ variant: 'ghost', size: 'icon' }) + ' md:hidden'}
			>
				<Menu size="24" />
			</Drawer.Trigger>

			<Drawer.Content class="pb-8 pt-6 md:hidden">
				<ul class="my-6 flex flex-col gap-4 text-lg font-medium">
					{#each links as { href, label }}
						<a
							{href}
							onclick={(e) => goTo(e, href)}
							style={`-webkit-text-stroke-color:${strokeColor};`}
							class="fontStyle block uppercase tracking-wide w-full px-4 py-2"
						>
							{label}
						</a>
					{/each}
				</ul>

				<Drawer.Footer class="mt-6 flex justify-center gap-4">
					<Button size="sm" href="/auth/login" onclick={(e) => goTo(e, '/auth/login')}
						>Se connecter</Button
					>
					<Button size="sm" variant="outline" onclick={() => (drawerOpen = false)}>Fermer</Button>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>

		<!-- ─── Links desktop -->
		<ul class="hidden md:flex">
			{#each links as { href, label }}
				<li>
					<a
						{href}
						onclick={(e) => goTo(e, href)}
						class="fontStyle flex items-center justify-center rounded-xl h-10 px-5 font-medium
					   transition hover:-translate-y-[1px] hover:bg-white/10"
					>
						{label}
					</a>
				</li>
			{/each}
		</ul>

		<!-- Utilitaires desktop -->
		<div class="navContainer rcb w-[260px] hidden">
			<div>
				<Options />
			</div>
			<div>
				<Cart {data} />
			</div>
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

		.navContainer {
			margin-left: 0 !important;
		}

		nav {
			transition: all 0.3s ease;

			&:hover {
				transform: translateY(-5px);
				box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
				background: rgba(255, 255, 255, 0.05);
			}
		}

		.fontStyle {
			font-family:
				Raleway Variable,
				sans-serif;
			font-weight: normal;
		}
	}
</style>

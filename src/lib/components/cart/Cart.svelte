<script lang="ts">
	/* ------------------------------------------------------------------
	   IMPORTS
	------------------------------------------------------------------ */
	import SmoothScrollBar from './../smoothScrollBar/SmoothScrollBar.svelte';
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/raleway';

	import { cart, removeFromCart, updateCartItemQuantity } from '$lib/store/Data/cartStore';
	import { Badge } from '$shadcn/badge';
	import Button from '$shadcn/button/button.svelte';
	import * as Sheet from '$shadcn/sheet/index.js';
	import { Trash, ShoppingCart } from 'lucide-svelte';
	import Input from '../shadcn/ui/input/input.svelte';

	import { goto, invalidateAll } from '$app/navigation';

	/*  👉 le store ‘mode’  */
	import { mode as modeStore } from 'mode-watcher';

	/* ------------------------------------------------------------------
	   PROPS & ÉTAT
	------------------------------------------------------------------ */
	let { data } = $props();

	let user = $state<typeof data.user | null>(null);
	let sidebarOpen = $state(false);

	/*  Valeur dérivée et réactive du store mode  */
	let currentMode = $derived(modeStore); // ✅ pas de $

	/*  true si aucune personnalisation dans le panier  */
	let isNativeOrder = $state(false);

	/*  Options de quantité (simplifiées) */
	let quantityOptions = $state([
		{ label: '24 packs (576)', value: 576 },
		{ label: '30 packs (720)', value: 720 },
		{ label: '60 packs (1 440)', value: 1440 },
		{ label: '120 packs (2 880)', value: 2880 }
	]);

	/* ------------------------------------------------------------------
	   RÉACTIONS
	------------------------------------------------------------------ */
	$effect(() => {
		user = data?.user ?? null;
	});

	$effect(() => {
		isNativeOrder = $cart.items.every((i) => !Array.isArray(i.custom) || i.custom.length === 0);
	});

	/* ------------------------------------------------------------------
	   ACTIONS
	------------------------------------------------------------------ */
	function handleRemoveFromCart(id: string, customId?: string) {
		removeFromCart(id, customId);
	}

	function changeQuantity(id: string, qte: number, customId?: string) {
		updateCartItemQuantity(id, qte, customId);
	}

	async function handleSignOut() {
		const res = await fetch('/auth/signout', { method: 'POST' });
		if (!res.ok) return console.error('Échec déconnexion');

		user = null;
		await invalidateAll();
		sidebarOpen = false;
		goto('/');
	}
</script>

<!-- ----------------------------------------------------------------- -->
<!--  BOUTON PANIER                                                   -->
<!-- ----------------------------------------------------------------- -->
<div class="cartButton relative h-70 ccc">
	<div class="absolute z-50 ccc">
		<Sheet.Root bind:open={sidebarOpen}>
			<Sheet.Trigger>
				<button
					class="m-5 ccc"
					class:text-black={currentMode === 'light'}
					class:text-white={currentMode === 'dark'}
				>
					<ShoppingCart class="w-8 h-8 absolute right-0 top-0 stroke-current transition-colors" />
					<Badge class="bulletCart font-bold absolute z-10 left-0 bottom-0">
						{$cart?.items?.length ?? 0}
					</Badge>
				</button>
			</Sheet.Trigger>

			<!-- ----------------------------------------------------------------- -->
			<!--  CONTENU DU TIROIR                                                -->
			<!-- ----------------------------------------------------------------- -->
			<Sheet.Content class="p-0 min-w-fit">
				<SmoothScrollBar>
					<div class="p-4">
						<h2 class="text-2xl font-bold mb-4">Votre panier</h2>

						{#if isNativeOrder}
							<p class="mb-4">
								Pour les commandes non-custom, les quantités sont fixées à 3 packs de 24 maximum.
							</p>
						{/if}

						{#if $cart && $cart.items && $cart.items.length > 0}
							<div class="max-h-[500px] overflow-y-auto">
								{#each $cart.items as item (item.id)}
									<div
										class="p-4 border rounded-lg shadow-sm flex justify-between items-center mb-2"
									>
										<img
											src={(item.custom?.length > 0 && item.custom[0].image) ||
												(Array.isArray(item.product.images)
													? item.product.images[0]
													: item.product.images) ||
												''}
											alt={item.product.name}
											class="w-20 h-20 object-cover mr-5"
										/>

										<div class="flex-1 mx-4">
											<h3 class="text-lg font-semibold">
												{item.product.name}
												{#if item.custom && item.custom.length > 0}
													<span class="text-sm font-normal text-gray-500">Custom</span>
												{/if}
											</h3>
											<p class="text-gray-600">${item.product.price.toFixed(2)}€</p>

											{#if item.custom && item.custom.length > 0}
												<!-- Custom items: Use predefined quantity options -->
												<select
													class="border rounded px-3 py-2 w-full"
													onchange={(e) =>
														changeQuantity(
															item.product.id,
															parseInt(e.target.value),
															item.custom?.[0]?.id
														)}
												>
													<option value="" disabled selected>Select a quantity option...</option>
													{#each quantityOptions as option}
														<option value={option.value} selected={item.quantity === option.value}>
															{option.label}
														</option>
													{/each}
												</select>
											{:else}
												<Input
													type="number"
													class="border p-2 rounded w-[60px]"
													value={item.quantity}
													oninput={(e) =>
														changeQuantity(
															item.product.id,
															parseInt(e.target.value),
															item.custom?.id
														)}
													min="24"
													max="72"
													step="24"
												/>
											{/if}
										</div>
										<div class="flex flex-col items-end">
											<p class="text-lg font-semibold">
												{(item.price * item.quantity).toFixed(2)}€
											</p>
											<button
												onclick={() => handleRemoveFromCart(item.product.id, item.custom?.id)}
												class="text-red-600 hover:text-red-800"
											>
												<Trash />
											</button>
										</div>
									</div>
								{/each}
							</div>

							<!-- ---------- RÉCAPITULATIF ---------------------------- -->
							<div class="mt-4 border-t pt-4 space-y-2">
								<div class="flex justify-between">
									<span>Subtotal :</span>
									<span>{($cart.subtotal ?? 0).toFixed(2)} €</span>
								</div>
								<div class="flex justify-between">
									<span>TVA (5,5 %) :</span>
									<span>{($cart.tax ?? 0).toFixed(2)} €</span>
								</div>
								<div class="flex justify-between font-semibold text-xl">
									<span>Total :</span>
									<span>{isFinite($cart.total) ? $cart.total.toFixed(2) : '0.00'} €</span>
								</div>
							</div>
						{:else}
							<p>Votre panier est vide.</p>
						{/if}

						<!-- ---------- ACTIONS UTILISATEUR ------------------------ -->
						{#if user}
							<div class="ccc">
								<Button class="w-full m-2" href="/checkout" onclick={() => (sidebarOpen = false)}>
									Checkout
								</Button>
								<Button
									class="w-full m-2"
									href="/auth/settings"
									onclick={() => (sidebarOpen = false)}
								>
									Mes paramètres
								</Button>

								{#if data.user.role === 'ADMIN'}
									<Button class="w-full m-2" href="/admin" onclick={() => (sidebarOpen = false)}>
										Dashboard
									</Button>
								{/if}

								<Button class="w-full m-2" variant="destructive" onclick={handleSignOut}>
									Se déconnecter
								</Button>
							</div>
						{:else}
							<div class="text-center mt-4">
								<p class="mb-2">
									Veuillez vous
									<a
										href="/auth/login"
										onclick={() => (sidebarOpen = false)}
										class="text-blue-500 underline">connecter</a
									>
									ou
									<a
										href="/auth/signup"
										onclick={() => (sidebarOpen = false)}
										class="text-blue-500 underline">vous inscrire</a
									>
									pour finaliser votre commande.
								</p>
							</div>
						{/if}
					</div>
				</SmoothScrollBar>
			</Sheet.Content>
		</Sheet.Root>
	</div>
</div>

<style>
	.cartButton {
		width: 50px;
		height: 50px;
		border: 1px solid white;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 10px;
	}
</style>

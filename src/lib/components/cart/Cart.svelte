<script lang="ts">
	import SmoothScrollBar from './../smoothScrollBar/SmoothScrollBar.svelte';
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/raleway';
	import { cart, removeFromCart, updateCartItemQuantity } from '$lib/store/Data/cartStore';
	import { Badge } from '$shadcn/badge';
	import Button from '$shadcn/button/button.svelte';
	import * as Sheet from '$shadcn/sheet/index.js';
	import { Trash } from 'lucide-svelte';
	import { ShoppingCart } from 'lucide-svelte';
	import Input from '../shadcn/ui/input/input.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { mode } from 'mode-watcher';

	let { data } = $props();

	let user = $state(null);

	$effect(() => {
		user = data?.user;
	});

	let sidebarOpen: boolean = $state(false);
	let currentMode = $derived($mode);
	let isNativeOrder: boolean = $state(false);

	$effect(() => {
		// 🟢 Vérifie si TOUS les produits du panier sont natifs (aucun `custom`)
		isNativeOrder = $cart.items.every(
			(item) => !Array.isArray(item.custom) || item.custom.length === 0
		);
	});

	/**
	 * Handle the removal of an item from the cart.
	 *
	 * @param productId - The ID of the product to remove
	 * @param customId - Optional custom ID to remove a specific custom item
	 */
	function handleRemoveFromCart(productId: string, customId?: string) {
		removeFromCart(productId, customId);
	}

	/**
	 * Handle the change in quantity for a cart item.
	 *
	 * @param productId - The ID of the product to update
	 * @param quantity - The new quantity
	 * @param customId - Optional custom ID to update a specific custom item
	 */
	function changeQuantity(productId: string, quantity: number, customId?: string) {
		updateCartItemQuantity(productId, quantity, customId);
	}

	let quantityOptions = $state([
		{ label: '24 packs de 24 canettes (576 unités)', value: 576 },
		{ label: '1/4 de palette : 30 packs (720 unités)', value: 720 },
		{ label: '1/2 palette : 60 packs (1 440 unités)', value: 1440 },
		{ label: '1 palette : 120 packs (2 880 unités)', value: 2880 },
		{ label: '3 palettes : 360 packs (8 640 unités)', value: 8640 }
	]);

	async function handleSignOut() {
		try {
			const res = await fetch('/auth/signout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (res.ok) {
				console.log('Déconnexion réussie');

				// 🟢 Met à jour l'état `user` localement sans rechargement
				user = null;

				// 🚀 Invalide toutes les données pour que SvelteKit recharge dynamiquement
				await invalidateAll();

				sidebarOpen = false;
				// 🔄 Redirige l'utilisateur vers l'accueil ou la page souhaitée
				goto('/');
			} else {
				console.error('Échec de la déconnexion');
			}
		} catch (error) {
			console.error('Erreur lors de la déconnexion:', error);
		}
	}
</script>

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
					<Badge class="bulletCart font-bold absolute z-10 left-0 bottom-0 color-black">
						{#if $cart && $cart.items}
							{$cart.items.length > 0 ? $cart.items.length : '0'}
						{:else}
							0
						{/if}
					</Badge>
				</button>
			</Sheet.Trigger>

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
							<div class="mt-4 border-t pt-4">
								<div class="mt-4 border-t pt-4">
									<!-- Subtotal -->
									<div class="flex justify-between">
										<span class="text-lg">Subtotal:</span>
										<span class="text-lg">
											${$cart.subtotal?.toFixed(2) || '0.00'}€
										</span>
									</div>
									<!-- Tax (TVA) -->
									<div class="flex justify-between mt-2">
										<span class="text-lg">TVA (5,5%):</span>
										<span class="text-lg">
											${$cart.tax?.toFixed(2) || '0.00'}€
										</span>
									</div>
									<!-- Total -->
									<div class="flex justify-between mt-2">
										<span class="text-xl font-semibold">Total:</span>
										<span class="text-xl font-semibold">
											{isFinite($cart.total) ? $cart.total.toFixed(2) : '0.00'} €
										</span>
									</div>
								</div>
							</div>
						{:else}
							<p>Votre panier est vide.</p>
						{/if}

						{#if user}
							<!-- If the user is logged in -->
							<div class="ccc">
								<Button class="w-full m-2" href="/checkout" onclick={() => (sidebarOpen = false)}
									>Checkout</Button
								>
								<Button
									class="w-full m-2"
									href="/auth/settings"
									onclick={() => (sidebarOpen = false)}
								>
									Mes paramètres
								</Button>

								{#if data.user.role === 'ADMIN'}
									<Button class="w-full m-2" href="/admin" onclick={() => (sidebarOpen = false)}
										>Dashboard</Button
									>
								{/if}

								<Button
									class="w-full m-2"
									type="button"
									variant="destructive"
									onclick={handleSignOut}
								>
									Se déconnecter
								</Button>
							</div>
						{:else}
							<!-- If the user is not logged in -->
							<div class="text-center mt-4">
								<p class=" mb-2">
									Veuillez vous <a
										href="/auth/login"
										onclick={() => (sidebarOpen = false)}
										class="text-blue-500 underline">connecter</a
									>
									ou
									<a
										href="/auth/signup"
										onclick={() => (sidebarOpen = false)}
										class="text-blue-500 underline">vous inscrire</a
									> pour finaliser votre commande.
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

	.bulletCart {
		font-family: 'Raleway Variable', sans-serif;
	}
</style>

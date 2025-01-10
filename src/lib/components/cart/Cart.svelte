<!-- src/lib/components/Cart/Cart.svelte -->

<script lang="ts">
	import '@fontsource-variable/open-sans';
	import '@fontsource-variable/raleway';
	import { cart, removeFromCart, updateCartItemQuantity } from '$lib/store/Data/cartStore';
	import { Badge } from '$shadcn/badge';
	import Button from '$shadcn/button/button.svelte';
	import * as Sheet from '$shadcn/sheet/index.js';
	import { Trash } from 'lucide-svelte';
	import { ShoppingCart } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import Input from '../shadcn/ui/input/input.svelte';

	let { data } = $props();
	const user = data?.user ?? null;

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
		const product = $cart.items.find(
			(item) => item.product.id === productId && (customId ? item.custom?.id === customId : true)
		)?.product;
		if (product && quantity <= Math.min(product.stock, 10)) {
			// Assuming max 10 for demonstration
			updateCartItemQuantity(productId, quantity, customId);
		} else {
			toast.error('Quantité maximale atteinte ou stock insuffisant.');
		}
	}
</script>

<div class="cartButton relative w-70 h-70 mx-7 ccc">
	<div class="absolute z-50 ccc">
		<Sheet.Root>
			<Sheet.Trigger>
				<button class="m-5 ccc">
					<ShoppingCart class="w-8 h-8 z-0 absolute right-0 top-0 stroke-white" />
					<Badge
						class="bulletCart font-bold absolute z-10 left-0 bottom-0 bg-white/90 border-slate-400 "
					>
						{#if $cart && $cart.items}
							{$cart.items.length > 0 ? $cart.items.length : '0'}
						{:else}
							0
						{/if}
					</Badge>
				</button>
			</Sheet.Trigger>

			<Sheet.Content class="p-4 max-w-md w-full">
				<h2 class="text-2xl font-bold mb-4">Your Cart</h2>
				{#if $cart && $cart.items && $cart.items.length > 0}
					<div class="max-h-[500px] overflow-y-auto">
						{#each $cart.items as item (item.id)}
							<div class="p-4 border rounded-lg shadow-sm flex justify-between items-center mb-2">
								<img
									src={item.custom?.image ||
										(Array.isArray(item.product.images)
											? item.product.images[0]
											: item.product.images) ||
										''}
									alt={item.product.name}
									class="w-20 h-20 object-cover"
								/>

								<div class="flex-1 mx-4">
									<h3 class="text-lg font-semibold">
										{item.product.name}
										{#if item.custom}
											<span class="text-sm font-normal text-gray-500">Custom</span>
										{/if}
									</h3>
									<p class="text-gray-600">${item.product.price.toFixed(2)}€</p>
									<div>
										<div>
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
												min="1"
												max={item.product.stock}
											/>
										</div>
									</div>
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
									${$cart.total?.toFixed(2) || '0.00'}€
								</span>
							</div>
						</div>
					</div>
					<Button>
						<a href="/checkout">Checkout</a>
					</Button>
				{:else}
					<p>Your cart is empty.</p>
				{/if}

				{#if user}
					<!-- If the user is logged in -->
					<Button>
						<a href="/auth">Mes paramètres</a>
					</Button>
				{:else}
					<!-- If the user is not logged in -->
					<div class="text-center mt-4">
						<p class=" mb-2">
							Veuillez vous <a href="/auth/login" class="text-blue-500 underline">connecter</a>
							ou <a href="/auth/signup" class="text-blue-500 underline">vous inscrire</a> pour finaliser
							votre commande.
						</p>
						<Button>
							<a href="/auth/login">Se connecter</a>
						</Button>
					</div>
				{/if}
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

<script lang="ts">
	import { cart, removeFromCart, updateCartItemQuantity } from '$lib/store/Data/cartStore';
	import { Badge } from '$shadcn/badge';
	import Button from '$shadcn/button/button.svelte';
	import * as Sheet from '$shadcn/sheet/index.js';
	import { Trash } from 'lucide-svelte';
	import { ShoppingCart } from 'lucide-svelte';

	// Gère la suppression d'un article du panier
	function handleRemoveFromCart(productId: string) {
		removeFromCart(productId);
	}

	// Met à jour la quantité d'un article
	function changeQuantity(productId: string, quantity: number) {
		const product = $cart.items.find((item) => item.product.id === productId)?.product;
		if (product && quantity <= Math.min(product.stock, 10)) {
			updateCartItemQuantity(productId, quantity);
		} else {
			alert('Selected quantity exceeds available stock or the maximum limit of 10.');
		}
	}

	// Crée les options de quantité basées sur le stock disponible et une limite maximale de 10
	function createQuantityOptions(stock: number) {
		const maxQuantity = Math.min(stock, 10);
		return Array.from({ length: maxQuantity }, (_, i) => i + 1).map((value) => ({
			value,
			label: value.toString()
		}));
	}
</script>

<div class="absolute right-3 top-3 z-50">
	<Sheet.Root>
		<Sheet.Trigger asChild>
			<button class="m-5 text-gray-600 ccc">
				<ShoppingCart class="z-50 absolute right-0" />
				<Badge class="absolute bottom-5 left-0">
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
							{#if item.product.images && item.product.images[0]}
								<img
									src={item.product.images[0]}
									alt={item.product.name}
									class="w-20 h-20 object-cover"
								/>
							{/if}
							<div class="flex-1 mx-4">
								<h3 class="text-lg font-semibold">{item.product.name}</h3>
								<p class="text-gray-600">${item.product.price.toFixed(1)}€</p>
								<div>
									<select
										class="border p-2 rounded"
										on:change={(e) => changeQuantity(item.product.id, parseInt(e.target.value))}
										bind:value={item.quantity}
									>
										{#each createQuantityOptions(item.product.stock) as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</div>
							</div>
							<div class="flex flex-col items-end">
								<p class="text-lg font-semibold">
									{(item.price * item.quantity).toFixed(1)}€
								</p>
								<button
									on:click={() => handleRemoveFromCart(item.product.id)}
									class="text-red-600 hover:text-red-800"
								>
									<Trash />
								</button>
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 border-t pt-4">
					<div class="flex justify-between">
						<span class="text-xl font-semibold">Total:</span>
						<span class="text-xl font-semibold">
							{$cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(1)}€
						</span>
					</div>
				</div>
				<Button>
					<a href="/checkout">Checkout</a>
				</Button>
			{:else}
				<p>Your cart is empty.</p>
			{/if}
		</Sheet.Content>
	</Sheet.Root>
</div>

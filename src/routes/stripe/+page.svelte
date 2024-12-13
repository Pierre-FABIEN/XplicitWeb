<script lang="ts">
	import { Button } from '$shadcn/button';
	import { Card, CardHeader, CardContent, CardFooter } from '$shadcn/card';
	import { Badge } from '$shadcn/badge';
	import { cartItems, addToCart, removeFromCart } from './cart';

	const products = [
		{
			id: 1,
			name: 'Dog',
			price: 14.99
		},
		{
			id: 2,
			name: 'Cat',
			price: 14.99
		},
		{
			id: 3,
			name: 'Fish',
			price: 14.99
		}
	];

	async function checkout() {
		const data = await fetch('stripe/checkout', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				items: $cartItems
			})
		}).then((data) => data.json());
		window.location.replace(data.url);
	}
</script>

<main class="p-6 space-y-8 max-w-5xl mx-auto">
	<h1 class="text-4xl font-bold text-center">Products</h1>

	<div class="grid gap-6 md:grid-cols-3">
		{#each products as product}
			<Card class="bg-transparent">
				<CardHeader>
					<h2 class="text-lg font-semibold">{product.name}</h2>
				</CardHeader>
				<CardContent>
					<p class="text-gray-600">Price: <span class="font-bold">${product.price}</span></p>
				</CardContent>
				<CardFooter class="flex justify-center">
					<Button variant="default" onclick={() => addToCart(product)}>Add to Cart</Button>
				</CardFooter>
			</Card>
		{/each}
	</div>

	{#if $cartItems.length > 0}
		<h1 class="text-4xl font-bold text-center mt-12">Cart</h1>

		<div class="grid gap-6 md:grid-cols-3">
			{#each $cartItems as cartItem}
				<Card class="bg-transparent">
					<CardHeader>
						<h2 class="text-lg font-semibold">{cartItem.name}</h2>
					</CardHeader>
					<CardContent>
						<p>Amount: <Badge>{cartItem.amount}</Badge></p>
						<p>Price per unit: <span class="font-bold">${cartItem.price}</span></p>
						<p>Total: <span class="font-bold">${cartItem.price * cartItem.amount}</span></p>
					</CardContent>
					<CardFooter class="flex justify-between">
						<Button variant="outline" onclick={() => removeFromCart(cartItem.id)}>Remove</Button>
					</CardFooter>
				</Card>
			{/each}
		</div>

		<div class="flex justify-center mt-6">
			<Button variant="default" size="lg" onclick={checkout}>Checkout</Button>
		</div>
	{/if}
</main>

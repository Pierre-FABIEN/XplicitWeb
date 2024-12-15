import { writable } from 'svelte/store';

export type OrderItem = {
	id: string;
	product: {
		id: string;
		name: string;
		price: number;
		images: string[];
	};
	quantity: number;
	price: number;
};

export const cart = writable({
	id: '',
	userId: '',
	items: [] as OrderItem[],
	total: 0,
	lastModified: Date.now()
});

export const setCart = (id: string, userId: string, items: OrderItem[], total: number) => {
	cart.set({
		id,
		userId,
		items,
		total,
		lastModified: Date.now()
	});
};

export const addToCart = (product: OrderItem) => {
	cart.update((currentCart) => {
		if (!Array.isArray(currentCart.items)) {
			currentCart.items = [];
		}
		const itemIndex = currentCart.items.findIndex((item) => item.product.id === product.product.id);
		if (itemIndex !== -1) {
			currentCart.items[itemIndex].quantity += 1;
		} else {
			currentCart.items.push(product);
		}
		currentCart.total = currentCart.items.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0
		);
		currentCart.lastModified = Date.now();
		console.log('Cart after adding item:', JSON.stringify(currentCart, null, 2));
		return currentCart;
	});
};

export const removeFromCart = (productId: string) => {
	cart.update((currentCart) => {
		if (!Array.isArray(currentCart.items)) {
			currentCart.items = [];
		}
		currentCart.items = currentCart.items.filter((item) => item.product.id !== productId);
		currentCart.total = currentCart.items.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0
		);
		currentCart.lastModified = Date.now();
		//console.log('Cart after removing item:', JSON.stringify(currentCart, null, 2));
		return currentCart;
	});
};

export const updateCartItemQuantity = (productId: string, quantity: number) => {
	cart.update((currentCart) => {
		if (!Array.isArray(currentCart.items)) {
			currentCart.items = [];
		}
		const itemIndex = currentCart.items.findIndex((item) => item.product.id === productId);
		if (itemIndex !== -1) {
			currentCart.items[itemIndex].quantity = quantity;
		}
		currentCart.total = currentCart.items.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0
		);
		currentCart.lastModified = Date.now();
		//console.log('Cart after updating item quantity:', JSON.stringify(currentCart, null, 2));
		return currentCart;
	});
};

cart.subscribe((currentCart) => {
	console.log('Cart:', currentCart);
});

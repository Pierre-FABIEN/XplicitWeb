import { writable } from 'svelte/store';

export type OrderItem = {
	id: string;
	product: {
		id: string;
		name: string;
		price: number;
		images: string;
	};
	quantity: number;
	price: number;
	custom: {
		id: string;
		image: string;
		userMessage: string;
	};
};

type CartState = {
	id: string;
	userId: string;
	items: OrderItem[];
	total: number;
	lastModified: number;
};

export const cart = writable<CartState>();

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
	console.log(product, 'product addToCart');

	cart.update((currentCart) => {
		// Assurez-vous que `items` est un tableau
		if (!Array.isArray(currentCart.items)) {
			currentCart.items = [];
		}

		// Vérifiez si le produit avec la même personnalisation existe
		const itemIndex = currentCart.items.findIndex(
			(item) =>
				item.product.id === product.product.id &&
				item.custom?.userMessage === product.custom?.userMessage
		);

		if (itemIndex !== -1) {
			// Met à jour la quantité si le produit existe
			currentCart.items[itemIndex].quantity += product.quantity;
		} else {
			// Ajoute un nouvel article
			currentCart.items.push({
				...product,
				product: {
					...product.product,
					images: product.product.images
				}
			});
		}

		// Recalcule le total
		currentCart.total = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);
		currentCart.lastModified = Date.now();

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
		return currentCart;
	});
};

cart.subscribe((currentCart) => {
	console.log('Cart updated:', JSON.stringify(currentCart, null, 2));
});

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

type CartState = {
	id: string;
	userId: string;
	items: OrderItem[];
	total: number;
	lastModified: number;
};

function isBrowser(): boolean {
	return typeof window !== 'undefined';
}

function loadCartFromLocalStorage(): CartState {
	if (!isBrowser()) {
		// Retourner un panier vide si ce n'est pas le navigateur
		return {
			id: '',
			userId: '',
			items: [],
			total: 0,
			lastModified: Date.now()
		};
	}

	const savedCart = localStorage.getItem('cart');
	if (savedCart) {
		try {
			return JSON.parse(savedCart);
		} catch {
			return {
				id: '',
				userId: '',
				items: [],
				total: 0,
				lastModified: Date.now()
			};
		}
	}
	return {
		id: '',
		userId: '',
		items: [],
		total: 0,
		lastModified: Date.now()
	};
}

export const cart = writable<CartState>(loadCartFromLocalStorage());

function saveCartToLocalStorage(currentCart: CartState) {
	if (isBrowser() && !currentCart.userId) {
		localStorage.setItem('cart', JSON.stringify(currentCart));
	}
}

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
	console.log('Cart:', currentCart);
	// Sauvegarde dans localStorage si le contexte est navigateur
	saveCartToLocalStorage(currentCart);
});

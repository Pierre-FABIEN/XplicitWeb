import { writable } from 'svelte/store';

export type OrderItem = {
	id: string;
	product: {
		id: string;
		name: string;
		price: number;
		images: string;
		stock: number;
	};
	quantity: number;
	price: number;
	custom?: {
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

export const cart = writable<CartState>({
	id: '',
	userId: '',
	items: [],
	total: 0,
	lastModified: Date.now()
});

/**
 * Set the cart state with given parameters.
 */
export const setCart = (id: string, userId: string, items: OrderItem[], total: number) => {
	cart.set({
		id,
		userId,
		items,
		total,
		lastModified: Date.now()
	});
};

/**
 * Add a product to the cart, respecting stock limits.
 */
export const addToCart = (product: OrderItem) => {
	cart.update((currentCart) => {
		if (!Array.isArray(currentCart.items)) {
			currentCart.items = [];
		}

		// Calculate total quantity in the cart for this product (custom + non-custom)
		const totalQuantityForProduct = currentCart.items
			.filter((item) => item.product.id === product.product.id)
			.reduce((sum, item) => sum + item.quantity, 0);

		// Check if adding this product exceeds stock
		const availableStock = product.product.stock - totalQuantityForProduct;
		if (availableStock <= 0) {
			console.error('Cannot add product, stock exceeded.');
			return currentCart;
		}

		// Adjust quantity if it exceeds available stock
		const quantityToAdd = Math.min(product.quantity, availableStock);

		// Check if a custom variant already exists
		const itemIndex = currentCart.items.findIndex(
			(item) => item.product.id === product.product.id && item.custom === product.custom
		);

		if (itemIndex !== -1) {
			// Update the quantity if the product already exists
			currentCart.items[itemIndex].quantity += quantityToAdd;
		} else {
			// Add as a new entry
			currentCart.items.push({
				...product,
				quantity: quantityToAdd // Adjusted quantity
			});
		}

		// Recalculate total price
		currentCart.total = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);
		currentCart.lastModified = Date.now();

		return currentCart;
	});
};

/**
 * Remove a product from the cart by product ID and optional custom ID.
 */
export const removeFromCart = (productId: string, customId?: string) => {
	cart.update((currentCart) => {
		// Filter out the product based on the custom ID (if provided)
		currentCart.items = currentCart.items.filter((item) => {
			// If a customId is provided, ensure it matches the custom item
			if (customId) {
				return !(item.product.id === productId && item.custom?.id === customId);
			}

			// If no customId, remove only non-custom items with matching productId
			return !(item.product.id === productId && !item.custom);
		});

		// Recalculate the total price
		currentCart.total = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);

		currentCart.lastModified = Date.now();
		return currentCart;
	});
};

/**
 * Update the quantity of a product in the cart, respecting stock limits.
 */
export const updateCartItemQuantity = (productId: string, quantity: number, customId?: string) => {
	cart.update((currentCart) => {
		const itemIndex = currentCart.items.findIndex(
			(item) => item.product.id === productId && (!customId || item.custom?.id === customId)
		);

		if (itemIndex !== -1) {
			// Calculate total quantity in the cart for this product (excluding this item)
			const otherItemsQuantity = currentCart.items
				.filter((item, index) => index !== itemIndex && item.product.id === productId)
				.reduce((sum, item) => sum + item.quantity, 0);

			// Check available stock for this product
			const maxAvailable = currentCart.items[itemIndex].product.stock - otherItemsQuantity;

			// Update quantity, respecting stock limits
			currentCart.items[itemIndex].quantity = Math.min(quantity, maxAvailable);
		}

		// Recalculate total price
		currentCart.total = currentCart.items.reduce(
			(sum, item) => sum + item.price * item.quantity,
			0
		);
		currentCart.lastModified = Date.now();

		return currentCart;
	});
};

// Subscribe to cart changes (for debugging or UI updates)
// cart.subscribe((currentCart) => {
// 	console.log('Cart updated:', JSON.stringify(currentCart, null, 2));
// });

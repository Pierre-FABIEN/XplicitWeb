// src/lib/store/Data/cartStore.ts
import { toast } from 'svelte-sonner';
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
	subtotal: number; // HT (products only)
	tax: number; // VAT (products only)
	shippingCost: number; // shipping HT
	shippingTax: number; // shipping VAT
	total: number; // final total (TTC) = (subtotal + tax + shippingCost + shippingTax)
	lastModified: number;
};

// Initialize the store with default values
export const cart = writable<CartState>({
	id: '',
	userId: '',
	items: [],
	subtotal: 0,
	tax: 0,
	shippingCost: 0, // default 0
	shippingTax: 0, // default 0
	total: 0,
	lastModified: Date.now()
});

/**
 * Helper function to recalc the final total
 * total = products subtotal + product tax + shipping cost + shipping tax
 */
function recalcFinalTotal(c: CartState) {
	c.total = calcTotal(c.subtotal, c.tax, c.shippingCost, c.shippingTax);
	c.lastModified = Date.now();
}

/**
 * Sets the entire cart, if you want to load it from the DB or an external source
 */
export const setCart = (
	id: string,
	userId: string,
	items: OrderItem[],
	subtotal: number,
	tax: number,
	shippingCost: number,
	shippingTax: number
) => {
	cart.set({
		id,
		userId,
		items,
		subtotal,
		tax,
		shippingCost,
		shippingTax,
		total: calcTotal(subtotal, tax, shippingCost, shippingTax),
		lastModified: Date.now()
	});
};

function calcTotal(subtotal = 0, tax = 0, shippingCost = 0, shippingTax = 0) {
	console.log(
		'subtotal:',
		subtotal,
		'tax:',
		tax,
		'shippingCost:',
		shippingCost,
		'shippingTax:',
		shippingTax
	);

	return parseFloat((subtotal + tax + shippingCost + shippingTax).toFixed(2));
}

/**
 * Updates only the shipping cost (HT). We recalc shippingTax if needed.
 */
export function setShippingCostHT(newShippingCost: number) {
	cart.update((c) => {
		c.shippingCost = newShippingCost;
		c.shippingTax = parseFloat((newShippingCost * 0.055).toFixed(2)); // 5.5% vat
		recalcFinalTotal(c);
		return c;
	});
}

/**
 * Example function to remove or add shipping tax with a custom rate
 */
export function setShippingTaxRate(rate: number) {
	cart.update((c) => {
		c.shippingTax = parseFloat((c.shippingCost * rate).toFixed(2));
		recalcFinalTotal(c);
		return c;
	});
}

/**
 * Adds a product to the cart, respecting stock, 72-limit, etc.
 */
export const addToCart = (product: OrderItem) => {
	cart.update((currentCart) => {
		if (!Array.isArray(currentCart.items)) {
			currentCart.items = [];
		}

		const isProductCustom = Array.isArray(product.custom) && product.custom.length > 0;

		const existingTypeConflict = currentCart.items.some((item) => {
			const isItemCustom = Array.isArray(item.custom) && item.custom.length > 0;
			return isItemCustom !== isProductCustom;
		});

		if (existingTypeConflict) {
			console.error('Cannot mix custom and non-custom items in the same order');
			toast.error('Impossible de mélanger produits custom et non-custom dans cette commande.');
			return currentCart;
		}

		// 72-limit check
		if (!isProductCustom) {
			const totalNativeQuantity = currentCart.items
				.filter((item) => !Array.isArray(item.custom) || item.custom.length === 0)
				.reduce((sum, item) => sum + item.quantity, 0);

			if (totalNativeQuantity + product.quantity > 72) {
				console.error('Cannot add product: limit is 72 units for native orders.');
				toast.error('Limite de 72 unités pour les commandes non personnalisées.');
				return currentCart;
			}
		}

		const totalQuantityForProduct = currentCart.items
			.filter((item) => item.product.id === product.product.id)
			.reduce((sum, item) => sum + item.quantity, 0);

		const availableStock = product.product.stock - totalQuantityForProduct;
		if (availableStock <= 0) {
			console.error('Stock exceeded');
			toast.error('Stock insuffisant.');
			return currentCart;
		}

		const quantityToAdd = Math.min(product.quantity, availableStock);

		const itemIndex = currentCart.items.findIndex(
			(item) =>
				item.product.id === product.product.id &&
				JSON.stringify(item.custom) === JSON.stringify(product.custom)
		);

		if (itemIndex !== -1) {
			currentCart.items[itemIndex].quantity += quantityToAdd;
		} else {
			currentCart.items.push({
				...product,
				quantity: quantityToAdd
			});
		}

		// Recalc product subtotal
		const newSubtotal = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);
		const newTax = parseFloat((newSubtotal * 0.055).toFixed(2));

		currentCart.subtotal = newSubtotal;
		currentCart.tax = newTax;

		// Recalc final total (including shipping cost/tax)
		recalcFinalTotal(currentCart);

		return currentCart;
	});
};

/**
 * Removes a product from the cart
 */
export const removeFromCart = (productId: string, customId?: string) => {
	cart.update((currentCart) => {
		const itemToRemoveExists = currentCart.items.some(
			(item) => item.product.id === productId && (!customId || item.custom?.id === customId)
		);

		if (!itemToRemoveExists) {
			toast.error('Produit introuvable dans le panier.');
			return currentCart;
		}

		currentCart.items = currentCart.items.filter((item) => {
			if (customId) {
				return !(item.product.id === productId && item.custom?.id === customId);
			}
			return item.product.id !== productId;
		});

		const newSubtotal = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);
		const newTax = parseFloat((newSubtotal * 0.055).toFixed(2));

		currentCart.subtotal = newSubtotal;
		currentCart.tax = newTax;

		recalcFinalTotal(currentCart);

		toast.success('Produit supprimé du panier.');
		return currentCart;
	});
};

/**
 * Updates the quantity of a product in the cart
 */
export const updateCartItemQuantity = (productId: string, quantity: number, customId?: string) => {
	cart.update((currentCart) => {
		const itemIndex = currentCart.items.findIndex(
			(item) => item.product.id === productId && (!customId || item.custom?.id === customId)
		);

		if (itemIndex === -1) {
			console.warn('Item not found in cart for Product ID:', productId);
			return currentCart;
		}

		const currentItem = currentCart.items[itemIndex];

		const otherItemsQuantity = currentCart.items
			.filter((_, idx) => idx !== itemIndex && _.product.id === productId)
			.reduce((sum, i) => sum + i.quantity, 0);

		const maxAvailable = currentItem.product.stock - otherItemsQuantity;
		let newQuantity = Math.min(quantity, maxAvailable);

		// 72-limit logic if not custom
		if (!currentItem.custom) {
			const nativeItemsTotal = currentCart.items
				.filter((i, idx) => !i.custom && idx !== itemIndex)
				.reduce((sum, i) => sum + i.quantity, 0);

			const maxNativeAllowed = 72;
			const allowedForThisItem = maxNativeAllowed - nativeItemsTotal;

			newQuantity = Math.min(newQuantity, allowedForThisItem);
		}

		currentItem.quantity = newQuantity;

		const newSubtotal = currentCart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
		const newTax = parseFloat((newSubtotal * 0.055).toFixed(2));

		currentCart.subtotal = newSubtotal;
		currentCart.tax = newTax;

		recalcFinalTotal(currentCart);
		return currentCart;
	});
};

export function resetCart() {
	cart.update((c) => {
		c.id = '';
		c.userId = '';
		c.items = [];
		c.subtotal = 0;
		c.tax = 0;
		c.shippingCost = 0;
		c.shippingTax = 0;
		c.total = 0;
		c.lastModified = Date.now();
		return c;
	});

	toast.success('Commande validée, panier vidé.');
}

// Debug
cart.subscribe((currentCart) => {
	console.log('Cart updated =>', JSON.stringify(currentCart, null, 2));
});

// src/lib/store/Data/cartStore.ts

import { toast } from 'svelte-sonner';
import { writable } from 'svelte/store';

/**
 * Type definition for an OrderItem.
 */
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

/**
 * Type definition for the CartState.
 */
type CartState = {
	id: string;
	userId: string;
	items: OrderItem[];
	subtotal: number; // Sum of all items before tax
	tax: number; // VAT amount
	total: number; // Total amount including tax
	lastModified: number;
};

/**
 * Initialize the cart store with default values.
 */
export const cart = writable<CartState>({
	id: '',
	userId: '',
	items: [],
	subtotal: 0,
	tax: 0,
	total: 0,
	lastModified: Date.now()
});

/**
 * Function to set the entire cart state.
 *
 * @param id - Cart ID
 * @param userId - User ID
 * @param items - Array of OrderItems
 * @param subtotal - Subtotal before tax
 * @param tax - VAT amount
 * @param total - Total amount including tax
 */
export const setCart = (
	id: string,
	userId: string,
	items: OrderItem[],
	subtotal: number,
	tax: number,
	total: number
) => {
	cart.set({
		id,
		userId,
		items,
		subtotal,
		tax,
		total,
		lastModified: Date.now()
	});
};

/**
 * Function to add a product to the cart, respecting stock limits and preventing fusion of custom and non-custom orders.
 *
 * @param product - The OrderItem to add to the cart
 */
export const addToCart = (product: OrderItem) => {
	cart.update((currentCart) => {
		if (!Array.isArray(currentCart.items)) {
			currentCart.items = [];
		}

		const conflictingItem = currentCart.items.find(
			(item) => (item.custom && !product.custom) || (!item.custom && product.custom)
		);

		if (conflictingItem) {
			// Prevent adding if a conflicting item exists
			console.error(
				'Cannot add product: custom and non-custom items cannot coexist for the same product.'
			);
			toast.error('Les articles personnalisés et non-personnalisés ne peuvent pas être combinés.');
			return currentCart;
		}

		// Calculate total quantity in the cart for this product (custom + non-custom)
		const totalQuantityForProduct = currentCart.items
			.filter((item) => item.product.id === product.product.id)
			.reduce((sum, item) => sum + item.quantity, 0);

		// Check if adding this product exceeds stock
		const availableStock = product.product.stock - totalQuantityForProduct;
		if (availableStock <= 0) {
			console.error('Cannot add product, stock exceeded.');
			toast.error('Stock insuffisant pour ajouter ce produit.');
			return currentCart;
		}

		// Adjust quantity if it exceeds available stock
		const quantityToAdd = Math.min(product.quantity, availableStock);

		// Check if an identical custom variant already exists
		const itemIndex = currentCart.items.findIndex(
			(item) => item.product.id === product.product.id && item.custom?.id === product.custom?.id
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

		// Recalculate subtotal
		const newSubtotal = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);

		// Calculate tax (5.5% of subtotal)
		const newTax = parseFloat((newSubtotal * 0.055).toFixed(2));

		// Calculate total (subtotal + tax)
		const newTotal = parseFloat((newSubtotal + newTax).toFixed(2));

		currentCart.subtotal = newSubtotal;
		currentCart.tax = newTax;
		currentCart.total = newTotal;
		currentCart.lastModified = Date.now();

		return currentCart;
	});
};

/**
 * Function to remove a product from the cart by product ID and optional custom ID.
 *
 * @param productId - The ID of the product to remove
 * @param customId - Optional custom ID to remove a specific custom item
 */
export const removeFromCart = (productId: string, customId?: string) => {
	cart.update((currentCart) => {
		// Vérifiez si des produits correspondent avant de modifier le panier
		const itemToRemoveExists = currentCart.items.some(
			(item) => item.product.id === productId && (!customId || item.custom?.id === customId)
		);

		if (!itemToRemoveExists) {
			// Produit introuvable dans le panier
			toast.error('Produit non trouvé dans le panier.');
			return currentCart;
		}

		// Filtre les articles en excluant celui à supprimer
		currentCart.items = currentCart.items.filter((item) => {
			// Supprime les articles correspondant à productId et customId (si fourni)
			if (customId) {
				return !(item.product.id === productId && item.custom?.id === customId);
			}
			// Supprime les articles non-custom correspondant à productId
			return item.product.id !== productId;
		});

		// Recalculer le sous-total
		const newSubtotal = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);

		// Recalculer la TVA (5,5%)
		const newTax = parseFloat((newSubtotal * 0.055).toFixed(2));

		// Recalculer le total
		const newTotal = parseFloat((newSubtotal + newTax).toFixed(2));

		// Mettre à jour le panier avec les nouvelles valeurs
		currentCart.subtotal = newSubtotal;
		currentCart.tax = newTax;
		currentCart.total = newTotal;
		currentCart.lastModified = Date.now();

		// Notification de réussite
		toast.success('Produit supprimé du panier.');

		return currentCart;
	});
};

/**
 * Function to update the quantity of a product in the cart, respecting stock limits.
 *
 * @param productId - The ID of the product to update
 * @param quantity - The new quantity
 * @param customId - Optional custom ID to update a specific custom item
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

		// Recalculate subtotal
		const newSubtotal = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);

		// Calculate tax (5.5% of subtotal)
		const newTax = parseFloat((newSubtotal * 0.055).toFixed(2));

		// Calculate total (subtotal + tax)
		const newTotal = parseFloat((newSubtotal + newTax).toFixed(2));

		currentCart.subtotal = newSubtotal;
		currentCart.tax = newTax;
		currentCart.total = newTotal;
		currentCart.lastModified = Date.now();

		return currentCart;
	});
};

// Subscribe to cart changes (for debugging or UI updates)
cart.subscribe((currentCart) => {
	console.log('Cart updated:', JSON.stringify(currentCart, null, 2));
});

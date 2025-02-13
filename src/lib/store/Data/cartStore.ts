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
export const addToCart = (product: OrderItem) => {
	cart.update((currentCart) => {
		if (!Array.isArray(currentCart.items)) {
			currentCart.items = [];
		}

		// 🔍 Vérifie si le produit ajouté est customisé ou natif
		const isProductCustom = Array.isArray(product.custom) && product.custom.length > 0;

		// 🔥 Vérification : Est-ce que le panier contient déjà un produit de type opposé ?
		const existingTypeConflict = currentCart.items.some((item) => {
			const isItemCustom = Array.isArray(item.custom) && item.custom.length > 0;
			return isItemCustom !== isProductCustom;
		});

		if (existingTypeConflict) {
			console.error(
				'Cannot add product: custom and non-custom items cannot coexist in the same order.'
			);
			toast.error(
				'Les articles personnalisés et non-personnalisés ne peuvent pas être mélangés dans une même commande.'
			);
			return currentCart;
		}

		// 📌 Vérification de la limite pour les commandes natives (max 72 unités)
		if (!isProductCustom) {
			const totalNativeQuantity = currentCart.items
				.filter((item) => !Array.isArray(item.custom) || item.custom.length === 0) // 🟢 Filtre les commandes natives
				.reduce((sum, item) => sum + item.quantity, 0);

			if (totalNativeQuantity + product.quantity > 72) {
				console.error('Cannot add product: native orders are limited to 72 units.');
				toast.error('Les commandes non personnalisées sont limitées à 72 unités.');
				return currentCart;
			}
		}

		// 🟢 Calcul du stock disponible
		const totalQuantityForProduct = currentCart.items
			.filter((item) => item.product.id === product.product.id)
			.reduce((sum, item) => sum + item.quantity, 0);

		const availableStock = product.product.stock - totalQuantityForProduct;
		if (availableStock <= 0) {
			console.error('Cannot add product, stock exceeded.');
			toast.error('Stock insuffisant pour ajouter ce produit.');
			return currentCart;
		}

		// 🔥 Détermine la quantité à ajouter (sans dépasser le stock)
		const quantityToAdd = Math.min(product.quantity, availableStock);

		// 📌 Recherche si une version **identique** (même produit + même customisation) existe déjà
		const itemIndex = currentCart.items.findIndex(
			(item) =>
				item.product.id === product.product.id &&
				JSON.stringify(item.custom) === JSON.stringify(product.custom) // Compare les objets custom
		);

		if (itemIndex !== -1) {
			// 🔄 Met à jour la quantité
			currentCart.items[itemIndex].quantity += quantityToAdd;
		} else {
			// ➕ Ajoute un nouvel item
			currentCart.items.push({
				...product,
				quantity: quantityToAdd // Quantité ajustée
			});
		}

		// 📊 Recalcul des prix
		const newSubtotal = currentCart.items.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0
		);
		const newTax = parseFloat((newSubtotal * 0.055).toFixed(2));
		const newTotal = parseFloat((newSubtotal + newTax).toFixed(2));

		// ✅ Mise à jour du panier
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

export const updateCartItemQuantity = (productId: string, quantity: number, customId?: string) => {
	cart.update((currentCart) => {
		const itemIndex = currentCart.items.findIndex(
			(item) =>
				item.product.id === productId &&
				(!customId || item.custom?.some((custom) => custom.id === customId))
		);

		if (itemIndex === -1) {
			console.warn('Item not found in cart for Product ID:', productId, 'and Custom ID:', customId);
			return currentCart;
		}

		console.log('Item found at index:', itemIndex);
		const currentItem = currentCart.items[itemIndex];

		// Vérifier le stock disponible uniquement pour ce produit
		// (La quantité des autres items identiques)
		const otherItemsQuantity = currentCart.items
			.filter((_, idx) => idx !== itemIndex && _.product.id === productId)
			.reduce((sum, i) => sum + i.quantity, 0);
		const maxAvailable = currentItem.product.stock - otherItemsQuantity;

		// 1. Clamper la quantité au stock
		let newQuantity = Math.min(quantity, maxAvailable);

		// 2. Si c'est un produit "natif" (pas de .custom),
		//    imposer une limite globale de 72
		if (!currentItem.custom) {
			// Calculer la quantité de tous les autres produits "natifs"
			const nativeItemsTotal = currentCart.items
				.filter((i, idx) => !i.custom && idx !== itemIndex)
				.reduce((sum, i) => sum + i.quantity, 0);

			// Vérifier la somme globale
			const maxNativeAllowed = 72;
			const allowedForThisItem = maxNativeAllowed - nativeItemsTotal;

			newQuantity = Math.min(newQuantity, allowedForThisItem);

			// (Optionnel) S'assurer que la quantité soit multiple de 24
			// newQuantity = Math.floor(newQuantity / 24) * 24;
			// si tu veux forcer un step de 24
		}

		console.log('Final newQuantity after constraints:', newQuantity);
		currentItem.quantity = newQuantity;

		// Recalculer les totaux
		const newSubtotal = currentCart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
		const newTax = parseFloat((newSubtotal * 0.055).toFixed(2));
		const newTotal = parseFloat((newSubtotal + newTax).toFixed(2));

		currentCart.subtotal = newSubtotal;
		currentCart.tax = newTax;
		currentCart.total = newTotal;
		currentCart.lastModified = Date.now();

		console.log('Updated cart state:', JSON.stringify(currentCart, null, 2));
		return currentCart;
	});
};

// Subscribe to cart changes (for debugging or UI updates)
cart.subscribe((currentCart) => {
	console.log('Cart updated:', JSON.stringify(currentCart, null, 2));
});

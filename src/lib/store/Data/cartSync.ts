// syncCart.ts
import { cart } from './cartStore';
import { get } from 'svelte/store';

let lastSynced = 0;
let isSyncing = false;

const syncCart = async () => {
	const currentCart = get(cart);

	if (isSyncing) {
		// A sync is already in progress
		return;
	}

	// If it's the first time, initialize the "lastSynced"
	if (lastSynced === 0) {
		lastSynced = currentCart.lastModified;
		return;
	}

	// Check if there's anything new to sync
	if (currentCart.lastModified > lastSynced) {
		isSyncing = true;

		console.log('iluhliguligig', currentCart);

		try {
			const response = await fetch('/api/save-cart', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(currentCart)
			});
			if (!response.ok) {
				throw new Error('Failed to save cart');
			}

			// Update lastSynced only if successful
			lastSynced = currentCart.lastModified;
		} catch (error) {
			console.error('Failed to sync cart:', error);
		} finally {
			isSyncing = false;
		}
	}
};

export const startSync = () => {
	// Subscribe to the cart store changes
	cart.subscribe(() => {
		// Immediately call syncCart after each change
		syncCart();
	});
};

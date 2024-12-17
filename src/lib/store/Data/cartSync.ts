import { cart } from './cartStore';
import { get } from 'svelte/store';

let lastSynced = Date.now();

const syncCart = async () => {
	const currentCart = get(cart);
	console.log(currentCart, 'currentCart');

	if (currentCart.lastModified > lastSynced) {
		//console.log(currentCart, 'currentCart');
		try {
			const response = await fetch('/api/save-cart', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(currentCart)
			});

			if (!response.ok) {
				throw new Error('Failed to save cart');
			}

			lastSynced = Date.now();
		} catch (error) {
			console.error('Failed to sync cart:', error);
		}
	}
};

const startSync = () => {
	setInterval(syncCart, 20000); // Sync every 2 seconds
};

export { startSync };

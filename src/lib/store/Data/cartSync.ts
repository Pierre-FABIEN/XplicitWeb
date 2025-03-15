import { cart } from './cartStore';
import { get } from 'svelte/store';

let lastSynced = 0;
let isSyncing = false; // Verrou pour empêcher des appels multiples

const syncCart = async () => {
	const currentCart = get(cart);

	// console.log('lastModified:', currentCart.lastModified);
	// console.log('lastSynced:', lastSynced);

	if (isSyncing) {
		// console.log('Sync already in progress. Skipping this call.');
		return;
	}

	if (lastSynced === 0) {
		// Initialisation du verrou au premier appel
		lastSynced = currentCart.lastModified;
		// console.log('Initialized lastSynced to', lastSynced);
		return;
	}

	if (currentCart.lastModified > lastSynced) {
		isSyncing = true; // Active le verrou
		//console.log('Synchronizing cart...');
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

			// Met à jour `lastSynced` uniquement après une synchronisation réussie
			lastSynced = currentCart.lastModified;

			//console.log(response, 'iiiiiiiiiiiiiiiiii');
		} catch (error) {
			//console.error('Failed to sync cart:', error);
		} finally {
			isSyncing = false; // Libère le verrou
		}
	} else {
		//console.log('No sync needed. Cart is already up-to-date.');
	}
};

const startSync = () => {
	cart.subscribe(() => {
		// Appeler syncCart chaque fois que le store change
		setTimeout(syncCart, 50);
	});
};

export { startSync };

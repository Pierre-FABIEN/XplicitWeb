<script lang="ts">
	import Chart from '$lib/components/Chart.svelte';
	import ChartMonthly from '$lib/components/ChartMonthly.svelte';
	import LastInscriptions from '$lib/components/LastInscriptions.svelte';
	import SEO from '$lib/components/SEO.svelte';

	/**
	 * Les props reçues : `data` doit contenir { transactions: [...] }
	 * Chaque transaction a la forme :
	 * {
	 *   amount: number,
	 *   app_user_email: string,
	 *   createdAt: Date | string,
	 *   status: string,
	 *   ...
	 * }
	 */
	let { data } = $props();

	//console.log(data, 'iugoiluhg');

	// Sécuriser l'accès au tableau de transactions
	const transactions = Array.isArray(data.transactions) ? data.transactions : [];

	let monthlyData: { x: number; y: number }[] = [];

	if (transactions.length > 0) {
		// On récupère la date du premier transaction pour déterminer l'année/mois ciblés.
		// (Si vous gérez plusieurs mois, adaptez la logique.)
		const firstTxDate = new Date(transactions[0].createdAt);
		const year = firstTxDate.getFullYear();
		const month = firstTxDate.getMonth(); // 0 = Janvier, 1 = Février, etc.

		// Combien de jours dans ce mois ?
		const daysInMonth = new Date(year, month + 1, 0).getDate(); // ex: 31 pour Janvier

		// Tableau pour stocker le total par jour (index 0 = day 1, index 1 = day 2, etc.)
		const dailySums = new Array(daysInMonth).fill(0);

		// 1) Regrouper les transactions par jour du mois
		for (const tx of transactions) {
			const d = new Date(tx.createdAt);
			const dayOfMonth = d.getDate(); // 1..31
			dailySums[dayOfMonth - 1] += tx.amount ?? 0;
		}

		// 2) Calculer la somme cumulée
		for (let i = 1; i < daysInMonth; i++) {
			dailySums[i] += dailySums[i - 1];
		}

		// 3) Construire le tableau de points { x, y }
		monthlyData = dailySums.map((sum, idx) => {
			return {
				x: idx + 1, // Jour du mois
				y: sum
			};
		});
	}

	const monthlySeries = [
		{
			name: 'Cumulative Orders',
			data: monthlyData
		}
	];

	// Extraction et agrégation des quantités vendues par produit
	let productSalesData: { x: string; y: number }[] = $state([]);

	if (transactions.length > 0) {
		// Utiliser un Map pour regrouper par produit
		const productSalesMap = new Map<string, number>();

		for (const tx of transactions) {
			if (tx.products && Array.isArray(tx.products)) {
				for (const product of tx.products) {
					const productName = product?.name as string;
					const productQuantity = product?.quantity || 0;

					// Ajouter au total dans le Map
					if (productSalesMap.has(productName)) {
						productSalesMap.set(productName, productSalesMap.get(productName)! + productQuantity);
					} else {
						productSalesMap.set(productName, productQuantity);
					}
				}
			}
		}

		// Convertir le Map en tableau de données pour le graphique
		productSalesData = Array.from(productSalesMap.entries()).map(([key, value]) => ({
			x: key,
			y: value
		}));
	}
</script>

<!-- SEO pour la page d'administration -->
<SEO pageKey="admin" />

<div class="csc m-5">
	<h1 class="text-2xl font-bold mb-4">Accueil</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- (1) Smooth Line Chart simple -->
		<div class="border p-5 rounded aspect-video">
			<Chart
				data={transactions}
				options={{
					title: {
						text: 'Smooth Line Chart of Transactions',
						align: 'center'
					},
					chart: {
						type: 'line'
					},
					stroke: {
						curve: 'smooth'
					}
				}}
			/>
		</div>

		<!-- (2) Line Chart cumul mensuel -->
		<div class="border p-5 rounded aspect-video">
			<ChartMonthly
				data={monthlySeries}
				options={{
					title: {
						text: 'Monthly Cumulative Orders',
						align: 'center'
					},
					chart: {
						type: 'line'
					},
					stroke: {
						curve: 'smooth'
					},
					xaxis: {
						type: 'numeric',
						title: {
							text: 'Day of Month'
						}
					},
					yaxis: {
						title: {
							text: 'Cumulative Amount'
						}
					}
				}}
			/>
		</div>
		<LastInscriptions users={data.latestUsersFetch} />

		<!-- Nouveau graphique à barres -->
		<div class="border p-5 rounded aspect-video">
			<Chart
				data={productSalesData}
				options={{
					title: {
						text: 'Produits vendus',
						align: 'center'
					},
					chart: {
						type: 'bar'
					},
					xaxis: {
						categories: productSalesData.map((d) => d.x),
						title: {
							text: 'Produits'
						}
					},
					yaxis: {
						title: {
							text: 'Quantité vendue'
						}
					},
					series: [
						{
							name: 'Quantité',
							data: productSalesData.map((d) => d.y)
						}
					]
				}}
			/>
		</div>
	</div>
</div>

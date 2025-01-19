<script lang="ts">
	import Chart from '$lib/components/Chart.svelte';
	import ChartMonthly from '$lib/components/ChartMonthly.svelte';
	import LastInscriptions from '$lib/components/LastInscriptions.svelte';

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

	// Sécuriser l'accès au tableau de transactions
	const transactions = Array.isArray(data.transactions) ? data.transactions : [];

	//---------------------------------------------------
	// 1) PREMIER GRAPH : SMOOTH LINE CHART CLASSIQUE
	//---------------------------------------------------

	// (Aucun regroupement ou transformation particulier, on passe directement au composant)

	//---------------------------------------------------
	// 2) DEUXIÈME GRAPH : CUMUL PAR JOUR DU MOIS
	//---------------------------------------------------
	// - On suppose toutes les transactions dans le même mois/année
	// - L'axe X représente le jour du mois (1..31)
	// - Le Y représente la somme cumulée jusqu'à ce jour
	// - Si plusieurs transactions tombent le même jour, on les additionne
	// - Si un jour n'a pas de transaction, le cumul reste celui de la veille

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

	/**
	 * Notre deuxième chart aura donc une seule série,
	 * dont data = monthlyData (un tableau de { x, y })
	 */
	const monthlySeries = [
		{
			name: 'Cumulative Orders',
			data: monthlyData
		}
	];

	console.log(data, 'dsrkjghrsiguh');
</script>

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
</div>

<div class="bg-gray-200 rounded mt-4 min-h-[100vh] p-5">
	<!-- Placez ici tout autre contenu -->
</div>

<style>
	.chartCSS {
		height: 80%;
		width: 80%;
		margin: auto;
	}
</style>

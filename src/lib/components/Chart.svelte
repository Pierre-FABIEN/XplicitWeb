<script lang="ts">
	let chartElement = $state<HTMLElement>();
	let chartInstance = $state<any>();

	let { data = [], options = {} } = $props();

	// Juste un petit console.log pour vérifier au runtime
	//console.log('Chart data in Chart.svelte:', data);

	$effect(async () => {
		if (typeof window === 'undefined') return;

		const ApexCharts = (await import('apexcharts')).default;

		// 1. Vérifier que data est un tableau
		const safeData = Array.isArray(data) ? data : [];

		// 2. Mapper en un format valide pour le radar
		//    - On veut un tableau de nombres pour la clé 'data'
		//    - On veut un tableau de labels pour categories
		const mappedAmounts = safeData.map((d) => d.amount ?? 0);
		const mappedLabels = safeData.map((d) =>
			d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'NoDate'
		);

		const defaultOptions = {
			chart: {
				type: 'line',
				height: '100%',
				width: '100%'
			},
			stroke: {
				curve: 'smooth' // Courbes lisses
			},
			series: [
				{
					name: 'Transactions',
					data: mappedAmounts
				}
			],
			xaxis: {
				categories: mappedLabels // Labels sur l'axe X
			},
			title: {
				text: 'Line Chart of Transactions',
				align: 'center'
			}
		};

		// Fusionner les options
		const mergedOptions = {
			...defaultOptions,
			...options,
			chart: {
				...defaultOptions.chart,
				...options.chart
			},
			xaxis: {
				...defaultOptions.xaxis,
				...options.xaxis
			},
			title: {
				...defaultOptions.title,
				...options.title
			},
			series: options.series || defaultOptions.series
		};

		// Détruire l'ancienne instance si elle existe
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = undefined;
		}

		// Créer et rendre la nouvelle chart
		chartInstance = new ApexCharts(chartElement, mergedOptions);
		await chartInstance.render();

		return () => {
			if (chartInstance) {
				chartInstance.destroy();
				chartInstance = undefined;
			}
		};
	});
</script>

<div class="chart-container">
	<div bind:this={chartElement} class="chartCSS"></div>
</div>

<style>
	.chart-container {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.chartCSS {
		width: 100%;
		height: 100%;
	}
</style>

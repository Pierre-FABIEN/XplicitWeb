<script lang="ts">
	import Table from '$components/Table.svelte';
	import { formatDate } from '$lib/utils/formatDate';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';

	// Props
	let { data } = $props();

	// Define table columns
	const userColumns = $state([
		{ key: 'amount', label: 'amount' },
		{ key: 'customer_details_name', label: 'name order' },
		{ key: 'customer_details_email', label: 'email order' },
		{ key: 'app_user_email', label: 'email' },
		{ key: 'app_user_name', label: 'name' },
		{ key: 'createdAt', label: 'Date de création', formatter: formatDate }
	]);

	// Define actions for each transaction
	const transactionActions = $state([
		{
			type: 'link',
			name: 'facture',
			url: (item: any) => `/admin/sales/facture/${item.id}`,
			icon: Receipt,
			condition: (item: any) => item.hasFacture // Affiche le lien si une facture existe
		},
		{
			type: 'link',
			name: 'bordereau',
			url: (item: any) => `/admin/sales/bordereau/${item.id}`,
			icon: FileText,
			condition: (item: any) => item.hasBorderau // Affiche le lien si un bordereau existe
		}
	]);
</script>

<!-- UI Table -->
<div class="ccc w-[100%]">
	<Table
		name="Ventes"
		columns={userColumns}
		data={data.transactions ?? []}
		actions={transactionActions}
	/>
</div>

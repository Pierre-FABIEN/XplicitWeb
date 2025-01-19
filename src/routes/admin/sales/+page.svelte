<script lang="ts">
	import Table from '$components/Table.svelte';
	import { formatDate } from '$lib/utils/formatDate';

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
</script>

<!-- UI Table -->
<div class="ccc w-xl m-5">
	<Table name="Ventes" columns={userColumns} data={data.transactions ?? []} />
</div>

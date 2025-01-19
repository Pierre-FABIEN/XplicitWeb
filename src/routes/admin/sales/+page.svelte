<script lang="ts">
	import Table from '$components/Table.svelte';
	import { deleteUserSchema } from '$lib/schema/users/userSchema.js';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';

	// Props
	let { data } = $props();

	console.log(data);

	// Define table columns
	const userColumns = $state([
		{ key: 'amount', label: 'amount' },
		{ key: 'customer_details_name', label: 'name order' },
		{ key: 'customer_details_email', label: 'email order' },
		{ key: 'app_user_email', label: 'name' },
		{ key: 'app_user_name', label: 'email' },
		{ key: 'status', label: 'status' },
		{ key: 'createdAt', label: 'Date de création', formatter: formatDate }
	]);

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = String(date.getFullYear()).slice(-2);
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');

		return `${day}/${month}/${year} à ${hours}:${minutes}`;
	}
</script>

<!-- UI Table -->
<div class="ccc w-xl m-5">
	<Table name="Ventes" columns={userColumns} data={data.transactions ?? []} />
</div>

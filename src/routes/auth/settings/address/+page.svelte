<script lang="ts">
	// Import components and utilities
	import Table from '$lib/components/Table.svelte';
	import { deleteAddressSchema } from '$lib/schema/auth/addressSchema.js';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Import icons
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';

	let { data } = $props();

	// Define table columns
	let addressColumns = $state([
		{ key: 'recipient', label: 'Destinataire' },
		{ key: 'street', label: 'Rue' },
		{ key: 'city', label: 'Ville' },
		{ key: 'zip', label: 'Code postal' },
		{ key: 'country', label: 'Pays' }
	]);

	// Define actions with icons
	let addressActions = $state([
		{
			type: 'edit',
			url: (item) => `/auth/settings/address/${item.id}`, // Dynamic URL for edit
			confirm: false,
			icon: Pencil // Icon for edit
		},
		{
			type: 'delete',
			url: '?/deleteAddress', // URL for delete form action
			confirm: true, // Requires confirmation
			icon: Trash // Icon for delete
		}
	]);

	// Setup superform for delete action
	const deleteAddress = superForm(data?.IdeleteAddressSchema ?? {}, {
		validators: zodClient(deleteAddressSchema),
		id: 'deleteAddress'
	});

	const {
		form: deleteAddressData,
		enhance: deleteAddressEnhance,
		message: deleteAddressMessage
	} = deleteAddress;

	// Show toast on form message
	$effect(() => {
		if ($deleteAddressMessage) {
			toast($deleteAddressMessage);
		}
	});
</script>

<div class="clc w-xl m-5">
	<Table name="Adresses" columns={addressColumns} data={data.address ?? []} />
</div>

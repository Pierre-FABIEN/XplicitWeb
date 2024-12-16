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

	// Define table columns
	let addressColumns = $state([
		{ key: 'recipient', label: 'Destinataire' },
		{ key: 'street', label: 'Rue' },
		{ key: 'city', label: 'Ville' },
		{ key: 'zip', label: 'Code postal' },
		{ key: 'country', label: 'Pays' }
	]);

	console.log(data, 'data');

	// Define actions with icons
	let addressActions = $state([
		{
			type: 'link',
			name: 'edit',
			url: (item: any) => `/auth/settings/address/${item.id}`,
			icon: Pencil
		},
		{
			type: 'form',
			name: 'delete',
			url: '?/deleteAddress',
			dataForm: $deleteAddressData.id,
			enhance: deleteAddressEnhance,
			icon: Trash
		}
	]);

	// Show toast on form message
	$effect(() => {
		if ($deleteAddressMessage) {
			toast($deleteAddressMessage);
		}
	});
</script>

<div class="clc w-xl m-5">
	<Table
		name="Adresses"
		columns={addressColumns}
		data={data.address ?? []}
		actions={addressActions}
	/>
</div>

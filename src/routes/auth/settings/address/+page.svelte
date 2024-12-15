<script lang="ts">
	import Table from '$lib/components/Table.svelte';
	import { deleteAddressSchema } from '$lib/schema/auth/addressSchema.js';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	console.log(data);

	const deleteAddress = superForm(data?.IdeleteAddressSchema ?? {}, {
		validators: zodClient(deleteAddressSchema),
		id: 'deleteAddress'
	});

	const { enhance: deleteAddressEnhance, message: deleteAddressMessage } = deleteAddress;

	const addressColumns = [
		{ key: 'recipient', label: 'Destinataire' },
		{ key: 'street', label: 'Rue' },
		{ key: 'city', label: 'Ville' },
		{ key: 'zip', label: 'Code postal' },
		{ key: 'country', label: 'Pays' }
	];
</script>

<div class="clc w-xl m-5">
	<Table
		name="Adresses"
		columns={addressColumns}
		data={data.address ?? []}
		deleteActionUrl="?/deleteAddress"
		editActionUrl="/auth/settings/address/"
		newActionUrl="/auth/settings/address/create"
		enhance={deleteAddressEnhance}
	/>
</div>

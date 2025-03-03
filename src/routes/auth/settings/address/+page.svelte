<script lang="ts">
	import Table from '$lib/components/Table.svelte';
	import { deleteAddressSchema } from '$lib/schema/addresses/addressSchema.js';
	import { toast } from 'svelte-sonner';
	import { message, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';

	let { data } = $props();

	// Setup superform for delete action
	const deleteAddress = superForm(data?.IdeleteAddressSchema ?? {}, {
		validators: zodClient(deleteAddressSchema),
		id: 'deleteAddress'
	});

	console.log(data, 'data');

	const {
		form: deleteAddressData,
		enhance: deleteAddressEnhance,
		message: deleteAddressMessage
	} = deleteAddress;

	// Mise à jour des colonnes pour afficher toutes les informations
	let addressColumns = $state([
		{ key: 'first_name', label: 'Prénom' },
		{ key: 'last_name', label: 'Nom' },
		{ key: 'phone', label: 'Téléphone' },
		{ key: 'company', label: 'Entreprise' },
		{ key: 'street_number', label: 'Numéro de rue' },
		{ key: 'street', label: 'Rue' },
		{ key: 'city', label: 'Ville' },
		{ key: 'state', label: 'Région' },
		{ key: 'zip', label: 'Code postal' },
		{ key: 'country', label: 'Pays' },
		{ key: 'type', label: 'Type' }, // SHIPPING ou BILLING
		{ key: 'createdAt', label: 'Créé le' },
		{ key: 'updatedAt', label: 'Mis à jour le' }
	]);

	// Définition des actions avec icônes
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
			enhanceAction: deleteAddressEnhance,
			icon: Trash
		}
	]);

	// Afficher un toast lors d'une suppression réussie
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
		addLink="/auth/settings/address/create"
		data={data.address ?? []}
		actions={addressActions}
	/>
</div>

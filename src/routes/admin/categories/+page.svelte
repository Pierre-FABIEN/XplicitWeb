<script lang="ts">
	import Table from '$components/Table.svelte';
	import { deleteCategorySchema } from '$lib/schema/categories/deleteCategorySchema.js';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';

	// Props
	let { data } = $props();

	// Form handling with superForm
	const deleteCategory = superForm(data?.IdeleteCategorySchema ?? {}, {
		validators: zodClient(deleteCategorySchema),
		id: 'deleteCategory'
	});

	const {
		form: deleteCategoryData,
		enhance: deleteCategoryEnhance,
		message: deleteCategoryMessage
	} = deleteCategory;

	// Table columns
	const categoryColumns = [{ key: 'name', label: 'Nom' }];

	// Table actions
	const categoryActions = [
		{
			type: 'link',
			name: 'edit',
			url: (item: any) => `/admin/categories/${item.id}`,
			icon: Pencil
		},
		{
			type: 'form',
			name: 'delete',
			url: '?/deleteCategory',
			dataForm: deleteCategoryData.id,
			enhanceAction: deleteCategoryEnhance,
			icon: Trash
		}
	];

	// Show toast on delete message
	$effect(() => {
		if ($deleteCategoryMessage) {
			toast.success($deleteCategoryMessage);
		}
	});
</script>

<!-- UI Table -->
<div class="ccc w-xl m-5">
	<Table
		name="Catégories"
		columns={categoryColumns}
		data={data.categories ?? []}
		actions={categoryActions}
		addLink="/admin/categories/create"
	/>
</div>

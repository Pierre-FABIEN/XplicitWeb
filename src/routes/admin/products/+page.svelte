<script lang="ts">
	import Table from '$components/Table.svelte';
	import { deleteProductSchema } from '$lib/schema/products/productSchema.js';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';

	// Props
	let { data } = $props();

	let products = $state(data?.products || []);

	let productsData = $derived.by(() =>
		products.map((product) => ({
			...product,
			// Catégories : extraire les noms
			categories:
				product.categories?.map((cat) => cat.category?.name || 'Unknown').join(', ') ||
				'No category',
			// Première image ou placeholder
			images: `<img class='w-20 h-20' src='${product.images[0]}' alt='${product.name}' />`,
			// Description tronquée
			description:
				product.description?.length > 20
					? `${product.description.slice(0, 20)}...`
					: product.description || 'No description available'
		}))
	);

	console.log(productsData);

	// Form handling with superForm
	const deleteProduct = superForm(data?.IdeleteProductSchema ?? {}, {
		validators: zodClient(deleteProductSchema),
		id: 'deleteProduct'
	});

	const {
		form: deleteProductData,
		enhance: deleteProductEnhance,
		message: deleteProductMessage
	} = deleteProduct;

	// Define table columns
	const productColumns = $state([
		{ key: 'stock', label: 'Stock' },
		{ key: 'name', label: 'Nom' },
		{ key: 'price', label: 'Prix' },
		{ key: 'categories', label: 'Catégories' },
		{ key: 'images', label: 'Images' },
		{ key: 'description', label: 'Description' }
	]);

	// Define actions with icons
	const productActions = $state([
		{
			type: 'link',
			name: 'edit',
			url: (item: any) => `/dashboard/products/${item.id}`,
			icon: Pencil
		},
		{
			type: 'form',
			name: 'delete',
			url: '?/deleteProduct',
			dataForm: deleteProductData.id,
			enhanceAction: deleteProductEnhance,
			icon: Trash
		}
	]);

	// Show toast on delete message
	$effect(() => {
		if ($deleteProductMessage) {
			toast.success($deleteProductMessage);
		}
	});
</script>

<!-- UI Table -->
<div class="ccc w-xl m-5">
	<Table
		name="Produits"
		columns={productColumns}
		data={productsData ?? []}
		actions={productActions}
		addLink="/admin/products/create"
	/>
</div>

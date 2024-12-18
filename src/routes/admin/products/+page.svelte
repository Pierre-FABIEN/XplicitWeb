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
		{ key: 'images', label: 'Images nb' },
		{ key: 'description', label: 'Description' },
		{ key: 'createdAt', label: 'Date de création' }
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

	// Reactive state for formatted product data
	let formattedData = $state([]);

	// Helper: Format date
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');

		return `${day}/${month}/${year} à ${hours}:${minutes}`;
	}

	// Format product data
	function formatProductData(products: any[]) {
		return products.map((product) => ({
			...product,
			categories: Array.isArray(product.categories)
				? product.categories.map((cat: any) => cat.category.name).join(', ')
				: 'N/A',
			images: Array.isArray(product.images) ? product.images.length : 0,
			createdAt: formatDate(product.createdAt)
		}));
	}

	// Update formatted data when products change
	$effect(() => {
		if (data?.products) {
			formattedData = formatProductData(data.products);
		}
	});

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
		data={formattedData}
		actions={productActions}
		addLink="/dashboard/products/create"
	/>
</div>

<script lang="ts">
	import Table from '$components/Table.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';
	import { deleteBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema.js';
	import { deleteBlogCategorySchema } from '$lib/schema/BlogPost/categoriesSchema.js';
	import { deleteBlogTagSchema } from '$lib/schema/BlogPost/tagSchema.js';

	// Props
	let { data } = $props();

	console.log(data, 'data');

	// Form handling with superForm
	const deleteBlogPost = superForm(data?.IdeleteBlogPostSchema ?? {}, {
		validators: zodClient(deleteBlogPostSchema),
		id: 'deleteBlogPost'
	});

	// Form handling with superForm
	const deleteBlogCategory = superForm(data?.IdeleteBlogCategorySchema ?? {}, {
		validators: zodClient(deleteBlogCategorySchema),
		id: 'deleteBlogCategory'
	});

	// Form handling with superForm
	const deleteBlogTag = superForm(data?.IdeleteBlogTagSchema ?? {}, {
		validators: zodClient(deleteBlogTagSchema),
		id: 'deleteBlogTag'
	});

	const {
		form: deleteBlogPostData,
		enhance: deleteBlogPostEnhance,
		message: deleteBlogPostMessage
	} = deleteBlogPost;

	const {
		form: deleteBlogCategoryData,
		enhance: deleteBlogCategoryEnhance,
		message: deleteBlogCategoryMessage
	} = deleteBlogCategory;

	const {
		form: deleteBlogTagData,
		enhance: deleteBlogTagEnhance,
		message: deleteBlogTagMessage
	} = deleteBlogTag;

	// Define table columns
	const PostsColumns = $state([
		{ key: 'title', label: 'Title' },
		{ key: 'slug', label: 'Slug' },
		{ key: 'published', label: 'Published' },
		{ key: 'categories', label: 'Categories' }
	]);

	const CategoriesColumns = $state([
		{ key: 'name', label: 'name' },
		{ key: 'description', label: 'description' }
	]);

	const TagsColumns = $state([{ key: 'name', label: 'name' }]);

	// Define actions with icons
	const PostsActions = $state([
		{
			type: 'link',
			name: 'edit',
			url: (item: any) => `/admin/blog/${item.id}`,
			icon: Pencil
		},
		{
			type: 'form',
			name: 'delete',
			url: '?/deleteBlogPost',
			dataForm: deleteBlogPostData.id,
			enhanceAction: deleteBlogPostEnhance,
			icon: Trash
		}
	]);

	const CategoriesActions = $state([
		{
			type: 'link',
			name: 'edit',
			url: (item: any) => `/admin/blog/categories/${item.id}`,
			icon: Pencil
		},
		{
			type: 'form',
			name: 'delete',
			url: '?/deleteBlogCategory',
			dataForm: deleteBlogCategoryData.id,
			enhanceAction: deleteBlogCategoryEnhance,
			icon: Trash
		}
	]);

	const TagsActions = $state([
		{
			type: 'link',
			name: 'edit',
			url: (item: any) => `/admin/blog/tags/${item.id}`,
			icon: Pencil
		},
		{
			type: 'form',
			name: 'delete',
			url: '?/deleteBlogTags',
			dataForm: deleteBlogTagData.id,
			enhanceAction: deleteBlogTagEnhance,
			icon: Trash
		}
	]);

	// Show toast on delete message
	$effect(() => {
		if ($deleteBlogPostMessage) {
			toast.success($deleteBlogPostMessage);
		}
	});
</script>

<h1 class="m-5 text-4xl">Gestion du blog</h1>
<!-- UI Table -->
<div class="ccc w-xl m-5">
	<Table
		name="Articles"
		columns={PostsColumns}
		data={data.BlogPost ?? []}
		actions={PostsActions}
		addLink="/admin/blog/create"
	/>
</div>

<div class="ccc w-xl m-5">
	<Table
		name="Catégories"
		columns={CategoriesColumns}
		data={data.AllCategoriesPost ?? []}
		actions={CategoriesActions}
		addLink="/admin/blog/categories/create"
	/>
</div>

<div class="ccc w-xl m-5">
	<Table
		name="Tags"
		columns={TagsColumns}
		data={data.AllTagsPost ?? []}
		actions={TagsActions}
		addLink="/admin/blog/tags/create"
	/>
</div>

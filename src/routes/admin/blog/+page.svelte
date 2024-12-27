<script lang="ts">
	import Table from '$components/Table.svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Trash from 'lucide-svelte/icons/trash';
	import { deleteBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema.js';

	// Props
	let { data } = $props();

	// Form handling with superForm
	const deleteBlogPost = superForm(data?.IdeleteBlogPostSchema ?? {}, {
		validators: zodClient(deleteBlogPostSchema),
		id: 'deleteBlogPost'
	});

	const {
		form: deleteBlogPostData,
		enhance: deleteBlogPostEnhance,
		message: deleteBlogPostMessage
	} = deleteBlogPost;

	// Define table columns
	const PostsColumns = $state([
		{ key: 'title', label: 'Title' },
		{ key: 'slug', label: 'Slug' },
		{ key: 'published', label: 'Published' },
		{ key: 'categories', label: 'Categories' }
	]);

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

	// Show toast on delete message
	$effect(() => {
		if ($deleteBlogPostMessage) {
			toast.success($deleteBlogPostMessage);
		}
	});
</script>

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

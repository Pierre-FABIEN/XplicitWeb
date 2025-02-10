<script lang="ts">
	// ----- Imports -----
	import * as Form from '$shadcn/form';
	import * as Popover from '$shadcn/popover';
	import * as Command from '$shadcn/command';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { Checkbox } from '$shadcn/checkbox';
	import { Label } from '$shadcn/label';
	import Editor from '@tinymce/tinymce-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { updateBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema.js';
	import { PUBLIC_TINYMCE_API_KEY } from '$env/static/public';

	// ----- Props from the server -----
	let { data } = $props();

	// ----- Prepare superForm for update -----
	const updateForm = superForm(data.IupdateBlogPostSchema, {
		validators: zodClient(updateBlogPostSchema)
	});

	const {
		form: updateData, // The reactive form data
		enhance: updateEnhance, // The progressive enhancement
		message: updateMessage // The success/failure message
	} = updateForm;

	$effect(() => {
		if ($updateMessage === 'Post updated successfully') {
			toast.success($updateMessage);
			setTimeout(() => goto('/admin/blog'), 0);
		}
	});

	// ----- Prepare categories -----
	let categories = $state(data.AllCategoriesPost || []);
	let selectedCategoryName = $state('');

	$effect(() => {
		if ($updateData.categoryId && categories.length) {
			const found = categories.find((cat) => cat.id === $updateData.categoryId);
			if (found) selectedCategoryName = found.name;
		}
	});

	// ----- Prepare tags -----
	// `allTags` contient tous les tags depuis la base (relation BlogTag)
	let allTags = $state(data.AllTagsPost || []);

	/**
	 * Pour chaque `tag`, on vérifie si la relation M2M (tag.posts) contient un
	 * BlogPostTag dont le `postId` correspond à $updateData.id (le post en édition).
	 * Si oui, on coche la case (`checked = true`).
	 */
	let tags = $state(
		allTags.map((tag) => {
			const isLinked = tag.posts.some((rel) => rel.postId === $updateData.id);
			return {
				...tag,
				checked: isLinked
			};
		})
	);

	// A chaque fois que `tags` est modifié, on met à jour $updateData.tagIds
	$effect(() => {
		$updateData.tagIds = tags.filter((t) => t.checked).map((t) => t.id); // On récupère les ID de la table BlogTag
	});

	// ----- TinyMCE config -----
	let editorConfig = {
		telemetry: false,
		branding: false,
		license_key: 'gpl',
		plugins: [
			'advlist autolink lists link image charmap anchor searchreplace visualblocks code fullscreen insertdatetime media table preview help wordcount'
		],
		toolbar:
			'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help'
	};

	let openCategory = $state(false);
	let openTag = $state(false);

	function handleSelectCategory(cat) {
		selectedCategoryName = cat.name;
		$updateData.categoryId = cat.id;
		openCategory = false;
	}
</script>

<form method="POST" action="?/updatePost" use:updateEnhance class="space-y-4">
	<!-- Title -->
	<Form.Field name="title" form={updateForm}>
		<Form.Control>
			<Form.Label>Title</Form.Label>
			<Input name="title" type="text" bind:value={$updateData.title} />
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Published -->
	<Form.Field name="published" form={updateForm}>
		<Form.Control>
			<div class="flex items-center">
				<Checkbox name="published" bind:checked={$updateData.published as boolean} />
				<Label class="ml-2">Published</Label>
			</div>
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Category Popover -->
	<div class="flex items-center space-x-4">
		<Popover.Root bind:open={openCategory}>
			<Popover.Trigger>
				<Button>Category: {selectedCategoryName}</Button>
			</Popover.Trigger>
			<Popover.Content class="p-4">
				<Command.Root>
					{#each categories as cat}
						<Command.Item onSelect={() => handleSelectCategory(cat)}>
							{cat.name}
						</Command.Item>
					{/each}
				</Command.Root>
			</Popover.Content>
		</Popover.Root>

		<!-- Tags Popover -->
		<Popover.Root bind:open={openTag}>
			<Popover.Trigger>
				<Button>Tags: {$updateData.tagIds.length} selected</Button>
			</Popover.Trigger>
			<Popover.Content class="p-4 space-y-2">
				{#each tags as tag, i}
					<div class="flex items-center space-x-2">
						<input
							type="checkbox"
							id={'tag-' + tag.id}
							checked={tag.checked}
							onchange={(e) => {
								// Mise à jour "immuable" pour forcer la réactivité
								tags[i] = { ...tag, checked: e.target.checked };
							}}
						/>
						<Label for={'tag-' + tag.id}>{tag.name}</Label>
					</div>
				{/each}
			</Popover.Content>
		</Popover.Root>
	</div>

	<!-- Content -->
	<Form.Field name="content" form={updateForm}>
		<Form.Control>
			<Form.Label>Content</Form.Label>
			<Editor
				{editorConfig}
				scriptSrc="/tinymce/tinymce.min.js"
				apiKey={PUBLIC_TINYMCE_API_KEY}
				bind:value={$updateData.content}
			/>
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Hidden fields -->
	<input type="hidden" name="id" value={$updateData.id} />
	<input type="hidden" name="authorId" bind:value={$updateData.authorId} />
	<input type="hidden" name="categoryId" bind:value={$updateData.categoryId} />
	<input type="hidden" name="content" bind:value={$updateData.content} />
	<input type="hidden" name="tagIds" bind:value={$updateData.tagIds} />

	<!-- Submit -->
	<Button type="submit">Save changes</Button>
</form>

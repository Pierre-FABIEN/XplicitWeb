<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Form from '$shadcn/form';
	import * as Popover from '$shadcn/popover';
	import * as Command from '$shadcn/command';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { Checkbox } from '$shadcn/checkbox/index.js';
	import { Label } from '$shadcn/label/index.js';

	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { goto } from '$app/navigation';
	import Editor from '@tinymce/tinymce-svelte';
	import { toast } from 'svelte-sonner';
	import { createBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema.js';
	import { PUBLIC_TINYMCE_API_KEY } from '$env/static/public';

	let { data } = $props();

	// Variables pour catégories et tags
	let categories = $state(data.AllCategoriesPost || []);
	let tags = $state(data.AllTagsPost || []);
	let selectedCategory = $state([]);
	let selectedTag = $state([]);
	let openCategory = $state(false);
	let openTag = $state(false);

	const createPost = superForm(data.IcreateBlogPostSchema, {
		validators: zodClient(createBlogPostSchema)
	});

	const {
		form: createPostData,
		enhance: createPostEnhance,
		message: createPostMessage
	} = createPost;

	$createPostData.authorId = data.user.id;

	$effect(() => {
		if ($createPostMessage === 'Post created successfully') {
			toast.success($createPostMessage), setTimeout(() => goto('/admin/blog/'), 0);
		}
	});

	/*
	 * Handles category selection in the Popover/Command list.
	 * Only one category is allowed, so we overwrite selectedCategory with a single value array.
	 */
	function handleSelectCategory(category) {
		selectedCategory = category.name;
		$createPostData.categoryId = category.id;
		openCategory = false;
	}

	/*
	 * Handles tag selection in the Popover/Command list.
	 * We allow multiple tags, so we push the new tag into selectedTag.
	 */
	function handleSelectTag(tag) {
		// Initialisez $createPostData.tagIds en tant que tableau s'il est undefined ou null
		if (!$createPostData.tagIds || !Array.isArray($createPostData.tagIds)) {
			$createPostData.tagIds = [];
		}

		// Ajoutez l'ID du tag à la liste
		$createPostData.tagIds = [...$createPostData.tagIds, tag.id];
		selectedTag = [...selectedTag, tag.name];

		openTag = false;
	}

	/*
	 * Toggle the selection of a tag.
	 * If "checked" is true, add the tag ID to the array if not already present;
	 * otherwise, remove it.
	 */
	function toggleTagSelection(tag, checked) {
		// Ensure tagIds is an array
		if (!$createPostData.tagIds || !Array.isArray($createPostData.tagIds)) {
			$createPostData.tagIds = [];
		}
		if (checked) {
			if (!$createPostData.tagIds.includes(tag.id)) {
				$createPostData.tagIds = [...$createPostData.tagIds, tag.id];
			}
		} else {
			$createPostData.tagIds = $createPostData.tagIds.filter((id) => id !== tag.id);
		}
	}

	/*
	 * Derived store to compute the names of selected tags
	 * based on the tag IDs present in $createPostData.tagIds.
	 */
	const selectedTagNames = $derived.by(() => {
		if (!$createPostData.tagIds || !Array.isArray($createPostData.tagIds)) return [];
		return tags.filter((tag) => $createPostData.tagIds.includes(tag.id)).map((tag) => tag.name);
	});

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
</script>

<div class="ccc">
	<div class="m-5 p-5 border w-[80vw]">
		<form method="POST" action="?/createPost" use:createPostEnhance class="space-y-4">
			<div class="w-[100%]">
				<Form.Field name="title" form={createPost}>
					<Form.Control>
						<Form.Label>Title</Form.Label>
						<Input name="title" type="text" bind:value={$createPostData.title} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="rcs w-[100%]">
				<div class="flex items-center space-x-2">
					<Form.Field name="published" form={createPost} class="rcc">
						<Form.Control>
							<div class="rcc">
								<Checkbox
									name="published"
									aria-labelledby="published"
									bind:checked={$createPostData.published as boolean | undefined}
								/>
								<Label
									id="published"
									for="terms"
									class="text-sm ml-2 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Publié
								</Label>
							</div>
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<div class="mx-2">
					<Popover.Root bind:open={openCategory}>
						<Popover.Trigger>
							<Button>
								Catégories :
								{selectedCategory}
							</Button>
						</Popover.Trigger>
						<Popover.Content>
							<Command.Root>
								{#each categories as category}
									<Command.Item onSelect={() => handleSelectCategory(category)}>
										{category.name}
									</Command.Item>
								{/each}
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>

				<div class="mx-2">
					<Popover.Root bind:open={openTag}>
						<Popover.Trigger>
							<Button>
								Tags : {selectedTagNames.join(', ')}
							</Button>
						</Popover.Trigger>
						<Popover.Content>
							<div class="p-4 space-y-2">
								{#each tags as tag}
									<div class="flex items-center space-x-2">
										<!-- Checkbox is checked if the tag ID is in $createPostData.tagIds -->
										<Checkbox
											checked={$createPostData.tagIds && $createPostData.tagIds.includes(tag.id)}
											onchange={(e) => toggleTagSelection(tag, e.target.checked)}
										/>
										<Label>{tag.name}</Label>
									</div>
								{/each}
							</div>
						</Popover.Content>
					</Popover.Root>
				</div>
				<div class="w-[100%]">
					<Form.Field name="content" form={createPost}>
						<Form.Control>
							<Form.Label>Content</Form.Label>
							<Editor
								{editorConfig}
								scriptSrc="/tinymce/tinymce.min.js"
								apiKey={PUBLIC_TINYMCE_API_KEY}
								bind:value={$createPostData.content}
							/>
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
				<input type="text" name="tagIds" bind:value={$createPostData.tagIds} class="hidden" />
				<input
					type="text"
					name="categoryId"
					bind:value={$createPostData.categoryId}
					class="hidden"
				/>
				<input type="hidden" name="authorId" bind:value={$createPostData.authorId} />
				<input type="hidden" name="content" bind:value={$createPostData.content} />
				<Button type="submit">Save changes</Button>
			</div>
		</form>
	</div>
</div>

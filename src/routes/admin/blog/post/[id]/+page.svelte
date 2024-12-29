<script lang="ts">
	/*
	 * This Svelte component allows editing an existing blog post.
	 * It uses Shadcn components, sveltekit-superforms for form handling,
	 * TinyMCE for rich text editing, and Zod for validation.
	 */

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

	// TinyMCE
	import Editor from '@tinymce/tinymce-svelte';
	import { PUBLIC_TINYMCE_API_KEY } from '$env/static/public';

	// Toast notifications
	import { toast } from 'svelte-sonner';

	// Zod schema (used for validation)
	import { updateBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema.js';

	// Data coming from the load function in +page.server.ts
	let { data } = $props();
	console.log('Data loaded in update page:', data);

	// Reactive state for categories and tags lists
	let categories = $state(data.AllCategoriesPost || []);
	let tags = $state(data.AllTagsPost || []);

	// Pre-fill selectedCategory and selectedTag from the loaded blog post data
	let selectedCategory = $state(data.IupdateBlogPostSchema?.data?.categoryId || null);
	let selectedTag = $state(data.IupdateBlogPostSchema?.data?.tagIds || []);

	// Control the opening of the popovers
	let openCategory = $state(false);
	let openTag = $state(false);

	/*
	 * Initialize the superForm using the validated data from IupdateBlogPostSchema,
	 * applying Zod for client-side validations.
	 */
	const updatePost = superForm(data.IupdateBlogPostSchema, {
		validators: zodClient(updateBlogPostSchema),
		id: 'updatePost'
	});

	const {
		form: updatePostData,
		enhance: updatePostEnhance,
		message: updatePostMessage
	} = updatePost;

	$effect(() => {
		console.log('updatePostData:', $updatePostData);
	});
	/*
	 * When the server action returns "Post updated successfully", display a success toast
	 * then navigate the user back to the main blog admin page.
	 */
	$effect(() => {
		if ($updatePostMessage === 'Post updated successfully') {
			toast($updatePostMessage);
			setTimeout(() => goto('/admin/blog/'), 0);
		}
	});

	/*
	 * Handles category selection in the Popover/Command list.
	 * Only one category is allowed, so we overwrite selectedCategory with a single value array.
	 */
	function handleSelectCategory(category) {
		console.log('ca passe!', category);
		selectedCategory = category.name;
		$updatePostData.categoryId = category.id; // Store the category ID directly
		openCategory = false;
	}

	/*
	 * Handles tag selection in the Popover/Command list.
	 * We allow multiple tags, so we push the new tag into selectedTag.
	 */
	function handleSelectTag(tag) {
		console.log('ca passe!');
		selectedTag = [...selectedTag, tag.name];
		$updatePostData.tagIds = [...($updatePostData.tagIds as any[]), tag.id];
		openTag = false;
	}

	/*
	 * TinyMCE configuration object for the Editor component.
	 */
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

<!-- Main container -->
<div class="m-5 p-5 border w-[80vw]">
	<!-- "use:updatePostEnhance" is from sveltekit-superforms to handle progressive enhancement -->
	<form method="POST" action="?/updatePost" use:updatePostEnhance class="space-y-4">
		<!-- Title field -->
		<div class="w-full">
			<Form.Field name="title" form={updatePost}>
				<Form.Control>
					<Form.Label>Title</Form.Label>
					<Input name="title" type="text" bind:value={$updatePostData.title} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Published checkbox -->
		<div class="flex items-center space-x-2">
			<Form.Field name="published" form={updatePost}>
				<Form.Control>
					<div class="flex items-center">
						<Checkbox
							name="published"
							aria-labelledby="published"
							bind:checked={$updatePostData.published as boolean | undefined}
						/>
						<Label
							id="published"
							for="published"
							class="text-sm ml-2 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Published
						</Label>
					</div>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Category selection (uses Shadcn Popover + Command) -->
		<div class="mx-2 inline-block">
			<Popover.Root bind:open={openCategory}>
				<Popover.Trigger>
					<Button>
						{selectedCategory?.length > 0 ? selectedCategory : 'Select Category'}
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

			<!-- Hidden input that stores the categoryId for form submission -->
			<input type="text" name="categoryId" bind:value={selectedCategory} class="hidden" />
		</div>

		<!-- Tag selection (multiple) -->
		<div class="mx-2 inline-block">
			<Popover.Root bind:open={openTag}>
				<Popover.Trigger>
					<Button>
						{selectedTag?.length > 0 ? selectedTag.join(', ') : 'Select Tags'}
					</Button>
				</Popover.Trigger>
				<Popover.Content>
					<Command.Root>
						{#each tags as tag}
							<Command.Item onSelect={() => handleSelectTag(tag)}>
								{tag.name}
							</Command.Item>
						{/each}
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		</div>

		<!-- Rich text content field using TinyMCE -->
		<div class="w-full">
			<Form.Field name="content" form={updatePost}>
				<Form.Control>
					<Form.Label>Content</Form.Label>
					<Editor
						{editorConfig}
						scriptSrc="/tinymce/tinymce.min.js"
						apiKey={PUBLIC_TINYMCE_API_KEY}
						bind:value={$updatePostData.content}
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Hidden field for the blog post ID -->
		<input type="hidden" name="id" value={$updatePostData.id} />
		<input type="hidden" name="content" value={$updatePostData.content} />
		<!-- Hidden input that stores the tagIds for form submission -->
		<input type="text" name="tagIds" bind:value={$updatePostData.tagIds} class="hidden" />
		<input type="text" name="categoryId" bind:value={$updatePostData.categoryId} class="hidden" />
		<input type="text" name="authorId" bind:value={$updatePostData.authorId} class="hidden" />

		<!-- Submit button -->
		<Button type="submit" class="mt-4">Save changes</Button>
	</form>
</div>

<script lang="ts">
	import * as Form from '$shadcn/form';
	import * as Popover from '$shadcn/popover';
	import * as Command from '$shadcn/command';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { Checkbox } from '$shadcn/checkbox/index.js';
	import { Label } from '$shadcn/label/index.js';
	import { cn } from '$lib/components/shadcn/utils.js';

	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { goto } from '$app/navigation';
	import Editor from '@tinymce/tinymce-svelte';
	import { env } from '$env/dynamic/public';
	import { toast } from 'svelte-sonner';
	import { createBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema.js';
	import { Check, ChevronsUpDown } from 'lucide-svelte';
	import { tick } from 'svelte';

	let { data } = $props();

	const createPost = superForm(data.IcreateBlogPostSchema, {
		validators: zodClient(createBlogPostSchema),
		id: 'createPost'
	});

	const {
		form: createPostData,
		enhance: createPostEnhance,
		message: createPostMessage
	} = createPost;

	const frameworks = [
		{
			value: 'sveltekit',
			label: 'SvelteKit'
		},
		{
			value: 'next.js',
			label: 'Next.js'
		},
		{
			value: 'nuxt.js',
			label: 'Nuxt.js'
		},
		{
			value: 'remix',
			label: 'Remix'
		},
		{
			value: 'astro',
			label: 'Astro'
		}
	];

	$effect(() => {
		if ($createPostMessage === 'Post created successfully') {
			toast($createPostMessage);
			setTimeout(() => goto('/admin/blog/'), 0);
		}
	});

	let checked = $derived($createPostData.published);

	let open = $state(false);
	let value = $state('');
	let triggerRef = $state<HTMLButtonElement>(null!);

	const selectedValue = $derived(frameworks.find((f) => f.value === value)?.label);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
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
					<Form.Field name="title" form={createPost} class="rcc">
						<Form.Control>
							<div class="rcc">
								<Checkbox aria-labelledby="published" />
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

				<div class="ccc flex items-center space-x-2 ml-5">
					<Popover.Root bind:open>
						<Popover.Trigger bind:ref={triggerRef}>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-[200px] justify-between"
									{...props}
									role="combobox"
									aria-expanded={open}
								>
									{selectedValue || 'Selectionnez un tag...'}
									<ChevronsUpDown class="opacity-50" />
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-[200px] p-0">
							<Command.Root>
								<Command.Input placeholder="Search framework..." />
								<Command.List>
									<Command.Empty>No framework found.</Command.Empty>
									<Command.Group>
										{#each frameworks as framework}
											<Command.Item
												value={framework.value}
												onSelect={() => {
													value = framework.value;
													closeAndFocusTrigger();
												}}
											>
												<Check class={cn(value !== framework.value && 'text-transparent')} />
												{framework.label}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>

				<div class="ccc flex items-center space-x-2 ml-5">
					<Popover.Root bind:open>
						<Popover.Trigger bind:ref={triggerRef}>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-[200px] justify-between"
									{...props}
									role="combobox"
									aria-expanded={open}
								>
									{selectedValue || 'Selectionnez une categorie...'}
									<ChevronsUpDown class="opacity-50" />
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-[200px] p-0">
							<Command.Root>
								<Command.Input placeholder="Search framework..." />
								<Command.List>
									<Command.Empty>No framework found.</Command.Empty>
									<Command.Group>
										{#each frameworks as framework}
											<Command.Item
												value={framework.value}
												onSelect={() => {
													value = framework.value;
													closeAndFocusTrigger();
												}}
											>
												<Check class={cn(value !== framework.value && 'text-transparent')} />
												{framework.label}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>

			<div class="w-[100%]">
				<Form.Field name="content" form={createPost}>
					<Form.Control>
						<Form.Label>Content</Form.Label>
						<Editor apiKey={env.PUBLIC_TINYMCE_API_KEY} bind:value={$createPostData.content} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<input type="hidden" name="content" bind:value={$createPostData.content} />
			{#if data.user}
				<input type="hidden" name="authorId" value={data.user.id} />
			{/if}
			<Button type="submit">Save changes</Button>
		</form>
	</div>
</div>

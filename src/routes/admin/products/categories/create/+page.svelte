<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createCategorySchema } from '$lib/schema/categories/deleteCategorySchema.js';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const createCategory = superForm(data.IcreateCategorySchema, {
		validators: zodClient(createCategorySchema),
		id: 'createCategory'
	});

	const {
		form: createCategoryData,
		enhance: createCategoryEnhance,
		message: createCategoryMessage
	} = createCategory;

	$effect(() => {
		if ($createCategoryMessage === 'Category created successfully') {
			toast.success($createCategoryMessage);
			setTimeout(() => goto('/admin/products/categories/'), 0);
		}
	});
</script>

<div class="ccc">
	<div class="m-5 p-5 border w-[400px]">
		<form method="POST" action="?/createCategory" use:createCategoryEnhance class="space-y-4">
			<div class="ccs mt-5">
				<div class="w-[100%]">
					<Form.Field name="name" form={createCategory}>
						<Form.Control>
							<Form.Label>Name</Form.Label>
							<Input name="name" type="text" bind:value={$createCategoryData.name} />
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
			</div>
			<Button type="submit">Save changes</Button>
		</form>
	</div>
</div>

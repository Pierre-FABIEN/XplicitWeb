<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { updateDirectorSchema } from '$lib/schema/crud/directorsSchema';
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import Checkbox from '$shadcn/checkbox/checkbox.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const updateDirectorForm = superForm(data.updateDirector, {
		validators: zodClient(updateDirectorSchema),
		id: 'updateDirectorForm'
	});

	const {
		form: updateDirectorData,
		enhance: updateDirectorEnhance,
		message: updateDirectorMessage
	} = updateDirectorForm;

	$effect(() => {
		if ($updateDirectorMessage === 'Director updated successfully') {
			toast.success($updateDirectorMessage);
			setTimeout(() => goto('/crud/directors'), 0);
		}
	});
</script>

<div class="mx-auto mt-8 max-w-lg">
	<h1 class="text-4xl font-s text-[#fe3d00]">Update Director</h1>

	<form method="POST" action="?/update" use:updateDirectorEnhance>
		<div class="mb-4">
			<Form.Field name="name" form={updateDirectorForm}>
				<Form.Control>
					<Form.Label>Name</Form.Label>
					<Input name="name" type="text" bind:value={$updateDirectorData.name} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="email" form={updateDirectorForm}>
				<Form.Control>
					<Form.Label>Email</Form.Label>
					<Input name="email" type="email" bind:value={$updateDirectorData.email} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="age" form={updateDirectorForm}>
				<Form.Control>
					<Form.Label>Age</Form.Label>
					<Input name="age" type="number" bind:value={$updateDirectorData.age} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="isActive" form={updateDirectorForm}>
				<Form.Control>
					<Form.Label>Active</Form.Label>
					<Checkbox name="isActive" bind:checked={$updateDirectorData.isActive} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<input hidden name="id" value={data.updateDirector.data.id} />
		<input hidden name="createdAt" value={data.updateDirector.data.createdAt} />
		<input hidden name="isActive" value={$updateDirectorData.isActive} />

		<div class="mt-6">
			<Button type="submit">Update Director</Button>
		</div>
	</form>
</div>

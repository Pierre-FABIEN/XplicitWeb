<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import Checkbox from '$shadcn/checkbox/checkbox.svelte';

	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createDirectorSchema } from '$lib/schema/crud/directorsSchema';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const createDirectorForm = superForm(data.form, {
		validators: zodClient(createDirectorSchema),
		id: 'createDirectorForm'
	});

	const {
		form: createDirectorData,
		enhance: createDirectorEnhance,
		message: createDirectorMessage
	} = createDirectorForm;

	$effect(() => {
		console.log(data);
		if ($createDirectorMessage === 'Director created successfully') {
			toast.success($createDirectorMessage);
			setTimeout(() => goto('/crud/directors'), 0);
		}
	});
</script>

<div class="mx-auto mt-8 max-w-lg">
	<h1 class="text-4xl font-s text-[#fe3d00]">Create a New Director</h1>

	<form method="POST" action="?/create" use:createDirectorEnhance>
		<div class="mb-4">
			<Form.Field name="name" form={createDirectorForm}>
				<Form.Control>
					<Form.Label>Name</Form.Label>
					<Input type="text" name="name" bind:value={$createDirectorData.name} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="email" form={createDirectorForm}>
				<Form.Control>
					<Form.Label>Email</Form.Label>
					<Input type="email" name="email" bind:value={$createDirectorData.email} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="age" form={createDirectorForm}>
				<Form.Control>
					<Form.Label>Age</Form.Label>
					<Input type="number" name="age" bind:value={$createDirectorData.age} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mb-4">
			<Form.Field name="isActive" form={createDirectorForm}>
				<Form.Control>
					<Form.Label>Active</Form.Label>
					<Checkbox name="isActive" bind:checked={$createDirectorData.isActive} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mt-6">
			<Button type="submit">Create Director</Button>
		</div>
	</form>
</div>

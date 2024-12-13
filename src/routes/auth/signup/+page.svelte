<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { superForm } from 'sveltekit-superforms/client';
	import { signupSchema } from '$lib/schema/auth/signupSchema';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	const signupForm = superForm(data.form, {
		validators: zodClient(signupSchema),
		id: 'signupForm'
	});

	const { form: signupData, enhance: signupEnhance, message: signupMessage } = signupForm;

	$effect(() => {
		if ($signupMessage === 'Inscription réussie !') {
			toast.success($signupMessage);
			setTimeout(() => goto('/auth/login'), 0);
		}
	});
</script>

<div class="min-w-screen min-h-screen flex justify-center items-center">
	<div class="w-[400px] mx-auto mt-12 max-w-lg p-6 border shadow-lg rounded-lg">
		<h1 class="mb-4 text-2xl font-bold">Créer un compte</h1>

		<form method="POST" use:signupEnhance action="?/signup" class="space-y-4">
			<div class="mb-4">
				<Form.Field name="username" form={signupForm}>
					<Form.Control>
						<Form.Label>Nom d'utilisateur</Form.Label>
						<Input name="username" type="text" bind:value={$signupData.username} required />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="mb-4">
				<Form.Field name="email" form={signupForm}>
					<Form.Control>
						<Form.Label>Email</Form.Label>
						<Input name="email" type="email" bind:value={$signupData.email} required />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="mb-4">
				<Form.Field name="password" form={signupForm}>
					<Form.Control>
						<Form.Label>Mot de passe</Form.Label>
						<Input name="password" type="password" bind:value={$signupData.password} required />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<div class="mt-6">
				<Button type="submit">S'inscrire</Button>
			</div>
		</form>
	</div>
</div>

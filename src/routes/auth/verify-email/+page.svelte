<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Form from '$shadcn/form';
	import Button from '$shadcn/button/button.svelte';
	import Input from '$shadcn/input/input.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { verifyCodeSchema } from '$lib/schema/auth/verifyCodeSchema';

	let { data } = $props();

	const verifyCodeForm = superForm(data.verifyCode, {
		validators: zodClient(verifyCodeSchema),
		id: 'verifyCodeForm'
	});

	const { form: verifyData, enhance: verifyEnhance, message: verifyMessage } = verifyCodeForm;
</script>

<div class="mx-auto mt-8 max-w-lg">
	<h1 class="text-2xl font-semibold mb-4">Vérifiez votre adresse email</h1>
	<p class="mb-4 text-gray-700">Nous avons envoyé un code de 8 chiffres à {data.email}.</p>

	<form method="post" use:verifyEnhance action="?/verifyCode" class="space-y-4">
		<div>
			<Form.Field name="code" form={verifyCodeForm}>
				<Form.Control>
					<Form.Label>Code de vérification</Form.Label>
					<Input
						id="form-verify-code"
						name="code"
						type="text"
						placeholder="Entrez le code"
						bind:value={$verifyData.code}
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mt-6">
			<Button type="submit" class="w-full">Vérifier</Button>
		</div>
	</form>

	<form method="post" use:enhance action="?/resendCode" class="mt-4">
		<Button type="submit" class="w-full" variant="ghost">Renvoyer le code</Button>
	</form>

	<a href="/auth/settings" class="block mt-4 text-center text-sm text-orange-700 underline">
		Modifier votre email
	</a>
</div>

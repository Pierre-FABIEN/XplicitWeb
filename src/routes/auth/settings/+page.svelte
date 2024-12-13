<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { emailSchema, passwordSchema } from '$lib/schema/auth/settingsSchemas';

	let { data } = $props();

	console.log(data, 'data');

	// Initialiser les formulaires Superform
	const emailForm = superForm(data.emailForm, {
		validators: zodClient(emailSchema),
		id: 'emailForm'
	});

	const passwordForm = superForm(data.passwordForm, {
		validators: zodClient(passwordSchema),
		id: 'passwordForm'
	});

	const { form: emailData, enhance: emailEnhance, message: emailMessage } = emailForm;
	const { form: passwordData, enhance: passwordEnhance, message: passwordMessage } = passwordForm;

	// Notifications pour les messages d'erreur
	$effect(() => {
		if ($emailMessage) {
			toast.error($emailMessage);
		}
		if ($passwordMessage) {
			toast.error($passwordMessage);
		}
	});
</script>

<main class="mx-auto mt-12 max-w-lg p-6 border shadow-lg rounded-lg">
	<h1 class="text-2xl font-semibold mb-6 text-center">Paramètres</h1>

	<!-- Formulaire de mise à jour de l'email -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Mettre à jour l'email</h2>
		<!-- <p class="mb-4">Votre email actuel : {data.user.email}</p> -->

		<form method="POST" action="?/email" use:emailEnhance class="space-y-6">
			<Form.Field name="email" form={emailForm}>
				<Form.Control>
					<Form.Label>Nouvel email</Form.Label>
					<Input
						type="email"
						name="email"
						bind:value={$emailData.email}
						placeholder="Entrez votre nouvel email"
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="mt-6">
				<Button type="submit" class="w-full">Mettre à jour</Button>
			</div>
		</form>
	</section>

	<!-- Formulaire de mise à jour du mot de passe -->
	<section class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Mettre à jour le mot de passe</h2>

		<form method="POST" action="?/password" use:passwordEnhance class="space-y-6">
			<Form.Field name="password" form={passwordForm}>
				<Form.Control>
					<Form.Label>Mot de passe actuel</Form.Label>
					<Input
						type="password"
						name="password"
						bind:value={$passwordData.password}
						autocomplete="current-password"
						placeholder="Entrez votre mot de passe actuel"
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field name="new_password" form={passwordForm}>
				<Form.Control>
					<Form.Label>Nouveau mot de passe</Form.Label>
					<Input
						type="password"
						name="new_password"
						bind:value={$passwordData.new_password}
						autocomplete="new-password"
						placeholder="Entrez votre nouveau mot de passe"
						required
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<div class="mt-6">
				<Button type="submit" class="w-full">Mettre à jour</Button>
			</div>
		</form>
	</section>

	<!-- Section pour la mise à jour de l'authentification à deux facteurs -->
	{#if data.user.registered2FA}
		<section class="mb-8">
			<h2 class="text-xl font-semibold mb-4">Authentification à deux facteurs</h2>
			<a href="/auth/2fa/setup" class="text-orange-700 hover:underline">Mettre à jour</a>
		</section>
	{/if}

	<!-- Section pour le code de récupération -->
	{#if data.recoveryCode !== null}
		<section class="mb-8">
			{#if data.recoveryCode !== null}
				<h2 class="text-xl font-semibold mb-4">Code de récupération</h2>
				{#await data.recoveryCode}
					<p>Chargement du code...</p>
				{:then recoveryCode}
					<p class="mb-4">
						Votre code de récupération : <span class="font-mono">{recoveryCode}</span>
					</p>
				{/await}
			{/if}
		</section>
	{/if}
</main>

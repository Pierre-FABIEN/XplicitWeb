<script lang="ts">
	import * as Form from '$shadcn/form';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { emailSchema, passwordSchema } from '$lib/schema/auth/settingsSchemas';
	import { Switch } from '$shadcn/switch/index.js';
	import { Label } from '$shadcn/label/index.js';
	import { isMfaEnabledSchema } from '$lib/schema/users/MfaEnabledSchema.js';

	let { data } = $props();

	console.log(data, 'ihygihguiyguyg');

	// Initialiser les formulaires Superform
	const emailForm = superForm(data.emailForm, {
		validators: zodClient(emailSchema),
		id: 'emailForm'
	});

	const passwordForm = superForm(data.passwordForm, {
		validators: zodClient(passwordSchema),
		id: 'passwordForm'
	});

	const isMfaEnabledForm = superForm(data.isMfaEnabledForm, {
		validators: zodClient(isMfaEnabledSchema),
		id: 'isMfaEnabledForm'
	});

	const { form: emailData, enhance: emailEnhance, message: emailMessage } = emailForm;
	const { form: passwordData, enhance: passwordEnhance, message: passwordMessage } = passwordForm;
	const {
		form: isMfaEnabledData,
		enhance: isMfaEnabledEnhance,
		message: isMfaEnabledMessage
	} = isMfaEnabledForm;

	// Notifications pour les messages d'erreur
	$effect(() => {
		if ($emailMessage) {
			toast.success($emailMessage);
		}
		if ($passwordMessage) {
			toast.success($passwordMessage);
		}
		if ($isMfaEnabledMessage && $isMfaEnabledMessage.text === 'Authentication modifiée') {
			$isMfaEnabledData.isMfaEnabled = $isMfaEnabledMessage.newStatus;
			toast.success($isMfaEnabledMessage.text);
		}
	});
</script>

<div class="w-screen h-screen ccc">
	<div class="w-[300px] mx-auto p-6 border shadow-lg rounded-lg backdrop-blur-3xl">
		<h1 class="text-2xl font-semibold mb-6 text-center">Paramètres</h1>

		<h1>
			{data.user.username}
		</h1>
		<h1>
			{data.user.email}
		</h1>

		{#if !data.user.googleId}
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
		{/if}
		<!-- Formulaire de mise à jour du mot de passe -->

		{#if data.user.role === 'CLIENT'}
			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">Manager mes adresses de livraisons</h2>

				<Button href="/auth/settings/address" class="w-full">Mes addresses</Button>
			</section>
		{/if}

		<!-- Formulaire de mise à jour du mot de passe -->
		{#if data.user.role === 'CLIENT'}
			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">Consulter mes factures</h2>

				<Button href="/auth/settings/factures" class="w-full">Mes Facture</Button>
			</section>
		{/if}

		<!-- Section pour la mise à jour de l'authentification à deux facteurs -->
		{#if !data.user.googleId}
			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">Authentification à deux facteurs</h2>
				<div class="rcb">
					{#if data.user.registered2FA && data.user.isMfaEnabled}
						<a href="/auth/2fa/setup" class="text-orange-700 hover:underline">Mettre à jour</a>
					{/if}

					<form method="POST" action="?/isMfaEnabled" use:isMfaEnabledEnhance>
						<Form.Field name="isMfaEnabled" form={isMfaEnabledForm}>
							<Form.Control>
								<div class="flex items-center space-x-2">
									<Switch
										name="isMfaEnabled"
										id="mfa-switch"
										bind:checked={$isMfaEnabledData.isMfaEnabled}
										type="submit"
									/>
									<Label for="mfa-switch">Désactiver/Activer MFA</Label>
								</div>
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</form>
				</div>
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
	</div>
</div>

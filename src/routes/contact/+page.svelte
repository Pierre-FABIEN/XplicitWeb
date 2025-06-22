<script lang="ts">
	import type { PageData } from './$types';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { contactSchema } from '$lib/schema/contact/contactSchema';

	import * as Form from '$shadcn/form';
	import { Button } from '$shadcn/button';
	import { Input } from '$shadcn/input';
	import { Textarea } from '$shadcn/textarea';
	import { toast } from 'svelte-sonner';
	import { mode } from 'mode-watcher';

	let { data }: { data: PageData } = $props();

	const form = superForm(data.form, {
		validators: zodClient(contactSchema)
	});

		let strokeColor = $state('black');

	$effect(() => {
		/* se relance automatiquement quand mode.current change */
		strokeColor = mode.current === 'light' ? '#00021a' : '#00c2ff';
	});

	const { form: formData, enhance, message } = form;

	$effect(() => {
		if ($message) {
			toast($message);
		}
	});
</script>

<div class="w-[100vw] h-[100%] mx-auto px-4 py-6 space-y-6 my-10">
	<div class="max-w-xl border mx-auto rounded-md p-6 bg-background">
		<h2 class="titleHome text-2xl font-semibold mb-4" style={`-webkit-text-stroke-color: ${strokeColor};`}>Contactez-nous</h2>
		<form method="POST" use:enhance class="space-y-4">
			<Form.Field {form} name="name">
				<Form.Control>
					<Form.Label>Nom</Form.Label>
					<Input name="name" type="text" bind:value={$formData.name} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="email">
				<Form.Control>
					<Form.Label>Email</Form.Label>
					<Input name="email" type="email" bind:value={$formData.email} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="subject">
				<Form.Control>
					<Form.Label>Sujet</Form.Label>
					<Input name="subject" type="text" bind:value={$formData.subject} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="message">
				<Form.Control>
					<Form.Label>Message</Form.Label>
					<Textarea name="message" bind:value={$formData.message} />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Button type="submit" class="w-full">Envoyer</Button>
		</form>
	</div>
</div>

<style lang="scss">
	.titleHome {
		text-align: center;
		font-family: 'Open Sans Variable', sans-serif;
		font-style: italic;
		text-align: left;
		font-size: 50px;
		margin-bottom: 12px;
		-webkit-text-stroke: 1px black;
		color: transparent;
		text-transform: uppercase;
		font-weight: 900;
	}
</style>

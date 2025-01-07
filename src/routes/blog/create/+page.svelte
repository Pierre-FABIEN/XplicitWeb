<script lang="ts">
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Form from '$shadcn/form';
	import * as Accordion from '$shadcn/accordion';
	import { Input } from '$shadcn/input';
	import { Button } from '$shadcn/button';
	import Checkbox from '$shadcn/checkbox/checkbox.svelte';
	import * as Command from '$shadcn/command';
	import * as Sheet from '$shadcn/sheet';
	import * as Popover from '$shadcn/popover';
	import { cn } from '$lib/components/shadcn/utils.js';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Plus from 'lucide-svelte/icons/plus';
	import { superForm } from 'sveltekit-superforms';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { createBlogPostSchema } from '$lib/schema/BlogPost/BlogPostSchema';

	// Initialisation des données via $props
	let { data } = $props();

	// Formulaire géré avec superForm
	const createPostForm = superForm(data.form, {
		validators: zodClient(createBlogPostSchema),
		id: 'createPostForm'
	});

	const {
		form: createPostData,
		enhance: createPostEnhance,
		message: createPostMessage
	} = createPostForm;

	// Catégories et tags
	let categoriesArray = $state(
		data.category.map((category) => ({
			id: category.id || null,
			name: category.name,
			checked: false
		}))
	);

	let selectedCategory = $state('');
	let tagsArray = $state(data.tags.map((tag) => ({ id: tag.id, name: tag.name, checked: false })));

	// État pour les nouvelles entrées
	let newCategory = $state('');
	let newTag = $state('');
	let isCategorySheetOpen = $state(false);
	let isTagSheetOpen = $state(false);

	// Fonction pour enregistrer une nouvelle catégorie
	const saveCategory = () => {
		const trimmedCategory = newCategory.trim();
		if (trimmedCategory) {
			const exists = categoriesArray.some(
				(category) => category.name.toLowerCase() === trimmedCategory.toLowerCase()
			);

			if (!exists) {
				// Ajouter la nouvelle catégorie et la sélectionner immédiatement
				const newCat = { id: null, name: trimmedCategory, checked: true };
				categoriesArray.push(newCat);
				selectedCategory = newCat.name; // Sélectionner la nouvelle catégorie
				newCategory = ''; // Réinitialiser le champ d'entrée
				isCategorySheetOpen = false; // Fermer la modal
			} else {
				alert(`La catégorie "${trimmedCategory}" existe déjà.`);
			}
		} else {
			alert('Le champ de la catégorie est vide.');
		}
	};

	// Fonction pour enregistrer un nouveau tag
	const saveTag = () => {
		const trimmedTag = newTag.trim();
		if (trimmedTag) {
			const exists = tagsArray.some((tag) => tag.name.toLowerCase() === trimmedTag.toLowerCase());

			if (!exists) {
				tagsArray.push({ id: null, name: trimmedTag, checked: true });
				newTag = ''; // Réinitialiser le champ d'entrée
				isTagSheetOpen = false; // Fermer la modal
			} else {
				alert(`Le tag "${trimmedTag}" existe déjà.`);
			}
		} else {
			alert('Le champ du tag est vide.');
		}
	};

	$effect(() => {
		if ($createPostMessage === 'Article créé avec succès !') {
			toast.success($createPostMessage);
			setTimeout(() => goto('/blog'), 0);
		}
	});
</script>

<div class="mx-auto mt-8 p-8 max-w-6xl">
	<form
		method="POST"
		action="?/create"
		use:createPostEnhance
		class="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-8"
	>
		<div class="space-y-6">
			<!-- Titre -->
			<Form.Field name="title" form={createPostForm}>
				<Form.Control>
					<Form.Label class="text-lg font-semibold">Titre</Form.Label>
					<Input type="text" name="title" bind:value={$createPostData.title} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!-- Contenu -->
			<Form.Field name="content" form={createPostForm}>
				<Form.Control>
					<Form.Label class="text-lg font-semibold">Contenu</Form.Label>
					<textarea
						name="content"
						bind:value={$createPostData.content}
						rows="16"
						class="w-full p-4 border rounded-md"
						required
					></textarea>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="space-y-6">
			<!-- Auteur -->
			<Form.Field name="authorName" form={createPostForm}>
				<Form.Control>
					<Form.Label class="text-lg font-semibold">Auteur</Form.Label>
					<Input type="text" name="authorName" bind:value={$createPostData.authorName} required />
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field name="category" form={createPostForm}>
				<Form.Control>
					<Form.Label class="text-lg font-semibold">Catégorie</Form.Label>
					<div class="flex justify-between items-center">
						<Popover.Root>
							<Popover.Trigger>
								<Button
									variant="outline"
									class="justify-between w-full"
									role="combobox"
									aria-expanded={selectedCategory !== ''}
								>
									{selectedCategory || 'Sélectionnez une catégorie...'}
									<ChevronsUpDown class="opacity-50" />
								</Button>
							</Popover.Trigger>
							<Popover.Content class="w-full p-0">
								<Command.Root>
									<Command.Input placeholder="Rechercher une catégorie..." />
									<Command.List>
										<Command.Empty>Aucune catégorie trouvée.</Command.Empty>
										<Command.Group>
											{#each categoriesArray as category}
												<Command.Item
													value={category.name}
													onSelect={() => {
														selectedCategory = category.name;
													}}
												>
													<Check
														class={cn(
															'ml-auto',
															selectedCategory !== category.name && 'text-transparent'
														)}
													/>
													{category.name}
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>

						<!-- Ajouter une nouvelle catégorie -->
						<Sheet.Root bind:open={isCategorySheetOpen}>
							<Sheet.Trigger>
								<Button variant="outline" size="sm" class="ml-2">
									<Plus />
								</Button>
							</Sheet.Trigger>
							<Sheet.Content>
								<Sheet.Header>
									<Sheet.Title>Ajouter une catégorie</Sheet.Title>
								</Sheet.Header>
								<div class="p-4 space-y-4">
									<Input type="text" bind:value={newCategory} placeholder="Nom de la catégorie" />
									<Button onclick={(e) => (e.preventDefault(), saveCategory())}>Enregistrer</Button>
								</div>
							</Sheet.Content>
						</Sheet.Root>
					</div>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field name="tags" form={createPostForm}>
				<Form.Control>
					<Form.Label class="text-lg font-semibold">Tags</Form.Label>
					<div class="flex justify-between items-center">
						<Popover.Root>
							<Popover.Trigger>
								<Button
									variant="outline"
									class="justify-between w-full max-w-[238px] overflow-hidden text-ellipsis whitespace-nowrap"
									role="combobox"
									title={tagsArray
										.filter((tag) => tag.checked)
										.map((tag) => tag.name)
										.join(', ')}
								>
									{#if tagsArray.filter((tag) => tag.checked).length > 0}
										{#if tagsArray.filter((tag) => tag.checked).length <= 3}
											{tagsArray
												.filter((tag) => tag.checked)
												.map((tag) => tag.name)
												.join(', ')}
										{:else}
											{tagsArray
												.filter((tag) => tag.checked)
												.slice(0, 3)
												.map((tag) => tag.name)
												.join(', ') +
												` et ${tagsArray.filter((tag) => tag.checked).length - 3} autres`}
										{/if}
									{:else}
										Sélectionnez un ou plusieurs tags...
									{/if}
									<ChevronsUpDown class="opacity-50" />
								</Button>
							</Popover.Trigger>
							<Popover.Content class="w-full p-0">
								<Command.Root>
									<Command.Input placeholder="Rechercher un tag..." />
									<Command.List>
										<Command.Empty>Aucun tag trouvé.</Command.Empty>
										<Command.Group>
											{#each tagsArray as tag}
												<Command.Item
													value={tag.name}
													onSelect={() => {
														tag.checked = !tag.checked;
													}}
												>
													<label class="flex items-center gap-2">
														<Checkbox bind:checked={tag.checked} />
														{tag.name}
													</label>
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>

						<!-- Ajouter un nouveau tag -->
						<Sheet.Root bind:open={isTagSheetOpen}>
							<Sheet.Trigger>
								<Button variant="outline" size="sm" class="ml-2">
									<Plus />
								</Button>
							</Sheet.Trigger>
							<Sheet.Content>
								<Sheet.Header>
									<Sheet.Title>Ajouter un Tag</Sheet.Title>
								</Sheet.Header>
								<div class="p-4 space-y-4">
									<Input type="text" bind:value={newTag} placeholder="Nom du tag" />
									<Button onclick={(e) => (e.preventDefault(), saveTag())}>Enregistrer</Button>
								</div>
							</Sheet.Content>
						</Sheet.Root>
					</div>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<input type="hidden" name="category" value={JSON.stringify(categoriesArray)} />
			<input type="hidden" name="tags" value={JSON.stringify(tagsArray)} />

			<!-- Actions -->
			<div class="flex justify-between">
				<Button type="submit" variant="default" class="px-6 py-2">Créer l'Article</Button>
				<Button variant="secondary" class="px-6 py-2" href="/blog">Retour à la Liste</Button>
			</div>
		</div>
	</form>
</div>

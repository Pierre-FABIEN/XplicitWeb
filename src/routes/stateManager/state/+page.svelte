<!-- App.svelte -->
<script lang="ts">
	import { todoStore } from './todoStore.svelte';
	import { Button } from '$shadcn/button';
	import Input from '$shadcn/input/input.svelte';
	import Checkbox from '$shadcn/checkbox/checkbox.svelte';

	let newTodoTitle: string = $state('');

	function addNewTodo() {
		if (newTodoTitle.trim() !== '') {
			todoStore.addTodo(newTodoTitle.trim());
			newTodoTitle = '';
		}
	}

	let todos = [];

	$effect(() => {
		todos = todoStore.todos;
	});

	$effect(() => {
		todoStore
			.loadTodos()
			.then(() => {
				// handle the promise resolution
			})
			.catch((error) => {
				// handle the promise rejection
			});
	});
</script>

<div class="mx-auto max-w-md rounded-lg p-6 shadow-md">
	<div class="mb-4 flex">
		<Input
			bind:value={newTodoTitle}
			placeholder="Nouvelle tache"
			onkeydown={(e) => e.key === 'Enter' && addNewTodo()}
		/>

		<Button onclick={addNewTodo} class="rounded-r">Ajouter</Button>
	</div>

	{#if todoStore.loading}
		<p class="text-gray-500">Chargement des tâches...</p>
	{:else if todoStore.error}
		<p class="text-red-500">Erreur : {todoStore.error}</p>
	{:else}
		<ul>
			{#each todoStore.todos as todo}
				<li class="flex items-center justify-between border-b py-2">
					<div class="flex items-center">
						<Checkbox
							onchange={() => todoStore.toggleTodo(todo.id)}
							checked={todo.completed}
							class="mr-2"
						/>
						<span class={todo.completed ? 'text-gray-500 line-through' : ''}>
							{todo.title}
						</span>
					</div>
					<Button onclick={() => todoStore.deleteTodo(todo.id)} variant="destructive">
						Supprimer
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

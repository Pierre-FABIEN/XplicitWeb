// todoStore.svelte.ts
type Todo = {
	id: number;
	title: string;
	completed: boolean;
};

export const createTodoStore = () => {
	let todos = $state<Todo[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const loadTodos = async () => {
		loading = true;
		error = null;
		try {
			const response = await fetch('https://jsonplaceholder.typicode.com/todos');
			if (!response.ok) {
				throw new Error('Erreur lors du chargement des tâches');
			}

			const data = await response.json();
			todos = data.slice(0, 5); // Limiter à 10 tâches pour cet exemple
		} catch (err) {
			error = (err as Error).message;
		} finally {
			loading = false;
		}
	};

	const addTodo = (title: string) => {
		const newTodo: Todo = {
			id: Date.now(),
			title,
			completed: false
		};
		todos = [...todos, newTodo];
	};

	const deleteTodo = (id: number) => {
		todos = todos.filter((todo) => todo.id !== id);
	};

	const toggleTodo = (id: number) => {
		todos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
	};

	return {
		get todos() {
			return todos;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		loadTodos,
		addTodo,
		deleteTodo,
		toggleTodo
	};
};

export const todoStore = createTodoStore();

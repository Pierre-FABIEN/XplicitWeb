<script lang="ts">
	import { Button } from '$shadcn/button';
	import * as Table from '$shadcn/table';
	import TableRow from '$shadcn/table/table-row.svelte';
	import TableCell from '$shadcn/table/table-cell.svelte';
	import { Input } from '$shadcn/input';
	import * as Select from '$shadcn/select';
	import { Toggle } from '$shadcn/toggle';
	import * as AlertDialog from '$shadcn/alert-dialog';

	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { CirclePlus } from 'lucide-svelte';
	import { Pencil } from 'lucide-svelte';
	import { Trash } from 'lucide-svelte';

	// Props
	let { columns, data, deleteActionUrl, editActionUrl, newActionUrl, name, enhance } = $props();

	// Variables for search and pagination
	let searchQuery: string = $state('');
	let currentPage: number = $state(1);
	let itemsPerPage: number = $state(5);

	// Options for items per page
	const optionPage = $state([
		{ label: '5', value: 5 },
		{ label: '10', value: 10 },
		{ label: '15', value: 15 },
		{ label: '20', value: 20 }
	]);

	// Sorting variables
	let sortColumn: string = $state('');
	let sortDirection: string = $state('asc');

	// Filtered and paginated items
	let filteredItems = $state([]);
	let paginatedItems: any[] = $state([]);

	// Function to sort items
	const sortItems = (column: string) => {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}

		data.sort((a: any, b: any) => {
			let aValue = a[column];
			let bValue = b[column];

			if (typeof aValue === 'string') {
				aValue = aValue.toLowerCase();
				bValue = bValue.toLowerCase();
			}

			return (aValue < bValue ? -1 : 1) * (sortDirection === 'asc' ? 1 : -1);
		});

		updateFilteredAndPaginatedItems();
	};

	// Function to filter and paginate items
	const updateFilteredAndPaginatedItems = () => {
		filteredItems = data.filter((item: any) =>
			Object.values(item).some((value) =>
				String(value).toLowerCase().includes(searchQuery.toLowerCase())
			)
		);

		const start = (currentPage - 1) * itemsPerPage;
		const end = start + itemsPerPage;
		paginatedItems = filteredItems.slice(start, end);
	};

	// Initialize filtered and paginated items from initial data
	updateFilteredAndPaginatedItems();

	// Function to change page
	const changePage = (page: number) => {
		currentPage = page;
		updateFilteredAndPaginatedItems();
	};

	// Function to change items per page
	const changeItemsPerPage = (items: number) => {
		itemsPerPage = items;
		currentPage = 1; // Reset to first page
		updateFilteredAndPaginatedItems();
	};

	// Function to delete an item
	const deleteItem = (id: string) => {
		data = data.filter((item: any) => item.id !== id);
		updateFilteredAndPaginatedItems();
	};
</script>

<div class="rcs w-full">
	<div class="w-full mt-10">
		<div class="border rounded p-2">
			<h2 class="text-2xl font-bold mb-5">{name}</h2>
			<div class="rcb mb-5 w-full">
				<Input
					type="text"
					placeholder="Cherchez dans le tableau"
					class="max-w-xs"
					bind:value={searchQuery}
					oninput={updateFilteredAndPaginatedItems}
				/>
				<div class="rcc nowrap">
					<div class="ccc">
						<Select.Root>
							<Select.Trigger class="w-36">
								<Select.Value placeholder="Items per page" />
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Pages</Select.Label>
									{#each optionPage as option}
										<Select.Item
											value={option.value}
											onclick={() => changeItemsPerPage(option.value)}>{option.label}</Select.Item
										>
									{/each}
								</Select.Group>
							</Select.Content>
							<Select.Input name="itemsPerPage" />
						</Select.Root>
					</div>
					{#if newActionUrl}
						<a
							data-sveltekit-preload-data
							href={newActionUrl}
							class="group relative inline-flex items-center mx-5 space-x-2 border border-transparent text-sm font-medium rounded-md"
						>
							<Toggle>
								<span class="hidden">Créer un produit</span>
								<CirclePlus class="w-7 h-7" />
							</Toggle>
						</a>
					{/if}
				</div>
			</div>
			<div class="border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							{#each columns as column}
								<Table.Head class="border-r border-r-gray-800 pr-2">
									<div class="rcb">
										{column.label}
										<button onclick={() => sortItems(column.key)}>
											<ChevronDown class="cursor-pointer" />
										</button>
									</div>
								</Table.Head>
							{/each}
							{#if editActionUrl || deleteActionUrl}
								<Table.Head class="w-36 text-center border-r border-r-gray-800 pr-2">
									Actions
								</Table.Head>
							{/if}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each paginatedItems as item, i (i)}
							<TableRow>
								{#each columns as column}
									<TableCell>{item[column.key]}</TableCell>
								{/each}
								{#if editActionUrl || deleteActionUrl}
									<TableCell class="rce">
										{#if editActionUrl}
											<Button variant="outline" class="m-1 p-1 text-xs">
												<a data-sveltekit-preload-data href={`${editActionUrl}${item.id}`}>
													<Pencil class="h-4 w-8" />
												</a>
											</Button>
										{/if}
										{#if deleteActionUrl}
											<AlertDialog.Root>
												<AlertDialog.Trigger>
													<Button variant="outline" class="m-1 p-1 text-xs">
														<Trash class="h-4 w-8" />
													</Button>
												</AlertDialog.Trigger>

												<AlertDialog.Content>
													<AlertDialog.Header>
														<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
														<AlertDialog.Description>
															This action cannot be undone. This will permanently delete the item.
														</AlertDialog.Description>
													</AlertDialog.Header>
													<AlertDialog.Footer>
														<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
														<form
															method="POST"
															action={deleteActionUrl}
															use:enhance
															onsubmit={() => {
																deleteItem(item.id);
															}}
														>
															<input type="hidden" name="id" value={item.id} />
															<AlertDialog.Action type="submit">Continue</AlertDialog.Action>
														</form>
													</AlertDialog.Footer>
												</AlertDialog.Content>
											</AlertDialog.Root>
										{/if}
									</TableCell>
								{/if}
							</TableRow>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<div class="pagination-controls mt-4 rce">
				{#if currentPage > 1}
					<Button onclick={() => changePage(currentPage - 1)}>Previous</Button>
				{/if}
				<div class="">
					{#each Array(Math.ceil(filteredItems.length / itemsPerPage)) as _, pageIndex}
						<Button class="mx-1" onclick={() => changePage(pageIndex + 1)}>{pageIndex + 1}</Button>
					{/each}
				</div>
				{#if currentPage < Math.ceil(filteredItems.length / itemsPerPage)}
					<Button onclick={() => changePage(currentPage + 1)}>Next</Button>
				{/if}
			</div>
		</div>
	</div>
</div>

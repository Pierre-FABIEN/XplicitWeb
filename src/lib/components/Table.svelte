<script lang="ts">
	import { Button } from '$shadcn/button';
	import * as Table from '$shadcn/table';
	import TableRow from '$shadcn/table/table-row.svelte';
	import TableCell from '$shadcn/table/table-cell.svelte';
	import { Input } from '$shadcn/input';
	import * as Popover from '$shadcn/popover/index.js';
	import * as RadioGroup from '$shadcn/radio-group/index.js';
	import { Label } from '$shadcn/label';

	import ChevronDown from 'lucide-svelte/icons/chevron-down';

	// Props
	let { columns, data, name } = $props();

	// State
	let searchQuery = $state('');
	let currentPage = $state(1);
	let itemsPerPage = $state(5);

	// Options for items per page
	const optionPage = $state([
		{ label: '5', value: 5 },
		{ label: '10', value: 10 },
		{ label: '15', value: 15 },
		{ label: '20', value: 20 }
	]);

	// Convert itemsPerPage to string for the RadioGroup
	let itemsPerPageString = $state(String(itemsPerPage));

	// Sorting variables
	let sortColumn = $state('');
	let sortDirection = $state('asc');

	// Filtered and paginated items
	let filteredItems = $state([]);
	let paginatedItems = $state([]);

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

	// Whenever itemsPerPageString changes, update itemsPerPage
	$effect(() => {
		const newItems = parseInt(itemsPerPageString, 10);
		if (newItems !== itemsPerPage) {
			changeItemsPerPage(newItems);
		}
	});
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
						<Popover.Root>
							<Popover.Trigger class="border border-gray-300 rounded px-2 py-1">
								{itemsPerPage} Items per page
							</Popover.Trigger>
							<Popover.Content class="p-4 border rounded w-48 bg-white shadow-lg">
								<div class="mb-2 font-medium">Choisissez le nombre d'items :</div>
								<RadioGroup.Root bind:value={itemsPerPageString} class="space-y-2">
									{#each optionPage as option}
										<div class="flex items-center space-x-2">
											<RadioGroup.Item value={String(option.value)} id={'option' + option.value} />
											<Label for={'option' + option.value}>{option.label}</Label>
										</div>
									{/each}
								</RadioGroup.Root>
							</Popover.Content>
						</Popover.Root>
					</div>
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
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each paginatedItems as item, i (i)}
							<TableRow>
								{#each columns as column}
									<TableCell>{item[column.key]}</TableCell>
								{/each}
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

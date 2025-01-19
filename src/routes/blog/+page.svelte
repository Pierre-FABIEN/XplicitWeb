<script lang="ts">
	import * as Pagination from '$shadcn/pagination';
	import { Button } from '$shadcn/button';

	let { data } = $props();
</script>

<main class="container mx-auto px-4 py-6">
	<h1 class="text-4xl font-bold mb-8">Liste des Articles</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each data.posts as article}
			<div
				class="group relative bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
			>
				<div class="p-6">
					<!-- Category -->
					<p class="text-sm font-medium text-indigo-600">
						{article.category?.name || 'Uncategorized'}
					</p>

					<!-- Title -->
					<h3
						class="mt-2 text-lg font-semibold text-gray-900 group-hover:text-indigo-800 transition-colors duration-300"
					>
						<a href={`/articles/${article.slug}`}>
							{article.title}
						</a>
					</h3>

					<!-- Content Preview -->
					<p class="mt-3 text-sm text-gray-600 line-clamp-3">
						{@html article.content}
					</p>

					<!-- Author and Date -->
					<div class="mt-4 flex items-center space-x-3">
						<div>
							<p class="text-sm font-medium text-gray-900">
								{article.author?.name || 'Unknown Author'}
							</p>
							<p class="text-sm text-gray-500">
								{new Date(article.createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>

					<Button>
						<a href={`/blog/${article.slug}`}>Lire la suite</a>
					</Button>
				</div>
			</div>
		{/each}
	</div>
</main>

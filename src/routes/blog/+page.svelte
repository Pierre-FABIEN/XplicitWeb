<script lang="ts">
	import * as Pagination from '$shadcn/pagination';
	import { Button } from '$shadcn/button';
	import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$shadcn/card';

	let { data } = $props();
</script>

<main class="container mx-auto px-4 py-6">
	<h1 class="text-4xl font-bold mb-8">Liste des Articles</h1>
	<Button href="/blog/create" class="my-8">Ajouter un article</Button>
	<!-- Affichage des articles -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each data.articles as article}
			<Card class="cardEffect hover:shadow-lg transition-shadow">
				<CardHeader>
					<CardTitle class="text-xl font-semibold">{article.title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class=" line-clamp-3">{article.content}</p>
					<div class="flex items-center justify-between text-sm mt-4">
						<div>
							<span class="font-medium">Auteur :</span>
							{article.author.name}
						</div>
						<div>
							<span class="font-medium">Catégorie :</span>
							{article.category.name}
						</div>
					</div>
					<div class="flex flex-wrap gap-2 mt-4">
						{#each article.tags as tag}
							<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
								{tag.tag.name}
							</span>
						{/each}
					</div>
				</CardContent>
				<CardFooter class="text-right">
					<Button variant="default" href={`/blog/${article.slug}`}>Lire la suite</Button>
				</CardFooter>
			</Card>
		{/each}
	</div>

	<!-- Pagination avec ShadCN -->
	<div class="mt-8 flex justify-center">
		<Pagination.Root count={data.pagination.totalPages} perPage={1}>
			<Pagination.Content>
				<!-- Bouton Précédent -->
				<Pagination.Item>
					{#if data.pagination.currentPage > 1}
						<a
							href={`?page=${data.pagination.currentPage - 1}`}
							class="px-4 py-2 border rounded transition"
						>
							← Précédent
						</a>
					{:else}
						<span class="px-4 py-2 border rounded cursor-not-allowed"> ← Précédent </span>
					{/if}
				</Pagination.Item>

				<!-- Pages -->
				{#each Array(data.pagination.totalPages)
					.fill(null)
					.map((_, index) => index + 1) as page (page)}
					<Pagination.Item isVisible={data.pagination.currentPage === page}>
						<a href={`?page=${page}`} class={`px-4 py-2 border rounded`}>
							{page}
						</a>
					</Pagination.Item>
				{/each}

				<!-- Bouton Suivant -->
				<Pagination.Item>
					{#if data.pagination.currentPage < data.pagination.totalPages}
						<a
							href={`?page=${data.pagination.currentPage + 1}`}
							class="px-4 py-2 border rounded transition"
						>
							Suivant →
						</a>
					{:else}
						<span class="px-4 py-2 border rounded cursor-not-allowed"> Suivant → </span>
					{/if}
				</Pagination.Item>
			</Pagination.Content>
		</Pagination.Root>
	</div>
</main>

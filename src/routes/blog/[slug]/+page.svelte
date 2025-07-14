<script lang="ts">
	import { Button } from '$shadcn/button';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="container mx-auto px-4 py-6 max-w-xl">
	<article class=" shadow-md rounded-lg overflow-hidden">
		<div class="p-6">
			<h1 class="text-3xl font-bold mb-4">{data.post.title}</h1>
			<div class="mb-6 prose prose-lg max-w-none">
				{@html data.post.content}
			</div>

			<div class="flex items-center justify-between text-sm mb-4">
				<div>
					<span class="font-medium">Auteur :</span>
					{data.post.author.name}
				</div>
				<div>
					<span class="font-medium">Catégorie :</span>
					{data.post.category.name}
				</div>
			</div>

			<div class="flex flex-wrap gap-2 mb-6">
				{#each data.post.tags as tag}
					<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
						{tag.tag.name}
					</span>
				{/each}
			</div>
		</div>
	</article>

	<Button href="/blog">Retour au blog</Button>
</main>

<script lang="ts">
	import { Button } from '$shadcn/button';
	import { ArrowLeft, Calendar, User, Tag, Folder } from 'lucide-svelte';
	import type { PageData } from './$types';
	import SEO from '$lib/components/SEO.svelte';

	let { data }: { data: PageData } = $props();
	
	// Préparer les tags pour le SEO
	const seoTags = $derived(data.post?.tags?.map(tag => tag.tag.name) || []);
</script>

<!-- SEO pour l'article individuel -->
<SEO 
	title={data.post?.title || 'Article'}
			description={data.post?.content?.substring(0, 160) || 'Découvrez cet article sur XPLICITDRINK®'}
	keywords={`${data.post?.category?.name || ''}, ${seoTags.join(', ')}`}
	image="/og-article.jpg"
	type="article"
	publishedTime={data.post?.createdAt ? new Date(data.post.createdAt).toISOString() : undefined}
	modifiedTime={data.post?.updatedAt ? new Date(data.post.updatedAt).toISOString() : undefined}
	author={data.post?.author?.name || 'XplicitWeb'}
	section={data.post?.category?.name || 'Blog'}
	tags={seoTags}
/>

<!-- Header avec navigation -->
<div class="w-[100vw]  absolute left-0 top-0 ccc pb-[120px]">
	<header class="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white  ">
		<div class="container mx-auto px-4 py-8">
			<div class="mx-auto">
				<Button 
					href="/blog" 
					variant="ghost" 
					class="text-white hover:bg-white/10 dark:hover:bg-white/20 mb-6 group"
				>
					<ArrowLeft class="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
					Retour au blog
				</Button>
				
				<div class="space-y-4">
					<div class="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-blue-100 dark:text-blue-200">
						<div class="flex items-center gap-2">
							<Calendar class="w-4 h-4" />
							<span>{data.post?.createdAt ? new Date(data.post.createdAt).toLocaleDateString('fr-FR', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							}) : 'Date inconnue'}</span>
						</div>
						<div class="flex items-center gap-2">
							<User class="w-4 h-4" />
							<span>{data.post?.author?.name || 'Auteur inconnu'}</span>
						</div>
						<div class="flex items-center gap-2">
							<Folder class="w-4 h-4" />
							<span>{data.post?.category?.name || 'Catégorie inconnue'}</span>
						</div>
					</div>
					
					<h1 class="articleTitle">
						{data.post?.title || 'Titre inconnu'}
					</h1>
				</div>
			</div>
		</div>
	</header>

	<!-- Contenu principal -->
	<main class="min-h-screen">
		<div class="container mx-auto px-4 py-8 sm:py-12">
			<div class="mx-auto">
				<!-- Article -->
				<article class="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
					<!-- Contenu de l'article -->
					<div class="p-4 sm:p-6 md:p-8 lg:p-12">
						<!-- Tags -->
						{#if data.post.tags && data.post.tags.length > 0}
							<div class="flex flex-wrap gap-2 mb-6 sm:mb-8">
								{#each data.post.tags as tag}
									<span class="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border border-blue-200 dark:border-blue-700">
										<Tag class="w-3 h-3" />
										{tag.tag.name}
									</span>
								{/each}
							</div>
						{/if}
						
						<!-- Contenu HTML -->
						<div class="prose prose-sm sm:prose-base md:prose-lg lg:prose-xl max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:font-bold prose-h1:text-2xl sm:prose-h1:text-3xl prose-h2:text-xl sm:prose-h2:text-2xl prose-h3:text-lg sm:prose-h3:text-xl prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:pl-4 sm:prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-img:rounded-lg prose-img:shadow-md dark:prose-img:shadow-lg dark:prose-img:shadow-gray-900/50">
							{@html data.post.content}
						</div>
					</div>
				</article>
				
				<!-- Métadonnées de l'article -->
				<div class="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-center sm:text-left">
						<div class="flex flex-col items-center sm:items-start">
							<div class="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
								<User class="w-5 h-5" />
								<span class="font-medium text-sm sm:text-base">Auteur</span>
							</div>
							<p class="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">{data.post.author.name}</p>
						</div>
						
						<div class="flex flex-col items-center sm:items-start">
							<div class="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
								<Folder class="w-5 h-5" />
								<span class="font-medium text-sm sm:text-base">Catégorie</span>
							</div>
							<p class="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">{data.post.category.name}</p>
						</div>
						
						<div class="flex flex-col items-center sm:items-start sm:col-span-2 lg:col-span-1">
							<div class="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
								<Calendar class="w-5 h-5" />
								<span class="font-medium text-sm sm:text-base">Publié le</span>
							</div>
							<p class="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">
								{new Date(data.post.createdAt).toLocaleDateString('fr-FR', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</p>
						</div>
					</div>
				</div>
				
				<!-- Navigation -->
				<div class="mt-6 sm:mt-8 flex justify-center">
					<Button 
						href="/blog" 
						class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-medium shadow-lg hover:shadow-xl dark:shadow-blue-500/25 dark:hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base"
					>
						<ArrowLeft class="w-4 h-4 mr-2" />
						Retour au blog
					</Button>
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	/* Style du titre adapté */
	.articleTitle {
		font-family: 'Open Sans Variable', sans-serif;
		font-style: italic;
		font-size: clamp(1.5rem, 6vw, 4rem);
		margin-bottom: 12px;
		-webkit-text-stroke: 1px black;
		color: transparent;
		text-transform: uppercase;
		font-weight: 900;
		line-height: 1;
	}
	
	/* Styles personnalisés pour améliorer la lisibilité */
	:global(.prose) {
		line-height: 1.8;
	}
	
	:global(.prose p) {
		margin-bottom: 1.5rem;
	}
	
	:global(.prose h1, .prose h2, .prose h3, .prose h4) {
		margin-top: 2.5rem;
		margin-bottom: 1rem;
	}
	
	:global(.prose ul, .prose ol) {
		margin-bottom: 1.5rem;
		padding-left: 1.5rem;
	}
	
	:global(.prose li) {
		margin-bottom: 0.5rem;
	}
	
	:global(.prose blockquote) {
		margin: 2rem 0;
		font-style: italic;
	}
	
	:global(.prose img) {
		margin: 2rem auto;
		max-width: 100%;
		height: auto;
	}
	
	:global(.prose a) {
		font-weight: 500;
		transition: all 0.2s ease;
	}
	
	:global(.prose a:hover) {
		color: #2563eb;
	}
	
	/* Styles spécifiques pour le mode sombre */
	:global(.dark .prose a:hover) {
		color: #60a5fa;
	}
	
	:global(.dark .prose blockquote) {
		border-left-color: #60a5fa;
		background-color: rgba(59, 130, 246, 0.1);
	}
	
	:global(.dark .prose code) {
		background-color: rgba(55, 65, 81, 0.8);
		color: #e5e7eb;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}
	
	:global(.dark .prose pre) {
		background-color: #1f2937;
		color: #e5e7eb;
		border: 1px solid #374151;
		overflow-x: auto;
	}
	
	:global(.dark .prose hr) {
		border-color: #374151;
	}
	
	:global(.dark .prose table) {
		border-color: #374151;
		overflow-x: auto;
		display: block;
	}
	
	:global(.dark .prose th) {
		background-color: #374151;
		border-color: #4b5563;
	}
	
	:global(.dark .prose td) {
		border-color: #4b5563;
	}
	
	/* Responsive design amélioré */
	@media (max-width: 640px) {
		:global(.prose) {
			font-size: 0.875rem;
			line-height: 1.7;
		}
		
		:global(.prose h1) {
			font-size: 1.5rem;
		}
		
		:global(.prose h2) {
			font-size: 1.25rem;
		}
		
		:global(.prose h3) {
			font-size: 1.125rem;
		}
		
		:global(.prose ul, .prose ol) {
			padding-left: 1rem;
		}
		
		:global(.prose blockquote) {
			margin: 1.5rem 0;
			padding-left: 1rem;
		}
	}
	
	@media (max-width: 480px) {
		:global(.prose) {
			font-size: 0.8rem;
		}
		
		:global(.prose h1) {
			font-size: 1.25rem;
		}
		
		:global(.prose h2) {
			font-size: 1.125rem;
		}
		
		:global(.prose h3) {
			font-size: 1rem;
		}
	}
</style>

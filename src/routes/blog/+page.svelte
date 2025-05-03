<script lang="ts">
	// -----------------------------
	// ✅ IMPORTS
	// -----------------------------
	import { tick } from 'svelte';
	import { gsap } from 'gsap';
	import { Button } from '$shadcn/button';

	// -----------------------------
	// ✅ TYPES
	// -----------------------------
	interface IAuthor {
		id: string;
		name: string;
		createdAt: Date;
	}
	interface ICategory {
		id: string;
		name: string;
		description?: string;
		createdAt: Date;
	}
	interface IPost {
		id: string;
		title: string;
		slug: string;
		content: string;
		published: boolean;
		createdAt: Date;
		updatedAt?: Date;
		category?: ICategory;
		author?: IAuthor;
		tags?: any[];
	}
	interface IData {
		user: any | null;
		pendingOrder: any | null;
		posts: IPost[];
	}

	// -----------------------------
	// ✅ PROPS
	// -----------------------------
	let { data } = $props();

	// -----------------------------
	// ✅ STATE
	// -----------------------------
	let posts = $state(data.posts || []);
	let containerRef: HTMLElement | null = null;

	// -----------------------------
	// ✅ GSAP $effect + cleanup
	// -----------------------------
	$effect(() => {
		let inTimeline: gsap.core.Timeline;
		let outTimeline: gsap.core.Timeline;

		// 1. Run entry animation when DOM is ready
		tick().then(() => {
			if (!containerRef) return;

			const titleEl = containerRef.querySelector('.title');
			const cardEls = containerRef.querySelectorAll('.article-card');

			inTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

			if (titleEl) {
				inTimeline.from(titleEl, {
					y: -50,
					opacity: 0,
					duration: 0.5
				});
			}

			if (cardEls.length) {
				inTimeline.from(
					cardEls,
					{
						y: 20,
						opacity: 0,
						duration: 0.4,
						stagger: 0.1
					},
					'-=0.2'
				);
			}
		});

		// 2. Cleanup = run exit animation *before* component unmount
		return () => {
			if (!containerRef) return;

			const titleEl = containerRef.querySelector('.title');
			const cardEls = containerRef.querySelectorAll('.article-card');

			outTimeline = gsap.timeline({ defaults: { ease: 'power3.in' } });

			if (cardEls.length) {
				outTimeline.to(cardEls, {
					y: 20,
					opacity: 0,
					duration: 0.3,
					stagger: 0.05
				});
			}

			if (titleEl) {
				outTimeline.to(
					titleEl,
					{
						y: -40,
						opacity: 0,
						duration: 0.3
					},
					'-=0.2'
				);
			}
		};
	});
</script>

<!-- =============================
✅ TEMPLATE
============================= -->
<main bind:this={containerRef} class="container mx-auto px-4 py-6">
	<h1 class="title text-4xl font-bold mb-8">Liste des Articles</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each posts as article}
			<div
				class="article-card group relative bg-white border border-gray-200
				       rounded-lg shadow-md overflow-hidden hover:shadow-lg
				       transition-shadow duration-300"
			>
				<div class="p-6">
					<p class="text-sm font-medium text-indigo-600">
						{article.category?.name || 'Uncategorized'}
					</p>

					<h3
						class="mt-2 text-lg font-semibold text-gray-900
						       group-hover:text-indigo-800 transition-colors duration-300"
					>
						<a href={`/articles/${article.slug}`}>
							{article.title}
						</a>
					</h3>

					<p class="mt-3 text-sm text-gray-600 line-clamp-3">
						{@html article.content}
					</p>

					<Button class="mt-4">
						<a href={`/blog/${article.slug}`}>Lire la suite</a>
					</Button>
				</div>
			</div>
		{/each}
	</div>
</main>

<style>
	/* You can expand if needed */
</style>

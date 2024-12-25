<script lang="ts">
	import * as Card from '$shadcn/card/index.js';
	import * as Carousel from '$shadcn/carousel/index.js';

	let { data } = $props();
</script>

<div class="h-[100vh] w-[50vw] ccc">
	<div class="h-[100vh] w-[50vw] ccc">
		<Carousel.Root
			opts={{
				align: 'start'
			}}
			orientation="vertical"
			class="w-[100%] ccc wrapperCarousel"
		>
			<Carousel.Content class="-mt-1 h-[100vh]">
				{#each Array(5) as _, i (i)}
					<Carousel.Item class="pt-1 md:basis-1/2">
						<div class="p-1 w-[400px] h-[400px]">
							<Card.Root>
								<Card.Content class="w-[400px] h-[350px] flex items-center justify-center p-6">
									<span class="text-3xl font-semibold">{i + 1}</span>
								</Card.Content>
							</Card.Root>
						</div>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<Carousel.Previous />
			<Carousel.Next />
		</Carousel.Root>
	</div>
</div>

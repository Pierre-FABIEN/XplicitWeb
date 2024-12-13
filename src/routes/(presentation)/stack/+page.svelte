<script lang="ts">
	// English comments inside the code
	import { Separator } from '$shadcn/separator';
	import * as Avatar from '$shadcn/avatar';

	// Import data
	import { Production, Frontend, Backend, Test } from './data';
	import { fly } from 'svelte/transition';

	// Create an array of sections to render
	const sections = [Frontend, Backend, Production, Test];
</script>

<div
	in:fly={{ x: 1000, duration: 500 }}
	out:fly={{ x: -1000, duration: 500 }}
	class="flex flex-col absolute top-0 items-center justify-center mt-20 w-full max-w-5xl overflow-hidden"
>
	<h1 class="w-[100%] text-left text-9xl font-light leading-tight mb-8 text-[#fd4000]">La stack</h1>

	<!-- Loop through all sections -->
	{#each sections as section}
		<div class="w-full mb-10">
			<h2 class="w-full text-5xl mt-5 text-left font-light leading-tight sm:text-6xl mb-4">
				{section.title}
			</h2>
			<p class="text-left mb-6 text-lg text-gray-600">{section.description}</p>

			<!-- Render groups of technologies -->
			<div class="columns-3 gap-4 w-full">
				{#each Object.entries(section) as [group, techs]}
					<!-- Skip title and description keys -->
					{#if group !== 'title' && group !== 'description'}
						<div
							class="cardEffect break-inside-avoid rounded-lg shadow-md mb-4 p-4 backdrop-blur-sm"
						>
							<h2 class="text-xl font-semibold mb-2">{group}</h2>
							<Separator class="my-2" />

							<!-- List each technology -->
							{#each techs as tech}
								<div class="mb-4 flex items-start space-x-3">
									<Avatar.Root>
										<Avatar.Image src={tech.image} alt="{tech.name} icon" class="w-10 h-10" />
										<Avatar.Fallback>{tech.name[0]}</Avatar.Fallback>
									</Avatar.Root>
									<div>
										<a
											href={tech.link}
											class="text-blue-600 hover:underline"
											target="_blank"
											rel="noopener noreferrer"
										>
											<h3 class="font-medium">{tech.name}</h3>
										</a>
										<p class="text-sm">{tech.description}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/each}

	<div class="m-8 flex justify-center space-x-4">
		<a href="/installation" class="presentationButton">Installer le projet</a>
	</div>
</div>

<style lang="scss">
	a {
		color: #fd4000;
	}

	.presentationButton {
		padding: 5px 20px;
		border-radius: 5px;
		border: 1px solid #fd4000;
		box-shadow: 0px 0px 5px 2px #82828260;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: lighter;
		cursor: pointer;
		transition: all 0.15s ease-in-out;

		&:hover {
			background-color: #fd4000;
		}
	}
</style>

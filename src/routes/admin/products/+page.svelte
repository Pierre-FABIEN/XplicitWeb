<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1>Products</h1>
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
	<div class="bg-gray-200 rounded aspect-video"></div>
	<div class="bg-gray-200 rounded aspect-video"></div>
	<div class="bg-gray-200 rounded aspect-video"></div>
</div>
<div class="bg-gray-200 rounded mt-4 min-h-[100vh]"></div>

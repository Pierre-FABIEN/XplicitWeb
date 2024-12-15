<script>
	import { Button } from '$shadcn/button';
	import Threltre from '$lib/components/threlte/Threltre.svelte';
</script>

<div class="h-screen w-screen">
	<Button>changer</Button>
	<Button href="/commande">ajouter au panier</Button>
	<Threltre />
</div>

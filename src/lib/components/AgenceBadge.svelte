<script lang="ts">
	import * as HoverCard from '$shadcn/hover-card';
	import { Badge } from '$shadcn/badge/index.js';

	let {
		agence
	}: { agence: { street: string; city: string; state: string; zip: string; country: string } } =
		$props();

	const getZipPrefix = (zip: string) => zip.slice(0, 2);
</script>

<HoverCard.Root>
	<HoverCard.Trigger>
		<Badge>{getZipPrefix(agence.zip)}</Badge>
	</HoverCard.Trigger>
	<HoverCard.Content>
		<p><strong>Street:</strong> {agence.street}</p>
		<p><strong>City:</strong> {agence.city}</p>
		<p><strong>State:</strong> {agence.state}</p>
		<p><strong>Zip:</strong> {agence.zip}</p>
		<p><strong>Country:</strong> {agence.country}</p>
	</HoverCard.Content>
</HoverCard.Root>

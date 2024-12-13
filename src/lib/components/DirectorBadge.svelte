<script lang="ts">
	import * as HoverCard from '$shadcn/hover-card';
	import { Badge } from '$shadcn/badge/index.js';

	let { director }: { director: { name: string; email: string; age: number; isActive: boolean } } =
		$props(); // Attendez un objet 'director' comme prop

	// Fonction pour obtenir les initiales du directeur
	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('');
	};
</script>

<HoverCard.Root>
	<HoverCard.Trigger>
		<Badge>{getInitials(director.name)}</Badge>
		<!-- Affiche les initiales -->
	</HoverCard.Trigger>
	<HoverCard.Content>
		<p><strong>Name:</strong> {director.name}</p>
		<p><strong>Email:</strong> {director.email}</p>
		<p><strong>Age:</strong> {director.age}</p>
		<p><strong>Is Active:</strong> {director.isActive ? 'Yes' : 'No'}</p>
	</HoverCard.Content>
</HoverCard.Root>

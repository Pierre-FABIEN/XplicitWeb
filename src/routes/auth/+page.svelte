<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '$shadcn/card';
	import { Button } from '$shadcn/button';

	let { data } = $props();
</script>

<div class="mx-auto mt-12 max-w-md p-4">
	<Card class="shadow-lg rounded-lg">
		<CardHeader>
			<CardTitle class="text-center text-2xl font-semibold">
				👋 Bonjour, {data.user.username} !
			</CardTitle>
		</CardHeader>

		<CardContent class="text-center">
			<p class="text-gray-700 mb-4">Vous êtes connecté(e) avec succès.</p>
		</CardContent>

		<CardFooter class="flex flex-col gap-4">
			<form method="post" action="?/signout" use:enhance class="text-center">
				<Button type="submit" variant="destructive" class="w-full">Se déconnecter</Button>
			</form>
			<div class="flex justify-between w-[100%]">
				<a href="/auth/settings" class="text-orange-700 hover:underline">Paramètres</a>
			</div>
		</CardFooter>
	</Card>
</div>

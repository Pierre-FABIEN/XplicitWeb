<script>
	import CodeComponent from '$lib/components/CodeComponent.svelte';
	import { fly } from 'svelte/transition';
</script>

<div
	in:fly={{ x: 1000, duration: 500 }}
	out:fly={{ x: -1000, duration: 500 }}
	class="flex flex-col absolute top-0 items-center justify-center mt-20 w-full max-w-5xl"
>
	<h1 class="w-[100%] text-left text-9xl font-light leading-tight mb-8 text-[#fd4000]">
		Installation
	</h1>
	<section class="  py-12">
		<div class="container mx-auto px-6 space-y-12">
			<!-- Étape 1 : Installer les dépendances -->
			<div class="p-6 rounded-lg shadow-md">
				<h2 class="text-2xl font-semibold mb-2">1. npm clone</h2>
				<h2 class="text-2xl font-semibold mb-2">2. npm i</h2>
				<h2 class="text-2xl font-semibold mb-2">3. env</h2>
				<h2 class="text-2xl font-semibold mb-2">4. npm run seed</h2>
				<p class=" mb-4">
					Installez les dépendances nécessaires au projet avec la commande suivante :
				</p>
				<CodeComponent text="npm install" />
			</div>

			<!-- Étape 2 : Configurer les variables d'environnement -->
			<div class="p-6 rounded-lg shadow-md">
				<h2 class="text-2xl font-semibold mb-2">2. Configurer les variables d'environnement</h2>
				<p class=" mb-4">
					Créez un fichier <code>.env</code> dans la racine du projet et copiez-y les variables suivantes
					:
				</p>
				<pre class="preStyle p-4 rounded text-sm">
DATABASE_URL=mongodb+srv://*:*@*.*.mongodb.net/*?retryWrites=true&w=majority&appName=*
				SECRET_OPENCAGEDATA_KEY=*
				ENCRYPTION_KEY=*
				PUBLIC_ENV='dev'
				
				VITE_GOOGLE_REDIRECT_URI=*
				GOOGLE_CLIENT_ID=*
				GOOGLE_CLIENT_SECRET=*
				
				STRIPE_WEBHOOK_SECRET=*
				STRIPE_SECRET_KEY=*
				VITE_STRIPE_PUBLISHABLE_KEY=*
			</pre>
			</div>

			<div class="p-6 rounded-lg shadow-md">
				<h2 class="text-2xl font-semibold mb-4">2. Détails des variables</h2>
				<ul class="list-disc pl-6 space-y-2">
					<li>
						<strong>DATABASE_URL</strong> : Lien de connexion à votre base de données MongoDB.
					</li>
					<li>
						<strong>SECRET_OPENCAGEDATA_KEY</strong> : Clé API pour le service OpenCage (utilisé pour
						les adresses).
					</li>
					<li>
						<strong>ENCRYPTION_KEY</strong> : Clé utilisée pour le chiffrement dans l'application.
					</li>
					<li>
						<strong>PUBLIC_ENV</strong> : Spécifie l'environnement actuel (ex. <code>dev</code>,
						<code>production</code>).
					</li>
					<li>
						<strong>VITE_GOOGLE_REDIRECT_URI</strong>, <strong>GOOGLE_CLIENT_ID</strong>,
						<strong>GOOGLE_CLIENT_SECRET</strong> : Informations nécessaires pour l'authentification
						Google.
					</li>
					<li>
						<strong>STRIPE_WEBHOOK_SECRET</strong>, <strong>STRIPE_SECRET_KEY</strong>,
						<strong>VITE_STRIPE_PUBLISHABLE_KEY</strong> : Clés pour la configuration de Stripe (paiements
						et webhooks).
					</li>
				</ul>
			</div>

			<!-- Étape 3 : Générer le client Prisma -->
			<div class="p-6 rounded-lg shadow-md">
				<h2 class="text-2xl font-semibold mb-2">3. Générer le client Prisma</h2>
				<p class=" mb-4">
					Utilisez Prisma pour générer le client nécessaire au projet avec cette commande :
				</p>

				<CodeComponent text="npx prisma generate" />
			</div>

			<!-- Étape 4 : Lancer le projet -->
			<div class="p-6 rounded-lg shadow-md">
				<h2 class="text-2xl font-semibold mb-2">4. Lancer le projet</h2>
				<p class=" mb-4">
					Une fois toutes les étapes terminées, lancez le serveur en mode développement :
				</p>
				<CodeComponent text="npm run dev" />
				<p class=" mt-4">
					Le projet sera accessible sur <a
						href="http://localhost:1000"
						target="_blank"
						class="text-blue-500 underline">http://localhost:1000</a
					>.
				</p>
			</div>
		</div>
	</section>

	<section class="  py-12">
		<div class="container mx-auto px-6 space-y-12">
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-4xl font-bold">Scripts npm pour le Boilerplate</h1>
				<p class="mt-4">
					Une explication détaillée des scripts npm inclus dans le projet, leur objectif et leur
					usage.
				</p>
			</div>

			<!-- Liste des scripts -->
			<div class="space-y-6">
				<!-- Script dev -->
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-2xl font-semibold mb-2">1. <code>npm run dev</code></h2>
					<p class="">
						Lance le serveur de développement sur le port <strong>1000</strong>. Il exécute
						également un watcher pour Prettier afin de formater automatiquement le code pendant que
						vous travaillez.
					</p>

					<CodeComponent text={'concurrently "vite dev --port 1000"'} />
				</div>

				<!-- Script build -->
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-2xl font-semibold mb-2">2. <code>npm run build</code></h2>
					<p class="">
						Compile le projet pour la production. Génère des fichiers optimisés pour le déploiement.
					</p>

					<CodeComponent text="vite build" />
				</div>

				<!-- Script preview -->
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-2xl font-semibold mb-2">3. <code>npm run preview</code></h2>
					<p class="">
						Lance une prévisualisation de la version de production sur un serveur local.
					</p>

					<CodeComponent text="vite preview" />
				</div>

				<!-- Script check -->
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-2xl font-semibold mb-2">4. <code>npm run check</code></h2>
					<p class="">
						Synchronise les fichiers SvelteKit et effectue une vérification TypeScript pour détecter
						les erreurs dans le projet.
					</p>

					<CodeComponent text="svelte-kit sync && svelte-check --ts" />
				</div>

				<!-- Script lint -->
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-2xl font-semibold mb-2">5. <code>npm run lint</code></h2>
					<p class="">
						Vérifie la qualité du code avec Prettier et ESLint. Ce script s'assure que le code
						respecte les normes définies.
					</p>

					<CodeComponent text="prettier --check . && eslint ." />
				</div>

				<!-- Script test -->
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-2xl font-semibold mb-2">6. <code>npm run test</code></h2>
					<p class="">Exécute les tests unitaires avec Vitest et les tests E2E avec Playwright.</p>

					<CodeComponent text="npm run test:unit -- --run && npm ru" />
				</div>

				<!-- Script seed -->
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-2xl font-semibold mb-2">7. <code>npm run seed</code></h2>
					<p class="">Insère des données fictives dans la base de données pour tester le projet.</p>

					<CodeComponent text="node src/lib/server/seed.js" />
				</div>

				<!-- Script render -->
				<div class="p-6 rounded-lg shadow-md">
					<h2 class="text-2xl font-semibold mb-2">8. <code>npm run render</code></h2>
					<p class="">
						Lance le serveur en mode production sur le port <strong>10000</strong>.
					</p>

					<CodeComponent text="PORT=10000 tsm ./prodServer.ts" />
				</div>
			</div>
		</div>
	</section>
</div>

<style lang="scss">
	.preStyle {
		background-color: rgba(0, 0, 0, 0.1);
		border: 1px solid #fd4000;
		//filter: drop-shadow(5px 5px 5px #000000);
		box-shadow: 0px 0px 5px 2px #82828260;
		width: min-content;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 10px;
		border-radius: 5px;
	}
</style>

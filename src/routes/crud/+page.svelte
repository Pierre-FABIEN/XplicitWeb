<section class="home">
	<div class="mt-10 column justify-center">
		<article class="m-2 w-full max-w-4xl rounded-lg border p-8">
			<h1 class="mb-4 text-4xl font-bold">Présentation du test</h1>

			<section class="mb-8">
				<h2 class="mb-4 text-2xl font-semibold">
					1. CRUD pour les Directeurs, Agences et Produits
				</h2>
				<p class=" mb-4">
					Ce projet vise à gérer une base de données MongoDB contenant des informations sur des
					directeurs, des agences, et des produits, en utilisant Prisma comme ORM pour simplifier
					les opérations CRUD (Create, Read, Update, Delete). Le projet inclut les modèles <strong
						>Director</strong
					>, <strong>Agence</strong>, et <strong>Product</strong>, ainsi que leurs relations.
				</p>

				<div class="mb-4 ml-4">
					<h3 class="mb-2 text-xl font-semibold">Directeur</h3>
					<p class="">
						Le modèle <strong>Director</strong> représente les directeurs d'agences. Chaque directeur
						a un identifiant unique, un nom, un email, un âge, une date de création, et un statut d'activité.
						Le directeur peut être associé à plusieurs agences.
					</p>
				</div>

				<div class="mb-4 ml-4">
					<h3 class="mb-2 text-xl font-semibold">Agence</h3>
					<p class="">
						Le modèle <strong>Agence</strong> représente les agences associées à un directeur. Chaque
						agence possède une adresse complète (rue, ville, état, code postal, pays), une date de création,
						et une relation avec un directeur. Les agences peuvent également être associées à plusieurs
						produits.
					</p>
				</div>

				<div class="mb-4 ml-4">
					<h3 class="mb-2 text-xl font-semibold">Produit</h3>
					<p class="">
						Le modèle <strong>Product</strong> représente les produits disponibles dans une agence. Chaque
						produit a un nom, un stock, un prix, une date de création, et une relation avec une agence.
					</p>
				</div>
			</section>

			<section class="mb-8">
				<h2 class="mb-4 text-2xl font-semibold">2. Relations entre les modèles</h2>
				<p class=" mb-4">
					- Un <strong>Directeur</strong> peut avoir plusieurs <strong>Agences</strong> (relation
					un-à-plusieurs).<br />
					- Une <strong>Agence</strong> peut avoir plusieurs <strong>Produits</strong> (relation
					un-à-plusieurs).<br />
					- Une <strong>Agence</strong> est liée à un seul <strong>Directeur</strong> (relation
					plusieurs-à-un).<br />
					- Un <strong>Produit</strong> est lié à une seule <strong>Agence</strong> (relation plusieurs-à-un).
				</p>
			</section>

			<section class="mb-8">
				<h2 class="mb-4 text-2xl font-semibold">
					3. Visualisation des Stocks et Agences avec ApexCharts
				</h2>
				<p class="">
					Une des fonctionnalités clés du projet inclura l'utilisation d'<strong>ApexCharts</strong>
					pour visualiser les données liées aux stocks de produits dans les différentes agences. Cela
					permettra de générer des graphiques dynamiques montrant, par exemple :
				</p>
				<ul class="ml-4 list-inside list-disc">
					<li>La répartition des stocks de produits par agence.</li>
					<li>L'évolution du stock de produits dans le temps.</li>
				</ul>
				<p class=" mt-4">
					Ces visualisations aideront à comprendre rapidement la distribution des produits et à
					prendre des décisions informées.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="mb-4 text-2xl font-semibold">
					4. API pour requêtes d'adresses avec OpenCage Data
				</h2>
				<p class="">
					Le projet inclura également une API qui permet de récupérer des informations géographiques
					basées sur les adresses des agences. Cette API utilisera le service <strong
						>OpenCage Data</strong
					> pour obtenir des informations comme les coordonnées géographiques, ou d'autres détails géolocalisés.
					Cette fonctionnalité peut être utilisée pour améliorer la précision des données d'adresse,
					ou pour des analyses géographiques avancées des agences.
				</p>
			</section>

			<footer>
				<p class="">
					Le projet met en place une gestion efficace des directeurs, agences, et produits avec des
					relations bien définies et des outils de visualisation et d'intégration de données
					externes puissants. L'usage de Prisma pour MongoDB simplifie le travail avec la base de
					données, tandis que l'intégration de l'API OpenCage Data et ApexCharts enrichit
					l'expérience utilisateur en offrant des fonctionnalités supplémentaires pour l'analyse et
					la visualisation des données.
				</p>
			</footer>

			<div class="flex flex-col items-center p-8">
				<div class="mb-8 rounded-lg border border-gray-300 bg-white p-4 shadow-md">
					<h2 class="mb-4 text-center text-lg font-semibold text-gray-700">Director</h2>
					<ul class="list-inside list-disc text-black">
						<li>id (String)</li>
						<li>name (String)</li>
						<li>email (String)</li>
						<li>age (Int)</li>
						<li>createdAt (DateTime)</li>
						<li>isActive (Boolean)</li>
					</ul>
				</div>

				<div class="mb-8 h-16 w-1 bg-gray-500"></div>

				<div class="flex space-x-8">
					<div class="rounded-lg border border-gray-300 bg-white p-4 shadow-md">
						<h2 class="mb-4 text-center text-lg font-semibold text-gray-700">Agence</h2>
						<ul class="list-inside list-disc text-black">
							<li>id (String)</li>
							<li>street (String)</li>
							<li>city (String)</li>
							<li>state (String)</li>
							<li>zip (String)</li>
							<li>country (String)</li>
							<li>createdAt (DateTime)</li>
							<li>directorId (String)</li>
						</ul>
					</div>

					<div class="flex flex-col items-center">
						<div class="h-1 w-16 bg-gray-500"></div>
						<div class="mt-8 h-16 w-1 bg-gray-500"></div>
					</div>

					<div class="rounded-lg border border-gray-300 bg-white p-4 shadow-md">
						<h2 class="mb-4 text-center text-lg font-semibold text-gray-700">Product</h2>
						<ul class="list-inside list-disc text-black">
							<li>id (String)</li>
							<li>name (String)</li>
							<li>stock (Int)</li>
							<li>price (Float)</li>
							<li>createdAt (DateTime)</li>
							<li>agenceId (String)</li>
						</ul>
					</div>
				</div>
			</div>
		</article>
	</div>
</section>

<style>
	.home {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>

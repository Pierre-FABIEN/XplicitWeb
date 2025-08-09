import { PrismaClient } from '@prisma/client';
import { createCipheriv, randomBytes } from 'crypto';
import { decodeBase64 } from '@oslojs/encoding';
import dotenv from 'dotenv';

export const blog = [
	{
		link: `L-Innovation-en-Boissons-Énergisantes-par-GRG-Groupe-Food&Beverage`,
		author: `Gérant - Lionel Garriga`,
		title: `Découvrez XPLICITDRINK®`,
		date: `24.12.23`,
		subTitle: `L'Innovation en Boissons Énergisantes par GRG Groupe Food&Beverage`,
		content: `
		<p>
			Bienvenue dans l'univers dynamique et innovant de XPLICITDRINK®, la marque révolutionnaire de
			boissons énergisantes, fièrement produite par GRG Groupe Food&Beverage. Chez XPLICITDRINK®,
			nous croyons en une expérience de consommation hors du commun, où chaque gorgée est une
			aventure gustative unique.
		</p>
		<p>
			XPLICITDRINK® se distingue par sa capacité à offrir des boissons énergisantes entièrement
			personnalisables. Nous savons que chaque personne est unique, et c'est pourquoi nos boissons
			le sont aussi. Avec XPLICITDRINK®, vous avez le pouvoir de créer une boisson qui reflète
			votre personnalité, vos goûts et votre style de vie.
		</p>
		<p>
			Notre gamme de produits est conçue pour booster votre énergie avec un goût exquis, tout en
			vous offrant une expérience de personnalisation inégalée. Que vous souhaitiez une touche
			sucrée, acidulée ou même un mélange audacieux de saveurs, XPLICITDRINK® rend cela possible.
		</p>
		<p>
			GRG Groupe Food&Beverage, le créateur derrière XPLICITDRINK®, est un pionnier dans le secteur
			des boissons. Notre engagement est de vous fournir des boissons énergisantes de qualité
			supérieure, avec une attention particulière portée aux détails qui font la différence. La
			passion pour l'innovation et l'excellence est au cœur de notre travail.
		</p>
		<p>
			Rejoignez la révolution XPLICITDRINK® et vivez l'expérience d'une boisson énergisante pas
			comme les autres. C'est plus qu'une boisson, c'est un style de vie, une expression de soi.
			Découvrez comment XPLICITDRINK® et GRG Groupe Food&Beverage redéfinissent le monde des
			boissons énergisantes.
		</p>
		`,
		resume: `Découvrez des articles sur XPLICITDRINK® et l'innovation en boissons énergisantes. Explorez la personnalisation, la saveur unique et les coulisses de GRG Groupe Food&Beverage. Rejoignez-nous pour explorer le futur des boissons énergisantes personnalisables.`,
		hiddenWord: `XPLICITDRINK®, GRG Groupe Food&Beverage, boissons énergisantes personnalisables, innovation en boissons, expérience gustative, personnalisation de boissons, booster d'énergie, expérience de consommation, révolution des boissons énergisantes.`
	},
	{
		link: `Une-Collaboration-Dynamique-sur-les-Pistes`,
		author: `Gérant - Lionel Garriga`,
		title: `France Snowboard Series & XPLICITDRINK®`,
		date: `24.12.23`,
		subTitle: `Une Collaboration Dynamique sur les Pistes`,
		content: `
		<p>
			Les France Snowboard Series inaugurent une nouvelle ère dans l'univers du snowboard ! Cette initiative ambitieuse rassemble les événements nationaux et internationaux de snowboard en France, créant un circuit unique qui va bien au-delà des compétitions classiques. Avec la participation active de riders, crews, fédérations, clubs, l'industrie, les médias et les offices locaux, les France Snowboard Series incarnent l'esprit authentique de la « board culture ».
		</p>

		<p>
			Chaque événement du circuit est une célébration de notre sport, mêlant compétitions passionnantes, musique live, ateliers culturels, activités pédagogiques et festivités diverses. Ouvert à tous, des jeunes talents aux professionnels, les France Snowboard Series sont le terrain de jeu où se façonne la nouvelle génération de snowboarders.
		</p>

		<p>
			En parcourant les Alpes et les Pyrénées, le programme prévisionnel des France Snowboard Series inclut 23 épreuves variées, allant des Coupes d'Europe aux championnats de France, en passant par le World Rookie Tour et des événements dédiés aux jeunes riders.
		</p>

		<p>
			C'est dans ce contexte effervescent que XPLICITDRINK®, la marque innovante de boissons énergisantes, s'associe aux France Snowboard Series pour une collaboration exclusive de co-branding. Cette association marque le lancement d'une canette édition spéciale, inspirée par la recette Wildberry d'XPLICITDRINK®. Cette boisson unique mélange des saveurs intenses de pomme, cassis et myrtille, tout en étant 5 à 7 fois moins sucrée que les autres boissons du marché. Enrichie de 10% de jus de fruit, elle offre une expérience gustative rafraîchissante et énergisante, parfaite pour accompagner l'esprit dynamique et passionné des France Snowboard Series.
		</p>

		<p>
			La canette co-brandée XPLICITDRINK® et France Snowboard Series symbolise le mélange parfait entre sport, culture et plaisir. Elle représente non seulement un soutien pour les athlètes et les fans de snowboard, mais aussi une célébration de l'énergie et de l'esprit communautaire qui définissent à la fois le snowboard et XPLICITDRINK®.
		</p>

		<p>
			Cette collaboration entre XPLICITDRINK® et les France Snowboard Series est une invitation à tous les passionnés de snowboard à vivre des moments inoubliables sur les pistes, tout en savourant une boisson énergisante qui se distingue par son goût unique et son profil moins sucré.
		</p>
		`,
		resume: `Les France Snowboard Series révolutionnent le snowboard en France avec un circuit unique. XPLICITDRINK® présente une canette spéciale Wildberry pour célébrer cette collaboration dynamique. Un mariage parfait entre sport, culture et plaisir.`,
		hiddenWord: `France Snowboard Series, XPLICITDRINK®, collaboration de co-branding, édition spéciale Wildberry, snowboard, culture board, événements de snowboard, boissons énergisantes, saveurs fruitées, expérience gustative, moins de sucre, jus de fruit. `
	},
	{
		link: `Decouvrez-XPLICITDRINK-Innovation-Boissons-Energetiques`,
		author: `Gérant - Lionel Garriga`,
		title: `Découvrez XPLICITDRINK® - L'Innovation en Boissons Énergisantes par GRG Groupe Food&Beverage`,
		date: `11.01.2024`,
		subTitle: `L'Innovation en Boissons Énergisantes par GRG Groupe Food&Beverage`,
		content: `
        <p>Bienvenue dans l'univers dynamique et innovant de XPLICITDRINK®, la marque révolutionnaire de boissons énergisantes, fièrement produite par GRG Groupe Food&Beverage. Chez XPLICITDRINK®, nous croyons en une expérience de consommation hors du commun, où chaque gorgée est une aventure gustative unique.</p>
        <p>XPLICITDRINK® se distingue par sa capacité à offrir des boissons énergisantes entièrement personnalisables. Nous savons que chaque personne est unique, et c'est pourquoi nos boissons le sont aussi. Avec XPLICITDRINK®, vous avez le pouvoir de créer une boisson qui reflète votre personnalité, vos goûts et votre style de vie.</p>
        <p>Notre gamme de produits est conçue pour booster votre énergie avec un goût exquis, tout en vous offrant une expérience de personnalisation inégalée. Que vous souhaitiez une touche sucrée, acidulée ou même un mélange audacieux de saveurs, XPLICITDRINK® rend cela possible.</p>
        <p>GRG Groupe Food&Beverage, le créateur derrière XPLICITDRINK®, est un pionnier dans le secteur des boissons. Notre engagement est de vous fournir des boissons énergisantes de qualité supérieure, avec une attention particulière portée aux détails qui font la différence. La passion pour l'innovation et l'excellence est au cœur de notre travail.</p>
        <p>Rejoignez la révolution XPLICITDRINK® et vivez l'expérience d'une boisson énergisante pas comme les autres. C'est plus qu'une boisson, c'est un style de vie, une expression de soi. Découvrez comment XPLICITDRINK® et GRG Groupe Food&Beverage redéfinissent le monde des boissons énergisantes.</p>
    `,
		resume: `Découvrez XPLICITDRINK® et l'innovation en boissons énergisantes. Explorez la personnalisation, la saveur unique et les coulisses de GRG Groupe Food&Beverage.`,
		hiddenWord: `XPLICITDRINK®, GRG Groupe Food&Beverage, boissons énergisantes personnalisables, innovation en boissons, expérience gustative, personnalisation de boissons, booster d'énergie, expérience de consommation, révolution des boissons énergisantes.`
	},
	{
		link: `France-Snowboard-Series-XPLICITDRINK-Collaboration`,
		author: `Gérant - Lionel Garriga`,
		title: `France Snowboard Series & XPLICITDRINK® : Une Collaboration Dynamique sur les Pistes`,
		date: `11.01.2024`,
		subTitle: `Une Collaboration Dynamique sur les Pistes`,
		content: `
        <p>Les France Snowboard Series inaugurent une nouvelle ère dans l'univers du snowboard ! Cette initiative ambitieuse rassemble les événements nationaux et internationaux de snowboard en France, créant un circuit unique qui va bien au-delà des compétitions classiques. Avec la participation active de riders, crews, fédérations, clubs, l'industrie, les médias et les offices locaux, les France Snowboard Series incarnent l'esprit authentique de la « board culture ».</p>
        <p>Chaque événement du circuit est une célébration de notre sport, mêlant compétitions passionnantes, musique live, ateliers culturels, activités pédagogiques et festivités diverses. Ouvert à tous, des jeunes talents aux professionnels, les France Snowboard Series sont le terrain de jeu où se façonne la nouvelle génération de snowboarders.</p>
        <p>En parcourant les Alpes et les Pyrénées, le programme prévisionnel des France Snowboard Series inclut 23 épreuves variées, allant des Coupes d'Europe aux championnats de France, en passant par le World Rookie Tour et des événements dédiés aux jeunes riders.</p>
        <p>C'est dans ce contexte effervescent que XPLICITDRINK®, la marque innovante de boissons énergisantes, s'associe aux France Snowboard Series pour une collaboration exclusive de co-branding. Cette association marque le lancement d'une canette édition spéciale, inspirée par la recette Wildberry d'XPLICITDRINK®. Cette boisson unique mélange des saveurs intenses de pomme, cassis et myrtille, tout en étant 5 à 7 fois moins sucrée que les autres boissons du marché. Enrichie de 10% de jus de fruit, elle offre une expérience gustative rafraîchissante et énergisante, parfaite pour accompagner l'esprit dynamique et passionné des France Snowboard Series.</p>
        <p>La canette co-brandée XPLICITDRINK® et France Snowboard Series symbolise le mélange parfait entre sport, culture et plaisir. Elle représente non seulement un soutien pour les athlètes et les fans de snowboard, mais aussi une célébration de l'énergie et de l'esprit communautaire qui définissent à la fois le snowboard et XPLICITDRINK®.</p>
        <p>Cette collaboration entre XPLICITDRINK® et les France Snowboard Series est une invitation à tous les passionnés de snowboard à vivre des moments inoubliables sur les pistes, tout en savourant une boisson énergisante qui se distingue par son goût unique et son profil moins sucré.</p>
    `,
		resume: `Les France Snowboard Series révolutionnent le snowboard en France avec un circuit unique. XPLICITDRINK® présente une canette spéciale Wildberry pour célébrer cette collaboration dynamique.`,
		hiddenWord: `France Snowboard Series, XPLICITDRINK®, collaboration de co-branding, édition spéciale Wildberry, snowboard, culture board, événements de snowboard, boissons énergisantes, saveurs fruitées, expérience gustative, moins de sucre, jus de fruit.`
	},
	{
		link: `XplicitDrink-Collaboration-avec-Metal-Boxe`,
		author: `Gérant - Lionel Garriga`,
		title: `XplicitDrink & Metal Boxe : Une Collaboration Frappante dans le Monde des Sports de Combat`,
		date: `11.01.2024`,
		subTitle: `Une fusion entre sport et énergie`,
		content: `
        <p>XplicitDrink est fier d'annoncer sa collaboration avec Metal Boxe, une marque de renom en Europe dans le monde des sports de combat, grâce à notre ambassadeur, le talentueux combattant MMA Kevin Simon Cesari (voir palmarès en pied d’article).</p>
        <p>Cette collaboration unique a donné lieu à une édition spéciale de boissons énergisantes personnalisées, s'inspirant de l'iconique sac de frappe rouge et noir de Metal Boxe. C'est une fusion parfaite entre les valeurs sportives de Metal Boxe et l'innovation et la personnalisation caractéristiques d'XplicitDrink. Cette initiative est une célébration de la force, de la détermination et de la passion, visant à inspirer les athlètes et amateurs de sports de combat.</p>
        <h3>Kevin Simon Cesari, Sportif de haut niveau :</h3>
        <ul>
            <li>1er au Karate World Open</li>
            <li>3ème au Karate World Open</li>
            <li>3ème au Paris Open International</li>
            <li>1er au Championnat de France de Karaté Combat</li>
            <li>5 fois 1er en national (championnat et coupe) en full contact</li>
            <li>6 fois 1er en national en jutsu fighting</li>
            <li>Combattant professionnel en MMA international, participant à des événements tels que YFC, European Beatdown, Hexagone MMA, CAGE WARRIORS</li>
        </ul>
    `,
		resume: `XplicitDrink s'associe à Metal Boxe pour une édition spéciale de boissons énergisantes, symbolisant la force et la détermination dans les sports de combat.`,
		hiddenWord: `XplicitDrink, Metal Boxe, sports de combat, boissons énergisantes personnalisées, Kevin Simon Cesari, MMA, Karate, full contact, jutsu fighting, édition spéciale, collaboration.`
	},
	{
		link: `Découvrez-la-Tendance-de-la-Marque-Blanche-et-des-Recettes-Personnalisées`,
		author: `Gérant - Lionel Garriga`,
		title: `La Révolution des Boissons Énergisantes : Découvrez la Tendance de la Marque Blanche et des Recettes Personnalisées`,
		date: `16.01.2024`,
		subTitle: `Introduction : ans un monde où l'énergie est une monnaie précieuse, les boissons énergisantes personnalisées se sont imposées comme une tendance incontournable. Aujourd'hui, nous explorons comment la marque blanche révolutionne ce secteur en offrant des recettes uniques et personnalisables.`,
		content: `
			<p> <b>1. La montée en puissance de la marque blanche dans les boissons énergisantes : </b>La marque blanche est un concept où les entreprises produisent des boissons que d'autres marques vendent sous leur propre nom. Ce phénomène permet une diversité incroyable dans les saveurs et les formulations, répondant ainsi aux goûts spécifiques de chaque consommateur.</p>
			<p> <b>2. Wildberry : </b>Un cocktail de baies pour une explosion d'énergie : </b>Imaginez un mélange rafraîchissant de baies sauvages, de pommes, de cassis et de myrtilles. La recette "Wildberry" offre une expérience gustative unique, combinant douceur et notes acidulées, parfait pour ceux qui cherchent un coup de fouet naturel et fruité.</p>
			<p> <b>3. Original : </b>Le classique revisité avec une touche de caramel : </b>La recette "Original" prend le meilleur des boissons énergisantes classiques et y ajoute une touche spéciale - le même caramel utilisé dans les célèbres sodas comme Coca-Cola. Cette fusion crée une expérience nostalgique, mais avec une énergie nouvelle et revitalisante.</p>
			<p> <b>4. Yuzu Fruit du Dragon : </b>Une aventure asiatique en bouteille : </b>Fusionnant le pitaya exotique (ou fruit du dragon) avec le yuzu, un citron asiatique, cette recette "Yuzu Fruit du Dragon" est un voyage pour les papilles. Elle offre une saveur distincte et exotique, parfaite pour ceux qui désirent explorer de nouveaux horizons gustatifs.</p>
			<p> <b>5. Menthe Citron : </b>La fraîcheur d'un Mojito sans alcool : </b>Inspirée du célèbre cocktail Mojito, la recette "Menthe Citron" est une alternative sans alcool rafraîchissante. Elle combine la vivacité de la menthe avec l'acidité du citron, offrant une boisson idéale pour se rafraîchir tout en bénéficiant d'un boost d'énergie.</p>
			<p> <b>Conclusion : </b>La marque blanche et la personnalisation dans le monde des boissons énergisantes ouvrent un univers de possibilités. Que vous soyez un amateur de saveurs classiques ou un explorateur de goûts exotiques, il y a toujours une recette personnalisée qui vous attend. Découvrez ces merveilles gustatives et réinventez votre façon de vous dynamiser!</p>
    `,
		resume: `La marque blanche et la personnalisation dans le monde des boissons énergisantes ouvrent un univers de possibilités. Que vous soyez un amateur de saveurs classiques ou un explorateur de goûts exotiques, il y a toujours une recette personnalisée qui vous attend. Découvrez ces merveilles gustatives et réinventez votre façon de vous dynamiser!`,
		hiddenWord: `XplicitDrink, Metal Boxe, sports de combat, boissons énergisantes personnalisées, Kevin Simon Cesari, MMA, Karate, full contact, jutsu fighting, édition spéciale, collaboration.`
	}
];


dotenv.config();

if (!process.env.ENCRYPTION_KEY) {
	throw new Error('ENCRYPTION_KEY is not defined in the environment variables.');
}

const key = decodeBase64(process.env.ENCRYPTION_KEY);
const prisma = new PrismaClient();

// Fonction de chiffrement
const encrypt = (data) => {
	const iv = randomBytes(16); // IV aléatoire
	const cipher = createCipheriv('aes-128-gcm', key, iv);
	const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, ciphertext, tag]);
};

// Fonction pour générer un code de récupération à 8 chiffres
const generateRecoveryCode = () => {
	return Math.floor(10000000 + Math.random() * 90000000).toString();
};

async function main() {
	// console.log('Début du nettoyage et du peuplement de la base de données...');

	try {
		// Démarrage d'une transaction pour supprimer toutes les données
		await prisma.$transaction([
			// Supprimer les relations dépendantes
			prisma.blogPostTag.deleteMany(),
			prisma.blogComment.deleteMany(),
			prisma.blogPost.deleteMany(),
			prisma.blogCategory.deleteMany(),
			prisma.blogAuthor.deleteMany(),
			prisma.blogTag.deleteMany(),
			prisma.custom.deleteMany(), // Supprimer les personnalisations avant les OrderItem
			prisma.orderStatusHistory.deleteMany(),
			prisma.orderItem.deleteMany(),
			prisma.order.deleteMany(),
			prisma.address.deleteMany(),
			prisma.transaction.deleteMany(),
			prisma.productCategory.deleteMany(),
			prisma.product.deleteMany(),
			prisma.category.deleteMany(),
			prisma.session.deleteMany(),
			prisma.emailVerificationRequest.deleteMany(),
			prisma.passwordResetSession.deleteMany(),
			prisma.user.deleteMany()
		]);

		// console.log('Toutes les données existantes ont été supprimées.');

		// Génération d'une clé TOTP aléatoire et chiffrement
		const totpKey = randomBytes(32);
		const encryptedTotpKey = encrypt(totpKey);

		// Convertir en Buffer pour Prisma
		const totpKeyBuffer = Buffer.from(encryptedTotpKey);

		const recoveryCode = generateRecoveryCode();
		const encryptedRecoveryCode = encrypt(Buffer.from(recoveryCode, 'utf-8')).toString('base64');

		// console.log('Recovery Code (clair) :', recoveryCode);

		// Hash statique pour l'administrateur
		const passwordHash =
			'$argon2id$v=19$m=19456,t=2,p=1$2h/u9dvpXqr5PiPa19tlBA$ZUYyS8+NjOxTodAaDO1ez5oVToWRfKCQWRabAe8sIgk';

		// Création de l'utilisateur administrateur
		const adminUser = await prisma.user.create({
			data: {
				email: 'xplicitdrink.dev@gmail.com',
				username: 'Admin',
				passwordHash: passwordHash,
				emailVerified: true,
				role: 'ADMIN',
				name: 'Admin User',
				totpKey: totpKeyBuffer,
				recoveryCode: encryptedRecoveryCode,
				googleId: null,
				isMfaEnabled: false
			}
		});

		// console.log('Utilisateur administrateur créé :', adminUser);

		// console.log('Nettoyage complet. Toutes les données existantes ont été supprimées.');

		// Création des catégories
		const categories = await prisma.category.createMany({
			data: [
				{ name: 'Beverages', createdAt: new Date(), updatedAt: new Date() },
				{ name: 'Snacks', createdAt: new Date(), updatedAt: new Date() },
				{ name: 'Desserts', createdAt: new Date(), updatedAt: new Date() }
			]
		});

		// console.log(`${categories.count} catégories créées.`);

		// Récupération des catégories pour assignation aux produits
		const beverageCategory = await prisma.category.findFirst({ where: { name: 'Beverages' } });
		const snackCategory = await prisma.category.findFirst({ where: { name: 'Snacks' } });

		const products = [
			{
				_id: '676476b4f216ed08d1b0c692',
				name: 'Original',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 0.9166666666666667,
				stock: 100000,
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1751910825/Xplicitdrink_Original_-_2026-min_hnctpa.png'],
				slug: 'original',
				colorProduct: '#844c6d',
				createdAt: '2024-12-19T19:40:36.809+00:00',
				updatedAt: '2024-12-19T19:40:36.809+00:00',
				categories: beverageCategory?.id
			},
			{
				_id: '676476cdf216ed08d1b0c694',
				name: 'Dragon',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 0.9166666666666667,
				stock: 100000,
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1751910825/Xplicitdrink_-_Dragon_-_2026-min_bweo6l.png'],
				slug: 'dragon',
				colorProduct: '#ec008c',
				createdAt: '2024-12-19T19:41:01.519+00:00',
				updatedAt: '2024-12-19T19:41:01.519+00:00',
				categories: snackCategory?.id
			},
			{
				_id: '676476f6f216ed08d1b0c696',
				name: 'Fresh',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 0.9166666666666667,
				stock: 100000,
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1751910825/Xplicitdrink_-_Fresh_-_2026-min_ika4zh.png'],
				slug: 'fresh',
				colorProduct: '#74c92b',
				createdAt: '2024-12-19T19:41:42.780+00:00',
				updatedAt: '2024-12-19T19:41:42.780+00:00',
				categories: beverageCategory?.id
			},
			{
				_id: '6764770cf216ed08d1b0c698',
				name: 'Pulsar',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 0.9166666666666667,
				stock: 100000,
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1751910825/Xplicitdrink_-_Pulsar_-_2026-min_ej2tcu.png'],
				slug: 'pulsar',
				colorProduct: '#f68712',
				createdAt: '2024-12-19T19:42:04.914+00:00',
				updatedAt: '2024-12-19T19:42:04.914+00:00',
				categories: snackCategory?.id
			},
			{
				_id: '6764770cf216ed08d1b0c698',
				name: 'Wild',
				description:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
				price: 0.9166666666666667,
				stock: 100000,
				images: ['https://res.cloudinary.com/dedmxt8ta/image/upload/v1751911954/Xplicitdrink_-_Wild_-_2026-min_tzibxu.png'],
				slug: 'wild',
				colorProduct: '#00adef',
				createdAt: '2024-12-19T19:42:04.914+00:00',
				updatedAt: '2024-12-19T19:42:04.914+00:00',
				categories: snackCategory?.id
			}
		];

		for (const product of products) {
			const createdProduct = await prisma.product.create({
				data: {
					name: product.name,
					description: product.description,
					price: product.price,
					stock: product.stock,
					images: product.images,
					slug: product.slug,
					colorProduct: product.colorProduct,
					categories: {
						create: {
							categoryId: product.categories || beverageCategory?.id
						}
					},
					createdAt: new Date(),
					updatedAt: new Date()
				}
			});
			// console.log(`Produit créé : ${createdProduct.name}`);
		}
		// console.log('Produits fictifs créés avec succès.');

		// Création d'auteurs
		let author = await prisma.blogAuthor.findUnique({
			where: { id: adminUser.id }
		});

		if (!author) {
			author = await prisma.blogAuthor.create({
				data: {
					id: adminUser.id,
					name: adminUser.name
				}
			});
		}

		// console.log('Auteur créé:', author);

		// Création d'une catégorie de blog pour les articles XPLICITDRINK
		const xplicitCategory = await prisma.blogCategory.create({
			data: {
				name: 'XPLICITDRINK',
				description: 'Articles sur XPLICITDRINK et les boissons énergisantes.'
			}
		});

		// console.log('Catégorie créée:', xplicitCategory);

		// Insertion des articles de blog depuis le fichier blog.ts
		// console.log('Insertion des articles de blog depuis blog.ts...');
		
		for (const article of blog) {
			const createdPost = await prisma.blogPost.create({
				data: {
					title: article.title,
					content: article.content,
					slug: article.link,
					published: true,
					author: {
						connect: { id: adminUser.id }
					},
					category: {
						connect: { id: xplicitCategory.id }
					},
					createdAt: new Date(),
					updatedAt: new Date()
				}
			});
			
			// console.log(`Article créé : ${createdPost.title}`);
		}
		
		// console.log(`${blog.length} articles de blog insérés avec succès.`);

	} catch (error) {
		console.error('Erreur lors du nettoyage et du peuplement :', error);
	} finally {
		await prisma.$disconnect();
	}
}

main();

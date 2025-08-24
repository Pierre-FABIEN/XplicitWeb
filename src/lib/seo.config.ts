// Configuration SEO pour XPLICITDRINK®
export const seoConfig = {
	// Informations de base du site
	site: {
		name: 'XPLICITDRINK®',
		url: 'https://xplicitdrink.com',
		description: 'XPLICITDRINK® - Boissons énergisantes premium nées à Toulouse en 2007. Recettes gourmandes avec plus de jus, moins de sucre et des ingrédients de qualité.',
		keywords: 'boisson énergisante, taurine, caféine, vitamines, Toulouse, premium, gourmand, moins de sucre, XPLICITDRINK',
		author: 'XPLICITDRINK®',
		locale: 'fr_FR'
	},
	
	// Métadonnées par défaut
	defaults: {
		title: 'XPLICITDRINK® - Boissons énergisantes premium depuis 2007',
		description: 'Découvrez XPLICITDRINK®, marque de boissons énergisantes premium née à Toulouse en 2007. Recettes gourmandes avec plus de jus, moins de sucre et des ingrédients de qualité.',
		keywords: 'boisson énergisante, taurine, caféine, vitamines, Toulouse, premium, gourmand, moins de sucre, XPLICITDRINK',
		image: '/og-default.jpg',
		type: 'website'
	},
	
	// Configuration des pages principales
	pages: {
		home: {
			title: 'XPLICITDRINK® - Boissons énergisantes premium depuis 2007',
			description: 'Découvrez XPLICITDRINK®, marque de boissons énergisantes premium née à Toulouse en 2007. Recettes gourmandes avec plus de jus, moins de sucre et des ingrédients de qualité.',
			keywords: 'boisson énergisante, taurine, caféine, vitamines, Toulouse, premium, gourmand, moins de sucre, XPLICITDRINK, 2007',
			image: '/og-home.jpg'
		},
		blog: {
			title: 'Blog - Actualités et conseils sur les boissons énergisantes',
			description: 'Restez informé sur les dernières tendances des boissons énergisantes, conseils nutritionnels et actualités XPLICITDRINK®. Découvrez nos recettes premium.',
			keywords: 'blog boisson énergisante, conseils nutrition, tendances énergisants, actualités XPLICITDRINK, recettes premium',
			image: '/og-blog.jpg'
		},
		catalogue: {
			title: 'Catalogue - Nos boissons énergisantes premium',
			description: 'Explorez notre gamme de boissons énergisantes premium XPLICITDRINK®. Des recettes gourmandes avec plus de jus, moins de sucre et des ingrédients de qualité.',
			keywords: 'catalogue boissons énergisantes, gamme premium, recettes gourmandes, taurine, caféine, vitamines',
			image: '/og-catalogue.jpg'
		},
		atelier: {
			title: 'Atelier - Personnalisez votre boisson XPLICITDRINK®',
			description: 'Créez votre design personnalisé pour vos boissons XPLICITDRINK®. Interface intuitive pour personnaliser vos canettes et créer des designs uniques.',
			keywords: 'atelier personnalisation, design canette, boisson personnalisée, XPLICITDRINK, création design',
			image: '/og-atelier.jpg'
		},
		contact: {
			title: 'Contact - Parlons de votre projet XPLICITDRINK®',
			description: 'Contactez l\'équipe XPLICITDRINK® pour discuter de vos projets de boissons énergisantes, personnalisation ou partenariats. Basés à Toulouse depuis 2007.',
			keywords: 'contact XPLICITDRINK, projet boisson énergisante, partenariat, Toulouse, équipe',
			image: '/og-contact.jpg'
		},
		checkout: {
			title: 'Commande - Finalisez votre commande XPLICITDRINK®',
			description: 'Finalisez votre commande de boissons énergisantes XPLICITDRINK®. Paiement sécurisé et options de livraison disponibles.',
			keywords: 'commande XPLICITDRINK, paiement sécurisé, livraison, boissons énergisantes, finalisation',
			image: '/og-checkout.jpg'
		},
		checkoutSuccess: {
			title: 'Commande confirmée - XPLICITDRINK®',
			description: 'Votre commande XPLICITDRINK® a été confirmée avec succès. Merci pour votre confiance.',
			keywords: 'commande confirmée, succès, XPLICITDRINK, confirmation commande',
			image: '/og-checkout-success.jpg'
		},
		error: {
			title: 'Page non trouvée - XPLICITDRINK®',
			description: 'La page que vous recherchez n\'existe pas. Retournez à l\'accueil pour découvrir nos boissons énergisantes premium.',
			keywords: 'page non trouvée, erreur 404, XPLICITDRINK, boissons énergisantes',
			image: '/og-error.jpg'
		},
		auth: {
			title: 'Authentification - XPLICITDRINK®',
			description: 'Connectez-vous à votre compte XPLICITDRINK® pour accéder à vos commandes et personnalisations.',
			keywords: 'connexion, authentification, compte, XPLICITDRINK, profil utilisateur',
			image: '/og-auth.jpg'
		},
		admin: {
			title: 'Administration - XPLICITDRINK®',
			description: 'Panneau d\'administration XPLICITDRINK®. Gérez vos produits, commandes et utilisateurs.',
			keywords: 'administration, gestion, produits, commandes, utilisateurs, XPLICITDRINK',
			image: '/og-admin.jpg'
		}
	},
	
	// Configuration des réseaux sociaux
	social: {
		twitter: {
			site: '@xplicitdrink',
			creator: '@xplicitdrink'
		},
		facebook: {
			appId: 'votre-app-id-facebook'
		}
	},
	
	// Configuration des images Open Graph
	images: {
		default: '/og-default.jpg',
		home: '/og-home.jpg',
		blog: '/og-blog.jpg',
		catalogue: '/og-catalogue.jpg',
		atelier: '/og-atelier.jpg',
		contact: '/og-contact.jpg',
		article: '/og-article.jpg'
	}
};

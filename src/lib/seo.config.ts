// Configuration SEO pour CustomYourCan®
export const seoConfig = {
	// Informations de base du site
	site: {
		name: 'CustomYourCan®',
		url: 'https://customyourcan.com',
		description: 'CustomYourCan® - Boissons énergisantes premium nées à Toulouse en 2007. Recettes gourmandes avec plus de jus, moins de sucre et des ingrédients de qualité.',
		keywords: 'boisson énergisante, taurine, caféine, vitamines, Toulouse, premium, gourmand, moins de sucre, CustomYourCan',
		author: 'CustomYourCan®',
		locale: 'fr_FR'
	},
	
	// Métadonnées par défaut
	defaults: {
		title: 'CustomYourCan® - Boissons énergisantes premium depuis 2007',
		description: 'Découvrez CustomYourCan®, marque de boissons énergisantes premium née à Toulouse en 2007. Recettes gourmandes avec plus de jus, moins de sucre et des ingrédients de qualité.',
		keywords: 'boisson énergisante, taurine, caféine, vitamines, Toulouse, premium, gourmand, moins de sucre, CustomYourCan',
		image: '/og-default.jpg',
		type: 'website'
	},
	
	// Configuration des pages principales
	pages: {
		home: {
			title: 'CustomYourCan® - Boissons énergisantes premium depuis 2007',
			description: 'Découvrez CustomYourCan®, marque de boissons énergisantes premium née à Toulouse en 2007. Recettes gourmandes avec plus de jus, moins de sucre et des ingrédients de qualité.',
			keywords: 'boisson énergisante, taurine, caféine, vitamines, Toulouse, premium, gourmand, moins de sucre, CustomYourCan, 2007',
			image: '/og-home.jpg'
		},
		blog: {
			title: 'Blog - Actualités et conseils sur les boissons énergisantes',
			description: 'Restez informé sur les dernières tendances des boissons énergisantes, conseils nutritionnels et actualités CustomYourCan®. Découvrez nos recettes premium.',
			keywords: 'blog boisson énergisante, conseils nutrition, tendances énergisants, actualités CustomYourCan, recettes premium',
			image: '/og-blog.jpg'
		},
		catalogue: {
			title: 'Catalogue - Nos boissons énergisantes premium',
			description: 'Explorez notre gamme de boissons énergisantes premium CustomYourCan®. Des recettes gourmandes avec plus de jus, moins de sucre et des ingrédients de qualité.',
			keywords: 'catalogue boissons énergisantes, gamme premium, recettes gourmandes, taurine, caféine, vitamines',
			image: '/og-catalogue.jpg'
		},
		atelier: {
			title: 'Atelier - Personnalisez votre boisson CustomYourCan®',
			description: 'Créez votre design personnalisé pour vos boissons CustomYourCan®. Interface intuitive pour personnaliser vos canettes et créer des designs uniques.',
			keywords: 'atelier personnalisation, design canette, boisson personnalisée, CustomYourCan, création design',
			image: '/og-atelier.jpg'
		},
		contact: {
			title: 'Contact - Parlons de votre projet CustomYourCan®',
			description: 'Contactez l\'équipe CustomYourCan® pour discuter de vos projets de boissons énergisantes, personnalisation ou partenariats. Basés à Toulouse depuis 2007.',
			keywords: 'contact CustomYourCan, projet boisson énergisante, partenariat, Toulouse, équipe',
			image: '/og-contact.jpg'
		},
		checkout: {
			title: 'Commande - Finalisez votre commande CustomYourCan®',
			description: 'Finalisez votre commande de boissons énergisantes CustomYourCan®. Paiement sécurisé et options de livraison disponibles.',
			keywords: 'commande CustomYourCan, paiement sécurisé, livraison, boissons énergisantes, finalisation',
			image: '/og-checkout.jpg'
		},
		checkoutSuccess: {
			title: 'Commande confirmée - CustomYourCan®',
			description: 'Votre commande CustomYourCan® a été confirmée avec succès. Merci pour votre confiance.',
			keywords: 'commande confirmée, succès, CustomYourCan, confirmation commande',
			image: '/og-checkout-success.jpg'
		},
		error: {
			title: 'Page non trouvée - CustomYourCan®',
			description: 'La page que vous recherchez n\'existe pas. Retournez à l\'accueil pour découvrir nos boissons énergisantes premium.',
			keywords: 'page non trouvée, erreur 404, CustomYourCan, boissons énergisantes',
			image: '/og-error.jpg'
		},
		auth: {
			title: 'Authentification - CustomYourCan®',
			description: 'Connectez-vous à votre compte CustomYourCan® pour accéder à vos commandes et personnalisations.',
			keywords: 'connexion, authentification, compte, CustomYourCan, profil utilisateur',
			image: '/og-auth.jpg'
		},
		admin: {
			title: 'Administration - CustomYourCan®',
			description: 'Panneau d\'administration CustomYourCan®. Gérez vos produits, commandes et utilisateurs.',
			keywords: 'administration, gestion, produits, commandes, utilisateurs, CustomYourCan',
			image: '/og-admin.jpg'
		}
	},
	
	// Configuration des réseaux sociaux
	social: {
		twitter: {
			site: '@customyourcan',
			creator: '@customyourcan'
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

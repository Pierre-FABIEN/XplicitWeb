# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

A installer:
test playwright sur les auth
mettre une option pour la f2a
Rendre la doc sur le read me
Rendre la doc pour render
optimiser la doc pour socket 'exemple pour auth'
optimiser la doc pour threlte 'exemple de fonction'
optimiser la doc pour Stripe avec les Hooks
Ajouter le multilang


Ne peut être :
multiLang



Cartes de test Stripe
Paiements réussis
Carte de crédit classique :
Numéro de carte : 4242 4242 4242 4242
Date d'expiration : N'importe quelle date future (par exemple, 12/34)
CVC : N'importe quel nombre à 3 chiffres (par exemple, 123)
Paiements échoués
Carte de crédit déclinée :
Numéro de carte : 4000 0000 0000 9995
Date d'expiration : N'importe quelle date future
CVC : N'importe quel nombre à 3 chiffres
Adresses et autres informations
Vous pouvez entrer n'importe quelle adresse et information personnelle, car ces données ne sont pas vérifiées en mode test.

Étapes à suivre
Entrez les informations de test sur la page de paiement :

Utilisez une des cartes de test fournies ci-dessus.
Finalisez le paiement :

Cliquez sur le bouton pour soumettre le paiement.
Exemple de cartes de test supplémentaires
Carte avec authentication 3D Secure :

Numéro de carte : 4000 0027 6000 3184
Date d'expiration : N'importe quelle date future
CVC : N'importe quel nombre à 3 chiffres
Carte avec échec de 3D Secure :

Numéro de carte : 4000 0027 6000 3246
Date d'expiration : N'importe quelle date future
CVC : N'importe quel nombre à 3 chiffres

stripe listen --forward-to localhost:1000/api/webhooks


Réaliser les stat sur la consultation
Performances sur le server pour cache
commencer le blog et TinyMCE
Mettre en place Lucia
Mettre en place Nodemailer


revoir la sécurité sur les données

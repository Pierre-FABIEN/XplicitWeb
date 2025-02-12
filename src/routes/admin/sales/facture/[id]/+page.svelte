<script lang="ts">
	import { goto } from '$app/navigation';
	import jsPDF from 'jspdf';
	import autoTable from 'jspdf-autotable';

	// Props reçus du `+page.server.ts`
	let { data } = $props();

	// Vérifier si la transaction est bien récupérée
	if (!data.transaction) {
		throw new Error('Transaction not found');
	}

	// Génération du PDF
	function generateInvoicePDF() {
		const transaction = data.transaction;
		const doc = new jsPDF();

		// Titre de la facture
		doc.setFontSize(16);
		doc.text('FACTURE', 14, 20);

		// Informations de la facture
		doc.setFontSize(12);
		doc.text(`Numéro de Facture: ${transaction.id}`, 14, 30);
		doc.text(`Date: ${new Date(transaction.createdAt).toLocaleString()}`, 14, 40);
		doc.text(`Montant Total: ${transaction.amount} ${transaction.currency.toUpperCase()}`, 14, 50);

		// Adresse de facturation (pas d'e-mail)
		doc.setFontSize(14);
		doc.text('Adresse de Facturation:', 14, 70);
		doc.setFontSize(12);
		doc.text(`${transaction.customer_details_name}`, 14, 80);
		doc.text(
			`${transaction.app_user_street}, ${transaction.app_user_zip} ${transaction.app_user_city}`,
			14,
			90
		);
		doc.text(`${transaction.app_user_state}, ${transaction.app_user_country}`, 14, 100);

		// Produits achetés
		doc.setFontSize(14);
		doc.text('Détail des Produits:', 14, 120);

		// Ajout du tableau des produits
		const products = transaction.products.map((product) => [
			product.name,
			`${product.price} €`,
			product.quantity,
			`${(product.price * product.quantity).toFixed(2)} €`
		]);

		autoTable(doc, {
			startY: 130,
			head: [['Produit', 'Prix Unitaire', 'Quantité', 'Total']],
			body: products
		});

		// Montant total en bas du document
		doc.setFontSize(14);
		doc.text(
			`Total: ${transaction.amount} ${transaction.currency.toUpperCase()}`,
			14,
			doc.autoTable.previous.finalY + 10
		);

		// Sauvegarde du PDF
		doc.save(`Facture_${transaction.id}.pdf`);
	}

	$effect(() => {
		setTimeout(generateInvoicePDF, 10);
		goto('/admin/sales/');
	});
</script>

<h1 class="text-2xl font-bold m-5">Préparation de la facture</h1>

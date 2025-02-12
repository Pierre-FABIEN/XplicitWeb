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
	function generatePDF() {
		const transaction = data.transaction;
		const doc = new jsPDF();

		// Titre
		doc.setFontSize(16);
		doc.text("BORDEREAU D'EXPÉDITION", 14, 20);

		// Informations générales
		doc.setFontSize(12);
		doc.text(`ID Transaction: ${transaction.id}`, 14, 30);
		doc.text(`Montant: ${transaction.amount} ${transaction.currency.toUpperCase()}`, 14, 40);
		doc.text(`Date de création: ${new Date(transaction.createdAt).toLocaleString()}`, 14, 50);

		// Destinataire (sans e-mail)
		doc.setFontSize(14);
		doc.text('Adresse de livraison:', 14, 70);
		doc.setFontSize(12);
		doc.text(`${transaction.customer_details_name}`, 14, 80);
		doc.text(
			`${transaction.app_user_street}, ${transaction.app_user_zip} ${transaction.app_user_city}`,
			14,
			90
		);
		doc.text(`${transaction.app_user_state}, ${transaction.app_user_country}`, 14, 100);

		// Produits
		doc.setFontSize(14);
		doc.text('Produits:', 14, 120);

		// Ajouter un tableau des produits
		const products = transaction.products.map((product) => [product.name, product.quantity]);

		autoTable(doc, {
			startY: 130,
			head: [['Produit', 'Quantité']],
			body: products
		});

		// Sauvegarde du PDF
		doc.save(`Bordereau_${transaction.id}.pdf`);
	}

	$effect(() => {
		setTimeout(generatePDF, 10);
		goto('/admin/sales/');
	});
</script>

<h1 class="text-2xl font-bold m-5">Préparation du Bordereau d'Expédition</h1>

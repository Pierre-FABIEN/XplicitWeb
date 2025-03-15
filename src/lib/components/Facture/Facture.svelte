<script lang="ts">
	import { goto } from '$app/navigation';
	import jsPDF from 'jspdf';
	import autoTable from 'jspdf-autotable';

	// Props reçus du `+page.server.ts`
	let { data } = $props();

	// Vérifier si la transaction est bien récupérée
	if (!data?.transaction) {
		throw new Error('Transaction not found');
	}

	// Charger l'image locale en Base64
	async function getBase64Image(url: string): Promise<string> {
		const response = await fetch(url);
		const blob = await response.blob();
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.readAsDataURL(blob);
		});
	}

	// Génération du PDF
	async function generateInvoicePDF() {
		const transaction = data.transaction;
		const doc = new jsPDF();

		// Charger le logo
		const logoBase64 = await getBase64Image('/Logo-xplicit.png'); // Utilisation du chemin dans `static/`

		// ------------------------------
		// 📌 Définition des valeurs
		// ------------------------------
		const companyName = 'Xplicit Web';
		const companyAddress = '123 Rue des Affaires';
		const companyCity = '75000 Paris, France';
		const companyPhone = '+33 1 23 45 67 89';
		const companyEmail = 'contact@xplicitweb.com';
		const companyVAT = 'FR123456789';

		const customerName = transaction.customer_details_name || 'N/A';
		const customerEmail = transaction.customer_details_email || 'N/A';
		const customerPhone = transaction.address_phone || 'N/A';
		const address = `${transaction.address_street_number || ''} ${transaction.address_street || ''}`;
		const zipCity = `${transaction.address_zip || ''} ${transaction.address_city || ''}`;
		const country = transaction.address_country || 'N/A';
		const state = transaction.address_state || 'N/A';
		const stateCode = transaction.address_state_code || 'N/A';

		const invoiceDate = new Date(transaction.createdAt).toLocaleString();
		const shippingCost = transaction.shippingCost.toFixed(2);
		const totalAmount = transaction.amount.toFixed(2);
		const currency = transaction.currency.toUpperCase();

		// Calcul des montants
		const taxRate = 20; // Exemple : 20% TVA
		const subtotal = (transaction.amount - transaction.shippingCost) / (1 + taxRate / 100);
		const taxAmount = transaction.amount - transaction.shippingCost - subtotal;

		// ------------------------------
		// 🏷️ En-tête de la facture
		// ------------------------------
		doc.setFontSize(16);
		doc.setFont('helvetica', 'bold');
		doc.text('FACTURE', 105, 20, { align: 'center' });

		// Ajout du logo (image locale chargée en Base64)
		doc.addImage(logoBase64, 'PNG', 10, 10, 60, 20);

		// Informations de l'entreprise (à gauche)
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text(companyName, 14, 40);
		doc.text(companyAddress, 14, 46);
		doc.text(companyCity, 14, 52);
		doc.text(`Tél: ${companyPhone}`, 14, 58);
		doc.text(`Email: ${companyEmail}`, 14, 64);
		doc.text(`TVA: ${companyVAT}`, 14, 70);

		// Informations du client (à droite)
		doc.text('Facturé à :', 130, 40);
		doc.text(customerName, 130, 46);
		doc.text(address, 130, 52);
		doc.text(zipCity, 130, 58);
		doc.text(`${state} (${stateCode}), ${country}`, 130, 64);
		doc.text(`Tél: ${customerPhone}`, 130, 70);
		doc.text(`Email: ${customerEmail}`, 130, 76);

		// ------------------------------
		// 📅 Détails de la facture
		// ------------------------------
		doc.setFontSize(12);
		doc.text(`Numéro de Facture: ${transaction.id}`, 14, 90);
		doc.text(`Date d'émission: ${invoiceDate}`, 14, 96);

		// ------------------------------
		// 🛒 Détails des produits
		// ------------------------------
		const startY = 110;
		doc.setFontSize(12);
		autoTable(doc, {
			startY: startY,
			head: [['Produit', 'Prix Unitaire', 'Quantité', 'Total']],
			body: transaction.products.map((product) => [
				product.name,
				`${product.price.toFixed(2)} €`,
				product.quantity,
				`${(product.price * product.quantity).toFixed(2)} €`
			]),
			styles: { fontSize: 10, cellPadding: 2 },
			headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
		});

		// ------------------------------
		// 💰 Totaux bien espacés
		// ------------------------------
		const finalY = doc.autoTable.previous.finalY + 15;
		doc.setFontSize(12);

		const totalXTitle = 110;
		const totalXValue = 190;

		doc.setFont('helvetica', 'bold');
		doc.text(`Sous-total (HT):`, totalXTitle, finalY);
		doc.setFont('helvetica', 'normal');
		doc.text(`${subtotal.toFixed(2)} ${currency}`, totalXValue, finalY, { align: 'right' });

		doc.setFont('helvetica', 'bold');
		doc.text(`TVA (${taxRate}%):`, totalXTitle, finalY + 8);
		doc.setFont('helvetica', 'normal');
		doc.text(`${taxAmount.toFixed(2)} ${currency}`, totalXValue, finalY + 8, { align: 'right' });

		doc.setFont('helvetica', 'bold');
		doc.text(`Frais de Livraison:`, totalXTitle, finalY + 16);
		doc.setFont('helvetica', 'normal');
		doc.text(`${shippingCost} ${currency}`, totalXValue, finalY + 16, { align: 'right' });

		doc.setFont('helvetica', 'bold');
		doc.text(`Total:`, totalXTitle, finalY + 24);
		doc.setFont('helvetica', 'bold');
		doc.text(`${totalAmount} ${currency}`, totalXValue, finalY + 24, { align: 'right' });

		// ------------------------------
		// 📌 Note de bas de page
		// ------------------------------
		doc.setFontSize(10);
		doc.setFont('helvetica', 'italic');
		doc.text('Merci pour votre commande !', 105, finalY + 40, { align: 'center' });

		// Sauvegarde du PDF
		doc.save(`Facture_${transaction.id}.pdf`);
	}

	// Génération automatique du PDF et redirection
	$effect(() => {
		generateInvoicePDF();
		goto('/auth/settings/factures');
	});
</script>

<h1 class="text-2xl font-bold m-5">Préparation de la facture</h1>

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
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
			reader.readAsDataURL(blob);
		});
	}

	// Génération du PDF
	async function generateInvoicePDF() {
		try {
			const transaction = data.transaction;
			
			// Vérifications de sécurité
			if (!transaction.id) {
				throw new Error('ID de transaction manquant');
			}
			if (typeof transaction.amount !== 'number') {
				throw new Error('Montant de transaction invalide');
			}
			if (typeof transaction.shippingCost !== 'number') {
				throw new Error('Frais de livraison invalides');
			}
			if (!transaction.currency) {
				throw new Error('Devise manquante');
			}
			if (!transaction.createdAt) {
				throw new Error('Date de création manquante');
			}

			const doc = new jsPDF();

			// Charger le logo
			const logoBase64 = await getBase64Image('/Logo-customYourCan.png');

			// ------------------------------
			// 📌 Définition des valeurs
			// ------------------------------
			const companyName = 'CustomYourCan Web';
			const companyAddress = '123 Rue des Affaires';
			const companyCity = '75000 Paris, France';
			const companyPhone = '+33 1 23 45 67 89';
			const companyEmail = 'contact@customyourcan.com';
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
			
			let finalY = startY; // Position Y par défaut
			
			if (!Array.isArray(transaction.products) || transaction.products.length === 0) {
				doc.text('Aucun produit', 14, startY);
				finalY = startY + 20; // Espacement si pas de produits
			} else {
				autoTable(doc, {
					startY: startY,
					head: [['Produit', 'Prix Unitaire', 'Quantité', 'Total']],
					body: transaction.products.map((product: any) => [
						product.name || 'Nom inconnu',
						`${(product.price || 0).toFixed(2)} €`,
						product.quantity || 1,
						`${((product.price || 0) * (product.quantity || 1)).toFixed(2)} €`
					]),
					styles: { fontSize: 10, cellPadding: 2 },
					headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
				});
				
				// Récupérer la position Y finale après le tableau
				if ((doc as any).autoTable && (doc as any).autoTable.previous) {
					finalY = (doc as any).autoTable.previous.finalY + 15;
				} else {
					finalY = startY + (transaction.products.length * 10) + 30; // Calcul manuel
				}
			}

			// ------------------------------
			// 💰 Totaux bien espacés
			// ------------------------------
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
			const customerFullName = customerName.replace(/\s+/g, '_'); // Remplacer les espaces par des underscores
			const dateFormatted = new Date(transaction.createdAt).toISOString().split('T')[0]; // Format YYYY-MM-DD
			const filename = `CustomYourCan_Facture_${dateFormatted}_${customerFullName}.pdf`;
			doc.save(filename);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
			alert(`Erreur lors de la génération du PDF: ${errorMessage}`);
		}
	}

	// Génération automatique du PDF et redirection
	$effect(() => {
		generateInvoicePDF().then(() => {
			// Vérifier le rôle de l'utilisateur pour la redirection
			if (data?.user?.role === 'ADMIN') {
				goto('/admin/sales');
			} else {
				goto('/auth/settings/factures');
			}
		}).catch((error) => {
		});
	});
</script>

<h1 class="text-2xl font-bold m-5">Préparation de la facture</h1>
<div class="m-5 p-4 bg-blue-100 rounded">
	<p class="text-blue-800">Génération de la facture en cours...</p>
	<p class="text-sm text-blue-600 mt-2">Vérifiez la console du navigateur pour les logs détaillés</p>
</div>

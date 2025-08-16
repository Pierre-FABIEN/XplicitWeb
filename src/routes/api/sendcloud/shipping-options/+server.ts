// C:\Web\XplicitWeb\src\routes\api\shipping\sendcloud\+server.ts

import { error, json } from '@sveltejs/kit';
import { z } from 'zod';

// 🎯 CONFIGURATION SENDCLOUD
const SENDCLOUD_CONFIG = {
	// Limites pour éviter la surcharge
	MAX_SERVICE_POINTS: 4,      // Max points relais
	MAX_HOME_DELIVERY: 6,       // Max livraison domicile
	MAX_TOTAL_OPTIONS: 10,      // Total max
	
	// Seuils de déduplication
	PRICE_SIMILARITY_THRESHOLD: 0.01,  // Prix considérés identiques si différence < 1 centime
	
	// Paramètres de tri
	PRIORITY_CARRIERS: ['Chronopost', 'Colissimo', 'UPS', 'Mondial Relay'], // Ordre de préférence
	PRIORITY_SERVICE_TYPES: ['service_point', 'home_delivery'] // Types prioritaires
};

// Types pour les options de livraison
interface ShippingQuote {
	price: {
		total: {
			value: string;
			currency: string;
		};
	};
	lead_time?: number;
}

interface ShippingOption {
	code: string;
	name: string;
	carrier: {
		code: string;
		name: string;
	};
	product: {
		code: string;
		name: string;
	};
	quotes: ShippingQuote[];
	functionalities?: {
		last_mile?: string;
		signature?: boolean;
	};
}

/**
 * We include an additional `quantity` field so that
 * we can adapt the package dimensions based on 24, 48, or 72 cans.
 */
const shippingRequestSchema = z.object({
	to_country_code: z.string(), // ex: "FR"
	to_postal_code: z.string(), // ex: "31500"
	weight: z.object({
		value: z.string(), // ex: "9"
		unit: z.enum(['kg', 'g', 'lbs', 'oz'])
	}),
	/**
	 * New field: quantity
	 * We assume the client passes it so we can determine
	 * the right box dimensions on the server side.
	 */
	quantity: z.number().int().optional()
});

export async function POST({ request }) {
	// 1. Parse the JSON payload
	let payload: unknown;
	try {
		payload = await request.json();
	} catch (err) {
		throw error(400, 'Invalid JSON payload');
	}

	// 2. Zod validation
	const parseResult = shippingRequestSchema.safeParse(payload);
	if (!parseResult.success) {
		throw error(400, {
			message: 'Request body validation failed',
			issues: parseResult.error.issues
		});
	}

	// Extract validated fields
	const { to_country_code, to_postal_code, weight, quantity } = parseResult.data;

	// 3. Construct Basic Auth
	const authString = `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`;
	const base64Auth = Buffer.from(authString).toString('base64');

	/**
	 * 4. Determine the dimensions based on the quantity
	 *    (24, 48, or 72). You can tweak these dimensions
	 *    according to your actual packaging requirements.
	 */
	let dimensions = {};

	// We switch on the quantity if it exists
	if (quantity !== undefined) {
		switch (quantity) {
			case 24:
				dimensions = {
					length: '30',
					width: '20',
					height: '15',
					unit: 'cm'
				};
				break;
			case 48:
				dimensions = {
					length: '40',
					width: '30',
					height: '20',
					unit: 'cm'
				};
				break;
			case 72:
				dimensions = {
					length: '50',
					width: '30',
					height: '30',
					unit: 'cm'
				};
				break;
			default:
				// If needed, set a fallback or do nothing.
				// The default is already above.
				break;
		}
	}

	try {
		/**
		 * 5. Build the final body for Sendcloud
		 *    We do not transmit any dimension from the client.
		 *    We overwrite them on the server side based on quantity.
		 */
		const requestBody = {
			// Sender (always the same)
			from_country_code: 'FR',
			from_postal_code: '31620',

			// Dimensions adapted from the "quantity" logic
			dimensions,

			// Fields validated from the client
			to_country_code,
			to_postal_code,
			weight,

			// Hardcoded functionalities
			// functionalities: { signature: true },

			// Use Sendcloud Broker
			direct_contract_only: false,

			// Indicate domestic shipping (France → France)
			service_area: 'domestic'
		};

		// console.log('dimensions', requestBody);

		// 6. Call the Sendcloud API
		const response = await fetch('https://panel.sendcloud.sc/api/v3/fetch-shipping-options', {
			method: 'POST',
			headers: {
				Authorization: `Basic ${base64Auth}`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		// 7. Check status
		if (!response.ok) {
			const rawText = await response.text();
			console.error('Sendcloud raw response:', rawText);
			throw error(response.status, 'Failed to fetch shipping options from Sendcloud');
		}

		// 8. Parse and return the data to the client
		const data = await response.json();
		
		// 🔍 ANALYSE DÉTAILLÉE de la réponse Sendcloud
		if (data.data && Array.isArray(data.data)) {
			console.log('\n📊 === ANALYSE SENDCLOUD ===');
			console.log(`   📦 Total options reçues: ${data.data.length}`);
			
			// Analyser les patterns de doublons
			const carrierStats = new Map<string, { count: number, products: Set<string>, prices: Set<string> }>();
			data.data.forEach((option: any) => {
				const carrier = option.carrier?.name || 'Unknown';
				const product = option.product?.name || 'Unknown';
				const price = option.quotes?.[0]?.price?.total?.value || '0';
				
				if (!carrierStats.has(carrier)) {
					carrierStats.set(carrier, { count: 0, products: new Set(), prices: new Set() });
				}
				
				const stats = carrierStats.get(carrier)!;
				stats.count++;
				stats.products.add(product);
				stats.prices.add(price);
			});
			
			// Afficher les statistiques par transporteur
			carrierStats.forEach((stats, carrier) => {
				console.log(`   🚚 ${carrier}: ${stats.count} options, ${stats.products.size} produits, ${stats.prices.size} prix uniques`);
			});
			console.log('📊 === FIN ANALYSE ===\n');
		}
		
		// 🔍 FILTRAGE ET TRI INTELLIGENT
		if (data.data && Array.isArray(data.data)) {
			const originalCount = data.data.length;
			
			// 🔍 ANALYSE DÉTAILLÉE avant filtrage
			analyzeSendcloudOptions(data.data as ShippingOption[]);
			
					// 🔍 ANALYSE SPÉCIFIQUE DES DOUBLONS UPS
		analyzeUPSDuplicates(data.data as ShippingOption[]);
			
			// 1. FILTRAGE : Enlever les options sans prix valide
		data.data = data.data.filter((option: any) => {
			const hasValidPrice = option.quotes && 
				option.quotes.length > 0 && 
				option.quotes[0].price && 
				option.quotes[0].price.total && 
				option.quotes[0].price.total.value && 
				parseFloat(option.quotes[0].price.total.value) > 0;
			
			return hasValidPrice;
		});
			
			const filteredCount = data.data.length;
			const removedCount = originalCount - filteredCount;
			
			console.log(`\n🔍 FILTRAGE DES PRIX:`);
			console.log(`   📦 Options originales: ${originalCount}`);
			console.log(`   ❌ Options supprimées: ${removedCount} (prix invalides)`);
			console.log(`   ✅ Options finales: ${filteredCount}`);
			
					// 2. 🎯 TRI INTELLIGENT : Organiser et dédupliquer
		if (filteredCount > 0) {
			data.data = smartSortShippingOptions(data.data as ShippingOption[]);
			console.log(`\n🎯 TRI INTELLIGENT APPLIQUÉ:`);
			console.log(`   📊 Options triées et optimisées`);
		}
			
			// 3. Ajouter les stats dans la réponse
			data.filtering = {
				original_count: originalCount,
				removed_count: removedCount,
				final_count: filteredCount
			};
		}

		return json(data);
	} catch (err) {
		console.error('Sendcloud fetch error:', err);
		throw error(500, 'Internal Server Error when calling Sendcloud API');
	}
}

/**
 * 🎯 TRI INTELLIGENT des options de livraison
 * 
 * Stratégie de tri :
 * 1. Grouper par type (point relais vs domicile)
 * 2. Trier par prix croissant dans chaque groupe
 * 3. Dédupliquer les options similaires
 * 4. Limiter à 8-10 options max pour éviter la surcharge
 */
function smartSortShippingOptions(options: ShippingOption[]): ShippingOption[] {
	console.log('\n🎯 === DÉBUT TRI INTELLIGENT ===');
	
	// 1. 🔍 ANALYSE : Catégoriser les options
	const servicePoints: ShippingOption[] = [];
	const homeDelivery: ShippingOption[] = [];
	
	options.forEach(option => {
		const isServicePoint = option.functionalities?.last_mile === 'service_point';
		if (isServicePoint) {
			servicePoints.push(option);
		} else {
			homeDelivery.push(option);
		}
	});
	
	console.log(`   📍 Points relais: ${servicePoints.length}`);
	console.log(`   🏠 Domicile: ${homeDelivery.length}`);
	
	// 2. 🧹 DÉDUPLICATION : Enlever les doublons similaires
	const deduplicatedServicePoints = deduplicateOptions(servicePoints);
	const deduplicatedHomeDelivery = deduplicateOptions(homeDelivery);
	
	console.log(`   📍 Points relais dédupliqués: ${deduplicatedServicePoints.length}`);
	console.log(`   🏠 Domicile dédupliqués: ${deduplicatedHomeDelivery.length}`);
	
	// 3. 📊 TRI : Par prix croissant dans chaque catégorie
	const sortedServicePoints = deduplicatedServicePoints.sort((a, b) => {
		const priceA = parseFloat(a.quotes[0]?.price?.total?.value || '0');
		const priceB = parseFloat(b.quotes[0]?.price?.total?.value || '0');
		return priceA - priceB;
	});
	
	const sortedHomeDelivery = deduplicatedHomeDelivery.sort((a, b) => {
		const priceA = parseFloat(a.quotes[0]?.price?.total?.value || '0');
		const priceB = parseFloat(b.quotes[0]?.price?.total?.value || '0');
		return priceA - priceB;
	});
	
	// 4. 🎯 SÉLECTION : Prendre les meilleures de chaque catégorie
	const bestServicePoints = sortedServicePoints.slice(0, SENDCLOUD_CONFIG.MAX_SERVICE_POINTS);
	const bestHomeDelivery = sortedHomeDelivery.slice(0, SENDCLOUD_CONFIG.MAX_HOME_DELIVERY);
	
	// 5. 🔄 ASSEMBLAGE : Alterner les types pour une présentation équilibrée
	const finalOptions: ShippingOption[] = [];
	
	// Commencer par les points relais (généralement moins chers)
	bestServicePoints.forEach((option, index) => {
		finalOptions.push(option);
		// Ajouter une option domicile après chaque 2 points relais
		if (index % 2 === 1 && bestHomeDelivery[index / 2]) {
			finalOptions.push(bestHomeDelivery[index / 2]);
		}
	});
	
	// Ajouter les options domicile restantes
	bestHomeDelivery.forEach(option => {
		if (!finalOptions.includes(option)) {
			finalOptions.push(option);
		}
	});
	
	// 6. 📝 LOGS DÉTAILLÉS
	console.log('\n🎯 RÉSULTAT DU TRI:');
	console.log(`   📍 Points relais sélectionnés: ${bestServicePoints.length}`);
	bestServicePoints.forEach((option, index) => {
		const price = option.quotes[0]?.price?.total?.value || 'N/A';
		console.log(`      ${index + 1}. ${option.carrier.name} - ${option.product.name}: ${price}€`);
	});
	
	console.log(`   🏠 Domicile sélectionnés: ${bestHomeDelivery.length}`);
	bestHomeDelivery.forEach((option, index) => {
		const price = option.quotes[0]?.price?.total?.value || 'N/A';
		console.log(`      ${index + 1}. ${option.carrier.name} - ${option.product.name}: ${price}€`);
	});
	
	console.log(`   📊 Total final: ${finalOptions.length} options`);
	console.log('🎯 === FIN TRI INTELLIGENT ===\n');
	
	return finalOptions;
}

/**
 * 🧹 DÉDUPLICATION ULTRA-INTELLIGENTE des options similaires
 * 
 * Stratégie renforcée pour Sendcloud :
 * 1. Détecter TOUS les types de doublons (même service, même prix)
 * 2. Conserver UNIQUEMENT les variantes avec des différences significatives
 * 3. Éliminer les doublons UPS qui polluent les résultats
 */
function deduplicateOptions(options: ShippingOption[]): ShippingOption[] {
	const uniqueOptions: ShippingOption[] = [];
	const seen = new Map<string, ShippingOption[]>();
	
	// 🔍 ANALYSE PRÉALABLE : Identifier les patterns de doublons
	const duplicatePatterns = analyzeDuplicatePatterns(options);
	
	options.forEach(option => {
		const price = parseFloat(option.quotes[0]?.price?.total?.value || '0');
		const carrier = option.carrier.name;
		const product = option.product.name;
		
		// Clé de base : transporteur + produit + prix exact
		const baseKey = `${option.carrier.code}-${option.product.code}`;
		const priceKey = `${baseKey}-${price.toFixed(2)}`;
		
		// 🎯 DÉDUPLICATION INTELLIGENTE PAR TRANSPORTEUR
		if (carrier === 'UPS') {
			// UPS : DÉDUPLICATION AGRESSIVE
			const upsKey = `UPS-${product}-${price.toFixed(2)}`;
			
			console.log(`\n🔍 ANALYSE UPS: ${product} (${price}€) - Clé: ${upsKey}`);
			
			if (!seen.has(upsKey)) {
				// Première option UPS à ce prix
				seen.set(upsKey, [option]);
				uniqueOptions.push(option);
				console.log(`   ✅ UPS conservé: ${product} (${price}€) - Première occurrence`);
			} else {
				// Option UPS existante - analyser les différences
				const existingOptions = seen.get(upsKey)!;
				console.log(`   🔍 Option existante trouvée pour ${upsKey}`);
				console.log(`   📊 Options existantes: ${existingOptions.length}`);
				
				// Afficher les détails de l'option existante
				existingOptions.forEach((existing, idx) => {
					console.log(`      Existant ${idx + 1}:`);
					console.log(`         - Code: ${existing.product.code}`);
					console.log(`         - Signature: ${existing.functionalities?.signature}`);
					console.log(`         - Last-mile: ${existing.functionalities?.last_mile}`);
					console.log(`         - Code option: ${existing.code}`);
				});
				
				// Afficher les détails de la nouvelle option
				console.log(`   🔍 Nouvelle option:`);
				console.log(`      - Code: ${option.product.code}`);
				console.log(`      - Signature: ${option.functionalities?.signature}`);
				console.log(`      - Last-mile: ${option.functionalities?.last_mile}`);
				console.log(`      - Code option: ${option.code}`);
				
				const hasSignificantDifference = hasSignificantUPSDifference(option, existingOptions[0]);
				
				console.log(`   🎯 Différence significative détectée: ${hasSignificantDifference}`);
				
				if (hasSignificantDifference) {
					// Différence significative - la conserver
					existingOptions.push(option);
					uniqueOptions.push(option);
					console.log(`   ✅ Variante UPS conservée: ${product} (${price}€) - Différence détectée`);
				} else {
					// Vrai doublon UPS - le supprimer
					console.log(`   🧹 Doublon UPS supprimé: ${product} (${price}€)`);
				}
			}
		} else {
			// AUTRES TRANSPORTEURS : DÉDUPLICATION STANDARD
			if (!seen.has(priceKey)) {
				// Nouvelle option à ce prix
				seen.set(priceKey, [option]);
				uniqueOptions.push(option);
			} else {
				// Option existante à ce prix - analyser si c'est un vrai doublon
				const existingOptions = seen.get(priceKey)!;
				const isDuplicate = existingOptions.some(existing => {
					// Vérifier si c'est vraiment le même service
					return (
						existing.carrier.code === option.carrier.code &&
						existing.product.code === option.product.code &&
						existing.functionalities?.last_mile === option.functionalities?.last_mile &&
						Math.abs(parseFloat(existing.quotes[0]?.price?.total?.value || '0') - price) < SENDCLOUD_CONFIG.PRICE_SIMILARITY_THRESHOLD
					);
				});
				
				if (isDuplicate) {
					// Vrai doublon - le supprimer
					console.log(`   🧹 Doublon supprimé: ${option.carrier.name} - ${option.product.name} (${price}€)`);
				} else {
					// Variante valide - la conserver
					existingOptions.push(option);
					uniqueOptions.push(option);
					console.log(`   ✅ Variante conservée: ${option.carrier.name} - ${option.product.name} (${price}€)`);
				}
			}
		}
	});
	
	return uniqueOptions;
}

/**
 * 🔍 ANALYSEUR d'options Sendcloud
 * 
 * Aide à comprendre pourquoi Sendcloud renvoie des "doublons"
 * et comment les traiter intelligemment
 */
function analyzeSendcloudOptions(options: ShippingOption[]): void {
	console.log('\n🔍 === ANALYSE DÉTAILLÉE SENDCLOUD ===');
	
	// Grouper par transporteur
	const byCarrier = new Map<string, ShippingOption[]>();
	options.forEach(option => {
		const carrier = option.carrier.name;
		if (!byCarrier.has(carrier)) {
			byCarrier.set(carrier, []);
		}
		byCarrier.get(carrier)!.push(option);
	});
	
	// Analyser chaque transporteur
	byCarrier.forEach((carrierOptions, carrierName) => {
		if (carrierOptions.length > 1) {
			console.log(`\n🚚 ${carrierName} (${carrierOptions.length} options):`);
			
			// Grouper par produit
			const byProduct = new Map<string, ShippingOption[]>();
			carrierOptions.forEach(option => {
				const product = option.product.name;
				if (!byProduct.has(product)) {
					byProduct.set(product, []);
				}
				byProduct.get(product)!.push(option);
			});
			
			// Analyser chaque produit
			byProduct.forEach((productOptions, productName) => {
				if (productOptions.length > 1) {
					console.log(`   📦 ${productName} (${productOptions.length} variantes):`);
					
					productOptions.forEach((option, index) => {
						const price = option.quotes[0]?.price?.total?.value || 'N/A';
						const lastMile = option.functionalities?.last_mile || 'N/A';
						const signature = option.functionalities?.signature || false;
						
						console.log(`      ${index + 1}. Prix: ${price}€ | Last-mile: ${lastMile} | Signature: ${signature}`);
						
						// Afficher les différences clés
						if (index > 0) {
							const prevOption = productOptions[index - 1];
							const prevPrice = prevOption.quotes[0]?.price?.total?.value || '0';
							const priceDiff = Math.abs(parseFloat(price) - parseFloat(prevPrice));
							
							if (priceDiff < 0.01) {
								console.log(`         ⚠️  Même prix que l'option précédente - possible doublon`);
							}
						}
					});
				} else {
					const option = productOptions[0];
					const price = option.quotes[0]?.price?.total?.value || 'N/A';
					console.log(`   📦 ${productName}: ${price}€`);
				}
			});
		} else {
			const option = carrierOptions[0];
			const price = option.quotes[0]?.price?.total?.value || 'N/A';
			console.log(`\n🚚 ${carrierName}: ${price}€`);
		}
	});
	
	console.log('🔍 === FIN ANALYSE DÉTAILLÉE ===\n');
}

/**
 * 🔍 ANALYSEUR de patterns de doublons
 * 
 * Identifie les patterns récurrents de doublons pour optimiser la déduplication
 */
function analyzeDuplicatePatterns(options: ShippingOption[]): Map<string, number> {
	const patterns = new Map<string, number>();
	
	options.forEach(option => {
		const price = option.quotes[0]?.price?.total?.value || '0';
		const key = `${option.carrier.name}-${option.product.name}-${price}`;
		
		patterns.set(key, (patterns.get(key) || 0) + 1);
	});
	
	return patterns;
}

/**
 * 🎯 DÉTECTEUR de différences significatives UPS
 * 
 * Détermine si deux options UPS ont des différences suffisantes pour être conservées
 */
function hasSignificantUPSDifference(option1: ShippingOption, option2: ShippingOption): boolean {
	console.log(`   🔍 COMPARAISON DÉTAILLÉE UPS:`);
	
	// Différences de signature
	const signature1 = option1.functionalities?.signature || false;
	const signature2 = option2.functionalities?.signature || false;
	const signatureDiff = signature1 !== signature2;
	console.log(`      - Signature: ${signature1} vs ${signature2} → Différence: ${signatureDiff}`);
	
	// Différences de last-mile
	const lastMile1 = option1.functionalities?.last_mile || 'N/A';
	const lastMile2 = option2.functionalities?.last_mile || 'N/A';
	const lastMileDiff = lastMile1 !== lastMile2;
	console.log(`      - Last-mile: ${lastMile1} vs ${lastMile2} → Différence: ${lastMileDiff}`);
	
	// Différences de codes produit
	const productCode1 = option1.product.code;
	const productCode2 = option2.product.code;
	const productCodeDiff = productCode1 !== productCode2;
	console.log(`      - Code produit: ${productCode1} vs ${productCode2} → Différence: ${productCodeDiff}`);
	
	// Différences de codes option
	const optionCode1 = option1.code;
	const optionCode2 = option2.code;
	const optionCodeDiff = optionCode1 !== optionCode2;
	console.log(`      - Code option: ${optionCode1} vs ${optionCode2} → Différence: ${optionCodeDiff}`);
	
	// Différences de noms option
	const optionName1 = option1.name;
	const optionName2 = option2.name;
	const optionNameDiff = optionName1 !== optionName2;
	console.log(`      - Nom option: ${optionName1} vs ${optionName2} → Différence: ${optionNameDiff}`);
	
	// Différences de délais
	const leadTime1 = option1.quotes[0]?.lead_time;
	const leadTime2 = option2.quotes[0]?.lead_time;
	const leadTimeDiff = leadTime1 !== leadTime2;
	console.log(`      - Délai: ${leadTime1} vs ${leadTime2} → Différence: ${leadTimeDiff}`);
	
	// Différences de fonctionnalités cachées (si disponibles)
	const func1 = JSON.stringify(option1.functionalities || {});
	const func2 = JSON.stringify(option2.functionalities || {});
	const funcDiff = func1 !== func2;
	console.log(`      - Fonctionnalités: ${funcDiff ? 'Différentes' : 'Identiques'}`);
	
	// Calculer le score de différence
	const totalDiffs = [signatureDiff, lastMileDiff, productCodeDiff, optionCodeDiff, optionNameDiff, leadTimeDiff, funcDiff];
	const diffCount = totalDiffs.filter(diff => diff).length;
	
	console.log(`   📊 SCORE DE DIFFÉRENCE: ${diffCount}/${totalDiffs.length} différences détectées`);
	
	// Si aucune différence significative n'est détectée, c'est un doublon
	const hasDifference = diffCount > 0;
	console.log(`   🎯 RÉSULTAT: ${hasDifference ? 'DIFFÉRENCE DÉTECTÉE' : 'DOUBLON DÉTECTÉ'}`);
	
	return hasDifference;
}

/**
 * 🚚 ANALYSEUR SPÉCIALISÉ des doublons UPS
 * 
 * Analyse en détail pourquoi UPS génère tant de doublons
 * et propose des solutions de déduplication
 */
function analyzeUPSDuplicates(options: ShippingOption[]): void {
	console.log('\n🚚 === ANALYSE SPÉCIFIQUE DOUBLONS UPS ===');
	
	// Filtrer uniquement les options UPS
	const upsOptions = options.filter(option => option.carrier.name === 'UPS');
	
	if (upsOptions.length === 0) {
		console.log('   Aucune option UPS trouvée');
		console.log('🚚 === FIN ANALYSE UPS ===\n');
		return;
	}
	
	console.log(`   📦 Total options UPS: ${upsOptions.length}`);
	
	// Grouper par produit et prix
	const upsGroups = new Map<string, ShippingOption[]>();
	
	upsOptions.forEach(option => {
		const price = option.quotes[0]?.price?.total?.value || '0';
		const product = option.product.name;
		const key = `${product}-${price}`;
		
		if (!upsGroups.has(key)) {
			upsGroups.set(key, []);
		}
		upsGroups.get(key)!.push(option);
	});
	
	// Analyser chaque groupe
	upsGroups.forEach((groupOptions, groupKey) => {
		if (groupOptions.length > 1) {
			const [product, price] = groupKey.split('-');
			console.log(`\n   📦 ${product} (${price}€) - ${groupOptions.length} variantes:`);
			
			groupOptions.forEach((option, index) => {
				const hasSignature = option.functionalities?.signature || false;
				const lastMile = option.functionalities?.last_mile || 'N/A';
				const productCode = option.product.code;
				
				console.log(`      ${index + 1}. Code: ${productCode} | Signature: ${hasSignature} | Last-mile: ${lastMile}`);
				
				// 🔍 ANALYSE ULTRA-DÉTAILLÉE de chaque option
				console.log(`         🔍 Détails complets:`);
				console.log(`            - Code produit: "${option.product.code}"`);
				console.log(`            - Nom produit: "${option.product.name}"`);
				console.log(`            - Code transporteur: "${option.carrier.code}"`);
				console.log(`            - Nom transporteur: "${option.carrier.name}"`);
				console.log(`            - Code option: "${option.code}"`);
				console.log(`            - Nom option: "${option.name}"`);
				console.log(`            - Prix: "${option.quotes[0]?.price?.total?.value}"`);
				console.log(`            - Devise: "${option.quotes[0]?.price?.total?.currency}"`);
				console.log(`            - Délai: "${option.quotes[0]?.lead_time}"`);
				console.log(`            - Last-mile: "${option.functionalities?.last_mile}"`);
				console.log(`            - Signature: "${option.functionalities?.signature}"`);
				console.log(`            - Fonctionnalités complètes:`, JSON.stringify(option.functionalities, null, 2));
				
				// Analyser les différences avec les options précédentes
				if (index > 0) {
					const prevOption = groupOptions[index - 1];
					const differences = findUPSDifferences(option, prevOption);
					
					if (differences.length === 0) {
						console.log(`         ⚠️  DOUBLON DÉTECTÉ - Aucune différence avec l'option précédente`);
					} else {
						console.log(`         ✅ Différences: ${differences.join(', ')}`);
					}
					
					// 🔍 COMPARAISON DÉTAILLÉE avec l'option précédente
					console.log(`         🔍 Comparaison avec l'option ${index}:`);
					console.log(`            - Codes produit identiques: ${option.product.code === prevOption.product.code}`);
					console.log(`            - Noms produit identiques: ${option.product.name === prevOption.product.name}`);
					console.log(`            - Codes transporteur identiques: ${option.carrier.code === prevOption.carrier.code}`);
					console.log(`            - Prix identiques: ${option.quotes[0]?.price?.total?.value === prevOption.quotes[0]?.price?.total?.value}`);
					console.log(`            - Last-mile identiques: ${option.functionalities?.last_mile === prevOption.functionalities?.last_mile}`);
					console.log(`            - Signature identiques: ${option.functionalities?.signature === prevOption.functionalities?.signature}`);
					console.log(`            - Codes option identiques: ${option.code === prevOption.code}`);
					console.log(`            - Noms option identiques: ${option.name === prevOption.name}`);
					
					// Comparer les objets complets
					const optionStr = JSON.stringify(option, null, 2);
					const prevOptionStr = JSON.stringify(prevOption, null, 2);
					console.log(`            - Objets identiques: ${optionStr === prevOptionStr}`);
					
					if (optionStr === prevOptionStr) {
						console.log(`         🚨 DOUBLON PARFAIT DÉTECTÉ - Objets identiques à 100%`);
					}
				}
			});
			
			// Recommandation de déduplication
			const uniqueCount = countUniqueUPSOptions(groupOptions);
			const duplicateCount = groupOptions.length - uniqueCount;
			
			console.log(`      📊 Recommandation: Garder ${uniqueCount} option(s), supprimer ${duplicateCount} doublon(s)`);
		} else {
			const option = groupOptions[0];
			const price = option.quotes[0]?.price?.total?.value || 'N/A';
			console.log(`   📦 ${option.product.name}: ${price}€ (unique)`);
		}
	});
	
	console.log('🚚 === FIN ANALYSE UPS ===\n');
}

/**
 * 🔍 TROUVEUR de différences entre options UPS
 */
function findUPSDifferences(option1: ShippingOption, option2: ShippingOption): string[] {
	const differences: string[] = [];
	
	if (option1.functionalities?.signature !== option2.functionalities?.signature) {
		differences.push('signature');
	}
	
	if (option1.functionalities?.last_mile !== option2.functionalities?.last_mile) {
		differences.push('last-mile');
	}
	
	if (option1.product.code !== option2.product.code) {
		differences.push('code_produit');
	}
	
	// Comparer toutes les fonctionnalités
	const func1 = JSON.stringify(option1.functionalities || {});
	const func2 = JSON.stringify(option2.functionalities || {});
	if (func1 !== func2) {
		differences.push('fonctionnalités');
	}
	
	return differences;
}

/**
 * 🧮 COMPTEUR d'options UPS uniques
 */
function countUniqueUPSOptions(options: ShippingOption[]): number {
	const uniqueOptions = new Set<string>();
	
	options.forEach(option => {
		const signature = option.functionalities?.signature || false;
		const lastMile = option.functionalities?.last_mile || 'N/A';
		const productCode = option.product.code;
		
		// Créer une signature unique pour chaque option
		const uniqueSignature = `${productCode}-${lastMile}-${signature}`;
		uniqueOptions.add(uniqueSignature);
	});
	
	return uniqueOptions.size;
}

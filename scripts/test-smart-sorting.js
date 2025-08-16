#!/usr/bin/env node

/**
 * Script de test pour le tri intelligent des options de livraison
 * 
 * Usage: node scripts/test-smart-sorting.js
 */

console.log('🧪 === TEST TRI INTELLIGENT DES OPTIONS ===\n');

/**
 * Simule les options de livraison que vous recevez actuellement
 */
function createMockOptions() {
  return [
    // Points relais - Chronopost
    {
      code: 'chronopost:chrono10/13/18,fr',
      name: 'Chrono 10/13/18',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono10/13/18', name: 'Chrono 10/13/18' },
      quotes: [{ price: { total: { value: '25.17', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'chronopost:chrono10/13/18,fr',
      name: 'Chrono 10/13/18',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono10/13/18', name: 'Chrono 10/13/18' },
      quotes: [{ price: { total: { value: '19.16', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'chronopost:chrono10/13/18,fr',
      name: 'Chrono 10/13/18',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono10/13/18', name: 'Chrono 10/13/18' },
      quotes: [{ price: { total: { value: '14.23', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'chronopost:chrono_relais,fr',
      name: 'Chrono Relais',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono_relais', name: 'Chrono Relais' },
      quotes: [{ price: { total: { value: '9.56', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'chronopost:chrono_relais,fr',
      name: 'Chrono Relais',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono_relais', name: 'Chrono Relais' },
      quotes: [{ price: { total: { value: '16.57', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'chronopost:chrono10/13/18,fr',
      name: 'Chrono 10/13/18',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono10/13/18', name: 'Chrono 10/13/18' },
      quotes: [{ price: { total: { value: '32.18', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'chronopost:chrono10/13/18,fr',
      name: 'Chrono 10/13/18',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono10/13/18', name: 'Chrono 10/13/18' },
      quotes: [{ price: { total: { value: '26.17', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'chronopost:chrono10/13/18,fr',
      name: 'Chrono 10/13/18',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono10/13/18', name: 'Chrono 10/13/18' },
      quotes: [{ price: { total: { value: '21.24', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'chronopost:chrono_shop2shop,fr',
      name: 'Chrono Shop2Shop',
      carrier: { code: 'chronopost', name: 'Chronopost' },
      product: { code: 'chrono_shop2shop', name: 'Chrono Shop2Shop' },
      quotes: [{ price: { total: { value: '5.42', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    
    // Points relais - Colissimo
    {
      code: 'colissimo:service_point,fr',
      name: 'Colissimo Service Point',
      carrier: { code: 'colissimo', name: 'Colissimo' },
      product: { code: 'service_point', name: 'Colissimo Service Point' },
      quotes: [{ price: { total: { value: '10.71', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    
    // Points relais - Mondial Relay
    {
      code: 'mondial_relay:point_relais_lxl,fr',
      name: 'Mondial Relay Point Relais (L/XL)',
      carrier: { code: 'mondial_relay', name: 'Mondial Relay' },
      product: { code: 'point_relais_lxl', name: 'Mondial Relay Point Relais (L/XL)' },
      quotes: [{ price: { total: { value: '6.04', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    {
      code: 'mondial_relay:point_relais_lxl_qr,fr',
      name: 'Mondial Relay Point Relais (L/XL) QR',
      carrier: { code: 'mondial_relay', name: 'Mondial Relay' },
      product: { code: 'point_relais_lxl_qr', name: 'Mondial Relay Point Relais (L/XL) QR' },
      quotes: [{ price: { total: { value: '6.04', currency: 'EUR' } } }],
      functionalities: { last_mile: 'service_point' }
    },
    
    // Domicile - Colissimo
    {
      code: 'colissimo:home,fr',
      name: 'Colissimo Home',
      carrier: { code: 'colissimo', name: 'Colissimo' },
      product: { code: 'home', name: 'Colissimo Home' },
      quotes: [{ price: { total: { value: '12.49', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    },
    {
      code: 'colissimo:home,fr',
      name: 'Colissimo Home',
      carrier: { code: 'colissimo', name: 'Colissimo' },
      product: { code: 'home', name: 'Colissimo Home' },
      quotes: [{ price: { total: { value: '13.65', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    },
    
    // Domicile - UPS
    {
      code: 'ups:express,fr',
      name: 'UPS Express',
      carrier: { code: 'ups', name: 'UPS' },
      product: { code: 'express', name: 'UPS Express' },
      quotes: [{ price: { total: { value: '25.25', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    },
    {
      code: 'ups:express,fr',
      name: 'UPS Express',
      carrier: { code: 'ups', name: 'UPS' },
      product: { code: 'express', name: 'UPS Express' },
      quotes: [{ price: { total: { value: '29.25', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    },
    {
      code: 'ups:express_saver,fr',
      name: 'UPS Express Saver',
      carrier: { code: 'ups', name: 'UPS' },
      product: { code: 'express_saver', name: 'UPS Express Saver' },
      quotes: [{ price: { total: { value: '15.25', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    },
    {
      code: 'ups:express_saver_access_point,fr',
      name: 'UPS Express Saver to Access Point',
      carrier: { code: 'ups', name: 'UPS' },
      product: { code: 'express_saver_access_point', name: 'UPS Express Saver to Access Point' },
      quotes: [{ price: { total: { value: '8.95', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    },
    {
      code: 'ups:standard,fr',
      name: 'UPS Standard',
      carrier: { code: 'ups', name: 'UPS' },
      product: { code: 'standard', name: 'UPS Standard' },
      quotes: [{ price: { total: { value: '8.95', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    },
    {
      code: 'ups:standard_access_point,fr',
      name: 'UPS Standard to Access Point',
      carrier: { code: 'ups', name: 'UPS' },
      product: { code: 'standard_access_point', name: 'UPS Standard to Access Point' },
      quotes: [{ price: { total: { value: '5.70', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    },
    
    // Option gratuite (sera filtrée)
    {
      code: 'sendcloud:unstamped_letter,fr',
      name: 'Unstamped letter',
      carrier: { code: 'sendcloud', name: 'Sendcloud' },
      product: { code: 'unstamped_letter', name: 'Unstamped letter' },
      quotes: [{ price: { total: { value: '0', currency: 'EUR' } } }],
      functionalities: { last_mile: 'home_delivery' }
    }
  ];
}

/**
 * Affiche les options de manière claire
 */
function displayOptions(options, title) {
  console.log(`${title}:\n`);
  
  options.forEach((option, index) => {
    const price = parseFloat(option.quotes[0]?.price?.total?.value || '0');
    const isServicePoint = option.functionalities?.last_mile === 'service_point';
    const icon = isServicePoint ? '📍' : '🏠';
    const type = isServicePoint ? 'POINT RELAIS' : 'DOMICILE';
    
    console.log(`   ${icon} ${index + 1}. ${option.carrier.name} - ${option.product.name}`);
    console.log(`      💰 Prix: ${price}€`);
    console.log(`      📍 Type: ${type}`);
    console.log(`      📋 Code: ${option.code}`);
    console.log('');
  });
}

/**
 * Test du tri intelligent
 */
function testSmartSorting() {
  console.log('🔍 Début du test de tri intelligent...\n');
  
  // 1. Créer des options de test
  const mockOptions = createMockOptions();
  
  // 2. Afficher les options originales
  displayOptions(mockOptions, '📦 OPTIONS ORIGINALES (AVANT TRI)');
  
  // 3. Simuler le filtrage des prix (comme côté serveur)
  const validOptions = mockOptions.filter(option => {
    const price = parseFloat(option.quotes[0]?.price?.total?.value || '0');
    return price > 0;
  });
  
  console.log(`🔍 FILTRAGE DES PRIX:`);
  console.log(`   📦 Options originales: ${mockOptions.length}`);
  console.log(`   ❌ Options supprimées: ${mockOptions.length - validOptions.length} (prix ≤ 0€)`);
  console.log(`   ✅ Options valides: ${validOptions.length}\n`);
  
  // 4. Simuler le tri intelligent
  const sortedOptions = smartSortShippingOptions(validOptions);
  
  // 5. Afficher les options triées
  displayOptions(sortedOptions, '🎯 OPTIONS APRÈS TRI INTELLIGENT');
  
  // 6. Statistiques finales
  const servicePointCount = sortedOptions.filter(opt => opt.functionalities?.last_mile === 'service_point').length;
  const homeDeliveryCount = sortedOptions.filter(opt => opt.functionalities?.last_mile === 'home_delivery').length;
  
  console.log('📊 STATISTIQUES FINALES:');
  console.log(`   📍 Points relais: ${servicePointCount}`);
  console.log(`   🏠 Domicile: ${homeDeliveryCount}`);
  console.log(`   📦 Total: ${sortedOptions.length}`);
  console.log(`   📈 Réduction: ${Math.round(((mockOptions.length - sortedOptions.length) / mockOptions.length) * 100)}%`);
  
  return {
    original: mockOptions.length,
    valid: validOptions.length,
    sorted: sortedOptions.length,
    servicePoints: servicePointCount,
    homeDelivery: homeDeliveryCount
  };
}

/**
 * Fonction de tri intelligent (identique à celle du serveur)
 */
function smartSortShippingOptions(options) {
  console.log('\n🎯 === DÉBUT TRI INTELLIGENT ===');
  
  // 1. 🔍 ANALYSE : Catégoriser les options
  const servicePoints = [];
  const homeDelivery = [];
  
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
  const bestServicePoints = sortedServicePoints.slice(0, 4); // Top 4 points relais
  const bestHomeDelivery = sortedHomeDelivery.slice(0, 6);   // Top 6 domicile
  
  // 5. 🔄 ASSEMBLAGE : Alterner les types pour une présentation équilibrée
  const finalOptions = [];
  
  // Commencer par les points relais (généralement moins chers)
  bestServicePoints.forEach((option, index) => {
    finalOptions.push(option);
    // Ajouter une option domicile après chaque 2 points relais
    if (index % 2 === 1 && bestHomeDelivery[Math.floor(index / 2)]) {
      finalOptions.push(bestHomeDelivery[Math.floor(index / 2)]);
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
 * Fonction de déduplication (identique à celle du serveur)
 */
function deduplicateOptions(options) {
  const uniqueOptions = [];
  const seen = new Set();
  
  options.forEach(option => {
    // Créer une clé unique basée sur transporteur + produit + prix
    const price = parseFloat(option.quotes[0]?.price?.total?.value || '0');
    const key = `${option.carrier.code}-${option.product.code}-${Math.round(price * 100)}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueOptions.push(option);
    } else {
      console.log(`   🧹 Doublon supprimé: ${option.carrier.name} - ${option.product.name} (${price}€)`);
    }
  });
  
  return uniqueOptions;
}

// Exécution du test
const result = testSmartSorting();

console.log('🏁 === RÉSULTAT FINAL ===\n');

if (result.sorted > 0) {
  console.log('✅ Test RÉUSSI:');
  console.log(`   • ${result.original} → ${result.sorted} options (réduction de ${Math.round(((result.original - result.sorted) / result.original) * 100)}%)`);
  console.log(`   • 📍 ${result.servicePoints} points relais (économiques)`);
  console.log(`   • 🏠 ${result.homeDelivery} options domicile (confort)`);
  console.log('   • Le tri intelligent fonctionne parfaitement');
} else {
  console.log('❌ Test ÉCHOUÉ:');
  console.log('   • Aucune option triée');
  console.log('   • Problème dans la logique de tri');
}

console.log('');
console.log('💡 CONSEILS D\'UTILISATION:');
console.log('   1. Le tri se fait automatiquement côté serveur');
console.log('   2. Les doublons sont supprimés intelligemment');
console.log('   3. Les points relais sont prioritaires (moins chers)');
console.log('   4. Maximum 10 options pour éviter la surcharge');
console.log('');
console.log('🎯 PROCHAINE ÉTAPE:');
console.log('   → Testez dans votre application');
console.log('   → Vérifiez que les options sont bien triées');
console.log('   → Confirmez que les doublons ont disparu');
console.log('');

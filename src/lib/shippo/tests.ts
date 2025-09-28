/**
 * Tests simples pour l'intégration Shippo
 * À exécuter pour vérifier que l'installation fonctionne
 */

import { 
  validateShippoConfig,
  testShippoConnection,
  createShippoClientForProject
} from './index.js';

// ============================================================================
// TESTS DE CONFIGURATION
// ============================================================================

export async function testConfiguration(): Promise<boolean> {
  console.log('🔧 Test de la configuration Shippo...');
  
  try {
    const config = validateShippoConfig();
    
    if (!config.isValid) {
      console.error('❌ Configuration invalide:');
      config.errors.forEach(error => console.error(`  - ${error}`));
      return false;
    }
    
    if (config.warnings.length > 0) {
      console.warn('⚠️ Avertissements de configuration:');
      config.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    console.log('✅ Configuration valide');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du test de configuration:', error);
    return false;
  }
}

// ============================================================================
// TESTS DE CONNEXION
// ============================================================================

export async function testConnection(): Promise<boolean> {
  console.log('🌐 Test de la connexion Shippo...');
  
  try {
    const connectionTest = await testShippoConnection();
    
    if (!connectionTest.success) {
      console.error('❌ Connexion échouée:', connectionTest.message);
      return false;
    }
    
    console.log('✅ Connexion réussie');
    console.log(`📊 Comptes transporteurs disponibles: ${connectionTest.details?.carrierAccountsCount || 0}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error);
    return false;
  }
}

// ============================================================================
// TESTS DE CRÉATION D'ADRESSE
// ============================================================================

export async function testAddressCreation(): Promise<boolean> {
  console.log('📍 Test de création d\'adresse...');
  
  try {
    const { testAddressCreation } = await import('./index.js');
    
    const testAddress = {
      firstName: 'Test',
      lastName: 'User',
      street: '123 Test Street',
      city: 'Paris',
      zip: '75001',
      country: 'FR',
      phone: '0123456789',
      email: 'test@example.com'
    };
    
    const result = await testAddressCreation(testAddress);
    
    if (!result.success) {
      console.error('❌ Création d\'adresse échouée:', result.message);
      return false;
    }
    
    console.log('✅ Adresse créée avec succès');
    console.log(`🆔 ID de l\'adresse: ${result.addressId}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du test de création d\'adresse:', error);
    return false;
  }
}

// ============================================================================
// TESTS DE FLUX COMPLET
// ============================================================================

export async function testCompleteFlow(): Promise<boolean> {
  console.log('🚀 Test du flux complet...');
  
  try {
    const { quickLabelPurchase } = await import('./index.js');
    
    // Données de test
    const testTransaction = {
      id: `TEST-${Date.now()}`,
      amount: 19.99,
      currency: 'EUR',
      status: 'paid',
      
      // Adresse destinataire
      address_first_name: 'Test',
      address_last_name: 'User',
      address_phone: '0123456789',
      address_street: '123 Test Street',
      address_city: 'Paris',
      address_zip: '75001',
      address_country_code: 'FR',
      customer_details_email: 'test@example.com',
      
      // Colis
      package_length: 25,
      package_width: 15,
      package_height: 8,
      package_dimension_unit: 'cm',
      package_weight: 0.3,
      package_weight_unit: 'kg',
      
      products: [
        { name: 'Test Product', price: 19.99, quantity: 1, weight: 0.3 }
      ],
      
      createdAt: new Date(),
      order_number: `ORDER-${Date.now()}`
    };
    
    const result = await quickLabelPurchase(testTransaction, {
      preferredCarriers: ['colissimo'],
      labelFileType: 'PDF',
      preferCheapest: true
    });
    
    if (result.labelResult.status !== 'SUCCESS') {
      console.error('❌ Flux complet échoué:', result.labelResult.messages);
      return false;
    }
    
    console.log('✅ Flux complet réussi');
    console.log(`💰 Coût: ${result.metadata.totalCost} ${result.metadata.currency}`);
    console.log(`🚚 Transporteur: ${result.metadata.carrier}`);
    console.log(`📋 Numéro de suivi: ${result.labelResult.trackingNumber}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors du test du flux complet:', error);
    return false;
  }
}

// ============================================================================
// FONCTION PRINCIPALE DE TEST
// ============================================================================

export async function runAllTests(): Promise<{
  configuration: boolean;
  connection: boolean;
  addressCreation: boolean;
  completeFlow: boolean;
  overall: boolean;
}> {
  console.log('🧪 === TESTS D\'INTÉGRATION SHIPPO ===\n');
  
  const results = {
    configuration: false,
    connection: false,
    addressCreation: false,
    completeFlow: false,
    overall: false
  };
  
  try {
    // Test 1: Configuration
    results.configuration = await testConfiguration();
    console.log('');
    
    if (!results.configuration) {
      console.log('❌ Tests arrêtés - Configuration invalide');
      return results;
    }
    
    // Test 2: Connexion
    results.connection = await testConnection();
    console.log('');
    
    if (!results.connection) {
      console.log('❌ Tests arrêtés - Connexion échouée');
      return results;
    }
    
    // Test 3: Création d'adresse
    results.addressCreation = await testAddressCreation();
    console.log('');
    
    // Test 4: Flux complet (optionnel - peut échouer si pas de crédit)
    try {
      results.completeFlow = await testCompleteFlow();
    } catch (error) {
      console.warn('⚠️ Test du flux complet ignoré (probablement pas de crédit):', error);
      results.completeFlow = false;
    }
    console.log('');
    
    // Résultat global
    results.overall = results.configuration && results.connection && results.addressCreation;
    
    // Résumé
    console.log('📊 === RÉSUMÉ DES TESTS ===');
    console.log(`🔧 Configuration: ${results.configuration ? '✅' : '❌'}`);
    console.log(`🌐 Connexion: ${results.connection ? '✅' : '❌'}`);
    console.log(`📍 Création d'adresse: ${results.addressCreation ? '✅' : '❌'}`);
    console.log(`🚀 Flux complet: ${results.completeFlow ? '✅' : '⚠️'}`);
    console.log(`🎯 Résultat global: ${results.overall ? '✅' : '❌'}`);
    
    if (results.overall) {
      console.log('\n🎉 Tous les tests essentiels sont passés ! L\'intégration Shippo est prête.');
    } else {
      console.log('\n⚠️ Certains tests ont échoué. Vérifiez votre configuration.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
  }
  
  return results;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Les exports sont déjà définis dans les déclarations des fonctions ci-dessus

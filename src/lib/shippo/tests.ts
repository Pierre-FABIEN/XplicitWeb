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
  
  try {
    const config = validateShippoConfig();
    
    if (!config.isValid) {
      config.errors.forEach(error => console.error(`  - ${error}`));
      return false;
    }
    
    if (config.warnings.length > 0) {
      config.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    return true;
    
  } catch (error) {
    return false;
  }
}

// ============================================================================
// TESTS DE CONNEXION
// ============================================================================

export async function testConnection(): Promise<boolean> {
  
  try {
    const connectionTest = await testShippoConnection();
    
    if (!connectionTest.success) {
      return false;
    }
    
    
    return true;
    
  } catch (error) {
    return false;
  }
}

// ============================================================================
// TESTS DE CRÉATION D'ADRESSE
// ============================================================================

export async function testAddressCreation(): Promise<boolean> {
  
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
      return false;
    }
    
    
    return true;
    
  } catch (error) {
    return false;
  }
}

// ============================================================================
// TESTS DE FLUX COMPLET
// ============================================================================

export async function testCompleteFlow(): Promise<boolean> {
  
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
      return false;
    }
    
    
    return true;
    
  } catch (error) {
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
    
    if (!results.configuration) {
      return results;
    }
    
    // Test 2: Connexion
    results.connection = await testConnection();
    
    if (!results.connection) {
      return results;
    }
    
    // Test 3: Création d'adresse
    results.addressCreation = await testAddressCreation();
    
    // Test 4: Flux complet (optionnel - peut échouer si pas de crédit)
    try {
      results.completeFlow = await testCompleteFlow();
    } catch (error) {
      results.completeFlow = false;
    }
    
    // Résultat global
    results.overall = results.configuration && results.connection && results.addressCreation;
    
    // Résumé
    
    if (results.overall) {
    } else {
    }
    
  } catch (error) {
  }
  
  return results;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Les exports sont déjà définis dans les déclarations des fonctions ci-dessus

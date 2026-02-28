/**
 * Exemple d'utilisation pratique de l'API Shippo
 * Compatible avec votre système existant
 */

import { 
  createShippoClientForProject,
  quickLabelPurchase,
  executeCompleteShippingFlow,
  testShippoConnection,
  validateShippoConfig
} from './index.js';

// ============================================================================
// EXEMPLE 1 : UTILISATION SIMPLE
// ============================================================================

export async function exempleUtilisationSimple() {
  
  try {
    // 1. Vérifier la configuration
    const config = validateShippoConfig();
    if (!config.isValid) {
      throw new Error(`Configuration invalide: ${config.errors.join(', ')}`);
    }
    
    // 2. Tester la connexion
    const connectionTest = await testShippoConnection();
    if (!connectionTest.success) {
      throw new Error(`Connexion échouée: ${connectionTest.message}`);
    }
    
    
    // 3. Données d'exemple (adaptez selon votre modèle Prisma)
    const transactionData = {
      id: 'TXN-123',
      amount: 25.99,
      currency: 'EUR',
      status: 'paid',
      
      // Adresse destinataire
      address_first_name: 'Jean',
      address_last_name: 'Dupont',
      address_company: 'Entreprise ABC',
      address_phone: '0123456789',
      address_street: '123 Rue de la Paix',
      address_street_number: '123',
      address_city: 'Paris',
      address_zip: '75001',
      address_country_code: 'FR',
      customer_details_email: 'jean.dupont@example.com',
      
      // Adresse expéditeur (optionnelle)
      sender_name: 'Votre Entreprise',
      sender_company: 'Mon E-commerce',
      sender_address: '456 Avenue des Champs',
      sender_city: 'Lyon',
      sender_postal_code: '69001',
      sender_country: 'FR',
      sender_telephone: '0987654321',
      sender_email: 'expedition@mon-ecommerce.com',
      
      // Colis
      package_length: 30,
      package_width: 20,
      package_height: 10,
      package_dimension_unit: 'cm',
      package_weight: 0.5,
      package_weight_unit: 'kg',
      
      // Produits
      products: [
        { name: 'Produit A', price: 15.99, quantity: 1, weight: 0.3 },
        { name: 'Produit B', price: 10.00, quantity: 1, weight: 0.2 }
      ],
      
      // Métadonnées
      createdAt: new Date(),
      order_number: 'ORDER-123'
    };
    
    // 4. Acheter une étiquette rapidement
    const result = await quickLabelPurchase(transactionData, {
      preferredCarriers: ['colissimo', 'chronopost'],
      labelFileType: 'PDF',
      preferCheapest: true
    });
    
    
    return result;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// EXEMPLE 2 : UTILISATION AVEC POINT RELAIS
// ============================================================================

export async function exempleAvecPointRelais() {
  
  const transactionData = {
    id: 'TXN-456',
    amount: 19.99,
    currency: 'EUR',
    status: 'paid',
    
    // Adresse destinataire
    address_first_name: 'Marie',
    address_last_name: 'Martin',
    address_phone: '0123456789',
    address_street: '789 Boulevard Saint-Germain',
    address_city: 'Paris',
    address_zip: '75006',
    address_country_code: 'FR',
    customer_details_email: 'marie.martin@example.com',
    
    // Point relais
    servicePointId: 'SP-12345',
    servicePointName: 'Relais Colis - Pharmacie Centrale',
    servicePointAddress: '12 Rue de Rivoli',
    servicePointCity: 'Paris',
    servicePointZip: '75001',
    servicePointCountry: 'FR',
    servicePointPostNumber: 'RC123456',
    
    // Colis
    package_length: 25,
    package_width: 15,
    package_height: 8,
    package_dimension_unit: 'cm',
    package_weight: 0.3,
    package_weight_unit: 'kg',
    
    products: [
      { name: 'Produit C', price: 19.99, quantity: 1, weight: 0.3 }
    ],
    
    createdAt: new Date(),
    order_number: 'ORDER-456'
  };
  
  const servicePointData = {
    id: transactionData.servicePointId,
    name: transactionData.servicePointName,
    address: transactionData.servicePointAddress,
    city: transactionData.servicePointCity,
    zip: transactionData.servicePointZip,
    country: transactionData.servicePointCountry,
    postNumber: transactionData.servicePointPostNumber
  };
  
  try {
    const { createAndPurchaseLabelForServicePoint } = await import('./integration.js');
    
    const result = await createAndPurchaseLabelForServicePoint(
      transactionData,
      servicePointData,
      {
        rateSelection: { 
          preferredCarriers: ['colissimo'],
          preferCheapest: true 
        },
        labelOptions: { 
          fileType: 'PDF', 
          async: false 
        }
      }
    );
    
    
    return result;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// EXEMPLE 3 : UTILISATION AVANCÉE AVEC VALIDATION
// ============================================================================

export async function exempleAvanceAvecValidation() {
  
  const transactionData = {
    id: 'TXN-789',
    amount: 45.99,
    currency: 'EUR',
    status: 'paid',
    
    // Adresse destinataire
    address_first_name: 'Pierre',
    address_last_name: 'Durand',
    address_company: 'Société XYZ',
    address_phone: '0123456789',
    address_street: '321 Avenue des Ternes',
    address_street_number: '321',
    address_city: 'Paris',
    address_zip: '75017',
    address_country_code: 'FR',
    customer_details_email: 'pierre.durand@example.com',
    
    // Adresse expéditeur
    sender_name: 'Mon E-commerce',
    sender_company: 'E-commerce Pro',
    sender_address: '789 Rue de la République',
    sender_city: 'Lyon',
    sender_postal_code: '69002',
    sender_country: 'FR',
    sender_telephone: '0987654321',
    sender_email: 'expedition@ecommerce-pro.com',
    
    // Colis
    package_length: 40,
    package_width: 30,
    package_height: 15,
    package_dimension_unit: 'cm',
    package_weight: 1.2,
    package_weight_unit: 'kg',
    
    products: [
      { name: 'Produit D', price: 25.99, quantity: 1, weight: 0.8 },
      { name: 'Produit E', price: 20.00, quantity: 1, weight: 0.4 }
    ],
    
    createdAt: new Date(),
    order_number: 'ORDER-789'
  };
  
  try {
    const { createAndPurchaseLabelWithValidation } = await import('./integration.js');
    
    const result = await createAndPurchaseLabelWithValidation(transactionData, {
      rateSelection: {
        preferredCarriers: ['colissimo', 'chronopost', 'ups'],
        preferCheapest: false, // Préférer le plus rapide
        preferFastest: true,
        maxPrice: 50, // Prix maximum
        maxDays: 3 // Délai maximum
      },
      labelOptions: {
        fileType: 'PDF_A4',
        async: false
      },
      validateAddresses: true,
      retryOnError: true,
      maxRetries: 3
    });
    
    
    return result;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// EXEMPLE 4 : GESTION DES WEBHOOKS
// ============================================================================

export async function exempleGestionWebhooks() {
  
  try {
    const client = createShippoClientForProject();
    const { setupWebhooks, WebhookManager } = await import('./webhooks.js');
    
    // 1. Configurer les webhooks
    const webhook = await setupWebhooks(
      client,
      'https://votre-domaine.com', // Remplacez par votre domaine
      [
        'transaction.created',
        'transaction.updated',
        'track.updated'
      ]
    );
    
    
    // 2. Configurer le gestionnaire de webhooks
    const webhookManager = new WebhookManager();
    webhookManager.registerDefaultHandlers();
    
    // 3. Exemple de traitement d'un webhook (à adapter dans votre route API)
    const exempleWebhookPayload = {
      event: 'transaction.updated',
      data: {
        object_id: 'txn_123',
        object_type: 'transaction',
        object_state: 'VALID',
        object_created: '2024-01-01T00:00:00Z',
        object_updated: '2024-01-01T12:00:00Z',
        object_owner: 'user_123',
        status: 'SUCCESS',
        tracking_number: 'TRK123456789',
        tracking_url_provider: 'https://tracking.example.com/TRK123456789'
      }
    };
    
    await webhookManager.processWebhook(exempleWebhookPayload);
    
    
    return {
      webhook,
      webhookManager
    };
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// EXEMPLE 5 : GESTION DES MANIFESTES
// ============================================================================

export async function exempleGestionManifestes() {
  
  try {
    const client = createShippoClientForProject();
    const { createManifestForCarrier } = await import('./manifests.js');
    
    // Données d'exemple - transactions à regrouper
    const transactionIds = [
      'txn_001',
      'txn_002',
      'txn_003',
      'txn_004',
      'txn_005'
    ];
    
    const carrierAccount = 'carrier_account_123'; // ID du compte transporteur
    
    // Créer un manifeste
    const manifestResult = await createManifestForCarrier(
      client,
      carrierAccount,
      transactionIds,
      {
        maxTransactionsPerManifest: 10,
        waitTimeMinutes: 0
      }
    );
    
    
    return manifestResult;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// FONCTION PRINCIPALE POUR TESTER TOUS LES EXEMPLES
// ============================================================================

export async function executerTousLesExemples() {
  
  try {
    // Exemple 1 : Utilisation simple
    await exempleUtilisationSimple();
    
    // Exemple 2 : Point relais
    await exempleAvecPointRelais();
    
    // Exemple 3 : Avancé avec validation
    await exempleAvanceAvecValidation();
    
    // Exemple 4 : Webhooks
    await exempleGestionWebhooks();
    
    // Exemple 5 : Manifestes
    await exempleGestionManifestes();
    
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// EXPORT DES EXEMPLES
// ============================================================================

export {
  exempleUtilisationSimple,
  exempleAvecPointRelais,
  exempleAvanceAvecValidation,
  exempleGestionWebhooks,
  exempleGestionManifestes,
  executerTousLesExemples
};

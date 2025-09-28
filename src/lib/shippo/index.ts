/**
 * Point d'entrée principal pour l'API Shippo
 * Exporte toutes les fonctions et types nécessaires
 */

import { createShippoClientFromEnv } from './client.js';

// ============================================================================
// EXPORTS PRINCIPAUX
// ============================================================================

// Client principal
export { ShippoClient, createShippoClient, createShippoClientFromEnv } from './client.js';

// Types
export * from './types.js';

// Fonctions utilitaires (avec exports explicites pour éviter les conflits)
export {
  convertToShippoAddress,
  convertServicePointToShippoAddress,
  createSenderAddress,
  createRecipientAddress,
  createServicePointAddress,
  validateAddress,
  createShipmentAddresses,
  getAndValidateAddress,
  validateFrenchAddress,
  validateInternationalAddress,
  convertFromPrismaAddress,
  convertFromPrismaTransaction as convertAddressFromPrisma
} from './addresses.js';

export {
  convertToShippoParcel,
  convertToShippoShipment,
  createShipmentWithValidation,
  createShipmentWithRates,
  getRatesForShipment,
  filterRates,
  selectBestRate,
  sortRates,
  createShipmentWithSortedRates,
  createShipmentWithBestRate,
  convertFromPrismaTransaction as convertShipmentFromPrisma,
  validateShipmentData,
  validateRateSelectionOptions
} from './shipments.js';

export {
  convertToShippoTransaction,
  convertToShippoDirectTransaction,
  purchaseLabel,
  purchaseDirectLabel,
  getTransaction,
  createShipmentAndPurchaseLabel,
  purchaseLabelWithRetry,
  downloadLabel,
  saveLabelAsBase64,
  saveLabelAsDataUrl,
  convertFromPrismaTransaction as convertTransactionFromPrisma,
  validateTransactionData,
  validateDirectTransactionData,
  analyzeTransactionErrors
} from './transactions.js';

export * from './webhooks.js';
export * from './manifests.js';

// Intégration complète
export * from './integration.js';

// Tests
export * from './tests.js';

// ============================================================================
// FONCTIONS DE CONVENIENCE POUR DÉMARRER RAPIDEMENT
// ============================================================================

/**
 * Créer un client Shippo configuré pour votre environnement
 */
export function createShippoClientForProject() {
  return createShippoClientFromEnv();
}

/**
 * Flux rapide : créer et acheter une étiquette
 */
export async function quickLabelPurchase(
  transactionData: any,
  options: {
    preferredCarriers?: string[];
    labelFileType?: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
    preferCheapest?: boolean;
  } = {}
) {
  const { createAndPurchaseLabel } = await import('./integration.js');
  return await createAndPurchaseLabel(transactionData, options);
}

/**
 * Configurer les webhooks pour votre application
 */
export async function setupProjectWebhooks(
  baseUrl: string,
  events: string[] = [
    'transaction.created',
    'transaction.updated',
    'track.updated'
  ]
) {
  const client = createShippoClientForProject();
  const { setupWebhooks } = await import('./webhooks.js');
  return await setupWebhooks(client, baseUrl, events as any);
}

// ============================================================================
// CONSTANTES UTILES
// ============================================================================

export const SHIPPO_EVENTS = {
  TRANSACTION_CREATED: 'transaction.created',
  TRANSACTION_UPDATED: 'transaction.updated',
  TRACK_UPDATED: 'track.updated',
  SHIPMENT_CREATED: 'shipment.created',
  SHIPMENT_UPDATED: 'shipment.updated',
  RATE_CREATED: 'rate.created',
  RATE_UPDATED: 'rate.updated'
} as const;

export const LABEL_FILE_TYPES = {
  PDF: 'PDF',
  PDF_A4: 'PDF_A4',
  PNG: 'PNG',
  ZPLII: 'ZPLII'
} as const;

export const DIMENSION_UNITS = {
  CM: 'cm',
  IN: 'in',
  FT: 'ft',
  MM: 'mm',
  M: 'm',
  YD: 'yd'
} as const;

export const WEIGHT_UNITS = {
  G: 'g',
  OZ: 'oz',
  LB: 'lb',
  KG: 'kg'
} as const;

// ============================================================================
// FONCTIONS DE VALIDATION GLOBALES
// ============================================================================

/**
 * Valider la configuration Shippo
 */
export function validateShippoConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vérifier la clé API
  if (!process.env.SHIPPO_API_TOKEN) {
    errors.push('SHIPPO_API_TOKEN environment variable is required');
  }

  // Vérifier l'URL de base
  if (process.env.SHIPPO_BASE_URL) {
    try {
      new URL(process.env.SHIPPO_BASE_URL);
    } catch {
      errors.push('SHIPPO_BASE_URL must be a valid URL');
    }
  }

  // Vérifier le timeout
  if (process.env.SHIPPO_TIMEOUT) {
    const timeout = parseInt(process.env.SHIPPO_TIMEOUT);
    if (isNaN(timeout) || timeout <= 0) {
      warnings.push('SHIPPO_TIMEOUT should be a positive number');
    }
  }

  // Vérifier les retries
  if (process.env.SHIPPO_RETRIES) {
    const retries = parseInt(process.env.SHIPPO_RETRIES);
    if (isNaN(retries) || retries < 0) {
      warnings.push('SHIPPO_RETRIES should be a non-negative number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Initialiser Shippo avec validation
 */
export function initializeShippo(): {
  client: any;
  config: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
} {
  const config = validateShippoConfig();
  
  if (!config.isValid) {
    throw new Error(`Configuration Shippo invalide: ${config.errors.join(', ')}`);
  }

  if (config.warnings.length > 0) {
    console.warn('Avertissements de configuration Shippo:', config.warnings);
  }

  const client = createShippoClientForProject();
  
  return {
    client,
    config
  };
}

// ============================================================================
// FONCTIONS DE DEBUG ET TEST
// ============================================================================

/**
 * Tester la connexion à l'API Shippo
 */
export async function testShippoConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const client = createShippoClientForProject();
    
    // Essayer de récupérer les comptes transporteurs
    const carrierAccounts = await client.getCarrierAccounts();
    
    return {
      success: true,
      message: 'Connexion Shippo réussie',
      details: {
        carrierAccountsCount: carrierAccounts.length,
        carrierAccounts: carrierAccounts.map((acc: any) => ({
          id: acc.object_id,
          carrier: acc.carrier,
          active: acc.active
        }))
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur de connexion Shippo: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      details: error
    };
  }
}

/**
 * Tester la création d'une adresse
 */
export async function testAddressCreation(testAddress: any): Promise<{
  success: boolean;
  message: string;
  addressId?: string;
  details?: any;
}> {
  try {
    const client = createShippoClientForProject();
    const { createRecipientAddress } = await import('./addresses.js');
    
    const address = await createRecipientAddress(client, testAddress);
    
    return {
      success: true,
      message: 'Création d\'adresse réussie',
      addressId: address.object_id,
      details: {
        address: {
          id: address.object_id,
          state: address.object_state,
          city: address.city,
          country: address.country
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur de création d'adresse: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      details: error
    };
  }
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  createShippoClientForProject,
  quickLabelPurchase,
  setupProjectWebhooks,
  validateShippoConfig,
  initializeShippo,
  testShippoConnection,
  testAddressCreation,
  SHIPPO_EVENTS,
  LABEL_FILE_TYPES,
  DIMENSION_UNITS,
  WEIGHT_UNITS
};

/**
 * Exemple d'intégration complète du flux "devis → achat étiquette" avec Shippo
 * Compatible avec votre système existant
 */

import { ShippoClient, createShippoClientFromEnv } from './client.js';
import { 
  createShipmentAddresses,
  convertFromPrismaTransaction as convertAddressFromPrisma
} from './addresses.js';
import { 
  createShipmentWithBestRate,
  convertFromPrismaTransaction as convertShipmentFromPrisma,
  RateSelectionOptions
} from './shipments.js';
import { 
  purchaseLabel,
  convertFromPrismaTransaction as convertTransactionFromPrisma,
  LabelOptions
} from './transactions.js';
import { WebhookManager } from './webhooks.js';

// ============================================================================
// TYPES POUR L'INTÉGRATION COMPLÈTE
// ============================================================================

export interface CompleteShippingFlowResult {
  // Adresses créées
  addresses: {
    senderAddressId?: string;
    recipientAddressId: string;
    servicePointAddressId?: string;
  };
  
  // Shipment créé
  shipment: any; // ShippoShipmentResponse
  
  // Rates disponibles
  rates: any[]; // ShippoRateResponse[]
  
  // Rate sélectionné
  selectedRate: any; // ShippoRateResponse
  
  // Transaction créée
  transaction: any; // ShippoTransactionResponse
  
  // Résultat de l'étiquette
  labelResult: {
    status: 'SUCCESS' | 'ERROR' | 'PENDING';
    labelUrl?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    messages?: string[];
  };
  
  // Métadonnées
  metadata: {
    totalCost: number;
    currency: string;
    carrier: string;
    service: string;
    estimatedDays: number;
    createdAt: string;
  };
}

export interface ShippingFlowOptions {
  // Options de sélection de rate
  rateSelection: RateSelectionOptions;
  
  // Options d'étiquette
  labelOptions: LabelOptions;
  
  // Configuration
  validateAddresses?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

// ============================================================================
// FONCTION PRINCIPALE : FLUX COMPLET
// ============================================================================

/**
 * Flux complet : devis → achat étiquette
 * Cette fonction orchestre tout le processus
 */
export async function executeCompleteShippingFlow(
  transactionData: any, // Vos données de transaction Prisma
  options: ShippingFlowOptions
): Promise<CompleteShippingFlowResult> {
  
  // Initialiser le client Shippo
  const client = createShippoClientFromEnv();
  
  try {
    // 1. Créer les adresses
    const addressData = convertAddressFromPrisma(transactionData);
    const addresses = await createShipmentAddresses(client, addressData);
    
    // 2. Créer le shipment et obtenir les rates
    const shipmentData = convertShipmentFromPrisma(transactionData);
    shipmentData.senderAddressId = addresses.senderAddressId;
    shipmentData.recipientAddressId = addresses.recipientAddressId;
    
    const { shipment, rates, bestRate } = await createShipmentWithBestRate(
      client,
      shipmentData,
      options.rateSelection
    );
    
    if (!bestRate) {
      throw new Error('Aucun rate valide trouvé selon les critères');
    }
    
    // 3. Acheter l'étiquette
    const transactionDataForLabel = convertTransactionFromPrisma(transactionData);
    transactionDataForLabel.rateId = bestRate.object_id;
    transactionDataForLabel.labelOptions = options.labelOptions;
    
    const labelResult = await purchaseLabel(client, transactionDataForLabel);
    
    // 4. Construire le résultat complet
    const result: CompleteShippingFlowResult = {
      addresses,
      shipment,
      rates,
      selectedRate: bestRate,
      transaction: labelResult.transaction,
      labelResult: {
        status: labelResult.status,
        labelUrl: labelResult.labelUrl,
        trackingNumber: labelResult.trackingNumber,
        trackingUrl: labelResult.trackingUrl,
        messages: labelResult.messages
      },
      metadata: {
        totalCost: parseFloat(bestRate.amount),
        currency: bestRate.currency,
        carrier: bestRate.carrier,
        service: bestRate.servicelevel.name,
        estimatedDays: bestRate.days,
        createdAt: new Date().toISOString()
      }
    };
    
    
    return result;
    
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// FONCTIONS DE CONVENIENCE POUR VOTRE SYSTÈME
// ============================================================================

/**
 * Flux simplifié : créer et acheter une étiquette en un seul appel
 */
export async function createAndPurchaseLabel(
  transactionData: any,
  options: {
    preferredCarriers?: string[];
    labelFileType?: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
    preferCheapest?: boolean;
    preferFastest?: boolean;
  } = {}
): Promise<CompleteShippingFlowResult> {
  const flowOptions: ShippingFlowOptions = {
    rateSelection: {
      preferredCarriers: options.preferredCarriers,
      preferCheapest: options.preferCheapest,
      preferFastest: options.preferFastest
    },
    labelOptions: {
      fileType: options.labelFileType || 'PDF',
      async: false
    },
    validateAddresses: true,
    retryOnError: true,
    maxRetries: 3
  };
  
  return await executeCompleteShippingFlow(transactionData, flowOptions);
}

/**
 * Flux pour point relais
 */
export async function createAndPurchaseLabelForServicePoint(
  transactionData: any,
  servicePointData: any,
  options: ShippingFlowOptions = {
    rateSelection: { preferCheapest: true },
    labelOptions: { fileType: 'PDF', async: false }
  }
): Promise<CompleteShippingFlowResult> {
  // Ajouter les données du point relais
  const transactionWithServicePoint = {
    ...transactionData,
    servicePoint: servicePointData
  };
  
  return await executeCompleteShippingFlow(transactionWithServicePoint, options);
}

/**
 * Flux avec validation d'adresse
 */
export async function createAndPurchaseLabelWithValidation(
  transactionData: any,
  options: ShippingFlowOptions = {
    rateSelection: { preferCheapest: true },
    labelOptions: { fileType: 'PDF', async: false },
    validateAddresses: true
  }
): Promise<CompleteShippingFlowResult> {
  const client = createShippoClientFromEnv();
  
  // Valider les adresses avant de continuer
  if (options.validateAddresses) {
    
    const addressData = convertAddressFromPrisma(transactionData);
    
    // Valider l'adresse destinataire
    const { validateAddress } = await import('./addresses.js');
    const recipientValidation = await validateAddress(client, addressData.recipientAddress);
    
    if (!recipientValidation.isValid) {
    }
    
    // Valider l'adresse expéditeur si disponible
    if (addressData.senderAddress) {
      const senderValidation = await validateAddress(client, addressData.senderAddress);
      if (!senderValidation.isValid) {
      }
    }
  }
  
  return await executeCompleteShippingFlow(transactionData, options);
}

// ============================================================================
// FONCTIONS DE GESTION DES ERREURS ET RETRY
// ============================================================================

/**
 * Flux avec retry automatique
 */
export async function executeShippingFlowWithRetry(
  transactionData: any,
  options: ShippingFlowOptions,
  maxRetries: number = 3
): Promise<CompleteShippingFlowResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await executeCompleteShippingFlow(transactionData, options);
    } catch (error) {
      lastError = error as Error;
      
      // Si c'est une erreur non récupérable, arrêter
      if (isNonRetryableError(error as Error)) {
        break;
      }
      
      // Attendre avant de réessayer
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw new Error(`Flux échoué après ${maxRetries} tentatives. Dernière erreur: ${lastError?.message}`);
}

/**
 * Déterminer si une erreur est récupérable
 */
function isNonRetryableError(error: Error): boolean {
  const nonRetryablePatterns = [
    'INVALID_RATE',
    'INSUFFICIENT_FUNDS',
    'INVALID_ADDRESS',
    'CARRIER_NOT_AVAILABLE',
    'VALIDATION_ERROR'
  ];
  
  return nonRetryablePatterns.some(pattern => 
    error.message.toUpperCase().includes(pattern)
  );
}

// ============================================================================
// FONCTIONS DE RAPPORT ET LOGGING
// ============================================================================

/**
 * Générer un rapport de flux
 */
export function generateFlowReport(result: CompleteShippingFlowResult): {
  summary: {
    success: boolean;
    totalCost: number;
    currency: string;
    carrier: string;
    service: string;
    estimatedDays: number;
    trackingNumber?: string;
  };
  details: {
    addressesCreated: number;
    ratesAvailable: number;
    labelGenerated: boolean;
    errors?: string[];
  };
} {
  return {
    summary: {
      success: result.labelResult.status === 'SUCCESS',
      totalCost: result.metadata.totalCost,
      currency: result.metadata.currency,
      carrier: result.metadata.carrier,
      service: result.metadata.service,
      estimatedDays: result.metadata.estimatedDays,
      trackingNumber: result.labelResult.trackingNumber
    },
    details: {
      addressesCreated: Object.values(result.addresses).filter(Boolean).length,
      ratesAvailable: result.rates.length,
      labelGenerated: !!result.labelResult.labelUrl,
      errors: result.labelResult.messages
    }
  };
}

/**
 * Logger les détails du flux
 */
export function logFlowDetails(result: CompleteShippingFlowResult): void {
  
  if (result.labelResult.messages && result.labelResult.messages.length > 0) {
    result.labelResult.messages.forEach(msg => console.log(`  - ${msg}`));
  }
  
}

// ============================================================================
// FONCTIONS D'INTÉGRATION AVEC VOTRE SYSTÈME
// ============================================================================

/**
 * Intégrer le résultat dans votre base de données Prisma
 */
export async function integrateResultIntoDatabase(
  result: CompleteShippingFlowResult,
  transactionId: string
): Promise<void> {
  // Cette fonction nécessiterait d'accéder à votre instance Prisma
  // Adaptez selon votre modèle de données
  
  
  /*
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      // Adresses Shippo
      shippoSenderAddressId: result.addresses.senderAddressId,
      shippoRecipientAddressId: result.addresses.recipientAddressId,
      shippoServicePointAddressId: result.addresses.servicePointAddressId,
      
      // Shipment
      shippoShipmentId: result.shipment.object_id,
      
      // Rate sélectionné
      shippoRateId: result.selectedRate.object_id,
      shippingCost: result.metadata.totalCost,
      shippingCurrency: result.metadata.currency,
      carrier: result.metadata.carrier,
      service: result.metadata.service,
      estimatedDays: result.metadata.estimatedDays,
      
      // Transaction et étiquette
      shippoTransactionId: result.transaction.object_id,
      trackingNumber: result.labelResult.trackingNumber,
      trackingUrl: result.labelResult.trackingUrl,
      labelUrl: result.labelResult.labelUrl,
      
      // Statut
      status: result.labelResult.status === 'SUCCESS' ? 'SHIPPED' : 'ERROR',
      
      // Métadonnées
      updatedAt: new Date()
    }
  });
  */
}

/**
 * Flux complet avec intégration en base de données
 */
export async function executeCompleteFlowWithDatabaseIntegration(
  transactionData: any,
  options: ShippingFlowOptions
): Promise<CompleteShippingFlowResult> {
  // Exécuter le flux
  const result = await executeCompleteShippingFlow(transactionData, options);
  
  // Intégrer en base de données
  await integrateResultIntoDatabase(result, transactionData.id);
  
  // Générer le rapport
  const report = generateFlowReport(result);
  logFlowDetails(result);
  
  return result;
}

// ============================================================================
// EXPORT DES FONCTIONS PRINCIPALES
// ============================================================================

// Les exports sont déjà définis dans les déclarations des fonctions ci-dessus

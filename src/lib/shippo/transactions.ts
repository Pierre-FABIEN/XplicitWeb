/**
 * Fonctions utilitaires pour la gestion des transactions et étiquettes Shippo
 * Compatible avec les données de votre système existant
 */

import { ShippoClient } from './client.js';
import { 
  ShippoTransaction, 
  ShippoTransactionResponse,
  ShippoCreateTransactionRequest,
  ShippoCreateDirectTransactionRequest,
  ShippoCreateShipmentRequest
} from './types.js';

// ============================================================================
// TYPES POUR L'INTÉGRATION AVEC VOTRE SYSTÈME
// ============================================================================

export interface LabelOptions {
  // Type de fichier d'étiquette
  fileType: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
  
  // Mode d'exécution
  async: boolean;
  
  // Métadonnées
  metadata?: string;
}

export interface TransactionData {
  // Rate sélectionné
  rateId: string;
  
  // Options d'étiquette
  labelOptions: LabelOptions;
  
  // Métadonnées supplémentaires
  metadata?: string;
}

export interface DirectTransactionData {
  // Shipment complet
  shipment: ShippoCreateShipmentRequest;
  
  // Transporteur et service spécifiques
  carrierAccount: string;
  serviceLevelToken: string;
  
  // Options d'étiquette
  labelOptions: LabelOptions;
  
  // Métadonnées
  metadata?: string;
}

export interface LabelResult {
  // Informations de la transaction
  transaction: ShippoTransactionResponse;
  
  // URL de l'étiquette
  labelUrl?: string;
  
  // Numéro de suivi
  trackingNumber?: string;
  
  // URL de suivi
  trackingUrl?: string;
  
  // Statut
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  
  // Messages d'erreur
  messages?: string[];
}

// ============================================================================
// FONCTIONS DE CONVERSION
// ============================================================================

/**
 * Convertir les options d'étiquette vers le format Shippo
 */
export function convertToShippoTransaction(transactionData: TransactionData): ShippoCreateTransactionRequest {
  return {
    rate: transactionData.rateId,
    label_file_type: transactionData.labelOptions.fileType,
    async: transactionData.labelOptions.async,
    metadata: transactionData.metadata || transactionData.labelOptions.metadata
  };
}

/**
 * Convertir les données de transaction directe vers le format Shippo
 */
export function convertToShippoDirectTransaction(transactionData: DirectTransactionData): ShippoCreateDirectTransactionRequest {
  return {
    shipment: transactionData.shipment,
    carrier_account: transactionData.carrierAccount,
    servicelevel_token: transactionData.serviceLevelToken,
    label_file_type: transactionData.labelOptions.fileType,
    async: transactionData.labelOptions.async,
    metadata: transactionData.metadata || transactionData.labelOptions.metadata
  };
}

// ============================================================================
// FONCTIONS DE GESTION DES TRANSACTIONS
// ============================================================================

/**
 * Acheter une étiquette à partir d'un rate
 */
export async function purchaseLabel(
  client: ShippoClient,
  transactionData: TransactionData
): Promise<LabelResult> {
  const shippoTransaction = convertToShippoTransaction(transactionData);
  
  try {
    const transaction = await client.createTransaction(shippoTransaction);
    
    return {
      transaction,
      labelUrl: transaction.label_url,
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider,
      status: transaction.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
      messages: transaction.messages?.map(msg => msg.text)
    };
  } catch (error) {
    return {
      transaction: {} as ShippoTransactionResponse,
      status: 'ERROR',
      messages: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Acheter une étiquette en un seul appel (shipment + transaction)
 */
export async function purchaseDirectLabel(
  client: ShippoClient,
  transactionData: DirectTransactionData
): Promise<LabelResult> {
  const shippoTransaction = convertToShippoDirectTransaction(transactionData);
  
  try {
    const transaction = await client.createDirectTransaction(shippoTransaction);
    
    return {
      transaction,
      labelUrl: transaction.label_url,
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider,
      status: transaction.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
      messages: transaction.messages?.map(msg => msg.text)
    };
  } catch (error) {
    return {
      transaction: {} as ShippoTransactionResponse,
      status: 'ERROR',
      messages: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Récupérer une transaction existante
 */
export async function getTransaction(
  client: ShippoClient,
  transactionId: string
): Promise<ShippoTransactionResponse> {
  return await client.getTransaction(transactionId);
}

// ============================================================================
// FONCTIONS DE CONVENIENCE POUR VOTRE SYSTÈME
// ============================================================================

/**
 * Flux complet : créer un shipment, sélectionner un rate et acheter l'étiquette
 */
export async function createShipmentAndPurchaseLabel(
  client: ShippoClient,
  shipmentData: any, // Utilisez le type ShipmentData de shipments.ts
  rateSelectionOptions: any, // Utilisez le type RateSelectionOptions de shipments.ts
  labelOptions: LabelOptions
): Promise<{
  shipment: any;
  rates: any[];
  selectedRate: any;
  labelResult: LabelResult;
}> {
  // Créer le shipment et récupérer les rates
  const { shipment, rates } = await client.createShipmentWithRates(shipmentData);
  
  if (rates.length === 0) {
    throw new Error('Aucun tarif disponible pour ce shipment');
  }

  // Sélectionner le meilleur rate
  const { selectBestRate } = await import('./shipments.js');
  const selectedRate = selectBestRate(rates, rateSelectionOptions);
  
  if (!selectedRate) {
    throw new Error('Aucun rate valide trouvé selon les critères');
  }

  // Acheter l'étiquette
  const labelResult = await purchaseLabel(client, {
    rateId: selectedRate.object_id,
    labelOptions
  });

  return {
    shipment,
    rates,
    selectedRate,
    labelResult
  };
}

/**
 * Acheter une étiquette avec retry automatique
 */
export async function purchaseLabelWithRetry(
  client: ShippoClient,
  transactionData: TransactionData,
  maxRetries: number = 3
): Promise<LabelResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await purchaseLabel(client, transactionData);
      
      if (result.status === 'SUCCESS') {
        return result;
      }
      
      // Si c'est une erreur non récupérable, arrêter
      if (result.messages?.some(msg => 
        msg.includes('INVALID_RATE') || 
        msg.includes('INSUFFICIENT_FUNDS') ||
        msg.includes('CARRIER_ERROR')
      )) {
        return result;
      }
      
      // Attendre avant de réessayer
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  return {
    transaction: {} as ShippoTransactionResponse,
    status: 'ERROR',
    messages: [lastError?.message || 'Max retries exceeded']
  };
}

// ============================================================================
// FONCTIONS DE GESTION DES ÉTIQUETTES
// ============================================================================

/**
 * Télécharger une étiquette depuis son URL
 */
export async function downloadLabel(labelUrl: string): Promise<Buffer> {
  const response = await fetch(labelUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download label: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Sauvegarder une étiquette en base64
 */
export async function saveLabelAsBase64(labelUrl: string): Promise<string> {
  const buffer = await downloadLabel(labelUrl);
  return buffer.toString('base64');
}

/**
 * Sauvegarder une étiquette en data URL
 */
export async function saveLabelAsDataUrl(labelUrl: string, mimeType: string = 'application/pdf'): Promise<string> {
  const base64 = await saveLabelAsBase64(labelUrl);
  return `data:${mimeType};base64,${base64}`;
}

// ============================================================================
// FONCTIONS DE CONVERSION DEPUIS VOS DONNÉES EXISTANTES
// ============================================================================

/**
 * Convertir les données de transaction depuis votre modèle Prisma
 * Adaptez cette fonction selon votre schéma Prisma exact
 */
export function convertFromPrismaTransaction(prismaTransaction: any): TransactionData {
  return {
    rateId: prismaTransaction.shippo_rate_id || '',
    labelOptions: {
      fileType: prismaTransaction.label_file_type || 'PDF',
      async: prismaTransaction.async || false,
      metadata: `Transaction ${prismaTransaction.id}`
    },
    metadata: prismaTransaction.metadata
  };
}

/**
 * Convertir les données de transaction directe depuis votre modèle Prisma
 * Adaptez cette fonction selon votre schéma Prisma exact
 */
export function convertFromPrismaDirectTransaction(prismaTransaction: any): DirectTransactionData {
  return {
    shipment: {
      address_from: prismaTransaction.sender_address_id || '',
      address_to: prismaTransaction.recipient_address_id,
      parcels: [{
        length: prismaTransaction.package_length || 30,
        width: prismaTransaction.package_width || 20,
        height: prismaTransaction.package_height || 10,
        distance_unit: 'cm',
        weight: prismaTransaction.package_weight || 0.5,
        mass_unit: 'kg',
        metadata: `Transaction ${prismaTransaction.id}`
      }],
      carrier_accounts: prismaTransaction.preferred_carriers,
      metadata: `Transaction ${prismaTransaction.id}`
    },
    carrierAccount: prismaTransaction.carrier_account || '',
    serviceLevelToken: prismaTransaction.service_level_token || '',
    labelOptions: {
      fileType: prismaTransaction.label_file_type || 'PDF',
      async: prismaTransaction.async || false,
      metadata: `Transaction ${prismaTransaction.id}`
    },
    metadata: prismaTransaction.metadata
  };
}

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Valider les données de transaction avant achat
 */
export function validateTransactionData(transactionData: TransactionData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!transactionData.rateId) {
    errors.push('Rate ID is required');
  }

  if (!transactionData.labelOptions.fileType) {
    errors.push('Label file type is required');
  }

  const validFileTypes = ['PDF', 'PDF_A4', 'PNG', 'ZPLII'];
  if (!validFileTypes.includes(transactionData.labelOptions.fileType)) {
    errors.push(`Invalid file type. Must be one of: ${validFileTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valider les données de transaction directe
 */
export function validateDirectTransactionData(transactionData: DirectTransactionData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!transactionData.shipment.address_to) {
    errors.push('Recipient address is required');
  }

  if (!transactionData.shipment.parcels || transactionData.shipment.parcels.length === 0) {
    errors.push('At least one parcel is required');
  }

  if (!transactionData.carrierAccount) {
    errors.push('Carrier account is required');
  }

  if (!transactionData.serviceLevelToken) {
    errors.push('Service level token is required');
  }

  if (!transactionData.labelOptions.fileType) {
    errors.push('Label file type is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// FONCTIONS DE GESTION DES ERREURS
// ============================================================================

/**
 * Analyser les erreurs de transaction
 */
export function analyzeTransactionErrors(transaction: ShippoTransactionResponse): {
  isRetryable: boolean;
  errorType: 'RATE_ERROR' | 'CARRIER_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  suggestions: string[];
} {
  const messages = transaction.messages || [];
  
  if (messages.length === 0) {
    return {
      isRetryable: false,
      errorType: 'UNKNOWN_ERROR',
      suggestions: ['Contactez le support Shippo']
    };
  }

  const errorText = messages.map(msg => msg.text).join(' ').toLowerCase();
  
  // Erreurs de rate
  if (errorText.includes('rate') || errorText.includes('invalid rate')) {
    return {
      isRetryable: false,
      errorType: 'RATE_ERROR',
      suggestions: [
        'Vérifiez que le rate est toujours valide',
        'Créez un nouveau shipment pour obtenir de nouveaux rates',
        'Vérifiez les paramètres du shipment (adresses, dimensions, poids)'
      ]
    };
  }

  // Erreurs de transporteur
  if (errorText.includes('carrier') || errorText.includes('service')) {
    return {
      isRetryable: true,
      errorType: 'CARRIER_ERROR',
      suggestions: [
        'Réessayez dans quelques minutes',
        'Vérifiez que le transporteur est disponible',
        'Essayez avec un autre transporteur'
      ]
    };
  }

  // Erreurs de validation
  if (errorText.includes('validation') || errorText.includes('invalid')) {
    return {
      isRetryable: false,
      errorType: 'VALIDATION_ERROR',
      suggestions: [
        'Vérifiez les données du shipment',
        'Vérifiez les adresses',
        'Vérifiez les dimensions et le poids du colis'
      ]
    };
  }

  return {
    isRetryable: true,
    errorType: 'UNKNOWN_ERROR',
    suggestions: ['Réessayez dans quelques minutes', 'Contactez le support si le problème persiste']
  };
}

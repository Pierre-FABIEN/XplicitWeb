/**
 * Fonctions utilitaires pour la gestion des manifests Shippo
 * Les manifests permettent de regrouper plusieurs transactions pour un transporteur
 */

import { ShippoClient } from './client.js';
import { 
  ShippoManifest, 
  ShippoManifestResponse,
  ShippoCreateManifestRequest
} from './types.js';

// ============================================================================
// TYPES POUR L'INTÉGRATION AVEC VOTRE SYSTÈME
// ============================================================================

export interface ManifestData {
  // Transactions à regrouper
  transactionIds: string[];
  
  // Transporteur
  carrierAccount: string;
  
  // Métadonnées
  metadata?: string;
}

export interface ManifestResult {
  // Informations du manifeste
  manifest: ShippoManifestResponse;
  
  // URL du manifeste (si disponible)
  manifestUrl?: string;
  
  // Statut
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  
  // Messages d'erreur
  messages?: string[];
  
  // Nombre de transactions regroupées
  transactionCount: number;
}

export interface ManifestOptions {
  // Nombre maximum de transactions par manifeste
  maxTransactionsPerManifest?: number;
  
  // Délai d'attente avant création du manifeste (en minutes)
  waitTimeMinutes?: number;
  
  // Filtrer par transporteur
  carrierFilter?: string;
  
  // Filtrer par statut de transaction
  transactionStatusFilter?: string[];
}

// ============================================================================
// FONCTIONS DE CONVERSION
// ============================================================================

/**
 * Convertir les données de manifeste vers le format Shippo
 */
export function convertToShippoManifest(manifestData: ManifestData): ShippoCreateManifestRequest {
  return {
    transactions: manifestData.transactionIds,
    carrier_account: manifestData.carrierAccount,
    metadata: manifestData.metadata
  };
}

// ============================================================================
// FONCTIONS DE GESTION DES MANIFESTS
// ============================================================================

/**
 * Créer un manifeste
 */
export async function createManifest(
  client: ShippoClient,
  manifestData: ManifestData
): Promise<ManifestResult> {
  const shippoManifest = convertToShippoManifest(manifestData);
  
  try {
    const manifest = await client.createManifest(shippoManifest);
    
    return {
      manifest,
      manifestUrl: manifest.manifest_url,
      status: manifest.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
      messages: manifest.messages?.map(msg => msg.text),
      transactionCount: manifestData.transactionIds.length
    };
  } catch (error) {
    return {
      manifest: {} as ShippoManifestResponse,
      status: 'ERROR',
      messages: [error instanceof Error ? error.message : 'Unknown error'],
      transactionCount: manifestData.transactionIds.length
    };
  }
}

/**
 * Récupérer un manifeste par ID
 */
export async function getManifest(
  client: ShippoClient,
  manifestId: string
): Promise<ShippoManifestResponse> {
  return await client.getManifest(manifestId);
}

// ============================================================================
// FONCTIONS DE CONVENIENCE POUR VOTRE SYSTÈME
// ============================================================================

/**
 * Créer un manifeste pour toutes les transactions d'un transporteur
 */
export async function createManifestForCarrier(
  client: ShippoClient,
  carrierAccount: string,
  transactionIds: string[],
  options: ManifestOptions = {}
): Promise<ManifestResult> {
  const maxTransactions = options.maxTransactionsPerManifest || 50;
  
  // Diviser en lots si nécessaire
  if (transactionIds.length > maxTransactions) {
    const batches = [];
    for (let i = 0; i < transactionIds.length; i += maxTransactions) {
      batches.push(transactionIds.slice(i, i + maxTransactions));
    }
    
    // Créer un manifeste pour chaque lot
    const results = [];
    for (const batch of batches) {
      const result = await createManifest(client, {
        transactionIds: batch,
        carrierAccount,
        metadata: `Manifeste lot ${batches.indexOf(batch) + 1}/${batches.length}`
      });
      results.push(result);
    }
    
    // Retourner le premier résultat (ou créer un résultat combiné)
    return results[0];
  }
  
  return await createManifest(client, {
    transactionIds,
    carrierAccount,
    metadata: `Manifeste pour ${carrierAccount} - ${transactionIds.length} transactions`
  });
}

/**
 * Créer des manifestes automatiquement pour les transactions en attente
 */
export async function createAutomaticManifests(
  client: ShippoClient,
  options: ManifestOptions = {}
): Promise<ManifestResult[]> {
  // Cette fonction nécessiterait d'accéder à votre base de données
  // pour récupérer les transactions en attente de manifeste
  
  
  // Exemple d'implémentation - adaptez selon votre modèle Prisma
  /*
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      status: 'SHIPPED',
      manifestId: null,
      shippoTransactionId: { not: null }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  // Grouper par transporteur
  const transactionsByCarrier = new Map<string, string[]>();
  
  for (const transaction of pendingTransactions) {
    const carrier = transaction.carrier; // À adapter selon votre modèle
    if (!transactionsByCarrier.has(carrier)) {
      transactionsByCarrier.set(carrier, []);
    }
    transactionsByCarrier.get(carrier)!.push(transaction.shippoTransactionId);
  }
  
  // Créer un manifeste pour chaque transporteur
  const results = [];
  for (const [carrier, transactionIds] of transactionsByCarrier) {
    if (transactionIds.length > 0) {
      const result = await createManifestForCarrier(
        client,
        carrier,
        transactionIds,
        options
      );
      results.push(result);
    }
  }
  
  return results;
  */
  
  // Pour l'instant, retourner un tableau vide
  return [];
}

/**
 * Créer un manifeste avec retry automatique
 */
export async function createManifestWithRetry(
  client: ShippoClient,
  manifestData: ManifestData,
  maxRetries: number = 3
): Promise<ManifestResult> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await createManifest(client, manifestData);
      
      if (result.status === 'SUCCESS') {
        return result;
      }
      
      // Si c'est une erreur non récupérable, arrêter
      if (result.messages?.some(msg => 
        msg.includes('INVALID_TRANSACTION') || 
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
    manifest: {} as ShippoManifestResponse,
    status: 'ERROR',
    messages: [lastError?.message || 'Max retries exceeded'],
    transactionCount: manifestData.transactionIds.length
  };
}

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Valider les données de manifeste
 */
export function validateManifestData(manifestData: ManifestData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!manifestData.transactionIds || manifestData.transactionIds.length === 0) {
    errors.push('At least one transaction ID is required');
  }

  if (!manifestData.carrierAccount) {
    errors.push('Carrier account is required');
  }

  // Vérifier que tous les IDs de transaction sont des strings non vides
  const invalidIds = manifestData.transactionIds.filter(id => 
    !id || typeof id !== 'string' || id.trim() === ''
  );
  
  if (invalidIds.length > 0) {
    errors.push('All transaction IDs must be non-empty strings');
  }

  // Vérifier les doublons
  const uniqueIds = new Set(manifestData.transactionIds);
  if (uniqueIds.size !== manifestData.transactionIds.length) {
    errors.push('Duplicate transaction IDs are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valider les options de manifeste
 */
export function validateManifestOptions(options: ManifestOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.maxTransactionsPerManifest && options.maxTransactionsPerManifest <= 0) {
    errors.push('Maximum transactions per manifest must be greater than 0');
  }

  if (options.waitTimeMinutes && options.waitTimeMinutes < 0) {
    errors.push('Wait time cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// FONCTIONS DE CONVERSION DEPUIS VOS DONNÉES EXISTANTES
// ============================================================================

/**
 * Convertir les données de manifeste depuis votre modèle Prisma
 * Adaptez cette fonction selon votre schéma Prisma exact
 */
export function convertFromPrismaManifest(prismaManifest: any): ManifestData {
  return {
    transactionIds: prismaManifest.transactionIds || [],
    carrierAccount: prismaManifest.carrierAccount || '',
    metadata: prismaManifest.metadata
  };
}

/**
 * Créer un manifeste à partir de transactions Prisma
 */
export function createManifestFromPrismaTransactions(
  transactions: any[],
  carrierAccount: string
): ManifestData {
  const transactionIds = transactions
    .filter(tx => tx.shippoTransactionId)
    .map(tx => tx.shippoTransactionId);
  
  return {
    transactionIds,
    carrierAccount,
    metadata: `Manifeste créé automatiquement - ${transactionIds.length} transactions`
  };
}

// ============================================================================
// FONCTIONS DE GESTION DES ERREURS
// ============================================================================

/**
 * Analyser les erreurs de manifeste
 */
export function analyzeManifestErrors(manifest: ShippoManifestResponse): {
  isRetryable: boolean;
  errorType: 'TRANSACTION_ERROR' | 'CARRIER_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  suggestions: string[];
} {
  const messages = manifest.messages || [];
  
  if (messages.length === 0) {
    return {
      isRetryable: false,
      errorType: 'UNKNOWN_ERROR',
      suggestions: ['Contactez le support Shippo']
    };
  }

  const errorText = messages.map(msg => msg.text).join(' ').toLowerCase();
  
  // Erreurs de transaction
  if (errorText.includes('transaction') || errorText.includes('invalid transaction')) {
    return {
      isRetryable: false,
      errorType: 'TRANSACTION_ERROR',
      suggestions: [
        'Vérifiez que toutes les transactions sont valides',
        'Vérifiez que les transactions appartiennent au même transporteur',
        'Vérifiez que les transactions sont dans le bon statut'
      ]
    };
  }

  // Erreurs de transporteur
  if (errorText.includes('carrier') || errorText.includes('account')) {
    return {
      isRetryable: true,
      errorType: 'CARRIER_ERROR',
      suggestions: [
        'Vérifiez que le compte transporteur est valide',
        'Réessayez dans quelques minutes',
        'Contactez le transporteur si le problème persiste'
      ]
    };
  }

  // Erreurs de validation
  if (errorText.includes('validation') || errorText.includes('invalid')) {
    return {
      isRetryable: false,
      errorType: 'VALIDATION_ERROR',
      suggestions: [
        'Vérifiez les données du manifeste',
        'Vérifiez que toutes les transactions sont du même transporteur',
        'Vérifiez le format des IDs de transaction'
      ]
    };
  }

  return {
    isRetryable: true,
    errorType: 'UNKNOWN_ERROR',
    suggestions: ['Réessayez dans quelques minutes', 'Contactez le support si le problème persiste']
  };
}

// ============================================================================
// FONCTIONS DE RAPPORT
// ============================================================================

/**
 * Générer un rapport de manifeste
 */
export function generateManifestReport(manifest: ShippoManifestResponse): {
  manifestId: string;
  status: string;
  transactionCount: number;
  manifestUrl?: string;
  createdAt: string;
  errors?: string[];
} {
  return {
    manifestId: manifest.object_id,
    status: manifest.status || 'UNKNOWN',
    transactionCount: manifest.transactions?.length || 0,
    manifestUrl: manifest.manifest_url,
    createdAt: manifest.object_created,
    errors: manifest.messages?.map(msg => msg.text)
  };
}

/**
 * Générer un rapport de plusieurs manifestes
 */
export function generateManifestsReport(manifests: ShippoManifestResponse[]): {
  totalManifests: number;
  successfulManifests: number;
  failedManifests: number;
  totalTransactions: number;
  manifests: Array<{
    manifestId: string;
    status: string;
    transactionCount: number;
    createdAt: string;
  }>;
} {
  const successfulManifests = manifests.filter(m => m.status === 'SUCCESS').length;
  const failedManifests = manifests.filter(m => m.status === 'ERROR').length;
  const totalTransactions = manifests.reduce((sum, m) => sum + (m.transactions?.length || 0), 0);

  return {
    totalManifests: manifests.length,
    successfulManifests,
    failedManifests,
    totalTransactions,
    manifests: manifests.map(m => ({
      manifestId: m.object_id,
      status: m.status || 'UNKNOWN',
      transactionCount: m.transactions?.length || 0,
      createdAt: m.object_created
    }))
  };
}

/**
 * Fonctions utilitaires pour la gestion des webhooks Shippo
 * Compatible avec votre système existant
 */

import { ShippoClient } from './client.js';
import type { 
  ShippoWebhook, 
  ShippoWebhookResponse,
  ShippoCreateWebhookRequest,
  ShippoWebhookEvent
} from './types.js';

// ============================================================================
// TYPES POUR L'INTÉGRATION AVEC VOTRE SYSTÈME
// ============================================================================

export interface WebhookConfig {
  // URL du webhook
  url: string;
  
  // Événements à écouter
  events: ShippoWebhookEvent[];
  
  // Métadonnées
  metadata?: string;
  
  // Configuration de sécurité
  secret?: string;
}

export interface WebhookPayload {
  // Type d'événement
  event: ShippoWebhookEvent;
  
  // Données de l'objet
  data: {
    object_id: string;
    object_type: string;
    object_state: string;
    object_created: string;
    object_updated: string;
    object_owner: string;
    
    // Données spécifiques selon le type d'objet
    [key: string]: any;
  };
  
  // Métadonnées
  metadata?: string;
}

export interface WebhookHandler {
  // Type d'événement géré
  event: ShippoWebhookEvent;
  
  // Fonction de traitement
  handler: (payload: WebhookPayload) => Promise<void>;
  
  // Description
  description?: string;
}

// ============================================================================
// FONCTIONS DE GESTION DES WEBHOOKS
// ============================================================================

/**
 * Créer un webhook
 */
export async function createWebhook(
  client: ShippoClient,
  config: WebhookConfig
): Promise<ShippoWebhookResponse> {
  const webhookRequest: ShippoCreateWebhookRequest = {
    url: config.url,
    events: config.events,
    metadata: config.metadata
  };

  return await client.createWebhook(webhookRequest);
}

/**
 * Récupérer tous les webhooks
 */
export async function getAllWebhooks(client: ShippoClient): Promise<ShippoWebhookResponse[]> {
  return await client.getWebhooks();
}

/**
 * Récupérer un webhook par ID
 */
export async function getWebhook(
  client: ShippoClient,
  webhookId: string
): Promise<ShippoWebhookResponse> {
  return await client.getWebhook(webhookId);
}

/**
 * Supprimer un webhook
 */
export async function deleteWebhook(
  client: ShippoClient,
  webhookId: string
): Promise<void> {
  await client.deleteWebhook(webhookId);
}

/**
 * Mettre à jour un webhook (supprimer et recréer)
 */
export async function updateWebhook(
  client: ShippoClient,
  webhookId: string,
  config: WebhookConfig
): Promise<ShippoWebhookResponse> {
  // Supprimer l'ancien webhook
  await deleteWebhook(client, webhookId);
  
  // Créer le nouveau webhook
  return await createWebhook(client, config);
}

// ============================================================================
// FONCTIONS DE VALIDATION DES WEBHOOKS
// ============================================================================

/**
 * Valider la signature d'un webhook (si vous utilisez un secret)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Implémentation basique - adaptez selon vos besoins de sécurité
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Valider le payload d'un webhook
 */
export function validateWebhookPayload(payload: any): payload is WebhookPayload {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.event === 'string' &&
    payload.data &&
    typeof payload.data.object_id === 'string' &&
    typeof payload.data.object_type === 'string'
  );
}

// ============================================================================
// HANDLERS PRÉDÉFINIS POUR VOTRE SYSTÈME
// ============================================================================

/**
 * Handler pour les mises à jour de transaction
 */
export const transactionUpdateHandler: WebhookHandler = {
  event: 'transaction.updated',
  description: 'Gère les mises à jour de statut des transactions',
  handler: async (payload: WebhookPayload) => {
    const transaction = payload.data;
    
    // Mettre à jour votre base de données
    // Adaptez selon votre modèle Prisma
    console.log(`Transaction ${transaction.object_id} mise à jour:`, {
      status: transaction.status,
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider
    });
    
    // Exemple d'intégration avec Prisma
    /*
    await prisma.transaction.update({
      where: { shippoTransactionId: transaction.object_id },
      data: {
        status: transaction.status,
        trackingNumber: transaction.tracking_number,
        trackingUrl: transaction.tracking_url_provider,
        updatedAt: new Date()
      }
    });
    */
  }
};

/**
 * Handler pour les créations de transaction
 */
export const transactionCreatedHandler: WebhookHandler = {
  event: 'transaction.created',
  description: 'Gère les nouvelles transactions créées',
  handler: async (payload: WebhookPayload) => {
    const transaction = payload.data;
    
    console.log(`Nouvelle transaction créée: ${transaction.object_id}`);
    
    // Logique pour traiter une nouvelle transaction
    // Par exemple, envoyer un email de confirmation
  }
};

/**
 * Handler pour les mises à jour de tracking
 */
export const trackingUpdateHandler: WebhookHandler = {
  event: 'track.updated',
  description: 'Gère les mises à jour de suivi des colis',
  handler: async (payload: WebhookPayload) => {
    const tracking = payload.data;
    
    console.log(`Mise à jour de suivi:`, {
      trackingNumber: tracking.tracking_number,
      status: tracking.tracking_status?.status,
      location: tracking.tracking_status?.location
    });
    
    // Mettre à jour le statut de suivi dans votre base de données
    // Notifier le client par email/SMS
  }
};

/**
 * Handler pour les créations de shipment
 */
export const shipmentCreatedHandler: WebhookHandler = {
  event: 'shipment.created',
  description: 'Gère les nouveaux shipments créés',
  handler: async (payload: WebhookPayload) => {
    const shipment = payload.data;
    
    console.log(`Nouveau shipment créé: ${shipment.object_id}`);
    
    // Logique pour traiter un nouveau shipment
  }
};

/**
 * Handler pour les mises à jour de shipment
 */
export const shipmentUpdateHandler: WebhookHandler = {
  event: 'shipment.updated',
  description: 'Gère les mises à jour de shipment',
  handler: async (payload: WebhookPayload) => {
    const shipment = payload.data;
    
    console.log(`Shipment mis à jour: ${shipment.object_id}`);
    
    // Logique pour traiter les mises à jour de shipment
  }
};

/**
 * Handler pour les créations de rate
 */
export const rateCreatedHandler: WebhookHandler = {
  event: 'rate.created',
  description: 'Gère les nouveaux rates créés',
  handler: async (payload: WebhookPayload) => {
    const rate = payload.data;
    
    console.log(`Nouveau rate créé: ${rate.object_id}`, {
      carrier: rate.carrier,
      service: rate.servicelevel?.name,
      amount: rate.amount,
      currency: rate.currency
    });
    
    // Logique pour traiter les nouveaux rates
  }
};

/**
 * Handler pour les mises à jour de rate
 */
export const rateUpdateHandler: WebhookHandler = {
  event: 'rate.updated',
  description: 'Gère les mises à jour de rate',
  handler: async (payload: WebhookPayload) => {
    const rate = payload.data;
    
    console.log(`Rate mis à jour: ${rate.object_id}`);
    
    // Logique pour traiter les mises à jour de rate
  }
};

// ============================================================================
// GESTIONNAIRE DE WEBHOOKS CENTRALISÉ
// ============================================================================

export class WebhookManager {
  private handlers: Map<ShippoWebhookEvent, WebhookHandler[]> = new Map();

  /**
   * Enregistrer un handler
   */
  registerHandler(handler: WebhookHandler): void {
    if (!this.handlers.has(handler.event)) {
      this.handlers.set(handler.event, []);
    }
    this.handlers.get(handler.event)!.push(handler);
  }

  /**
   * Désenregistrer un handler
   */
  unregisterHandler(event: ShippoWebhookEvent, handler: WebhookHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Traiter un payload de webhook
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    const handlers = this.handlers.get(payload.event);
    
    if (!handlers || handlers.length === 0) {
      console.warn(`Aucun handler enregistré pour l'événement: ${payload.event}`);
      return;
    }

    // Exécuter tous les handlers pour cet événement
    const promises = handlers.map(handler => 
      handler.handler(payload).catch(error => {
        console.error(`Erreur dans le handler pour ${payload.event}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Enregistrer tous les handlers par défaut
   */
  registerDefaultHandlers(): void {
    this.registerHandler(transactionUpdateHandler);
    this.registerHandler(transactionCreatedHandler);
    this.registerHandler(trackingUpdateHandler);
    this.registerHandler(shipmentCreatedHandler);
    this.registerHandler(shipmentUpdateHandler);
    this.registerHandler(rateCreatedHandler);
    this.registerHandler(rateUpdateHandler);
  }
}

// ============================================================================
// FONCTIONS DE CONVENIENCE POUR VOTRE SYSTÈME
// ============================================================================

/**
 * Configurer les webhooks pour votre application
 */
export async function setupWebhooks(
  client: ShippoClient,
  baseUrl: string,
  events: ShippoWebhookEvent[] = [
    'transaction.created',
    'transaction.updated',
    'track.updated',
    'shipment.created',
    'shipment.updated'
  ]
): Promise<ShippoWebhookResponse> {
  const webhookUrl = `${baseUrl}/api/webhooks/shippo`;
  
  return await createWebhook(client, {
    url: webhookUrl,
    events,
    metadata: 'Webhook principal pour l\'application'
  });
}

/**
 * Créer un webhook pour un environnement spécifique
 */
export async function createEnvironmentWebhook(
  client: ShippoClient,
  environment: 'development' | 'staging' | 'production',
  events: ShippoWebhookEvent[]
): Promise<ShippoWebhookResponse> {
  const baseUrls = {
    development: 'https://your-dev-domain.com',
    staging: 'https://your-staging-domain.com',
    production: 'https://your-production-domain.com'
  };

  const webhookUrl = `${baseUrls[environment]}/api/webhooks/shippo`;
  
  return await createWebhook(client, {
    url: webhookUrl,
    events,
    metadata: `Webhook pour l'environnement ${environment}`
  });
}

/**
 * Nettoyer les webhooks obsolètes
 */
export async function cleanupWebhooks(
  client: ShippoClient,
  keepPatterns: string[] = []
): Promise<void> {
  const webhooks = await getAllWebhooks(client);
  
  for (const webhook of webhooks) {
    const shouldKeep = keepPatterns.some(pattern => 
      webhook.url.includes(pattern)
    );
    
    if (!shouldKeep) {
      console.log(`Suppression du webhook obsolète: ${webhook.object_id}`);
      await deleteWebhook(client, webhook.object_id);
    }
  }
}

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Valider la configuration d'un webhook
 */
export function validateWebhookConfig(config: WebhookConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.url) {
    errors.push('Webhook URL is required');
  } else if (!isValidUrl(config.url)) {
    errors.push('Webhook URL must be a valid URL');
  }

  if (!config.events || config.events.length === 0) {
    errors.push('At least one event must be specified');
  }

  const validEvents: ShippoWebhookEvent[] = [
    'transaction.created',
    'transaction.updated',
    'track.updated',
    'shipment.created',
    'shipment.updated',
    'rate.created',
    'rate.updated'
  ];

  const invalidEvents = config.events.filter(event => !validEvents.includes(event));
  if (invalidEvents.length > 0) {
    errors.push(`Invalid events: ${invalidEvents.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valider une URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

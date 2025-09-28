/**
 * Client API Shippo
 * Implémentation complète du client pour l'API Shippo
 */

import type {
  ShippoApiConfig,
  ShippoAddress,
  ShippoAddressResponse,
  ShippoParcel,
  ShippoParcelResponse,
  ShippoShipment,
  ShippoShipmentResponse,
  ShippoRate,
  ShippoRateResponse,
  ShippoTransaction,
  ShippoTransactionResponse,
  ShippoDirectTransaction,
  ShippoWebhook,
  ShippoWebhookResponse,
  ShippoManifest,
  ShippoManifestResponse,
  ShippoCarrierAccount,
  ShippoCarrierAccountResponse,
  ShippoCreateShipmentRequest,
  ShippoCreateTransactionRequest,
  ShippoCreateDirectTransactionRequest,
  ShippoCreateWebhookRequest,
  ShippoCreateManifestRequest,
  ShippoPaginatedResponse
} from './types.js';
import { ShippoApiException } from './types.js';

export class ShippoClient {
  private readonly apiToken: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: ShippoApiConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://api.goshippo.com';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;

    if (!this.apiToken) {
      throw new Error('Shippo API token is required');
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Authorization': `ShippoToken ${this.apiToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      signal: AbortSignal.timeout(this.timeout)
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ShippoApiException(
            response.status,
            errorData.code || 'UNKNOWN_ERROR',
            errorData.detail || response.statusText,
            errorData.errors
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retries && this.isRetryableError(error as Error)) {
          // Attendre avant de réessayer (backoff exponentiel)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        throw error;
      }
    }

    throw lastError;
  }

  private isRetryableError(error: Error): boolean {
    if (error instanceof ShippoApiException) {
      // Retry sur les erreurs 5xx et certaines erreurs 4xx
      return error.status >= 500 || error.status === 429;
    }
    
    // Retry sur les erreurs réseau
    return error.name === 'TypeError' || error.name === 'AbortError';
  }

  // ============================================================================
  // ADDRESSES
  // ============================================================================

  /**
   * Créer une nouvelle adresse
   */
  async createAddress(address: ShippoAddress): Promise<ShippoAddressResponse> {
    return this.makeRequest<ShippoAddressResponse>('/addresses/', {
      method: 'POST',
      body: JSON.stringify(address)
    });
  }

  /**
   * Récupérer une adresse par ID
   */
  async getAddress(addressId: string): Promise<ShippoAddressResponse> {
    return this.makeRequest<ShippoAddressResponse>(`/addresses/${addressId}/`);
  }

  /**
   * Valider une adresse
   */
  async validateAddress(address: ShippoAddress): Promise<ShippoAddressResponse> {
    const addressWithValidation = { ...address, validate: true };
    return this.createAddress(addressWithValidation);
  }

  // ============================================================================
  // PARCELS
  // ============================================================================

  /**
   * Créer un nouveau colis
   */
  async createParcel(parcel: ShippoParcel): Promise<ShippoParcelResponse> {
    return this.makeRequest<ShippoParcelResponse>('/parcels/', {
      method: 'POST',
      body: JSON.stringify(parcel)
    });
  }

  /**
   * Récupérer un colis par ID
   */
  async getParcel(parcelId: string): Promise<ShippoParcelResponse> {
    return this.makeRequest<ShippoParcelResponse>(`/parcels/${parcelId}/`);
  }

  // ============================================================================
  // SHIPMENTS
  // ============================================================================

  /**
   * Créer un nouveau shipment
   * Cela génère automatiquement les rates disponibles
   */
  async createShipment(shipment: ShippoCreateShipmentRequest): Promise<ShippoShipmentResponse> {
    return this.makeRequest<ShippoShipmentResponse>('/shipments/', {
      method: 'POST',
      body: JSON.stringify(shipment)
    });
  }

  /**
   * Récupérer un shipment par ID
   */
  async getShipment(shipmentId: string): Promise<ShippoShipmentResponse> {
    return this.makeRequest<ShippoShipmentResponse>(`/shipments/${shipmentId}/`);
  }

  /**
   * Récupérer les rates pour un shipment
   */
  async getShipmentRates(shipmentId: string): Promise<ShippoRateResponse[]> {
    const response = await this.makeRequest<ShippoPaginatedResponse<ShippoRateResponse>>(
      `/shipments/${shipmentId}/rates/`
    );
    return response.results;
  }

  // ============================================================================
  // RATES
  // ============================================================================

  /**
   * Récupérer un rate par ID
   */
  async getRate(rateId: string): Promise<ShippoRateResponse> {
    return this.makeRequest<ShippoRateResponse>(`/rates/${rateId}/`);
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /**
   * Acheter une étiquette à partir d'un rate
   */
  async createTransaction(transaction: ShippoCreateTransactionRequest): Promise<ShippoTransactionResponse> {
    return this.makeRequest<ShippoTransactionResponse>('/transactions/', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  }

  /**
   * Acheter une étiquette en un seul appel (shipment + transaction)
   */
  async createDirectTransaction(transaction: ShippoCreateDirectTransactionRequest): Promise<ShippoTransactionResponse> {
    return this.makeRequest<ShippoTransactionResponse>('/transactions/', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  }

  /**
   * Récupérer une transaction par ID
   */
  async getTransaction(transactionId: string): Promise<ShippoTransactionResponse> {
    return this.makeRequest<ShippoTransactionResponse>(`/transactions/${transactionId}/`);
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  /**
   * Créer un webhook
   */
  async createWebhook(webhook: ShippoCreateWebhookRequest): Promise<ShippoWebhookResponse> {
    return this.makeRequest<ShippoWebhookResponse>('/webhooks/', {
      method: 'POST',
      body: JSON.stringify(webhook)
    });
  }

  /**
   * Récupérer tous les webhooks
   */
  async getWebhooks(): Promise<ShippoWebhookResponse[]> {
    const response = await this.makeRequest<ShippoPaginatedResponse<ShippoWebhookResponse>>('/webhooks/');
    return response.results;
  }

  /**
   * Récupérer un webhook par ID
   */
  async getWebhook(webhookId: string): Promise<ShippoWebhookResponse> {
    return this.makeRequest<ShippoWebhookResponse>(`/webhooks/${webhookId}/`);
  }

  /**
   * Supprimer un webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.makeRequest(`/webhooks/${webhookId}/`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // MANIFESTS
  // ============================================================================

  /**
   * Créer un manifeste pour regrouper des transactions
   */
  async createManifest(manifest: ShippoCreateManifestRequest): Promise<ShippoManifestResponse> {
    return this.makeRequest<ShippoManifestResponse>('/manifests/', {
      method: 'POST',
      body: JSON.stringify(manifest)
    });
  }

  /**
   * Récupérer un manifeste par ID
   */
  async getManifest(manifestId: string): Promise<ShippoManifestResponse> {
    return this.makeRequest<ShippoManifestResponse>(`/manifests/${manifestId}/`);
  }

  // ============================================================================
  // CARRIER ACCOUNTS
  // ============================================================================

  /**
   * Récupérer tous les comptes transporteurs
   */
  async getCarrierAccounts(): Promise<ShippoCarrierAccountResponse[]> {
    const response = await this.makeRequest<ShippoPaginatedResponse<ShippoCarrierAccountResponse>>('/carrier_accounts/');
    return response.results;
  }

  /**
   * Récupérer un compte transporteur par ID
   */
  async getCarrierAccount(accountId: string): Promise<ShippoCarrierAccountResponse> {
    return this.makeRequest<ShippoCarrierAccountResponse>(`/carrier_accounts/${accountId}/`);
  }

  // ============================================================================
  // MÉTHODES DE CONVENIENCE
  // ============================================================================

  /**
   * Flux complet : créer un shipment et récupérer les rates
   */
  async createShipmentWithRates(shipment: ShippoCreateShipmentRequest): Promise<{
    shipment: ShippoShipmentResponse;
    rates: ShippoRateResponse[];
  }> {
    const shipmentResponse = await this.createShipment(shipment);
    const rates = await this.getShipmentRates(shipmentResponse.object_id);
    
    return {
      shipment: shipmentResponse,
      rates
    };
  }

  /**
   * Flux complet : créer un shipment, sélectionner le meilleur rate et acheter l'étiquette
   */
  async createShipmentAndBuyLabel(
    shipment: ShippoCreateShipmentRequest,
    options: {
      preferredCarriers?: string[];
      labelFileType?: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
      async?: boolean;
    } = {}
  ): Promise<{
    shipment: ShippoShipmentResponse;
    rates: ShippoRateResponse[];
    transaction: ShippoTransactionResponse;
  }> {
    // Créer le shipment et récupérer les rates
    const { shipment: shipmentResponse, rates } = await this.createShipmentWithRates(shipment);
    
    if (rates.length === 0) {
      throw new ShippoApiException(400, 'NO_RATES', 'Aucun tarif disponible pour ce shipment');
    }

    // Sélectionner le meilleur rate
    let selectedRate = rates[0];
    
    if (options.preferredCarriers && options.preferredCarriers.length > 0) {
      const preferredRate = rates.find(rate => 
        options.preferredCarriers!.some(carrier => 
          rate.carrier.toLowerCase().includes(carrier.toLowerCase())
        )
      );
      if (preferredRate) {
        selectedRate = preferredRate;
      }
    }

    // Acheter l'étiquette
    const transaction = await this.createTransaction({
      rate: selectedRate.object_id,
      label_file_type: options.labelFileType || 'PDF',
      async: options.async || false
    });

    return {
      shipment: shipmentResponse,
      rates,
      transaction
    };
  }

  /**
   * Flux direct : créer et acheter une étiquette en un seul appel
   */
  async createDirectLabel(
    shipment: ShippoCreateShipmentRequest,
    carrierAccount: string,
    serviceLevelToken: string,
    options: {
      labelFileType?: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
      async?: boolean;
    } = {}
  ): Promise<ShippoTransactionResponse> {
    return this.createDirectTransaction({
      shipment,
      carrier_account: carrierAccount,
      servicelevel_token: serviceLevelToken,
      label_file_type: options.labelFileType || 'PDF',
      async: options.async || false
    });
  }
}

// ============================================================================
// FONCTION DE CONVENIENCE POUR CRÉER UN CLIENT
// ============================================================================

/**
 * Créer une instance du client Shippo
 */
export function createShippoClient(config: ShippoApiConfig): ShippoClient {
  return new ShippoClient(config);
}

/**
 * Créer une instance du client Shippo à partir des variables d'environnement
 */
export function createShippoClientFromEnv(): ShippoClient {
  const apiToken = process.env.SHIPPO_API_TOKEN;
  
  if (!apiToken) {
    throw new Error('SHIPPO_API_TOKEN environment variable is required');
  }

  return new ShippoClient({
    apiToken,
    baseUrl: process.env.SHIPPO_BASE_URL,
    timeout: process.env.SHIPPO_TIMEOUT ? parseInt(process.env.SHIPPO_TIMEOUT) : undefined,
    retries: process.env.SHIPPO_RETRIES ? parseInt(process.env.SHIPPO_RETRIES) : undefined
  });
}

/**
 * Types TypeScript pour l'API Shippo
 * Basés sur la documentation officielle de Shippo
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type ShippoApiResponse<T> = {
  object_id: string;
  object_state: 'VALID' | 'INVALID';
  object_created: string;
  object_updated: string;
  object_owner: string;
  object_type: string;
} & T;

export type ShippoError = {
  status: number;
  code: string;
  detail: string;
  source?: {
    pointer?: string;
  };
};

export type ShippoApiError = {
  errors: ShippoError[];
};

// ============================================================================
// ADDRESSES
// ============================================================================

export interface ShippoAddress {
  object_id?: string;
  object_state?: 'VALID' | 'INVALID';
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_type?: string;
  
  // Informations de base
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  street3?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  
  // Validation
  is_residential?: boolean;
  validate?: boolean;
  
  // Métadonnées
  metadata?: string;
}

export interface ShippoAddressValidation {
  is_valid: boolean;
  messages: Array<{
    source: string;
    code: string;
    text: string;
  }>;
}

export type ShippoAddressResponse = ShippoApiResponse<ShippoAddress & {
  validation_results?: ShippoAddressValidation;
}>;

// ============================================================================
// PARCELS
// ============================================================================

export interface ShippoParcel {
  object_id?: string;
  object_state?: 'VALID' | 'INVALID';
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_type?: string;
  
  // Dimensions
  length: number;
  width: number;
  height: number;
  distance_unit: 'cm' | 'in' | 'ft' | 'mm' | 'm' | 'yd';
  
  // Poids
  weight: number;
  mass_unit: 'g' | 'oz' | 'lb' | 'kg';
  
  // Métadonnées
  metadata?: string;
  template?: string;
  extra?: Record<string, any>;
}

export type ShippoParcelResponse = ShippoApiResponse<ShippoParcel>;

// ============================================================================
// SHIPMENTS
// ============================================================================

export interface ShippoShipment {
  object_id?: string;
  object_state?: 'VALID' | 'INVALID';
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_type?: string;
  
  // Adresses
  address_from: string | ShippoAddress; // ID ou objet complet
  address_to: string | ShippoAddress;   // ID ou objet complet
  address_return?: string | ShippoAddress;
  
  // Colis
  parcels: string[] | ShippoParcel[]; // IDs ou objets complets
  
  // Transporteurs
  carrier_accounts?: string[];
  
  // Options d'expédition
  extra?: Record<string, any>;
  customs_declaration?: string;
  metadata?: string;
  
  // Rates générés automatiquement
  rates?: ShippoRate[];
}

export type ShippoShipmentResponse = ShippoApiResponse<ShippoShipment>;

// ============================================================================
// RATES
// ============================================================================

export interface ShippoRate {
  object_id: string;
  object_state: 'VALID' | 'INVALID';
  object_created: string;
  object_updated: string;
  object_owner: string;
  object_type: string;
  
  // Informations de tarification
  amount: string;
  currency: string;
  amount_local: string;
  currency_local: string;
  
  // Détails du service
  servicelevel: {
    token: string;
    name: string;
  };
  
  // Transporteur
  carrier: string;
  carrier_account: string;
  
  // Délais
  days: number;
  duration_terms?: string;
  
  // Tracking
  tracking_number?: string;
  
  // Métadonnées
  metadata?: string;
  attributes?: string[];
  
  // Shipment parent
  shipment: string;
}

export type ShippoRateResponse = ShippoApiResponse<ShippoRate>;

// ============================================================================
// TRANSACTIONS
// ============================================================================

export interface ShippoTransaction {
  object_id?: string;
  object_state?: 'VALID' | 'INVALID';
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_type?: string;
  
  // Rate utilisé
  rate: string; // ID du rate
  
  // Options d'étiquette
  label_file_type?: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
  async?: boolean;
  
  // Métadonnées
  metadata?: string;
  
  // Résultats de la transaction
  status?: 'SUCCESS' | 'ERROR' | 'REFUNDED' | 'REFUNDPENDING';
  tracking_number?: string;
  tracking_status?: {
    status: string;
    status_details: string;
    status_date: string;
    location?: {
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  tracking_url_provider?: string;
  label_url?: string;
  
  // Informations de facturation
  billing?: {
    object_id: string;
    object_state: string;
    object_created: string;
    object_updated: string;
    object_owner: string;
    object_type: string;
    amount: string;
    currency: string;
    amount_local: string;
    currency_local: string;
  };
  
  // Messages d'erreur
  messages?: Array<{
    source: string;
    code: string;
    text: string;
  }>;
  
  // Shipment et parcel associés
  shipment?: ShippoShipment;
  parcel?: ShippoParcel;
}

export type ShippoTransactionResponse = ShippoApiResponse<ShippoTransaction>;

// ============================================================================
// TRANSACTIONS DIRECTES (PURCHASE LABEL IN ONE CALL)
// ============================================================================

export interface ShippoDirectTransaction {
  // Shipment complet (au lieu d'un rate)
  shipment: {
    address_from: string | ShippoAddress;
    address_to: string | ShippoAddress;
    parcels: string[] | ShippoParcel[];
    carrier_accounts?: string[];
    extra?: Record<string, any>;
    customs_declaration?: string;
    metadata?: string;
  };
  
  // Transporteur et service spécifiques
  carrier_account: string;
  servicelevel_token: string;
  
  // Options d'étiquette
  label_file_type?: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
  async?: boolean;
  
  // Métadonnées
  metadata?: string;
}

// ============================================================================
// WEBHOOKS
// ============================================================================

export interface ShippoWebhook {
  object_id?: string;
  object_state?: 'VALID' | 'INVALID';
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_type?: string;
  
  // Configuration du webhook
  url: string;
  events: ShippoWebhookEvent[];
  
  // Métadonnées
  metadata?: string;
}

export type ShippoWebhookEvent = 
  | 'transaction.created'
  | 'transaction.updated'
  | 'track.updated'
  | 'shipment.created'
  | 'shipment.updated'
  | 'rate.created'
  | 'rate.updated';

export type ShippoWebhookResponse = ShippoApiResponse<ShippoWebhook>;

// ============================================================================
// MANIFESTS
// ============================================================================

export interface ShippoManifest {
  object_id?: string;
  object_state?: 'VALID' | 'INVALID';
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_type?: string;
  
  // Transactions à regrouper
  transactions: string[];
  
  // Transporteur
  carrier_account: string;
  
  // Métadonnées
  metadata?: string;
  
  // Résultats
  status?: 'SUCCESS' | 'ERROR';
  manifest_url?: string;
  messages?: Array<{
    source: string;
    code: string;
    text: string;
  }>;
}

export type ShippoManifestResponse = ShippoApiResponse<ShippoManifest>;

// ============================================================================
// CARRIER ACCOUNTS
// ============================================================================

export interface ShippoCarrierAccount {
  object_id?: string;
  object_state?: 'VALID' | 'INVALID';
  object_created?: string;
  object_updated?: string;
  object_owner?: string;
  object_type?: string;
  
  // Informations du transporteur
  carrier: string;
  account_id?: string;
  
  // Paramètres spécifiques
  parameters?: Record<string, any>;
  
  // Métadonnées
  metadata?: string;
  
  // Statut
  active?: boolean;
}

export type ShippoCarrierAccountResponse = ShippoApiResponse<ShippoCarrierAccount>;

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

export interface ShippoApiConfig {
  apiToken: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ShippoCreateShipmentRequest {
  address_from: string | ShippoAddress;
  address_to: string | ShippoAddress;
  address_return?: string | ShippoAddress;
  parcels: string[] | ShippoParcel[];
  carrier_accounts?: string[];
  extra?: Record<string, any>;
  customs_declaration?: string;
  metadata?: string;
}

export interface ShippoCreateTransactionRequest {
  rate: string;
  label_file_type?: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
  async?: boolean;
  metadata?: string;
}

export interface ShippoCreateDirectTransactionRequest {
  shipment: ShippoCreateShipmentRequest;
  carrier_account: string;
  servicelevel_token: string;
  label_file_type?: 'PDF' | 'PDF_A4' | 'PNG' | 'ZPLII';
  async?: boolean;
  metadata?: string;
}

export interface ShippoCreateWebhookRequest {
  url: string;
  events: ShippoWebhookEvent[];
  metadata?: string;
}

export interface ShippoCreateManifestRequest {
  transactions: string[];
  carrier_account: string;
  metadata?: string;
}

// ============================================================================
// TYPES POUR LES RÉPONSES PAGINÉES
// ============================================================================

export interface ShippoPaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// ============================================================================
// TYPES POUR LES ERREURS SPÉCIFIQUES
// ============================================================================

export class ShippoApiException extends Error {
  constructor(
    public status: number,
    public code: string,
    public detail: string,
    public errors?: ShippoError[]
  ) {
    super(`Shippo API Error (${status}): ${detail}`);
    this.name = 'ShippoApiException';
  }
}

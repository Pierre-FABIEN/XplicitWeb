/**
 * Fonctions utilitaires pour la gestion des adresses Shippo
 * Compatible avec les données de votre système existant
 */

import { ShippoClient } from './client.js';
import type { ShippoAddress, ShippoAddressResponse } from './types.js';

// ============================================================================
// TYPES POUR L'INTÉGRATION AVEC VOTRE SYSTÈME
// ============================================================================

export interface AddressData {
  // Informations de base
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  email?: string;
  
  // Adresse
  street: string;
  streetNumber?: string;
  city: string;
  zip: string;
  country: string;
  state?: string;
  
  // Métadonnées
  isResidential?: boolean;
  metadata?: string;
}

export interface ServicePointData {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  latitude?: string;
  longitude?: string;
  type?: string;
  postNumber?: string;
}

// ============================================================================
// FONCTIONS DE CONVERSION
// ============================================================================

/**
 * Convertir les données d'adresse de votre système vers le format Shippo
 */
export function convertToShippoAddress(addressData: AddressData): ShippoAddress {
  const fullStreet = addressData.streetNumber 
    ? `${addressData.streetNumber} ${addressData.street}`
    : addressData.street;

  return {
    name: `${addressData.firstName} ${addressData.lastName}`.trim(),
    company: addressData.company || undefined,
    street1: fullStreet,
    city: addressData.city,
    state: addressData.state || undefined,
    zip: addressData.zip,
    country: addressData.country.toUpperCase(),
    phone: addressData.phone || undefined,
    email: addressData.email || undefined,
    is_residential: addressData.isResidential ?? true,
    metadata: addressData.metadata || undefined
  };
}

/**
 * Convertir les données de point relais vers le format Shippo
 */
export function convertServicePointToShippoAddress(servicePoint: ServicePointData): ShippoAddress {
  return {
    name: servicePoint.name,
    street1: servicePoint.address,
    city: servicePoint.city,
    zip: servicePoint.zip,
    country: servicePoint.country.toUpperCase(),
    is_residential: false,
    metadata: JSON.stringify({
      service_point_id: servicePoint.id,
      service_point_type: servicePoint.type,
      latitude: servicePoint.latitude,
      longitude: servicePoint.longitude,
      post_number: servicePoint.postNumber
    })
  };
}

// ============================================================================
// FONCTIONS DE GESTION DES ADRESSES
// ============================================================================

/**
 * Créer une adresse expéditeur
 */
export async function createSenderAddress(
  client: ShippoClient,
  addressData: AddressData
): Promise<ShippoAddressResponse> {
  const shippoAddress = convertToShippoAddress(addressData);
  return await client.createAddress(shippoAddress);
}

/**
 * Créer une adresse destinataire
 */
export async function createRecipientAddress(
  client: ShippoClient,
  addressData: AddressData
): Promise<ShippoAddressResponse> {
  const shippoAddress = convertToShippoAddress(addressData);
  return await client.createAddress(shippoAddress);
}

/**
 * Créer une adresse de point relais
 */
export async function createServicePointAddress(
  client: ShippoClient,
  servicePoint: ServicePointData
): Promise<ShippoAddressResponse> {
  const shippoAddress = convertServicePointToShippoAddress(servicePoint);
  return await client.createAddress(shippoAddress);
}

/**
 * Valider une adresse avant création
 */
export async function validateAddress(
  client: ShippoClient,
  addressData: AddressData
): Promise<{
  isValid: boolean;
  address: ShippoAddressResponse;
  messages: Array<{
    source: string;
    code: string;
    text: string;
  }>;
}> {
  const shippoAddress = convertToShippoAddress(addressData);
  const validatedAddress = await client.validateAddress(shippoAddress);
  
  const validationResults = validatedAddress.validation_results;
  const isValid = validationResults?.is_valid ?? false;
  const messages = validationResults?.messages ?? [];

  return {
    isValid,
    address: validatedAddress,
    messages
  };
}

// ============================================================================
// FONCTIONS DE CONVENIENCE POUR VOTRE SYSTÈME
// ============================================================================

/**
 * Créer les adresses nécessaires pour un shipment
 * Compatible avec les données de transaction de votre système
 */
export async function createShipmentAddresses(
  client: ShippoClient,
  transactionData: {
    // Adresse expéditeur
    senderAddress?: AddressData;
    
    // Adresse destinataire
    recipientAddress: AddressData;
    
    // Point relais (optionnel)
    servicePoint?: ServicePointData;
  }
): Promise<{
  senderAddressId?: string;
  recipientAddressId: string;
  servicePointAddressId?: string;
}> {
  const results: {
    senderAddressId?: string;
    recipientAddressId: string;
    servicePointAddressId?: string;
  } = {
    recipientAddressId: ''
  };

  // Créer l'adresse expéditeur si fournie
  if (transactionData.senderAddress) {
    const senderAddress = await createSenderAddress(client, transactionData.senderAddress);
    results.senderAddressId = senderAddress.object_id;
  }

  // Créer l'adresse destinataire
  const recipientAddress = await createRecipientAddress(client, transactionData.recipientAddress);
  results.recipientAddressId = recipientAddress.object_id;

  // Créer l'adresse de point relais si fournie
  if (transactionData.servicePoint) {
    const servicePointAddress = await createServicePointAddress(client, transactionData.servicePoint);
    results.servicePointAddressId = servicePointAddress.object_id;
  }

  return results;
}

/**
 * Récupérer et valider une adresse existante
 */
export async function getAndValidateAddress(
  client: ShippoClient,
  addressId: string
): Promise<{
  address: ShippoAddressResponse;
  isValid: boolean;
}> {
  const address = await client.getAddress(addressId);
  const isValid = address.object_state === 'VALID';
  
  return {
    address,
    isValid
  };
}

// ============================================================================
// FONCTIONS DE VALIDATION SPÉCIFIQUES
// ============================================================================

/**
 * Valider une adresse française
 */
export async function validateFrenchAddress(
  client: ShippoClient,
  addressData: AddressData
): Promise<{
  isValid: boolean;
  address: ShippoAddressResponse;
  suggestions?: string[];
}> {
  // S'assurer que le pays est la France
  const frenchAddressData = {
    ...addressData,
    country: 'FR'
  };

  const validation = await validateAddress(client, frenchAddressData);
  
  // Extraire les suggestions d'amélioration
  const suggestions = validation.messages
    .filter(msg => msg.code === 'SUGGESTION')
    .map(msg => msg.text);

  return {
    isValid: validation.isValid,
    address: validation.address,
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
}

/**
 * Valider une adresse internationale
 */
export async function validateInternationalAddress(
  client: ShippoClient,
  addressData: AddressData
): Promise<{
  isValid: boolean;
  address: ShippoAddressResponse;
  warnings?: string[];
}> {
  const validation = await validateAddress(client, addressData);
  
  // Extraire les avertissements
  const warnings = validation.messages
    .filter(msg => msg.code === 'WARNING')
    .map(msg => msg.text);

  return {
    isValid: validation.isValid,
    address: validation.address,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// ============================================================================
// FONCTIONS DE CONVERSION DEPUIS VOS DONNÉES EXISTANTES
// ============================================================================

/**
 * Convertir les données d'adresse depuis votre modèle Prisma
 * Adaptez cette fonction selon votre schéma Prisma exact
 */
export function convertFromPrismaAddress(prismaAddress: any): AddressData {
  return {
    firstName: prismaAddress.firstName || '',
    lastName: prismaAddress.lastName || '',
    company: prismaAddress.company,
    phone: prismaAddress.phone,
    email: prismaAddress.email,
    street: prismaAddress.street || '',
    streetNumber: prismaAddress.streetNumber,
    city: prismaAddress.city || '',
    zip: prismaAddress.zip || '',
    country: prismaAddress.country || 'FR',
    state: prismaAddress.state,
    isResidential: prismaAddress.isResidential ?? true,
    metadata: prismaAddress.metadata
  };
}

/**
 * Convertir les données de transaction depuis votre modèle Prisma
 * Adaptez cette fonction selon votre schéma Prisma exact
 */
export function convertFromPrismaTransaction(prismaTransaction: any): {
  senderAddress?: AddressData;
  recipientAddress: AddressData;
  servicePoint?: ServicePointData;
} {
  const recipientAddress: AddressData = {
    firstName: prismaTransaction.address_first_name || '',
    lastName: prismaTransaction.address_last_name || '',
    company: prismaTransaction.address_company,
    phone: prismaTransaction.address_phone,
    email: prismaTransaction.customer_details_email,
    street: prismaTransaction.address_street || '',
    streetNumber: prismaTransaction.address_street_number,
    city: prismaTransaction.address_city || '',
    zip: prismaTransaction.address_zip || '',
    country: prismaTransaction.address_country_code || 'FR',
    isResidential: true,
    metadata: `Transaction ${prismaTransaction.id}`
  };

  const result: {
    senderAddress?: AddressData;
    recipientAddress: AddressData;
    servicePoint?: ServicePointData;
  } = {
    recipientAddress
  };

  // Ajouter l'adresse expéditeur si disponible
  if (prismaTransaction.sender_name) {
    result.senderAddress = {
      firstName: prismaTransaction.sender_name.split(' ')[0] || '',
      lastName: prismaTransaction.sender_name.split(' ').slice(1).join(' ') || '',
      company: prismaTransaction.sender_company,
      phone: prismaTransaction.sender_telephone,
      email: prismaTransaction.sender_email,
      street: prismaTransaction.sender_address || '',
      city: prismaTransaction.sender_city || '',
      zip: prismaTransaction.sender_postal_code || '',
      country: prismaTransaction.sender_country || 'FR',
      isResidential: false,
      metadata: `Sender for transaction ${prismaTransaction.id}`
    };
  }

  // Ajouter le point relais si disponible
  if (prismaTransaction.servicePointId) {
    result.servicePoint = {
      id: prismaTransaction.servicePointId,
      name: prismaTransaction.servicePointName || 'Point Relais',
      address: prismaTransaction.servicePointAddress || '',
      city: prismaTransaction.servicePointCity || '',
      zip: prismaTransaction.servicePointZip || '',
      country: prismaTransaction.servicePointCountry || 'FR',
      latitude: prismaTransaction.servicePointLatitude,
      longitude: prismaTransaction.servicePointLongitude,
      type: prismaTransaction.servicePointType,
      postNumber: prismaTransaction.servicePointPostNumber
    };
  }

  return result;
}

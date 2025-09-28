/**
 * Fonctions utilitaires pour la gestion des shipments et rates Shippo
 * Compatible avec les données de votre système existant
 */

import { ShippoClient } from './client.js';
import { 
  ShippoShipment, 
  ShippoShipmentResponse, 
  ShippoRate, 
  ShippoRateResponse,
  ShippoParcel,
  ShippoCreateShipmentRequest
} from './types.js';

// ============================================================================
// TYPES POUR L'INTÉGRATION AVEC VOTRE SYSTÈME
// ============================================================================

export interface PackageData {
  // Dimensions
  length: number;
  width: number;
  height: number;
  dimensionUnit: 'cm' | 'in' | 'ft' | 'mm' | 'm' | 'yd';
  
  // Poids
  weight: number;
  weightUnit: 'g' | 'oz' | 'lb' | 'kg';
  
  // Métadonnées
  metadata?: string;
}

export interface ShipmentData {
  // Adresses (IDs Shippo)
  senderAddressId?: string;
  recipientAddressId: string;
  returnAddressId?: string;
  
  // Colis
  packages: PackageData[];
  
  // Transporteurs préférés
  preferredCarriers?: string[];
  
  // Options d'expédition
  customsDeclaration?: string;
  metadata?: string;
  extra?: Record<string, any>;
}

export interface RateSelectionOptions {
  // Transporteurs préférés
  preferredCarriers?: string[];
  
  // Services préférés
  preferredServices?: string[];
  
  // Critères de sélection
  preferCheapest?: boolean;
  preferFastest?: boolean;
  maxPrice?: number;
  maxDays?: number;
  
  // Exclusions
  excludeCarriers?: string[];
  excludeServices?: string[];
}

// ============================================================================
// FONCTIONS DE CONVERSION
// ============================================================================

/**
 * Convertir les données de colis vers le format Shippo
 */
export function convertToShippoParcel(packageData: PackageData): ShippoParcel {
  return {
    length: packageData.length,
    width: packageData.width,
    height: packageData.height,
    distance_unit: packageData.dimensionUnit,
    weight: packageData.weight,
    mass_unit: packageData.weightUnit,
    metadata: packageData.metadata || undefined
  };
}

/**
 * Convertir les données de shipment vers le format Shippo
 */
export function convertToShippoShipment(shipmentData: ShipmentData): ShippoCreateShipmentRequest {
  return {
    address_from: shipmentData.senderAddressId || '',
    address_to: shipmentData.recipientAddressId,
    address_return: shipmentData.returnAddressId || undefined,
    parcels: shipmentData.packages.map(convertToShippoParcel),
    carrier_accounts: shipmentData.preferredCarriers || undefined,
    customs_declaration: shipmentData.customsDeclaration || undefined,
    metadata: shipmentData.metadata || undefined,
    extra: shipmentData.extra || undefined
  };
}

// ============================================================================
// FONCTIONS DE GESTION DES SHIPMENTS
// ============================================================================

/**
 * Créer un shipment avec validation
 */
export async function createShipmentWithValidation(
  client: ShippoClient,
  shipmentData: ShipmentData
): Promise<ShippoShipmentResponse> {
  const shippoShipment = convertToShippoShipment(shipmentData);
  
  // Validation des données requises
  if (!shippoShipment.address_to) {
    throw new Error('Recipient address ID is required');
  }
  
  if (!shippoShipment.parcels || shippoShipment.parcels.length === 0) {
    throw new Error('At least one parcel is required');
  }

  return await client.createShipment(shippoShipment);
}

/**
 * Créer un shipment et récupérer les rates
 */
export async function createShipmentWithRates(
  client: ShippoClient,
  shipmentData: ShipmentData
): Promise<{
  shipment: ShippoShipmentResponse;
  rates: ShippoRateResponse[];
}> {
  const shipment = await createShipmentWithValidation(client, shipmentData);
  const rates = await client.getShipmentRates(shipment.object_id);
  
  return {
    shipment,
    rates
  };
}

/**
 * Récupérer les rates pour un shipment existant
 */
export async function getRatesForShipment(
  client: ShippoClient,
  shipmentId: string
): Promise<ShippoRateResponse[]> {
  return await client.getShipmentRates(shipmentId);
}

// ============================================================================
// FONCTIONS DE SÉLECTION DES RATES
// ============================================================================

/**
 * Filtrer les rates selon les critères
 */
export function filterRates(
  rates: ShippoRateResponse[],
  options: RateSelectionOptions
): ShippoRateResponse[] {
  let filteredRates = [...rates];

  // Filtrer par transporteurs préférés
  if (options.preferredCarriers && options.preferredCarriers.length > 0) {
    filteredRates = filteredRates.filter(rate =>
      options.preferredCarriers!.some(carrier =>
        rate.carrier.toLowerCase().includes(carrier.toLowerCase())
      )
    );
  }

  // Exclure certains transporteurs
  if (options.excludeCarriers && options.excludeCarriers.length > 0) {
    filteredRates = filteredRates.filter(rate =>
      !options.excludeCarriers!.some(carrier =>
        rate.carrier.toLowerCase().includes(carrier.toLowerCase())
      )
    );
  }

  // Filtrer par services préférés
  if (options.preferredServices && options.preferredServices.length > 0) {
    filteredRates = filteredRates.filter(rate =>
      options.preferredServices!.some(service =>
        rate.servicelevel.token.toLowerCase().includes(service.toLowerCase())
      )
    );
  }

  // Exclure certains services
  if (options.excludeServices && options.excludeServices.length > 0) {
    filteredRates = filteredRates.filter(rate =>
      !options.excludeServices!.some(service =>
        rate.servicelevel.token.toLowerCase().includes(service.toLowerCase())
      )
    );
  }

  // Filtrer par prix maximum
  if (options.maxPrice) {
    filteredRates = filteredRates.filter(rate =>
      parseFloat(rate.amount) <= options.maxPrice!
    );
  }

  // Filtrer par délai maximum
  if (options.maxDays) {
    filteredRates = filteredRates.filter(rate =>
      rate.days <= options.maxDays!
    );
  }

  return filteredRates;
}

/**
 * Sélectionner le meilleur rate selon les critères
 */
export function selectBestRate(
  rates: ShippoRateResponse[],
  options: RateSelectionOptions
): ShippoRateResponse | null {
  const filteredRates = filterRates(rates, options);
  
  if (filteredRates.length === 0) {
    return null;
  }

  // Si on préfère le moins cher
  if (options.preferCheapest) {
    return filteredRates.reduce((cheapest, current) =>
      parseFloat(current.amount) < parseFloat(cheapest.amount) ? current : cheapest
    );
  }

  // Si on préfère le plus rapide
  if (options.preferFastest) {
    return filteredRates.reduce((fastest, current) =>
      current.days < fastest.days ? current : fastest
    );
  }

  // Par défaut, retourner le premier rate filtré
  return filteredRates[0];
}

/**
 * Trier les rates par critère
 */
export function sortRates(
  rates: ShippoRateResponse[],
  sortBy: 'price' | 'speed' | 'carrier' | 'service'
): ShippoRateResponse[] {
  const sortedRates = [...rates];

  switch (sortBy) {
    case 'price':
      return sortedRates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    
    case 'speed':
      return sortedRates.sort((a, b) => a.days - b.days);
    
    case 'carrier':
      return sortedRates.sort((a, b) => a.carrier.localeCompare(b.carrier));
    
    case 'service':
      return sortedRates.sort((a, b) => a.servicelevel.name.localeCompare(b.servicelevel.name));
    
    default:
      return sortedRates;
  }
}

// ============================================================================
// FONCTIONS DE CONVENIENCE POUR VOTRE SYSTÈME
// ============================================================================

/**
 * Créer un shipment et obtenir les rates triés par prix
 */
export async function createShipmentWithSortedRates(
  client: ShippoClient,
  shipmentData: ShipmentData,
  sortBy: 'price' | 'speed' | 'carrier' | 'service' = 'price'
): Promise<{
  shipment: ShippoShipmentResponse;
  rates: ShippoRateResponse[];
}> {
  const { shipment, rates } = await createShipmentWithRates(client, shipmentData);
  const sortedRates = sortRates(rates, sortBy);
  
  return {
    shipment,
    rates: sortedRates
  };
}

/**
 * Créer un shipment et sélectionner automatiquement le meilleur rate
 */
export async function createShipmentWithBestRate(
  client: ShippoClient,
  shipmentData: ShipmentData,
  selectionOptions: RateSelectionOptions = {}
): Promise<{
  shipment: ShippoShipmentResponse;
  rates: ShippoRateResponse[];
  bestRate: ShippoRateResponse | null;
}> {
  const { shipment, rates } = await createShipmentWithRates(client, shipmentData);
  const bestRate = selectBestRate(rates, selectionOptions);
  
  return {
    shipment,
    rates,
    bestRate
  };
}

// ============================================================================
// FONCTIONS DE CONVERSION DEPUIS VOS DONNÉES EXISTANTES
// ============================================================================

/**
 * Convertir les données de transaction depuis votre modèle Prisma
 * Adaptez cette fonction selon votre schéma Prisma exact
 */
export function convertFromPrismaTransaction(prismaTransaction: any): ShipmentData {
  // Calculer le poids total des produits
  const totalWeight = prismaTransaction.products?.reduce((sum: number, product: any) => {
    return sum + (product.weight || 0.1) * (product.quantity || 1);
  }, 0) || 0.5; // Poids par défaut si aucun produit

  // Calculer les dimensions du colis
  const packageDimensions = calculatePackageDimensions(prismaTransaction.products || []);

  return {
    senderAddressId: prismaTransaction.sender_address_id,
    recipientAddressId: prismaTransaction.recipient_address_id,
    returnAddressId: prismaTransaction.return_address_id,
    packages: [{
      length: packageDimensions.length,
      width: packageDimensions.width,
      height: packageDimensions.height,
      dimensionUnit: 'cm',
      weight: totalWeight,
      weightUnit: 'kg',
      metadata: `Transaction ${prismaTransaction.id}`
    }],
    preferredCarriers: prismaTransaction.preferred_carriers,
    customsDeclaration: prismaTransaction.customs_declaration,
    metadata: `Transaction ${prismaTransaction.id}`,
    extra: {
      transaction_id: prismaTransaction.id,
      order_number: prismaTransaction.order_number,
      customer_email: prismaTransaction.customer_details_email
    }
  };
}

/**
 * Calculer les dimensions du colis basées sur les produits
 */
function calculatePackageDimensions(products: any[]): {
  length: number;
  width: number;
  height: number;
} {
  if (!products || products.length === 0) {
    // Dimensions par défaut pour un petit colis
    return {
      length: 30,
      width: 20,
      height: 10
    };
  }

  // Calculer les dimensions en fonction du nombre et du type de produits
  const totalProducts = products.reduce((sum, product) => sum + (product.quantity || 1), 0);
  
  if (totalProducts === 1) {
    return {
      length: 30,
      width: 20,
      height: 10
    };
  } else if (totalProducts <= 3) {
    return {
      length: 40,
      width: 30,
      height: 15
    };
  } else if (totalProducts <= 6) {
    return {
      length: 50,
      width: 40,
      height: 20
    };
  } else {
    return {
      length: 60,
      width: 50,
      height: 30
    };
  }
}

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Valider les données de shipment avant création
 */
export function validateShipmentData(shipmentData: ShipmentData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!shipmentData.recipientAddressId) {
    errors.push('Recipient address ID is required');
  }

  if (!shipmentData.packages || shipmentData.packages.length === 0) {
    errors.push('At least one package is required');
  } else {
    shipmentData.packages.forEach((pkg, index) => {
      if (pkg.length <= 0) errors.push(`Package ${index + 1}: length must be greater than 0`);
      if (pkg.width <= 0) errors.push(`Package ${index + 1}: width must be greater than 0`);
      if (pkg.height <= 0) errors.push(`Package ${index + 1}: height must be greater than 0`);
      if (pkg.weight <= 0) errors.push(`Package ${index + 1}: weight must be greater than 0`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valider les options de sélection de rate
 */
export function validateRateSelectionOptions(options: RateSelectionOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.maxPrice && options.maxPrice <= 0) {
    errors.push('Maximum price must be greater than 0');
  }

  if (options.maxDays && options.maxDays <= 0) {
    errors.push('Maximum days must be greater than 0');
  }

  if (options.preferredCarriers && options.excludeCarriers) {
    const hasConflict = options.preferredCarriers.some(carrier =>
      options.excludeCarriers!.some(excluded =>
        carrier.toLowerCase().includes(excluded.toLowerCase())
      )
    );
    if (hasConflict) {
      errors.push('Preferred carriers and excluded carriers cannot overlap');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

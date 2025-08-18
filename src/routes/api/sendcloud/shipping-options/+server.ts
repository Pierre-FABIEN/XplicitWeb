// /home/pierre/XplicitWeb/XplicitWeb/src/routes/api/sendcloud/shipping-options/+server.ts
// Purpose: Simple, safe endpoint to fetch normalized shipping options from Sendcloud V3.
// Notes:
// - Uses Basic Auth with public/private keys from environment variables.
// - Validates input with Zod (minimal but strict).
// - Normalizes Sendcloud response into a stable DTO for the frontend.
// - Timeouts and basic error mapping included.

import { json, error, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';

/** Minimal input validation (strict enough for a "simple start") */
const InputZ = z.object({
  from_country_code: z.string().length(2, 'from_country_code must be 2-letter ISO'),
  to_country_code: z.string().length(2, 'to_country_code must be 2-letter ISO'),
  from_postal_code: z.string().min(3),
  to_postal_code: z.string().min(3),
  weight: z.object({
    value: z.number().positive(),
    unit: z.enum(['kilogram', 'gram'])
  })
});

/** Helper: convert any weight to kilograms (number with 3 decimals max) */
function toKg(value: number, unit: 'kilogram' | 'gram'): number {
  const kg = unit === 'kilogram' ? value : value / 1000;
  return Math.round(kg * 1000) / 1000;
}

/** Helper: base64 for both Node and edge runtimes */
function toBase64(s: string): string {
  // @ts-ignore - btoa may exist in some runtimes (Edge)
  if (typeof btoa === 'function') return btoa(s);
  // Node fallback
  return Buffer.from(s).toString('base64');
}

/** Build the Basic Authorization header from env keys (never leak values) */
function buildAuthHeader(): string {
  const pub = process.env.SENDCLOUD_PUBLIC_KEY;
  const priv = process.env.SENDCLOUD_SECRET_KEY;
  if (!pub || !priv) {
    // Intentionally generic to avoid leaking configuration details
    throw error(500, 'Sendcloud credentials are not configured');
  }
  return `Basic ${toBase64(`${pub}:${priv}`)}`;
}

/** Simple timeout wrapper using AbortController */
async function fetchWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  ms = 10_000
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetchFn(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

/** Normalize Sendcloud option into a stable DTO for frontend */
function mapOption(o: any) {
  return {
    id: String(o?.code ?? ''), // V3 option code, e.g. "dpd:home"
    carrierCode: String(o?.carrier ?? ''),
    carrierName: String(o?.carrier_name ?? ''),
    productName: String(o?.name ?? ''),
    type: o?.functionalities?.service_point ? ('service_point' as const) : ('home_delivery' as const),
    price: {
      currency: 'EUR' as const,
      value: Number(o?.price?.total?.value ?? 0)
    },
    eta: o?.delivery_estimate ?? null
  };
}

/** SvelteKit POST handler */
export const POST: RequestHandler = async ({ request, fetch }) => {
  // 1) Validate input (fail fast with explicit errors)
  const bodyJson = await request.json().catch(() => {
    throw error(400, 'Invalid JSON body');
  });

  const input = InputZ.parse(bodyJson);

  // 2) Build Sendcloud V3 payload
  const weightKg = toKg(input.weight.value, input.weight.unit);
  const payload = {
    from_country: input.from_country_code,
    to_country: input.to_country_code,
    from_postal_code: input.from_postal_code,
    to_postal_code: input.to_postal_code,
    weight: { value: String(weightKg), unit: 'kg' }
    // NOTE: keep it simple for now (no "functionalities" filter).
    // Later we can pass { service_point: true } when user picked a relay.
  };

  // 3) Call Sendcloud (with timeout, basic rate-limit awareness)
  const url = 'https://panel.sendcloud.sc/api/v3/fetch-shipping-options';
  const res = await fetchWithTimeout(fetch, url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': buildAuthHeader()
    },
    body: JSON.stringify(payload)
  });

  console.log('🔍 === RÉPONSE DE SENDCLOUD ===');
  console.log('Status:', res.status);
  console.log('Status Text:', res.statusText);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  console.log('Data:', JSON.stringify(res, null, 2));
  console.log('🔍 === FIN RÉPONSE ===\n');

  // Handle 429 gracefully (let caller decide retry/backoff policy)
  if (res.status === 429) {
    throw error(429, 'Rate limited by Sendcloud');
  }

  // Map non-OK to SvelteKit error with minimal leakage
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw error(res.status, text || 'Unexpected Sendcloud error');
  }

  // 4) Normalize response to a stable DTO for the frontend
  const data = await res.json().catch(() => ({}));
  
  // Filtrer uniquement Colissimo, Chronopost, Mondial Relay
  const allOptions = data?.data || [];
  const allowedCarriers = ['colissimo', 'chronopost', 'mondial_relay', 'ups'];
  
  console.log('🎯 === FILTRAGE ===');
  console.log('Total options reçues:', allOptions.length);
  
  const filteredOptions = allOptions.filter((option: any) => {
    const carrierCode = option?.carrier?.code?.toLowerCase();
    const isAllowed = allowedCarriers.includes(carrierCode);
    
    if (isAllowed) {
      console.log(`✅ ${option.carrier.name} (${option.carrier.code}) - ${option.product.name}`);
    }
    
    return isAllowed;
  });
  
  console.log('Options filtrées:', filteredOptions.length);
  console.log('🎯 === FIN FILTRAGE ===\n');
  
  // Normaliser les options filtrées
  const options = filteredOptions.map(mapOption);
  const trimmed = options.slice(0, 10); // Augmenté à 10 pour avoir plus d'options

  // Keep the list short for UX (we can increase later)
  return json({ 
    data: trimmed, // Changé de 'options' à 'data' pour correspondre au frontend
    filtering: {
      total_received: allOptions.length,
      filtered_count: filteredOptions.length,
      allowed_carriers: allowedCarriers
    }
  });
};

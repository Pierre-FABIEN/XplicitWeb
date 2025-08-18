// /home/pierre/XplicitWeb/XplicitWeb/src/routes/api/sendcloud/shipping-options/+server.ts
// Purpose: Simple, safe endpoint to fetch normalized shipping options from Sendcloud V3.
//
// Approach kept intentionally simple:
// - Strict Zod validation (now accepts prefer_service_point & max_options).
// - Minimal functionalities for "cans" (B2C, tracked, parcel).
// - Lead time cap in-request.
// - Map v3 data[] -> DTO ({ id, carrierCode, productName, type, price, eta }).
// - Basic filter: carriers whitelist, drop age_check, price > 0.
// - Sort by price, optionally prefer service_point; slice to max_options.
// - Timeout and compact structured logs.
//
// All code comments are in English.

import { json, error, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';

/** === Validation ========================================================= */
const InputZ = z.object({
  from_country_code: z.string().length(2, 'from_country_code must be 2-letter ISO'),
  to_country_code: z.string().length(2, 'to_country_code must be 2-letter ISO'),
  from_postal_code: z.string().min(2),
  to_postal_code: z.string().min(2),
  weight: z.object({
    value: z.number().positive(),
    unit: z.enum(['kilogram', 'gram'])
  }),
  // NEW: simple UX knobs (optional)
  prefer_service_point: z.boolean().optional().default(false),
  max_options: z.number().int().min(1).max(20).optional().default(10),
  allowed_carriers: z.array(z.string()).optional()
}).strict();

/** === Helpers ============================================================ */
function toKg(value: number, unit: 'kilogram' | 'gram'): number {
  const kg = unit === 'kilogram' ? value : value / 1000;
  return Math.round(kg * 1000) / 1000;
}

function toBase64(s: string): string {
  // @ts-ignore btoa may exist in some runtimes
  if (typeof btoa === 'function') return btoa(s);
  return Buffer.from(s).toString('base64');
}

function buildAuthHeader(): string {
  const pub = process.env.SENDCLOUD_PUBLIC_KEY;
  const priv = process.env.SENDCLOUD_SECRET_KEY;
  if (!pub || !priv) throw error(500, 'Sendcloud credentials are not configured');
  return `Basic ${toBase64(`${pub}:${priv}`)}`;
}

async function fetchWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  ms = 10_000
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetchFn(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}
// --- keep your imports and InputZ WITH prefer_service_point & max_options (as in previous fix) ---

/** Domestic vs international lead-time cap (hours). */
function leadTimeCapHours(from: string, to: string) {
	return from.toUpperCase() === to.toUpperCase() ? 72 : 120;
  }
  
  /** Minimal functionalities for a broad match.
   *  IMPORTANT: keep only fields that are widely supported.
   */
  function buildMinimalFunctionalities() {
	return {
	  b2c: true,
	  tracked: true
	} as const;
  }
  
  /** Build the base payload (v3 keys). */
  function buildBasePayload(input: z.infer<typeof InputZ>) {
	const weightKg = toKg(input.weight.value, input.weight.unit);
	return {
	  from_country_code: input.from_country_code,
	  to_country_code: input.to_country_code,
	  from_postal_code: input.from_postal_code,
	  to_postal_code: input.to_postal_code,
	  weight: { value: String(weightKg), unit: 'kg' }
	};
  }
  
  /** Map v3 -> DTO (unchanged if you already merged this) */
  type QuoteDTO = {
	id: string;
	carrierCode: string;
	productName: string;
	type: 'service_point' | 'home_delivery';
	price: number;
	eta?: string;
  };
  
  function etaFromLeadTimeHours(lead?: number): string | undefined {
	if (!lead || !Number.isFinite(lead)) return undefined;
	const d = new Date(); d.setHours(d.getHours() + lead);
	return d.toISOString();
  }
  
  function pickCheapestQuote(quotes: any[]): { price: number; lead_time?: number } | null {
	let best: { price: number; lead_time?: number } | null = null;
	for (const q of quotes ?? []) {
	  const v = Number(q?.price?.total?.value);
	  if (!Number.isFinite(v) || v <= 0) continue;
	  if (!best || v < best.price) best = { price: v, lead_time: Number(q?.lead_time) };
	}
	return best;
  }
  
  function mapQuotesV3(resp: any): QuoteDTO[] {
	const arr: any[] = Array.isArray(resp?.data) ? resp.data : [];
	const out: QuoteDTO[] = [];
  
	for (const opt of arr) {
	  const id = String(opt?.code ?? '').trim();
	  if (!id) continue;
  
	  // Exclude age-check variants for a simple B2C flow
	  const ageCheck = opt?.functionalities?.age_check ?? null;
	  if (ageCheck !== null && ageCheck !== undefined) continue;
  
	  const carrierCode = String(opt?.carrier?.code ?? '').toLowerCase().trim();
	  const productName =
		String(opt?.name ?? opt?.product?.name ?? opt?.product?.code ?? 'Unknown').trim();
  
	  const lastMile = String(opt?.functionalities?.last_mile ?? '').toLowerCase();
	  const type: 'service_point' | 'home_delivery' =
		lastMile === 'service_point' ? 'service_point' : 'home_delivery';
  
	  const best = pickCheapestQuote(opt?.quotes ?? []);
	  if (!best) continue;
  
	  out.push({
		id,
		carrierCode,
		productName,
		type,
		price: best.price,
		eta: etaFromLeadTimeHours(best.lead_time)
	  });
	}
  
	// Stable ordering by price then carrier
	out.sort((a, b) => (a.price - b.price) || a.carrierCode.localeCompare(b.carrierCode));
	return out;
  }
  
  const DEFAULT_ALLOWED_CARRIERS = ['colissimo', 'chronopost', 'mondial_relay', 'ups'] as const;
  
  /** SvelteKit POST handler */
  export const POST: RequestHandler = async ({ request, fetch }) => {
	// 1) Validate body
	const bodyJson = await request.json().catch(() => { throw error(400, 'Invalid JSON body'); });
	const input = InputZ.parse(bodyJson);
  
	// 2) Build payload (broad first try)
	const base = buildBasePayload(input);
	const payloadTry1: Record<string, unknown> = {
	  ...base,
	  functionalities: buildMinimalFunctionalities(),                // only b2c+tracked
	  lead_time: { lte: leadTimeCapHours(input.from_country_code, input.to_country_code) } // cap SLA
	};
  
	const url = 'https://panel.sendcloud.sc/api/v3/fetch-shipping-options';
	const headers = {
	  Accept: 'application/json',
	  'Content-Type': 'application/json',
	  Authorization: buildAuthHeader()
	};
  
	// 3) First call
	let res = await fetchWithTimeout(fetch, url, { method: 'POST', headers, body: JSON.stringify(payloadTry1) });
	if (res.status === 429) throw error(429, 'Rate limited by Sendcloud');
	if (!res.ok) {
	  const text = await res.text().catch(() => '');
	  throw error(res.status, text || 'Unexpected Sendcloud error');
	}
	let raw = await res.json().catch(() => ({} as any));
	let all: any[] = Array.isArray(raw?.data) ? raw.data : [];
  
	console.log(JSON.stringify({
	  ts: new Date().toISOString(),
	  level: 'info',
	  event: 'sendcloud_v3_fetch_try1',
	  status: res.status,
	  received: all.length
	}));

	

  
	// 4) Simple fallback if empty: remove lead_time & functionalities (max breadth)
	if (!all.length) {
	  const payloadTry2 = { ...base }; // no functionalities, no lead_time
	  res = await fetchWithTimeout(fetch, url, { method: 'POST', headers, body: JSON.stringify(payloadTry2) });
	  if (res.status === 429) throw error(429, 'Rate limited by Sendcloud');
	  if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw error(res.status, text || 'Unexpected Sendcloud error (fallback)');
	  }
	  raw = await res.json().catch(() => ({} as any));
	  all = Array.isArray(raw?.data) ? raw.data : [];
  
	  console.log(JSON.stringify({
		ts: new Date().toISOString(),
		level: 'info',
		event: 'sendcloud_v3_fetch_try2',
		status: res.status,
		received: all.length
	  }));
	}
  
		// 5) Filter carriers (whitelist) then map
	const allowedCarriers = (input.allowed_carriers?.length
	  ? input.allowed_carriers.map(c => c.toLowerCase())
	  : Array.from(DEFAULT_ALLOWED_CARRIERS));
   
	const filteredRaw = all.filter((o: any) => {
	  const carrierCode = String(o?.carrier?.code ?? '').toLowerCase();
	  return allowedCarriers.includes(carrierCode);
	});
   
	let dtos = mapQuotesV3({ data: filteredRaw });
   

   
	// Prefer service points if requested (simple reorder)
	if (input.prefer_service_point) {
	  dtos = [...dtos.filter(d => d.type === 'service_point'), ...dtos.filter(d => d.type === 'home_delivery')];
	}
   
	// Cap results
	const max = input.max_options ?? 10;
	const trimmed = dtos.slice(0, max);
   
	return json({
	  data: trimmed,
	  filtering: {
		total_received: all.length,
		filtered_count: filteredRaw.length,
		allowed_carriers: allowedCarriers,
		prefer_service_point: input.prefer_service_point,
		max_options: max,
		used_fallback: all.length === 0 ? true : false
	  }
	});
  };
  
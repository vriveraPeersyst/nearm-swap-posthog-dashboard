import axios from 'axios';
import { Decimal } from 'decimal.js';
import { cfg } from './config.js';

/** In-memory price cache with TTL */
let priceCache: { prices: Record<string, Decimal>; timestamp: number } | null = null;
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Map internal price IDs to CoinGecko IDs for fallback */
const coinGeckoFallbackMap: Record<string, string> = {
  'kaito': 'kaito',
  'arbitrum': 'arbitrum',
  'matic-network': 'polygon-ecosystem-token',
  'kat': 'nearkat',
  'npro': 'npro',
  'public-ai': 'publicai',
  'rhea': 'rhea-2',
  'itlx': 'intellex',
};

/** Sleep helper */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Fetch prices from CoinGecko API with retry logic */
async function fetchFromCoinGecko(coinGeckoIds: string[], retries = 3): Promise<Record<string, Decimal>> {
  if (coinGeckoIds.length === 0) return {};
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const ids = coinGeckoIds.join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
      const { data } = await axios.get(url, { timeout: 10000 });
      
      const result: Record<string, Decimal> = {};
      for (const [cgId, priceData] of Object.entries(data)) {
        const price = (priceData as any)?.usd;
        if (price) {
          result[cgId] = new Decimal(price);
        }
      }
      return result;
    } catch (error: any) {
      const status = error?.response?.status;
      const isThrottled = status === 429;
      
      if (attempt < retries && (isThrottled || status >= 500 || error.code === 'ECONNABORTED')) {
        // For 429, use longer delay
        const delay = isThrottled ? Math.pow(2, attempt) * 5000 : Math.pow(2, attempt) * 1000;
        console.log(`CoinGecko request failed (attempt ${attempt}/${retries}), retrying in ${delay/1000}s...`);
        await sleep(delay);
        continue;
      }
      console.warn('Failed to fetch prices from CoinGecko:', error?.message || error);
      return {};
    }
  }
  return {};
}

/** Fetch all prices once and return id -> Decimal(usdPrice). Uses in-memory cache. */
export async function fetchPricesOnce(): Promise<Record<string, Decimal>> {
  // Check if we have a valid cache
  if (priceCache && (Date.now() - priceCache.timestamp) < PRICE_CACHE_TTL) {
    console.log('Using cached prices');
    return priceCache.prices;
  }

  // 1) Fetch from internal API
  const { data } = await axios.get(cfg.PRICES_API_URL, { timeout: 20000 });
  const map: Record<string, Decimal> = {};
  for (const row of data as Array<{ id: string; usdPrice: string }>) {
    if (!row?.id || row?.usdPrice == null) continue;
    try { map[row.id] = new Decimal(row.usdPrice); } catch { /* ignore bad rows */ }
  }

  // 2) Find missing tokens that have CoinGecko fallback
  const missingTokens: string[] = [];
  const coinGeckoIdsToFetch: string[] = [];
  
  for (const [internalId, coinGeckoId] of Object.entries(coinGeckoFallbackMap)) {
    if (!map[internalId]) {
      missingTokens.push(internalId);
      coinGeckoIdsToFetch.push(coinGeckoId);
    }
  }

  // 3) Fetch missing prices from CoinGecko
  if (coinGeckoIdsToFetch.length > 0) {
    console.log(`Fetching ${coinGeckoIdsToFetch.length} missing prices from CoinGecko: ${missingTokens.join(', ')}`);
    const coinGeckoPrices = await fetchFromCoinGecko(coinGeckoIdsToFetch);
    
    // Map CoinGecko prices back to internal IDs
    for (const [internalId, coinGeckoId] of Object.entries(coinGeckoFallbackMap)) {
      if (!map[internalId] && coinGeckoPrices[coinGeckoId]) {
        map[internalId] = coinGeckoPrices[coinGeckoId];
        console.log(`✓ ${internalId} price from CoinGecko: $${coinGeckoPrices[coinGeckoId].toString()}`);
      }
    }
  }

  // Update cache
  priceCache = { prices: map, timestamp: Date.now() };

  return map;
}

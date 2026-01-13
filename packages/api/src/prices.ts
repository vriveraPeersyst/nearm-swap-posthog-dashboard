import axios from 'axios';
import { Decimal } from 'decimal.js';
import { cfg } from './config.js';

/** Map internal price IDs to CoinGecko IDs for fallback */
const coinGeckoFallbackMap: Record<string, string> = {
  'kaito': 'kaito',
  'matic-network': 'polygon-ecosystem-token',
  'kat': 'nearkat',
  'npro': 'npro',
  'public-ai': 'publicai',
  'rhea': 'rhea-2',
  'itlx': 'intellex',
};

/** Fetch prices from CoinGecko API for given CoinGecko IDs */
async function fetchFromCoinGecko(coinGeckoIds: string[]): Promise<Record<string, Decimal>> {
  if (coinGeckoIds.length === 0) return {};
  
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
    console.warn('Failed to fetch prices from CoinGecko:', error?.message || error);
    return {};
  }
}

/** Fetch all prices once and return id -> Decimal(usdPrice). */
export async function fetchPricesOnce(): Promise<Record<string, Decimal>> {
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

  return map;
}

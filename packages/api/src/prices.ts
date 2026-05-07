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
  'aster': 'aster',
  'mon': 'mon-protocol',
  'the-open-network': 'the-open-network',
  'burrow': 'burrow',
  'frax': 'frax-share',
  'xdai': 'xdai',
  'aleo': 'aleo',
};

/** Sleep helper */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** 1Click NEAR Intents tokens API — covers tokens across all supported chains, keyed by contract address and symbol */
const ONE_CLICK_TOKENS_URL = 'https://1click.chaindefuser.com/v0/tokens';

type OneClickToken = {
  assetId: string;
  symbol: string;
  price: number | null;
  contractAddress?: string;
  blockchain?: string;
};

async function fetchFromOneClick(retries = 3): Promise<Record<string, Decimal>> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get<OneClickToken[]>(ONE_CLICK_TOKENS_URL, { timeout: 15000 });
      if (!Array.isArray(data)) return {};

      const result: Record<string, Decimal> = {};
      for (const token of data) {
        if (!token?.symbol || token.price == null) continue;
        let price: Decimal;
        try { price = new Decimal(token.price); } catch { continue; }
        // Skip explicit zeros — 1Click reports 0 for tokens with no price data; let Rhea/CoinGecko fill them
        if (price.isZero()) continue;

        // Symbol key — first occurrence wins so we don't bounce between chains for the same symbol
        const symbolKey = token.symbol.toLowerCase();
        if (!result[symbolKey]) result[symbolKey] = price;

        // assetId-without-protocol-prefix (e.g. "nep141:mpdao-token.near" -> "mpdao-token.near")
        const colonIdx = token.assetId?.indexOf(':') ?? -1;
        if (colonIdx >= 0) {
          const contractId = token.assetId.slice(colonIdx + 1);
          if (contractId && !result[contractId]) result[contractId] = price;
        }

        // Raw contractAddress (NEAR account or EVM hex) when present
        if (token.contractAddress && !result[token.contractAddress]) {
          result[token.contractAddress] = price;
        }
      }
      return result;
    } catch (error: any) {
      const status = error?.response?.status;
      const transient = status === 429 || (typeof status === 'number' && status >= 500) || error?.code === 'ECONNABORTED';
      if (attempt < retries && transient) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`1Click request failed (attempt ${attempt}/${retries}), retrying in ${delay / 1000}s...`);
        await sleep(delay);
        continue;
      }
      console.warn('Failed to fetch prices from 1Click:', error?.message || error);
      return {};
    }
  }
  return {};
}

/** Rhea Finance NEAR token prices — keyed by NEAR contract address */
const RHEA_TOKENS_URL = 'https://api.rhea.finance/list-token-price';

type RheaToken = {
  price: string;
  symbol: string;
  decimal: number;
};

async function fetchFromRhea(retries = 3): Promise<Record<string, Decimal>> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get<Record<string, RheaToken>>(RHEA_TOKENS_URL, { timeout: 15000 });
      if (!data || typeof data !== 'object') return {};

      const result: Record<string, Decimal> = {};
      for (const [contractAddress, token] of Object.entries(data)) {
        if (!token?.price) continue;
        let price: Decimal;
        try { price = new Decimal(token.price); } catch { continue; }

        // Always key by the contract address (Rhea's primary key)
        if (!result[contractAddress]) result[contractAddress] = price;

        // Also key by lowercase symbol when present, first occurrence wins
        const symbol = token.symbol?.trim().toLowerCase();
        if (symbol && !result[symbol]) result[symbol] = price;
      }
      return result;
    } catch (error: any) {
      const status = error?.response?.status;
      const transient = status === 429 || (typeof status === 'number' && status >= 500) || error?.code === 'ECONNABORTED';
      if (attempt < retries && transient) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Rhea request failed (attempt ${attempt}/${retries}), retrying in ${delay / 1000}s...`);
        await sleep(delay);
        continue;
      }
      console.warn('Failed to fetch prices from Rhea:', error?.message || error);
      return {};
    }
  }
  return {};
}

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

  // 1) Fetch all pages from internal API
  const map: Record<string, Decimal> = {};
  let page = 1;
  const PAGE_SIZE = 100;
  while (true) {
    const parsedUrl = new URL(cfg.PRICES_API_URL);
    parsedUrl.searchParams.set('page', String(page));
    parsedUrl.searchParams.set('pageSize', String(PAGE_SIZE));
    const url = parsedUrl.toString();
    const { data } = await axios.get(url, { timeout: 20000 });
    // Support both flat array and paginated { items: [...], pages } response shapes
    const rows: Array<{ id: string; usdPrice: string }> = Array.isArray(data) ? data : data?.items ?? [];
    for (const row of rows) {
      if (!row?.id || row?.usdPrice == null) continue;
      try { map[row.id] = new Decimal(row.usdPrice); } catch { /* ignore bad rows */ }
    }
    // If flat array or single/last page, stop
    const totalPages = data?.pages ?? 1;
    if (Array.isArray(data) || page >= totalPages) break;
    page++;
  }

  // 2) Fill gaps from 1Click API (NEAR Intents tokens across all chains, keyed by symbol/contract)
  try {
    const oneClickPrices = await fetchFromOneClick();
    let filled = 0;
    for (const [key, price] of Object.entries(oneClickPrices)) {
      if (!map[key]) {
        map[key] = price;
        filled++;
      }
    }
    if (filled > 0) console.log(`Filled ${filled} prices from 1Click API`);
  } catch (e: any) {
    console.warn('1Click price fill failed:', e?.message || e);
  }

  // 3) Fill remaining gaps from Rhea (NEAR-native tokens, including meme-cooking with non-zero prices)
  try {
    const rheaPrices = await fetchFromRhea();
    let filled = 0;
    for (const [key, price] of Object.entries(rheaPrices)) {
      if (!map[key]) {
        map[key] = price;
        filled++;
      }
    }
    if (filled > 0) console.log(`Filled ${filled} prices from Rhea API`);
  } catch (e: any) {
    console.warn('Rhea price fill failed:', e?.message || e);
  }

  // 4) Find missing tokens that have CoinGecko fallback
  const missingTokens: string[] = [];
  const coinGeckoIdsToFetch: string[] = [];
  
  for (const [internalId, coinGeckoId] of Object.entries(coinGeckoFallbackMap)) {
    if (!map[internalId]) {
      missingTokens.push(internalId);
      coinGeckoIdsToFetch.push(coinGeckoId);
    }
  }

  // 5) Fetch any still-missing prices from CoinGecko
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

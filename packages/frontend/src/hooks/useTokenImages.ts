import { useState, useEffect, useRef } from 'react';

export interface MarketToken {
  id: string;
  tokenId: string;
  symbol: string;
  name: string;
  imageUrl: string;
  usdPrice: string;
  usd24hChange: string;
  decimals: number;
  position: number;
}

interface MarketListResponse {
  pages: number;
  currentPage: number;
  items: MarketToken[];
  totalItems: number;
}

/** Map of NEAR contract addresses → market API symbol (uppercase) */
const CONTRACT_TO_SYMBOL: Record<string, string> = {
  'near-native': 'NEAR',
  '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1': 'USDC',
  'usdt.tether-token.near': 'USDT',
  'eth.bridge.near': 'ETH',
  'token.sweat': 'SWEAT',
  'token.burrow.near': 'BRRR',
  'token.0xshitzu.near': 'SHITZU',
  'blackdragon.tkn.near': 'BLACKDRAGON',
  'score.aidols.near': 'SCORE',
  'zec.omft.near': 'ZEC',
  'xrp.omft.near': 'XRP',
  'kat.token0.near': 'KAT',
  'a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near': 'POL',
  'npro.nearmobile.near': 'NPRO',
  'token.publicailab.near': 'PUBLIC',
  'token.rhealab.near': 'RHEA',
  'itlx.intellex_xyz.near': 'ITLX',
  'mpdao-token.near': 'mpDAO',
  'token.v2.ref-finance.near': 'REF',
  'd9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near': 'HAPI',
  '2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near': 'WBTC',
  'nbtc.bridge.near': 'BTC',
  '853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near': 'FRAX',
  'aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near': 'AURORA',
};

const CACHE_KEY = 'marketTokenImages';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Shared singleton so multiple components don't duplicate requests
let sharedPromise: Promise<MarketToken[]> | null = null;
let sharedMap: Map<string, MarketToken> | null = null;

function getMarketApiUrl(): string {
  // Always use the deployed API proxy (it has CORS headers)
  return (import.meta.env.VITE_API_BASE_URL || '') + '/api/market-list';
}

function fetchMarketTokens(): Promise<MarketToken[]> {
  if (sharedPromise) return sharedPromise;

  // Try cache
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTs = localStorage.getItem(`${CACHE_KEY}_ts`);
  if (cached && cachedTs) {
    const age = Date.now() - new Date(cachedTs).getTime();
    if (age < CACHE_TTL) {
      try {
        const items: MarketToken[] = JSON.parse(cached);
        sharedPromise = Promise.resolve(items);
        return sharedPromise;
      } catch { /* fall through */ }
    }
  }

  sharedPromise = fetch(`${getMarketApiUrl()}?page=1&pageSize=100`)
    .then((res) => {
      if (!res.ok) throw new Error(`Market API: ${res.status}`);
      return res.json() as Promise<MarketListResponse>;
    })
    .then((data) => {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.items));
      localStorage.setItem(`${CACHE_KEY}_ts`, new Date().toISOString());
      return data.items;
    })
    .catch((err) => {
      console.warn('Failed to fetch market token images:', err);
      sharedPromise = null; // allow retry
      return [] as MarketToken[];
    });

  return sharedPromise;
}

/**
 * Fetches token metadata (images, names) from the NEARMobile market API.
 * Uses a shared singleton to avoid duplicate requests across components.
 */
export function useTokenImages() {
  const [tokenMap, setTokenMap] = useState<Map<string, MarketToken>>(() => sharedMap ?? new Map());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (sharedMap) {
      setTokenMap(sharedMap);
      return;
    }
    fetchMarketTokens().then((items) => {
      const map = buildMap(items);
      sharedMap = map;
      if (mounted.current) setTokenMap(map);
    });
    return () => { mounted.current = false; };
  }, []);

  return { tokenMap };
}

/**
 * Builds a multi-key lookup map.
 * Keys: uppercase SYMBOL, market tokenId, market id (CoinGecko slug).
 */
function buildMap(items: MarketToken[]): Map<string, MarketToken> {
  const map = new Map<string, MarketToken>();
  for (const item of items) {
    // Key by uppercase symbol (e.g. "BTC", "NEAR")
    map.set(item.symbol.toUpperCase(), item);
    // Key by market tokenId (e.g. "intents:near", "score.aidols.near")
    map.set(item.tokenId, item);
    // Key by CoinGecko id (e.g. "bitcoin", "near")
    map.set(item.id, item);
  }
  return map;
}

/** Resolve a full MarketToken from our TVL/swap data fields */
export function resolveMarketToken(
  tokenMap: Map<string, MarketToken>,
  symbol?: string | null,
  tokenId?: string,
  priceId?: string | null,
): MarketToken | undefined {
  if (tokenMap.size === 0) return undefined;
  if (symbol) {
    const m = tokenMap.get(symbol.toUpperCase());
    if (m) return m;
  }
  if (tokenId) {
    const m = tokenMap.get(tokenId);
    if (m) return m;
  }
  if (priceId) {
    const m = tokenMap.get(priceId);
    if (m) return m;
  }
  if (tokenId?.startsWith('intents:')) {
    const m = tokenMap.get(tokenId.replace('intents:', '').toUpperCase());
    if (m) return m;
  }
  if (tokenId) {
    const mapped = CONTRACT_TO_SYMBOL[tokenId];
    if (mapped) {
      const m = tokenMap.get(mapped.toUpperCase());
      if (m) return m;
    }
  }
  if (tokenId?.includes('.near')) {
    const m = tokenMap.get(tokenId.split('.')[0].toUpperCase());
    if (m) return m;
  }
  return undefined;
}

/** Resolve a token image URL from our TVL/swap data fields */
export function resolveTokenImage(
  tokenMap: Map<string, MarketToken>,
  symbol?: string | null,
  tokenId?: string,
  priceId?: string | null,
): string | undefined {
  if (tokenMap.size === 0) return undefined;

  // 1. Direct symbol match (covers most cases)
  if (symbol) {
    const match = tokenMap.get(symbol.toUpperCase());
    if (match) return match.imageUrl;
  }

  // 2. Direct tokenId match (market API tokenId like "intents:near", "score.aidols.near")
  if (tokenId) {
    const match = tokenMap.get(tokenId);
    if (match) return match.imageUrl;
  }

  // 3. priceId match (CoinGecko slug like "tether", "bitcoin", "near")
  if (priceId) {
    const match = tokenMap.get(priceId);
    if (match) return match.imageUrl;
  }

  // 4. Extract symbol from intents tokenId ("intents:usdt" → "USDT")
  if (tokenId?.startsWith('intents:')) {
    const key = tokenId.replace('intents:', '').toUpperCase();
    const match = tokenMap.get(key);
    if (match) return match.imageUrl;
  }

  // 5. Contract-address-to-symbol mapping ("near-native" → "NEAR", etc.)
  if (tokenId) {
    const mapped = CONTRACT_TO_SYMBOL[tokenId];
    if (mapped) {
      const match = tokenMap.get(mapped.toUpperCase());
      if (match) return match.imageUrl;
    }
  }

  // 6. Try ".near" contract: take first part as symbol
  if (tokenId?.includes('.near')) {
    const parts = tokenId.split('.');
    const match = tokenMap.get(parts[0].toUpperCase());
    if (match) return match.imageUrl;
  }

  return undefined;
}

/** Resolve a display symbol from a tokenId, using CONTRACT_TO_SYMBOL + market data */
export function resolveTokenSymbol(
  tokenMap: Map<string, MarketToken>,
  symbol?: string | null,
  tokenId?: string,
  priceId?: string | null,
): string {
  // Use symbol if it exists and is not a long address
  if (symbol && symbol.length <= 12) return symbol;

  // Try CONTRACT_TO_SYMBOL
  if (tokenId) {
    const mapped = CONTRACT_TO_SYMBOL[tokenId];
    if (mapped) return mapped;
  }

  // Try market token
  const mkt = resolveMarketToken(tokenMap, symbol, tokenId, priceId);
  if (mkt) return mkt.symbol;

  // Extract from intents: prefix
  if (tokenId?.startsWith('intents:')) {
    return tokenId.replace('intents:', '').toUpperCase();
  }

  // Last resort: truncate
  return tokenId?.slice(0, 12) ?? '?';
}

/** Determine chain type from tokenId for badge display */
export function getTokenChain(tokenId?: string): 'near' | 'intents' {
  if (!tokenId) return 'near';
  if (tokenId.startsWith('intents:')) return 'intents';
  return 'near';
}

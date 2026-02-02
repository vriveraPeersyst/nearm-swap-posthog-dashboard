import { Decimal } from 'decimal.js';
import axios from 'axios';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cfg } from './config.js';
import { fetchPricesOnce } from './prices.js';
import { fetchSwapBatch } from './posthog.js';
import { intentsToPriceId, isDepositWithdrawPair } from './tokenMapping.js';

// Cache configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CACHE_FILE = join(__dirname, '../output/fee_leaders_cache.json');
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in-memory TTL

// In-memory cache
let memoryCache: { data: any; timestamp: number } | null = null;

// Fee rates
const FEE_RATES = {
  basic: new Decimal('0.0088'),      // 0.88%
  ambassador: new Decimal('0.0066'), // 0.66%
  premium: new Decimal('0.0022'),    // 0.22%
};

interface UserLists {
  premium: Set<string>;
  ambassador: Set<string>;
}

interface FeeMetrics {
  allTime: Decimal;
  last24h: Decimal;
  last7d: Decimal;
  last30d: Decimal;
}

interface AccountFeeData {
  accountId: string;
  tier: 'basic' | 'premium' | 'ambassador';
  fees: FeeMetrics;
  volumeUSD: FeeMetrics;
  swaps: {
    allTime: number;
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

/** Fetch premium and ambassador user lists from NPRO API */
async function fetchUserLists(): Promise<UserLists> {
  try {
    const response = await axios.get('https://npro-stats-api-production.up.railway.app/v1/npro/users', {
      timeout: 10000
    });
    
    const data = response.data;
    return {
      premium: new Set((data.premium?.addresses || []).map((a: string) => a.toLowerCase())),
      ambassador: new Set((data.ambassador?.addresses || []).map((a: string) => a.toLowerCase())),
    };
  } catch (error: any) {
    console.warn('Failed to fetch NPRO user lists:', error?.message || error);
    return { premium: new Set(), ambassador: new Set() };
  }
}

/** Get fee rate for an account based on their tier */
function getUserTier(accountId: string, userLists: UserLists): 'basic' | 'premium' | 'ambassador' {
  const lowerId = accountId.toLowerCase();
  if (userLists.premium.has(lowerId)) return 'premium';
  if (userLists.ambassador.has(lowerId)) return 'ambassador';
  return 'basic';
}

/** Load cache from file */
function loadCacheFromFile(): any | null {
  try {
    if (existsSync(CACHE_FILE)) {
      const content = readFileSync(CACHE_FILE, 'utf-8');
      const cached = JSON.parse(content);
      console.log('Loaded fee leaders from file cache');
      return cached;
    }
  } catch (e) {
    console.warn('Failed to load cache file:', e);
  }
  return null;
}

/** Save cache to file */
function saveCacheToFile(data: any): void {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    console.log('Saved fee leaders to file cache');
  } catch (e) {
    console.warn('Failed to save cache file:', e);
  }
}

export async function getFeeLeaders() {
  // Check in-memory cache first
  if (memoryCache && (Date.now() - memoryCache.timestamp) < CACHE_TTL) {
    console.log('Using in-memory fee leaders cache');
    return memoryCache.data;
  }

  try {
    const result = await computeFeeLeaders();
    
    // Update caches
    memoryCache = { data: result, timestamp: Date.now() };
    saveCacheToFile(result);
    
    return result;
  } catch (error: any) {
    console.error('Error computing fee leaders:', error?.message || error);
    
    // Try file cache as fallback
    const fileCached = loadCacheFromFile();
    if (fileCached) {
      console.log('Using file cache as fallback due to error');
      // Store in memory for subsequent requests
      memoryCache = { data: fileCached, timestamp: Date.now() - CACHE_TTL + 60000 }; // Mark as stale in 1 min
      return fileCached;
    }
    
    // Re-throw if no cache available
    throw error;
  }
}

async function computeFeeLeaders() {
  // 1) Fetch user lists and prices in parallel
  const [userLists, prices] = await Promise.all([
    fetchUserLists(),
    fetchPricesOnce()
  ]);

  // 2) Setup time periods
  const now = Date.now();
  const timeFrames = {
    '24h': now - (24 * 60 * 60 * 1000),
    '7d': now - (7 * 24 * 60 * 60 * 1000),
    '30d': now - (30 * 24 * 60 * 60 * 1000),
  };

  // 3) Track fees per account
  const accounts = new Map<string, AccountFeeData>();

  const getAccountData = (accountId: string): AccountFeeData => {
    if (!accounts.has(accountId)) {
      accounts.set(accountId, {
        accountId,
        tier: getUserTier(accountId, userLists),
        fees: {
          allTime: new Decimal(0),
          last24h: new Decimal(0),
          last7d: new Decimal(0),
          last30d: new Decimal(0),
        },
        volumeUSD: {
          allTime: new Decimal(0),
          last24h: new Decimal(0),
          last7d: new Decimal(0),
          last30d: new Decimal(0),
        },
        swaps: {
          allTime: 0,
          last24h: 0,
          last7d: 0,
          last30d: 0,
        },
      });
    }
    return accounts.get(accountId)!;
  };

  // 4) Process all swap events with rate limiting
  let offset = 0;
  const limit = cfg.BATCH_SIZE;
  const useIn = cfg.VOLUME_SIDE === 'in';
  let batchCount = 0;

  while (true) {
    // Add a small delay between batches to avoid rate limiting (after first batch)
    if (batchCount > 0 && batchCount % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms pause every 5 batches
    }
    
    const batch = await fetchSwapBatch(offset, limit);
    if (batch.length === 0) break;
    batchCount++;

    for (const ev of batch) {
      const tokenInId = ev.token_in_id ?? '';
      const tokenOutId = ev.token_out_id ?? '';
      const accountId = ev.account_id ?? '';

      // Skip if no account or if it's a deposit/withdraw (no fee)
      if (!accountId || !tokenInId || !tokenOutId) continue;
      if (isDepositWithdrawPair(tokenInId, tokenOutId)) continue;

      // Calculate volume in USD
      const amountStr = (useIn ? ev.amount_in : ev.amount_out) ?? '0';
      const tokenId = (useIn ? ev.token_in_id : ev.token_out_id) ?? '';

      let amount: Decimal;
      try { amount = new Decimal(amountStr); }
      catch { continue; }

      const priceId = intentsToPriceId(tokenId);
      if (!priceId) continue;

      const price = prices[priceId];
      if (!price) continue;

      const volumeUSD = amount.times(price);

      // Get account data and calculate fee
      const acctData = getAccountData(accountId);
      const feeRate = FEE_RATES[acctData.tier];
      const feeUSD = volumeUSD.times(feeRate);

      // Parse event timestamp
      const eventTime = new Date(ev.timestamp).getTime();

      // Update all-time
      acctData.fees.allTime = acctData.fees.allTime.plus(feeUSD);
      acctData.volumeUSD.allTime = acctData.volumeUSD.allTime.plus(volumeUSD);
      acctData.swaps.allTime++;

      // Update time-based metrics
      if (eventTime >= timeFrames['30d']) {
        acctData.fees.last30d = acctData.fees.last30d.plus(feeUSD);
        acctData.volumeUSD.last30d = acctData.volumeUSD.last30d.plus(volumeUSD);
        acctData.swaps.last30d++;
      }
      if (eventTime >= timeFrames['7d']) {
        acctData.fees.last7d = acctData.fees.last7d.plus(feeUSD);
        acctData.volumeUSD.last7d = acctData.volumeUSD.last7d.plus(volumeUSD);
        acctData.swaps.last7d++;
      }
      if (eventTime >= timeFrames['24h']) {
        acctData.fees.last24h = acctData.fees.last24h.plus(feeUSD);
        acctData.volumeUSD.last24h = acctData.volumeUSD.last24h.plus(volumeUSD);
        acctData.swaps.last24h++;
      }
    }

    offset += batch.length;
  }

  // 5) Convert to array and sort by different time periods
  const allAccounts = Array.from(accounts.values());

  const sortByFee = (period: keyof FeeMetrics) => 
    [...allAccounts]
      .filter(a => a.fees[period].gt(0))
      .sort((a, b) => b.fees[period].minus(a.fees[period]).toNumber())
      .slice(0, 20)
      .map(a => ({
        accountId: a.accountId,
        tier: a.tier,
        feesPaid: a.fees[period].toFixed(2),
        volumeUSD: a.volumeUSD[period].toFixed(2),
        swaps: a.swaps[period === 'allTime' ? 'allTime' : period === 'last24h' ? 'last24h' : period === 'last7d' ? 'last7d' : 'last30d'],
      }));

  // Calculate totals
  const totals = {
    allTime: {
      basic: new Decimal(0),
      premium: new Decimal(0),
      ambassador: new Decimal(0),
    },
    last24h: {
      basic: new Decimal(0),
      premium: new Decimal(0),
      ambassador: new Decimal(0),
    },
    last7d: {
      basic: new Decimal(0),
      premium: new Decimal(0),
      ambassador: new Decimal(0),
    },
    last30d: {
      basic: new Decimal(0),
      premium: new Decimal(0),
      ambassador: new Decimal(0),
    },
  };

  for (const acct of allAccounts) {
    totals.allTime[acct.tier] = totals.allTime[acct.tier].plus(acct.fees.allTime);
    totals.last24h[acct.tier] = totals.last24h[acct.tier].plus(acct.fees.last24h);
    totals.last7d[acct.tier] = totals.last7d[acct.tier].plus(acct.fees.last7d);
    totals.last30d[acct.tier] = totals.last30d[acct.tier].plus(acct.fees.last30d);
  }

  return {
    leaderboards: {
      allTime: sortByFee('allTime'),
      last24h: sortByFee('last24h'),
      last7d: sortByFee('last7d'),
      last30d: sortByFee('last30d'),
    },
    totals: {
      allTime: {
        basic: totals.allTime.basic.toFixed(2),
        premium: totals.allTime.premium.toFixed(2),
        ambassador: totals.allTime.ambassador.toFixed(2),
        total: totals.allTime.basic.plus(totals.allTime.premium).plus(totals.allTime.ambassador).toFixed(2),
      },
      last24h: {
        basic: totals.last24h.basic.toFixed(2),
        premium: totals.last24h.premium.toFixed(2),
        ambassador: totals.last24h.ambassador.toFixed(2),
        total: totals.last24h.basic.plus(totals.last24h.premium).plus(totals.last24h.ambassador).toFixed(2),
      },
      last7d: {
        basic: totals.last7d.basic.toFixed(2),
        premium: totals.last7d.premium.toFixed(2),
        ambassador: totals.last7d.ambassador.toFixed(2),
        total: totals.last7d.basic.plus(totals.last7d.premium).plus(totals.last7d.ambassador).toFixed(2),
      },
      last30d: {
        basic: totals.last30d.basic.toFixed(2),
        premium: totals.last30d.premium.toFixed(2),
        ambassador: totals.last30d.ambassador.toFixed(2),
        total: totals.last30d.basic.plus(totals.last30d.premium).plus(totals.last30d.ambassador).toFixed(2),
      },
    },
    userCounts: {
      premium: userLists.premium.size,
      ambassador: userLists.ambassador.size,
    },
    feeRates: {
      basic: '0.88%',
      ambassador: '0.66%',
      premium: '0.22%',
    },
    generatedAt: new Date().toISOString(),
  };
}

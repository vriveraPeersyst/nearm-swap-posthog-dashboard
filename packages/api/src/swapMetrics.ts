import { Decimal } from 'decimal.js';
import { cfg } from './config.js';
import { fetchPricesOnce } from './prices.js';
import { fetchSwapBatch, type SwapEventRow } from './posthog.js';
import { intentsToPriceId, isDepositWithdrawPair } from './tokenMapping.js';

type Diagnostics = {
  unmappedIntentTokenIds: Set<string>;
  priceIdMissing: Set<string>;
  badAmounts: number;
};

type TimeBasedMetrics = {
  swaps: number;
  volumeUSD: Decimal;
};

type PairMetrics = {
  swaps: number;
  volumeUSD: Decimal;
  last24h: {
    swaps: number;
    volumeUSD: Decimal;
  };
  last7d: {
    swaps: number;
    volumeUSD: Decimal;
  };
  last30d: {
    swaps: number;
    volumeUSD: Decimal;
  };
};

type AccountMetrics = {
  swaps: number;
  volumeUSD: Decimal;
  feeSwaps: number;
  feeVolumeUSD: Decimal;
  last24h: { swaps: number; volumeUSD: Decimal };
  last7d: { swaps: number; volumeUSD: Decimal };
  last30d: { swaps: number; volumeUSD: Decimal };
};

export async function getSwapMetrics() {
  // 1) Get prices ONCE
  const prices = await fetchPricesOnce(); // id -> Decimal price
  const diags: Diagnostics = {
    unmappedIntentTokenIds: new Set(),
    priceIdMissing: new Set(),
    badAmounts: 0
  };

  // 2) Setup time periods (in milliseconds from now)
  const now = Date.now();
  const timeFrames = {
    '24h': now - (24 * 60 * 60 * 1000),
    '48h': now - (48 * 60 * 60 * 1000), // For previous 24h comparison
    '7d': now - (7 * 24 * 60 * 60 * 1000),
    '14d': now - (14 * 24 * 60 * 60 * 1000), // For previous 7d comparison
    '30d': now - (30 * 24 * 60 * 60 * 1000),
    '60d': now - (60 * 24 * 60 * 60 * 1000) // For previous 30d comparison
  };

  // 3) Initialize metrics for each time period
  const metrics = {
    allTime: { swaps: 0, volumeUSD: new Decimal(0) },
    last24h: { swaps: 0, volumeUSD: new Decimal(0) },
    previous24h: { swaps: 0, volumeUSD: new Decimal(0) }, // 24-48h ago
    last7d: { swaps: 0, volumeUSD: new Decimal(0) },
    previous7d: { swaps: 0, volumeUSD: new Decimal(0) }, // 7-14d ago
    last30d: { swaps: 0, volumeUSD: new Decimal(0) },
    previous30d: { swaps: 0, volumeUSD: new Decimal(0) } // 30-60d ago
  };

  // Fee swaps metrics (excludes deposits/withdraws - native ↔ intent conversions)
  const feeSwaps = {
    allTime: { swaps: 0, volumeUSD: new Decimal(0) },
    last24h: { swaps: 0, volumeUSD: new Decimal(0) },
    last7d: { swaps: 0, volumeUSD: new Decimal(0) },
    last30d: { swaps: 0, volumeUSD: new Decimal(0) }
  };

  // 4) Initialize trading pair tracking
  const tradingPairs = new Map<string, PairMetrics>();
  const feeSwapPairs = new Map<string, PairMetrics>(); // Only fee-generating swaps

  // 5) Initialize account tracking
  const accounts = new Map<string, AccountMetrics>();

  const getAccountMetrics = (accountId: string): AccountMetrics => {
    if (!accounts.has(accountId)) {
      accounts.set(accountId, {
        swaps: 0,
        volumeUSD: new Decimal(0),
        feeSwaps: 0,
        feeVolumeUSD: new Decimal(0),
        last24h: { swaps: 0, volumeUSD: new Decimal(0) },
        last7d: { swaps: 0, volumeUSD: new Decimal(0) },
        last30d: { swaps: 0, volumeUSD: new Decimal(0) }
      });
    }
    return accounts.get(accountId)!;
  };

  // Helper function to get/create pair metrics
  const getPairMetrics = (tokenA: string, tokenB: string): PairMetrics => {
    const pairKey = `${tokenA} → ${tokenB}`;
    if (!tradingPairs.has(pairKey)) {
      tradingPairs.set(pairKey, {
        swaps: 0,
        volumeUSD: new Decimal(0),
        last24h: {
          swaps: 0,
          volumeUSD: new Decimal(0)
        },
        last7d: {
          swaps: 0,
          volumeUSD: new Decimal(0)
        },
        last30d: {
          swaps: 0,
          volumeUSD: new Decimal(0)
        }
      });
    }
    return tradingPairs.get(pairKey)!;
  };

  // 5) Iterate events one-by-one oldest→newest
  let offset = 0;
  const limit = cfg.BATCH_SIZE;

  let processed = 0;
  const useIn = cfg.VOLUME_SIDE === 'in';

  while (true) {
    if (cfg.MAX_EVENTS > 0 && processed >= cfg.MAX_EVENTS) break;

    const batch = await fetchSwapBatch(offset, limit);
    if (batch.length === 0) break;

    for (const ev of batch) {
      if (cfg.MAX_EVENTS > 0 && processed >= cfg.MAX_EVENTS) break;

      const amountStr = (useIn ? ev.amount_in : ev.amount_out) ?? '0';
      const tokenId   = (useIn ? ev.token_in_id : ev.token_out_id) ?? '';

      // Get both token IDs for pair tracking
      const tokenInId = ev.token_in_id ?? '';
      const tokenOutId = ev.token_out_id ?? '';
      const accountId = ev.account_id ?? '';

      // Parse event timestamp
      const eventTime = new Date(ev.timestamp).getTime();
      const isLast24h = eventTime >= timeFrames['24h'];
      
      let amount: Decimal;
      try { amount = new Decimal(amountStr); }
      catch { diags.badAmounts++; continue; }

      let volumeContribution = new Decimal(0);
      const priceId = intentsToPriceId(tokenId);
      if (!priceId) {
        diags.unmappedIntentTokenIds.add(tokenId || '(empty)');
      } else {
        const price = prices[priceId];
        if (!price) {
          diags.priceIdMissing.add(priceId);
        } else {
          volumeContribution = amount.times(price);
          // TON decimals are off by 3 (shows 1000x higher), so divide by 1000
          // Only apply for events before Feb 5, 2026 when the fix was deployed
          const tonFixDate = new Date('2026-02-05T00:00:00Z').getTime();
          if (priceId === 'the-open-network' && eventTime < tonFixDate) {
            volumeContribution = volumeContribution.dividedBy(1000);
          }
        }
      }

      // Add to all-time metrics
      metrics.allTime.swaps++;
      metrics.allTime.volumeUSD = metrics.allTime.volumeUSD.plus(volumeContribution);

      // Add to time-based metrics if within timeframe
      if (eventTime >= timeFrames['30d']) {
        metrics.last30d.swaps++;
        metrics.last30d.volumeUSD = metrics.last30d.volumeUSD.plus(volumeContribution);
      }
      if (eventTime >= timeFrames['7d']) {
        metrics.last7d.swaps++;
        metrics.last7d.volumeUSD = metrics.last7d.volumeUSD.plus(volumeContribution);
      }
      if (eventTime >= timeFrames['24h']) {
        metrics.last24h.swaps++;
        metrics.last24h.volumeUSD = metrics.last24h.volumeUSD.plus(volumeContribution);
      }
      
      // Track previous periods for growth calculations
      // Previous 24h period (24-48h ago)
      if (eventTime >= timeFrames['48h'] && eventTime < timeFrames['24h']) {
        metrics.previous24h.swaps++;
        metrics.previous24h.volumeUSD = metrics.previous24h.volumeUSD.plus(volumeContribution);
      }
      // Previous 7d period (7-14d ago)
      if (eventTime >= timeFrames['14d'] && eventTime < timeFrames['7d']) {
        metrics.previous7d.swaps++;
        metrics.previous7d.volumeUSD = metrics.previous7d.volumeUSD.plus(volumeContribution);
      }
      // Previous 30d period (30-60d ago)
      if (eventTime >= timeFrames['60d'] && eventTime < timeFrames['30d']) {
        metrics.previous30d.swaps++;
        metrics.previous30d.volumeUSD = metrics.previous30d.volumeUSD.plus(volumeContribution);
      }

      // Track trading pairs (A → B)
      if (tokenInId && tokenOutId) {
        const pairMetrics = getPairMetrics(tokenInId, tokenOutId);
        pairMetrics.swaps++;
        pairMetrics.volumeUSD = pairMetrics.volumeUSD.plus(volumeContribution);
        
        if (eventTime >= timeFrames['24h']) {
          pairMetrics.last24h.swaps++;
          pairMetrics.last24h.volumeUSD = pairMetrics.last24h.volumeUSD.plus(volumeContribution);
        }
        if (eventTime >= timeFrames['7d']) {
          pairMetrics.last7d.swaps++;
          pairMetrics.last7d.volumeUSD = pairMetrics.last7d.volumeUSD.plus(volumeContribution);
        }
        if (eventTime >= timeFrames['30d']) {
          pairMetrics.last30d.swaps++;
          pairMetrics.last30d.volumeUSD = pairMetrics.last30d.volumeUSD.plus(volumeContribution);
        }

        // Track fee swaps (exclude deposits/withdraws - native ↔ intent conversions)
        const isDepositWithdraw = isDepositWithdrawPair(tokenInId, tokenOutId);
        if (!isDepositWithdraw) {
          // Update fee swap totals
          feeSwaps.allTime.swaps++;
          feeSwaps.allTime.volumeUSD = feeSwaps.allTime.volumeUSD.plus(volumeContribution);

          if (eventTime >= timeFrames['24h']) {
            feeSwaps.last24h.swaps++;
            feeSwaps.last24h.volumeUSD = feeSwaps.last24h.volumeUSD.plus(volumeContribution);
          }
          if (eventTime >= timeFrames['7d']) {
            feeSwaps.last7d.swaps++;
            feeSwaps.last7d.volumeUSD = feeSwaps.last7d.volumeUSD.plus(volumeContribution);
          }
          if (eventTime >= timeFrames['30d']) {
            feeSwaps.last30d.swaps++;
            feeSwaps.last30d.volumeUSD = feeSwaps.last30d.volumeUSD.plus(volumeContribution);
          }

          // Track fee swap pairs
          const feePairKey = `${tokenInId} → ${tokenOutId}`;
          if (!feeSwapPairs.has(feePairKey)) {
            feeSwapPairs.set(feePairKey, {
              swaps: 0,
              volumeUSD: new Decimal(0),
              last24h: { swaps: 0, volumeUSD: new Decimal(0) },
              last7d: { swaps: 0, volumeUSD: new Decimal(0) },
              last30d: { swaps: 0, volumeUSD: new Decimal(0) }
            });
          }
          const feePairMetrics = feeSwapPairs.get(feePairKey)!;
          feePairMetrics.swaps++;
          feePairMetrics.volumeUSD = feePairMetrics.volumeUSD.plus(volumeContribution);

          if (eventTime >= timeFrames['24h']) {
            feePairMetrics.last24h.swaps++;
            feePairMetrics.last24h.volumeUSD = feePairMetrics.last24h.volumeUSD.plus(volumeContribution);
          }
          if (eventTime >= timeFrames['7d']) {
            feePairMetrics.last7d.swaps++;
            feePairMetrics.last7d.volumeUSD = feePairMetrics.last7d.volumeUSD.plus(volumeContribution);
          }
          if (eventTime >= timeFrames['30d']) {
            feePairMetrics.last30d.swaps++;
            feePairMetrics.last30d.volumeUSD = feePairMetrics.last30d.volumeUSD.plus(volumeContribution);
          }
        }
      }

      // Track account metrics
      if (accountId) {
        const acctMetrics = getAccountMetrics(accountId);
        acctMetrics.swaps++;
        acctMetrics.volumeUSD = acctMetrics.volumeUSD.plus(volumeContribution);

        if (eventTime >= timeFrames['24h']) {
          acctMetrics.last24h.swaps++;
          acctMetrics.last24h.volumeUSD = acctMetrics.last24h.volumeUSD.plus(volumeContribution);
        }
        if (eventTime >= timeFrames['7d']) {
          acctMetrics.last7d.swaps++;
          acctMetrics.last7d.volumeUSD = acctMetrics.last7d.volumeUSD.plus(volumeContribution);
        }
        if (eventTime >= timeFrames['30d']) {
          acctMetrics.last30d.swaps++;
          acctMetrics.last30d.volumeUSD = acctMetrics.last30d.volumeUSD.plus(volumeContribution);
        }

        // Track fee swaps per account (only if not deposit/withdraw)
        if (tokenInId && tokenOutId && !isDepositWithdrawPair(tokenInId, tokenOutId)) {
          acctMetrics.feeSwaps++;
          acctMetrics.feeVolumeUSD = acctMetrics.feeVolumeUSD.plus(volumeContribution);
        }
      }

      processed++;
    }

    offset += batch.length;
    if (batch.length < limit) break; // finished
  }

  // 5) Calculate growth percentages
  const calculateGrowth = (current: number, previous: number): number | null => {
    if (previous === 0) return current > 0 ? null : 0; // Can't calculate % from zero
    return ((current - previous) / previous) * 100;
  };

  const swapGrowth24h = calculateGrowth(metrics.last24h.swaps, metrics.previous24h.swaps);
  const volumeGrowth24h = calculateGrowth(
    metrics.last24h.volumeUSD.toNumber(), 
    metrics.previous24h.volumeUSD.toNumber()
  );

  const swapGrowth7d = calculateGrowth(metrics.last7d.swaps, metrics.previous7d.swaps);
  const volumeGrowth7d = calculateGrowth(
    metrics.last7d.volumeUSD.toNumber(), 
    metrics.previous7d.volumeUSD.toNumber()
  );

  const swapGrowth30d = calculateGrowth(metrics.last30d.swaps, metrics.previous30d.swaps);
  const volumeGrowth30d = calculateGrowth(
    metrics.last30d.volumeUSD.toNumber(), 
    metrics.previous30d.volumeUSD.toNumber()
  );

  // 6) Process trading pairs for output
  const topPairsAllTime = Array.from(tradingPairs.entries())
    .map(([pair, metrics]) => ({
      pair,
      totalSwaps: metrics.swaps,
      totalVolumeUSD: metrics.volumeUSD.toNumber(),
      last24hSwaps: metrics.last24h.swaps,
      last24hVolumeUSD: metrics.last24h.volumeUSD.toNumber()
    }))
    .sort((a, b) => b.totalVolumeUSD - a.totalVolumeUSD)
    .slice(0, 30); // Top 30 pairs by volume

  const topPairs24h = Array.from(tradingPairs.entries())
    .map(([pair, metrics]) => ({
      pair,
      totalSwaps: metrics.swaps,
      totalVolumeUSD: metrics.volumeUSD.toNumber(),
      last24hSwaps: metrics.last24h.swaps,
      last24hVolumeUSD: metrics.last24h.volumeUSD.toNumber()
    }))
    .filter(p => p.last24hSwaps > 0)
    .sort((a, b) => b.last24hVolumeUSD - a.last24hVolumeUSD)
    .slice(0, 30); // Top 30 pairs by 24h volume

  const topPairs7d = Array.from(tradingPairs.entries())
    .map(([pair, metrics]) => ({
      pair,
      totalSwaps: metrics.swaps,
      totalVolumeUSD: metrics.volumeUSD.toNumber(),
      periodSwaps: metrics.last7d.swaps,
      periodVolumeUSD: metrics.last7d.volumeUSD.toNumber()
    }))
    .filter(p => p.periodSwaps > 0)
    .sort((a, b) => b.periodVolumeUSD - a.periodVolumeUSD)
    .slice(0, 30); // Top 30 pairs by 7d volume

  const topPairs30d = Array.from(tradingPairs.entries())
    .map(([pair, metrics]) => ({
      pair,
      totalSwaps: metrics.swaps,
      totalVolumeUSD: metrics.volumeUSD.toNumber(),
      periodSwaps: metrics.last30d.swaps,
      periodVolumeUSD: metrics.last30d.volumeUSD.toNumber()
    }))
    .filter(p => p.periodSwaps > 0)
    .sort((a, b) => b.periodVolumeUSD - a.periodVolumeUSD)
    .slice(0, 30); // Top 30 pairs by 30d volume

  // Process fee swap pairs (excludes deposits/withdraws)
  const topFeeSwapPairsAllTime = Array.from(feeSwapPairs.entries())
    .map(([pair, metrics]) => ({
      pair,
      totalSwaps: metrics.swaps,
      totalVolumeUSD: metrics.volumeUSD.toNumber(),
      last24hSwaps: metrics.last24h.swaps,
      last24hVolumeUSD: metrics.last24h.volumeUSD.toNumber()
    }))
    .sort((a, b) => b.totalVolumeUSD - a.totalVolumeUSD)
    .slice(0, 30);

  const topFeeSwapPairs24h = Array.from(feeSwapPairs.entries())
    .map(([pair, metrics]) => ({
      pair,
      totalSwaps: metrics.swaps,
      totalVolumeUSD: metrics.volumeUSD.toNumber(),
      last24hSwaps: metrics.last24h.swaps,
      last24hVolumeUSD: metrics.last24h.volumeUSD.toNumber()
    }))
    .filter(p => p.last24hSwaps > 0)
    .sort((a, b) => b.last24hVolumeUSD - a.last24hVolumeUSD)
    .slice(0, 30);

  const topFeeSwapPairs7d = Array.from(feeSwapPairs.entries())
    .map(([pair, metrics]) => ({
      pair,
      totalSwaps: metrics.swaps,
      totalVolumeUSD: metrics.volumeUSD.toNumber(),
      periodSwaps: metrics.last7d.swaps,
      periodVolumeUSD: metrics.last7d.volumeUSD.toNumber()
    }))
    .filter(p => p.periodSwaps > 0)
    .sort((a, b) => b.periodVolumeUSD - a.periodVolumeUSD)
    .slice(0, 30);

  const topFeeSwapPairs30d = Array.from(feeSwapPairs.entries())
    .map(([pair, metrics]) => ({
      pair,
      totalSwaps: metrics.swaps,
      totalVolumeUSD: metrics.volumeUSD.toNumber(),
      periodSwaps: metrics.last30d.swaps,
      periodVolumeUSD: metrics.last30d.volumeUSD.toNumber()
    }))
    .filter(p => p.periodSwaps > 0)
    .sort((a, b) => b.periodVolumeUSD - a.periodVolumeUSD)
    .slice(0, 30);

  // Process top swappers
  const mapAccountToOutput = (accountId: string, m: AccountMetrics) => ({
    accountId,
    totalSwaps: m.swaps,
    totalVolumeUSD: m.volumeUSD.toNumber(),
    feeSwaps: m.feeSwaps,
    feeVolumeUSD: m.feeVolumeUSD.toNumber(),
    last24hSwaps: m.last24h.swaps,
    last24hVolumeUSD: m.last24h.volumeUSD.toNumber(),
    last7dSwaps: m.last7d.swaps,
    last7dVolumeUSD: m.last7d.volumeUSD.toNumber(),
    last30dSwaps: m.last30d.swaps,
    last30dVolumeUSD: m.last30d.volumeUSD.toNumber()
  });

  const topSwappersByVolume = Array.from(accounts.entries())
    .map(([accountId, m]) => mapAccountToOutput(accountId, m))
    .sort((a, b) => b.totalVolumeUSD - a.totalVolumeUSD)
    .slice(0, 30);

  const topSwappersByCount = Array.from(accounts.entries())
    .map(([accountId, m]) => mapAccountToOutput(accountId, m))
    .sort((a, b) => b.totalSwaps - a.totalSwaps)
    .slice(0, 30);

  const topSwappersByFeeVolume = Array.from(accounts.entries())
    .map(([accountId, m]) => mapAccountToOutput(accountId, m))
    .filter(a => a.feeSwaps > 0)
    .sort((a, b) => b.feeVolumeUSD - a.feeVolumeUSD)
    .slice(0, 30);

  const topSwappers24h = Array.from(accounts.entries())
    .map(([accountId, m]) => mapAccountToOutput(accountId, m))
    .filter(a => a.last24hSwaps > 0)
    .sort((a, b) => b.last24hVolumeUSD - a.last24hVolumeUSD)
    .slice(0, 30);

  const topSwappers7d = Array.from(accounts.entries())
    .map(([accountId, m]) => mapAccountToOutput(accountId, m))
    .filter(a => a.last7dSwaps > 0)
    .sort((a, b) => b.last7dVolumeUSD - a.last7dVolumeUSD)
    .slice(0, 30);

  const topSwappers30d = Array.from(accounts.entries())
    .map(([accountId, m]) => mapAccountToOutput(accountId, m))
    .filter(a => a.last30dSwaps > 0)
    .sort((a, b) => b.last30dVolumeUSD - a.last30dVolumeUSD)
    .slice(0, 30);

  // 7) Output with time-based metrics and growth
  return {
    sideValued: cfg.VOLUME_SIDE,
    
    // All-time metrics
    allTime: {
      totalSwaps: metrics.allTime.swaps,
      totalVolumeUSD: metrics.allTime.volumeUSD.toNumber()
    },
    
    // Recent activity metrics
    last24h: {
      totalSwaps: metrics.last24h.swaps,
      totalVolumeUSD: metrics.last24h.volumeUSD.toNumber(),
      swapGrowthPercent: swapGrowth24h !== null ? Number(swapGrowth24h.toFixed(2)) : null,
      volumeGrowthPercent: volumeGrowth24h !== null ? Number(volumeGrowth24h.toFixed(2)) : null
    },
    
    // Previous 24h for context
    previous24h: {
      totalSwaps: metrics.previous24h.swaps,
      totalVolumeUSD: metrics.previous24h.volumeUSD.toNumber()
    },
    
    last7d: {
      totalSwaps: metrics.last7d.swaps,
      totalVolumeUSD: metrics.last7d.volumeUSD.toNumber(),
      swapGrowthPercent: swapGrowth7d !== null ? Number(swapGrowth7d.toFixed(2)) : null,
      volumeGrowthPercent: volumeGrowth7d !== null ? Number(volumeGrowth7d.toFixed(2)) : null
    },
    
    last30d: {
      totalSwaps: metrics.last30d.swaps,
      totalVolumeUSD: metrics.last30d.volumeUSD.toNumber(),
      swapGrowthPercent: swapGrowth30d !== null ? Number(swapGrowth30d.toFixed(2)) : null,
      volumeGrowthPercent: volumeGrowth30d !== null ? Number(volumeGrowth30d.toFixed(2)) : null
    },
    
    // Trading pair analytics
    topTradingPairs: {
      allTime: topPairsAllTime,
      last24h: topPairs24h,
      last7d: topPairs7d,
      last30d: topPairs30d
    },

    // Fee swaps (excludes deposits/withdraws - native ↔ intent conversions)
    feeSwaps: {
      allTime: {
        totalSwaps: feeSwaps.allTime.swaps,
        totalVolumeUSD: feeSwaps.allTime.volumeUSD.toNumber()
      },
      last24h: {
        totalSwaps: feeSwaps.last24h.swaps,
        totalVolumeUSD: feeSwaps.last24h.volumeUSD.toNumber()
      },
      last7d: {
        totalSwaps: feeSwaps.last7d.swaps,
        totalVolumeUSD: feeSwaps.last7d.volumeUSD.toNumber()
      },
      last30d: {
        totalSwaps: feeSwaps.last30d.swaps,
        totalVolumeUSD: feeSwaps.last30d.volumeUSD.toNumber()
      },
      topPairs: {
        allTime: topFeeSwapPairsAllTime,
        last24h: topFeeSwapPairs24h,
        last7d: topFeeSwapPairs7d,
        last30d: topFeeSwapPairs30d
      }
    },

    // Top swappers analytics
    topSwappers: {
      byVolume: topSwappersByVolume,
      byCount: topSwappersByCount,
      byFeeVolume: topSwappersByFeeVolume,
      last24h: topSwappers24h,
      last7d: topSwappers7d,
      last30d: topSwappers30d,
      totalUniqueAccounts: accounts.size
    },
    
    // Diagnostics
    notes: {
      unmappedIntentTokenIds: [...diags.unmappedIntentTokenIds],
      priceIdMissing: [...diags.priceIdMissing],
      badAmounts: diags.badAmounts
    }
  };
}

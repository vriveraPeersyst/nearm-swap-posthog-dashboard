import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Decimal } from 'decimal.js';
import { cfg } from '../src/config.js';
import { fetchPricesOnce } from '../src/prices.js';
import { fetchSwapBatch, type SwapEventRow } from '../src/posthog.js';
import { intentsToPriceId } from '../src/tokenMapping.js';

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
};

async function getSwapMetrics() {
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

  // 4) Initialize trading pair tracking
  const tradingPairs = new Map<string, PairMetrics>();

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
      const tokenId = (useIn ? ev.token_in_id : ev.token_out_id) ?? '';

      // Get both token IDs for pair tracking
      const tokenInId = ev.token_in_id ?? '';
      const tokenOutId = ev.token_out_id ?? '';

      // Parse event timestamp
      const eventTime = new Date(ev.timestamp).getTime();

      try {
        const amount = new Decimal(amountStr);
        if (amount.lte(0)) {
          diags.badAmounts++;
          processed++;
          continue;
        }

        // Map token to price ID
        const priceId = intentsToPriceId(tokenId);
        if (!priceId) {
          diags.unmappedIntentTokenIds.add(tokenId);
          processed++;
          continue;
        }

        // Get USD price
        const usdPrice = prices[priceId];
        if (!usdPrice) {
          diags.priceIdMissing.add(priceId);
          processed++;
          continue;
        }

        const volumeUSD = amount.times(usdPrice);

        // Update time-based metrics
        metrics.allTime.swaps++;
        metrics.allTime.volumeUSD = metrics.allTime.volumeUSD.plus(volumeUSD);

        if (eventTime >= timeFrames['24h']) {
          metrics.last24h.swaps++;
          metrics.last24h.volumeUSD = metrics.last24h.volumeUSD.plus(volumeUSD);
        } else if (eventTime >= timeFrames['48h']) {
          metrics.previous24h.swaps++;
          metrics.previous24h.volumeUSD = metrics.previous24h.volumeUSD.plus(volumeUSD);
        }

        if (eventTime >= timeFrames['7d']) {
          metrics.last7d.swaps++;
          metrics.last7d.volumeUSD = metrics.last7d.volumeUSD.plus(volumeUSD);
        } else if (eventTime >= timeFrames['14d']) {
          metrics.previous7d.swaps++;
          metrics.previous7d.volumeUSD = metrics.previous7d.volumeUSD.plus(volumeUSD);
        }

        if (eventTime >= timeFrames['30d']) {
          metrics.last30d.swaps++;
          metrics.last30d.volumeUSD = metrics.last30d.volumeUSD.plus(volumeUSD);
        } else if (eventTime >= timeFrames['60d']) {
          metrics.previous30d.swaps++;
          metrics.previous30d.volumeUSD = metrics.previous30d.volumeUSD.plus(volumeUSD);
        }

        // Update trading pair metrics
        if (tokenInId && tokenOutId) {
          const pairMetrics = getPairMetrics(tokenInId, tokenOutId);
          pairMetrics.swaps++;
          pairMetrics.volumeUSD = pairMetrics.volumeUSD.plus(volumeUSD);

          if (eventTime >= timeFrames['24h']) {
            pairMetrics.last24h.swaps++;
            pairMetrics.last24h.volumeUSD = pairMetrics.last24h.volumeUSD.plus(volumeUSD);
          }
        }

        processed++;
      } catch (error) {
        diags.badAmounts++;
        processed++;
        continue;
      }
    }

    offset += limit;
  }

  // 6) Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const volumeChange24h = calculateChange(
    metrics.last24h.volumeUSD.toNumber(),
    metrics.previous24h.volumeUSD.toNumber()
  );

  const volumeChange7d = calculateChange(
    metrics.last7d.volumeUSD.toNumber(),
    metrics.previous7d.volumeUSD.toNumber()
  );

  const volumeChange30d = calculateChange(
    metrics.last30d.volumeUSD.toNumber(),
    metrics.previous30d.volumeUSD.toNumber()
  );

  const swapChange24h = calculateChange(metrics.last24h.swaps, metrics.previous24h.swaps);
  const swapChange7d = calculateChange(metrics.last7d.swaps, metrics.previous7d.swaps);
  const swapChange30d = calculateChange(metrics.last30d.swaps, metrics.previous30d.swaps);

  // 7) Prepare top pairs (sort by 24h volume)
  const topPairs = Array.from(tradingPairs.entries())
    .sort(([, a], [, b]) => b.last24h.volumeUSD.minus(a.last24h.volumeUSD).toNumber())
    .slice(0, 10)
    .map(([pair, metrics]) => ({
      pair,
      swaps: metrics.swaps,
      volumeUSD: metrics.volumeUSD.toFixed(2),
      last24h: {
        swaps: metrics.last24h.swaps,
        volumeUSD: metrics.last24h.volumeUSD.toFixed(2)
      }
    }));

  // 8) Return structured data
  return {
    summary: {
      totalVolume: metrics.allTime.volumeUSD.toFixed(2),
      totalSwaps: metrics.allTime.swaps,
      volume24h: metrics.last24h.volumeUSD.toFixed(2),
      swaps24h: metrics.last24h.swaps,
      volumeChange24h: volumeChange24h.toFixed(2),
      swapChange24h: swapChange24h.toFixed(2),
      volume7d: metrics.last7d.volumeUSD.toFixed(2),
      swaps7d: metrics.last7d.swaps,
      volumeChange7d: volumeChange7d.toFixed(2),
      swapChange7d: swapChange7d.toFixed(2),
      volume30d: metrics.last30d.volumeUSD.toFixed(2),
      swaps30d: metrics.last30d.swaps,
      volumeChange30d: volumeChange30d.toFixed(2),
      swapChange30d: swapChange30d.toFixed(2)
    },
    topPairs,
    diagnostics: {
      unmappedTokens: Array.from(diags.unmappedIntentTokenIds).slice(0, 10),
      missingPrices: Array.from(diags.priceIdMissing).slice(0, 10),
      badAmounts: diags.badAmounts,
      processed
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('Fetching swap metrics...');
    const data = await getSwapMetrics();
    console.log('Successfully fetched metrics');
    res.json(data);
  } catch (error) {
    console.error('Error fetching swap metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch swap metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

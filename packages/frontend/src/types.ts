export interface TradingPair {
  pair: string;
  totalSwaps: number;
  totalVolumeUSD: number;
  last24hSwaps: number;
  last24hVolumeUSD: number;
}

export interface TimeMetrics {
  totalSwaps: number;
  totalVolumeUSD: number;
  swapGrowthPercent?: number | null;
  volumeGrowthPercent?: number | null;
}

export interface SwapMetrics {
  sideValued: string;
  allTime: TimeMetrics;
  last24h: TimeMetrics;
  previous24h: TimeMetrics;
  last7d: TimeMetrics;
  last30d: TimeMetrics;
  topTradingPairs: {
    allTime: TradingPair[];
    last24h: TradingPair[];
  };
  notes: {
    unmappedIntentTokenIds: string[];
    priceIdMissing: string[];
    badAmounts: number;
  };
}

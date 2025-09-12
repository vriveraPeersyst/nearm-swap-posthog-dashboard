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

export interface AccountValueSummary {
  total_unique_accounts: number;
  total_near_value: number;
  total_near_staked: number;
  total_near_staked_by_validator: number;
  total_near_combined: number;
  avg_near_value: number;
  avg_near_staked: number;
  accounts_with_near_value: number;
  accounts_with_near_staked: number;
  accounts_with_any_balance: number;
  earliest_account_update: string;
  most_recent_account_update: string;
  total_account_state_events: number;
}

export interface TopAccountData {
  account_id: string;
  near_balance: number;
  near_staked: number;
  total_value: number;
  latest_update: string;
  events_count: number;
}

export interface TopAccountsResponse {
  accounts: TopAccountData[];
  total_accounts_found: number;
  date_range: {
    start_date: string;
    end_date: string;
  };
  query_metadata: {
    limit: number;
    total_events_processed: number;
  };
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

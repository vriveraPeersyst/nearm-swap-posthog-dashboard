export interface ValidatorStats {
  validator_id: string;
  total_delegators: number;
  total_near_staked: number;
  near_staked_3d_change: number;
  near_staked_3d_change_percent: number;
  near_staked_7d_change: number;
  near_staked_7d_change_percent: number;
  near_staked_30d_change: number;
  near_staked_30d_change_percent: number;
  delegators_3d_change: number;
  delegators_7d_change: number;
  delegators_30d_change: number;
  latest_update: string;
}

export interface TradingPair {
  pair: string;
  totalSwaps: number;
  totalVolumeUSD: number;
  last24hSwaps: number;
  last24hVolumeUSD: number;
}

export interface PeriodTradingPair {
  pair: string;
  totalSwaps: number;
  totalVolumeUSD: number;
  periodSwaps: number;
  periodVolumeUSD: number;
}

export interface SwapperData {
  accountId: string;
  totalSwaps: number;
  totalVolumeUSD: number;
  feeSwaps: number;
  feeVolumeUSD: number;
  last24hSwaps: number;
  last24hVolumeUSD: number;
  last7dSwaps: number;
  last7dVolumeUSD: number;
  last30dSwaps: number;
  last30dVolumeUSD: number;
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

export interface ValidatorStats {
  validator_id: string;
  total_delegators: number;
  total_near_staked: number;
  near_staked_24h_change: number;
  near_staked_24h_change_percent: number;
  near_staked_7d_change: number;
  near_staked_7d_change_percent: number;
  near_staked_30d_change: number;
  near_staked_30d_change_percent: number;
  delegators_24h_change: number;
  delegators_7d_change: number;
  delegators_30d_change: number;
  latest_update: string;
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
    last7d?: PeriodTradingPair[];
    last30d?: PeriodTradingPair[];
  };
  feeSwaps?: {
    allTime: { totalSwaps: number; totalVolumeUSD: number };
    last24h: { totalSwaps: number; totalVolumeUSD: number };
    last7d: { totalSwaps: number; totalVolumeUSD: number };
    last30d: { totalSwaps: number; totalVolumeUSD: number };
    topPairs: {
      allTime: TradingPair[];
      last24h: TradingPair[];
      last7d: PeriodTradingPair[];
      last30d: PeriodTradingPair[];
    };
  };
  topSwappers?: {
    byVolume: SwapperData[];
    byCount: SwapperData[];
    byFeeVolume: SwapperData[];
    last24h: SwapperData[];
    last7d: SwapperData[];
    last30d: SwapperData[];
    totalUniqueAccounts: number;
  };
  notes: {
    unmappedIntentTokenIds: string[];
    priceIdMissing: string[];
    badAmounts: number;
  };
}

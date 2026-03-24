import { RefreshCw, TrendingUp, TrendingDown, Coins, Landmark, Users, Layers } from 'lucide-react';
import type { TVLSummary, SwapMetrics } from '../types';

interface TVLTabProps {
  data: TVLSummary | null;
  swapData?: SwapMetrics | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const formatUSD = (num: number): string => {
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

const formatNEAR = (val: string): string => {
  const num = parseFloat(val);
  if (isNaN(num)) return '0';
  return formatNumber(num, 2);
};

const formatTokenAmount = (val: string): string => {
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return formatNumber(num, 2);
};

const formatPercent = (num: number): string => {
  if (!Number.isFinite(num)) return '0.00%';
  return `${num.toFixed(2)}%`;
};

const DeltaBadge = ({ value, isUsd = false }: { value: number; isUsd?: boolean }) => {
  if (value === 0) return <span className="text-xs text-gray-400">—</span>;
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const formatted = isUsd ? formatUSD(Math.abs(value)) : Math.abs(value).toLocaleString();
  return (
    <span className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : '-'}{formatted} (24h)
    </span>
  );
};

export default function TVLTab({ data, swapData, isLoading, onRefresh }: TVLTabProps) {
  const stakedPctOfTvl = data && data.tvl.totalUsd > 0
    ? (data.staking.totalStakedUsd / data.tvl.totalUsd) * 100
    : 0;
  const nproPctOfTotalStaked = data && data.staking.totalStakedUsd > 0
    ? (data.staking.nproValidatorStakedUsd / data.staking.totalStakedUsd) * 100
    : 0;
  const allTimeSwaps = swapData?.allTime.totalSwaps ?? 0;
  const tvlUsd = data?.tvl.totalUsd ?? 0;
  const swapPeriods = swapData
    ? [
        { key: '24h', swaps: swapData.last24h.totalSwaps, volume: swapData.last24h.totalVolumeUSD },
        { key: '7d', swaps: swapData.last7d.totalSwaps, volume: swapData.last7d.totalVolumeUSD },
        { key: '30d', swaps: swapData.last30d.totalSwaps, volume: swapData.last30d.totalVolumeUSD },
        { key: 'all', swaps: swapData.allTime.totalSwaps, volume: swapData.allTime.totalVolumeUSD },
      ]
    : [];
  const topTokensByUsd = [...(data?.tokens ?? [])]
    .sort((a, b) => b.totalValueUsd - a.totalValueUsd)
    .slice(0, 30);

  if (!data) {
    return (
      <div className="text-center py-16">
        <Layers className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">No TVL Data Loaded</h2>
        <p className="text-gray-500 mb-6">Click "Load Data" to fetch the latest TVL data</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Layers className="h-5 w-5" />
          Load TVL Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last synced */}
      {data.asOf.fast && (
        <p className="text-xs text-gray-400 text-right">
          Last sync: {new Date(data.asOf.fast).toLocaleString()}
        </p>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total TVL */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Coins className="h-4 w-4" />
            Total TVL
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatUSD(data.tvl.totalUsd)}</div>
          <DeltaBadge value={data.tvl.delta24h} isUsd />
        </div>

        {/* Total Accounts */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Users className="h-4 w-4" />
            Tracked Accounts
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.tvl.totalAccounts.toLocaleString()}</div>
          <DeltaBadge value={data.tvl.accountsDelta24h} />
        </div>

        {/* Total Staked */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Landmark className="h-4 w-4" />
            Total Staked
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNEAR(data.staking.totalStakedNear)} Ⓝ</div>
          <div className="text-xs text-gray-500">{formatUSD(data.staking.totalStakedUsd)} · {stakedPctOfTvl.toFixed(2)}% of TVL</div>
        </div>

        {/* NPRO Validator */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Landmark className="h-4 w-4 text-purple-500" />
            npro.poolv1.near
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatNEAR(data.staking.nproValidatorStakedNear)} Ⓝ</div>
          <div className="text-xs text-gray-500">
            {formatUSD(data.staking.nproValidatorStakedUsd)} · {nproPctOfTotalStaked.toFixed(2)}% of total staked
          </div>
        </div>
      </div>

      {/* KPI Checklist 4/5/6 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">4. Total Swaps vs TVL (%)</h3>
          {!swapData ? (
            <p className="text-xs text-gray-500">Load swap metrics to see percentages</p>
          ) : (
            <div className="space-y-2">
              {swapPeriods.map((period) => {
                const swapsPct = allTimeSwaps > 0 ? (period.swaps / allTimeSwaps) * 100 : 0;
                const volumeVsTvlPct = tvlUsd > 0 ? (period.volume / tvlUsd) * 100 : 0;
                return (
                  <div key={period.key} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 uppercase">{period.key}</span>
                    <span className="text-gray-800 font-medium">Swaps {formatPercent(swapsPct)} · TVL {formatPercent(volumeVsTvlPct)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">5. Staked vs Total TVL</h3>
          <div className="text-2xl font-bold text-gray-900 mb-1">{formatPercent(stakedPctOfTvl)}</div>
          <p className="text-xs text-gray-500">{formatUSD(data.staking.totalStakedUsd)} staked over {formatUSD(data.tvl.totalUsd)} TVL</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">6. NPRO Staked vs Total Staked</h3>
          <div className="text-2xl font-bold text-gray-900 mb-1">{formatPercent(nproPctOfTotalStaked)}</div>
          <p className="text-xs text-gray-500">{formatUSD(data.staking.nproValidatorStakedUsd)} in npro.poolv1.near over {formatUSD(data.staking.totalStakedUsd)} total staked</p>
        </div>
      </div>

      {/* Token Breakdown */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Token Breakdown</h3>
        <p className="text-xs text-gray-500 mb-4">Top 30 tokens ordered by USD value (desc)</p>
        {topTokensByUsd.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No token data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                  <th className="pb-2 pr-4">Token</th>
                  <th className="pb-2 pr-4 text-right">Total Tokens</th>
                  <th className="pb-2 pr-4 text-right">Price</th>
                  <th className="pb-2 pr-4 text-right">Total Value</th>
                  <th className="pb-2 text-right">Holders</th>
                </tr>
              </thead>
              <tbody>
                {topTokensByUsd.map((token) => (
                  <tr key={token.tokenId} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4">
                      <span className="font-mono text-xs text-gray-700" title={token.tokenId}>
                        {token.symbol || token.priceId || token.tokenId.slice(0, 24)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-700">{formatTokenAmount(token.totalBalance)}</td>
                    <td className="py-2 pr-4 text-right text-gray-700">
                      {token.priceUsd > 0 ? `$${token.priceUsd.toFixed(token.priceUsd < 0.01 ? 6 : 2)}` : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right font-medium">
                      {token.totalValueUsd > 0 ? formatUSD(token.totalValueUsd) : '—'}
                    </td>
                    <td className="py-2 text-right text-gray-600">{token.holders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rich List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Accounts by Value</h3>
        {data.richList.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No account data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Account</th>
                  <th className="pb-2 pr-4 text-right">Total Value</th>
                  <th className="pb-2 pr-4 text-right">Tokens</th>
                  <th className="pb-2 pr-4 text-right">Staked NEAR</th>
                  <th className="pb-2 text-right">NPRO Validator</th>
                </tr>
              </thead>
              <tbody>
                {data.richList.map((entry) => (
                  <tr key={entry.accountId} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 text-gray-500">{entry.rank}</td>
                    <td className="py-2 pr-4">
                      <span className="font-mono text-xs text-gray-700">{entry.accountId}</span>
                    </td>
                    <td className="py-2 pr-4 text-right font-medium">{formatUSD(entry.totalValueUsd)}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{entry.tokenCount}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{entry.stakedNear !== '0.0000' ? `${formatNEAR(entry.stakedNear)} Ⓝ` : '—'}</td>
                    <td className="py-2 text-right text-gray-600">{entry.nproValidatorStaked !== '0.0000' ? `${formatNEAR(entry.nproValidatorStaked)} Ⓝ` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-700">Refreshing TVL data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

import { ArrowsClockwiseIcon, TrendUpIcon, TrendDownIcon, CoinsIcon, BankIcon, UsersIcon, StackSimpleIcon, ChartBarIcon, ShieldCheckIcon } from './icons';
import TokenAvatar from './TokenAvatar';
import { useTokenImages, resolveTokenImage, resolveMarketToken, resolveTokenSymbol, getTokenChain } from '../hooks/useTokenImages';
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
  if (value === 0) return <span className="text-xs text-nm-muted">—</span>;
  const isPositive = value > 0;
  const Icon = isPositive ? TrendUpIcon : TrendDownIcon;
  const color = isPositive ? 'text-nm-success' : 'text-nm-error';
  const formatted = isUsd ? formatUSD(Math.abs(value)) : Math.abs(value).toLocaleString();
  return (
    <span className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="h-3 w-3" />
      {isPositive ? '+' : '-'}{formatted} (24h)
    </span>
  );
};

// Shared StatCard matching NPROStatsTab pattern
const StatCard = ({ title, value, subValue, subValueNode, icon: Icon }: {
  title: string;
  value: string;
  subValue?: string;
  subValueNode?: React.ReactNode;
  icon?: React.ElementType;
}) => (
  <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm border border-nm-border">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-nm-muted uppercase">{title}</span>
      {Icon && <Icon className="h-4 w-4 text-nm-muted" />}
    </div>
    <div className="text-lg font-bold text-nm-text">{value}</div>
    {subValueNode && <div className="text-sm">{subValueNode}</div>}
    {subValue && !subValueNode && <div className="text-sm text-nm-muted">{subValue}</div>}
  </div>
);

// Section header matching NPROStatsTab pattern
const SectionHeader = ({ title, icon: Icon, gradient }: {
  title: string;
  icon: React.ElementType;
  gradient: string;
}) => (
  <div className={`${gradient} rounded-nm p-4 flex items-center gap-2`}>
    <Icon className="h-5 w-5" />
    <h2 className="text-lg font-semibold">{title}</h2>
  </div>
);

export default function TVLTab({ data, swapData, isLoading, onRefresh }: TVLTabProps) {
  const { tokenMap } = useTokenImages();
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
        <StackSimpleIcon className="h-12 w-12 text-nm-muted mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-nm-muted mb-2">No TVL Data Loaded</h2>
        <p className="text-nm-muted mb-6">Click "Load Data" to fetch the latest TVL data</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-nm-cta text-white rounded-nm-sm hover:bg-nm-ctaHover transition-colors mx-auto shadow-nm-button"
        >
          <ArrowsClockwiseIcon className="h-5 w-5" />
          Load TVL Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last synced */}
      {data.asOf.fast && (
        <div className="text-sm text-nm-muted text-right">
          Last sync: {new Date(data.asOf.fast).toLocaleString()}
        </div>
      )}

      {/* TVL Overview Section */}
      <SectionHeader
        title="TVL Overview"
        icon={CoinsIcon}
        gradient="bg-nm-surface-grad text-nm-accent border border-nm-border shadow-nm"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total TVL"
          value={formatUSD(data.tvl.totalUsd)}
          subValueNode={<DeltaBadge value={data.tvl.delta24h} isUsd />}
          icon={CoinsIcon}
        />
        <StatCard
          title="Tracked Accounts"
          value={data.tvl.totalAccounts.toLocaleString()}
          subValueNode={<DeltaBadge value={data.tvl.accountsDelta24h} />}
          icon={UsersIcon}
        />
        <StatCard
          title="Total Staked"
          value={`${formatNEAR(data.staking.totalStakedNear)} NEAR`}
          subValue={`${formatUSD(data.staking.totalStakedUsd)} · ${stakedPctOfTvl.toFixed(2)}% of TVL`}
          icon={BankIcon}
        />
        <StatCard
          title="npro.poolv1.near"
          value={`${formatNEAR(data.staking.nproValidatorStakedNear)} NEAR`}
          subValue={`${formatUSD(data.staking.nproValidatorStakedUsd)} · ${nproPctOfTotalStaked.toFixed(2)}% of staked`}
          icon={ShieldCheckIcon}
        />
      </div>

      {/* KPI Metrics Section */}
      <SectionHeader
        title="KPI Metrics"
        icon={ChartBarIcon}
        gradient="bg-nm-accentDim text-nm-accent border border-nm-border shadow-nm"
      />
      {/* Swaps vs TVL table — full width */}
      <div className="bg-nm-card rounded-nm-sm shadow-nm border border-nm-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-nm-muted uppercase">Total Swaps vs TVL</span>
          <ChartBarIcon className="h-4 w-4 text-nm-muted" />
        </div>
        {!swapData ? (
          <p className="text-xs text-nm-muted">Load swap metrics to see percentages</p>
        ) : (
          <div className="overflow-hidden rounded-nm-sm border border-nm-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-nm-borderLight border-b border-nm-border">
                  <th className="text-left px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider w-20">Period</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Swaps %</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Vol / TVL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nm-borderLight">
                {swapPeriods.map((period) => {
                  const swapsPct = allTimeSwaps > 0 ? (period.swaps / allTimeSwaps) * 100 : 0;
                  const volumeVsTvlPct = tvlUsd > 0 ? (period.volume / tvlUsd) * 100 : 0;
                  return (
                    <tr key={period.key} className="hover:bg-nm-surfaceHover">
                      <td className="px-3 py-2.5 text-xs font-medium text-nm-text uppercase">{period.key}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-1.5 bg-nm-borderLight rounded-full overflow-hidden">
                            <div className="h-full bg-nm-accent rounded-full" style={{ width: `${Math.min(swapsPct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium text-nm-text tabular-nums w-16 text-right">{formatPercent(swapsPct)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-1.5 bg-nm-borderLight rounded-full overflow-hidden">
                            <div className="h-full bg-nm-success rounded-full" style={{ width: `${Math.min(volumeVsTvlPct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium text-nm-text tabular-nums w-16 text-right">{formatPercent(volumeVsTvlPct)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staking KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Staked vs Total TVL"
          value={formatPercent(stakedPctOfTvl)}
          subValue={`${formatUSD(data.staking.totalStakedUsd)} staked over ${formatUSD(data.tvl.totalUsd)} TVL`}
          icon={BankIcon}
        />

        <StatCard
          title="NPRO Staked vs Total Staked"
          value={formatPercent(nproPctOfTotalStaked)}
          subValue={`${formatUSD(data.staking.nproValidatorStakedUsd)} in npro.poolv1.near over ${formatUSD(data.staking.totalStakedUsd)} total staked`}
          icon={ShieldCheckIcon}
        />
      </div>

      {/* Token Breakdown Section */}
      <SectionHeader
        title="Token Breakdown"
        icon={StackSimpleIcon}
        gradient="bg-nm-accentDim text-nm-accent border border-nm-border shadow-nm"
      />
      <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border overflow-hidden">
        <div className="px-4 sm:px-6 py-3 bg-nm-borderLight border-b border-nm-border">
          <p className="text-xs text-nm-muted">Top 30 tokens ordered by USD value</p>
        </div>
        {topTokensByUsd.length === 0 ? (
          <p className="text-nm-muted text-center py-8">No token data yet</p>
        ) : (
          <div className="divide-y divide-nm-borderLight">
            {topTokensByUsd.map((token, idx) => {
              const chainProp = getTokenChain(token.tokenId);
              const mkt = resolveMarketToken(tokenMap, token.symbol, token.tokenId, token.priceId);
              const change24h = mkt ? parseFloat(mkt.usd24hChange) : null;
              const displaySymbol = resolveTokenSymbol(tokenMap, token.symbol, token.tokenId, token.priceId);

              return (
                <div key={token.tokenId} className="flex items-center px-4 sm:px-5 py-4 gap-3 hover:bg-nm-surfaceHover">
                  {/* Rank number */}
                  <span className="font-sf-mono text-xs font-semibold text-nm-muted w-4 text-right flex-shrink-0">
                    #{idx + 1}
                  </span>

                  {/* Avatar */}
                  <TokenAvatar
                    imageUrl={resolveTokenImage(tokenMap, token.symbol, token.tokenId, token.priceId)}
                    symbol={displaySymbol}
                    size={44}
                    chain={chainProp}
                  />

                  {/* Name + Price row */}
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-sm font-medium text-nm-text truncate" title={token.tokenId}>
                        {displaySymbol}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-sf-mono text-xs font-semibold text-nm-muted">
                          {token.priceUsd > 0 ? `${token.priceUsd.toFixed(token.priceUsd < 0.01 ? 6 : 2)} $` : '—'}
                        </span>
                        {change24h !== null && change24h !== 0 && (
                          <span className={`font-sf-mono text-xs font-semibold ${change24h > 0 ? 'text-nm-success' : 'text-nm-error'}`}>
                            {change24h > 0 ? '+' : ''}{change24h.toFixed(2)} %
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Value + Balance */}
                    <div className="flex flex-col items-end justify-center flex-shrink-0">
                      <span className="font-sf-mono text-sm font-semibold text-nm-accent">
                        {token.totalValueUsd > 0 ? formatUSD(token.totalValueUsd) : '—'}
                      </span>
                      <span className="font-sf-mono text-xs font-semibold text-nm-muted">
                        {formatTokenAmount(token.totalBalance)} {displaySymbol}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rich List Section */}
      <SectionHeader
        title="Top Accounts by Value"
        icon={UsersIcon}
        gradient="bg-nm-surface-grad text-nm-accent border border-nm-border shadow-nm"
      />
      <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border overflow-hidden">
        {data.richList.length === 0 ? (
          <p className="text-nm-muted text-center py-8">No account data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-nm-borderLight">
                <tr className="border-b border-nm-border">
                  <th className="text-left px-4 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Account</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Total Value</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Tokens</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Staked NEAR</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">NPRO Validator</th>
                </tr>
              </thead>
              <tbody className="bg-nm-card divide-y divide-nm-borderLight">
                {data.richList.map((entry) => (
                  <tr key={entry.accountId} className="hover:bg-nm-surfaceHover">
                    <td className="py-2.5 px-4 text-nm-muted">{entry.rank}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-sf-mono text-xs text-nm-text">{entry.accountId}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-nm-text">{formatUSD(entry.totalValueUsd)}</td>
                    <td className="py-2.5 px-4 text-right text-nm-muted">{entry.tokenCount}</td>
                    <td className="py-2.5 px-4 text-right text-nm-muted">{entry.stakedNear !== '0.0000' ? `${formatNEAR(entry.stakedNear)} NEAR` : '—'}</td>
                    <td className="py-2.5 px-4 text-right text-nm-muted">{entry.nproValidatorStaked !== '0.0000' ? `${formatNEAR(entry.nproValidatorStaked)} NEAR` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <ArrowsClockwiseIcon className="h-6 w-6 animate-spin text-nm-accent" />
          <span className="ml-3 text-nm-muted">Refreshing TVL data...</span>
        </div>
      )}
    </div>
  );
}

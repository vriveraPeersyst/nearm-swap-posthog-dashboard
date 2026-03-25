import { useState, useEffect } from 'react';
import { ChartLineUpIcon, TrophyIcon, ArrowsClockwiseIcon, ArrowSquareOutIcon, TrendUpIcon, TrendDownIcon, UsersIcon, CoinsIcon, BankIcon, DropIcon, CrownIcon, ArrowsDownUpIcon } from './icons';
import TokenAvatar from './TokenAvatar';
import { useTokenImages, resolveTokenImage } from '../hooks/useTokenImages';
import type { NPROSummary } from '../types';
import { calculateDistributionRunway, type DistributionRunwayInfo } from '../utils/nproBondingCurve';

interface NPROStatsTabProps {
  data: NPROSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
}

// Helper function to format numbers
const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(decimals)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(decimals)}K`;
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

// Helper function to format full numbers without abbreviation
const formatFullNumber = (num: number): string => {
  return Math.floor(num).toLocaleString();
};

// Helper function to format USD
const formatUSD = (num: number): string => {
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

// Change indicator component
const ChangeIndicator = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  if (value === 0) return <span className="text-nm-muted">0{suffix}</span>;
  const isPositive = value > 0;
  return (
    <span className={`flex items-center gap-1 ${isPositive ? 'text-nm-success' : 'text-nm-error'}`}>
      {isPositive ? <TrendUpIcon className="h-3 w-3" /> : <TrendDownIcon className="h-3 w-3" />}
      {isPositive ? '+' : ''}{value.toFixed(2)}{suffix}
    </span>
  );
};

// Format change value with color
const formatChange24h = (value: number, label: string = '24h'): React.ReactNode => {
  if (value === 0) return <span className="text-nm-muted">0 ({label})</span>;
  const isPositive = value > 0;
  return (
    <span className={isPositive ? 'text-nm-success' : 'text-nm-error'}>
      {isPositive ? '+' : ''}{value.toLocaleString()} ({label})
    </span>
  );
};

// Format USD change with color
const formatUSDChange = (value: number, label: string = '24h'): React.ReactNode => {
  if (value === 0) return <span className="text-nm-muted">$0 ({label})</span>;
  const isPositive = value > 0;
  const formatted = formatUSD(Math.abs(value));
  return (
    <span className={isPositive ? 'text-nm-success' : 'text-nm-error'}>
      {isPositive ? '+' : '-'}{formatted} ({label})
    </span>
  );
};

// Format percentage change with color
const formatPercentChange = (value: number): React.ReactNode => {
  if (value === 0) return <span className="text-nm-muted">0%</span>;
  const isPositive = value > 0;
  return (
    <span className={isPositive ? 'text-nm-success' : 'text-nm-error'}>
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
};

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  valueNode,
  subValue, 
  subValueNode,
  change,
  changeLabel = '24h',
  icon: Icon,
  href 
}: { 
  title: string; 
  value?: string | number; 
  valueNode?: React.ReactNode;
  subValue?: string;
  subValueNode?: React.ReactNode;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  href?: string;
}) => (
  <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm border border-nm-border">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-nm-muted uppercase">{title}</span>
      {Icon && <Icon className="h-4 w-4 text-nm-muted" />}
    </div>
    <div className="flex items-baseline gap-2">
      {valueNode ? (
        <span className="text-lg font-bold">{valueNode}</span>
      ) : href ? (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-lg font-bold text-nm-accent hover:text-nm-ctaHover flex items-center gap-1"
        >
          {value}
          <ArrowSquareOutIcon className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-lg font-bold text-nm-text">{value}</span>
      )}
    </div>
    {subValueNode && <div className="text-sm">{subValueNode}</div>}
    {subValue && !subValueNode && <div className="text-sm text-nm-muted">{subValue}</div>}
    {change !== undefined && (
      <div className="mt-1 text-xs flex items-center gap-1">
        <span className="text-nm-muted">{changeLabel}:</span>
        <ChangeIndicator value={change} suffix="%" />
      </div>
    )}
  </div>
);

// Section header component
const SectionHeader = ({ 
  title, 
  icon: Icon, 
  gradient 
}: { 
  title: string; 
  icon: React.ElementType; 
  gradient: string;
}) => (
  <div className={`${gradient} rounded-nm p-4 flex items-center gap-2`}>
    <Icon className="h-5 w-5" />
    <h2 className="text-lg font-semibold">{title}</h2>
  </div>
);

export default function NPROStatsTab({ data, isLoading, onRefresh }: NPROStatsTabProps) {
  const { tokenMap } = useTokenImages();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [distributionRunway, setDistributionRunway] = useState<DistributionRunwayInfo | null>(null);

  useEffect(() => {
    if (data?.asOf?.fast) {
      setLastUpdated(new Date(data.asOf.fast));
    }
  }, [data]);

  // Calculate distribution runway when data is available
  useEffect(() => {
    if (data?.accounts?.distribution?.number) {
      calculateDistributionRunway(data.accounts.distribution.number)
        .then(setDistributionRunway)
        .catch(err => console.error('Failed to calculate distribution runway:', err));
    }
  }, [data?.accounts?.distribution?.number]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <ArrowsClockwiseIcon className="h-6 w-6 animate-spin text-nm-accent mx-auto mb-4" />
          <p className="text-nm-muted">Loading NPRO stats...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <CoinsIcon className="h-12 w-12 text-nm-muted mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-nm-muted mb-2">No NPRO Data Loaded</h2>
        <p className="text-nm-muted mb-6">Click "Load Data" to fetch the latest NPRO stats</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-nm-cta text-white rounded-nm-sm hover:bg-nm-ctaHover shadow-nm-button transition-colors mx-auto"
        >
          <ArrowsClockwiseIcon className="h-5 w-5" />
          Load NPRO Stats
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-nm-muted text-right">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Token Price Section */}
      <SectionHeader 
        title="NPRO Token" 
        icon={CoinsIcon} 
        gradient="bg-nm-surface-grad text-nm-accent border border-nm-border shadow-nm" 
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title="NPRO Price"
          value={`$${data.token.npro.usd.toFixed(4)}`}
          subValue={`${data.token.nproInNear.toFixed(4)} NEAR`}
          change={data.token.npro.change24h}
          icon={CoinsIcon}
          href="https://nearblocks.io/token/npro.nearmobile.near"
        />
        <StatCard
          title="NEAR Price"
          value={`$${data.token.near.usd.toFixed(2)}`}
          change={data.token.near.change24h}
        />
        <StatCard
          title="Market Cap"
          value={formatUSD(data.token.npro.marketCap || 0)}
          subValue={`${formatNumber(data.token.npro.circulatingSupply || 0, 0)} circulating`}
        />
        <StatCard
          title="FDV"
          value={formatUSD(data.token.npro.fdv || 0)}
        />
        <StatCard
          title="Holders"
          value={data.nearblocks.holders.count.toLocaleString()}
          subValueNode={formatChange24h(data.nearblocks.holders.delta24h)}
          icon={UsersIcon}
        />
        <StatCard
          title="Transfers"
          value={data.nearblocks.transfers.count.toLocaleString()}
          subValueNode={formatChange24h(data.nearblocks.transfers.delta24h)}
          icon={ArrowsDownUpIcon}
        />
      </div>

      {/* Validator Section */}
      <SectionHeader 
        title="Validator (npro.poolv1.near)" 
        icon={BankIcon} 
        gradient="bg-nm-accentDim text-nm-accent border border-nm-border shadow-nm" 
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Staked (Active)"
          value={formatFullNumber(data.validator.staked.number)}
          subValue={formatUSD(data.validator.staked.number * data.token.near.usd)}
          icon={BankIcon}
          href="https://nearblocks.io/node-explorer/npro.poolv1.near"
        />
        <StatCard
          title="Unstaked"
          value={formatFullNumber(data.validator.unstaked.number)}
          subValue={data.validator.unstaked.number > 0 ? formatUSD(data.validator.unstaked.number * data.token.near.usd) : 'In cooldown or ready to withdraw'}
        />
        <StatCard
          title="Total in Validator"
          value={formatFullNumber(data.validator.total.number)}
          subValue={formatUSD(data.validator.total.number * data.token.near.usd)}
        />
      </div>

      {/* Account Management Section */}
      <SectionHeader 
        title="Account Management" 
        icon={UsersIcon} 
        gradient="bg-nm-accentDim text-nm-accent border border-nm-border shadow-nm" 
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Treasury"
          value={formatFullNumber(data.accounts.treasury.number)}
          subValue={formatUSD(data.accounts.treasury.usdValue)}
          icon={CoinsIcon}
        />
        <StatCard
          title="Team"
          value={formatFullNumber(data.accounts.team.number)}
          subValue={formatUSD(data.accounts.team.usdValue)}
        />
        <StatCard
          title="Marketing"
          value={formatFullNumber(data.accounts.marketing.number)}
          subValue={formatUSD(data.accounts.marketing.usdValue)}
        />
        <StatCard
          title="Staking Rewards"
          value={formatFullNumber(data.accounts.staking.number)}
          subValue={formatUSD(data.accounts.staking.usdValue)}
        />
        <StatCard
          title="Liquidity"
          value={formatFullNumber(data.accounts.liquidity.number)}
          subValue={formatUSD(data.accounts.liquidity.usdValue)}
        />
        <StatCard
          title="Distribution Pool"
          value={formatFullNumber(data.accounts.distribution.number)}
          subValue={distributionRunway ? `${formatUSD(data.accounts.distribution.usdValue)} • ${distributionRunway.daysUntilEmpty} days left` : formatUSD(data.accounts.distribution.usdValue)}
        />
      </div>

      {/* Distribution Runway Info */}
      {distributionRunway && (
        <div className="bg-nm-surface-grad border border-nm-border rounded-nm p-6 shadow-nm">
          <h3 className="text-lg font-semibold text-nm-text mb-4 flex items-center gap-2"><ChartLineUpIcon className="h-5 w-5 text-nm-accent" /> Distribution Runway (Bonding Curve)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm">
              <div className="text-xs text-nm-muted uppercase">Current Epoch</div>
              <div className="text-lg font-bold text-nm-accent">{distributionRunway.currentEpoch.toLocaleString()}</div>
              <div className="text-sm text-nm-muted">~{distributionRunway.epochDurationHours.toFixed(1)}h per epoch</div>
            </div>
            <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm">
              <div className="text-xs text-nm-muted uppercase">NPRO/Epoch</div>
              <div className="text-lg font-bold text-nm-accent">{distributionRunway.nproPerCurrentEpoch.toFixed(2)}</div>
              <div className="text-sm text-nm-muted">Distribution rate</div>
            </div>
            <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm">
              <div className="text-xs text-nm-muted uppercase">Epochs Until Empty</div>
              <div className="text-lg font-bold text-nm-accent">{distributionRunway.epochsUntilEmpty.toLocaleString()}</div>
              <div className="text-sm text-nm-muted">Last epoch: #{distributionRunway.lastFundedEpoch.toLocaleString()}</div>
            </div>
            <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm">
              <div className="text-xs text-nm-muted uppercase">Days Until Empty</div>
              <div className="text-2xl font-bold text-nm-accent">{distributionRunway.daysUntilEmpty.toLocaleString()}</div>
              <div className="text-sm text-nm-muted">~{(distributionRunway.daysUntilEmpty / 30).toFixed(1)} months</div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Section */}
      <SectionHeader 
        title="Premium & Ambassador" 
        icon={CrownIcon} 
        gradient="bg-nm-card text-nm-warning border border-nm-border shadow-nm" 
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          title="Premium Users"
          value={data.premium.premiumUsers.toLocaleString()}
          subValueNode={formatChange24h(data.premium.premiumUsersChange24h)}
          icon={CrownIcon}
        />
        <StatCard
          title="Ambassador Users"
          value={data.premium.ambassadorUsers.toLocaleString()}
          subValueNode={formatChange24h(data.premium.ambassadorUsersChange24h)}
          icon={UsersIcon}
        />
        <StatCard
          title="Total Paid Users"
          value={data.premium.paidUsers.toLocaleString()}
          subValue={`${data.premium.premiumUsers} Premium + ${data.premium.ambassadorUsers} Ambassador`}
        />
        <StatCard
          title="Upgrades (24h)"
          value={data.premium.upgrades24h.toLocaleString()}
        />
        <StatCard
          title="Unsubscribes (24h)"
          value={data.premium.unsubscribes24h.toLocaleString()}
        />
        <StatCard
          title="Tokens Locked (Premium)"
          value={formatNumber(data.premium.locked.premium, 0)}
          subValue={formatUSD(data.premium.lockedUsdValue.premium)}
        />
        <StatCard
          title="Tokens Locked (Ambassador)"
          value={formatNumber(data.premium.locked.ambassador, 0)}
          subValue={formatUSD(data.premium.lockedUsdValue.ambassador)}
        />
        <StatCard
          title="Total Locked"
          value={formatNumber(data.premium.locked.total, 0)}
          subValue={formatUSD(data.premium.lockedUsdValue.total)}
        />
        <StatCard
          title="New Subscriptions (24h)"
          value={(data.premium.premiumSubscriptions24h + data.premium.ambassadorSubscriptions24h).toLocaleString()}
          subValue={`${data.premium.premiumSubscriptions24h} Premium, ${data.premium.ambassadorSubscriptions24h} Ambassador`}
        />
      </div>

      {/* Liquidity Section */}
      <SectionHeader 
        title="Liquidity" 
        icon={DropIcon} 
        gradient="bg-nm-accentDim text-nm-accent border border-nm-border shadow-nm" 
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          title="TVL (Rhea)"
          value={formatUSD(data.liquidity.rhea.tvlUsd)}
          subValueNode={formatUSDChange(data.liquidity.rhea.delta24h)}
          icon={DropIcon}
          href={data.liquidity.rhea.pairUrl}
        />
        <StatCard
          title="Volume 24h"
          value={formatUSD(data.liquidity.rhea.volume24h)}
          subValueNode={formatUSDChange(data.liquidity.rhea.deltaVolume24h, 'change')}
        />
        <StatCard
          title="Transactions 24h"
          value={data.liquidity.rhea.totalTxns24h.toLocaleString()}
          subValue={`${data.liquidity.rhea.buys24h} buys / ${data.liquidity.rhea.sells24h} sells`}
        />
        <StatCard
          title="Near Intents Liquidity"
          value={formatNumber(data.liquidity.intents.formatted, 0)}
          subValue={formatUSD(data.liquidity.intents.usdValue)}
        />
        <StatCard
          title="Price Change 24h"
          valueNode={formatPercentChange(data.liquidity.rhea.priceChange24hPct)}
          subValue={`$${data.liquidity.rhea.priceUsd.toFixed(4)} / ${data.liquidity.rhea.priceNative.toFixed(4)} NEAR`}
        />
      </div>

      {/* Pool Composition */}
      <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-6">
        <h3 className="text-lg font-semibold text-nm-text mb-4">Pool Composition (Rhea)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-nm-accentDim rounded-nm-sm p-4 border border-nm-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TokenAvatar
                  imageUrl={resolveTokenImage(tokenMap, data.liquidity.rhea.pool.base.symbol)}
                  symbol={data.liquidity.rhea.pool.base.symbol}
                  size={24}
                  chain={false}
                />
                <span className="font-medium text-nm-accent">{data.liquidity.rhea.pool.base.symbol}</span>
              </div>
              <span className="text-sm text-nm-muted">{data.liquidity.rhea.pool.base.pct.toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-bold text-nm-text">{formatNumber(data.liquidity.rhea.pool.base.amount, 0)}</div>
            <div className="text-sm text-nm-muted">{formatUSD(data.liquidity.rhea.pool.base.usdValue)}</div>
          </div>
          <div className="bg-nm-accentDim rounded-nm-sm p-4 border border-nm-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TokenAvatar
                  imageUrl={resolveTokenImage(tokenMap, data.liquidity.rhea.pool.quote.symbol)}
                  symbol={data.liquidity.rhea.pool.quote.symbol}
                  size={24}
                  chain={false}
                />
                <span className="font-medium text-nm-accent">{data.liquidity.rhea.pool.quote.symbol}</span>
              </div>
              <span className="text-sm text-nm-muted">{data.liquidity.rhea.pool.quote.pct.toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-bold text-nm-text">{formatNumber(data.liquidity.rhea.pool.quote.amount, 0)}</div>
            <div className="text-sm text-nm-muted">{formatUSD(data.liquidity.rhea.pool.quote.usdValue)}</div>
          </div>
        </div>
      </div>

      {/* Rich List Section */}
      <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-6">
        <h3 className="text-lg font-semibold text-nm-text mb-4 flex items-center gap-2"><TrophyIcon className="h-5 w-5 text-nm-accent" /> Top 10 NPRO Holders (Rich List)</h3>
        <p className="text-sm text-nm-muted mb-4">Excludes team, treasury, premium, rhea, npro-validator, and near intents accounts</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-nm-border">
            <thead className="bg-nm-borderLight">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">Account</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-nm-muted uppercase tracking-wider">Balance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-nm-muted uppercase tracking-wider">USD Value</th>
              </tr>
            </thead>
            <tbody className="bg-nm-card divide-y divide-nm-border">
              {data.richList.map((entry) => (
                <tr key={entry.rank} className="hover:bg-nm-surfaceHover">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      entry.rank === 1 ? 'bg-nm-warning/20 text-nm-warning' :
                      entry.rank === 2 ? 'bg-nm-chip text-nm-muted' :
                      entry.rank === 3 ? 'bg-nm-warning/10 text-nm-warning' :
                      'bg-nm-borderLight text-nm-muted'
                    }`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`https://nearblocks.io/address/${entry.account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nm-accent hover:text-nm-ctaHover font-sf-mono text-sm flex items-center gap-1"
                    >
                      {entry.account.length > 24 
                        ? `${entry.account.slice(0, 12)}...${entry.account.slice(-8)}`
                        : entry.account}
                      <ArrowSquareOutIcon className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-nm-text">
                    {formatNumber(entry.balance.number, 2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-nm-muted">
                    {formatUSD(entry.balance.usdValue || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

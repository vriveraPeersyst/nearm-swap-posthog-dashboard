import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, TrendingUp, TrendingDown, Users, Coins, Landmark, Droplets, Crown, ArrowUpDown } from 'lucide-react';
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
  if (value === 0) return <span className="text-gray-500">0{suffix}</span>;
  const isPositive = value > 0;
  return (
    <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{value.toFixed(2)}{suffix}
    </span>
  );
};

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  subValue, 
  change,
  changeLabel = '24h',
  icon: Icon,
  href 
}: { 
  title: string; 
  value: string | number; 
  subValue?: string; 
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  href?: string;
}) => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-500 uppercase">{title}</span>
      {Icon && <Icon className="h-4 w-4 text-gray-400" />}
    </div>
    <div className="flex items-baseline gap-2">
      {href ? (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-lg font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
        >
          {value}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-lg font-bold text-gray-900">{value}</span>
      )}
    </div>
    {subValue && <div className="text-sm text-gray-600">{subValue}</div>}
    {change !== undefined && (
      <div className="mt-1 text-xs flex items-center gap-1">
        <span className="text-gray-500">{changeLabel}:</span>
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
  <div className={`${gradient} rounded-lg p-4 flex items-center gap-3`}>
    <Icon className="h-6 w-6" />
    <h2 className="text-xl font-bold">{title}</h2>
  </div>
);

export default function NPROStatsTab({ data, isLoading, onRefresh }: NPROStatsTabProps) {
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
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading NPRO stats...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">No NPRO Data Loaded</h2>
        <p className="text-gray-500 mb-6">Click "Load Data" to fetch the latest NPRO stats</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
        >
          <RefreshCw className="h-5 w-5" />
          Load NPRO Stats
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500 text-right">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Token Price Section */}
      <SectionHeader 
        title="NPRO Token" 
        icon={Coins} 
        gradient="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200" 
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          title="NPRO Price"
          value={`$${data.token.npro.usd.toFixed(4)}`}
          subValue={`${data.token.nproInNear.toFixed(4)} NEAR`}
          change={data.token.npro.change24h}
          icon={Coins}
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
          subValue={`+${data.nearblocks.holders.delta24h} (24h)`}
          icon={Users}
        />
        <StatCard
          title="Transfers"
          value={data.nearblocks.transfers.count.toLocaleString()}
          subValue={`+${data.nearblocks.transfers.delta24h} (24h)`}
          icon={ArrowUpDown}
        />
      </div>

      {/* Validator Section */}
      <SectionHeader 
        title="Validator (npro.poolv1.near)" 
        icon={Landmark} 
        gradient="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200" 
      />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Staked (Active)"
          value={formatFullNumber(data.validator.staked.number)}
          subValue={formatUSD(data.validator.staked.number * data.token.near.usd)}
          icon={Landmark}
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
        icon={Users} 
        gradient="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200" 
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Treasury"
          value={formatFullNumber(data.accounts.treasury.number)}
          subValue={formatUSD(data.accounts.treasury.usdValue)}
          icon={Coins}
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
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">📊 Distribution Runway (Bonding Curve)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Current Epoch</div>
              <div className="text-lg font-bold text-green-700">{distributionRunway.currentEpoch.toLocaleString()}</div>
              <div className="text-sm text-gray-600">~{distributionRunway.epochDurationHours.toFixed(1)}h per epoch</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase">NPRO/Epoch</div>
              <div className="text-lg font-bold text-green-700">{distributionRunway.nproPerCurrentEpoch.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Distribution rate</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Epochs Until Empty</div>
              <div className="text-lg font-bold text-green-700">{distributionRunway.epochsUntilEmpty.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Last epoch: #{distributionRunway.lastFundedEpoch.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-500 uppercase">Days Until Empty</div>
              <div className="text-2xl font-bold text-green-700">{distributionRunway.daysUntilEmpty.toLocaleString()}</div>
              <div className="text-sm text-gray-600">~{(distributionRunway.daysUntilEmpty / 30).toFixed(1)} months</div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Section */}
      <SectionHeader 
        title="Premium & Ambassador" 
        icon={Crown} 
        gradient="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200" 
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          title="Premium Users"
          value={data.premium.premiumUsers.toLocaleString()}
          subValue={`+${data.premium.premiumUsersChange24h} (24h)`}
          icon={Crown}
        />
        <StatCard
          title="Ambassador Users"
          value={data.premium.ambassadorUsers.toLocaleString()}
          subValue={`+${data.premium.ambassadorUsersChange24h} (24h)`}
          icon={Users}
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
        icon={Droplets} 
        gradient="bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-800 border border-cyan-200" 
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          title="TVL (Rhea)"
          value={formatUSD(data.liquidity.rhea.tvlUsd)}
          subValue={`${data.liquidity.rhea.delta24h >= 0 ? '+' : ''}${formatUSD(data.liquidity.rhea.delta24h)} (24h)`}
          icon={Droplets}
          href={data.liquidity.rhea.pairUrl}
        />
        <StatCard
          title="Volume 24h"
          value={formatUSD(data.liquidity.rhea.volume24h)}
          subValue={`${data.liquidity.rhea.deltaVolume24h >= 0 ? '+' : ''}${formatUSD(data.liquidity.rhea.deltaVolume24h)} change`}
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
          value={`${data.liquidity.rhea.priceChange24hPct >= 0 ? '+' : ''}${data.liquidity.rhea.priceChange24hPct.toFixed(2)}%`}
          subValue={`$${data.liquidity.rhea.priceUsd.toFixed(4)} / ${data.liquidity.rhea.priceNative.toFixed(4)} NEAR`}
        />
      </div>

      {/* Pool Composition */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pool Composition (Rhea)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-purple-800">{data.liquidity.rhea.pool.base.symbol}</span>
              <span className="text-sm text-purple-600">{data.liquidity.rhea.pool.base.pct.toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{formatNumber(data.liquidity.rhea.pool.base.amount, 0)}</div>
            <div className="text-sm text-purple-600">{formatUSD(data.liquidity.rhea.pool.base.usdValue)}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-blue-800">{data.liquidity.rhea.pool.quote.symbol}</span>
              <span className="text-sm text-blue-600">{data.liquidity.rhea.pool.quote.pct.toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{formatNumber(data.liquidity.rhea.pool.quote.amount, 0)}</div>
            <div className="text-sm text-blue-600">{formatUSD(data.liquidity.rhea.pool.quote.usdValue)}</div>
          </div>
        </div>
      </div>

      {/* Rich List Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top 10 NPRO Holders (Rich List)</h3>
        <p className="text-sm text-gray-500 mb-4">Excludes team, treasury, premium, rhea, npro-validator, and near intents accounts</p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">USD Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.richList.map((entry) => (
                <tr key={entry.rank} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                      entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                      entry.rank === 3 ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={`https://nearblocks.io/address/${entry.account}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-mono text-sm flex items-center gap-1"
                    >
                      {entry.account.length > 24 
                        ? `${entry.account.slice(0, 12)}...${entry.account.slice(-8)}`
                        : entry.account}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-gray-900">
                    {formatNumber(entry.balance.number, 2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600">
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

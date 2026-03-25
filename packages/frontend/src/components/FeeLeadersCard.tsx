import { useState } from 'react';
import { ArrowsClockwiseIcon, CurrencyDollarIcon } from './icons';
import { PeriodSelector } from './PeriodSelector';
import type { FeeLeadersResponse, FeeLeaderEntry } from '../types';

type TimePeriod = 'allTime' | 'last24h' | 'last7d' | 'last30d';

const formatUSD = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const truncateAddress = (address: string, start = 8, end = 6): string => {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

const TierBadge = ({ tier }: { tier: 'basic' | 'premium' | 'ambassador' }) => {
  const styles = {
    basic: 'bg-nm-basic-shade text-nm-basic-solid',
    premium: 'bg-nm-premium-shade text-nm-premium-solid',
    ambassador: 'bg-nm-ambassador-shade text-nm-ambassador-solid',
  };
  
  return (
    <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-medium tracking-tight ${styles[tier]}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
};



const FeeLeadersTable = ({ 
  leaders, 
  isLoading 
}: { 
  leaders: FeeLeaderEntry[]; 
  isLoading: boolean 
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-10 bg-nm-borderLight rounded-nm-sm" />
        ))}
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="text-center py-8 text-nm-muted">
        No fee data available for this period
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-nm-border">
            <th className="text-left px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">#</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Account</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Tier</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Fees Paid</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Volume</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Swaps</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((entry, index) => (
            <tr key={entry.accountId} className="border-b border-nm-borderLight hover:bg-nm-surfaceHover">
              <td className="py-2 px-2 text-nm-muted">{index + 1}</td>
              <td className="py-2 px-2">
                <a 
                  href={`https://nearblocks.io/address/${entry.accountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nm-accent hover:text-nm-ctaHover font-sf-mono text-xs"
                >
                  {truncateAddress(entry.accountId)}
                </a>
              </td>
              <td className="py-2 px-2">
                <TierBadge tier={entry.tier} />
              </td>
              <td className="py-2 px-2 text-right font-medium text-nm-success">
                {formatUSD(entry.feesPaid)}
              </td>
              <td className="py-2 px-2 text-right text-nm-text">
                {formatUSD(entry.volumeUSD)}
              </td>
              <td className="py-2 px-2 text-right text-nm-muted">
                {entry.swaps.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface FeeLeadersCardProps {
  data: FeeLeadersResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function FeeLeadersCard({ data, isLoading, error, onRefresh }: FeeLeadersCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('allTime');

  const periodLabels: Record<TimePeriod, string> = {
    allTime: 'All Time',
    last24h: '24h',
    last7d: '7d',
    last30d: '30d',
  };

  const currentLeaders = data?.leaderboards[selectedPeriod] || [];

  return (
    <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-5 w-5 text-nm-accent" />
          <h2 className="text-lg font-semibold text-nm-text">Earned Fees</h2>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-nm-muted hover:text-nm-text rounded-nm-sm hover:bg-nm-surfaceHover disabled:opacity-50"
          >
            <ArrowsClockwiseIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-nm-error/10 text-nm-error rounded-nm-sm">
          {error}
        </div>
      )}

      {/* Fee Rates Info */}
      {data && (
        <div className="mb-6 flex flex-wrap gap-3 text-sm items-center">
          <span className="text-nm-muted">Fee Rates:</span>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full font-medium tracking-tight bg-nm-basic-shade text-nm-basic-solid">Basic: {data.feeRates.basic}</span>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full font-medium tracking-tight bg-nm-ambassador-shade text-nm-ambassador-solid">Ambassador: {data.feeRates.ambassador}</span>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full font-medium tracking-tight bg-nm-premium-shade text-nm-premium-solid">Premium: {data.feeRates.premium}</span>
        </div>
      )}

      {/* Total Fees Earned Table */}
      {data && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-nm-text mb-3">Total Fees Earned</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-nm-border">
                  <th className="text-left px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Period</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Total</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Basic (0.88%)</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Ambassador (0.66%)</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-nm-muted uppercase tracking-wider">Premium (0.22%)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-nm-borderLight hover:bg-nm-surfaceHover">
                  <td className="py-3 px-3 font-medium text-nm-text">All Time</td>
                  <td className="py-3 px-3 text-right font-bold text-nm-success">{formatUSD(data.totals.allTime.total)}</td>
                  <td className="py-3 px-3 text-right text-nm-text">{formatUSD(data.totals.allTime.basic)}</td>
                  <td className="py-3 px-3 text-right text-nm-warning">{formatUSD(data.totals.allTime.ambassador)}</td>
                  <td className="py-3 px-3 text-right text-nm-accent">{formatUSD(data.totals.allTime.premium)}</td>
                </tr>
                <tr className="border-b border-nm-borderLight hover:bg-nm-surfaceHover">
                  <td className="py-3 px-3 font-medium text-nm-text">Last 24h</td>
                  <td className="py-3 px-3 text-right font-bold text-nm-success">{formatUSD(data.totals.last24h.total)}</td>
                  <td className="py-3 px-3 text-right text-nm-text">{formatUSD(data.totals.last24h.basic)}</td>
                  <td className="py-3 px-3 text-right text-nm-warning">{formatUSD(data.totals.last24h.ambassador)}</td>
                  <td className="py-3 px-3 text-right text-nm-accent">{formatUSD(data.totals.last24h.premium)}</td>
                </tr>
                <tr className="border-b border-nm-borderLight hover:bg-nm-surfaceHover">
                  <td className="py-3 px-3 font-medium text-nm-text">Last 7d</td>
                  <td className="py-3 px-3 text-right font-bold text-nm-success">{formatUSD(data.totals.last7d.total)}</td>
                  <td className="py-3 px-3 text-right text-nm-text">{formatUSD(data.totals.last7d.basic)}</td>
                  <td className="py-3 px-3 text-right text-nm-warning">{formatUSD(data.totals.last7d.ambassador)}</td>
                  <td className="py-3 px-3 text-right text-nm-accent">{formatUSD(data.totals.last7d.premium)}</td>
                </tr>
                <tr className="border-b border-nm-borderLight hover:bg-nm-surfaceHover">
                  <td className="py-3 px-3 font-medium text-nm-text">Last 30d</td>
                  <td className="py-3 px-3 text-right font-bold text-nm-success">{formatUSD(data.totals.last30d.total)}</td>
                  <td className="py-3 px-3 text-right text-nm-text">{formatUSD(data.totals.last30d.basic)}</td>
                  <td className="py-3 px-3 text-right text-nm-warning">{formatUSD(data.totals.last30d.ambassador)}</td>
                  <td className="py-3 px-3 text-right text-nm-accent">{formatUSD(data.totals.last30d.premium)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Period Tabs */}
      <h3 className="text-lg font-semibold text-nm-text mb-3">Top Fee Payers</h3>
      <div className="mb-4">
        <PeriodSelector
          periods={Object.keys(periodLabels) as TimePeriod[]}
          selected={selectedPeriod}
          onChange={setSelectedPeriod}
          labels={periodLabels}
        />
      </div>

      {/* Leaderboard Table */}
      <FeeLeadersTable leaders={currentLeaders} isLoading={isLoading} />

      {data && (
        <div className="mt-4 text-xs text-nm-muted text-right">
          Generated at: {new Date(data.generatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default FeeLeadersCard;

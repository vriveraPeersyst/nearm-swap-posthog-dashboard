import { useState } from 'react';
import { RefreshCw, DollarSign, Crown, Users, Sparkles } from 'lucide-react';
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
    basic: 'bg-gray-100 text-gray-700',
    premium: 'bg-purple-100 text-purple-700',
    ambassador: 'bg-yellow-100 text-yellow-700',
  };
  
  const icons = {
    basic: <Users className="h-3 w-3" />,
    premium: <Crown className="h-3 w-3" />,
    ambassador: <Sparkles className="h-3 w-3" />,
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${styles[tier]}`}>
      {icons[tier]}
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
};

const TabButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode 
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {children}
  </button>
);

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
          <div key={i} className="h-10 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No fee data available for this period
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 text-gray-500 font-medium">#</th>
            <th className="text-left py-3 px-2 text-gray-500 font-medium">Account</th>
            <th className="text-left py-3 px-2 text-gray-500 font-medium">Tier</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">Fees Paid</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">Volume</th>
            <th className="text-right py-3 px-2 text-gray-500 font-medium">Swaps</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((entry, index) => (
            <tr key={entry.accountId} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-2 text-gray-400">{index + 1}</td>
              <td className="py-2 px-2">
                <a 
                  href={`https://nearblocks.io/address/${entry.accountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                >
                  {truncateAddress(entry.accountId)}
                </a>
              </td>
              <td className="py-2 px-2">
                <TierBadge tier={entry.tier} />
              </td>
              <td className="py-2 px-2 text-right font-medium text-green-600">
                {formatUSD(entry.feesPaid)}
              </td>
              <td className="py-2 px-2 text-right text-gray-700">
                {formatUSD(entry.volumeUSD)}
              </td>
              <td className="py-2 px-2 text-right text-gray-500">
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Earned Fees</h2>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Fee Rates Info */}
      {data && (
        <div className="mb-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Fee Rates:</span>
            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">Basic: {data.feeRates.basic}</span>
            <span className="px-2 py-0.5 bg-yellow-100 rounded text-yellow-700">Ambassador: {data.feeRates.ambassador}</span>
            <span className="px-2 py-0.5 bg-purple-100 rounded text-purple-700">Premium: {data.feeRates.premium}</span>
          </div>
        </div>
      )}

      {/* Total Fees Earned Table */}
      {data && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Total Fees Earned</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Period</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">Total</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">Basic (0.88%)</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">Ambassador (0.66%)</th>
                  <th className="text-right py-3 px-3 text-gray-500 font-medium">Premium (0.22%)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">All Time</td>
                  <td className="py-3 px-3 text-right font-bold text-green-600">{formatUSD(data.totals.allTime.total)}</td>
                  <td className="py-3 px-3 text-right text-gray-700">{formatUSD(data.totals.allTime.basic)}</td>
                  <td className="py-3 px-3 text-right text-yellow-700">{formatUSD(data.totals.allTime.ambassador)}</td>
                  <td className="py-3 px-3 text-right text-purple-700">{formatUSD(data.totals.allTime.premium)}</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">Last 24h</td>
                  <td className="py-3 px-3 text-right font-bold text-green-600">{formatUSD(data.totals.last24h.total)}</td>
                  <td className="py-3 px-3 text-right text-gray-700">{formatUSD(data.totals.last24h.basic)}</td>
                  <td className="py-3 px-3 text-right text-yellow-700">{formatUSD(data.totals.last24h.ambassador)}</td>
                  <td className="py-3 px-3 text-right text-purple-700">{formatUSD(data.totals.last24h.premium)}</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">Last 7d</td>
                  <td className="py-3 px-3 text-right font-bold text-green-600">{formatUSD(data.totals.last7d.total)}</td>
                  <td className="py-3 px-3 text-right text-gray-700">{formatUSD(data.totals.last7d.basic)}</td>
                  <td className="py-3 px-3 text-right text-yellow-700">{formatUSD(data.totals.last7d.ambassador)}</td>
                  <td className="py-3 px-3 text-right text-purple-700">{formatUSD(data.totals.last7d.premium)}</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">Last 30d</td>
                  <td className="py-3 px-3 text-right font-bold text-green-600">{formatUSD(data.totals.last30d.total)}</td>
                  <td className="py-3 px-3 text-right text-gray-700">{formatUSD(data.totals.last30d.basic)}</td>
                  <td className="py-3 px-3 text-right text-yellow-700">{formatUSD(data.totals.last30d.ambassador)}</td>
                  <td className="py-3 px-3 text-right text-purple-700">{formatUSD(data.totals.last30d.premium)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Period Tabs */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Fee Payers</h3>
      <div className="flex gap-2 mb-4">
        {(Object.keys(periodLabels) as TimePeriod[]).map((period) => (
          <TabButton
            key={period}
            active={selectedPeriod === period}
            onClick={() => setSelectedPeriod(period)}
          >
            {periodLabels[period]}
          </TabButton>
        ))}
      </div>

      {/* Leaderboard Table */}
      <FeeLeadersTable leaders={currentLeaders} isLoading={isLoading} />

      {data && (
        <div className="mt-4 text-xs text-gray-400 text-right">
          Generated at: {new Date(data.generatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default FeeLeadersCard;

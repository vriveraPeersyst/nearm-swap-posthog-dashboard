import React, { useState } from 'react';
import { Users, Coins, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import type { ValidatorStats } from '../types';

interface ValidatorStatsCardProps {
  data: ValidatorStats;
  nearPriceUSD?: number;
}

type TimePeriod = '24h' | '7d' | '30d';

const ValidatorStatsCard: React.FC<ValidatorStatsCardProps> = ({ data, nearPriceUSD }) => {
  const [stakedChangePeriod, setStakedChangePeriod] = useState<TimePeriod>('24h');
  const [delegatorsChangePeriod, setDelegatorsChangePeriod] = useState<TimePeriod>('24h');

  const formatNEAR = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M NEAR`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K NEAR`;
    }
    return `${amount.toFixed(2)} NEAR`;
  };

  const formatUSD = (nearAmount: number) => {
    if (!nearPriceUSD) return null;
    const usdValue = nearAmount * nearPriceUSD;
    if (usdValue >= 1000000) {
      return `$${(usdValue / 1000000).toFixed(2)}M`;
    } else if (usdValue >= 1000) {
      return `$${(usdValue / 1000).toFixed(2)}K`;
    }
    return `$${usdValue.toFixed(2)}`;
  };

  const formatChange = (change: number, showSign: boolean = true) => {
    const sign = showSign && change > 0 ? '+' : '';
    if (Math.abs(change) >= 1000000) {
      return `${sign}${(change / 1000000).toFixed(2)}M`;
    } else if (Math.abs(change) >= 1000) {
      return `${sign}${(change / 1000).toFixed(2)}K`;
    }
    return `${sign}${change.toFixed(2)}`;
  };

  const getStakedChange = () => {
    switch (stakedChangePeriod) {
      case '24h':
        return { change: data.near_staked_24h_change, percent: data.near_staked_24h_change_percent };
      case '7d':
        return { change: data.near_staked_7d_change, percent: data.near_staked_7d_change_percent };
      case '30d':
        return { change: data.near_staked_30d_change, percent: data.near_staked_30d_change_percent };
    }
  };

  const getDelegatorsChange = () => {
    switch (delegatorsChangePeriod) {
      case '24h':
        return data.delegators_24h_change;
      case '7d':
        return data.delegators_7d_change;
      case '30d':
        return data.delegators_30d_change;
    }
  };

  const stakedChange = getStakedChange();
  const delegatorsChange = getDelegatorsChange();

  const PeriodSelector: React.FC<{
    value: TimePeriod;
    onChange: (period: TimePeriod) => void;
  }> = ({ value, onChange }) => (
    <div className="flex gap-1 mt-2">
      {(['24h', '7d', '30d'] as TimePeriod[]).map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            value === period
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Validator Stats</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-mono">{data.validator_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Delegators */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
          <p className="text-xs sm:text-sm text-blue-600 font-medium text-center mb-1">Total Delegators</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-800 text-center">
            {data.total_delegators.toLocaleString()}
          </p>
        </div>

        {/* Total NEAR Staked */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-center mb-2">
            <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
          <p className="text-xs sm:text-sm text-purple-600 font-medium text-center mb-1">NEAR Staked</p>
          <p className="text-xl sm:text-2xl font-bold text-purple-800 text-center">
            {formatNEAR(data.total_near_staked)}
          </p>
          {nearPriceUSD && (
            <p className="text-xs sm:text-sm text-purple-600 text-center mt-1">
              {formatUSD(data.total_near_staked)}
            </p>
          )}
        </div>

        {/* NEAR Staked Change */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-center mb-2">
            {stakedChange.change >= 0 ? (
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            ) : (
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            )}
          </div>
          <p className="text-xs sm:text-sm text-green-600 font-medium text-center mb-1">
            Staked Change ({stakedChangePeriod})
          </p>
          <div className="text-center">
            <p className={`text-lg sm:text-xl font-bold ${
              stakedChange.change >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {formatChange(stakedChange.change)} NEAR
            </p>
            <p className={`text-xs sm:text-sm ${
              stakedChange.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ({stakedChange.percent >= 0 ? '+' : ''}{stakedChange.percent.toFixed(2)}%)
            </p>
            {nearPriceUSD && (
              <p className="text-xs text-gray-500 mt-1">
                {stakedChange.change >= 0 ? '+' : ''}{formatUSD(stakedChange.change)}
              </p>
            )}
          </div>
          <PeriodSelector value={stakedChangePeriod} onChange={setStakedChangePeriod} />
        </div>

        {/* Delegators Change */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-center mb-2">
            {delegatorsChange >= 0 ? (
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />
            ) : (
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            )}
          </div>
          <p className="text-xs sm:text-sm text-indigo-600 font-medium text-center mb-1">
            Delegators Change ({delegatorsChangePeriod})
          </p>
          <div className="text-center">
            <p className={`text-xl sm:text-2xl font-bold ${
              delegatorsChange >= 0 ? 'text-indigo-700' : 'text-red-700'
            }`}>
              {delegatorsChange >= 0 ? '+' : ''}{delegatorsChange.toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-indigo-600">
              delegators
            </p>
          </div>
          <PeriodSelector value={delegatorsChangePeriod} onChange={setDelegatorsChangePeriod} />
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(data.latest_update).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ValidatorStatsCard;

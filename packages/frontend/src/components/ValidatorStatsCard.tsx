import React, { useState } from 'react';
import { UsersIcon, CoinsIcon, TrendUpIcon, TrendDownIcon, ShieldCheckIcon } from './icons';
import { PeriodSelector } from './PeriodSelector';
import type { ValidatorStats } from '../types';

interface ValidatorStatsCardProps {
  data: ValidatorStats;
  nearPriceUSD?: number;
}

type TimePeriod = '3d' | '7d' | '30d';

const ValidatorStatsCard: React.FC<ValidatorStatsCardProps> = ({ data, nearPriceUSD }) => {
  // Provide default values for all data fields
  const safeData = {
    validator_id: data?.validator_id || 'npro.poolv1.near',
    total_delegators: data?.total_delegators || 0,
    total_near_staked: data?.total_near_staked || 0,
    near_staked_3d_change: data?.near_staked_3d_change || 0,
    near_staked_3d_change_percent: data?.near_staked_3d_change_percent || 0,
    near_staked_7d_change: data?.near_staked_7d_change || 0,
    near_staked_7d_change_percent: data?.near_staked_7d_change_percent || 0,
    near_staked_30d_change: data?.near_staked_30d_change || 0,
    near_staked_30d_change_percent: data?.near_staked_30d_change_percent || 0,
    delegators_3d_change: data?.delegators_3d_change || 0,
    delegators_7d_change: data?.delegators_7d_change || 0,
    delegators_30d_change: data?.delegators_30d_change || 0,
    latest_update: data?.latest_update || new Date().toISOString(),
  };

  // Check if data is valid (has required fields or is an error)
  if (!data || typeof data !== 'object' || 'error' in data || !data.validator_id) {
    return (
      <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-nm-accent flex-shrink-0" />
          <h2 className="text-lg font-semibold text-nm-text">Validator Stats</h2>
        </div>
        <p className="text-center text-nm-muted">Loading validator stats...</p>
      </div>
    );
  }

  const [stakedChangePeriod, setStakedChangePeriod] = useState<TimePeriod>('3d');
  const [delegatorsChangePeriod, setDelegatorsChangePeriod] = useState<TimePeriod>('3d');

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
      case '3d':
        return { 
          change: safeData.near_staked_3d_change, 
          percent: safeData.near_staked_3d_change_percent 
        };
      case '7d':
        return { 
          change: safeData.near_staked_7d_change, 
          percent: safeData.near_staked_7d_change_percent 
        };
      case '30d':
        return { 
          change: safeData.near_staked_30d_change, 
          percent: safeData.near_staked_30d_change_percent 
        };
    }
  };

  const getDelegatorsChange = () => {
    switch (delegatorsChangePeriod) {
      case '3d':
        return safeData.delegators_3d_change;
      case '7d':
        return safeData.delegators_7d_change;
      case '30d':
        return safeData.delegators_30d_change;
    }
  };

  const stakedChange = getStakedChange();
  const delegatorsChange = getDelegatorsChange();


  return (
    <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-nm-accent flex-shrink-0" />
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-nm-text">Validator Stats</h2>
          <p className="text-xs sm:text-sm text-nm-muted font-sf-mono">{safeData.validator_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Delegators */}
        <div className="bg-nm-accentDim rounded-nm-sm p-4">
          <div className="flex items-center justify-center mb-2">
            <UsersIcon className="h-5 w-5 text-nm-accent" />
          </div>
          <p className="text-xs text-nm-accent font-medium text-center mb-1">Total Delegators</p>
          <p className="text-2xl font-bold text-nm-text text-center">
            {safeData.total_delegators.toLocaleString()}
          </p>
        </div>

        {/* Total NEAR Staked */}
        <div className="bg-nm-accentDim rounded-nm-sm p-4">
          <div className="flex items-center justify-center mb-2">
            <CoinsIcon className="h-5 w-5 text-nm-accent" />
          </div>
          <p className="text-xs text-nm-accent font-medium text-center mb-1">NEAR Staked</p>
          <p className="text-2xl font-bold text-nm-text text-center">
            {formatNEAR(safeData.total_near_staked)}
          </p>
          {nearPriceUSD && (
            <p className="text-xs text-nm-muted text-center mt-1">
              {formatUSD(safeData.total_near_staked)}
            </p>
          )}
        </div>

        {/* NEAR Staked Change */}
        <div className="bg-nm-accentDim rounded-nm-sm p-4">
          <div className="flex items-center justify-center mb-2">
            {stakedChange.change >= 0 ? (
              <TrendUpIcon className="h-5 w-5 text-nm-success" />
            ) : (
              <TrendDownIcon className="h-5 w-5 text-nm-error" />
            )}
          </div>
          <p className="text-xs text-nm-accent font-medium text-center mb-1">
            Staked Change ({stakedChangePeriod})
          </p>
          <div className="text-center">
            <p className={`text-lg font-bold ${
              stakedChange.change >= 0 ? 'text-nm-success' : 'text-nm-error'
            }`}>
              {formatChange(stakedChange.change)} NEAR
            </p>
            <p className={`text-xs ${
              stakedChange.change >= 0 ? 'text-nm-success' : 'text-nm-error'
            }`}>
              ({stakedChange.percent >= 0 ? '+' : ''}{stakedChange.percent.toFixed(2)}%)
            </p>
            {nearPriceUSD && (
              <p className="text-xs text-nm-muted mt-1">
                {stakedChange.change >= 0 ? '+' : ''}{formatUSD(stakedChange.change)}
              </p>
            )}
          </div>
          <div className="flex justify-center mt-3">
            <PeriodSelector periods={['3d', '7d', '30d'] as TimePeriod[]} selected={stakedChangePeriod} onChange={setStakedChangePeriod} />
          </div>
        </div>

        {/* Delegators Change */}
        <div className="bg-nm-accentDim rounded-nm-sm p-4">
          <div className="flex items-center justify-center mb-2">
            {delegatorsChange >= 0 ? (
              <TrendUpIcon className="h-5 w-5 text-nm-accent" />
            ) : (
              <TrendDownIcon className="h-5 w-5 text-nm-error" />
            )}
          </div>
          <p className="text-xs text-nm-accent font-medium text-center mb-1">
            Delegators Change ({delegatorsChangePeriod})
          </p>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              delegatorsChange >= 0 ? 'text-nm-accent' : 'text-nm-error'
            }`}>
              {delegatorsChange >= 0 ? '+' : ''}{delegatorsChange.toLocaleString()}
            </p>
            <p className="text-xs text-nm-muted">
              delegators
            </p>
          </div>
          <div className="flex justify-center mt-3">
            <PeriodSelector periods={['3d', '7d', '30d'] as TimePeriod[]} selected={delegatorsChangePeriod} onChange={setDelegatorsChangePeriod} />
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-nm-border text-center">
        <p className="text-xs text-nm-muted">
          Last updated: {new Date(safeData.latest_update).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ValidatorStatsCard;

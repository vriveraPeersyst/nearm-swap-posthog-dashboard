import React from 'react';
import { UsersIcon, CoinsIcon, PiggyBankIcon, CalendarBlankIcon } from './icons';
import type { AccountValueSummary } from '../types';

interface AccountValuesCardProps {
  data: AccountValueSummary;
  nearPriceUSD?: number;
}

const AccountValuesCard: React.FC<AccountValuesCardProps> = ({ data, nearPriceUSD }) => {
  const formatNEAR = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M NEAR`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K NEAR`;
    }
    return `${amount.toFixed(3)} NEAR`;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <CoinsIcon className="h-5 w-5 text-nm-accent flex-shrink-0" />
        <h2 className="text-lg font-semibold text-nm-text">Account Values Summary</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="text-center p-3 sm:p-0">
          <div className="flex items-center justify-center mb-2">
            <UsersIcon className="h-5 w-5 text-nm-accent" />
          </div>
          <p className="text-xs text-nm-muted mb-1">Total Unique Accounts</p>
          <p className="text-2xl font-bold text-nm-text">{data.total_unique_accounts.toLocaleString()}</p>
        </div>

        {/* Total NEAR Value */}
        <div className="text-center p-3 sm:p-0">
          <div className="flex items-center justify-center mb-2">
            <CoinsIcon className="h-5 w-5 text-nm-success" />
          </div>
          <p className="text-xs text-nm-muted mb-1">Total NEAR Value</p>
          <p className="text-2xl font-bold text-nm-text">{formatNEAR(data.total_near_value)}</p>
          {nearPriceUSD && (
            <p className="text-xs text-nm-muted mt-1">{formatUSD(data.total_near_value)}</p>
          )}
        </div>

        {/* Total NEAR Staked */}
        <div className="text-center p-3 sm:p-0">
          <div className="flex items-center justify-center mb-2">
            <PiggyBankIcon className="h-5 w-5 text-nm-accent" />
          </div>
          <p className="text-xs text-nm-muted mb-1">Total NEAR Staked</p>
          <p className="text-2xl font-bold text-nm-text">{formatNEAR(data.total_near_staked)}</p>
          {nearPriceUSD && (
            <p className="text-xs text-nm-muted mt-1">{formatUSD(data.total_near_staked)}</p>
          )}
        </div>

        {/* Combined Total */}
        <div className="text-center p-3 sm:p-0">
          <div className="flex items-center justify-center mb-2">
            <CoinsIcon className="h-5 w-5 text-nm-accent" />
          </div>
          <p className="text-xs text-nm-muted mb-1">Total Combined</p>
          <p className="text-2xl font-bold text-nm-text">{formatNEAR(data.total_near_combined)}</p>
          {nearPriceUSD && (
            <p className="text-xs text-nm-muted mt-1">{formatUSD(data.total_near_combined)}</p>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-nm-border">
        <h3 className="text-base font-semibold text-nm-text mb-4">Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-nm-accentDim rounded-nm-sm p-3 sm:p-4">
            <p className="text-xs text-nm-accent font-medium">Average NEAR per Account</p>
            <p className="text-lg font-bold text-nm-text">{data.avg_near_value.toFixed(2)} NEAR</p>
            {nearPriceUSD && (
              <p className="text-xs text-nm-accent mt-1">{formatUSD(data.avg_near_value)}</p>
            )}
          </div>
          <div className="bg-nm-accentDim rounded-nm-sm p-3 sm:p-4">
            <p className="text-xs text-nm-accent font-medium">Average Staked per Account</p>
            <p className="text-lg font-bold text-nm-text">{data.avg_near_staked.toFixed(2)} NEAR</p>
            {nearPriceUSD && (
              <p className="text-xs text-nm-accent mt-1">{formatUSD(data.avg_near_staked)}</p>
            )}
          </div>
          <div className="bg-nm-accentDim rounded-nm-sm p-3 sm:p-4">
            <p className="text-xs text-nm-accent font-medium">Accounts with Balance</p>
            <p className="text-lg font-bold text-nm-text">{data.accounts_with_any_balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Account Distribution */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-nm-border">
        <h3 className="text-base font-semibold text-nm-text mb-4">Account Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-nm-muted">Accounts with NEAR Value &gt; 0</p>
            <p className="text-base font-semibold text-nm-text">{data.accounts_with_near_value.toLocaleString()}</p>
            <p className="text-xs text-nm-muted">
              {((data.accounts_with_near_value / data.total_unique_accounts) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div>
            <p className="text-xs text-nm-muted">Accounts with NEAR Staked &gt; 0</p>
            <p className="text-base font-semibold text-nm-text">{data.accounts_with_near_staked.toLocaleString()}</p>
            <p className="text-xs text-nm-muted">
              {((data.accounts_with_near_staked / data.total_unique_accounts) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      </div>

      {/* Data Range */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-nm-border">
        <div className="flex items-center gap-2 mb-3">
          <CalendarBlankIcon className="h-5 w-5 text-nm-muted flex-shrink-0" />
          <h3 className="text-base font-semibold text-nm-text">Data Range</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-nm-muted">Earliest Update</p>
            <p className="font-medium text-nm-text">{formatDate(data.earliest_account_update)}</p>
          </div>
          <div>
            <p className="text-nm-muted">Most Recent Update</p>
            <p className="font-medium text-nm-text">{formatDate(data.most_recent_account_update)}</p>
          </div>
          <div>
            <p className="text-nm-muted">Events Processed</p>
            <p className="font-medium text-nm-text">{data.total_account_state_events.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountValuesCard;

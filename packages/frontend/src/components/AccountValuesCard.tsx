import React from 'react';
import { Users, Coins, PiggyBank, Calendar } from 'lucide-react';
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Account Values Summary</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Accounts */}
        <div className="text-center p-3 sm:p-0">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Unique Accounts</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.total_unique_accounts.toLocaleString()}</p>
        </div>

        {/* Total NEAR Value */}
        <div className="text-center p-3 sm:p-0">
          <div className="flex items-center justify-center mb-2">
            <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total NEAR Value</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatNEAR(data.total_near_value)}</p>
          {nearPriceUSD && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{formatUSD(data.total_near_value)}</p>
          )}
        </div>

        {/* Total NEAR Staked */}
        <div className="text-center p-3 sm:p-0">
          <div className="flex items-center justify-center mb-2">
            <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total NEAR Staked</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatNEAR(data.total_near_staked)}</p>
          {nearPriceUSD && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{formatUSD(data.total_near_staked)}</p>
          )}
        </div>

        {/* Combined Total */}
        <div className="text-center p-3 sm:p-0">
          <div className="flex items-center justify-center mb-2">
            <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Combined</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatNEAR(data.total_near_combined)}</p>
          {nearPriceUSD && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{formatUSD(data.total_near_combined)}</p>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-600 font-medium">Average NEAR per Account</p>
            <p className="text-lg sm:text-xl font-bold text-blue-800">{data.avg_near_value.toFixed(2)} NEAR</p>
            {nearPriceUSD && (
              <p className="text-xs sm:text-sm text-blue-600 mt-1">{formatUSD(data.avg_near_value)}</p>
            )}
          </div>
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-purple-600 font-medium">Average Staked per Account</p>
            <p className="text-lg sm:text-xl font-bold text-purple-800">{data.avg_near_staked.toFixed(2)} NEAR</p>
            {nearPriceUSD && (
              <p className="text-xs sm:text-sm text-purple-600 mt-1">{formatUSD(data.avg_near_staked)}</p>
            )}
          </div>
          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-600 font-medium">Accounts with Balance</p>
            <p className="text-lg sm:text-xl font-bold text-green-800">{data.accounts_with_any_balance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Account Distribution */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Account Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Accounts with NEAR Value &gt; 0</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900">{data.accounts_with_near_value.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              {((data.accounts_with_near_value / data.total_unique_accounts) * 100).toFixed(1)}% of total
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600">Accounts with NEAR Staked &gt; 0</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900">{data.accounts_with_near_staked.toLocaleString()}</p>
            <p className="text-xs text-gray-500">
              {((data.accounts_with_near_staked / data.total_unique_accounts) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      </div>

      {/* Data Range */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Data Range</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-gray-600">Earliest Update</p>
            <p className="font-medium text-gray-900">{formatDate(data.earliest_account_update)}</p>
          </div>
          <div>
            <p className="text-gray-600">Most Recent Update</p>
            <p className="font-medium text-gray-900">{formatDate(data.most_recent_account_update)}</p>
          </div>
          <div>
            <p className="text-gray-600">Events Processed</p>
            <p className="font-medium text-gray-900">{data.total_account_state_events.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountValuesCard;

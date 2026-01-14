import React from 'react';
import type { SwapperData } from '../types';

interface TopSwappersTableProps {
  title: string;
  swappers: SwapperData[];
  sortBy?: 'volume' | 'count' | 'feeVolume' | 'period';
  periodLabel?: string;
  hideHeader?: boolean;
}

const TopSwappersTable: React.FC<TopSwappersTableProps> = ({ 
  title, 
  swappers,
  sortBy = 'volume',
  periodLabel,
  hideHeader = false
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatAccountId = (accountId: string) => {
    if (accountId.length > 25) {
      return `${accountId.substring(0, 12)}...${accountId.substring(accountId.length - 8)}`;
    }
    return accountId;
  };

  const getPeriodData = (swapper: SwapperData) => {
    if (periodLabel === '24h') {
      return { swaps: swapper.last24hSwaps, volume: swapper.last24hVolumeUSD };
    } else if (periodLabel === '7d') {
      return { swaps: swapper.last7dSwaps, volume: swapper.last7dVolumeUSD };
    } else if (periodLabel === '30d') {
      return { swaps: swapper.last30dSwaps, volume: swapper.last30dVolumeUSD };
    }
    return null;
  };

  return (
    <div className={hideHeader ? '' : 'bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden'}>
      {!hideHeader && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Swaps
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volume
              </th>
              {sortBy === 'feeVolume' && (
                <>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Fee Swaps
                  </th>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee Vol
                  </th>
                </>
              )}
              {periodLabel && (
                <>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    {periodLabel} Swaps
                  </th>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {periodLabel} Vol
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {swappers.map((swapper, index) => {
              const periodData = getPeriodData(swapper);
              return (
                <tr key={swapper.accountId} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-3 py-2 text-xs text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-2 sm:px-3 py-2 min-w-0">
                    <span className="text-xs font-mono text-blue-600 truncate" title={swapper.accountId}>
                      {formatAccountId(swapper.accountId)}
                    </span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 whitespace-nowrap">
                    {swapper.totalSwaps.toLocaleString()}
                  </td>
                  <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 whitespace-nowrap">
                    {formatNumber(swapper.totalVolumeUSD)}
                  </td>
                  {sortBy === 'feeVolume' && (
                    <>
                      <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 whitespace-nowrap hidden sm:table-cell">
                        {swapper.feeSwaps.toLocaleString()}
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-xs text-purple-600 font-medium whitespace-nowrap">
                        {formatNumber(swapper.feeVolumeUSD)}
                      </td>
                    </>
                  )}
                  {periodLabel && periodData && (
                    <>
                      <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 whitespace-nowrap hidden sm:table-cell">
                        {periodData.swaps.toLocaleString()}
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-xs text-green-600 font-medium whitespace-nowrap">
                        {formatNumber(periodData.volume)}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {swappers.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No swappers found
        </div>
      )}
    </div>
  );
};

export default TopSwappersTable;

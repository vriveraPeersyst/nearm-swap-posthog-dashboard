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
    <div className={hideHeader ? '' : 'bg-nm-card rounded-nm shadow-nm border border-nm-border overflow-hidden'}>
      {!hideHeader && (
        <div className="px-4 py-3 bg-nm-borderLight border-b border-nm-border">
          <h3 className="text-sm sm:text-base font-semibold text-nm-text">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-nm-borderLight">
            <tr>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                #
              </th>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                Account
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                Swaps
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                Volume
              </th>
              {sortBy === 'feeVolume' && (
                <>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider hidden sm:table-cell">
                    Fee Swaps
                  </th>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                    Fee Vol
                  </th>
                </>
              )}
              {periodLabel && (
                <>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider hidden sm:table-cell">
                    {periodLabel} Swaps
                  </th>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                    {periodLabel} Vol
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-nm-card divide-y divide-nm-border">
            {swappers.map((swapper, index) => {
              const periodData = getPeriodData(swapper);
              return (
                <tr key={swapper.accountId} className="hover:bg-nm-surfaceHover">
                  <td className="px-2 sm:px-3 py-2 text-xs text-nm-muted">
                    {index + 1}
                  </td>
                  <td className="px-2 sm:px-3 py-2 min-w-0">
                    <a 
                      href={`https://nearblocks.io/address/${swapper.accountId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-sf-mono text-nm-accent hover:text-nm-ctaHover hover:underline truncate" 
                      title={swapper.accountId}
                    >
                      {formatAccountId(swapper.accountId)}
                    </a>
                  </td>
                  <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap">
                    {swapper.totalSwaps.toLocaleString()}
                  </td>
                  <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap">
                    {formatNumber(swapper.totalVolumeUSD)}
                  </td>
                  {sortBy === 'feeVolume' && (
                    <>
                      <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap hidden sm:table-cell">
                        {swapper.feeSwaps.toLocaleString()}
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-xs text-nm-accent font-medium whitespace-nowrap">
                        {formatNumber(swapper.feeVolumeUSD)}
                      </td>
                    </>
                  )}
                  {periodLabel && periodData && (
                    <>
                      <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap hidden sm:table-cell">
                        {periodData.swaps.toLocaleString()}
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-xs text-nm-accent font-medium whitespace-nowrap">
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
        <div className="px-6 py-8 text-center text-nm-muted">
          No swappers found
        </div>
      )}
    </div>
  );
};

export default TopSwappersTable;

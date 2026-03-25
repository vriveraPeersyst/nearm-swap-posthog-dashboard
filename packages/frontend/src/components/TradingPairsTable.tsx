import React from 'react';
import { ArrowRightIcon } from './icons';
import TokenAvatar from './TokenAvatar';
import { useTokenImages, resolveTokenImage } from '../hooks/useTokenImages';
import type { TradingPair, PeriodTradingPair } from '../types';

type AnyTradingPair = TradingPair | PeriodTradingPair;

interface TradingPairsTableProps {
  title: string;
  pairs: AnyTradingPair[];
  showLast24h?: boolean;
  periodLabel?: string; // e.g., "7d" or "30d" for period-based tables
  hideHeader?: boolean; // Hide the title header when using external header
}

const TradingPairsTable: React.FC<TradingPairsTableProps> = ({ 
  title, 
  pairs, 
  showLast24h = false,
  periodLabel,
  hideHeader = false
}) => {
  const { tokenMap } = useTokenImages();

  const resolveSymbolForImage = (token: string): string => {
    if (token.includes('intents:')) return token.replace('intents:', '').toUpperCase();
    if (token === 'near-native') return 'NEAR';
    if (token.includes('.bridge.near')) return token.split('.')[0].toUpperCase();
    if (token.includes('.near')) return token.split('.')[0].toUpperCase();
    return token.toUpperCase();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPair = (pair: string) => {
    const [tokenA, tokenB] = pair.split(' → ');
    const cleanTokenName = (token: string) => {
      // Remove long hashes and show readable names
      if (token.includes('intents:')) {
        const tokenSymbol = token.replace('intents:', '').toUpperCase();
        return `i${tokenSymbol}`;
      }
      if (token === 'near-native') {
        return 'NEAR';
      }
      if (token.includes('.bridge.near')) {
        const symbol = token.split('.')[0];
        return symbol.toUpperCase();
      }
      if (token.includes('.near')) {
        const parts = token.split('.');
        return parts[0].toUpperCase();
      }
      // For long hashes, show first few characters
      if (token.length > 20) {
        return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
      }
      return token.toUpperCase();
    };

    const symbolA = resolveSymbolForImage(tokenA);
    const symbolB = resolveSymbolForImage(tokenB);

    return (
      <div className="flex items-center gap-2 text-xs max-w-full">
        <div className="flex items-center -space-x-2 flex-shrink-0">
          <TokenAvatar
            imageUrl={resolveTokenImage(tokenMap, symbolA, tokenA)}
            symbol={symbolA}
            size={22}
            chain={false}
            className="z-10"
          />
          <TokenAvatar
            imageUrl={resolveTokenImage(tokenMap, symbolB, tokenB)}
            symbol={symbolB}
            size={22}
            chain={false}
          />
        </div>
        <span className="font-medium text-nm-accent truncate">{cleanTokenName(tokenA)}</span>
        <ArrowRightIcon className="h-2.5 w-2.5 text-nm-muted flex-shrink-0 mx-0.5" />
        <span className="font-medium text-nm-accent truncate">{cleanTokenName(tokenB)}</span>
      </div>
    );
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
                Pair
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                Swaps
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                Volume
              </th>
              {showLast24h && (
                <>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider hidden sm:table-cell">
                    24h Swaps
                  </th>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                    24h Vol
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
            {pairs.map((pair, index) => (
              <tr key={`${pair.pair}-${index}`} className="hover:bg-nm-surfaceHover">
                <td className="px-2 sm:px-3 py-2 min-w-0">
                  <div className="truncate">
                    {formatPair(pair.pair)}
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap">
                  {pair.totalSwaps.toLocaleString()}
                </td>
                <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap">
                  {formatNumber(pair.totalVolumeUSD)}
                </td>
                {showLast24h && 'last24hSwaps' in pair && (
                  <>
                    <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap hidden sm:table-cell">
                      {pair.last24hSwaps.toLocaleString()}
                    </td>
                    <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap">
                      {formatNumber(pair.last24hVolumeUSD)}
                    </td>
                  </>
                )}
                {periodLabel && 'periodSwaps' in pair && (
                  <>
                    <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap hidden sm:table-cell">
                      {pair.periodSwaps.toLocaleString()}
                    </td>
                    <td className="px-1 sm:px-2 py-2 text-xs text-nm-text whitespace-nowrap">
                      {formatNumber(pair.periodVolumeUSD)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pairs.length === 0 && (
        <div className="px-6 py-8 text-center text-nm-muted">
          No trading pairs found
        </div>
      )}
    </div>
  );
};

export default TradingPairsTable;

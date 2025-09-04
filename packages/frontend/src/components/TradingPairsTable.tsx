import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { TradingPair } from '../types';

interface TradingPairsTableProps {
  title: string;
  pairs: TradingPair[];
  showLast24h?: boolean;
}

const TradingPairsTable: React.FC<TradingPairsTableProps> = ({ 
  title, 
  pairs, 
  showLast24h = false 
}) => {
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

    return (
      <div className="flex items-center gap-1 text-xs max-w-full">
        <span className="font-medium text-blue-600 truncate">{cleanTokenName(tokenA)}</span>
        <ArrowRight size={10} className="text-gray-400 flex-shrink-0 mx-0.5" />
        <span className="font-medium text-green-600 truncate">{cleanTokenName(tokenB)}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800">{title}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pair
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Swaps
              </th>
              <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volume
              </th>
              {showLast24h && (
                <>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    24h Swaps
                  </th>
                  <th className="px-1 sm:px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    24h Vol
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pairs.map((pair, index) => (
              <tr key={`${pair.pair}-${index}`} className="hover:bg-gray-50">
                <td className="px-2 sm:px-3 py-2 min-w-0">
                  <div className="truncate">
                    {formatPair(pair.pair)}
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 whitespace-nowrap">
                  {pair.totalSwaps.toLocaleString()}
                </td>
                <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 whitespace-nowrap">
                  {formatNumber(pair.totalVolumeUSD)}
                </td>
                {showLast24h && (
                  <>
                    <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 whitespace-nowrap hidden sm:table-cell">
                      {pair.last24hSwaps.toLocaleString()}
                    </td>
                    <td className="px-1 sm:px-2 py-2 text-xs text-gray-900 whitespace-nowrap">
                      {formatNumber(pair.last24hVolumeUSD)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pairs.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No trading pairs found
        </div>
      )}
    </div>
  );
};

export default TradingPairsTable;

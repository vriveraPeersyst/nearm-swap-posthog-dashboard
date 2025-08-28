import React from 'react';
import type { SwapMetrics } from '../types';

interface SummaryTableProps {
  data: SwapMetrics;
}

const SummaryTable: React.FC<SummaryTableProps> = ({ data }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const timeFrames = [
    { key: 'allTime', label: 'All Time', metrics: data.allTime },
    { key: 'last24h', label: 'Last 24h', metrics: data.last24h },
    { key: 'last7d', label: 'Last 7 days', metrics: data.last7d },
    { key: 'last30d', label: 'Last 30 days', metrics: data.last30d },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Time-based Metrics Summary</h3>
        <p className="text-sm text-gray-600 mt-1">Volume side valued: {data.sideValued}</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Swaps
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Volume (USD)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Growth %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeFrames.map((timeFrame) => (
              <tr key={timeFrame.key} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {timeFrame.label}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {timeFrame.metrics.totalSwaps.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(timeFrame.metrics.totalVolumeUSD)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {(timeFrame.key === 'last24h' || timeFrame.key === 'last7d' || timeFrame.key === 'last30d') && (
                    <div className="space-y-1">
                      {timeFrame.metrics.swapGrowthPercent !== undefined && timeFrame.metrics.swapGrowthPercent !== null && (
                        <div className={`text-xs ${timeFrame.metrics.swapGrowthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Swaps: {timeFrame.metrics.swapGrowthPercent >= 0 ? '+' : ''}{timeFrame.metrics.swapGrowthPercent}%
                        </div>
                      )}
                      {timeFrame.metrics.volumeGrowthPercent !== undefined && timeFrame.metrics.volumeGrowthPercent !== null && (
                        <div className={`text-xs ${timeFrame.metrics.volumeGrowthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Volume: {timeFrame.metrics.volumeGrowthPercent >= 0 ? '+' : ''}{timeFrame.metrics.volumeGrowthPercent}%
                        </div>
                      )}
                    </div>
                  )}
                  {(timeFrame.key !== 'last24h' && timeFrame.key !== 'last7d' && timeFrame.key !== 'last30d') && (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryTable;

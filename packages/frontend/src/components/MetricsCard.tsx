import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TimeMetrics } from '../types';

interface MetricsCardProps {
  title: string;
  metrics: TimeMetrics;
  showGrowth?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, metrics, showGrowth = false }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (percent: number | null | undefined) => {
    if (percent === undefined || percent === null) return null;
    const isPositive = percent >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{Math.abs(percent)}%</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600">Total Swaps</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalSwaps.toLocaleString()}</p>
          {showGrowth && formatPercent(metrics.swapGrowthPercent)}
        </div>
        
        <div>
          <p className="text-sm text-gray-600">Total Volume (USD)</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalVolumeUSD)}</p>
          {showGrowth && formatPercent(metrics.volumeGrowthPercent)}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;

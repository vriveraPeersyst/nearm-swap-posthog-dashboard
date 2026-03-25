import React from 'react';
import { TrendUpIcon, TrendDownIcon } from './icons';
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
      <div className={`flex items-center gap-1 ${isPositive ? 'text-nm-success' : 'text-nm-error'}`}>
        {isPositive ? <TrendUpIcon className="h-4 w-4" /> : <TrendDownIcon className="h-4 w-4" />}
        <span>{Math.abs(percent)}%</span>
      </div>
    );
  };

  return (
    <div className="bg-nm-card rounded-nm shadow-nm p-4 sm:p-6 border border-nm-border">
      <h3 className="text-lg font-semibold text-nm-text mb-4">{title}</h3>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-nm-muted">Total Swaps</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-2xl font-bold text-nm-text">{metrics.totalSwaps.toLocaleString()}</p>
            {showGrowth && (
              <div className="mt-1 sm:mt-0">
                {formatPercent(metrics.swapGrowthPercent)}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-xs text-nm-muted">Total Volume (USD)</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-2xl font-bold text-nm-text">{formatNumber(metrics.totalVolumeUSD)}</p>
            {showGrowth && (
              <div className="mt-1 sm:mt-0">
                {formatPercent(metrics.volumeGrowthPercent)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;

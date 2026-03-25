import React from 'react';
import { TrophyIcon, CalendarBlankIcon, UserIcon, CoinsIcon, ArrowSquareOutIcon } from './icons';
import type { TopAccountsResponse } from '../types';

interface TopAccountsTableProps {
  data: TopAccountsResponse;
}

const TopAccountsTable: React.FC<TopAccountsTableProps> = ({ data }) => {
  const { accounts, total_accounts_found, date_range, query_metadata } = data;

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  const formatAccountId = (accountId: string) => {
    if (accountId.length > 25) {
      return `${accountId.substring(0, 12)}...${accountId.substring(accountId.length - 8)}`;
    }
    return accountId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const CrownSvg = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 15H17.5V16.875H2.5V15ZM3.75 7.5L6.25 10.625L10 5L13.75 10.625L16.25 7.5V13.75H3.75V7.5Z" fill="currentColor" />
    </svg>
  );

  const getRankIcon = (index: number) => {
    if (index < 3) {
      const config = [
        { bg: 'bg-nm-premium-shade', gradient: 'from-[#E3935B] to-[#FFC860]', crown: 'text-[#FFB050]' },
        { bg: 'bg-nm-basic-shade', gradient: 'from-[#3F4246] to-[#A7A7A7]', crown: 'text-[#A7A7A7]' },
        { bg: 'bg-nm-ambassador-shade', gradient: 'from-[#A463B0] to-[#5F8AFA]', crown: 'text-[#6B6EF9]' },
      ][index];
      return (
        <div className="relative inline-flex items-center justify-center">
          <div className={`w-11 h-11 rounded-full ${config.bg} flex items-center justify-center`}>
            <span className={`font-sf-mono font-semibold text-lg bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
              #{index + 1}
            </span>
          </div>
          <CrownSvg className={`absolute -top-2 -right-0.5 w-5 h-5 ${config.crown}`} />
        </div>
      );
    }
    return <span className="w-11 text-center text-nm-muted text-sm font-medium">{index + 1}</span>;
  };

  return (
    <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-nm-borderLight border-b border-nm-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-nm-text flex items-center gap-2">
            <TrophyIcon className="text-nm-warning h-[18px] w-[18px]" />
            Top Accounts by Value (Last 30 Days)
          </h3>
          <div className="flex items-center gap-4 text-xs text-nm-muted">
            <div className="flex items-center gap-1">
              <CalendarBlankIcon className="h-3.5 w-3.5" />
              {formatDate(date_range.start_date)} - {formatDate(date_range.end_date)}
            </div>
            <div className="flex items-center gap-1">
              <UserIcon className="h-3.5 w-3.5" />
              {total_accounts_found.toLocaleString()} total accounts
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-3 bg-nm-accentDim border-b border-nm-border">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs text-nm-muted">Showing Top</div>
            <div className="text-sm font-semibold text-nm-text">{accounts.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-nm-muted">Total Found</div>
            <div className="text-sm font-semibold text-nm-text">{total_accounts_found.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-nm-muted">Top Account Value</div>
            <div className="text-sm font-semibold text-nm-text">
              {accounts.length > 0 ? `${formatNumber(accounts[0].total_value)} NEAR` : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-nm-muted">Events Processed</div>
            <div className="text-sm font-semibold text-nm-text">{query_metadata.total_events_processed.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-nm-borderLight">
            <tr>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider w-16">
                Rank
              </th>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-nm-muted uppercase tracking-wider">
                Account ID
              </th>
              <th className="px-1 sm:px-2 py-2 text-right text-xs font-medium text-nm-muted uppercase tracking-wider">
                NEAR Balance
              </th>
              <th className="px-1 sm:px-2 py-2 text-right text-xs font-medium text-nm-muted uppercase tracking-wider">
                NEAR Staked
              </th>
              <th className="px-1 sm:px-2 py-2 text-right text-xs font-medium text-nm-muted uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-1 sm:px-2 py-2 text-center text-xs font-medium text-nm-muted uppercase tracking-wider hidden sm:table-cell">
                Last Update
              </th>
            </tr>
          </thead>
          <tbody className="bg-nm-card divide-y divide-nm-border">
            {accounts.map((account, index) => (
              <tr key={account.account_id} className="hover:bg-nm-surfaceHover">
                <td className="px-2 sm:px-3 py-2 text-center">
                  {getRankIcon(index)}
                </td>
                <td className="px-2 sm:px-3 py-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="text-nm-muted h-3.5 w-3.5" />
                    <a 
                      href={`https://pikespeak.ai/wallet-explorer/${account.account_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sf-mono text-xs text-nm-accent hover:text-nm-ctaHover truncate max-w-[200px] flex items-center gap-1 hover:underline"
                      title={`View ${account.account_id} on NEAR Explorer`}
                    >
                      <span>{formatAccountId(account.account_id)}</span>
                      <ArrowSquareOutIcon className="text-nm-accent h-2.5 w-2.5" />
                    </a>
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-right text-xs text-nm-text whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <span>{formatNumber(account.near_balance)}</span>
                    <CoinsIcon className="text-nm-accent h-3 w-3" />
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-right text-xs text-nm-text whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <span>{formatNumber(account.near_staked)}</span>
                    <CoinsIcon className="text-nm-accent h-3 w-3" />
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-right text-xs font-semibold text-nm-text whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <span>{formatNumber(account.total_value)}</span>
                    <CoinsIcon className="text-nm-success h-3 w-3" />
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-center text-xs text-nm-muted whitespace-nowrap hidden sm:table-cell">
                  {formatDate(account.latest_update)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-nm-borderLight border-t border-nm-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-nm-muted">
          <div className="flex items-center gap-4">
            <span>Showing top {accounts.length} of {total_accounts_found.toLocaleString()} accounts</span>
          </div>
          <div className="flex items-center gap-2">
            <CoinsIcon className="text-nm-accent h-3 w-3" />
            <span className="text-nm-accent">Balance</span>
            <span>•</span>
            <CoinsIcon className="text-nm-accent h-3 w-3" />
            <span className="text-nm-accent">Staked</span>
            <span>•</span>
            <CoinsIcon className="text-nm-success h-3 w-3" />
            <span className="text-nm-success">Total</span>
          </div>
        </div>
      </div>
      
      {accounts.length === 0 && (
        <div className="px-6 py-8 text-center text-nm-muted">
          No account data found for the specified time period
        </div>
      )}
    </div>
  );
};

export default TopAccountsTable;

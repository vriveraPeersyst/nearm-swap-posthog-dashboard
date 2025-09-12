import React from 'react';
import { Trophy, Calendar, User, Coins, ExternalLink } from 'lucide-react';
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500" size={16} />;
    if (index === 1) return <Trophy className="text-gray-400" size={16} />;
    if (index === 2) return <Trophy className="text-amber-600" size={16} />;
    return <span className="w-4 text-center text-gray-500 text-sm font-medium">{index + 1}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={18} />
            Top Accounts by Value (Last 30 Days)
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(date_range.start_date)} - {formatDate(date_range.end_date)}
            </div>
            <div className="flex items-center gap-1">
              <User size={14} />
              {total_accounts_found.toLocaleString()} total accounts
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-600">Showing Top</div>
            <div className="text-sm font-semibold text-gray-900">{accounts.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Total Found</div>
            <div className="text-sm font-semibold text-gray-900">{total_accounts_found.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Top Account Value</div>
            <div className="text-sm font-semibold text-gray-900">
              {accounts.length > 0 ? `${formatNumber(accounts[0].total_value)} NEAR` : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Events Processed</div>
            <div className="text-sm font-semibold text-gray-900">{query_metadata.total_events_processed.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Rank
              </th>
              <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account ID
              </th>
              <th className="px-1 sm:px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                NEAR Balance
              </th>
              <th className="px-1 sm:px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                NEAR Staked
              </th>
              <th className="px-1 sm:px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-1 sm:px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Last Update
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account, index) => (
              <tr key={account.account_id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-3 py-2 text-center">
                  {getRankIcon(index)}
                </td>
                <td className="px-2 sm:px-3 py-2">
                  <div className="flex items-center gap-2">
                    <User className="text-gray-400" size={14} />
                    <a 
                      href={`https://nearblocks.io/address/${account.account_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-blue-600 hover:text-blue-800 truncate max-w-[200px] flex items-center gap-1 hover:underline"
                      title={`View ${account.account_id} on NEAR Explorer`}
                    >
                      <span>{formatAccountId(account.account_id)}</span>
                      <ExternalLink className="text-blue-500" size={10} />
                    </a>
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-right text-xs text-gray-900 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <span>{formatNumber(account.near_balance)}</span>
                    <Coins className="text-blue-500" size={12} />
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-right text-xs text-gray-900 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <span>{formatNumber(account.near_staked)}</span>
                    <Coins className="text-purple-500" size={12} />
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <span>{formatNumber(account.total_value)}</span>
                    <Coins className="text-green-600" size={12} />
                  </div>
                </td>
                <td className="px-1 sm:px-2 py-2 text-center text-xs text-gray-500 whitespace-nowrap hidden sm:table-cell">
                  {formatDate(account.latest_update)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>Showing top {accounts.length} of {total_accounts_found.toLocaleString()} accounts</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="text-blue-500" size={12} />
            <span className="text-blue-600">Balance</span>
            <span>•</span>
            <Coins className="text-purple-500" size={12} />
            <span className="text-purple-600">Staked</span>
            <span>•</span>
            <Coins className="text-green-600" size={12} />
            <span className="text-green-600">Total</span>
          </div>
        </div>
      </div>
      
      {accounts.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No account data found for the specified time period
        </div>
      )}
    </div>
  );
};

export default TopAccountsTable;

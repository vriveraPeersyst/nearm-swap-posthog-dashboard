import { useState, useEffect } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import type { SwapMetrics, AccountValueSummary, TopAccountsResponse } from './types';
import MetricsCard from './components/MetricsCard';
import TradingPairsTable from './components/TradingPairsTable';
import TopSwappersTable from './components/TopSwappersTable';
import AccountValuesCard from './components/AccountValuesCard';
import TopAccountsTable from './components/TopAccountsTable';
import { apiCall } from './utils/api';
import logoSvg from './assets/NEARMobile_Logo.svg';
import './App.css';

function App() {
  const [data, setData] = useState<SwapMetrics | null>(null);
  const [accountValues, setAccountValues] = useState<AccountValueSummary | null>(null);
  const [topAccounts, setTopAccounts] = useState<TopAccountsResponse | null>(null);
  const [nearPriceUSD, setNearPriceUSD] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAccountValues, setIsLoadingAccountValues] = useState(false);
  const [isLoadingTopAccounts, setIsLoadingTopAccounts] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('swapMetrics');
    const savedTimestamp = localStorage.getItem('swapMetricsTimestamp');
    const savedAccountValues = localStorage.getItem('accountValues');
    const savedAccountValuesTimestamp = localStorage.getItem('accountValuesTimestamp');
    const savedTopAccounts = localStorage.getItem('topAccounts');
    const savedTopAccountsTimestamp = localStorage.getItem('topAccountsTimestamp');
    const savedNearPrice = localStorage.getItem('nearPriceUSD');
    const savedNearPriceTimestamp = localStorage.getItem('nearPriceTimestamp');
    
    if (savedData && savedTimestamp) {
      try {
        const parsedData = JSON.parse(savedData);
        const parsedTimestamp = new Date(savedTimestamp);
        setData(parsedData);
        setLastUpdated(parsedTimestamp);
      } catch (error) {
        console.error('Error loading saved data:', error);
        // Clear corrupted data
        localStorage.removeItem('swapMetrics');
        localStorage.removeItem('swapMetricsTimestamp');
      }
    }

    if (savedAccountValues && savedAccountValuesTimestamp) {
      try {
        const parsedAccountValues = JSON.parse(savedAccountValues);
        setAccountValues(parsedAccountValues);
      } catch (error) {
        console.error('Error loading saved account values:', error);
        // Clear corrupted data
        localStorage.removeItem('accountValues');
        localStorage.removeItem('accountValuesTimestamp');
      }
    }

    if (savedTopAccounts && savedTopAccountsTimestamp) {
      try {
        const parsedTopAccounts = JSON.parse(savedTopAccounts);
        setTopAccounts(parsedTopAccounts);
      } catch (error) {
        console.error('Error loading saved top accounts:', error);
        // Clear corrupted data
        localStorage.removeItem('topAccounts');
        localStorage.removeItem('topAccountsTimestamp');
      }
    }

    if (savedNearPrice && savedNearPriceTimestamp) {
      try {
        const price = parseFloat(savedNearPrice);
        const priceTimestamp = new Date(savedNearPriceTimestamp);
        const now = new Date();
        // Use cached price if it's less than 5 minutes old
        if (now.getTime() - priceTimestamp.getTime() < 5 * 60 * 1000) {
          setNearPriceUSD(price);
        } else {
          // Fetch fresh price if cached price is old
          fetchNearPrice();
        }
      } catch (error) {
        console.error('Error loading saved NEAR price:', error);
        fetchNearPrice();
      }
    } else {
      // No cached price, fetch it
      fetchNearPrice();
    }
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall('/api/swap-metrics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newData = await response.json();
      const timestamp = new Date();
      
      // Save to state
      setData(newData);
      setLastUpdated(timestamp);
      
      // Save to localStorage for persistence
      localStorage.setItem('swapMetrics', JSON.stringify(newData));
      localStorage.setItem('swapMetricsTimestamp', timestamp.toISOString());
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccountValues = async () => {
    setIsLoadingAccountValues(true);
    try {
      const response = await apiCall('/api/account-values');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newAccountValues = await response.json();
      const timestamp = new Date();
      
      // Save to state
      setAccountValues(newAccountValues);
      
      // Save to localStorage for persistence
      localStorage.setItem('accountValues', JSON.stringify(newAccountValues));
      localStorage.setItem('accountValuesTimestamp', timestamp.toISOString());
    } catch (error) {
      console.error('Failed to fetch account values:', error);
      // Don't set main error for account values failure
    } finally {
      setIsLoadingAccountValues(false);
    }
  };

  const fetchTopAccounts = async () => {
    setIsLoadingTopAccounts(true);
    try {
      const response = await apiCall('/api/top-accounts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newTopAccounts = await response.json();
      const timestamp = new Date();
      
      // Save to state
      setTopAccounts(newTopAccounts);
      
      // Save to localStorage for persistence
      localStorage.setItem('topAccounts', JSON.stringify(newTopAccounts));
      localStorage.setItem('topAccountsTimestamp', timestamp.toISOString());
    } catch (error) {
      console.error('Failed to fetch top accounts:', error);
      // Don't set main error for top accounts failure
    } finally {
      setIsLoadingTopAccounts(false);
    }
  };

  const fetchNearPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const priceData = await response.json();
      const price = priceData?.near?.usd;
      if (price) {
        setNearPriceUSD(price);
        localStorage.setItem('nearPriceUSD', price.toString());
        localStorage.setItem('nearPriceTimestamp', new Date().toISOString());
      }
    } catch (error) {
      console.error('Failed to fetch NEAR price:', error);
      // Don't fail the whole app if price fetch fails
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchData(), fetchAccountValues(), fetchTopAccounts(), fetchNearPrice()]);
  };

  const clearCache = () => {
    localStorage.removeItem('swapMetrics');
    localStorage.removeItem('swapMetricsTimestamp');
    localStorage.removeItem('accountValues');
    localStorage.removeItem('accountValuesTimestamp');
    localStorage.removeItem('topAccounts');
    localStorage.removeItem('topAccountsTimestamp');
    setData(null);
    setAccountValues(null);
    setTopAccounts(null);
    setError(null);
  };

  // Load saved data from localStorage on component mount
  // New data is only fetched when user clicks Load/Refresh button

  if (!data && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:h-16 sm:py-0">
              <div className="flex items-center gap-3">
                <img src={logoSvg} alt="NEARMobile Logo" className="h-8 w-8 flex-shrink-0" />
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900">NEARMobile PostHog Analytics</h1>
                  <p className="text-xs sm:text-sm text-gray-500">PostHog Data Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <button
                  onClick={refreshData}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Load Data</span>
                  <span className="sm:hidden">Load</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Empty State */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-16">
            <Database className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">No Data Loaded</h2>
            <p className="text-sm sm:text-base text-gray-500 mb-6 px-4">Click "Load Data" to fetch the latest swap metrics from PostHog</p>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto text-sm sm:text-base"
            >
              <Database className="h-4 w-4 sm:h-5 sm:w-5" />
              Load Swap Metrics
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Fetching swap metrics from PostHog...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:h-16 sm:py-0">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="NEARMobile Logo" className="h-8 w-8 flex-shrink-0" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">NEARMobile PostHog Analytics</h1>
                <p className="text-xs sm:text-sm text-gray-500">PostHog Data Dashboard</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {error && <span className="text-red-500 ml-2">(Using fallback data)</span>}
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={clearCache}
                  className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition-colors"
                  title="Clear cached data"
                >
                  Clear Cache
                </button>
                <button
                  onClick={refreshData}
                  disabled={isLoading || isLoadingAccountValues || isLoadingTopAccounts}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${(isLoading || isLoadingAccountValues || isLoadingTopAccounts) ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isLoading || isLoadingAccountValues || isLoadingTopAccounts ? 'Refreshing...' : 'Refresh Data'}</span>
                  <span className="sm:hidden">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <MetricsCard 
              title="All Time" 
              metrics={data.allTime}
            />
            <MetricsCard 
              title="Last 24 Hours" 
              metrics={data.last24h}
              showGrowth={true}
            />
            <MetricsCard 
              title="Last 7 Days" 
              metrics={data.last7d}
              showGrowth={true}
            />
            <MetricsCard 
              title="Last 30 Days" 
              metrics={data.last30d}
              showGrowth={true}
            />
          </div>

          {/* Account Values */}
          {accountValues && <AccountValuesCard data={accountValues} nearPriceUSD={nearPriceUSD || undefined} />}
          {isLoadingAccountValues && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading account values...</span>
              </div>
            </div>
          )}

          {/* Top Accounts */}
          {topAccounts && <TopAccountsTable data={topAccounts} />}
          {isLoadingTopAccounts && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading top accounts...</span>
              </div>
            </div>
          )}

          {/* Trading Pairs Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <TradingPairsTable 
              title="Top Trading Pairs (All Time)"
              pairs={data.topTradingPairs.allTime.slice(0, 30)}
              showLast24h={true}
            />
            
            <TradingPairsTable 
              title="Most Active Pairs (Last 24h)"
              pairs={data.topTradingPairs.last24h.slice(0, 30)}
              showLast24h={true}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <TradingPairsTable 
              title="Most Active Pairs (Last 7 Days)"
              pairs={(data.topTradingPairs.last7d ?? []).slice(0, 30)}
              periodLabel="7d"
            />
            
            <TradingPairsTable 
              title="Most Active Pairs (Last 30 Days)"
              pairs={(data.topTradingPairs.last30d ?? []).slice(0, 30)}
              periodLabel="30d"
            />
          </div>

          {/* Fee Swaps Section - Excludes Deposits/Withdraws */}
          {data.feeSwaps && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-purple-800 mb-4">💸 Fee-Generating Swaps</h2>
                <p className="text-sm text-purple-600 mb-4">
                  Excludes deposits/withdrawals (native ↔ intent token conversions like NEAR ↔ iNEAR, NPRO ↔ iNPRO)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-xs text-gray-500 uppercase">All Time</div>
                    <div className="text-lg font-bold text-purple-700">{data.feeSwaps.allTime.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">${(data.feeSwaps.allTime.totalVolumeUSD / 1000000).toFixed(2)}M</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-xs text-gray-500 uppercase">Last 24h</div>
                    <div className="text-lg font-bold text-purple-700">{data.feeSwaps.last24h.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">${data.feeSwaps.last24h.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-xs text-gray-500 uppercase">Last 7 Days</div>
                    <div className="text-lg font-bold text-purple-700">{data.feeSwaps.last7d.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">${data.feeSwaps.last7d.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-xs text-gray-500 uppercase">Last 30 Days</div>
                    <div className="text-lg font-bold text-purple-700">{data.feeSwaps.last30d.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">${data.feeSwaps.last30d.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <TradingPairsTable 
                  title="Top Fee Swaps (All Time)"
                  pairs={(data.feeSwaps.topPairs.allTime ?? []).slice(0, 30)}
                  showLast24h={true}
                />
                
                <TradingPairsTable 
                  title="Top Fee Swaps (Last 24h)"
                  pairs={(data.feeSwaps.topPairs.last24h ?? []).slice(0, 30)}
                  showLast24h={true}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <TradingPairsTable 
                  title="Top Fee Swaps (Last 7 Days)"
                  pairs={(data.feeSwaps.topPairs.last7d ?? []).slice(0, 30)}
                  periodLabel="7d"
                />
                
                <TradingPairsTable 
                  title="Top Fee Swaps (Last 30 Days)"
                  pairs={(data.feeSwaps.topPairs.last30d ?? []).slice(0, 30)}
                  periodLabel="30d"
                />
              </div>
            </>
          )}

          {/* Top Swappers Section */}
          {data.topSwappers && (
            <>
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-800 mb-2">👥 Top Swappers</h2>
                <p className="text-sm text-green-600">
                  Total unique accounts: <span className="font-bold">{data.topSwappers.totalUniqueAccounts.toLocaleString()}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <TopSwappersTable 
                  title="Top Swappers by Volume (All Time)"
                  swappers={(data.topSwappers.byVolume ?? []).slice(0, 30)}
                  sortBy="volume"
                />
                
                <TopSwappersTable 
                  title="Top Swappers by Fee Volume"
                  swappers={(data.topSwappers.byFeeVolume ?? []).slice(0, 30)}
                  sortBy="feeVolume"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <TopSwappersTable 
                  title="Top Swappers (Last 24h)"
                  swappers={(data.topSwappers.last24h ?? []).slice(0, 30)}
                  periodLabel="24h"
                />
                
                <TopSwappersTable 
                  title="Top Swappers (Last 7 Days)"
                  swappers={(data.topSwappers.last7d ?? []).slice(0, 30)}
                  periodLabel="7d"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                <TopSwappersTable 
                  title="Top Swappers (Last 30 Days)"
                  swappers={(data.topSwappers.last30d ?? []).slice(0, 30)}
                  periodLabel="30d"
                />
                
                <TopSwappersTable 
                  title="Top Swappers by Swap Count"
                  swappers={(data.topSwappers.byCount ?? []).slice(0, 30)}
                  sortBy="count"
                />
              </div>
            </>
          )}

          {/* Diagnostics */}
          {(data.notes.unmappedIntentTokenIds.length > 0 || 
            data.notes.priceIdMissing.length > 0 || 
            data.notes.badAmounts > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">Data Quality Notes</h3>
              <div className="space-y-2 text-sm text-yellow-700">
                {data.notes.badAmounts > 0 && (
                  <p>• {data.notes.badAmounts} events with invalid amounts were skipped</p>
                )}
                {data.notes.unmappedIntentTokenIds.length > 0 && (
                  <p>• {data.notes.unmappedIntentTokenIds.length} unmapped intent token IDs found</p>
                )}
                {data.notes.priceIdMissing.length > 0 && (
                  <p>• {data.notes.priceIdMissing.length} price IDs are missing</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Database, RefreshCw, BarChart3, Coins, DollarSign } from 'lucide-react';
import type { SwapMetrics, ValidatorStats, NPROSummary, FeeLeadersResponse } from './types';
import MetricsCard from './components/MetricsCard';
import TradingPairsTable from './components/TradingPairsTable';
import TopSwappersTable from './components/TopSwappersTable';
import ValidatorStatsCard from './components/ValidatorStatsCard';
import NPROStatsTab from './components/NPROStatsTab';
import FeeLeadersCard from './components/FeeLeadersCard';
import { apiCall, fetchNPROSummary, fetchFeeLeaders } from './utils/api';
import logoSvg from './assets/NEARMobile_Logo.svg';
import './App.css';

type TabType = 'swaps' | 'npro' | 'fees';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('swaps');
  const [data, setData] = useState<SwapMetrics | null>(null);
  const [validatorStats, setValidatorStats] = useState<ValidatorStats | null>(null);
  const [nproData, setNproData] = useState<NPROSummary | null>(null);
  const [nearPriceUSD, setNearPriceUSD] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingValidatorStats, setIsLoadingValidatorStats] = useState(false);
  const [isLoadingNpro, setIsLoadingNpro] = useState(false);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [feeLeadersData, setFeeLeadersData] = useState<FeeLeadersResponse | null>(null);
  const [feeLeadersError, setFeeLeadersError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [feeSwapsPeriod, setFeeSwapsPeriod] = useState<'allTime' | '24h' | '7d' | '30d'>('allTime');
  const [tradingPairsPeriod, setTradingPairsPeriod] = useState<'allTime' | '24h' | '7d' | '30d'>('allTime');
  const [swappersPeriod, setSwappersPeriod] = useState<'allTime' | '24h' | '7d' | '30d' | 'byCount' | 'byFeeVolume'>('allTime');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('swapMetrics');
    const savedTimestamp = localStorage.getItem('swapMetricsTimestamp');
    const savedValidatorStats = localStorage.getItem('validatorStats');
    const savedValidatorStatsTimestamp = localStorage.getItem('validatorStatsTimestamp');
    const savedNearPrice = localStorage.getItem('nearPriceUSD');
    const savedNearPriceTimestamp = localStorage.getItem('nearPriceTimestamp');
    const savedNproData = localStorage.getItem('nproData');
    const savedNproTimestamp = localStorage.getItem('nproDataTimestamp');
    
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

    if (savedValidatorStats && savedValidatorStatsTimestamp) {
      try {
        const parsedValidatorStats = JSON.parse(savedValidatorStats);
        setValidatorStats(parsedValidatorStats);
      } catch (error) {
        console.error('Error loading saved validator stats:', error);
        // Clear corrupted data
        localStorage.removeItem('validatorStats');
        localStorage.removeItem('validatorStatsTimestamp');
      }
    }

    if (savedNproData && savedNproTimestamp) {
      try {
        const parsedNproData = JSON.parse(savedNproData);
        setNproData(parsedNproData);
      } catch (error) {
        console.error('Error loading saved NPRO data:', error);
        localStorage.removeItem('nproData');
        localStorage.removeItem('nproDataTimestamp');
      }
    }

    // Load fee leaders from localStorage
    const savedFeeLeaders = localStorage.getItem('feeLeadersData');
    const savedFeeLeadersTimestamp = localStorage.getItem('feeLeadersDataTimestamp');
    if (savedFeeLeaders && savedFeeLeadersTimestamp) {
      try {
        const parsedFeeLeaders = JSON.parse(savedFeeLeaders);
        setFeeLeadersData(parsedFeeLeaders);
      } catch (error) {
        console.error('Error loading saved fee leaders data:', error);
        localStorage.removeItem('feeLeadersData');
        localStorage.removeItem('feeLeadersDataTimestamp');
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

  const fetchValidatorStats = async () => {
    setIsLoadingValidatorStats(true);
    try {
      const response = await apiCall('/api/validator-stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newValidatorStats = await response.json();
      const timestamp = new Date();
      
      // Save to state
      setValidatorStats(newValidatorStats);
      
      // Save to localStorage for persistence
      localStorage.setItem('validatorStats', JSON.stringify(newValidatorStats));
      localStorage.setItem('validatorStatsTimestamp', timestamp.toISOString());
    } catch (error) {
      console.error('Failed to fetch validator stats:', error);
      // Don't set main error for validator stats failure
    } finally {
      setIsLoadingValidatorStats(false);
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

  const fetchNproData = async () => {
    setIsLoadingNpro(true);
    try {
      const newNproData = await fetchNPROSummary();
      const timestamp = new Date();
      
      setNproData(newNproData);
      
      localStorage.setItem('nproData', JSON.stringify(newNproData));
      localStorage.setItem('nproDataTimestamp', timestamp.toISOString());
    } catch (error) {
      console.error('Failed to fetch NPRO data:', error);
    } finally {
      setIsLoadingNpro(false);
    }
  };

  const fetchFeeLeadersData = async () => {
    setIsLoadingFees(true);
    setFeeLeadersError(null);
    try {
      const newFeeLeaders = await fetchFeeLeaders();
      const timestamp = new Date();
      
      setFeeLeadersData(newFeeLeaders);
      
      localStorage.setItem('feeLeadersData', JSON.stringify(newFeeLeaders));
      localStorage.setItem('feeLeadersDataTimestamp', timestamp.toISOString());
    } catch (error: any) {
      console.error('Failed to fetch fee leaders:', error);
      setFeeLeadersError(error?.message || 'Failed to fetch fee leaders');
    } finally {
      setIsLoadingFees(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchData(), fetchValidatorStats(), fetchNearPrice(), fetchNproData(), fetchFeeLeadersData()]);
  };

  const clearCache = () => {
    localStorage.removeItem('swapMetrics');
    localStorage.removeItem('swapMetricsTimestamp');
    localStorage.removeItem('validatorStats');
    localStorage.removeItem('validatorStatsTimestamp');
    localStorage.removeItem('nproData');
    localStorage.removeItem('nproDataTimestamp');
    localStorage.removeItem('feeLeadersData');
    localStorage.removeItem('feeLeadersDataTimestamp');
    setData(null);
    setValidatorStats(null);
    setNproData(null);
    setFeeLeadersData(null);
    setFeeLeadersError(null);
    setError(null);
  };

  // Load saved data from localStorage on component mount
  // New data is only fetched when user clicks Load/Refresh button

  // Tab navigation component
  const TabNavigation = () => (
    <div className="flex gap-2 border-b border-gray-200 pb-0">
      <button
        onClick={() => setActiveTab('swaps')}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
          activeTab === 'swaps'
            ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <BarChart3 className="h-4 w-4" />
        Swap Metrics
      </button>
      <button
        onClick={() => setActiveTab('fees')}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
          activeTab === 'fees'
            ? 'bg-white text-green-600 border border-gray-200 border-b-white -mb-px'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <DollarSign className="h-4 w-4" />
        Earned fees
      </button>
      <button
        onClick={() => setActiveTab('npro')}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
          activeTab === 'npro'
            ? 'bg-white text-purple-600 border border-gray-200 border-b-white -mb-px'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Coins className="h-4 w-4" />
        NPRO Stats
      </button>
    </div>
  );

  // Check if there's any data loaded based on active tab
  const hasDataForCurrentTab = activeTab === 'swaps' ? !!data : activeTab === 'npro' ? !!nproData : activeTab === 'fees' ? !!feeLeadersData : true;
  const isLoadingCurrentTab = activeTab === 'swaps' ? isLoading : activeTab === 'npro' ? isLoadingNpro : activeTab === 'fees' ? isLoadingFees : false;

  if (!hasDataForCurrentTab && !isLoadingCurrentTab) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:h-16 sm:py-0">
              <div className="flex items-center gap-3">
                <img src={logoSvg} alt="NEARMobile Logo" className="h-8 w-8 flex-shrink-0" />
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900">NEARMobile Analytics</h1>
                  <p className="text-xs sm:text-sm text-gray-500">Dashboard</p>
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

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <TabNavigation />
        </div>

        {/* Main Content - Empty State */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-16">
            {activeTab === 'swaps' ? (
              <>
                <Database className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">No Swap Data Loaded</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 px-4">Click "Load Data" to fetch the latest swap metrics from PostHog</p>
              </>
            ) : activeTab === 'fees' ? (
              <>
                <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">No Fee Data Loaded</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 px-4">Click "Load Data" to fetch the latest earned fees data</p>
              </>
            ) : (
              <>
                <Coins className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-600 mb-2">No NPRO Data Loaded</h2>
                <p className="text-sm sm:text-base text-gray-500 mb-6 px-4">Click "Load Data" to fetch the latest NPRO stats</p>
              </>
            )}
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto text-sm sm:text-base"
            >
              <Database className="h-4 w-4 sm:h-5 sm:w-5" />
              Load Data
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoadingCurrentTab && !hasDataForCurrentTab) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {activeTab === 'swaps' ? 'Fetching swap metrics from PostHog...' : activeTab === 'npro' ? 'Fetching NPRO stats...' : 'Fetching earned fees data...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error && !data && activeTab === 'swaps') {
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:h-16 sm:py-0">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="NEARMobile Logo" className="h-8 w-8 flex-shrink-0" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">NEARMobile Analytics</h1>
                <p className="text-xs sm:text-sm text-gray-500">Dashboard</p>
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
                  disabled={isLoading || isLoadingValidatorStats || isLoadingNpro}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${(isLoading || isLoadingValidatorStats || isLoadingNpro) ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isLoading || isLoadingValidatorStats || isLoadingNpro ? 'Refreshing...' : 'Refresh Data'}</span>
                  <span className="sm:hidden">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 bg-gray-100">
        <TabNavigation />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'npro' ? (
          <NPROStatsTab 
            data={nproData} 
            isLoading={isLoadingNpro} 
            onRefresh={fetchNproData} 
          />
        ) : activeTab === 'fees' ? (
          <FeeLeadersCard 
            data={feeLeadersData}
            isLoading={isLoadingFees}
            error={feeLeadersError}
            onRefresh={fetchFeeLeadersData}
          />
        ) : data && (
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

          {/* Validator Stats */}
          {validatorStats && <ValidatorStatsCard data={validatorStats} nearPriceUSD={nearPriceUSD || undefined} />}
          {isLoadingValidatorStats && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Loading validator stats...</span>
              </div>
            </div>
          )}

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

              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Top Fee Swap Pairs</h3>
                  <div className="flex gap-2">
                    {(['allTime', '24h', '7d', '30d'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setFeeSwapsPeriod(period)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          feeSwapsPeriod === period
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {period === 'allTime' ? 'All Time' : period === '24h' ? '24h' : period === '7d' ? '7 Days' : '30 Days'}
                      </button>
                    ))}
                  </div>
                </div>
                <TradingPairsTable
                  title=""
                  pairs={(
                    feeSwapsPeriod === 'allTime' ? data.feeSwaps.topPairs.allTime :
                    feeSwapsPeriod === '24h' ? data.feeSwaps.topPairs.last24h :
                    feeSwapsPeriod === '7d' ? data.feeSwaps.topPairs.last7d :
                    data.feeSwaps.topPairs.last30d
                  )?.slice(0, 10) ?? []}
                  showLast24h={feeSwapsPeriod === 'allTime' || feeSwapsPeriod === '24h'}
                  periodLabel={feeSwapsPeriod === '7d' ? '7d' : feeSwapsPeriod === '30d' ? '30d' : undefined}
                  hideHeader={true}
                />
              </div>
            </>
          )}

          {/* Trading Pairs Table */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Trading Pairs (Including Deposits/Withdrawals)</h3>
              <div className="flex gap-2">
                {(['allTime', '24h', '7d', '30d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTradingPairsPeriod(period)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      tradingPairsPeriod === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {period === 'allTime' ? 'All Time' : period === '24h' ? '24h' : period === '7d' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>
            </div>
            <TradingPairsTable
              title=""
              pairs={(
                tradingPairsPeriod === 'allTime' ? data.topTradingPairs.allTime :
                tradingPairsPeriod === '24h' ? data.topTradingPairs.last24h :
                tradingPairsPeriod === '7d' ? data.topTradingPairs.last7d :
                data.topTradingPairs.last30d
              )?.slice(0, 10) ?? []}
              showLast24h={tradingPairsPeriod === 'allTime' || tradingPairsPeriod === '24h'}
              periodLabel={tradingPairsPeriod === '7d' ? '7d' : tradingPairsPeriod === '30d' ? '30d' : undefined}
              hideHeader={true}
            />
          </div>

          {/* Top Swappers Section */}
          {data.topSwappers && (
            <>
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-green-800 mb-2">👥 Top Swappers</h2>
                <p className="text-sm text-green-600">
                  Total unique accounts: <span className="font-bold">{data.topSwappers.totalUniqueAccounts.toLocaleString()}</span>
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Top Swappers</h3>
                  <div className="flex flex-wrap gap-2">
                    {(['allTime', '24h', '7d', '30d', 'byCount', 'byFeeVolume'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setSwappersPeriod(period)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          swappersPeriod === period
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {period === 'allTime' ? 'All Time' : period === '24h' ? '24h' : period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === 'byCount' ? 'By Count' : 'By Fee Vol'}
                      </button>
                    ))}
                  </div>
                </div>
                <TopSwappersTable
                  title=""
                  swappers={(
                    swappersPeriod === 'allTime' ? data.topSwappers.byVolume :
                    swappersPeriod === '24h' ? data.topSwappers.last24h :
                    swappersPeriod === '7d' ? data.topSwappers.last7d :
                    swappersPeriod === '30d' ? data.topSwappers.last30d :
                    swappersPeriod === 'byCount' ? data.topSwappers.byCount :
                    data.topSwappers.byFeeVolume
                  )?.slice(0, 10) ?? []}
                  sortBy={swappersPeriod === 'byCount' ? 'count' : swappersPeriod === 'byFeeVolume' ? 'feeVolume' : 'volume'}
                  periodLabel={swappersPeriod === '24h' ? '24h' : swappersPeriod === '7d' ? '7d' : swappersPeriod === '30d' ? '30d' : undefined}
                  hideHeader={true}
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
              <div className="space-y-3 text-sm text-yellow-700">
                {data.notes.badAmounts > 0 && (
                  <p>• {data.notes.badAmounts} events with invalid amounts were skipped</p>
                )}
                {data.notes.unmappedIntentTokenIds.length > 0 && (
                  <div>
                    <p className="font-medium">• {data.notes.unmappedIntentTokenIds.length} unmapped intent token IDs:</p>
                    <ul className="ml-4 mt-1 space-y-1 font-mono text-xs">
                      {data.notes.unmappedIntentTokenIds.map((id, idx) => (
                        <li key={idx} className="text-yellow-600">{id}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.notes.priceIdMissing.length > 0 && (
                  <div>
                    <p className="font-medium">• {data.notes.priceIdMissing.length} price IDs missing:</p>
                    <ul className="ml-4 mt-1 space-y-1 font-mono text-xs">
                      {data.notes.priceIdMissing.map((id, idx) => (
                        <li key={idx} className="text-yellow-600">{id}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )}
      </main>
    </div>
  );
}

export default App;

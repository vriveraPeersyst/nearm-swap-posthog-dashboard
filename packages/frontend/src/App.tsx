import { useState, useEffect } from 'react';
import { SwapIcon, UsersIcon, DatabaseIcon, ArrowsClockwiseIcon, CoinsIcon, CurrencyDollarIcon, StackSimpleIcon } from './components/icons';
import type { SwapMetrics, ValidatorStats, NPROSummary, FeeLeadersResponse, TVLSummary } from './types';
import MetricsCard from './components/MetricsCard';
import TradingPairsTable from './components/TradingPairsTable';
import TopSwappersTable from './components/TopSwappersTable';
import ValidatorStatsCard from './components/ValidatorStatsCard';
import NPROStatsTab from './components/NPROStatsTab';
import FeeLeadersCard from './components/FeeLeadersCard';
import TVLTab from './components/TVLTab';
import { apiCall, fetchNPROSummary, fetchFeeLeaders, fetchTVLSummary } from './utils/api';
import logoSvg from './assets/NEARMobile_Logo.svg';
import './App.css';

type TabType = 'swaps' | 'npro' | 'fees' | 'tvl';

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
  const [tvlData, setTvlData] = useState<TVLSummary | null>(null);
  const [isLoadingTvl, setIsLoadingTvl] = useState(false);
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

    // Load TVL data from localStorage
    const savedTvl = localStorage.getItem('tvlData');
    const savedTvlTimestamp = localStorage.getItem('tvlDataTimestamp');
    if (savedTvl && savedTvlTimestamp) {
      try {
        const parsedTvl = JSON.parse(savedTvl);
        setTvlData(parsedTvl);
      } catch (error) {
        console.error('Error loading saved TVL data:', error);
        localStorage.removeItem('tvlData');
        localStorage.removeItem('tvlDataTimestamp');
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

  const fetchTvlData = async () => {
    setIsLoadingTvl(true);
    try {
      const newTvlData = await fetchTVLSummary();
      const timestamp = new Date();
      
      setTvlData(newTvlData);
      
      localStorage.setItem('tvlData', JSON.stringify(newTvlData));
      localStorage.setItem('tvlDataTimestamp', timestamp.toISOString());
    } catch (error) {
      console.error('Failed to fetch TVL data:', error);
    } finally {
      setIsLoadingTvl(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchData(), fetchValidatorStats(), fetchNearPrice(), fetchNproData(), fetchFeeLeadersData(), fetchTvlData()]);
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
    localStorage.removeItem('tvlData');
    localStorage.removeItem('tvlDataTimestamp');
    setData(null);
    setValidatorStats(null);
    setNproData(null);
    setFeeLeadersData(null);
    setFeeLeadersError(null);
    setTvlData(null);
    setError(null);
  };

  // Load saved data from localStorage on component mount
  // New data is only fetched when user clicks Load/Refresh button

  // Tab navigation component
  const tabs: { key: TabType; label: string; shortLabel?: string }[] = [
    { key: 'swaps', label: 'Swap Metrics', shortLabel: 'Swaps' },
    { key: 'fees', label: 'Earned Fees', shortLabel: 'Fees' },
    { key: 'npro', label: 'NPRO Stats' },
    { key: 'tvl', label: 'TVL', shortLabel: 'TVL' },
  ];

  const TabNavigation = () => (
    <div className="flex items-center border-b border-nm-border bg-white overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`flex-1 flex justify-center items-center h-[60px] text-base tracking-tight transition-colors ${
            activeTab === tab.key
              ? 'font-medium text-nm-text border-b-2 border-nm-accent'
              : 'font-normal text-nm-muted hover:text-nm-text'
          }`}
        >
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
        </button>
      ))}
    </div>
  );

  // Check if there's any data loaded based on active tab
  const hasDataForCurrentTab = activeTab === 'swaps' ? !!data : activeTab === 'npro' ? !!nproData : activeTab === 'fees' ? !!feeLeadersData : activeTab === 'tvl' ? !!tvlData : true;
  const isLoadingCurrentTab = activeTab === 'swaps' ? isLoading : activeTab === 'npro' ? isLoadingNpro : activeTab === 'fees' ? isLoadingFees : activeTab === 'tvl' ? isLoadingTvl : false;

  if (!hasDataForCurrentTab && !isLoadingCurrentTab) {
    return (
      <div className="min-h-screen bg-nm-bg font-sf">
        {/* Header */}
        <header className="bg-nm-header shadow-nm border-b border-nm-border">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:h-16 sm:py-0">
              <div className="flex items-center gap-3">
                <img src={logoSvg} alt="NEARMobile Logo" className="h-8 w-8 flex-shrink-0" />
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-nm-text">NEARMobile Analytics</h1>
                  <p className="text-xs sm:text-sm text-nm-muted">Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <button
                  onClick={refreshData}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-nm-cta text-white rounded-nm-sm hover:bg-nm-ctaHover shadow-nm-button transition-colors text-sm sm:text-base"
                >
                  <DatabaseIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Load Data</span>
                  <span className="sm:hidden">Load</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <TabNavigation />
        </div>

        {/* Main Content - Empty State */}
        <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="text-center py-8 sm:py-16">
            {activeTab === 'swaps' ? (
              <>
                <DatabaseIcon className="h-12 w-12 sm:h-16 sm:w-16 text-nm-muted mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-nm-muted mb-2">No Swap Data Loaded</h2>
                <p className="text-sm sm:text-base text-nm-muted mb-6 px-4">Click "Load Data" to fetch the latest swap metrics from PostHog</p>
              </>
            ) : activeTab === 'fees' ? (
              <>
                <CurrencyDollarIcon className="h-12 w-12 sm:h-16 sm:w-16 text-nm-muted mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-nm-muted mb-2">No Fee Data Loaded</h2>
                <p className="text-sm sm:text-base text-nm-muted mb-6 px-4">Click "Load Data" to fetch the latest earned fees data</p>
              </>
            ) : activeTab === 'tvl' ? (
              <>
                <StackSimpleIcon className="h-12 w-12 sm:h-16 sm:w-16 text-nm-muted mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-nm-muted mb-2">No TVL Data Loaded</h2>
                <p className="text-sm sm:text-base text-nm-muted mb-6 px-4">Click "Load Data" to fetch the latest NEARMobile TVL data</p>
              </>
            ) : (
              <>
                <CoinsIcon className="h-12 w-12 sm:h-16 sm:w-16 text-nm-muted mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-nm-muted mb-2">No NPRO Data Loaded</h2>
                <p className="text-sm sm:text-base text-nm-muted mb-6 px-4">Click "Load Data" to fetch the latest NPRO stats</p>
              </>
            )}
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-nm-cta text-white rounded-nm-sm hover:bg-nm-ctaHover shadow-nm-button transition-colors mx-auto text-sm sm:text-base"
            >
              <DatabaseIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Load Data
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoadingCurrentTab && !hasDataForCurrentTab) {
    return (
      <div className="min-h-screen bg-nm-bg font-sf flex items-center justify-center">
        <div className="text-center">
          <ArrowsClockwiseIcon className="h-8 w-8 animate-spin text-nm-accent mx-auto mb-4" />
          <p className="text-nm-text">
            {activeTab === 'swaps' ? 'Fetching swap metrics from PostHog...' : activeTab === 'npro' ? 'Fetching NPRO stats...' : 'Fetching earned fees data...'}
          </p>
          <p className="text-sm text-nm-muted mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error && !data && activeTab === 'swaps') {
    return (
      <div className="min-h-screen bg-nm-bg font-sf flex items-center justify-center">
        <div className="text-center">
          <p className="text-nm-error mb-4">Error: {error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-nm-cta text-white rounded-nm-sm hover:bg-nm-ctaHover shadow-nm-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nm-bg font-sf">
      {/* Header */}
      <header className="bg-nm-header shadow-nm border-b border-nm-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:h-16 sm:py-0">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="NEARMobile Logo" className="h-8 w-8 flex-shrink-0" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-nm-text">NEARMobile Analytics</h1>
                <p className="text-xs sm:text-sm text-nm-muted">Dashboard</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-nm-muted order-2 sm:order-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {error && <span className="text-nm-error ml-2">(Using fallback data)</span>}
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={clearCache}
                  className="text-xs px-2 py-1 bg-nm-chip text-nm-muted rounded-nm-sm hover:bg-nm-border transition-colors"
                  title="Clear cached data"
                >
                  Clear Cache
                </button>
                <button
                  onClick={refreshData}
                  disabled={isLoading || isLoadingValidatorStats || isLoadingNpro}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-nm-cta text-white rounded-nm-sm hover:bg-nm-ctaHover shadow-nm-button disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <ArrowsClockwiseIcon className={`h-4 w-4 ${(isLoading || isLoadingValidatorStats || isLoadingNpro) ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isLoading || isLoadingValidatorStats || isLoadingNpro ? 'Refreshing...' : 'Refresh Data'}</span>
                  <span className="sm:hidden">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 pt-4 bg-nm-bg">
        <TabNavigation />
      </div>

      {/* Main Content */}
      <main className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
        ) : activeTab === 'tvl' ? (
          <TVLTab
            data={tvlData}
            swapData={data}
            isLoading={isLoadingTvl}
            onRefresh={fetchTvlData}
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
            <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-6">
              <div className="flex items-center justify-center">
                <ArrowsClockwiseIcon className="h-6 w-6 animate-spin text-nm-accent mr-2" />
                <span className="text-nm-muted">Loading validator stats...</span>
              </div>
            </div>
          )}

          {/* Fee Swaps Section - Excludes Deposits/Withdraws */}
          {data.feeSwaps && (
            <>
              <div className="bg-nm-surface-grad border border-nm-border rounded-nm p-6 shadow-nm">
                <h2 className="text-xl font-bold text-nm-text mb-4 flex items-center gap-2"><SwapIcon className="h-5 w-5 text-nm-accent" /> Fee-Generating Swaps</h2>
                <p className="text-sm text-nm-muted mb-4">
                  Excludes deposits/withdrawals (native ↔ intent token conversions like NEAR ↔ iNEAR, NPRO ↔ iNPRO)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm">
                    <div className="text-xs text-nm-muted uppercase">All Time</div>
                    <div className="text-lg font-bold text-nm-accent">{data.feeSwaps.allTime.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-nm-muted">${(data.feeSwaps.allTime.totalVolumeUSD / 1000000).toFixed(2)}M</div>
                  </div>
                  <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm">
                    <div className="text-xs text-nm-muted uppercase">Last 24h</div>
                    <div className="text-lg font-bold text-nm-accent">{data.feeSwaps.last24h.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-nm-muted">${data.feeSwaps.last24h.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm">
                    <div className="text-xs text-nm-muted uppercase">Last 7 Days</div>
                    <div className="text-lg font-bold text-nm-accent">{data.feeSwaps.last7d.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-nm-muted">${data.feeSwaps.last7d.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="bg-nm-card rounded-nm-sm p-4 shadow-nm">
                    <div className="text-xs text-nm-muted uppercase">Last 30 Days</div>
                    <div className="text-lg font-bold text-nm-accent">{data.feeSwaps.last30d.totalSwaps.toLocaleString()}</div>
                    <div className="text-sm text-nm-muted">${data.feeSwaps.last30d.totalVolumeUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
              </div>

              <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-nm-text">Top Fee Swap Pairs</h3>
                  <div className="inline-flex bg-nm-border rounded-full p-1">
                    {(['allTime', '24h', '7d', '30d'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setFeeSwapsPeriod(period)}
                        className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                          feeSwapsPeriod === period
                            ? 'bg-white font-medium text-nm-text shadow-nm'
                            : 'font-normal text-nm-text hover:text-nm-text/80'
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
          <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-nm-text">Trading Pairs (Including Deposits/Withdrawals)</h3>
              <div className="inline-flex bg-nm-border rounded-full p-1">
                {(['allTime', '24h', '7d', '30d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTradingPairsPeriod(period)}
                    className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                      tradingPairsPeriod === period
                        ? 'bg-white font-medium text-nm-text shadow-nm'
                        : 'font-normal text-nm-text hover:text-nm-text/80'
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
              <div className="bg-nm-surface-grad border border-nm-border rounded-nm p-6 shadow-nm">
                <h2 className="text-xl font-bold text-nm-text mb-2 flex items-center gap-2"><UsersIcon className="h-5 w-5 text-nm-accent" /> Top Swappers</h2>
                <p className="text-sm text-nm-muted">
                  Total unique accounts: <span className="font-bold text-nm-accent">{data.topSwappers.totalUniqueAccounts.toLocaleString()}</span>
                </p>
              </div>

              <div className="bg-nm-card rounded-nm shadow-nm border border-nm-border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-nm-text flex items-center gap-2"><UsersIcon className="h-5 w-5 text-nm-accent" /> Top Swappers</h3>
                  <div className="inline-flex flex-wrap bg-nm-border rounded-full p-1">
                    {(['allTime', '24h', '7d', '30d', 'byCount', 'byFeeVolume'] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setSwappersPeriod(period)}
                        className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                          swappersPeriod === period
                            ? 'bg-white font-medium text-nm-text shadow-nm'
                            : 'font-normal text-nm-text hover:text-nm-text/80'
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
            <div className="bg-nm-card border border-nm-warning/30 rounded-nm p-6 shadow-nm">
              <h3 className="text-lg font-semibold text-nm-warning mb-4">Data Quality Notes</h3>
              <div className="space-y-3 text-sm text-nm-muted">
                {data.notes.badAmounts > 0 && (
                  <p>• {data.notes.badAmounts} events with invalid amounts were skipped</p>
                )}
                {data.notes.unmappedIntentTokenIds.length > 0 && (
                  <div>
                    <p className="font-medium">• {data.notes.unmappedIntentTokenIds.length} unmapped intent token IDs:</p>
                    <ul className="ml-4 mt-1 space-y-1 font-sf-mono text-xs">
                      {data.notes.unmappedIntentTokenIds.map((id, idx) => (
                        <li key={idx} className="text-nm-muted">{id}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.notes.priceIdMissing.length > 0 && (
                  <div>
                    <p className="font-medium">• {data.notes.priceIdMissing.length} price IDs missing:</p>
                    <ul className="ml-4 mt-1 space-y-1 font-sf-mono text-xs">
                      {data.notes.priceIdMissing.map((id, idx) => (
                        <li key={idx} className="text-nm-muted">{id}</li>
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

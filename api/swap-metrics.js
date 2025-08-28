// Standalone API function for Vercel deployment
// This runs independently of the TypeScript build

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For now, return mock data to verify the endpoint works
    // TODO: Replace with actual PostHog data fetching logic
    const mockData = {
      sideValued: 'in',
      allTime: {
        totalSwaps: 1000,
        totalVolumeUSD: 50000
      },
      last24h: {
        totalSwaps: 50,
        totalVolumeUSD: 2500,
        swapGrowthPercent: 10.5,
        volumeGrowthPercent: 15.2
      },
      last7d: {
        totalSwaps: 350,
        totalVolumeUSD: 17500,
        swapGrowthPercent: 8.3,
        volumeGrowthPercent: 12.1
      },
      last30d: {
        totalSwaps: 800,
        totalVolumeUSD: 40000,
        swapGrowthPercent: 5.7,
        volumeGrowthPercent: 9.8
      },
      topTradingPairs: {
        allTime: [],
        last24h: []
      },
      notes: {
        unmappedIntentTokenIds: [],
        priceIdMissing: [],
        badAmounts: 0,
        status: 'Mock data - API endpoint working'
      }
    };

    res.status(200).json(mockData);
  } catch (error) {
    console.error('Error in API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

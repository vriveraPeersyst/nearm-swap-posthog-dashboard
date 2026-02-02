import type { VercelRequest, VercelResponse } from '@vercel/node';

const NPRO_API_BASE_URL = 'https://npro-stats-api-production.up.railway.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${NPRO_API_BASE_URL}/v1/npro/summary`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NPRO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache for 1 minute
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching NPRO summary:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch NPRO summary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

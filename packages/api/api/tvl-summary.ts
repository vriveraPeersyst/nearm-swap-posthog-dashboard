import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tokenIdToDisplaySymbol } from '../src/tokenMapping.js';

const TVL_API_BASE_URL = process.env.TVL_API_BASE_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    if (!TVL_API_BASE_URL) {
      throw new Error('TVL_API_BASE_URL is not configured');
    }

    const response = await fetch(`${TVL_API_BASE_URL}/v1/tvl/summary`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TVL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (Array.isArray(data?.tokens)) {
      data.tokens = data.tokens.map((token: any) => ({
        ...token,
        symbol: tokenIdToDisplaySymbol(token?.tokenId, token?.priceId),
      }));
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching TVL summary:', error);
    return res.status(500).json({
      error: 'Failed to fetch TVL summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

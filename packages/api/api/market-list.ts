import type { VercelRequest, VercelResponse } from '@vercel/node';

const MARKET_API_URL = 'https://near-mobile-production.aws.peersyst.tech/api/market/list';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const page = req.query.page ?? '1';
    const pageSize = req.query.pageSize ?? '100';
    const search = req.query.search;

    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', String(search));

    const response = await fetch(`${MARKET_API_URL}?${params}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream API: ${response.statusText}` });
    }

    const data = await response.json();
    // Cache for 10 minutes at the edge
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying market list:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

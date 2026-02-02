import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFeeLeaders } from '../src/feeLeaders.js';

export const config = { maxDuration: 300 };

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (_req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = await getFeeLeaders();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (e: any) {
    console.error('Fee leaders error:', e);
    return res.status(500).json({ error: e.message || 'Unknown error' });
  }
}

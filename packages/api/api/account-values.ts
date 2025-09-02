import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTotalAccountValues } from '../src/getTotalAccountValues.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('Fetching account values...');
    const data = await getTotalAccountValues();
    console.log('Successfully fetched account values');
    res.json(data);
  } catch (error) {
    console.error('Error fetching account values:', error);
    res.status(500).json({ 
      error: 'Failed to fetch account values',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

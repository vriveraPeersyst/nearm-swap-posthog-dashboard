import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTotalAccountValues } from '../src/getTotalAccountValues.js';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

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

import { getTopAccountsByValue } from '../src/getTopAccountsByValue.js';
// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
export default async function handler(req, res) {
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
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    // Handle HEAD requests
    if (req.method === 'HEAD') {
        return res.status(200).end();
    }
    try {
        console.log('Fetching top accounts by value...');
        const data = await getTopAccountsByValue();
        console.log('Successfully fetched top accounts by value');
        res.json(data);
    }
    catch (error) {
        console.error('Error fetching top accounts by value:', error);
        res.status(500).json({
            error: 'Failed to fetch top accounts by value',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
//# sourceMappingURL=top-accounts.js.map
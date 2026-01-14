import http from 'http';
import { getSwapMetrics } from './swapMetrics.js';
import { getTotalAccountValues } from './getTotalAccountValues.js';
import { getTopAccountsByValue } from './getTopAccountsByValue.js';
import { getValidatorStats } from './getValidatorStats.js';

const PORT = 3001;

// CORS headers
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url || '';
  console.log(`${new Date().toISOString()} ${req.method} ${url}`);

  try {
    if (url === '/api/health' || url === '/api/health/') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    if (url === '/api/swap-metrics' || url === '/api/swap-metrics/') {
      console.log('Fetching swap metrics...');
      const data = await getSwapMetrics();
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }

    if (url === '/api/account-values' || url === '/api/account-values/') {
      console.log('Fetching account values...');
      const data = await getTotalAccountValues();
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }

    if (url === '/api/top-accounts' || url === '/api/top-accounts/') {
      console.log('Fetching top accounts...');
      const data = await getTopAccountsByValue();
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }

    if (url === '/api/validator-stats' || url === '/api/validator-stats/') {
      console.log('Fetching validator stats...');
      const data = await getValidatorStats();
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }

    // 404 for unknown routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found', path: url }));
  } catch (error: any) {
    console.error('Error handling request:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ 
      error: 'Internal Server Error', 
      message: error?.message || 'Unknown error' 
    }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 API Server running at http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET /api/health');
  console.log('  GET /api/swap-metrics');
  console.log('  GET /api/account-values');
  console.log('  GET /api/top-accounts');
  console.log('  GET /api/validator-stats');
  console.log('\n');
});

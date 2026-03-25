// List swap token IDs from fee-leaders endpoint
const API = 'https://api-gamma-amber-44.vercel.app';

async function main() {
  console.log('Fetching fee-leaders...');
  const res = await fetch(`${API}/api/fee-leaders`);
  const data = await res.json();
  
  const swapTokens = new Set();
  
  function extractPairs(obj) {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && item.pair) {
          const parts = item.pair.split(' → ');
          parts.forEach(id => swapTokens.add(id.trim()));
        }
        if (item && item.topPairs && Array.isArray(item.topPairs)) {
          for (const p of item.topPairs) {
            if (p.pair) {
              const parts = p.pair.split(' → ');
              parts.forEach(id => swapTokens.add(id.trim()));
            }
          }
        }
        // recurse
        if (item && typeof item === 'object') extractPairs(item);
      }
    } else if (obj && typeof obj === 'object') {
      for (const val of Object.values(obj)) {
        extractPairs(val);
      }
    }
  }
  
  extractPairs(data);
  
  console.log(`\nKeys: ${Object.keys(data).join(', ')}`);
  
  if (swapTokens.size === 0) {
    // Try swap-metrics with a timeout
    console.log('\nNo pairs in fee-leaders, trying swap-metrics with AbortController...');
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 30000);
    try {
      const r2 = await fetch(`${API}/api/swap-metrics`, { signal: ctrl.signal });
      const d2 = await r2.json();
      extractPairs(d2);
    } catch (e) {
      console.log('swap-metrics timed out or failed:', e.message);
    }
  }
  
  const sorted = [...swapTokens].sort();
  console.log(`\n=== SWAP TOKEN IDs (${sorted.length}) ===\n`);
  sorted.forEach(t => console.log(`  ${t}`));
}

main().catch(console.error);

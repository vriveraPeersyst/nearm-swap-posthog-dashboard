// Temporary script to list all token IDs from PostHog events
const API = 'https://api-gamma-amber-44.vercel.app';

async function main() {
  // 1. Swap metrics
  console.log('\n========================================');
  console.log('  SWAP EVENT TOKEN IDs (from PostHog)');
  console.log('========================================\n');
  
  const swapRes = await fetch(`${API}/api/swap-metrics`);
  const swap = await swapRes.json();
  
  const swapTokens = new Set();
  
  // Explore all nested arrays for pair strings
  function extractPairs(obj, path = '') {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && item.pair) {
          const parts = item.pair.split(' → ');
          parts.forEach(id => swapTokens.add(id.trim()));
        }
      }
    } else if (obj && typeof obj === 'object') {
      for (const [key, val] of Object.entries(obj)) {
        extractPairs(val, path ? `${path}.${key}` : key);
      }
    }
  }
  
  extractPairs(swap);
  
  const sortedSwap = [...swapTokens].sort();
  console.log(`Total unique token IDs in swaps: ${sortedSwap.length}\n`);
  sortedSwap.forEach(t => console.log(`  ${t}`));

  // 2. TVL / Balance tokens
  console.log('\n========================================');
  console.log('  BALANCE/TVL TOKEN IDs (from PostHog)');
  console.log('========================================\n');
  
  const tvlRes = await fetch(`${API}/api/tvl-summary`);
  const tvl = await tvlRes.json();
  
  const tvlTokens = new Set();
  
  function extractTokenIds(obj) {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && item.tokenId) tvlTokens.add(item.tokenId);
      }
    } else if (obj && typeof obj === 'object') {
      for (const val of Object.values(obj)) {
        extractTokenIds(val);
      }
    }
  }
  
  extractTokenIds(tvl);
  
  const sortedTvl = [...tvlTokens].sort();
  console.log(`Total unique token IDs in balances: ${sortedTvl.length}\n`);
  sortedTvl.forEach(t => console.log(`  ${t}`));

  // 3. Market API tokens for comparison
  console.log('\n========================================');
  console.log('  MARKET API TOKEN IDs (for matching)');
  console.log('========================================\n');
  
  const mktRes = await fetch(`${API}/api/market-list?page=1&pageSize=100`);
  const mkt = await mktRes.json();
  
  if (mkt.items) {
    console.log(`Total market tokens: ${mkt.items.length}\n`);
    console.log('  ID (CoinGecko)'.padEnd(35) + 'tokenId'.padEnd(40) + 'symbol');
    console.log('  ' + '-'.repeat(100));
    mkt.items.forEach(t => {
      console.log(`  ${t.id.padEnd(33)} ${t.tokenId.padEnd(38)} ${t.symbol}`);
    });
  }

  // 4. Cross-reference: which PostHog tokens DON'T match any market token?
  console.log('\n========================================');
  console.log('  UNMATCHED TOKENS (no market image)');
  console.log('========================================\n');
  
  const marketById = new Map();
  const marketByTokenId = new Map();
  const marketBySymbol = new Map();
  
  if (mkt.items) {
    for (const t of mkt.items) {
      marketById.set(t.id, t);
      marketByTokenId.set(t.tokenId, t);
      marketBySymbol.set(t.symbol.toUpperCase(), t);
    }
  }
  
  console.log('Unmatched SWAP tokens:');
  for (const id of sortedSwap) {
    const sym = id.replace('intents:', '').toUpperCase();
    if (!marketByTokenId.has(id) && !marketBySymbol.has(sym) && !marketById.has(id)) {
      console.log(`  ${id}`);
    }
  }
  
  console.log('\nUnmatched TVL tokens:');
  for (const id of sortedTvl) {
    const sym = id.replace('intents:', '').replace('.near', '').split('.')[0].toUpperCase();
    if (!marketByTokenId.has(id) && !marketBySymbol.has(sym) && !marketById.has(id)) {
      console.log(`  ${id}`)
    }
  }
}

main().catch(console.error);

// List TVL and Market token IDs only (fast endpoints)
const API = 'https://api-gamma-amber-44.vercel.app';

async function main() {
  // TVL / Balance tokens
  console.log('Fetching TVL summary...');
  const tvlRes = await fetch(`${API}/api/tvl-summary`);
  const tvl = await tvlRes.json();
  
  const tvlTokens = [];
  
  function extractTokenIds(obj) {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (item && item.tokenId) tvlTokens.push(item);
      }
    } else if (obj && typeof obj === 'object') {
      for (const val of Object.values(obj)) {
        extractTokenIds(val);
      }
    }
  }
  
  extractTokenIds(tvl);
  
  // Deduplicate by tokenId
  const seen = new Map();
  for (const t of tvlTokens) {
    if (!seen.has(t.tokenId)) seen.set(t.tokenId, t);
  }
  
  const sorted = [...seen.values()].sort((a, b) => a.tokenId.localeCompare(b.tokenId));
  console.log(`\n=== BALANCE/TVL TOKEN IDs (${sorted.length}) ===\n`);
  console.log('tokenId'.padEnd(70) + 'symbol'.padEnd(12) + 'priceId');
  console.log('-'.repeat(110));
  sorted.forEach(t => {
    console.log(`${(t.tokenId||'').padEnd(70)}${(t.symbol||'?').padEnd(12)}${t.priceId||'?'}`);
  });

  // Market tokens
  console.log('\nFetching market list...');
  const mktRes = await fetch(`${API}/api/market-list?page=1&pageSize=100`);
  const mkt = await mktRes.json();
  
  console.log(`\n=== MARKET API TOKENS (${mkt.items.length}) ===\n`);
  console.log('id (CoinGecko)'.padEnd(35) + 'tokenId'.padEnd(45) + 'symbol');
  console.log('-'.repeat(110));
  mkt.items.forEach(t => {
    console.log(`${t.id.padEnd(35)}${t.tokenId.padEnd(45)}${t.symbol}`);
  });
}

main().catch(console.error);

/**
 * Map intents:<symbol> -> internal Prices API id.
 * Most IDs match CoinGecko slugs; a few need overrides.
 */
const baseMap: Record<string, string> = {
  // Standard intents: mappings
  zcash: "zcash",        // Alternative symbol
  melania: "melania-meme",
  bera: "berachain-bera",
  aurora: "aurora-near",
  shib: "shiba-inu",
  gmx: "gmx",
  mog: "mog-coin",
  brett: "based-brett",
  sweat: "sweatcoin",
  turbo: "turbo",
  wif: "dogwifcoin",
  bome: "book-of-meme",
  blackdragon: "black-dragon",
  shitzu: "shitzu",
  purge: "forgive-me-father",
  brrr: "burrow",
  gno: "gnosis",
  cow: "cow-protocol",
  safe: "safe",
  usdc: "usd-coin",
  trump: "official-trump",
  near: "near",
  usdt: "tether",
  dai: "dai",
  eth: "ethereum",
  btc: "bitcoin",
  pepe: "pepe",
  link: "chainlink",
  uni: "uniswap",
  arb: "arbitrum",
  aave: "aave",
  sol: "solana",
  doge: "dogecoin",
  xrp: "ripple",
  abg: "abg-966.meme-cooking.near",
  ref: "token.v2.ref-finance.near",
  mpdao: "mpdao-token.near",
  hapi: "d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near",
  score: "score.aidols.near",
  kaito: "kaito",
  trx: "tron",
  tron: "tron",          // Alternative symbol
  cbbtc: "coinbase-wrapped-btc",
  bnb: "binancecoin",
  pol: "matic-network",
  sui: "sui",
  gnosis: "gnosis",
  aptos: "aptos",
  cardano: "cardano",
  kat: "kat",
  npro: "npro",
  public: "public-ai",
  rhea: "rhea",
  wbtc: "wrapped-bitcoin",
  ltc: "litecoin",
  itlx: "itlx",
  
  // NEAR ecosystem direct mappings (non-intents format)
  "near-native": "near",
  
  // NEAR ecosystem contract addresses
  "noear": "noear-324.meme-cooking.near",
  "gnear": "gnear-229.meme-cooking.near",
  "eth.bridge.near": "ethereum",
  "usdt.tether-token.near": "tether",
  "token.sweat": "sweatcoin",
  "token.burrow.near": "burrow",
  "blackdragon.tkn.near": "black-dragon",
  "token.0xshitzu.near": "shitzu",
  "score.aidols.near": "score.aidols.near",
  "zec.omft.near": "zcash",
  "xrp.omft.near": "ripple",
  "kat.token0.near": "kat",
  "a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near": "matic-network",
  "npro.nearmobile.near": "npro",
  "token.publicailab.near": "public-ai",
  "token.rhealab.near": "rhea",
  "itlx.intellex_xyz.near": "itlx",
  
  // Contract addresses mapped to themselves as price IDs
  "mpdao-token.near": "mpdao-token.near",
  "token.v2.ref-finance.near": "token.v2.ref-finance.near",
  "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1": "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
  "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near": "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near",
  "d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near": "d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near",
};

/**
 * Map native NEAR tokens to their intent equivalents.
 * Used to identify deposit/withdraw operations (native ↔ intent swaps).
 */
const nativeToIntentMap: Record<string, string> = {
  // NEAR native
  "near-native": "intents:near",
  
  // Stablecoins
  "usdt.tether-token.near": "intents:usdt",
  "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1": "intents:usdc", // USDC
  
  // Bridge tokens
  "eth.bridge.near": "intents:eth",
  "zec.omft.near": "intents:zcash",
  "xrp.omft.near": "intents:xrp",
  "a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near": "intents:pol", // MATIC/POL
  
  // NEAR ecosystem tokens
  "npro.nearmobile.near": "intents:npro",
  "kat.token0.near": "intents:kat",
  "token.publicailab.near": "intents:public",
  "token.rhealab.near": "intents:rhea",
  "itlx.intellex_xyz.near": "intents:itlx",
  "token.sweat": "intents:sweat",
  "token.burrow.near": "intents:brrr",
  "blackdragon.tkn.near": "intents:blackdragon",
  "token.0xshitzu.near": "intents:shitzu",
  "token.v2.ref-finance.near": "intents:ref",
  "mpdao-token.near": "intents:mpdao",
  "score.aidols.near": "intents:score",
  "d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near": "intents:hapi",
  "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near": "intents:aurora",
};

// Create reverse mapping (intent -> native)
const intentToNativeMap: Record<string, string> = {};
for (const [native, intent] of Object.entries(nativeToIntentMap)) {
  intentToNativeMap[intent.toLowerCase()] = native;
}

/**
 * Check if a swap pair is a deposit/withdraw (native ↔ intent conversion).
 * Returns true if the pair is swapping between a native token and its intent equivalent.
 */
export function isDepositWithdrawPair(tokenInId: string, tokenOutId: string): boolean {
  const tokenIn = tokenInId.toLowerCase();
  const tokenOut = tokenOutId.toLowerCase();
  
  // Check if tokenIn is native and tokenOut is its intent equivalent (deposit)
  const intentEquivalent = nativeToIntentMap[tokenIn];
  if (intentEquivalent && intentEquivalent.toLowerCase() === tokenOut) {
    return true;
  }
  
  // Check if tokenIn is intent and tokenOut is its native equivalent (withdraw)
  const nativeEquivalent = intentToNativeMap[tokenIn];
  if (nativeEquivalent && nativeEquivalent.toLowerCase() === tokenOut) {
    return true;
  }
  
  return false;
}

export function intentsToPriceId(intentsTokenId?: string | null): string | null {
  if (!intentsTokenId) return null;
  
  let cleaned = intentsTokenId.trim().toLowerCase();
  
  // Remove "intents:" prefix if present
  if (cleaned.startsWith('intents:')) {
    cleaned = cleaned.replace(/^intents:/, '');
  }
  
  // Direct lookup in unified mapping
  const directMatch = baseMap[cleaned];
  if (directMatch) return directMatch;
  
  // Handle dynamic meme-cooking tokens: "gnear-229.meme-cooking.near" → "gnear"
  if (cleaned.includes('.meme-cooking.near')) {
    const symbol = cleaned.split('-')[0];
    return symbol ? (baseMap[symbol] ?? null) : null;
  }
  
  return null;
}

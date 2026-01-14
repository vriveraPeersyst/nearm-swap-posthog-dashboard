import axios from 'axios';

export type ValidatorStats = {
  validator_id: string;
  total_delegators: number;
  total_near_staked: number;
  near_staked_24h_change: number;
  near_staked_24h_change_percent: number;
  near_staked_7d_change: number;
  near_staked_7d_change_percent: number;
  near_staked_30d_change: number;
  near_staked_30d_change_percent: number;
  delegators_24h_change: number;
  delegators_7d_change: number;
  delegators_30d_change: number;
  latest_update: string;
};

// Historical data cache key prefix
const CACHE_PREFIX = 'validator_history';

// In-memory cache for historical snapshots (in production, use Redis or similar)
const historicalCache: Map<string, { timestamp: number; delegators: number; staked: number }[]> = new Map();

const VALIDATOR_ID = 'npro.poolv1.near';
const NEAR_RPC_URL = 'https://rpc.mainnet.near.org';

// NEAR RPC call helper
async function rpcCall<T = any>(method: string, params: any, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.post(
        NEAR_RPC_URL,
        {
          jsonrpc: '2.0',
          id: 'dontcare',
          method,
          params,
        },
        { timeout: 30000 }
      );
      
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }
      
      return data.result;
    } catch (error: any) {
      const isRetryable = error.code === 'ECONNABORTED' || 
                          error.response?.status >= 500;
      
      if (attempt < retries && isRetryable) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`RPC call failed (attempt ${attempt}/${retries}), retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('RPC call failed after all retries');
}

// Call a view method on a contract
async function viewCall<T = any>(contractId: string, methodName: string, args: object = {}): Promise<T> {
  const argsBase64 = Buffer.from(JSON.stringify(args)).toString('base64');
  
  const result = await rpcCall<{ result: number[] }>('query', {
    request_type: 'call_function',
    finality: 'final',
    account_id: contractId,
    method_name: methodName,
    args_base64: argsBase64,
  });
  
  // Decode the result from bytes to string, then parse as JSON
  const resultStr = Buffer.from(result.result).toString('utf-8');
  return JSON.parse(resultStr);
}

// Convert yoctoNEAR (10^24) to NEAR
function yoctoToNear(yoctoNear: string): number {
  // yoctoNEAR has 24 decimal places
  const near = BigInt(yoctoNear) / BigInt(10 ** 18);
  return Number(near) / 1000000; // remaining 6 decimals
}

// Get or initialize historical cache for a validator
function getHistoricalData(validatorId: string): { timestamp: number; delegators: number; staked: number }[] {
  if (!historicalCache.has(validatorId)) {
    historicalCache.set(validatorId, []);
  }
  return historicalCache.get(validatorId)!;
}

// Save current snapshot to history
function saveSnapshot(validatorId: string, delegators: number, staked: number): void {
  const history = getHistoricalData(validatorId);
  const now = Date.now();
  
  // Only save if at least 1 hour has passed since last snapshot
  const lastSnapshot = history[history.length - 1];
  if (lastSnapshot && now - lastSnapshot.timestamp < 60 * 60 * 1000) {
    return;
  }
  
  history.push({ timestamp: now, delegators, staked });
  
  // Keep only last 31 days of data
  const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
  while (history.length > 0 && history[0] && history[0].timestamp < thirtyOneDaysAgo) {
    history.shift();
  }
}

// Get historical data from a specific time ago
function getHistoricalSnapshot(validatorId: string, hoursAgo: number): { delegators: number; staked: number } | null {
  const history = getHistoricalData(validatorId);
  const targetTime = Date.now() - hoursAgo * 60 * 60 * 1000;
  
  // Find the closest snapshot to the target time
  let closest: { timestamp: number; delegators: number; staked: number } | null = null;
  
  for (const snapshot of history) {
    if (snapshot.timestamp <= targetTime) {
      if (!closest || snapshot.timestamp > closest.timestamp) {
        closest = snapshot;
      }
    }
  }
  
  return closest ? { delegators: closest.delegators, staked: closest.staked } : null;
}

/**
 * Get validator stats for npro.poolv1.near from NEAR RPC
 * Includes total delegators, staked NEAR, and historical changes
 */
export async function getValidatorStats(): Promise<ValidatorStats> {
  console.log(`🔍 Fetching validator stats for ${VALIDATOR_ID} from NEAR RPC...\n`);

  // Fetch current stats from the staking pool contract
  const [totalDelegators, totalStakedYocto] = await Promise.all([
    viewCall<number>(VALIDATOR_ID, 'get_number_of_accounts'),
    viewCall<string>(VALIDATOR_ID, 'get_total_staked_balance'),
  ]);

  const totalNearStaked = yoctoToNear(totalStakedYocto);
  const now = new Date().toISOString();

  // Save current snapshot for future historical comparisons
  saveSnapshot(VALIDATOR_ID, totalDelegators, totalNearStaked);

  // Get historical data
  const snapshot24h = getHistoricalSnapshot(VALIDATOR_ID, 24);
  const snapshot7d = getHistoricalSnapshot(VALIDATOR_ID, 24 * 7);
  const snapshot30d = getHistoricalSnapshot(VALIDATOR_ID, 24 * 30);

  // Calculate changes (will be 0 if no historical data available)
  const nearStaked24hChange = snapshot24h ? totalNearStaked - snapshot24h.staked : 0;
  const nearStaked7dChange = snapshot7d ? totalNearStaked - snapshot7d.staked : 0;
  const nearStaked30dChange = snapshot30d ? totalNearStaked - snapshot30d.staked : 0;

  const nearStaked24hChangePercent = snapshot24h && snapshot24h.staked > 0 
    ? (nearStaked24hChange / snapshot24h.staked) * 100 
    : 0;
  const nearStaked7dChangePercent = snapshot7d && snapshot7d.staked > 0 
    ? (nearStaked7dChange / snapshot7d.staked) * 100 
    : 0;
  const nearStaked30dChangePercent = snapshot30d && snapshot30d.staked > 0 
    ? (nearStaked30dChange / snapshot30d.staked) * 100 
    : 0;

  const delegators24hChange = snapshot24h ? totalDelegators - snapshot24h.delegators : 0;
  const delegators7dChange = snapshot7d ? totalDelegators - snapshot7d.delegators : 0;
  const delegators30dChange = snapshot30d ? totalDelegators - snapshot30d.delegators : 0;

  console.log(`✅ Fetched stats: ${totalDelegators} delegators, ${totalNearStaked.toFixed(2)} NEAR staked`);

  return {
    validator_id: VALIDATOR_ID,
    total_delegators: totalDelegators,
    total_near_staked: totalNearStaked,
    near_staked_24h_change: nearStaked24hChange,
    near_staked_24h_change_percent: nearStaked24hChangePercent,
    near_staked_7d_change: nearStaked7dChange,
    near_staked_7d_change_percent: nearStaked7dChangePercent,
    near_staked_30d_change: nearStaked30dChange,
    near_staked_30d_change_percent: nearStaked30dChangePercent,
    delegators_24h_change: delegators24hChange,
    delegators_7d_change: delegators7dChange,
    delegators_30d_change: delegators30dChange,
    latest_update: now,
  };
}

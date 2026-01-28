import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { Decimal } from 'decimal.js';

export type ValidatorStats = {
  validator_id: string;
  total_delegators: number;
  total_near_staked: number;
  near_staked_3d_change: number;
  near_staked_3d_change_percent: number;
  near_staked_7d_change: number;
  near_staked_7d_change_percent: number;
  near_staked_30d_change: number;
  near_staked_30d_change_percent: number;
  delegators_3d_change: number;
  delegators_7d_change: number;
  delegators_30d_change: number;
  latest_update: string;
};

const VALIDATOR_ID = 'npro.poolv1.near';
const NEAR_RPC_URL = 'https://rpc.mainnet.near.org';
const ARCHIVAL_RPC_URL = 'https://archival-rpc.mainnet.near.org';

// Estimated average block time in seconds
const BLOCK_TIME_SECONDS = 0.6316;

// Rate limiting for archival RPC (to respect RPC limits)
// Archival limits: ~4 req/min (give buffer) -> set to 16s between requests
const ARCHIVAL_DELAY_MS = 16_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rpcCall<T = any>(method: string, params: any, rpcUrl: string = NEAR_RPC_URL): Promise<T> {
  const { data } = await axios.post(
    rpcUrl,
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

  // If we called an archival node, sleep a bit to avoid hitting rate limits
  if (rpcUrl === ARCHIVAL_RPC_URL) {
    await sleep(ARCHIVAL_DELAY_MS);
  }

  return data.result;
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

async function queryViewAtBlock<T = any>(contractId: string, methodName: string, blockId: number, args: object = {}, useArchival = false): Promise<T> {
  const argsBase64 = Buffer.from(JSON.stringify(args)).toString('base64');
  const rpcUrl = useArchival ? ARCHIVAL_RPC_URL : NEAR_RPC_URL;
  const result = await rpcCall<{ result: number[] }>('query', {
    request_type: 'call_function',
    block_id: blockId,
    account_id: contractId,
    method_name: methodName,
    args_base64: argsBase64,
  }, rpcUrl);
  const resultStr = Buffer.from(result.result).toString('utf-8');
  return JSON.parse(resultStr);
}

async function getBlockInfo(blockIdOrFinality: any, useArchival = false) {
  const rpcUrl = useArchival ? ARCHIVAL_RPC_URL : NEAR_RPC_URL;
  return rpcCall('block', blockIdOrFinality, rpcUrl);
}

// Convert yoctoNEAR (10^24) to NEAR
function yoctoToNear(yoctoNear: string): number {
  try {
    const d = new Decimal(yoctoNear);
    return d.dividedBy(new Decimal('1e24')).toNumber();
  } catch (err) {
    console.error('yoctoToNear conversion error:', err);
    return 0;
  }
}

export async function getValidatorStats(): Promise<ValidatorStats> {
  console.log(`🔍 Fetching validator stats for ${VALIDATOR_ID} from NEAR RPC...\n`);

  // Fetch current stats from the staking pool contract
  const [totalDelegators, totalStakedYocto] = await Promise.all([
    viewCall<number>(VALIDATOR_ID, 'get_number_of_accounts'),
    viewCall<string>(VALIDATOR_ID, 'get_total_staked_balance'),
  ]);

  const totalNearStaked = yoctoToNear(totalStakedYocto);
  const now = new Date().toISOString();

  // Fetch historical snapshots for 3d, 7d, 30d
  const periods = [72, 168, 720]; // 3d, 7d, 30d in hours
  const historicalSnapshots: { [key: number]: { delegators: number; staked: number } | null } = {};

  // Get latest block to compute heights
  const latestBlock = await getBlockInfo({ finality: 'final' });
  const currentHeight = latestBlock.header?.height ?? latestBlock.header?.height ?? latestBlock.height;

  if (!currentHeight) {
    throw new Error('Unable to determine current block height');
  }

  for (const hoursAgo of periods) {
    const secondsAgo = hoursAgo * 3600;
    const blocksAgo = Math.round(secondsAgo / BLOCK_TIME_SECONDS);
    const targetHeight = Math.max(1, currentHeight - blocksAgo);

    // Use archival RPC for all historical snapshots
    const useArchival = true;

    try {
      // Fetch contract views at that block using archival if needed
      const delegators = await queryViewAtBlock<number>(VALIDATOR_ID, 'get_number_of_accounts', targetHeight, {}, useArchival);
      const totalStakedYoctoHist = await queryViewAtBlock<string>(VALIDATOR_ID, 'get_total_staked_balance', targetHeight, {}, useArchival);
      const totalStakedHist = yoctoToNear(totalStakedYoctoHist);

      historicalSnapshots[hoursAgo] = { delegators, staked: totalStakedHist };
      console.log(`Fetched historical snapshot for ${hoursAgo}h ago (block ${targetHeight}) -> delegators=${delegators}, staked=${totalStakedHist.toFixed(6)} (archival=${useArchival})`);
    } catch (err) {
      console.warn(`Failed to fetch snapshot for ${hoursAgo}h ago (block ${targetHeight}):`, err instanceof Error ? err.message : err);
      historicalSnapshots[hoursAgo] = null;
    }
  }

  // Calculate changes
  const snapshot3d = historicalSnapshots[72];
  const snapshot7d = historicalSnapshots[168];
  const snapshot30d = historicalSnapshots[720];

  const nearStaked3dChange = snapshot3d ? totalNearStaked - snapshot3d.staked : 0;
  const nearStaked7dChange = snapshot7d ? totalNearStaked - snapshot7d.staked : 0;
  const nearStaked30dChange = snapshot30d ? totalNearStaked - snapshot30d.staked : 0;

  const nearStaked3dChangePercent = snapshot3d && snapshot3d.staked > 0 ? (nearStaked3dChange / snapshot3d.staked) * 100 : 0;
  const nearStaked7dChangePercent = snapshot7d && snapshot7d.staked > 0 ? (nearStaked7dChange / snapshot7d.staked) * 100 : 0;
  const nearStaked30dChangePercent = snapshot30d && snapshot30d.staked > 0 ? (nearStaked30dChange / snapshot30d.staked) * 100 : 0;

  const delegators3dChange = snapshot3d ? totalDelegators - snapshot3d.delegators : 0;
  const delegators7dChange = snapshot7d ? totalDelegators - snapshot7d.delegators : 0;
  const delegators30dChange = snapshot30d ? totalDelegators - snapshot30d.delegators : 0;

  console.log(`✅ Fetched stats: ${totalDelegators} delegators, ${totalNearStaked.toFixed(2)} NEAR staked`);

  return {
    validator_id: VALIDATOR_ID,
    total_delegators: totalDelegators,
    total_near_staked: totalNearStaked,
    near_staked_3d_change: nearStaked3dChange,
    near_staked_3d_change_percent: nearStaked3dChangePercent,
    near_staked_7d_change: nearStaked7dChange,
    near_staked_7d_change_percent: nearStaked7dChangePercent,
    near_staked_30d_change: nearStaked30dChange,
    near_staked_30d_change_percent: nearStaked30dChangePercent,
    delegators_3d_change: delegators3dChange,
    delegators_7d_change: delegators7dChange,
    delegators_30d_change: delegators30dChange,
    latest_update: now,
  };
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  getValidatorStats()
    .then((stats) => {
      console.log(JSON.stringify(stats));
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as Decimal from 'decimal.js';

// Path must match getValidatorStats
const OUTPUT_DIR = path.join(process.cwd(), 'output');
const HISTORY_FILE = path.join(OUTPUT_DIR, 'validator_history.json');
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
  const { data } = await axios.post(rpcUrl, {
    jsonrpc: '2.0',
    id: 'dontcare',
    method,
    params,
  }, { timeout: 30000 });

  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  // If we called an archival node, sleep a bit to avoid hitting rate limits
  if (rpcUrl === ARCHIVAL_RPC_URL) {
    await sleep(ARCHIVAL_DELAY_MS);
  }

  return data.result;
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

async function backfill() {
  try {
    // Get latest block to compute heights
    const latestBlock = await getBlockInfo({ finality: 'final' });
    const currentHeight = latestBlock.header?.height ?? latestBlock.header?.height ?? latestBlock.height;

    if (!currentHeight) {
      throw new Error('Unable to determine current block height');
    }

    const periods = [24, 24 * 7, 24 * 30];
    const historyEntries: { timestamp: number; delegators: number; staked: number }[] = [];

    for (const hoursAgo of periods) {
      const secondsAgo = hoursAgo * 3600;
      const blocksAgo = Math.round(secondsAgo / BLOCK_TIME_SECONDS);
      const targetHeight = Math.max(1, currentHeight - blocksAgo);

      // Use archival RPC for snapshots older than ~2.5 days (60h)
      const useArchival = hoursAgo > 60;

      try {
        // Fetch block info at target height to get real timestamp
        const blockInfo = await getBlockInfo({ block_id: targetHeight }, useArchival);
        // Use approximate timestamp for consistency with targets
        const timestampMs = Date.now() - secondsAgo * 1000;

        // Fetch contract views at that block using archival if needed
        const delegators = await queryViewAtBlock<number>(VALIDATOR_ID, 'get_number_of_accounts', targetHeight, {}, useArchival);
        const totalStakedYocto = await queryViewAtBlock<string>(VALIDATOR_ID, 'get_total_staked_balance', targetHeight, {}, useArchival);

        const totalStaked = new Decimal.Decimal(totalStakedYocto).dividedBy(new Decimal.Decimal('1e24')).toNumber();

        historyEntries.push({ timestamp: timestampMs, delegators, staked: totalStaked });

        console.log(`Fetched historical snapshot for ${hoursAgo}h ago (block ${targetHeight}) -> delegators=${delegators}, staked=${totalStaked.toFixed(6)} (archival=${useArchival})`);
      } catch (err) {
        if (err instanceof Error) {
          console.warn(`Failed to fetch snapshot for ${hoursAgo}h ago (block ${targetHeight}):`, err.message);
        } else {
          console.warn(`Failed to fetch snapshot for ${hoursAgo}h ago (block ${targetHeight}):`, err);
        }
        // Fallback: approximate timestamp and use latest values (use archival only for deep history)
        const fallbackTimestamp = Date.now() - hoursAgo * 3600 * 1000;
        const latestDelegators = await queryViewAtBlock<number>(VALIDATOR_ID, 'get_number_of_accounts', Math.max(1, currentHeight - 1), {}, false);
        const latestStakedYocto = await queryViewAtBlock<string>(VALIDATOR_ID, 'get_total_staked_balance', Math.max(1, currentHeight - 1), {}, false);
        const latestStaked = new Decimal.Decimal(latestStakedYocto).dividedBy(new Decimal.Decimal('1e24')).toNumber();
        historyEntries.push({ timestamp: fallbackTimestamp, delegators: latestDelegators, staked: latestStaked });
      }
    }

    // Order ascending timestamps
    historyEntries.sort((a, b) => a.timestamp - b.timestamp);

    const obj: Record<string, any> = {};
    obj[VALIDATOR_ID] = historyEntries;

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(HISTORY_FILE, JSON.stringify(obj), 'utf8');

    console.log('Backfill complete. Wrote snapshot entries to', HISTORY_FILE);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
}

backfill();

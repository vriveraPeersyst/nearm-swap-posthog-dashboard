import axios from 'axios';
import { cfg, parseCSV } from './config.js';

export type SwapEventRow = {
  uuid: string;
  timestamp: string;
  account_id?: string | null;
  amount_in?: string | null;
  amount_out?: string | null;
  token_in_id?: string | null;
  token_out_id?: string | null;
};

function q(v: string) { return `'${v.replace(/'/g, "''")}'`; }

// Helper to extract property from JSON using ClickHouse JSONExtractString
function prop(field: string): string {
  return `JSONExtractString(properties, '${field}')`;
}

function buildExclusions(): string {
  const substr = parseCSV(cfg.EXCLUDE_ACCOUNT_ID_PATTERNS).map((p) => p.toLowerCase());
  const exact = parseCSV(cfg.EXCLUDE_ACCOUNT_IDS);

  const clauses: string[] = [];
  for (const p of substr) clauses.push(`lower(${prop('account_id')}) NOT LIKE ${q('%' + p + '%')}`);
  if (exact.length) clauses.push(`${prop('account_id')} NOT IN (${exact.map(q).join(', ')})`);
  return clauses.length ? clauses.join(' AND ') : '1';
}

async function hogql<T = any>(query: string, retries = 3): Promise<T> {
  const url = `${cfg.POSTHOG_BASE_URL.replace(/\/$/, '')}/api/projects/${cfg.POSTHOG_PROJECT_ID}/query/`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.post(
        url,
        { query: { kind: 'HogQLQuery', query } },
        { 
          headers: { Authorization: `Bearer ${cfg.POSTHOG_API_KEY}` },
          timeout: 60000 // 60 second timeout
        }
      );
      return data;
    } catch (error: any) {
      const isRetryable = error?.response?.status === 500 || 
                          error?.response?.data?.detail?.includes('ClickHouse') ||
                          error.code === 'ECONNABORTED';
      
      if (attempt < retries && isRetryable) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`PostHog query failed (attempt ${attempt}/${retries}), retrying in ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('PostHog query failed after all retries');
}

/**
 * Fetch one batch of swap events ordered from oldest to newest.
 */
export async function fetchSwapBatch(offset: number, limit: number): Promise<SwapEventRow[]> {
  const where = [
    `event = ${q(cfg.SWAP_EVENT_NAME)}`,
    `${prop('network')} = ${q(cfg.NETWORK_FILTER)}`,
    buildExclusions()
  ].join(' AND ');

  const query = `
    SELECT
      uuid,
      toString(timestamp) AS timestamp,
      ${prop('account_id')} AS account_id,
      ${prop(cfg.VOLUME_PROP_IN)} AS amount_in,
      ${prop(cfg.VOLUME_PROP_OUT)} AS amount_out,
      ${prop('token_in_id')} AS token_in_id,
      ${prop('token_out_id')} AS token_out_id
    FROM events
    WHERE ${where}
    ORDER BY timestamp ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const res = await hogql<{ results: any[] }>(query);
  // Results are rows in same order as SELECT
  return (res?.results ?? []).map((r) => ({
    uuid: r[0],
    timestamp: r[1],
    account_id: r[2],
    amount_in: r[3],
    amount_out: r[4],
    token_in_id: r[5],
    token_out_id: r[6]
  }));
}

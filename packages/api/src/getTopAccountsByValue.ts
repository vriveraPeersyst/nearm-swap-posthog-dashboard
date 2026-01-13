import axios from 'axios';
import { cfg } from './config.js';

export type TopAccountData = {
  account_id: string;
  near_balance: number;
  near_staked: number;
  total_value: number;
  latest_update: string;
  events_count: number;
};

export type TopAccountsResponse = {
  accounts: TopAccountData[];
  total_accounts_found: number;
  date_range: {
    start_date: string;
    end_date: string;
  };
  query_metadata: {
    limit: number;
    total_events_processed: number;
  };
};

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
      // Handle rate limiting
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
        console.log(`\n⚠️  Rate limited! Waiting ${retryAfter} seconds before retrying...`);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
      }
      
      // Handle ClickHouse errors with retry
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

// Helper to extract property from JSON using ClickHouse JSONExtractString
function prop(field: string): string {
  return `JSONExtractString(properties, '${field}')`;
}

/**
 * Get top 50 account IDs by total value (NEAR balance + NEAR staked) in the last 30 days
 * Only includes mainnet network events
 */
export async function getTopAccountsByValue(): Promise<TopAccountsResponse> {
  console.log('🔍 Finding top 50 accounts by value in the last 30 days (mainnet only)...\n');

  // Calculate 30 days ago timestamp
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString();
  const endDate = new Date().toISOString();

  const query = `
    WITH filtered_events AS (
      SELECT 
        ${prop('account_id')} AS account_id,
        ${prop('near_value')} AS near_value,
        ${prop('near_staked')} AS near_staked,
        timestamp,
        event
      FROM events 
      WHERE event = 'account_state' 
        AND ${prop('network')} = 'mainnet'
        AND ${prop('account_id')} IS NOT NULL
        AND ${prop('account_id')} != ''
        AND timestamp >= toDateTime('${startDate}')
    ),
    latest_account_states AS (
      SELECT 
        account_id,
        argMax(near_value, timestamp) AS latest_near_value,
        argMax(near_staked, timestamp) AS latest_near_staked,
        max(timestamp) AS latest_timestamp,
        count() AS total_events_for_account
      FROM filtered_events
      GROUP BY account_id
    ),
    converted_and_ranked AS (
      SELECT 
        account_id,
        latest_near_value,
        latest_near_staked,
        latest_timestamp,
        total_events_for_account,
        -- Convert string values to numbers, treating null/empty as 0
        CASE 
          WHEN latest_near_value IS NULL OR latest_near_value = '' THEN 0
          ELSE toFloatOrZero(latest_near_value)
        END AS near_balance_numeric,
        CASE 
          WHEN latest_near_staked IS NULL OR latest_near_staked = '' THEN 0  
          ELSE toFloatOrZero(latest_near_staked)
        END AS near_staked_numeric
      FROM latest_account_states
    ),
    with_totals AS (
      SELECT 
        account_id,
        near_balance_numeric AS near_balance,
        near_staked_numeric AS near_staked,
        (near_balance_numeric + near_staked_numeric) AS total_value,
        latest_timestamp,
        total_events_for_account
      FROM converted_and_ranked
      WHERE (near_balance_numeric + near_staked_numeric) > 0
    )
    SELECT 
      account_id,
      near_balance,
      near_staked,
      total_value,
      toString(latest_timestamp) AS latest_update,
      total_events_for_account AS events_count
    FROM with_totals
    ORDER BY total_value DESC
    LIMIT 50
  `;

  try {
    const result = await hogql<{ results: any[] }>(query);
    
    const accounts: TopAccountData[] = result.results.map(row => ({
      account_id: row[0],
      near_balance: row[1],
      near_staked: row[2], 
      total_value: row[3],
      latest_update: row[4],
      events_count: row[5]
    }));

    // Get total count of accounts with any balance in the last 30 days
    const countQuery = `
      WITH filtered_events AS (
        SELECT 
          properties.account_id AS account_id,
          properties.near_value AS near_value,
          properties.near_staked AS near_staked,
          timestamp
        FROM events 
        WHERE event = 'account_state' 
          AND properties.network = 'mainnet'
          AND properties.account_id IS NOT NULL
          AND properties.account_id != ''
          AND timestamp >= toDateTime('${startDate}')
      ),
      latest_account_states AS (
        SELECT 
          account_id,
          argMax(near_value, timestamp) AS latest_near_value,
          argMax(near_staked, timestamp) AS latest_near_staked
        FROM filtered_events
        GROUP BY account_id
      ),
      converted_values AS (
        SELECT 
          account_id,
          CASE 
            WHEN latest_near_value IS NULL OR latest_near_value = '' THEN 0
            ELSE toFloatOrZero(latest_near_value)
          END AS near_balance_numeric,
          CASE 
            WHEN latest_near_staked IS NULL OR latest_near_staked = '' THEN 0  
            ELSE toFloatOrZero(latest_near_staked)
          END AS near_staked_numeric
        FROM latest_account_states
      )
      SELECT 
        count() AS total_accounts,
        sum(1) AS total_events_processed
      FROM converted_values
      WHERE (near_balance_numeric + near_staked_numeric) > 0
    `;

    const countResult = await hogql<{ results: any[] }>(countQuery);
    const [countRow] = countResult.results;
    const totalAccountsFound = countRow[0];
    const totalEventsProcessed = countRow[1];

    const response: TopAccountsResponse = {
      accounts,
      total_accounts_found: totalAccountsFound,
      date_range: {
        start_date: startDate,
        end_date: endDate,
      },
      query_metadata: {
        limit: 50,
        total_events_processed: totalEventsProcessed,
      },
    };

    // Display results
    console.log('📊 Top Accounts by Value (Last 30 Days):');
    console.log('==========================================');
    console.log(`Date Range: ${new Date(startDate).toISOString().split('T')[0]} to ${new Date(endDate).toISOString().split('T')[0]}`);
    console.log(`Total Accounts Found with Balance: ${totalAccountsFound.toLocaleString()}`);
    console.log(`Showing Top: ${accounts.length} accounts`);
    console.log('');

    // Display top 10 for preview
    console.log('🏆 Top 10 Preview:');
    accounts.slice(0, 10).forEach((account, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${account.account_id.padEnd(25)} | Total: ${account.total_value.toFixed(2).padStart(12)} NEAR | Balance: ${account.near_balance.toFixed(2).padStart(10)} | Staked: ${account.near_staked.toFixed(2).padStart(10)}`);
    });

    if (accounts.length > 10) {
      console.log(`... and ${accounts.length - 10} more accounts`);
    }

    return response;

  } catch (error) {
    console.error('❌ Error fetching top accounts by value:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
}

// Main execution - only run when called directly (not when imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  getTopAccountsByValue()
    .then(response => {
      // Output JSON for API consumption
      console.log('\n' + JSON.stringify(response, null, 2));
    })
    .catch(console.error);
}

import axios from 'axios';
import { cfg } from './config.js';

export type AccountValueSummary = {
  total_unique_accounts: number;
  total_near_value: number;
  total_near_staked: number;
  total_near_staked_by_validator: number;
  total_near_combined: number;
  avg_near_value: number;
  avg_near_staked: number;
  accounts_with_near_value: number;
  accounts_with_near_staked: number;
  accounts_with_any_balance: number;
  earliest_account_update: string;
  most_recent_account_update: string;
  total_account_state_events: number;
};

async function hogql<T = any>(query: string, retryCount = 0): Promise<T> {
  const url = `${cfg.POSTHOG_BASE_URL.replace(/\/$/, '')}/api/projects/${cfg.POSTHOG_PROJECT_ID}/query/`;
  
  try {
    const { data } = await axios.post(
      url,
      { query: { kind: 'HogQLQuery', query } },
      { headers: { Authorization: `Bearer ${cfg.POSTHOG_API_KEY}` } }
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
      console.log(`\n⚠️  Rate limited! Waiting ${retryAfter} seconds before retrying...`);
      
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return hogql(query, retryCount + 1);
      } else {
        console.log('❌ Max retries reached for rate limiting');
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Get total NEAR value and staking amounts for all unique accounts using their latest values
 * Only includes mainnet network events
 */
export async function getTotalAccountValues(): Promise<AccountValueSummary> {
  console.log('🔍 Calculating total NEAR values for all unique accounts (mainnet only)...\n');

  const query = `
    WITH latest_account_states AS (
      SELECT 
        properties.account_id AS account_id,
        argMax(properties.near_value, timestamp) AS latest_near_value,
        argMax(properties.near_staked, timestamp) AS latest_near_staked,
        argMax(properties.near_staked_by_validator, timestamp) AS latest_near_staked_by_validator,
        max(timestamp) AS latest_timestamp,
        count() AS total_events_for_account
      FROM events 
      WHERE event = 'account_state' 
        AND properties.network = 'mainnet'
        AND properties.account_id IS NOT NULL
        AND properties.account_id != ''
      GROUP BY properties.account_id
    ),
    converted_values AS (
      SELECT 
        account_id,
        latest_near_value,
        latest_near_staked,
        latest_near_staked_by_validator,
        latest_timestamp,
        total_events_for_account,
        -- Convert string values to numbers, treating null/empty as 0
        CASE 
          WHEN latest_near_value IS NULL OR latest_near_value = '' THEN 0
          ELSE toFloatOrZero(latest_near_value)
        END AS near_value_numeric,
        CASE 
          WHEN latest_near_staked IS NULL OR latest_near_staked = '' THEN 0  
          ELSE toFloatOrZero(latest_near_staked)
        END AS near_staked_numeric,
        CASE 
          WHEN latest_near_staked_by_validator IS NULL OR latest_near_staked_by_validator = '' THEN 0
          ELSE toFloatOrZero(latest_near_staked_by_validator) 
        END AS near_staked_by_validator_numeric
      FROM latest_account_states
    )
    SELECT 
      -- Summary totals
      count() AS total_unique_accounts,
      sum(near_value_numeric) AS total_near_value,
      sum(near_staked_numeric) AS total_near_staked,
      sum(near_staked_by_validator_numeric) AS total_near_staked_by_validator,
      sum(near_value_numeric + near_staked_numeric) AS total_near_combined,
      
      -- Statistics
      avg(near_value_numeric) AS avg_near_value,
      avg(near_staked_numeric) AS avg_near_staked,
      
      -- Accounts with positive balances
      countIf(near_value_numeric > 0) AS accounts_with_near_value,
      countIf(near_staked_numeric > 0) AS accounts_with_near_staked,
      countIf(near_value_numeric > 0 OR near_staked_numeric > 0) AS accounts_with_any_balance,
      
      -- Date range of data
      toString(min(latest_timestamp)) AS earliest_account_update,
      toString(max(latest_timestamp)) AS most_recent_account_update,
      
      -- Total events processed
      sum(total_events_for_account) AS total_account_state_events
      
    FROM converted_values
  `;

  try {
    const result = await hogql<{ results: any[] }>(query);
    const [row] = result.results;
    
    const summary: AccountValueSummary = {
      total_unique_accounts: row[0],
      total_near_value: row[1],
      total_near_staked: row[2],
      total_near_staked_by_validator: row[3],
      total_near_combined: row[4],
      avg_near_value: row[5],
      avg_near_staked: row[6],
      accounts_with_near_value: row[7],
      accounts_with_near_staked: row[8],
      accounts_with_any_balance: row[9],
      earliest_account_update: row[10],
      most_recent_account_update: row[11],
      total_account_state_events: row[12]
    };

    // Display results
    console.log('📊 Account Value Summary:');
    console.log('========================');
    console.log(`Total Unique Accounts: ${summary.total_unique_accounts.toLocaleString()}`);
    console.log(`Total NEAR Value: ${summary.total_near_value.toLocaleString()} NEAR`);
    console.log(`Total NEAR Staked: ${summary.total_near_staked.toLocaleString()} NEAR`);
    console.log(`Total NEAR Staked by Validator: ${summary.total_near_staked_by_validator.toLocaleString()} NEAR`);
    console.log(`Total Combined NEAR: ${summary.total_near_combined.toLocaleString()} NEAR`);
    console.log('');
    console.log('📈 Statistics:');
    console.log(`Average NEAR Value per Account: ${summary.avg_near_value.toFixed(2)} NEAR`);
    console.log(`Average NEAR Staked per Account: ${summary.avg_near_staked.toFixed(2)} NEAR`);
    console.log('');
    console.log('👥 Account Distribution:');
    console.log(`Accounts with NEAR Value > 0: ${summary.accounts_with_near_value.toLocaleString()}`);
    console.log(`Accounts with NEAR Staked > 0: ${summary.accounts_with_near_staked.toLocaleString()}`);
    console.log(`Accounts with Any Balance > 0: ${summary.accounts_with_any_balance.toLocaleString()}`);
    console.log('');
    console.log('📅 Data Range:');
    console.log(`Earliest Account Update: ${new Date(summary.earliest_account_update).toISOString().split('T')[0]}`);
    console.log(`Most Recent Account Update: ${new Date(summary.most_recent_account_update).toISOString().split('T')[0]}`);
    console.log(`Total Events Processed: ${summary.total_account_state_events.toLocaleString()}`);

    return summary;

  } catch (error) {
    console.error('❌ Error calculating total account values:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
}

// Main execution - only run when called directly (not when imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  getTotalAccountValues()
    .then(summary => {
      // Output JSON for API consumption
      console.log('\n' + JSON.stringify(summary, null, 2));
    })
    .catch(console.error);
}

import axios from 'axios';
import { cfg } from './config.js';
import { hogql } from './posthog.js';

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

/**
 * Get total NEAR value and staking amounts for all unique accounts using their latest values
 * Only includes mainnet network events
 */
export async function getTotalAccountValues(): Promise<AccountValueSummary> {
  try {
    console.log('🔍 Fetching account value summary from PostHog...');
    
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
        count() AS total_unique_accounts,
        sum(near_value_numeric) AS total_near_value,
        sum(near_staked_numeric) AS total_near_staked,
        sum(near_staked_by_validator_numeric) AS total_near_staked_by_validator,
        sum(near_value_numeric + near_staked_numeric + near_staked_by_validator_numeric) AS total_near_combined,
        avg(near_value_numeric) AS avg_near_value,
        avg(near_staked_numeric) AS avg_near_staked,
        countIf(near_value_numeric > 0) AS accounts_with_near_value,
        countIf(near_staked_numeric > 0) AS accounts_with_near_staked,
        countIf(near_value_numeric > 0 OR near_staked_numeric > 0) AS accounts_with_any_balance,
        min(latest_timestamp) AS earliest_account_update,
        max(latest_timestamp) AS most_recent_account_update,
        sum(total_events_for_account) AS total_account_state_events
      FROM converted_values
    `;

    console.log('📊 Executing account values query...');
    const response = await hogql<{ results: any[][] }>(query);
    
    if (!response?.results?.[0]) {
      throw new Error('No results returned from account values query');
    }

    const [
      total_unique_accounts,
      total_near_value,
      total_near_staked,
      total_near_staked_by_validator,
      total_near_combined,
      avg_near_value,
      avg_near_staked,
      accounts_with_near_value,
      accounts_with_near_staked,
      accounts_with_any_balance,
      earliest_account_update,
      most_recent_account_update,
      total_account_state_events
    ] = response.results[0];

    const summary: AccountValueSummary = {
      total_unique_accounts: Number(total_unique_accounts) || 0,
      total_near_value: Number(total_near_value) || 0,
      total_near_staked: Number(total_near_staked) || 0,
      total_near_staked_by_validator: Number(total_near_staked_by_validator) || 0,
      total_near_combined: Number(total_near_combined) || 0,
      avg_near_value: Number(avg_near_value) || 0,
      avg_near_staked: Number(avg_near_staked) || 0,
      accounts_with_near_value: Number(accounts_with_near_value) || 0,
      accounts_with_near_staked: Number(accounts_with_near_staked) || 0,
      accounts_with_any_balance: Number(accounts_with_any_balance) || 0,
      earliest_account_update: String(earliest_account_update) || '',
      most_recent_account_update: String(most_recent_account_update) || '',
      total_account_state_events: Number(total_account_state_events) || 0
    };

    console.log('✅ Account values query completed successfully');
    console.log(`📈 Found ${summary.total_unique_accounts} unique accounts with ${summary.total_near_combined.toFixed(2)} total NEAR`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Error fetching account values:', error);
    throw error;
  }
}

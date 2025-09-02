-- HogQL Query to sum all near_value and near_staked for unique addresses (latest values only)
-- Only includes mainnet network events

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
  min(latest_timestamp) AS earliest_account_update,
  max(latest_timestamp) AS most_recent_account_update,
  
  -- Total events processed
  sum(total_events_for_account) AS total_account_state_events
  
FROM converted_values;

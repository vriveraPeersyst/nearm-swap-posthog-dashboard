import axios from 'axios';
import { cfg } from './config.js';

function q(v: string) { 
  return `'${v.replace(/'/g, "''")}'`; 
}

async function hogql<T = any>(query: string): Promise<T> {
  const url = `${cfg.POSTHOG_BASE_URL.replace(/\/$/, '')}/api/projects/${cfg.POSTHOG_PROJECT_ID}/query/`;
  const { data } = await axios.post(
    url,
    { query: { kind: 'HogQLQuery', query } },
    { headers: { Authorization: `Bearer ${cfg.POSTHOG_API_KEY}` } }
  );
  return data;
}

async function quickDebugLoadAccounts(): Promise<void> {
  console.log('🔍 Quick debug of load_accounts events...\n');

  // Get a very small sample with all raw data
  const query = `
    SELECT
      uuid,
      toString(timestamp) AS timestamp,
      distinct_id,
      person_id,
      properties
    FROM events
    WHERE event = 'load_accounts'
    ORDER BY timestamp DESC
    LIMIT 3
  `;

  try {
    const result = await hogql<{ results: any[] }>(query);
    
    console.log(`Found ${result.results.length} events`);
    
    result.results.forEach((row, idx) => {
      console.log(`\n=== Event ${idx + 1} ===`);
      console.log(`UUID: ${row[0]}`);
      console.log(`Timestamp: ${row[1]}`);
      console.log(`Distinct ID: ${row[2]}`);
      console.log(`Person ID: ${row[3]}`);
      console.log(`Properties type: ${typeof row[4]}`);
      console.log(`Properties:`, row[4]);
      
      if (row[4] && typeof row[4] === 'object') {
        console.log(`Properties keys:`, Object.keys(row[4]));
        if (row[4].account_ids) {
          console.log(`account_ids value:`, row[4].account_ids);
          console.log(`account_ids type:`, typeof row[4].account_ids);
          console.log(`account_ids is array:`, Array.isArray(row[4].account_ids));
        }
      }
    });

    // Test specific query for account_ids
    console.log('\n🔍 Testing specific account_ids query...');
    const accountIdsQuery = `
      SELECT
        properties.account_ids
      FROM events
      WHERE event = 'load_accounts' AND properties.account_ids IS NOT NULL
      LIMIT 5
    `;

    const accountIdsResult = await hogql<{ results: any[] }>(accountIdsQuery);
    console.log(`Found ${accountIdsResult.results.length} events with account_ids`);
    
    accountIdsResult.results.forEach((row, idx) => {
      console.log(`Account IDs ${idx + 1}:`, row[0]);
      console.log(`Type:`, typeof row[0]);
      console.log(`Is Array:`, Array.isArray(row[0]));
    });

  } catch (error) {
    console.error('❌ Error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  quickDebugLoadAccounts().catch(console.error);
}

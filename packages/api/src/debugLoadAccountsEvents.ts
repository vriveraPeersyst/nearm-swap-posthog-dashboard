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

async function debugLoadAccountsEvents(): Promise<void> {
  console.log('🔍 Debugging load_accounts events structure...\n');

  // First get a few sample events to see their structure
  const sampleQuery = `
    SELECT
      uuid,
      toString(timestamp) AS timestamp,
      distinct_id,
      person_id,
      properties
    FROM events
    WHERE event = 'load_accounts'
    ORDER BY timestamp DESC
    LIMIT 5
  `;

  try {
    console.log('📋 Sample load_accounts events:');
    const sampleResult = await hogql<{ results: any[] }>(sampleQuery);
    
    if (sampleResult.results.length === 0) {
      console.log('❌ No load_accounts events found.');
      return;
    }

    sampleResult.results.forEach((row, idx) => {
      console.log(`\n--- Event ${idx + 1} ---`);
      console.log(`UUID: ${row[0]}`);
      console.log(`Timestamp: ${row[1]}`);
      console.log(`Distinct ID: ${row[2]}`);
      console.log(`Person ID: ${row[3]}`);
      console.log(`Properties:`, JSON.stringify(row[4], null, 2));
    });

    // Now let's check what distinct properties exist across all load_accounts events
    console.log('\n🔍 Analyzing all property keys in load_accounts events...');
    
    const propertiesQuery = `
      SELECT DISTINCT JSONExtractKeysAndValues(properties, 'String') as prop_pairs
      FROM events
      WHERE event = 'load_accounts'
      LIMIT 1000
    `;

    const propertiesResult = await hogql<{ results: any[] }>(propertiesQuery);
    const allKeys = new Set<string>();
    
    propertiesResult.results.forEach(row => {
      const propPairs = row[0];
      if (Array.isArray(propPairs)) {
        for (let i = 0; i < propPairs.length; i += 2) {
          if (propPairs[i]) {
            allKeys.add(propPairs[i]);
          }
        }
      }
    });

    console.log('\n📊 All property keys found in load_accounts events:');
    Array.from(allKeys).sort().forEach(key => {
      console.log(`   - ${key}`);
    });

    // Let's also check if there are any address-like fields in the properties
    console.log('\n🔍 Looking for address-like properties...');
    const addressLikeKeys = Array.from(allKeys).filter(key => 
      key.toLowerCase().includes('address') || 
      key.toLowerCase().includes('account') ||
      key.toLowerCase().includes('wallet') ||
      key.toLowerCase().includes('id')
    );

    if (addressLikeKeys.length > 0) {
      console.log('📍 Found potentially address-related properties:');
      addressLikeKeys.forEach(key => {
        console.log(`   - ${key}`);
      });

      // Sample values for address-like properties
      for (const key of addressLikeKeys.slice(0, 3)) { // Check first 3 keys
        const valueQuery = `
          SELECT DISTINCT properties.${key} as value
          FROM events
          WHERE event = 'load_accounts' AND properties.${key} IS NOT NULL
          LIMIT 10
        `;
        
        try {
          const valueResult = await hogql<{ results: any[] }>(valueQuery);
          console.log(`\n📋 Sample values for "${key}":`);
          valueResult.results.forEach(row => {
            console.log(`   ${row[0]}`);
          });
        } catch (error) {
          console.log(`   Could not query values for "${key}"`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error debugging load_accounts events:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  debugLoadAccountsEvents().catch(console.error);
}

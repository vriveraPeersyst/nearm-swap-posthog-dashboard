import axios from 'axios';
import { cfg } from './config.js';
import * as fs from 'fs';
import * as path from 'path';

export type AccountStateEventRow = {
  uuid: string;
  timestamp: string;
  account_id?: string | null;
  near_value?: string | null;
  near_staked?: string | null;
  near_staked_by_validator?: string | null;
  distinct_id?: string | null;
  user_id?: string | null;
};

export type AccountState = {
  account_id: string;
  near_value: string | null;
  near_staked: string | null;
  near_staked_by_validator: string | null;
  last_updated: string;
};

function q(v: string) { 
  return `'${v.replace(/'/g, "''")}'`; 
}

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
 * Fetch one batch of account_state events from mainnet only, ordered from newest to oldest.
 */
async function fetchAccountStateBatch(offset: number, limit: number): Promise<AccountStateEventRow[]> {
  const query = `
    SELECT
      uuid,
      toString(timestamp) AS timestamp,
      properties.account_id AS account_id,
      properties.near_value AS near_value,
      properties.near_staked AS near_staked,
      properties.near_staked_by_validator AS near_staked_by_validator,
      distinct_id,
      person_id AS user_id
    FROM events
    WHERE event = 'account_state'
      AND properties.network = 'mainnet'
    ORDER BY timestamp DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  console.log(`Fetching batch with offset ${offset}, limit ${limit}`);
  
  const res = await hogql<{ results: any[] }>(query);
  const results = (res?.results ?? []).map((r) => ({
    uuid: r[0],
    timestamp: r[1],
    account_id: r[2],
    near_value: r[3],
    near_staked: r[4],
    near_staked_by_validator: r[5],
    distinct_id: r[6],
    user_id: r[7]
  }));

  // Debug: log first few results
  if (offset === 0 && results.length > 0) {
    console.log('\n🔍 Debug - First few results:');
    results.slice(0, 3).forEach((result, idx) => {
      console.log(`  Event ${idx + 1}:`);
      console.log(`    UUID: ${result.uuid}`);
      console.log(`    Timestamp: ${result.timestamp}`);
      console.log(`    account_id: ${result.account_id}`);
      console.log(`    near_value: ${result.near_value}`);
      console.log(`    near_staked: ${result.near_staked}`);
      console.log(`    distinct_id: ${result.distinct_id}`);
    });
    console.log('');
  }

  return results;
}

/**
 * Save progress to files
 */
function saveProgress(
  accountsMap: Map<string, AccountState>, 
  processed: number, 
  offset: number,
  outputDir: string
): void {
  console.log(`\n💾 Saving progress... (${accountsMap.size} accounts, ${processed} events processed)`);
  
  // Convert Map to sorted array for export
  const accountsArray = Array.from(accountsMap.values()).sort((a, b) => a.account_id.localeCompare(b.account_id));
  
  // Save accounts data as CSV
  const csvFile = path.join(outputDir, 'account_state_data.csv');
  const csvHeader = 'account_id,near_value,near_staked,near_staked_by_validator,last_updated\n';
  const csvContent = accountsArray
    .map(account => 
      `${account.account_id},${account.near_value || ''},${account.near_staked || ''},${account.near_staked_by_validator || ''},${account.last_updated}`
    )
    .join('\n');
  fs.writeFileSync(csvFile, csvHeader + csvContent);
  
  // Save unique addresses list
  const addressesFile = path.join(outputDir, 'account_state_addresses.txt');
  const addressesList = accountsArray.map(account => account.account_id).join('\n');
  fs.writeFileSync(addressesFile, addressesList);
  
  // Save addresses as CSV
  const addressesCsvFile = path.join(outputDir, 'account_state_addresses.csv');
  const addressesCsvContent = 'account_id\n' + accountsArray.map(account => account.account_id).join('\n');
  fs.writeFileSync(addressesCsvFile, addressesCsvContent);
  
  // Save resume info
  const resumeFile = path.join(outputDir, 'resume_info.json');
  fs.writeFileSync(resumeFile, JSON.stringify({
    processed,
    offset,
    accounts_found: accountsMap.size,
    last_saved: new Date().toISOString()
  }, null, 2));
  
  console.log(`   ✅ Saved to ${outputDir}/`);
}

/**
 * Extract all unique addresses from account_state events with latest data for each account
 * Only includes mainnet network events
 */
export async function extractAccountStateAddresses(): Promise<void> {
  console.log('🔍 Extracting account states from account_state events (mainnet only)...\n');

  // First, get the total count and date range
  const countQuery = `
    SELECT 
      count() as total_events,
      min(timestamp) as earliest_timestamp,
      max(timestamp) as latest_timestamp
    FROM events 
    WHERE event = 'account_state'
      AND properties.network = 'mainnet'
  `;

  try {
    const countResult = await hogql<{ results: any[] }>(countQuery);
    const [totalEvents, earliestTimestamp, latestTimestamp] = countResult.results[0];
    
    const earliestDate = new Date(earliestTimestamp).toISOString().split('T')[0];
    const latestDate = new Date(latestTimestamp).toISOString().split('T')[0];
    
    console.log(`📊 account_state Events Summary (mainnet only):`);
    console.log(`   Total events: ${totalEvents.toLocaleString()}`);
    console.log(`   Earliest event: ${earliestDate}`);
    console.log(`   Latest event: ${latestDate}`);
    console.log('');

    if (totalEvents === 0) {
      console.log('❌ No account_state events found in PostHog for mainnet.');
      return;
    }

    // Setup output directory
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check for resume info
    const resumeFile = path.join(outputDir, 'resume_info.json');
    let startOffset = 0;
    let processed = 0;
    const accountsMap = new Map<string, AccountState>();
    
    if (fs.existsSync(resumeFile)) {
      try {
        const resumeData = JSON.parse(fs.readFileSync(resumeFile, 'utf8'));
        startOffset = resumeData.offset || 0;
        processed = resumeData.processed || 0;
        console.log(`📂 Resuming from offset ${startOffset}, previously processed ${processed} events`);
      } catch (error) {
        console.log('⚠️  Could not read resume file, starting fresh');
      }
    }

    // Now fetch all events in batches, processing from newest to oldest
    let offset = startOffset;
    const limit = cfg.BATCH_SIZE;
    const saveInterval = 10000; // Save every 10,000 events

    console.log('📥 Fetching account_state events...');

    while (true) {
      const batch = await fetchAccountStateBatch(offset, limit);
      if (batch.length === 0) break;

      for (const event of batch) {
        processed++;
        
        if (event.account_id) {
          const accountId = event.account_id;
          const timestamp = event.timestamp;
          
          // Only update if this is newer data for this account (or first time seeing it)
          const existing = accountsMap.get(accountId);
          if (!existing || new Date(timestamp) > new Date(existing.last_updated)) {
            accountsMap.set(accountId, {
              account_id: accountId,
              near_value: event.near_value || null,
              near_staked: event.near_staked || null,
              near_staked_by_validator: event.near_staked_by_validator || null,
              last_updated: timestamp
            });
          }
        }

        if (processed % 5000 === 0) {
          console.log(`   Processed ${processed.toLocaleString()} events, found ${accountsMap.size} unique accounts`);
        }

        // Save progress periodically
        if (processed % saveInterval === 0) {
          saveProgress(accountsMap, processed, offset + batch.length, outputDir);
        }
      }

      offset += limit;
      
      // Add a small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Processing complete!');
    console.log(`   Total events processed: ${processed.toLocaleString()}`);
    console.log(`   Unique accounts found: ${accountsMap.size.toLocaleString()}`);

    // Final save
    saveProgress(accountsMap, processed, offset, outputDir);

    // Show some sample accounts
    const accountsArray = Array.from(accountsMap.values()).sort((a, b) => a.account_id.localeCompare(b.account_id));
    console.log('\n📋 Sample accounts (first 10):');
    accountsArray.slice(0, 10).forEach((account, idx) => {
      console.log(`   ${idx + 1}. ${account.account_id} (NEAR: ${account.near_value || '0'}, Staked: ${account.near_staked || '0'})`);
    });

    if (accountsArray.length > 10) {
      console.log(`   ... and ${accountsArray.length - 10} more`);
    }

    // Clean up resume file on successful completion
    if (fs.existsSync(resumeFile)) {
      fs.unlinkSync(resumeFile);
    }

  } catch (error) {
    console.error('❌ Error extracting account_state addresses:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
}

// Main execution
if (require.main === module) {
  extractAccountStateAddresses().catch(console.error);
}

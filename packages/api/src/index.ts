import { getSwapMetrics } from './swapMetrics.js';

async function main() {
  try {
    const results = await getSwapMetrics();
    console.log(JSON.stringify(results, null, 2));
  } catch (error: any) {
    if (error?.response?.data) {
      console.error('HTTP error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error?.message || error);
    }
    process.exit(1);
  }
}

main().catch((err: any) => {
  if (err?.response?.data) {
    console.error('HTTP error:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.error('Error:', err?.message || err);
  }
  process.exit(1);
});
import { getFeeLeaders } from './feeLeaders.js';

getFeeLeaders()
  .then(data => console.log(JSON.stringify(data)))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });

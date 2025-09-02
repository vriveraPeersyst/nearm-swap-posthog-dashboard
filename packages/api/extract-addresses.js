#!/usr/bin/env node

import { extractLoadAccountsAddresses } from './src/extractLoadAccountsAddresses.js';

extractLoadAccountsAddresses().catch(console.error);

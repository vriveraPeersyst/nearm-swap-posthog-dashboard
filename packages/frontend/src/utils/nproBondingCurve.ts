import Decimal from 'decimal.js';

// NPRO bonding curve constants
export const BONDING_CURVE_CONFIG = {
  r0: '1892.824882239740',
  lambda: '0.00023664977144416'
} as const;

// NPRO decimals (same as NEAR - 24 decimals for yoctoNPRO)
export const NPRO_DECIMALS = 24;

// Key dates
export const PRE_STAKING_END_DATE = new Date('2025-12-15T00:00:00Z');
export const STAKING_END_DATE = new Date('2030-09-15T00:00:00Z');

// NEAR blockchain constants
export const BLOCKS_PER_EPOCH = 43200; // 1 epoch = 43200 blocks
export const DEFAULT_BLOCK_TIME = 0.623; // Default block time in seconds

// NPRO distribution start parameters
export const NPRO_START_BLOCK = 164137435; // Block when NPRO distribution started
export const NPRO_START_EPOCH = 1; // Epoch 1 is when NPRO distribution started
export const NPRO_START_DATE = new Date('2024-12-15T00:00:00Z'); // Approximate start date

// RPC endpoints for fetching block number
const RPC_ENDPOINTS = [
  'https://near.lava.build',
  'https://near.blockpi.network/v1/rpc/public',
  'https://rpc.shitzuapes.xyz',
  'https://rpc.mainnet.near.org',
];

// Cache for current block number
let cachedCurrentBlock: number | null = null;
let currentBlockCacheExpiry: number = 0;

/**
 * Fetch current block number from NEAR RPC
 */
export async function fetchCurrentBlockNumber(): Promise<number> {
  const now = Date.now();
  if (cachedCurrentBlock !== null && now < currentBlockCacheExpiry) {
    return cachedCurrentBlock;
  }

  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'dontcare',
          method: 'status',
          params: []
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      const blockHeight = data.result?.sync_info?.latest_block_height;
      
      if (blockHeight) {
        cachedCurrentBlock = blockHeight;
        currentBlockCacheExpiry = now + (60 * 1000); // Cache for 1 minute
        return blockHeight;
      }
    } catch (error) {
      console.warn(`Failed to fetch block from ${rpcUrl}:`, error);
    }
  }

  // Fallback: estimate based on time
  if (cachedCurrentBlock !== null) {
    return cachedCurrentBlock;
  }
  
  // Rough estimate if all RPCs fail
  const secondsSinceStart = (now - NPRO_START_DATE.getTime()) / 1000;
  return NPRO_START_BLOCK + Math.floor(secondsSinceStart / DEFAULT_BLOCK_TIME);
}

/**
 * Convert block number to epoch number
 */
export function blockToEpoch(blockNumber: number): number {
  const blocksSinceStart = Math.max(0, blockNumber - NPRO_START_BLOCK);
  const epochsSinceStart = Math.floor(blocksSinceStart / BLOCKS_PER_EPOCH);
  return NPRO_START_EPOCH + epochsSinceStart;
}

/**
 * Get current epoch
 */
export async function getCurrentEpoch(): Promise<number> {
  const currentBlock = await fetchCurrentBlockNumber();
  return blockToEpoch(currentBlock);
}

/**
 * Get epoch duration in seconds
 */
export function getEpochDurationSeconds(blockTime: number = DEFAULT_BLOCK_TIME): number {
  return BLOCKS_PER_EPOCH * blockTime;
}

/**
 * Get epoch duration in hours
 */
export function getEpochDurationHours(blockTime: number = DEFAULT_BLOCK_TIME): number {
  return getEpochDurationSeconds(blockTime) / 3600;
}

/**
 * Calculate end epoch based on staking end date
 */
export async function getEndEpoch(): Promise<number> {
  const currentBlock = await fetchCurrentBlockNumber();
  const now = Date.now();
  const endTime = STAKING_END_DATE.getTime();
  
  const secondsRemaining = (endTime - now) / 1000;
  const blocksRemaining = Math.floor(secondsRemaining / DEFAULT_BLOCK_TIME);
  const endBlock = currentBlock + blocksRemaining;
  
  return blockToEpoch(endBlock);
}

/**
 * NPRO bonding curve function: R(t) = R0 * e^(-λt)
 * Returns NPRO amount distributed in epoch t (in human-readable format)
 */
export function getNproBondingCurveValue(epochIndex: number): number {
  const r0 = new Decimal(BONDING_CURVE_CONFIG.r0);
  const lambda = new Decimal(BONDING_CURVE_CONFIG.lambda);

  // Calculate R(t) = R0 * e^(-λt)
  // epochIndex is 0-based (first distribution epoch = 0)
  const exponent = lambda.mul(epochIndex).mul(-1);
  const result = r0.mul(Decimal.exp(exponent));
  
  return result.toNumber();
}

/**
 * Calculate total NPRO to be distributed from startEpoch to endEpoch
 */
export function calculateTotalRemainingDistribution(
  currentEpoch: number,
  endEpoch: number
): number {
  let total = 0;
  
  for (let epoch = currentEpoch; epoch <= endEpoch; epoch++) {
    const epochIndex = epoch - NPRO_START_EPOCH;
    total += getNproBondingCurveValue(epochIndex);
  }
  
  return total;
}

/**
 * Get distribution info including current epoch, remaining epochs, days, and NPRO
 */
export interface DistributionInfo {
  currentEpoch: number;
  endEpoch: number;
  remainingEpochs: number;
  remainingDays: number;
  totalRemainingNpro: number;
  epochDurationHours: number;
  nproPerCurrentEpoch: number;
}

export async function getDistributionInfo(): Promise<DistributionInfo> {
  const currentEpoch = await getCurrentEpoch();
  const endEpoch = await getEndEpoch();
  const remainingEpochs = Math.max(0, endEpoch - currentEpoch);
  
  const epochDurationHours = getEpochDurationHours();
  const remainingDays = (remainingEpochs * epochDurationHours) / 24;
  
  const totalRemainingNpro = calculateTotalRemainingDistribution(currentEpoch, endEpoch);
  const nproPerCurrentEpoch = getNproBondingCurveValue(currentEpoch - NPRO_START_EPOCH);
  
  return {
    currentEpoch,
    endEpoch,
    remainingEpochs,
    remainingDays: Math.floor(remainingDays),
    totalRemainingNpro,
    epochDurationHours,
    nproPerCurrentEpoch
  };
}

/**
 * Calculate how many epochs the distribution account balance can cover
 * based on the bonding curve distribution rate
 */
export interface DistributionRunwayInfo {
  currentEpoch: number;
  epochDurationHours: number;
  nproPerCurrentEpoch: number;
  distributorBalance: number;
  epochsUntilEmpty: number;
  daysUntilEmpty: number;
  lastFundedEpoch: number;
  totalToDistribute: number;
}

export async function calculateDistributionRunway(distributorBalance: number): Promise<DistributionRunwayInfo> {
  const currentEpoch = await getCurrentEpoch();
  const epochDurationHours = getEpochDurationHours();
  const nproPerCurrentEpoch = getNproBondingCurveValue(currentEpoch - NPRO_START_EPOCH);
  
  // Simulate distribution until balance runs out
  let remainingBalance = distributorBalance;
  let epochsUntilEmpty = 0;
  let totalToDistribute = 0;
  let epoch = currentEpoch;
  
  // Cap at a reasonable max to prevent infinite loops (10 years worth of epochs)
  const maxEpochs = Math.floor((10 * 365 * 24) / epochDurationHours);
  
  while (remainingBalance > 0 && epochsUntilEmpty < maxEpochs) {
    const epochIndex = epoch - NPRO_START_EPOCH;
    const distributionAmount = getNproBondingCurveValue(epochIndex);
    
    if (distributionAmount <= remainingBalance) {
      remainingBalance -= distributionAmount;
      totalToDistribute += distributionAmount;
      epochsUntilEmpty++;
      epoch++;
    } else {
      // Partial epoch - balance can't cover full distribution
      // Count the fraction of the epoch it can cover
      const fraction = remainingBalance / distributionAmount;
      epochsUntilEmpty += fraction;
      totalToDistribute += remainingBalance;
      remainingBalance = 0;
    }
  }
  
  const daysUntilEmpty = (epochsUntilEmpty * epochDurationHours) / 24;
  const lastFundedEpoch = currentEpoch + Math.floor(epochsUntilEmpty);
  
  return {
    currentEpoch,
    epochDurationHours,
    nproPerCurrentEpoch,
    distributorBalance,
    epochsUntilEmpty: Math.floor(epochsUntilEmpty),
    daysUntilEmpty: Math.floor(daysUntilEmpty),
    lastFundedEpoch,
    totalToDistribute
  };
}

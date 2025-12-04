/**
 * Velvet Sentinel - Phala Enclave Package
 * 
 * Provides TEE (Trusted Execution Environment) integration using Phala dStack
 */

export { TEEWorker, CHAINS } from './worker.js';
export type { TEEAttestation, TEEKeyResult } from './worker.js';

// Re-export locally defined types from worker
export type { TEEConfig, DerivedWallet } from './worker.js';

import { SomniaMode } from '../../types/somnia-types.js';

/**
 * Energy Synchronization Engine
 *
 * Bidirectional control:
 * 1. φ(t) → AENEA energy: Somatic energy affects cognitive resources
 * 2. AENEA energy → φ(t): Cognitive consumption affects hormonal field
 */

export interface EnergySyncState {
  aeneaEnergy: number;
  somniaPhi: number;
  syncRatio: number;
  effectiveMax: number;
  energyMode: 'critical' | 'low' | 'full';
}

/**
 * Synchronize AENEA and SOMNIA energy
 */
export function synchronizeEnergy(
  aeneaCurrent: number,
  aeneaMax: number,
  somniaPhi: number,
  syncRatio: number = 0.5
): EnergySyncState {
  // φ(t) affects theoretical max for AENEA
  const phiInfluencedMax = aeneaMax * (somniaPhi / 100) * syncRatio +
                           aeneaMax * (1 - syncRatio);

  // Adjust current energy
  const adjustedEnergy = Math.min(aeneaCurrent, phiInfluencedMax);

  // Determine energy mode
  const energyMode = determineEnergyMode(adjustedEnergy, phiInfluencedMax);

  return {
    aeneaEnergy: adjustedEnergy,
    somniaPhi,
    syncRatio,
    effectiveMax: phiInfluencedMax,
    energyMode
  };
}

/**
 * Determine energy mode
 */
function determineEnergyMode(
  current: number,
  max: number
): 'critical' | 'low' | 'full' {
  const ratio = current / max;
  if (ratio < 0.2) return 'critical';
  if (ratio < 0.5) return 'low';
  return 'full';
}

/**
 * Calculate energy recovery rate based on SOMNIA mode
 */
export function calculateRecoveryRate(
  somniaMode: SomniaMode,
  baseRate: number
): number {
  switch (somniaMode) {
    case 'dream':
      return baseRate * 2;  // Double recovery in dream mode
    case 'flow':
      return baseRate * 0.5; // Reduced recovery in flow (consuming)
    case 'awake':
    default:
      return baseRate;
  }
}

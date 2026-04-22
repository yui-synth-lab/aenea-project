import { SomniaState, AffectiveCoreState, SomaticState, DPDInfluence, AffectiveBias } from '../../types/somnia-types.js';

/** Minimal DPD values needed for reflective return */
interface DPDValues {
  empathy: number;
  coherence: number;
  dissonance: number;
}

/**
 * SAIP - Somnia-AENEA Interface Protocol
 *
 * Three main functions:
 * 1. Emotive Sync: SOMNIA → AENEA DPD
 * 2. Reflective Return: AENEA DPD → SOMNIA
 * 3. Temporal Reconciliation: Time field synchronization
 */

interface EmotiveSyncInput {
  affective: AffectiveCoreState;
  somatic: SomaticState;
}

/**
 * Emotive Sync: Transform SOMNIA state to DPD influence
 * Spec 5.1: empathy = λ * 0.5 + ψ * 0.5 (raw lambda, no clamping)
 * Accepts SomniaState or just { affective, somatic } to avoid circular getState() calls.
 */
export function emotiveSync(somnia: EmotiveSyncInput | SomniaState): DPDInfluence {
  const { affective, somatic } = somnia;

  return {
    empathy: somatic.lambda * 0.5 + affective.psi * 0.5,
    coherence: affective.psi * 0.8 + (1 - affective.theta) * 0.2,
    dissonance: affective.xi * 0.6 + affective.theta * 0.4
  };
}

/**
 * Reflective Return: Transform AENEA DPD to affective bias
 */
export function reflectiveReturn(dpd: DPDValues): AffectiveBias {
  return {
    pleasureBias: dpd.empathy * 0.3,
    coherenceBias: dpd.coherence * 0.5,
    dissonanceTrigger: dpd.dissonance > 0.7 ? 0.2 : 0
  };
}

/**
 * Temporal Reconciliation: Synchronize time fields
 */
export function temporalReconciliation(
  somniaTheta: number,
  aeneaClock: number
): number {
  // θ高い (時間に拘束) → 思考速度低下
  // θ低い (時間が流動) → 思考速度上昇
  const temporalDilation = 1.0 + (somniaTheta - 0.5) * 0.5;
  return aeneaClock * temporalDilation;
}

/**
 * Calculate sync quality between SOMNIA and AENEA
 */
export function calculateSyncQuality(
  somnia: SomniaState,
  aeneaDPD: DPDValues
): number {
  const influence = emotiveSync(somnia);

  // Calculate correlation between SOMNIA influence and AENEA DPD
  const empathyCorr = 1 - Math.abs(influence.empathy - aeneaDPD.empathy);
  const coherenceCorr = 1 - Math.abs(influence.coherence - aeneaDPD.coherence);
  const dissonanceCorr = 1 - Math.abs(influence.dissonance - aeneaDPD.dissonance);

  return (empathyCorr + coherenceCorr + dissonanceCorr) / 3;
}

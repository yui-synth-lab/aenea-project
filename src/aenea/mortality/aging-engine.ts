/**
 * Aging Engine - Calculations for gradual somatic and cognitive decay
 */

import { AgingPhase } from './lifespan-manager.js';

export class AgingEngine {
  /**
   * Helper to clamp values to [0, 1] range
   */
  private static clamp01(val: number): number {
    return Math.max(0, Math.min(1, val));
  }

  /**
   * Somnia Integration - Applies aging adjustments to Somnia state
   * Updates somatic energy storage (phi), hormones (mu), and affective temporal constraints (theta)
   */
  static applyAgingToSomnia(somniaState: any, vitality: number): any {
    // Return early if vitality is full
    if (vitality >= 1.0) return somniaState;

    const somatic = somniaState.somatic || {};
    const mu = somatic.mu || { serotonin: 0.5, dopamine: 0.5, cortisol: 0.3, oxytocin: 0.4 };
    const affective = somniaState.affective || {};

    // 1. somatic.phi: Energy storage limit decreases
    const rawPhi = somatic.phi ?? 100;
    const adjustedPhi = rawPhi * vitality;

    // 2. mu: Hormonal shifts (cortisol rises, others decay)
    const adjustedSerotonin = this.clamp01((mu.serotonin ?? 0.5) * vitality);
    const adjustedDopamine = this.clamp01((mu.dopamine ?? 0.5) * vitality);
    
    // Cortisol (stress) increases as vitality decreases (avoid division by zero/extreme values)
    const divisor = Math.max(0.01, vitality);
    const adjustedCortisol = this.clamp01((mu.cortisol ?? 0.3) / divisor);
    
    const adjustedOxytocin = this.clamp01((mu.oxytocin ?? 0.4) * vitality);

    // 3. affective.theta: Time anchoring constraint increases (binding stronger to the present)
    const currentTheta = affective.theta ?? 0.5;
    const adjustedTheta = Math.min(1.0, currentTheta + (1.0 - vitality) * 0.3);

    return {
      ...somniaState,
      somatic: {
        ...somatic,
        phi: adjustedPhi,
        mu: {
          serotonin: adjustedSerotonin,
          dopamine: adjustedDopamine,
          cortisol: adjustedCortisol,
          oxytocin: adjustedOxytocin
        }
      },
      affective: {
        ...affective,
        theta: adjustedTheta
      }
    };
  }

  /**
   * DPD Integration - Adjusts dissonance and empathy scores based on aging
   * Dissonance is biased upwards, empathy slightly upwards
   */
  static applyDPDBiases(
    dpdScores: { empathy: number; coherence: number; dissonance: number },
    vitality: number
  ): { empathy: number; coherence: number; dissonance: number } {
    if (vitality >= 1.0) return dpdScores;

    const ageFactor = 1.0 - vitality;

    // dissonance_biased = dissonance + (1 - vitality) * 0.2
    const dissonanceBiased = this.clamp01(dpdScores.dissonance + ageFactor * 0.2);

    // empathy_biased = empathy + (1 - vitality) * 0.1
    const empathyBiased = this.clamp01(dpdScores.empathy + ageFactor * 0.1);

    return {
      empathy: empathyBiased,
      coherence: dpdScores.coherence, // Coherence is not directly biased
      dissonance: dissonanceBiased
    };
  }

  /**
   * Timing slowdown - Adds progressive delay (ms) simulating processing decay during Phase 3 & 4
   */
  static getProcessingDelay(phase: AgingPhase, vitality: number): number {
    if (phase === 'youth' || phase === 'maturity') {
      return 0;
    }

    // Delay scales from 0 to 3000ms as vitality falls to 0
    const delay = Math.round((1.0 - vitality) * 3000);
    return Math.max(0, Math.min(3000, delay));
  }
}

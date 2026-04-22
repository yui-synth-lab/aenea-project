import { AffectiveCoreState, SomaticState, HormonalField, TemporalAnchoringMode } from '../../../types/somnia-types.js';
import { calculateTemporalAnchoring } from './temporal-anchoring.js';

// Utility functions
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

/**
 * Affective Core - Layer 2
 *
 * Links emotion and self-coherence through:
 * - θ(t): Temporal Anchoring
 * - ψ(t): Self-Coherence
 * - ξ(t): Dissonance Load
 */
export class AffectiveCore {
  private theta: number = 0.5;
  private psi: number = 0.7;
  private xi: number = 0;

  private thetaEma: number = 0.5;
  private temporalMode: TemporalAnchoringMode = 'logit';

  constructor(
    initialState?: Partial<AffectiveCoreState>,
    mode: TemporalAnchoringMode = 'logit'
  ) {
    this.temporalMode = mode;
    if (initialState) {
      this.theta = initialState.theta ?? this.theta;
      this.psi = initialState.psi ?? this.psi;
      this.xi = initialState.xi ?? this.xi;
      this.thetaEma = this.theta;
    }
  }

  /**
   * Update θ(t) based on somatic state
   */
  updateTemporalAnchoring(somatic: SomaticState): void {
    const newTheta = calculateTemporalAnchoring(
      {
        lambda: somatic.lambda,
        phi: somatic.phi,
        xi: this.xi,
        mu: somatic.mu,
        prevTheta: this.theta,
        prevThetaEma: this.thetaEma
      },
      this.temporalMode
    );

    this.thetaEma = newTheta;
    this.theta = newTheta;
  }

  /**
   * Calculate ψ(t) self-coherence
   */
  updateCoherence(somatic: SomaticState): void {
    // Coherence increases when:
    // - Hormones are balanced
    // - Lambda is stable (not extreme)
    // - Energy is sufficient

    const hormonalBalance = 1 - this.calculateHormonalVariance(somatic.mu);
    const lambdaStability = 1 - Math.abs(somatic.lambda);
    const energyFactor = somatic.phi / 100;

    const targetPsi = (
      hormonalBalance * 0.3 +
      lambdaStability * 0.3 +
      energyFactor * 0.2 +
      (1 - this.xi) * 0.2
    );

    // Smooth transition
    this.psi += (targetPsi - this.psi) * 0.2;
    this.psi = clamp01(this.psi);
  }

  /**
   * Calculate hormonal variance from baseline
   */
  private calculateHormonalVariance(mu: HormonalField): number {
    const baseline = { serotonin: 0.5, dopamine: 0.5, cortisol: 0.3, oxytocin: 0.4 };
    let variance = 0;
    for (const key of Object.keys(mu) as (keyof HormonalField)[]) {
      variance += Math.pow(mu[key] - baseline[key], 2);
    }
    return Math.sqrt(variance / 4);
  }

  /** Maximum dissonance before capping — prevents runaway accumulation */
  static readonly XI_MAX = 2.0;

  /**
   * Accumulate dissonance load (capped at XI_MAX)
   */
  accumulateDissonance(amount: number): void {
    this.xi = Math.min(this.xi + amount, AffectiveCore.XI_MAX);
  }

  /**
   * Release dissonance (e.g., during dream mode)
   */
  releaseDissonance(amount: number): void {
    this.xi = Math.max(0, this.xi - amount);
  }

  /**
   * Check if dissonance exceeds critical threshold
   */
  isDissonanceCritical(threshold: number = 1.0): boolean {
    return this.xi >= threshold;
  }

  /**
   * Get current state
   */
  getState(): AffectiveCoreState {
    return {
      theta: this.theta,
      psi: this.psi,
      xi: this.xi
    };
  }

  /**
   * Set state
   */
  setState(state: Partial<AffectiveCoreState>): void {
    if (state.theta !== undefined) {
      this.theta = state.theta;
      this.thetaEma = state.theta;
    }
    if (state.psi !== undefined) this.psi = state.psi;
    if (state.xi !== undefined) this.xi = state.xi;
  }
}

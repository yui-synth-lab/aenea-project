import { SomaticState, HormonalField, ExternalStimulus } from '../../../types/somnia-types.js';

// Utility functions
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

/**
 * Somatic Layer - Layer 1
 *
 * Simulates bodily sensations and their temporal changes.
 * Generates pleasure/displeasure through:
 * - λ(t): Affective Gradient
 * - φ(t): Energy Reservoir
 * - μ(t): Hormonal Field
 */
export class SomaticLayer {
  private lambda: number = 0;
  private phi: number = 100;
  private mu: HormonalField = {
    serotonin: 0.5,
    dopamine: 0.5,
    cortisol: 0.3,
    oxytocin: 0.4
  };

  constructor(initialState?: Partial<SomaticState>) {
    if (initialState) {
      this.lambda = initialState.lambda ?? this.lambda;
      this.phi = initialState.phi ?? this.phi;
      this.mu = { ...this.mu, ...initialState.mu };
    }
  }

  /**
   * Process external stimulus
   */
  processStimulus(stimulus: ExternalStimulus): void {
    // Update affective gradient
    this.lambda += stimulus.valence * stimulus.significance * 0.2;
    this.lambda = Math.max(-1, Math.min(1, this.lambda));

    // Energy consumption based on arousal
    this.phi -= stimulus.arousal * 5;
    this.phi = Math.max(0, this.phi);

    // Update hormonal field
    this.updateHormonalFieldFromStimulus(stimulus);
  }

  /**
   * Update hormonal field based on stimulus
   */
  private updateHormonalFieldFromStimulus(stimulus: ExternalStimulus): void {
    if (stimulus.valence > 0) {
      this.mu.serotonin += 0.05;
      this.mu.dopamine += stimulus.significance * 0.1;
    } else {
      this.mu.cortisol += Math.abs(stimulus.valence) * 0.1;
      this.mu.serotonin -= 0.02;
    }

    if (stimulus.type === 'social' && stimulus.valence > 0) {
      this.mu.oxytocin += 0.05;
    }

    // Clamp all values
    this.mu.serotonin = clamp01(this.mu.serotonin);
    this.mu.dopamine = clamp01(this.mu.dopamine);
    this.mu.cortisol = clamp01(this.mu.cortisol);
    this.mu.oxytocin = clamp01(this.mu.oxytocin);
  }

  /**
   * Energy consumption
   */
  consumeEnergy(amount: number): boolean {
    if (this.phi >= amount) {
      this.phi -= amount;
      return true;
    }
    return false;
  }

  /**
   * Energy recovery
   */
  recoverEnergy(amount: number): void {
    this.phi = Math.min(100, this.phi + amount);
  }

  /**
   * Natural decay of λ towards neutral
   */
  decayAffectiveGradient(rate: number = 0.1): void {
    this.lambda *= (1 - rate);
  }

  /**
   * Natural decay of hormones towards baseline
   */
  decayHormonalField(rate: number = 0.05): void {
    const baseline: HormonalField = {
      serotonin: 0.5,
      dopamine: 0.5,
      cortisol: 0.3,
      oxytocin: 0.4
    };

    for (const key of Object.keys(this.mu) as (keyof HormonalField)[]) {
      this.mu[key] += (baseline[key] - this.mu[key]) * rate;
    }
  }

  /**
   * Get current state
   */
  getState(): SomaticState {
    return {
      lambda: this.lambda,
      phi: this.phi,
      mu: { ...this.mu }
    };
  }

  /**
   * Set state (for loading from database)
   */
  setState(state: Partial<SomaticState>): void {
    if (state.lambda !== undefined) this.lambda = state.lambda;
    if (state.phi !== undefined) this.phi = state.phi;
    if (state.mu) this.mu = { ...this.mu, ...state.mu };
  }
}

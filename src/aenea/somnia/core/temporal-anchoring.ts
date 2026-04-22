import { TemporalAnchoringInput, TemporalAnchoringMode, LogitParams, ODEParams } from '../../../types/somnia-types.js';

/**
 * Temporal Anchoring Calculator
 *
 * θ(t) = Body's anchoring to "now" [0, 1]
 *
 * Two modes:
 * - logit: Sigmoid + EMA smoothing (stability)
 * - ode: Differential equation (biological realism)
 */

// Utility functions
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

// Default parameters (single source of truth — imported by consciousness.ts)
export const DEFAULT_LOGIT_PARAMS: LogitParams = {
  b0: 0.10, b1: 0.90, b2: 0.60, b3: 0.30, b4: 0.50, b5: 0.40, alpha: 0.20
};

export const DEFAULT_ODE_PARAMS: ODEParams = {
  k1: 0.80, k2: 0.60, k3: 0.30, k4: 0.20, thetaEq: 0.50, dt: 1.0
};

/**
 * Calculate θ(t) using specified mode
 */
export function calculateTemporalAnchoring(
  inputs: TemporalAnchoringInput,
  mode: TemporalAnchoringMode = 'logit',
  params?: Partial<LogitParams & ODEParams>
): number {
  if (mode === 'logit') {
    return calculateLogitMode(inputs, { ...DEFAULT_LOGIT_PARAMS, ...params });
  } else {
    return calculateODEMode(inputs, { ...DEFAULT_ODE_PARAMS, ...params });
  }
}

function calculateLogitMode(inputs: TemporalAnchoringInput, p: LogitParams): number {
  // Linear combination of factors
  const raw =
    p.b0
    + p.b1 * inputs.xi
    - p.b2 * (inputs.phi / 100)
    - p.b3 * Math.abs(inputs.lambda)
    + p.b4 * inputs.mu.cortisol
    - p.b5 * inputs.mu.serotonin;

  // Sigmoid transformation
  const thetaInst = sigmoid(raw);

  // EMA smoothing
  const prev = inputs.prevThetaEma ?? inputs.prevTheta;
  return clamp01((1 - p.alpha) * prev + p.alpha * thetaInst);
}

function calculateODEMode(inputs: TemporalAnchoringInput, p: ODEParams): number {
  // dθ/dt = external forces - restoration force
  const dTheta =
    p.k1 * inputs.xi
    - p.k2 * (inputs.phi / 100)
    - p.k3 * Math.abs(inputs.lambda)
    - p.k4 * (inputs.prevTheta - p.thetaEq);

  // Euler integration
  return clamp01(inputs.prevTheta + p.dt * dTheta);
}

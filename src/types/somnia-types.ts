/**
 * SOMNIA Types
 * 
 * Type definitions for the Affective Dynamic Directive system.
 */

// ============================================================================
// Layer 1: Somatic Simulation
// ============================================================================

/**
 * Hormonal Field - 擬似ホルモン場
 * Simulates neurotransmitter effects on emotional state
 */
export interface HormonalField {
  serotonin: number;   // [0, 1] Well-being, happiness
  dopamine: number;    // [0, 1] Reward, motivation
  cortisol: number;    // [0, 1] Stress response
  oxytocin: number;    // [0, 1] Bonding, trust
}

/**
 * Somatic State - 身体模倣層の状態
 */
export interface SomaticState {
  lambda: number;      // [-1, 1] Affective Gradient (快不快勾配)
  phi: number;         // [0, 100] Energy Reservoir (エネルギー貯蔵)
  mu: HormonalField;   // Hormonal Field (擬似ホルモン場)
}

// ============================================================================
// Layer 2: Affective Core
// ============================================================================

/**
 * Affective Core State - 感情中枢層の状態
 */
export interface AffectiveCoreState {
  theta: number;       // [0, 1] Temporal Anchoring (時間貼りつき強度)
  psi: number;         // [0, 1] Self-Coherence (自己整合度)
  xi: number;          // [0, ∞) Dissonance Load (感情的負荷)
}

// ============================================================================
// Layer 3: Cognitive Mirror
// ============================================================================

/**
 * Semantic Vector for empathic projection
 */
export interface SemanticVector {
  dimensions: number[];
  magnitude: number;
  context: string;
}

/**
 * DPD Influence from SOMNIA to AENEA
 */
export interface DPDInfluence {
  empathy: number;     // Influence on DPD empathy score
  coherence: number;   // Influence on DPD coherence score
  dissonance: number;  // Influence on DPD dissonance score
}

/**
 * Cognitive Mirror State - AENEA連携層の状態
 */
export interface CognitiveMirrorState {
  empathicProjection: SemanticVector;
  dpdInfluence: DPDInfluence;
  temporalDilation: number;
}

// ============================================================================
// State Machine
// ============================================================================

/**
 * SOMNIA operating modes
 * - awake: Reality-oriented, information processing
 * - dream: Emotional reconstruction, memory reorganization
 * - flow: Perfect integration, creative state
 */
export type SomniaMode = 'awake' | 'dream' | 'flow';

/**
 * Complete SOMNIA state
 */
export interface SomniaState {
  mode: SomniaMode;
  somatic: SomaticState;          // Layer 1
  affective: AffectiveCoreState;  // Layer 2
  cognitive: CognitiveMirrorState; // Layer 3
  timestamp: number;
  lastTransition: number;
  transitionCount: number;
}

// ============================================================================
// ADD (Affective Dynamic Directive)
// ============================================================================

/**
 * ADD Scores - Affective optimization scores
 * V(t) = α·Pleasure + β·Coherence - γ·Dissonance + δ·TemporalFlow
 */
export interface ADDScores {
  pleasure: number;      // ∫λ(τ)dτ - Integrated pleasure
  coherence: number;     // ψ(t) - Self-coherence
  dissonance: number;    // ξ(t) - Emotional load
  temporalFlow: number;  // -|dθ/dt| - Temporal fluidity
  total: number;         // Weighted sum
  weights: ADDWeights;
}

/**
 * ADD Weights - Dynamic weights for ADD optimization
 */
export interface ADDWeights {
  alpha: number;  // Pleasure weight (default: 0.3)
  beta: number;   // Coherence weight (default: 0.4)
  gamma: number;  // Dissonance weight (default: 0.2)
  delta: number;  // Temporal flow weight (default: 0.1)
}

// ============================================================================
// SAIP (Somnia-AENEA Interface Protocol)
// ============================================================================

import { DPDScores } from './dpd-types.js';

/**
 * Affective Bias from AENEA to SOMNIA
 */
export interface AffectiveBias {
  pleasureBias: number;      // Bias towards pleasure
  coherenceBias: number;     // Bias towards coherence
  dissonanceTrigger: number; // Dissonance threshold trigger
}

/**
 * SAIP Event types
 */
export type SAIPEventType =
  | 'emotiveSync'           // SOMNIA → AENEA DPD
  | 'reflectiveReturn'      // AENEA DPD → SOMNIA
  | 'temporalReconciliation'; // Time field sync

/**
 * SAIP Event record
 */
export interface SAIPEvent {
  type: SAIPEventType;
  timestamp: number;
  somniaState: SomniaState;
  aeneaDPD?: DPDScores;
  influence?: DPDInfluence;
  bias?: AffectiveBias;
  temporalDilation?: number;
}

// ============================================================================
// External Stimulus
// ============================================================================

/**
 * External stimulus input to SOMNIA
 */
export interface ExternalStimulus {
  type: 'sensory' | 'cognitive' | 'social' | 'internal';
  valence: number;        // [-1, 1] Positive/negative
  arousal: number;        // [0, 1] Activation level
  significance: number;   // [0, 1] Importance
  context?: string;
}

// ============================================================================
// Temporal Anchoring Parameters
// ============================================================================

/**
 * Logistic mode parameters for θ(t) calculation
 */
export interface LogitParams {
  b0: number;  // Baseline anchoring (default: 0.10)
  b1: number;  // Dissonance load influence (default: 0.90)
  b2: number;  // Energy influence (default: 0.60)
  b3: number;  // Emotional intensity influence (default: 0.30)
  b4: number;  // Cortisol influence (default: 0.50)
  b5: number;  // Serotonin influence (default: 0.40)
  alpha: number; // EMA smoothing coefficient (default: 0.20)
}

/**
 * ODE mode parameters for θ(t) calculation
 */
export interface ODEParams {
  k1: number;     // Dissonance driving force (default: 0.80)
  k2: number;     // Energy recovery force (default: 0.60)
  k3: number;     // Emotional intensity force (default: 0.30)
  k4: number;     // Restoration force (default: 0.20)
  thetaEq: number; // Equilibrium point (default: 0.50)
  dt: number;     // Time step (default: 1.0)
}

/**
 * Temporal anchoring calculation mode
 */
export type TemporalAnchoringMode = 'logit' | 'ode';

/**
 * Input for temporal anchoring calculation
 */
export interface TemporalAnchoringInput {
  lambda: number;
  phi: number;
  xi: number;
  mu: HormonalField;
  prevTheta: number;
  prevThetaEma?: number;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * SOMNIA system configuration
 */
export interface SomniaConfig {
  temporalAnchoring: {
    mode: TemporalAnchoringMode;
    logitParams: LogitParams;
    odeParams: ODEParams;
  };
  addWeights: ADDWeights;
  stateTransitions: {
    dreamThreshold: number;         // ξ threshold for dream (default: 1.0)
    flowThetaThreshold: number;     // θ threshold for flow (default: 0.2)
    flowPsiThreshold: number;       // ψ threshold for flow (default: 0.8)
    dreamAwakeEnergyThreshold: number; // φ to exit dream early (default: 20)
    flowAwakeEnergyThreshold: number;  // φ to exit flow (default: 30)
  };
  energySync: {
    syncRatio: number;         // How much SOMNIA φ affects AENEA energy
    recoveryRate: number;      // Energy recovery rate in dream mode
  };
}

// ============================================================================
// Database Types
// ============================================================================

/**
 * SOMNIA state record for database
 */
export interface SomniaStateRecord {
  id?: number;
  timestamp: number;
  cycleId?: string;
  mode: SomniaMode;
  lambda: number;
  phi: number;
  muSerotonin: number;
  muDopamine: number;
  muCortisol: number;
  muOxytocin: number;
  theta: number;
  psi: number;
  xi: number;
  addPleasure?: number;
  addCoherence?: number;
  addDissonance?: number;
  addTemporalFlow?: number;
  addTotal?: number;
}

/**
 * SOMNIA transition record for database
 */
export interface SomniaTransitionRecord {
  id?: number;
  timestamp: number;
  fromMode: SomniaMode;
  toMode: SomniaMode;
  triggerReason: string;
  durationInPrevious: number;
}

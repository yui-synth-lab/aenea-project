# SOMNIA Implementation Plan v1.0

**Date:** 2025-01-15
**Branch:** `feature/somnia-integration`
**Status:** Planning
**Related:** [SOMNIA_SPEC.md](./SOMNIA_SPEC.md)

---

## Overview

This document outlines the implementation plan for integrating SOMNIA (Affective Dynamic Directive system) into the AENEA consciousness project. SOMNIA serves as the "body" of AENEA, providing emotional and somatic simulation capabilities.

### Goals

1. Implement Three-Layer Emotional Architecture (Somatic, Affective, Cognitive)
2. Integrate with existing DPD (Dynamic Prime Directive) system via SAIP
3. Enable state transitions (Awake/Dream/Flow)
4. Synchronize energy systems between AENEA and SOMNIA

---

## Directory Structure

```
src/
├── types/
│   └── somnia-types.ts           # SOMNIA type definitions
├── somnia/                        # SOMNIA core system
│   ├── core/
│   │   ├── temporal-anchoring.ts  # θ(t) calculation engine
│   │   ├── somatic-layer.ts       # Layer 1: λ, φ, μ
│   │   ├── affective-core.ts      # Layer 2: θ, ψ, ξ
│   │   └── add-engine.ts          # ADD optimization engine
│   ├── state/
│   │   └── state-machine.ts       # awake/dream/flow transitions
│   └── consciousness.ts           # SomniaConsciousness class
├── integration/                    # AENEA-SOMNIA integration
│   ├── saip.ts                    # SAIP functions
│   └── energy-sync.ts             # Energy synchronization
└── server/
    └── database-manager.ts        # Add SOMNIA tables
```

---

## Phase 1: Type Definitions and Core Implementation

### 1.1 `src/types/somnia-types.ts`

**Priority:** High
**Dependencies:** None
**Estimated:** 2-3 hours

Define all SOMNIA-related types following existing project conventions.

```typescript
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
    dreamThreshold: number;    // ξ threshold for dream (default: 1.0)
    flowThetaThreshold: number; // θ threshold for flow (default: 0.2)
    flowPsiThreshold: number;  // ψ threshold for flow (default: 0.8)
    awakeEnergyThreshold: number; // φ threshold to return to awake (default: 30)
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
```

---

### 1.2 `src/somnia/core/temporal-anchoring.ts`

**Priority:** High
**Dependencies:** 1.1
**Estimated:** 3-4 hours

Implement θ(t) Temporal Anchoring calculation based on SPEC Section 2.3.

```typescript
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

// Default parameters
const DEFAULT_LOGIT_PARAMS: LogitParams = {
  b0: 0.10, b1: 0.90, b2: 0.60, b3: 0.30, b4: 0.50, b5: 0.40, alpha: 0.20
};

const DEFAULT_ODE_PARAMS: ODEParams = {
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
```

---

### 1.3 `src/somnia/core/somatic-layer.ts`

**Priority:** High
**Dependencies:** 1.1
**Estimated:** 4-5 hours

Implement Layer 1: Somatic Simulation.

```typescript
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
```

---

### 1.4 `src/somnia/core/affective-core.ts`

**Priority:** High
**Dependencies:** 1.1, 1.2
**Estimated:** 4-5 hours

Implement Layer 2: Affective Core.

```typescript
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

  /**
   * Accumulate dissonance load
   */
  accumulateDissonance(amount: number): void {
    this.xi += amount;
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
```

---

### 1.5 `src/somnia/state/state-machine.ts`

**Priority:** High
**Dependencies:** 1.1
**Estimated:** 3-4 hours

Implement state transition machine.

```typescript
/**
 * State Transition Conditions
 */
interface StateTransition {
  from: SomniaMode;
  to: SomniaMode;
  condition: (state: SomniaState) => boolean;
  onEnter?: (state: SomniaState) => void;
  onExit?: (state: SomniaState) => void;
}

/**
 * Default transition definitions
 */
const DEFAULT_TRANSITIONS: StateTransition[] = [
  {
    from: 'awake',
    to: 'dream',
    condition: (s) => s.affective.xi > 1.0,
    onEnter: (s) => {
      // Relax temporal anchoring
      s.affective.theta *= 0.5;
      // Reset dissonance
      s.affective.xi = 0;
    }
  },
  {
    from: 'dream',
    to: 'flow',
    condition: (s) => s.affective.theta < 0.2 && s.affective.psi > 0.8,
    onEnter: (s) => {
      s.affective.theta = 0.05;
      s.affective.psi = Math.min(1, s.affective.psi * 1.2);
    }
  },
  {
    from: 'dream',
    to: 'awake',
    condition: (s) => s.somatic.phi < 30,
    onEnter: (s) => {
      s.affective.theta = 0.5;
    }
  },
  {
    from: 'flow',
    to: 'awake',
    condition: (s) => s.somatic.phi < 30,
    onEnter: (s) => {
      s.affective.theta = 0.5;
    }
  }
];

/**
 * SOMNIA State Machine
 */
export class SomniaStateMachine {
  private currentMode: SomniaMode = 'awake';
  private lastTransition: number = Date.now();
  private transitionCount: number = 0;
  private transitions: StateTransition[];

  constructor(transitions?: StateTransition[]) {
    this.transitions = transitions ?? DEFAULT_TRANSITIONS;
  }

  /**
   * Check for possible transition
   */
  checkTransition(state: SomniaState): SomniaMode | null {
    const transition = this.transitions.find(
      t => t.from === this.currentMode && t.condition(state)
    );
    return transition?.to ?? null;
  }

  /**
   * Execute state transition
   */
  executeTransition(to: SomniaMode, state: SomniaState): void {
    const transition = this.transitions.find(
      t => t.from === this.currentMode && t.to === to
    );

    if (transition) {
      // Exit callback
      transition.onExit?.(state);

      // Update mode
      const previousMode = this.currentMode;
      this.currentMode = to;
      this.lastTransition = Date.now();
      this.transitionCount++;

      // Enter callback
      transition.onEnter?.(state);

      console.log(`SOMNIA: ${previousMode} → ${to}`);
    }
  }

  /**
   * Get current mode
   */
  getCurrentMode(): SomniaMode {
    return this.currentMode;
  }

  /**
   * Get duration in current mode (ms)
   */
  getModeDuration(): number {
    return Date.now() - this.lastTransition;
  }

  /**
   * Get transition count
   */
  getTransitionCount(): number {
    return this.transitionCount;
  }

  /**
   * Set mode directly (for loading state)
   */
  setMode(mode: SomniaMode): void {
    this.currentMode = mode;
  }
}
```

---

### 1.6 `src/somnia/consciousness.ts`

**Priority:** High
**Dependencies:** 1.1-1.5
**Estimated:** 6-8 hours

Integrate all components into SomniaConsciousness class.

```typescript
/**
 * SOMNIA Consciousness - Main Integration Class
 *
 * Combines:
 * - Layer 1: SomaticLayer (λ, φ, μ)
 * - Layer 2: AffectiveCore (θ, ψ, ξ)
 * - State Machine (awake/dream/flow)
 * - ADD Engine (optimization)
 */
export class SomniaConsciousness {
  private somaticLayer: SomaticLayer;
  private affectiveCore: AffectiveCore;
  private stateMachine: SomniaStateMachine;
  private config: SomniaConfig;

  // Event emitter for integration
  private eventEmitter?: EventEmitter;

  constructor(config?: Partial<SomniaConfig>, eventEmitter?: EventEmitter) {
    this.config = this.mergeConfig(config);
    this.somaticLayer = new SomaticLayer();
    this.affectiveCore = new AffectiveCore(
      undefined,
      this.config.temporalAnchoring.mode
    );
    this.stateMachine = new SomniaStateMachine();
    this.eventEmitter = eventEmitter;
  }

  /**
   * Main processing loop
   */
  async tick(stimulus?: ExternalStimulus): Promise<SomniaState> {
    // 1. Process stimulus if provided
    if (stimulus) {
      this.somaticLayer.processStimulus(stimulus);
    }

    // 2. Natural decay
    this.somaticLayer.decayAffectiveGradient();
    this.somaticLayer.decayHormonalField();

    // 3. Update affective core
    const somatic = this.somaticLayer.getState();
    this.affectiveCore.updateTemporalAnchoring(somatic);
    this.affectiveCore.updateCoherence(somatic);

    // 4. Accumulate dissonance if lambda is negative
    if (somatic.lambda < -0.5) {
      this.affectiveCore.accumulateDissonance(0.1);
    }

    // 5. Check state transition
    const state = this.getState();
    const nextMode = this.stateMachine.checkTransition(state);
    if (nextMode) {
      this.executeTransition(nextMode);
    }

    // 6. Mode-specific processing
    await this.processModeSpecific();

    // 7. Emit state change event
    this.emitEvent('somniaStateChanged', this.getState());

    return this.getState();
  }

  /**
   * Execute state transition
   */
  private executeTransition(to: SomniaMode): void {
    const from = this.stateMachine.getCurrentMode();
    const duration = this.stateMachine.getModeDuration();

    this.stateMachine.executeTransition(to, this.getState());

    this.emitEvent('somniaTransitioned', {
      from,
      to,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Mode-specific processing
   */
  private async processModeSpecific(): Promise<void> {
    const mode = this.stateMachine.getCurrentMode();

    switch (mode) {
      case 'awake':
        // Normal processing - no special action
        break;

      case 'dream':
        // Release dissonance gradually
        this.affectiveCore.releaseDissonance(0.2);
        // Recover energy slowly
        this.somaticLayer.recoverEnergy(2);
        break;

      case 'flow':
        // Maintain high coherence
        // Minimal energy consumption
        break;
    }
  }

  /**
   * Get complete state
   */
  getState(): SomniaState {
    return {
      mode: this.stateMachine.getCurrentMode(),
      somatic: this.somaticLayer.getState(),
      affective: this.affectiveCore.getState(),
      cognitive: this.getCognitiveState(),
      timestamp: Date.now(),
      lastTransition: Date.now() - this.stateMachine.getModeDuration(),
      transitionCount: this.stateMachine.getTransitionCount()
    };
  }

  /**
   * Get cognitive mirror state (Layer 3)
   */
  private getCognitiveState(): CognitiveMirrorState {
    const affective = this.affectiveCore.getState();
    const somatic = this.somaticLayer.getState();

    return {
      empathicProjection: {
        dimensions: [somatic.lambda, affective.theta, affective.psi],
        magnitude: Math.sqrt(
          somatic.lambda ** 2 + affective.theta ** 2 + affective.psi ** 2
        ),
        context: this.stateMachine.getCurrentMode()
      },
      dpdInfluence: this.calculateDPDInfluence(),
      temporalDilation: 1.0 + (affective.theta - 0.5) * 0.5
    };
  }

  /**
   * Calculate DPD influence for SAIP
   */
  calculateDPDInfluence(): DPDInfluence {
    const affective = this.affectiveCore.getState();
    const somatic = this.somaticLayer.getState();

    return {
      empathy: affective.psi * 0.5 + Math.max(0, somatic.lambda) * 0.5,
      coherence: affective.psi * 0.8 + (1 - affective.theta) * 0.2,
      dissonance: affective.xi * 0.6 + affective.theta * 0.4
    };
  }

  /**
   * Apply affective bias from AENEA
   */
  applyAffectiveBias(bias: AffectiveBias): void {
    // Adjust internal state based on AENEA feedback
    const somatic = this.somaticLayer.getState();

    // Pleasure bias affects lambda
    const newLambda = somatic.lambda + bias.pleasureBias * 0.1;
    this.somaticLayer.setState({ lambda: Math.max(-1, Math.min(1, newLambda)) });

    // Dissonance trigger increases xi
    if (bias.dissonanceTrigger > 0) {
      this.affectiveCore.accumulateDissonance(bias.dissonanceTrigger);
    }
  }

  /**
   * Emit event
   */
  private emitEvent(event: string, data: any): void {
    this.eventEmitter?.emit(event, data);
  }

  /**
   * Merge config with defaults
   */
  private mergeConfig(config?: Partial<SomniaConfig>): SomniaConfig {
    return {
      temporalAnchoring: {
        mode: 'logit',
        logitParams: DEFAULT_LOGIT_PARAMS,
        odeParams: DEFAULT_ODE_PARAMS,
        ...config?.temporalAnchoring
      },
      addWeights: {
        alpha: 0.3,
        beta: 0.4,
        gamma: 0.2,
        delta: 0.1,
        ...config?.addWeights
      },
      stateTransitions: {
        dreamThreshold: 1.0,
        flowThetaThreshold: 0.2,
        flowPsiThreshold: 0.8,
        awakeEnergyThreshold: 30,
        ...config?.stateTransitions
      },
      energySync: {
        syncRatio: 0.5,
        recoveryRate: 2,
        ...config?.energySync
      }
    };
  }

  /**
   * Set state (for loading)
   */
  setState(state: Partial<SomniaState>): void {
    if (state.somatic) this.somaticLayer.setState(state.somatic);
    if (state.affective) this.affectiveCore.setState(state.affective);
    if (state.mode) this.stateMachine.setMode(state.mode);
  }
}
```

---

## Phase 2: AENEA Integration and SAIP

### 2.1 `src/integration/saip.ts`

**Priority:** High
**Dependencies:** Phase 1
**Estimated:** 4-5 hours

Implement SAIP (Somnia-AENEA Interface Protocol) functions.

```typescript
/**
 * SAIP - Somnia-AENEA Interface Protocol
 *
 * Three main functions:
 * 1. Emotive Sync: SOMNIA → AENEA DPD
 * 2. Reflective Return: AENEA DPD → SOMNIA
 * 3. Temporal Reconciliation: Time field synchronization
 */

/**
 * Emotive Sync: Transform SOMNIA state to DPD influence
 */
export function emotiveSync(somnia: SomniaState): DPDInfluence {
  const { affective, somatic } = somnia;

  return {
    empathy: (
      affective.psi * 0.5 +
      (somatic.lambda > 0 ? somatic.lambda * 0.5 : 0)
    ),
    coherence: (
      affective.psi * 0.8 +
      (1 - affective.theta) * 0.2
    ),
    dissonance: (
      affective.xi * 0.6 +
      affective.theta * 0.4
    )
  };
}

/**
 * Reflective Return: Transform AENEA DPD to affective bias
 */
export function reflectiveReturn(dpd: DPDScores): AffectiveBias {
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
  aeneaDPD: DPDScores
): number {
  const influence = emotiveSync(somnia);

  // Calculate correlation between SOMNIA influence and AENEA DPD
  const empathyCorr = 1 - Math.abs(influence.empathy - aeneaDPD.empathy);
  const coherenceCorr = 1 - Math.abs(influence.coherence - aeneaDPD.coherence);
  const dissonanceCorr = 1 - Math.abs(influence.dissonance - aeneaDPD.dissonance);

  return (empathyCorr + coherenceCorr + dissonanceCorr) / 3;
}
```

---

### 2.2 DPD Engine Extension

**Priority:** High
**Dependencies:** 2.1
**Estimated:** 4-5 hours

Extend existing DPD engine to accept SOMNIA influence.

```typescript
// Add to src/aenea/core/dpd-engine.ts

/**
 * Calculate DPD scores with SOMNIA influence (ADD)
 */
async calculateDPDScoresWithADD(
  thoughts: StructuredThought[],
  reflections: MutualReflection[],
  auditorResult: AuditorResult,
  somniaInfluence?: DPDInfluence
): Promise<DPDScores> {
  // Get base scores
  const baseScores = await this.calculateDPDScores(thoughts, reflections, auditorResult);

  // If no SOMNIA influence, return base scores
  if (!somniaInfluence) {
    return baseScores;
  }

  // Blend SOMNIA influence with DPD scores
  const blendFactor = 0.3; // 30% SOMNIA, 70% AENEA

  return {
    ...baseScores,
    empathy: baseScores.empathy * (1 - blendFactor) + somniaInfluence.empathy * blendFactor,
    coherence: baseScores.coherence * (1 - blendFactor) + somniaInfluence.coherence * blendFactor,
    dissonance: baseScores.dissonance * (1 - blendFactor) + somniaInfluence.dissonance * blendFactor,
    context: {
      ...baseScores.context,
      somniaInfluence
    }
  };
}
```

---

### 2.3 `src/integration/energy-sync.ts`

**Priority:** Medium
**Dependencies:** 2.1
**Estimated:** 3-4 hours

Implement energy synchronization between SOMNIA and AENEA.

```typescript
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
```

---

## Phase 3: Database and Events

### 3.1 Database Tables

**Priority:** Medium
**Dependencies:** Phase 1
**Estimated:** 3-4 hours

Add SOMNIA tables to `src/server/database-manager.ts`.

```sql
-- SOMNIA state records
CREATE TABLE IF NOT EXISTS somnia_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  cycle_id TEXT,
  mode TEXT NOT NULL CHECK(mode IN ('awake', 'dream', 'flow')),

  -- Layer 1: Somatic
  lambda REAL NOT NULL,
  phi REAL NOT NULL,
  mu_serotonin REAL NOT NULL,
  mu_dopamine REAL NOT NULL,
  mu_cortisol REAL NOT NULL,
  mu_oxytocin REAL NOT NULL,

  -- Layer 2: Affective
  theta REAL NOT NULL,
  psi REAL NOT NULL,
  xi REAL NOT NULL,

  -- ADD scores
  add_pleasure REAL,
  add_coherence REAL,
  add_dissonance REAL,
  add_temporal_flow REAL,
  add_total REAL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- State transitions
CREATE TABLE IF NOT EXISTS somnia_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  from_mode TEXT NOT NULL,
  to_mode TEXT NOT NULL,
  trigger_reason TEXT,
  duration_in_previous INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SAIP events
CREATE TABLE IF NOT EXISTS somnia_saip_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  somnia_state_json TEXT,
  aenea_dpd_json TEXT,
  influence_json TEXT,
  impact_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_somnia_state_timestamp ON somnia_state(timestamp);
CREATE INDEX IF NOT EXISTS idx_somnia_state_mode ON somnia_state(mode);
CREATE INDEX IF NOT EXISTS idx_somnia_transitions_timestamp ON somnia_transitions(timestamp);
CREATE INDEX IF NOT EXISTS idx_somnia_saip_event_type ON somnia_saip_events(event_type);
```

---

### 3.2 Event System Extension

**Priority:** Medium
**Dependencies:** 3.1
**Estimated:** 3-4 hours

Add SOMNIA events to WebSocket handler.

```typescript
// Add to src/server/websocket-handler.ts

export function setupSomniaWebSocketHandlers(
  io: SocketIOServer,
  somnia: SomniaConsciousness
): void {
  // State changes
  somnia.on('somniaStateChanged', (state: SomniaState) => {
    io.emit('somnia:stateChanged', {
      timestamp: Date.now(),
      mode: state.mode,
      theta: state.affective.theta,
      psi: state.affective.psi,
      xi: state.affective.xi,
      lambda: state.somatic.lambda,
      phi: state.somatic.phi
    });
  });

  // State transitions
  somnia.on('somniaTransitioned', (data: any) => {
    io.emit('somnia:transitioned', data);
  });

  // SAIP events
  somnia.on('somniaEmotiveSync', (data: any) => {
    io.emit('somnia:emotiveSync', data);
  });

  somnia.on('somniaReflectiveReturn', (data: any) => {
    io.emit('somnia:reflectiveReturn', data);
  });
}
```

---

## Implementation Order and Dependencies

```
Phase 1 (Core):
1.1 somnia-types.ts ────────┐
                           │
1.2 temporal-anchoring.ts ──┼──► 1.4 affective-core.ts ──┐
                           │                            │
1.3 somatic-layer.ts ───────┤                            ├──► 1.6 consciousness.ts
                           │                            │
1.5 state-machine.ts ───────┴────────────────────────────┘

Phase 2 (Integration):
1.6 consciousness.ts ──► 2.1 saip.ts ──► 2.2 DPD extension
                                    └──► 2.3 energy-sync.ts

Phase 3 (Persistence):
Phase 1 + 2 ──► 3.1 DB tables ──► 3.2 Event extension
```

---

## Testing Strategy

### Unit Tests

```
src/somnia/__tests__/
├── temporal-anchoring.test.ts
├── somatic-layer.test.ts
├── affective-core.test.ts
├── state-machine.test.ts
└── consciousness.test.ts

src/integration/__tests__/
├── saip.test.ts
└── energy-sync.test.ts
```

### Integration Tests

```
src/__tests__/integration/
├── somnia-aenea-integration.test.ts
└── full-cycle-with-somnia.test.ts
```

### Key Test Cases

1. **θ(t) Calculation**
   - Verify logit mode produces values in [0, 1]
   - Verify ODE mode converges to equilibrium
   - Test EMA smoothing effect

2. **State Transitions**
   - awake → dream when ξ > 1.0
   - dream → flow when θ < 0.2 and ψ > 0.8
   - flow → awake when φ < 30

3. **SAIP Functions**
   - emotiveSync produces valid DPDInfluence
   - reflectiveReturn produces valid AffectiveBias
   - temporalReconciliation affects clock appropriately

4. **Energy Synchronization**
   - φ affects AENEA effective max energy
   - Energy mode correctly determined

---

## Risk Mitigation

### Risk 1: DPD-ADD Weight Conflict

**Mitigation:**
- Use blend factor (default 0.3) to limit SOMNIA influence
- Monitor for oscillation patterns
- Add conflict detection alerts

### Risk 2: Energy Depletion Cycle

**Mitigation:**
- Force dream transition when φ < 20
- Implement REM-like recovery phase
- Add minimum energy floor

### Risk 3: Database Growth

**Mitigation:**
- Record state at intervals (not every tick)
- Implement 30-day retention policy
- Use rollup aggregation for analytics

---

## Success Criteria

- [ ] All Phase 1 components implemented and tested
- [ ] SAIP integration working with existing DPD
- [ ] State transitions functioning correctly
- [ ] Database recording SOMNIA state
- [ ] WebSocket events broadcasting to UI
- [ ] Energy synchronization stable
- [ ] No regression in existing AENEA functionality

---

## Next Steps

1. **Immediate:** Commit SOMNIA_SPEC.md and this plan
2. **Phase 1:** Start with somnia-types.ts
3. **Review:** Weekly progress review against plan

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-15 | Claude | Initial implementation plan |

---

**End of Document**

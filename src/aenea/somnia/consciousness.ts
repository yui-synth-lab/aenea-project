import { EventEmitter } from 'events';
import { SomniaConfig, SomniaState, SomniaMode, ExternalStimulus, AffectiveBias, DPDInfluence, CognitiveMirrorState, SomaticState } from '../../types/somnia-types.js';
import { SomaticLayer } from './core/somatic-layer.js';
import { AffectiveCore } from './core/affective-core.js';
import { SomniaStateMachine } from './state/state-machine.js';
import { emotiveSync } from '../integration/saip.js';
import { DEFAULT_LOGIT_PARAMS, DEFAULT_ODE_PARAMS } from './core/temporal-anchoring.js';
import { estimateValenceFromQualia } from './core/qualia-mapper.js';

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
  private qualiaText?: string;

  // Event emitter for integration
  private eventEmitter?: EventEmitter;

  constructor(config?: Partial<SomniaConfig>, eventEmitter?: EventEmitter) {
    this.config = this.mergeConfig(config);
    this.somaticLayer = new SomaticLayer();
    this.affectiveCore = new AffectiveCore(
      undefined,
      this.config.temporalAnchoring.mode
    );
    this.stateMachine = new SomniaStateMachine(this.config.stateTransitions);
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

    // 4. Accumulate dissonance based on multiple stress signals
    const xiAccumulation = this.calculateXiAccumulation(somatic);
    if (xiAccumulation > 0) {
      this.affectiveCore.accumulateDissonance(xiAccumulation);
    }

    // 4.5. Apply qualia feedback to somatic layer (weak coupling)
    if (this.qualiaText) {
      const qualiaValence = estimateValenceFromQualia(this.qualiaText);
      if (qualiaValence !== 0) {
        const currentLambda = this.somaticLayer.getState().lambda;
        const newLambda = currentLambda + (qualiaValence - currentLambda) * 0.1;
        this.somaticLayer.setState({ lambda: Math.max(-1, Math.min(1, newLambda)) });
      }
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

    const state = this.getState();
    const patch = this.stateMachine.executeTransition(to, state);

    // Apply patches to actual internal state
    if (patch.affective) {
      this.affectiveCore.setState(patch.affective);
    }
    if (patch.somatic) {
      this.somaticLayer.setState(patch.somatic);
    }

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
   * Calculate xi accumulation amount based on multiple stress signals.
   *
   * Triggers:
   * 1. Lambda negativity: gradient-based when lambda is below baseline (0.1)
   * 2. Hormonal stress: high cortisol relative to serotonin
   * 3. Energy depletion: phi below 30 indicates sustained strain
   */
  private calculateXiAccumulation(somatic: SomaticState): number {
    let amount = 0;

    // Trigger 1: Lambda negativity (gradient, not hard threshold)
    // λ が 0.1 以下なら蓄積。より負であればより多く蓄積 (max ~0.05/tick)
    if (somatic.lambda < 0.1) {
      const negativity = Math.max(0, 0.1 - somatic.lambda);
      amount += negativity * 0.045;
    }

    // Trigger 2: Hormonal stress (cortisol high + serotonin low)
    const stressIndex = somatic.mu.cortisol - somatic.mu.serotonin;
    if (stressIndex > 0.1) {
      amount += stressIndex * 0.03;
    }

    // Trigger 3: Energy depletion (sustained strain)
    if (somatic.phi < 30) {
      amount += (30 - somatic.phi) / 30 * 0.02;
    }

    return amount;
  }

  /**
   * Set the LLM-generated qualia (Slow Track)
   */
  setQualia(qualia: string): void {
    this.qualiaText = qualia;
    this.emitEvent('somniaStateChanged', this.getState());
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
      temporalDilation: 1.0 + (affective.theta - 0.5) * 0.5,
      qualia: this.qualiaText
    };
  }

  /**
   * Calculate DPD influence for SAIP.
   * Uses fields directly to avoid the getState() → getCognitiveState() → calculateDPDInfluence() cycle.
   */
  calculateDPDInfluence(): DPDInfluence {
    return emotiveSync({
      affective: this.affectiveCore.getState(),
      somatic: this.somaticLayer.getState()
    });
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
        dreamAwakeEnergyThreshold: 20,
        flowAwakeEnergyThreshold: 30,
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
   * Force transition to Dream mode and fully recover φ.
   * Called by the backend during unified sleep so that SOMNIA
   * "dreams" together with AENEA's sleep cycle.
   */
  forceDream(): void {
    const currentMode = this.stateMachine.getCurrentMode();

    // Transition to dream
    this.stateMachine.setMode('dream');

    // Relax temporal anchoring (same as normal dream entry)
    const affective = this.affectiveCore.getState();
    this.affectiveCore.setState({
      theta: affective.theta * 0.5,
      xi: 0  // Reset dissonance
    });

    // Fully recover somatic energy
    this.somaticLayer.setState({ phi: 100 });

    this.emitEvent('somniaTransitioned', {
      from: currentMode,
      to: 'dream',
      duration: this.stateMachine.getModeDuration(),
      timestamp: Date.now(),
      reason: 'unified_sleep'
    });
  }

  /**
   * Transition back to Awake mode after sleep.
   * Restores normal temporal anchoring.
   */
  wakeUp(): void {
    const currentMode = this.stateMachine.getCurrentMode();
    this.stateMachine.setMode('awake');
    this.affectiveCore.setState({ theta: 0.5 });

    this.emitEvent('somniaTransitioned', {
      from: currentMode,
      to: 'awake',
      duration: this.stateMachine.getModeDuration(),
      timestamp: Date.now(),
      reason: 'unified_wake'
    });
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

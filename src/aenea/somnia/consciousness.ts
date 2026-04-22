import { EventEmitter } from 'events';
import { SomniaConfig, SomniaState, SomniaMode, ExternalStimulus, AffectiveBias, DPDInfluence, CognitiveMirrorState } from '../../types/somnia-types.js';
import { SomaticLayer } from './core/somatic-layer.js';
import { AffectiveCore } from './core/affective-core.js';
import { SomniaStateMachine } from './state/state-machine.js';
import { emotiveSync } from '../integration/saip.js';
import { DEFAULT_LOGIT_PARAMS, DEFAULT_ODE_PARAMS } from './core/temporal-anchoring.js';

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
   * Set state (for loading)
   */
  setState(state: Partial<SomniaState>): void {
    if (state.somatic) this.somaticLayer.setState(state.somatic);
    if (state.affective) this.affectiveCore.setState(state.affective);
    if (state.mode) this.stateMachine.setMode(state.mode);
  }
}

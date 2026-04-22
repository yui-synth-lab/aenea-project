import { SomniaMode, SomniaState, AffectiveCoreState, SomaticState } from '../../../types/somnia-types.js';
import { log } from '../../../server/logger.js';

/**
 * State patch returned by transition callbacks.
 * The caller is responsible for applying these to the actual internal state.
 */
export interface TransitionPatch {
  affective?: Partial<AffectiveCoreState>;
  somatic?: Partial<SomaticState>;
}

/**
 * State Transition Conditions
 */
interface StateTransition {
  from: SomniaMode;
  to: SomniaMode;
  condition: (state: SomniaState) => boolean;
  /** Return a patch describing what should change when entering this state */
  onEnter?: (state: SomniaState) => TransitionPatch;
  onExit?: (state: SomniaState) => TransitionPatch;
}

export interface TransitionThresholds {
  dreamThreshold: number;
  flowThetaThreshold: number;
  flowPsiThreshold: number;
  dreamAwakeEnergyThreshold: number;
  flowAwakeEnergyThreshold: number;
}

const DEFAULT_THRESHOLDS: TransitionThresholds = {
  dreamThreshold: 1.0,
  flowThetaThreshold: 0.2,
  flowPsiThreshold: 0.8,
  dreamAwakeEnergyThreshold: 20,  // dream exits early only at critically low energy
  flowAwakeEnergyThreshold: 30,   // flow exits when energy is insufficient to sustain it
};

function buildTransitions(t: TransitionThresholds): StateTransition[] {
  return [
    {
      from: 'awake',
      to: 'dream',
      condition: (s) => s.affective.xi > t.dreamThreshold,
      onEnter: (s) => ({
        affective: {
          theta: s.affective.theta * 0.5,  // Relax temporal anchoring
          xi: 0                             // Reset dissonance
        }
      })
    },
    {
      from: 'dream',
      to: 'flow',
      condition: (s) => s.affective.theta < t.flowThetaThreshold && s.affective.psi > t.flowPsiThreshold,
      onEnter: (s) => ({
        affective: {
          theta: 0.05,
          psi: Math.min(1, s.affective.psi * 1.2)
        }
      })
    },
    {
      from: 'dream',
      to: 'awake',
      // Only exit dream at critically low energy; normal recovery leads to flow
      condition: (s) => s.somatic.phi < t.dreamAwakeEnergyThreshold,
      onEnter: () => ({
        affective: { theta: 0.5 }
      })
    },
    {
      from: 'flow',
      to: 'awake',
      condition: (s) => s.somatic.phi < t.flowAwakeEnergyThreshold,
      onEnter: () => ({
        affective: { theta: 0.5 }
      })
    }
  ];
}

/** Minimum ticks to stay in a mode before allowing transition (hysteresis) */
const MIN_DWELL_TICKS = 3;

/**
 * SOMNIA State Machine
 */
export class SomniaStateMachine {
  private currentMode: SomniaMode = 'awake';
  private lastTransition: number = Date.now();
  private transitionCount: number = 0;
  private ticksInCurrentMode: number = 0;
  private transitions: StateTransition[];

  constructor(thresholds?: Partial<TransitionThresholds>) {
    this.transitions = buildTransitions({ ...DEFAULT_THRESHOLDS, ...thresholds });
  }

  /**
   * Check for possible transition (respects MIN_DWELL_TICKS hysteresis)
   */
  checkTransition(state: SomniaState): SomniaMode | null {
    this.ticksInCurrentMode++;
    if (this.ticksInCurrentMode < MIN_DWELL_TICKS) {
      return null;
    }
    const transition = this.transitions.find(
      t => t.from === this.currentMode && t.condition(state)
    );
    return transition?.to ?? null;
  }

  /**
   * Execute state transition.
   * Returns patches that the caller must apply to actual internal state.
   */
  executeTransition(to: SomniaMode, state: SomniaState): TransitionPatch {
    const transition = this.transitions.find(
      t => t.from === this.currentMode && t.to === to
    );

    let combinedPatch: TransitionPatch = {};

    if (transition) {
      // Exit callback
      const exitPatch = transition.onExit?.(state) ?? {};

      // Update mode
      const previousMode = this.currentMode;
      this.currentMode = to;
      this.lastTransition = Date.now();
      this.transitionCount++;
      this.ticksInCurrentMode = 0;

      // Enter callback
      const enterPatch = transition.onEnter?.(state) ?? {};

      // Merge patches (enter takes precedence)
      combinedPatch = {
        affective: { ...exitPatch.affective, ...enterPatch.affective },
        somatic: { ...exitPatch.somatic, ...enterPatch.somatic }
      };

      log.info('SOMNIA', `State transition: ${previousMode} → ${to}`);
    }

    return combinedPatch;
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
    this.ticksInCurrentMode = 0;
  }
}

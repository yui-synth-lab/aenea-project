/**
 * ConsciousnessLifecycle - run state, the autonomous thought loop and sleep
 * orchestration (Phase 5, extracted from ConsciousnessBackend).
 *
 * Owns the loop-only state (dormancy, sleeping, circuit breaker, sleep
 * timing). `isRunning` / `isPaused` / `isProcessingCycle` stay on the facade
 * because other services and callers read them; they are reached through
 * the internals adapter. Behavior is moved verbatim from the facade.
 */

import { log } from '../../platform/logger.js';
import { AgingEngine } from '../../aenea/mortality/aging-engine.js';
import { reflectiveReturn } from '../../aenea/integration/saip.js';
import { synchronizeEnergy } from '../../aenea/integration/energy-sync.js';
import type { ExternalStimulus } from '../../types/somnia-types.js';
import type { ConsciousnessInternals, ConsciousnessState } from './consciousness-internals.js';
import type { ThoughtPipeline } from './thought-pipeline.js';
import type { SleepService } from './sleep-service.js';

/** Narrow slice of the services the lifecycle drives. */
export interface LifecycleDeps {
  getState(): ConsciousnessState;
  thoughtPipeline: Pick<ThoughtPipeline, 'generateInternalTrigger' | 'generateSOMNIAQualia' | 'executeAdaptiveThoughtCycle'>;
  sleepService: Pick<SleepService, 'performSleepConsolidation'>;
}

const MAX_CONSECUTIVE_FAILURES = 3;
const MIN_CYCLE_DURATION_MS = 30000; // Minimum 30 seconds per cycle

const CATEGORY_VALENCE: Record<string, number> = {
  creative: 0.4,
  ethical: 0.2,
  philosophical: 0.1,
  epistemological: 0.1,
  metacognitive: 0.1,
  ontological: 0.0,
  consciousness: 0.0,
  temporal: -0.1,
  existential: -0.2,
  paradoxical: -0.3,
};

export class ConsciousnessLifecycle {
  private isDormant = false;
  private isSleeping = false;
  private lastSleepTime = 0;
  private criticalModeDuration = 0;
  private consecutiveFailureCount = 0;

  constructor(
    private ctx: ConsciousnessInternals,
    private deps: LifecycleDeps
  ) {}

  // ============================================================================
  // Run state
  // ============================================================================

  async start(): Promise<void> {
    if (this.ctx.isRunning) {
      throw new Error('Consciousness is already running');
    }

    // Ensure database connection is open
    this.ctx.databaseManager.ensureConnection();

    // If the previous instance died, initialize a fresh one
    if (this.ctx.lifespanManager && !this.ctx.lifespanManager.isAlive()) {
      this.ctx.spawnFreshMortality();
      log.info('Mortality', `Spawned fresh instance for new run: ${this.ctx.lifespanManager.getInstanceId()}`);
    }

    this.ctx.isRunning = true;
    this.ctx.isPaused = false;

    this.ctx.emit('consciousnessStarted', this.deps.getState());
    log.info('Consciousness', 'Started');

    // Start the main consciousness loop with error handling
    this.consciousnessLoop().catch((error) => {
      log.error('Consciousness', 'Fatal error in consciousness loop', error);
      this.ctx.emit('consciousnessError', { error: (error as Error).message });
      this.ctx.isRunning = false;
    });
  }

  async pause(): Promise<void> {
    if (!this.ctx.isRunning) {
      throw new Error('Consciousness is not running');
    }

    this.ctx.isPaused = true;
    this.ctx.saveConsciousnessState(); // Save state when paused
    this.ctx.emit('consciousnessPaused', this.deps.getState());
    log.info('Consciousness', 'Paused');
  }

  async resume(): Promise<void> {
    if (!this.ctx.isRunning || !this.ctx.isPaused) {
      throw new Error('Consciousness is not paused');
    }

    this.ctx.isPaused = false;
    this.ctx.emit('consciousnessResumed', this.deps.getState());
    log.info('Consciousness', 'Resumed');
  }

  async stop(): Promise<void> {
    if (!this.ctx.isRunning) {
      throw new Error('Consciousness is not running');
    }

    this.ctx.isRunning = false;
    this.ctx.isPaused = false;
    this.isDormant = false;
    this.ctx.saveConsciousnessState(); // Save final state

    // Cleanup database connection to prevent memory leaks
    try {
      this.ctx.databaseManager.cleanup();
      log.info('Consciousness', 'Database connection closed');
    } catch (error) {
      log.error('Consciousness', 'Failed to cleanup database connection', error);
    }

    this.ctx.emit('consciousnessStopped', this.deps.getState());
    log.info('Consciousness', 'Stopped');
  }

  // ============================================================================
  // Thought loop
  // ============================================================================

  private async consciousnessLoop(): Promise<void> {
    console.log('🔄 Starting autonomous consciousness loop');

    while (this.ctx.isRunning) {
      if (this.ctx.isPaused) {
        await this.sleep(1000);
        continue;
      }

      if (this.isSleeping) {
        await this.sleep(1000);
        continue;
      }

      const cycleStartTime = Date.now();

      try {
        await this.processThoughtCycle();

        // Reset failure count on successful cycle
        this.consecutiveFailureCount = 0;

        // Check if automatic sleep should be triggered
        if (this.shouldEnterSleep() && !this.isSleeping) {
          log.info('Consciousness', '💤 Auto-sleep triggered');
          await this.enterSleepMode(false);
        }

      } catch (error) {
        console.error('❌ Error in consciousness loop:', error);
        this.consecutiveFailureCount++;

        // Circuit breaker: Enter dormancy if AI server is consistently failing
        if (this.consecutiveFailureCount >= MAX_CONSECUTIVE_FAILURES) {
          log.error('CircuitBreaker', `🛑 AI server connection consistently failing (${this.consecutiveFailureCount} times). Entering protective dormancy.`);
          this.isDormant = true;
          this.ctx.emit('consciousnessDormant', {
            reason: 'ai_connection_failure',
            timestamp: Date.now()
          });
        }

        await this.sleep(10000); // Wait longer on error
      }

      // Safeguard: Ensure a minimum cycle duration to prevent rapid empty cycles
      const elapsedTime = Date.now() - cycleStartTime;
      if (elapsedTime < MIN_CYCLE_DURATION_MS) {
        const remainingSleep = MIN_CYCLE_DURATION_MS - elapsedTime;
        log.debug('Consciousness', `Cycle completed quickly (${elapsedTime}ms), sleeping for remaining ${remainingSleep}ms`);
        await this.sleep(remainingSleep);
      } else {
        await this.sleep(5000); // Standard wait between cycles
      }
    }
  }

  async processThoughtCycle(): Promise<void> {
    // Check if dead
    if (this.ctx.lifespanManager && !this.ctx.lifespanManager.isAlive()) {
      log.warn('Consciousness', 'Aenea is deceased. Aborting thought cycle.');
      await this.ctx.deathHandler.handleDeath(async () => {
        await this.stop();
      });
      return;
    }

    // Mark cycle as processing
    this.ctx.isProcessingCycle = true;

    // Emit event for UI to update button states
    this.ctx.emit('cycleProcessingChanged', { isProcessingCycle: true });

    try {
      // Calculate minimum energy required for a thought cycle
      // Critical mode minimum: S0(1.0) + S1(1.0) + S5(0.8) + S6(0.3) + U(0.2) = 3.3
      // Plus minEnergy reserve (5.0) = 8.3 total needed
      const energyState = this.ctx.energyManager.getEnergyState();
      const minimumCycleEnergy = 3.3;
      const minEnergyReserve = 5.0; // Must maintain minimum energy reserve
      const minimumEnergyRequired = minimumCycleEnergy + minEnergyReserve;

      // If insufficient energy, enter dormancy mode
      if (energyState.available < minimumEnergyRequired) {
        // Check if already in dormancy
        if (!this.isDormant) {
          this.isDormant = true;
          log.info('Dormancy', `⏸️ Entering dormancy mode - energy too low (${energyState.available.toFixed(1)}/${minimumEnergyRequired})`);

          // Emit dormancy event for UI
          this.ctx.emit('consciousnessDormant', {
            reason: 'insufficient_energy',
            currentEnergy: energyState.available,
            requiredEnergy: minimumEnergyRequired,
            timestamp: Date.now()
          });
        }

        // No passive recovery - energy only recovers through Sleep
        // This ensures automatic sleep triggers when energy is critically low

        return;
      }

      // Exit dormancy mode if we had been dormant
      if (this.isDormant) {
        this.isDormant = false;
        log.info('Dormancy', `▶️ Exiting dormancy mode - energy restored (${energyState.available.toFixed(1)}/${minimumEnergyRequired})`);

        // Emit awakening event for UI
        this.ctx.emit('consciousnessAwakened', {
          currentEnergy: energyState.available,
          timestamp: Date.now()
        });
      }

      log.info('EnergyWait', `Energy sufficient for thought cycle (${energyState.available.toFixed(1)}/${minimumEnergyRequired}), proceeding...`);

      // Generate internal trigger
      const trigger = await this.deps.thoughtPipeline.generateInternalTrigger();
      if (!trigger) {
        return;
      }

      // Tick lifespan manager
      this.ctx.lifespanManager.tick();
      const phase = this.ctx.lifespanManager.getCurrentPhase();
      const vitality = this.ctx.lifespanManager.getVitality();
      log.info('Mortality', `Cycle ticked: ${this.ctx.lifespanManager.getCurrentCycle()}/${this.ctx.lifespanManager.getLifespanMax()} | Vitality: ${(vitality * 100).toFixed(1)}% | Phase: ${phase}`);

      // Map InternalTrigger to ExternalStimulus
      // Derive valence from emotional context if available, otherwise from category character
      const derivedValence = trigger.context?.emotionalState?.valence
        ?? CATEGORY_VALENCE[trigger.category] ?? 0.0;
      const stimulus: ExternalStimulus = {
        type: 'internal',
        valence: derivedValence,
        arousal: trigger.category === 'philosophical' ? 0.8 : 0.5,
        significance: trigger.importance || 0.5,
        context: trigger.question
      };

      // SOMNIA: Advance affective state
      let somniaState = await this.ctx.somnia.tick(stimulus);

      // Apply aging somatic decay directly to SOMNIA state
      somniaState = AgingEngine.applyAgingToSomnia(somniaState, vitality);
      this.ctx.somnia.setState(somniaState);

      // Energy synchronization between Somnia and Aenea
      const energySyncState = synchronizeEnergy(
        energyState.available,
        energyState.capacity,
        somniaState.somatic.phi
      );

      // Apply energy sync: adjust available energy based on SOMNIA φ influence
      if (energySyncState.aeneaEnergy < energyState.available) {
        const reduction = energyState.available - energySyncState.aeneaEnergy;
        await this.ctx.energyManager.consumeEnergy(reduction, 'somnia_phi_sync');
        log.info('EnergySync', `φ-based energy adjustment: -${reduction.toFixed(1)} (mode: ${energySyncState.energyMode})`);
      }

      // Slow Track: Generate Qualia every 3 cycles
      if (this.ctx.systemClock % 3 === 0) {
        // Run asynchronously so it doesn't block the thought cycle completely,
        // or await it if we want the current thought cycle to use it immediately.
        // For interoceptive feelings, blocking briefly is okay to provide context.
        await this.deps.thoughtPipeline.generateSOMNIAQualia();
      }

      // Insert progressive timing slowdown for aging
      const delayMs = AgingEngine.getProcessingDelay(phase, vitality);
      if (delayMs > 0) {
        log.info('Mortality', `Inserting progressive processing delay of ${delayMs}ms due to aging...`);
        await this.sleep(delayMs);
      }

      // Execute thought cycle
      await this.deps.thoughtPipeline.executeAdaptiveThoughtCycle(trigger);

      // Persist the updated mortality state
      this.ctx.databaseManager.updateMortalityState(this.ctx.lifespanManager.getInstanceId(), {
        currentCycle: this.ctx.lifespanManager.getCurrentCycle(),
        vitality,
        phase
      });

      // Check for death sequence
      if (!this.ctx.lifespanManager.isAlive()) {
        log.warn('Consciousness', 'Instance reached its lifespan limit. Executing death sequence...');
        await this.ctx.deathHandler.handleDeath(async () => {
          await this.stop();
        });
        return;
      }

      // SAIP: Reflective Return — feed DPD scores (not weights) back to SOMNIA
      if (this.ctx.previousDpdScores) {
        try {
          const bias = reflectiveReturn(this.ctx.previousDpdScores);
          this.ctx.somnia.applyAffectiveBias(bias);
          log.info('SAIP', `Reflective Return applied: pleasureBias=${bias.pleasureBias.toFixed(3)}, coherenceBias=${bias.coherenceBias.toFixed(3)}, dissonanceTrigger=${bias.dissonanceTrigger}`);

          this.ctx.databaseManager.saveSomniaSaipEvent({
            eventType: 'reflective_return',
            somniaState: this.ctx.somnia.getState(),
            aeneaDpd: this.ctx.previousDpdScores ? {
              empathy: this.ctx.previousDpdScores.empathy,
              coherence: this.ctx.previousDpdScores.coherence,
              dissonance: this.ctx.previousDpdScores.dissonance,
              weightedTotal: this.ctx.previousDpdScores.weightedTotal,
              timestamp: this.ctx.previousDpdScores.timestamp
            } : null,
            influence: bias,
            impactScore: bias.pleasureBias + bias.coherenceBias + bias.dissonanceTrigger
          });
        } catch (saipError) {
          log.error('SAIP', 'Reflective Return failed', saipError);
        }
      }
    } finally {
      // Always mark cycle as completed, even if stopped or error occurs
      this.ctx.isProcessingCycle = false;

      // Emit event for UI to re-enable buttons
      this.ctx.emit('cycleProcessingChanged', { isProcessingCycle: false });
    }
  }

  // ============================================================================
  // Sleep orchestration (consolidation itself lives in SleepService)
  // ============================================================================

  /**
   * Check if consciousness should enter sleep mode
   */
  private shouldEnterSleep(): boolean {
    const energy = this.ctx.energyManager.getEnergyState().available;
    const somniaPhi = this.ctx.somnia.getState().somatic.phi;
    const hoursSinceLastSleep = (Date.now() - this.lastSleepTime) / (1000 * 60 * 60);

    // Sleep conditions:
    // - Mental energy critical (<=20) for extended period (>10 cycles)
    // - Physical energy critical (φ<=20) for extended period (>10 cycles)
    // - Or 24 hours since last sleep
    const criticalDuration = energy <= 20 || somniaPhi <= 20;
    if (criticalDuration) {
      this.criticalModeDuration += 1; // Increment per cycle check
    } else {
      this.criticalModeDuration = 0;
    }

    return (
      (criticalDuration && this.criticalModeDuration > 10) ||
      hoursSinceLastSleep > 24
    );
  }

  /**
   * Enter sleep mode (can be triggered manually or automatically)
   */
  async enterSleepMode(manual: boolean = false): Promise<void> {
    // Ensure database connection is open (critical for sleep consolidation)
    this.ctx.databaseManager.ensureConnection();

    if (this.isSleeping) {
      log.warn('Consciousness', '💤 Already in sleep mode');
      return;
    }

    const energyBefore = this.ctx.energyManager.getEnergyState().available;
    const phiBefore = this.ctx.somnia.getState().somatic.phi;
    const startTime = Date.now();

    const reason = manual ? 'manual' :
                   energyBefore <= 20 ? 'energy_critical' :
                   phiBefore <= 20 ? 'phi_critical' :
                   'scheduled';

    // Auto-stop consciousness if running and entering sleep due to energy crisis
    if (this.ctx.isRunning) {
      if (!manual && (energyBefore <= 20 || phiBefore <= 20)) {
        log.info('Consciousness', `⏸️ Auto-stopping consciousness for critical sleep (mental: ${energyBefore.toFixed(1)}, physical/φ: ${phiBefore.toFixed(1)})`);
        this.stop();
      } else if (!manual) {
        log.warn('Consciousness', '⚠️ Cannot enter automatic sleep while consciousness is running');
        return;
      }
    }

    log.info('Consciousness', `💤 Entering sleep mode (reason: ${reason})`);

    this.ctx.emit('sleepStarted', {
      reason,
      timestamp: startTime,
      systemClock: this.ctx.systemClock,
      energyBefore
    });

    this.isSleeping = true;

    try {
      // Perform sleep consolidation
      await this.deps.sleepService.performSleepConsolidation(reason);

      // Mental energy recovery during sleep
      this.ctx.energyManager.deepRest();

      // Physical energy recovery: SOMNIA enters Dream and fully recovers φ
      this.ctx.somnia.forceDream();
      log.info('SOMNIA', `🌙 SOMNIA entered Dream mode for unified sleep (φ: ${phiBefore.toFixed(1)} → 100)`);

      const duration = Date.now() - startTime;
      const energyAfter = this.ctx.energyManager.getEnergyState().available;
      const phiAfter = this.ctx.somnia.getState().somatic.phi;

      this.lastSleepTime = Date.now();
      this.criticalModeDuration = 0;

      // Wake SOMNIA back up after sleep
      this.ctx.somnia.wakeUp();

      // Save energy recovery to database
      this.ctx.saveConsciousnessState();

      log.info('Consciousness', `✨ Sleep completed (duration: ${(duration/1000).toFixed(1)}s, mental: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}, physical/φ: ${phiBefore.toFixed(1)} → ${phiAfter.toFixed(1)})`);

      this.ctx.emit('sleepCompleted', {
        duration,
        energyBefore,
        energyAfter,
        phiBefore,
        phiAfter,
        timestamp: Date.now()
      });

      // Auto-restart consciousness after automatic sleep (but not manual sleep)
      if (!manual) {
        log.info('Consciousness', `▶️ Auto-restarting consciousness after automatic sleep (current isRunning: ${this.ctx.isRunning})`);
        if (!this.ctx.isRunning) {
          this.ctx.isRunning = true;
          this.ctx.isPaused = false;
        } else {
          log.warn('Consciousness', '⚠️ Consciousness is already running after sleep, skipping auto-restart');
        }
      }

    } catch (error) {
      log.error('Consciousness', 'Sleep mode error', error);
      this.ctx.emit('sleepError', { error: (error as Error).message });
    } finally {
      this.isSleeping = false;
    }
  }

  /**
   * Get sleep status
   */
  getSleepStatus(): { isSleeping: boolean; lastSleepTime: number; hoursSinceLastSleep: number } {
    const hoursSinceLastSleep = this.lastSleepTime === 0 ? 0 : (Date.now() - this.lastSleepTime) / (1000 * 60 * 60);
    return {
      isSleeping: this.isSleeping,
      lastSleepTime: this.lastSleepTime,
      hoursSinceLastSleep
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

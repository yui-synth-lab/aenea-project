/**
 * ConsciousnessBootstrap - startup-time state restoration (Phase 5, extracted
 * from ConsciousnessBackend).
 *
 * Restores mortality, clock, energy, DPD weights and SOMNIA state from the
 * database (or initializes a fresh consciousness) and seeds the question
 * categorizer. Runs from the facade constructor, so it only touches the
 * internals adapter's live views. Behavior is moved verbatim from the facade.
 */

import { log } from '../../platform/logger.js';
import { LifespanManager } from '../../aenea/mortality/lifespan-manager.js';
import type { ConsciousnessInternals } from './consciousness-internals.js';

export class ConsciousnessBootstrap {
  constructor(private ctx: ConsciousnessInternals) {}

  restoreFromDatabase(): void {
    try {
      console.log('[DEBUG] restoreFromDatabase called');

      // Initialize/load LifespanManager first
      try {
        const mortalityRecord = this.ctx.databaseManager.getLatestMortalityState();
        if (mortalityRecord && !mortalityRecord.died_at) {
          this.ctx.installMortality(new LifespanManager({
            instanceId: mortalityRecord.instance_id,
            lifespanMax: mortalityRecord.lifespan_max,
            currentCycle: mortalityRecord.current_cycle,
            mode: mortalityRecord.mode as 'A' | 'B',
            createdAt: mortalityRecord.created_at,
            diedAt: mortalityRecord.died_at
          }));
          log.info('Mortality', `Restored mortality state for instance: ${mortalityRecord.instance_id} (${mortalityRecord.current_cycle}/${mortalityRecord.lifespan_max})`);
        } else {
          this.ctx.spawnFreshMortality();
          log.info('Mortality', `Created new mortality instance: ${this.ctx.lifespanManager.getInstanceId()} with mode ${this.ctx.lifespanManager.getState().mode}`);
        }
      } catch (mortError) {
        log.error('Mortality', 'Failed to restore or initialize mortality, using default instance', mortError);
        this.ctx.installMortality(new LifespanManager());
      }

      const consciousnessState = this.ctx.databaseManager.getConsciousnessState();
      console.log('[DEBUG] consciousnessState:', consciousnessState);

      if (consciousnessState) {
        this.ctx.systemClock = consciousnessState.systemClock || 0;

        // Restore energy state from database
        if (consciousnessState.energy !== undefined) {
          this.ctx.energyManager.restoreEnergyState(consciousnessState.energy);
        }

        // Inherit consciousness from previous state
        this.inheritConsciousnessFromDatabase();

        // Restore SOMNIA affective state
        const somniaRecord = this.ctx.databaseManager.getLatestSomniaState();
        if (somniaRecord) {
          this.ctx.somnia.setState({
            mode: somniaRecord.mode,
            somatic: {
              lambda: somniaRecord.lambda,
              phi: somniaRecord.phi,
              mu: {
                serotonin: somniaRecord.mu_serotonin,
                dopamine: somniaRecord.mu_dopamine,
                cortisol: somniaRecord.mu_cortisol,
                oxytocin: somniaRecord.mu_oxytocin
              }
            },
            affective: {
              theta: somniaRecord.theta,
              psi: somniaRecord.psi,
              xi: somniaRecord.xi
            }
          });
          log.info('Consciousness', 'SOMNIA state restored from database', {
            mode: somniaRecord.mode,
            lambda: somniaRecord.lambda,
            phi: somniaRecord.phi,
            xi: somniaRecord.xi
          });
        }

        log.info('Consciousness', 'Consciousness state restored from database', {
          systemClock: this.ctx.systemClock,
          energy: this.ctx.energyManager.getEnergyState().available,
          totalQuestions: consciousnessState.totalQuestions,
          totalThoughts: consciousnessState.totalThoughts
        });
      } else {
        log.info('Consciousness', 'Starting fresh consciousness - no previous data');
        // Initialize with default consciousness state
        this.initializeFreshConsciousness();
      }
    } catch (error) {
      log.error('Consciousness', 'Failed to restore consciousness state', error);
      this.initializeFreshConsciousness();
    }
  }

  loadQuestionHistoryIntoCategorizer(): void {
    try {
      // Load recent questions from database (last 100) to populate categorizer history
      // ordered by timestamp DESC via the ThoughtRepository facade method.
      if (!this.ctx.databaseManager.isConnected()) {
        log.warn('Consciousness', 'Database not ready for loading question history');
        return;
      }

      const recentQuestions = this.ctx.databaseManager.getRecentQuestionRows(100);

      if (recentQuestions && recentQuestions.length > 0) {
        log.info('Consciousness', `📚 Loading ${recentQuestions.length} questions into categorizer for diversity tracking...`);

        for (const q of recentQuestions) {
          // Categorize and record each question
          const result = this.ctx.questionCategorizer.categorizeQuestion(q.question);
          this.ctx.questionCategorizer.recordQuestion(
            q.question,
            q.category || result.category,
            result.metrics,
            result.semanticAnalysis,
            true, // assume success
            q.importance || 0.5
          );
        }

        // Log category balance after loading
        const balance = this.ctx.questionCategorizer.getCategoryBalance();
        log.info('Consciousness', `📊 Category balance after loading history:`);
        balance.forEach(cat => {
          if (cat.recentCount > 0 || cat.totalCount > 0) {
            log.info('Consciousness', `   ${cat.category}: recent=${cat.recentCount}, total=${cat.totalCount}, ${cat.isOverused ? '⚠️ OVERUSED' : cat.isUnderused ? '📉 underused' : '✅ balanced'}`);
          }
        });
      } else {
        log.info('Consciousness', 'No question history found - categorizer starting fresh');
      }
    } catch (error) {
      log.error('Consciousness', 'Failed to load question history into categorizer', error);
    }
  }

  private inheritConsciousnessFromDatabase(): void {
    try {
      console.log('[DEBUG] inheritConsciousnessFromDatabase called');

      // 1. Load latest DPD weights from database
      const latestWeights = this.ctx.databaseManager.getLatestDPDWeights();
      console.log('[DEBUG] latestWeights:', latestWeights);

      if (latestWeights) {
        this.ctx.dpdWeights = {
          empathy: latestWeights.empathy,
          coherence: latestWeights.coherence,
          dissonance: latestWeights.dissonance,
          timestamp: latestWeights.timestamp,
          version: latestWeights.version
        };
        log.info('Consciousness', `🧠 Loaded DPD weights from database: version=${latestWeights.version}, empathy=${latestWeights.empathy.toFixed(3)}, coherence=${latestWeights.coherence.toFixed(3)}, dissonance=${latestWeights.dissonance.toFixed(3)}`);
        console.log('[DEBUG] DPD weights set to:', this.ctx.dpdWeights);
      } else {
        console.log('[DEBUG] No weights found in database, using defaults');
        // 2. Initialize default DPD weights if none exist in database
        this.ctx.dpdWeights = {
          empathy: 0.33,
          coherence: 0.33,
          dissonance: 0.34,
          timestamp: Date.now(),
          version: 1
        };
        log.info('Consciousness', '🧠 No DPD weights in database - initialized default weights');

        // Save initial weights to database
        this.ctx.databaseManager.saveDPDWeights(this.ctx.dpdWeights);
      }

      // 3. Record personality evolution snapshot
      this.recordPersonalitySnapshot();

    } catch (error) {
      log.error('Consciousness', 'Failed to inherit consciousness from database', error);
    }
  }

  private initializeFreshConsciousness(): void {
    if (!this.ctx.lifespanManager) {
      this.ctx.spawnFreshMortality();
    }

    this.ctx.systemClock = 0;
    this.ctx.dpdWeights = {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      timestamp: Date.now(),
      version: 1
    };
    this.ctx.energyManager.resetEnergy();

    // Save initial consciousness state
    this.ctx.saveConsciousnessState();

    log.info('Consciousness', 'Fresh consciousness initialized with default values');
  }

  private recordPersonalitySnapshot(): void {
    try {
      const traits = this.calculatePersonalityTraits();

      // Save personality snapshot
      // TODO: Implement personality snapshot saving in DatabaseManager

      log.info('Consciousness', '👤 Personality snapshot recorded for consciousness evolution', traits);
    } catch (error) {
      log.error('Consciousness', 'Failed to record personality snapshot', error);
    }
  }

  private calculatePersonalityTraits(): any {
    // Calculate based on current behavior patterns
    const energyLevel = this.ctx.energyManager.getEnergyState().available;

    return {
      curiosityLevel: Math.min(1.0, (this.ctx.systemClock * 0.01) + 0.5),
      empathyTendency: this.ctx.dpdWeights.empathy,
      systematicThinking: this.ctx.dpdWeights.coherence,
      contradictionAcceptance: this.ctx.dpdWeights.dissonance,
      energyManagement: energyLevel / 100.0,
      introspectionDepth: 0.8, // Base level
      creativityIndex: 0.7 // Base level
    };
  }
}

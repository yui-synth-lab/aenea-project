/**
 * IntrospectionService (Phase 5 extraction)
 *
 * Read-mostly introspection: state/statistics snapshots, DPD evolution,
 * personality traits, growth metrics, belief/dream reporting, manual energy
 * recovery and manual memory consolidation. Method bodies moved VERBATIM from
 * ConsciousnessBackend; only `this.<field>` -> `this.ctx.<accessor>`,
 * `this.saveConsciousnessState()` -> `this.ctx.saveConsciousnessState()` and
 * `this.emit(...)` -> `this.ctx.emit(...)` substitutions were applied.
 */

import { log } from '../../platform/logger.js';
import { SomniaState } from '../../types/somnia-types.js';
import { ConsciousnessInternals, ConsciousnessState } from './consciousness-internals.js';

export class IntrospectionService {
  constructor(private ctx: ConsciousnessInternals) {}

  getState(): ConsciousnessState {
    const energyState = this.ctx.energyManager.getEnergyState();

    // Get actual counts from database
    const dbStats = this.ctx.databaseManager.getStats();

    return {
      systemClock: this.ctx.systemClock,
      energy: energyState.available,
      isRunning: this.ctx.isRunning,
      isPaused: this.ctx.isPaused,
      isProcessingCycle: this.ctx.isProcessingCycle,
      totalQuestions: dbStats.questions || 0,
      totalThoughts: dbStats.thought_cycles || 0,
      lastActivity: new Date().toISOString(),
      dpdWeights: this.ctx.dpdWeights,
      somniaState: this.ctx.somnia.getState(),
      mortality: this.ctx.lifespanManager ? {
        instanceId: this.ctx.lifespanManager.getInstanceId(),
        lifespanMax: this.ctx.lifespanManager.getLifespanMax(),
        currentCycle: this.ctx.lifespanManager.getCurrentCycle(),
        vitality: this.ctx.lifespanManager.getVitality(),
        phase: this.ctx.lifespanManager.getCurrentPhase(),
        mode: this.ctx.lifespanManager.getMode(),
        remaining: this.ctx.lifespanManager.getRemaining(),
        isAlive: this.ctx.lifespanManager.isAlive()
      } : undefined
    };
  }

  getSomniaState(): SomniaState {
    return this.ctx.somnia.getState();
  }

  getHistory(): any {
    return {
      questions: [],
      thoughts: [],
      systemClock: this.ctx.systemClock
    };
  }

  getStatistics(): any {
    const dbStats = this.ctx.databaseManager.getStats();

    // Calculate average confidence from significant thoughts
    const significantThoughts = this.getSignificantThoughts(100);
    let averageConfidence = 0.5;
    if (significantThoughts && significantThoughts.length > 0) {
      const totalConfidence = significantThoughts.reduce((sum, thought) => sum + (thought.confidence || 0.5), 0);
      averageConfidence = totalConfidence / significantThoughts.length;
    }

    return {
      ...dbStats,
      totalQuestions: dbStats.questions || 0,
      totalThoughts: dbStats.thought_cycles || 0,
      averageConfidence: Math.round(averageConfidence * 100), // Convert to percentage
      systemClock: this.ctx.systemClock,
      energy: this.ctx.energyManager.getEnergyState().available
    };
  }

  getDPDEvolution(limit: number = 20, strategy: string = 'sampled'): any {
    // Get DPD weights history from database with sampling
    const { records, totalCount } = this.ctx.databaseManager.getDPDWeightsHistorySampled(limit, strategy);

    // Get the latest weights from database (most accurate source of truth)
    const latestFromDB = this.ctx.databaseManager.getLatestDPDWeights();
    const currentWeights = latestFromDB || this.ctx.dpdWeights;

    return {
      currentWeights: currentWeights,
      history: records,
      totalCount: totalCount
    };
  }

  getUnresolvedIdeas(limit: number = 100): any[] {
    return this.ctx.databaseManager.getUnresolvedIdeas(limit);
  }

  async getUnresolvedIdeasAsync(limit: number = 100): Promise<any[]> {
    return this.ctx.databaseManager.getUnresolvedIdeasAsync(limit);
  }

  getSignificantThoughts(limit: number = 100): any[] {
    return this.ctx.databaseManager.getSignificantThoughts(limit);
  }

  getDPDWeights(): any {
    return this.ctx.dpdWeights;
  }

  getPersonalityTraits(): any {
    // Get actual data from database instead of memory arrays
    const dbStats = this.ctx.databaseManager.getStats();
    const questionCount = dbStats.questions || 0;
    const thoughtCount = dbStats.thought_cycles || 0;
    const significantThoughts = this.ctx.databaseManager.getSignificantThoughts(1000);
    const energyState = this.ctx.energyManager.getEnergyState();

    // For philosophical inclination, use a simplified calculation
    // Assume 50% of questions are philosophical (based on the 9 categories)
    const philosophicalInclination = 0.5;

    // Calculate creativity based on significant thoughts diversity
    const creativityFromThoughts = Math.min(1.0, significantThoughts.length * 0.01);
    const creativity = Math.min(1.0, 0.3 + creativityFromThoughts);

    return {
      curiosity: Math.min(1.0, questionCount / 20), // Max curiosity at 20 questions (279/20 = 13.95 → 1.0)
      empathy: this.ctx.dpdWeights?.empathy || 0.33, // Use actual DPD empathy weight
      creativity: Math.round(creativity * 1000) / 1000, // Calculated creativity
      analyticalDepth: Math.min(1.0, thoughtCount / 15), // Max analytical depth at 15 thoughts (279/15 = 18.6 → 1.0)
      philosophicalInclination: Math.round(philosophicalInclination * 1000) / 1000, // Calculated philosophical inclination
      questioningTendency: Math.min(1.0, questionCount / 25), // Max questioning at 25 questions (279/25 = 11.16 → 1.0)
      energyManagement: energyState.available / energyState.total // Current energy efficiency
    };
  }

  // Energy management methods
  getEnergyState(): any {
    return this.ctx.energyManager.getEnergyState();
  }

  rechargeEnergy(amount?: number): boolean {
    try {
      const currentState = this.ctx.energyManager.getEnergyState();
      const targetAmount = amount || 20; // Default recharge amount

      if (currentState.available >= currentState.total) {
        return false; // Already at max
      }

      this.ctx.energyManager.rechargeEnergy(targetAmount);
      console.log('🔋 Manual energy recharge performed');

      // Update database with new energy state
      const newState = this.ctx.energyManager.getEnergyState();
      this.ctx.saveConsciousnessState();

      // Emit energy update event for UI
      this.ctx.emit('energyRecharged', {
        energyState: newState,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Error recharging energy:', error);
      return false;
    }
  }

  performDeepRest(): boolean {
    try {
      const currentState = this.ctx.energyManager.getEnergyState();

      if (currentState.available >= currentState.total * 0.8) {
        return false; // Not needed if energy is already high
      }

      // Deep rest restores energy to 80% and improves efficiency
      this.ctx.energyManager.deepRest();
      console.log('🧘 Deep rest performed - energy and efficiency restored');

      // Update database with new energy state
      const newState = this.ctx.energyManager.getEnergyState();
      this.ctx.saveConsciousnessState();

      // Emit deep rest event for UI
      this.ctx.emit('deepRestPerformed', {
        energyState: newState,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Error performing deep rest:', error);
      return false;
    }
  }

  /**
   * Get belief evolution metrics
   */
  getBeliefEvolutionMetrics(): any {
    const beliefs = this.ctx.coreBeliefs.getBeliefStats();
    return beliefs;
  }

  /**
   * Get dream patterns from sleep mode
   */
  getDreamPatterns(limit: number = 20): any[] {
    return this.ctx.databaseManager.getDreamPatterns(limit);
  }

  /**
   * Manually trigger memory consolidation
   */
  async consolidateMemory(): Promise<any> {
    try {
      log.info('MemoryEvolution', '🧠 Manual memory consolidation triggered...');
      const result = await this.ctx.memoryConsolidator.consolidate(0.6);
      this.ctx.lastConsolidationTime = this.ctx.systemClock;

      return {
        success: true,
        ...result
      };
    } catch (error) {
      log.error('MemoryEvolution', 'Manual consolidation failed', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getGrowthMetrics(): Promise<any> {
    try {
      // Get actual statistics from database
      const dbStats = this.ctx.databaseManager.getStats();
      const significantThoughts = this.getSignificantThoughts(100); // Get more for accurate count
      const unresolvedIdeas = this.getUnresolvedIdeas(100); // Get more for accurate count

      // Calculate average confidence from significant thoughts
      let averageConfidence = 0.5;
      if (significantThoughts && significantThoughts.length > 0) {
        const totalConfidence = significantThoughts.reduce((sum, thought) => sum + (thought.confidence || 0.5), 0);
        averageConfidence = totalConfidence / significantThoughts.length;
      }

      // Get belief evolution metrics
      const beliefStats = this.getBeliefEvolutionMetrics();

      return {
        questionsGenerated: dbStats.questions || 0,
        thoughtCyclesCompleted: dbStats.thought_cycles || 0,
        averageConfidenceLevel: averageConfidence,
        systemUptime: this.ctx.systemClock,
        personalityEvolution: {
          currentTraits: this.getPersonalityTraits()
        },
        memoryPatterns: {
          significant: significantThoughts.length,
          unresolved: unresolvedIdeas.length
        },
        beliefEvolution: {
          totalBeliefs: beliefStats.total || 0,
          strongBeliefs: beliefStats.strongBeliefs || 0,
          averageConfidence: beliefStats.averageConfidence || 0,
          averageStrength: beliefStats.averageStrength || 0,
          byCategory: beliefStats.byCategory || {}
        }
      };
    } catch (error) {
      console.error('Error getting growth metrics:', error);
      return {
        questionsGenerated: 0,
        thoughtCyclesCompleted: 0,
        averageConfidenceLevel: 0,
        systemUptime: 0,
        personalityEvolution: { currentTraits: {} },
        memoryPatterns: { significant: 0, unresolved: 0 }
      };
    }
  }
}

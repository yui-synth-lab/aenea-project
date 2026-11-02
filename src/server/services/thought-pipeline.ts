/**
 * ThoughtPipeline (Phase 5b extraction)
 *
 * Pipeline stage methods and supporting helpers for the consciousness thought
 * cycle. Method bodies moved VERBATIM from ConsciousnessBackend; only
 * `this.<field>` -> `this.ctx.<accessor>`, `this.emit(...)` ->
 * `this.ctx.emit(...)`, and `this.saveConsciousnessState()` ->
 * `this.ctx.saveConsciousnessState()` substitutions were applied.
 * `this.systemClock++` is rewritten as `this.ctx.systemClock++`.
 */

import { log } from '../../platform/logger.js';
import { InternalTrigger } from '../../types/aenea-types.js';
import { AgingEngine } from '../../aenea/mortality/aging-engine.js';
import { emotiveSync } from '../../aenea/integration/saip.js';
import { createSOMNIAQualiaPrompt, SOMNIA_QUALIA_SYSTEM_PROMPT } from '../../aenea/templates/prompts.js';
import { parseJsonArray } from '../../utils/json-parser.js';
import type { DPDScores } from '../../types/dpd-types.js';
import { ConsciousnessInternals, ThoughtCycle } from './consciousness-internals.js';
import { MemoryInsightService } from './memory-insight-service.js';
import { calculateFallbackDPDScores } from './fallback-dpd.js';
import { isValidQuestion, sanitizeAndSplitQuestions } from './question-validator.js';

export class ThoughtPipeline {
  constructor(
    private ctx: ConsciousnessInternals,
    private memoryInsight: MemoryInsightService = new MemoryInsightService(ctx)
  ) {}

  // ============================================================================
  // Adaptive Thought Cycle Orchestration
  // ============================================================================

  async executeAdaptiveThoughtCycle(trigger: InternalTrigger): Promise<void> {
    const thoughtCycle: ThoughtCycle = {
      id: `cycle_${Date.now()}`,
      timestamp: Date.now(),
      trigger,
      thoughts: [],
      status: 'processing',
      totalEnergy: 0,
      totalStages: 0
    };

    // Adaptive execution based on energy availability
    const energyState = this.ctx.energyManager.getEnergyState();
    let executionMode = 'full';
    let requiredEnergy = 3.3; // Critical mode minimum

    if (energyState.available < 20) {
      executionMode = 'critical'; // Only essential stages
      requiredEnergy = 3.3; // S0(1.0) + S1(1.0) + S5(0.8) + S6(0.3) + U(0.2)
    } else if (energyState.available < 50) {
      executionMode = 'low'; // Reduced processing
      requiredEnergy = 4.8; // Critical + S2(0.5) + S3(0.5) + S4(0.5)
    } else {
      executionMode = 'full';
      requiredEnergy = 5.8; // All stages at full capacity
    }

    // Reserve energy for the entire thought cycle to prevent interruption
    const energyReserved = this.ctx.energyManager.reserveEnergy(requiredEnergy, `thought_cycle_${thoughtCycle.id}`);

    if (!energyReserved) {
      log.warn('ThoughtCycle', `⚠️ Failed to reserve ${requiredEnergy} energy - aborting cycle`);
      return;
    }

    log.info('ThoughtCycle', `${executionMode === 'full' ? 'Full' : executionMode === 'low' ? 'Low' : 'Critical'} energy mode: reserved ${requiredEnergy.toFixed(1)} energy for complete cycle`);

    // XENIA: if this trigger is an unread letter, mark it read now and keep
    // a handle so the reply composer can run after S6 (XENIA_SPEC v0.1, 5.2).
    // No-op when XENIA is disabled (xeniaInbox is null).
    const xeniaLetter = this.ctx.xeniaInbox
      ? this.ctx.xeniaInbox.matchAndMarkRead(trigger.question, this.ctx.systemClock)
      : null;

    try {
      // S0: Trigger Generation (already completed, consume energy)
      // Emit stage start event
      this.ctx.emit('stageChanged', {
        stage: 'S0',
        name: 'Internal Trigger Generation',
        status: 'in_progress',
        timestamp: Date.now()
      });

      const s0EnergyCost = 1.0;
      await this.ctx.energyManager.consumeEnergy(s0EnergyCost, 'stage_S0');
      thoughtCycle.totalEnergy += s0EnergyCost;
      thoughtCycle.totalStages++;
      log.info('StageS0', `Internal trigger generated: "${trigger.question.substring(0, 60)}..."`);

      // Emit stage completion event
      this.ctx.emit('stageCompleted', {
        stage: 'S0',
        name: 'Internal Trigger Generation',
        status: 'completed',
        timestamp: Date.now(),
        question: trigger.question.substring(0, 100),
        category: trigger.category
      });

      // Stage execution based on energy mode
      await this.executeIndividualThought(thoughtCycle);

      if (executionMode !== 'critical') {
        await this.executeMutualReflection(thoughtCycle);
        await this.executeAuditor(thoughtCycle);
        await this.executeDPDAssessment(thoughtCycle);
      } else {
        // Critical mode: Use fast heuristic DPD scoring
        await this.executeFallbackDPDAssessment(thoughtCycle);
      }

      await this.executeCompiler(thoughtCycle);
      await this.executeScribe(thoughtCycle);
      await this.executeWeightUpdate(thoughtCycle);

      // XENIA: optional reply step, letter cycles only. Silence is a valid
      // outcome and is recorded either way by the composer.
      if (xeniaLetter && this.ctx.xeniaComposer) {
        try {
          const executor = this.ctx.agents.get('theoria');
          if (executor) {
            await this.ctx.energyManager.consumeEnergy(0.3, 'stage_xenia_reply');
            thoughtCycle.totalEnergy += 0.3;
            await this.ctx.xeniaComposer.compose(xeniaLetter, thoughtCycle, executor);
          }
        } catch (xeniaErr) {
          log.warn('Xenia', `Reply step failed: ${(xeniaErr as Error).message}`);
        }
      }

      // Record significant thoughts (with content cleanup)
      await this.recordSignificantThoughtsFromCycle(thoughtCycle);

      // Extract unresolved ideas from this cycle
      try {
        this.extractUnresolvedIdeasFromCycle(thoughtCycle);
        console.log(`[DEBUG] Successfully extracted unresolved ideas from cycle`);
      } catch (error) {
        console.error(`[DEBUG] Error extracting unresolved ideas:`, error);
        // Continue execution even if this fails
      }

      console.log(`[DEBUG] About to increment systemClock from ${this.ctx.systemClock} to ${this.ctx.systemClock + 1}`);
      this.ctx.systemClock++;
      console.log(`[DEBUG] SystemClock incremented to: ${this.ctx.systemClock}`);

      thoughtCycle.status = 'completed';
      thoughtCycle.duration = Date.now() - thoughtCycle.timestamp;

      // Release reserved energy and consume only what was actually used
      // The individual stage executions have already consumed energy,
      // so we just release the reservation
      const releasedEnergy = this.ctx.energyManager.releaseReservedEnergy();
      log.info('ThoughtCycle', `✅ Cycle completed - released ${releasedEnergy.toFixed(1)} reserved energy, actual consumption tracked per stage`);

      // Save consciousness state
      this.ctx.saveConsciousnessState();

      // Save completed thought cycle to database
      this.ctx.databaseManager.saveThoughtCycle(thoughtCycle);

      // Periodic memory consolidation (every 5 cycles)
      // Sleep Mode provides deeper consolidation and belief merging
      await this.memoryInsight.performPeriodicConsolidation();

      // Emit completion event with minimal essential data (not full thoughtCycle)
      const dbStats = this.ctx.databaseManager.getStats();
      this.ctx.emit('thoughtCycleCompleted', {
        id: thoughtCycle.id,
        timestamp: thoughtCycle.timestamp,
        status: thoughtCycle.status,
        duration: thoughtCycle.duration,
        totalEnergy: thoughtCycle.totalEnergy,
        totalStages: thoughtCycle.totalStages,
        // Minimal trigger info
        trigger: {
          question: thoughtCycle.trigger.question.substring(0, 100),
          category: thoughtCycle.trigger.category
        },
        // DPD scores (numeric only)
        dpdScores: thoughtCycle.dpdScores ? {
          empathy: thoughtCycle.dpdScores.empathy.toFixed(3),
          coherence: thoughtCycle.dpdScores.coherence.toFixed(3),
          dissonance: thoughtCycle.dpdScores.dissonance.toFixed(3),
          weightedTotal: thoughtCycle.dpdScores.weightedTotal.toFixed(3)
        } : null,
        // Current DPD weights
        dpdWeights: {
          empathy: this.ctx.dpdWeights.empathy.toFixed(3),
          coherence: this.ctx.dpdWeights.coherence.toFixed(3),
          dissonance: this.ctx.dpdWeights.dissonance.toFixed(3),
          version: this.ctx.dpdWeights.version
        },
        // System statistics
        systemClock: this.ctx.systemClock,
        totalQuestions: dbStats.questions || 0,
        totalThoughts: dbStats.thought_cycles || 0,
        averageConfidence: (() => {
          const significantThoughts = this.ctx.databaseManager.getSignificantThoughts(100);
          if (significantThoughts && significantThoughts.length > 0) {
            const totalConfidence = significantThoughts.reduce((sum: number, thought: any) => sum + (thought.confidence || 0.5), 0);
            return Math.round((totalConfidence / significantThoughts.length) * 100);
          }
          return Math.round(0.5 * 100);
        })(),
        energy: this.ctx.energyManager.getEnergyState().available
      });

    } catch (error) {
      // Release reserved energy even on failure
      const releasedEnergy = this.ctx.energyManager.releaseReservedEnergy();
      log.warn('ThoughtCycle', `❌ Cycle failed - released ${releasedEnergy.toFixed(1)} reserved energy`);

      thoughtCycle.status = 'failed';
      log.error('Consciousness', 'Thought cycle failed', error);
      this.ctx.emit('thoughtCycleFailed', { id: thoughtCycle.id, error: (error as Error).message });
    }
  }

  // ============================================================================
  // Stage Execution Methods
  // ============================================================================

  async executeIndividualThought(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.ctx.emit('stageChanged', {
      stage: 'S1',
      name: 'Individual Thought',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 1.0;
    await this.ctx.energyManager.consumeEnergy(energyCost, 'stage_S1');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const somniaQualia = this.ctx.somnia.getState().cognitive.qualia;
    const thoughts = await this.ctx.individualThoughtStage.run(thoughtCycle, somniaQualia);
    thoughtCycle.thoughts = thoughts;

    // Emit stage completion event
    this.ctx.emit('stageCompleted', {
      stage: 'S1',
      name: 'Individual Thought',
      status: 'completed',
      timestamp: Date.now(),
      thoughtCount: thoughts.length
    });
  }

  async executeMutualReflection(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.ctx.emit('stageChanged', {
      stage: 'S2',
      name: 'Mutual Reflection',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.5;
    await this.ctx.energyManager.consumeEnergy(energyCost, 'stage_S2');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const reflections = await this.ctx.mutualReflectionStage.run(thoughtCycle.thoughts);

    // Store reflections array for S5 Compiler to use
    thoughtCycle.mutualReflections = reflections;

    // Convert reflections to the expected format for event emission
    const crossAgentFeedback = reflections.map(r => ({
      fromAgent: r.reflectorId,
      toAgent: r.targetThoughts[0],
      content: r.insights.join(' '),
      sentiment: 'constructive'
    }));

    const conflictPoints = reflections.flatMap(r => r.weaknesses || []);
    const consensusPoints = reflections.flatMap(r => r.strengths || []);

    log.info('StageS2', `Mutual Reflection completed with ${reflections.length} reflections`);

    // Emit stage completion event for UI (minimal data)
    const avgConfidence = reflections.length > 0
      ? reflections.reduce((sum, r) => sum + r.confidence, 0) / reflections.length
      : 0.5;

    this.ctx.emit('stageCompleted', {
      stage: 'S2',
      name: 'Mutual Reflection',
      status: 'completed',
      timestamp: Date.now(),
      feedbackCount: crossAgentFeedback.length,
      conflictCount: conflictPoints.length,
      consensusCount: consensusPoints.length,
      // Only send preview of first 2 items, not all feedback
      feedbackPreviews: crossAgentFeedback.slice(0, 2).map(feedback => ({
        fromAgent: feedback.fromAgent,
        toAgent: feedback.toAgent,
        preview: feedback.content.substring(0, 80) + '...',
        sentiment: feedback.sentiment
      })),
      conflictPreview: conflictPoints.length > 0 ? conflictPoints[0].substring(0, 80) + '...' : null,
      consensusPreview: consensusPoints.length > 0 ? consensusPoints[0].substring(0, 80) + '...' : null
    });
  }

  async executeAuditor(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.ctx.emit('stageChanged', {
      stage: 'S3',
      name: 'Auditor',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.5;
    await this.ctx.energyManager.consumeEnergy(energyCost, 'stage_S3');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const auditorResult = await this.ctx.auditorStage.run(
      thoughtCycle.thoughts,
      this.ctx.agents
    );

    thoughtCycle.auditorResult = auditorResult;

    log.info('StageS3', 'Auditor completed');

    // Emit stage completion event for UI (minimal data)
    this.ctx.emit('stageCompleted', {
      stage: 'S3',
      name: 'Auditor',
      status: 'completed',
      timestamp: Date.now(),
      safetyScore: auditorResult.safetyScore,
      approved: auditorResult.approved,
      warningCount: (auditorResult as any).warnings?.length || 0,
      recommendationCount: auditorResult.recommendations?.length || 0,
      // Only send preview of first item, not all warnings/recommendations
      warningPreview: (auditorResult as any).warnings?.length > 0 ?
        (auditorResult as any).warnings[0].substring(0, 80) + '...' : null,
      recommendationPreview: auditorResult.recommendations?.length > 0 ?
        auditorResult.recommendations[0].substring(0, 80) + '...' : null
    });
  }

  async executeDPDAssessment(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.ctx.emit('stageChanged', {
      stage: 'S4',
      name: 'DPD Assessment',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.5;
    await this.ctx.energyManager.consumeEnergy(energyCost, 'stage_S4');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    // Emotive Sync from Somnia
    const currentState = this.ctx.somnia.getState();
    const somniaInfluence = emotiveSync(currentState);

    this.ctx.databaseManager.saveSomniaSaipEvent({
      eventType: 'emotive_sync',
      somniaState: currentState,
      influence: somniaInfluence,
      impactScore: (somniaInfluence.empathy + somniaInfluence.coherence + somniaInfluence.dissonance) / 3
    });

    // Use the dedicated DPDAssessmentStage implementation
    const result = await this.ctx.dpdAssessmentStage.run(
      thoughtCycle.thoughts,
      thoughtCycle.mutualReflections || [],
      thoughtCycle.auditorResult as any || {
        risk: 'LOW' as any,
        safetyScore: 0.8,
        ethicsScore: 0.8,
        concerns: [],
        recommendations: []
      },
      thoughtCycle.trigger, // Pass trigger for impact assessment
      somniaInfluence // Pass somnia influence
    );

    // Apply DPD score biases from aging
    const biasedScores = AgingEngine.applyDPDBiases(
      result.scores,
      this.ctx.lifespanManager.getVitality()
    );
    const weightedTotal = biasedScores.empathy * result.weights.empathy +
                          biasedScores.coherence * result.weights.coherence +
                          biasedScores.dissonance * result.weights.dissonance;
    const finalScores = {
      ...result.scores,
      ...biasedScores,
      weightedTotal
    };

    thoughtCycle.dpdScores = finalScores;
    thoughtCycle.impactAssessment = result.assessment.impactAssessment; // Store impact assessment
    this.ctx.dpdWeights = result.weights; // Update current weights
    this.ctx.previousDpdScores = finalScores; // Cache for SAIP reflective return

    console.log(`[Backend S4] DPD Scores calculated: empathy=${result.scores.empathy.toFixed(3)}, coherence=${result.scores.coherence.toFixed(3)}, dissonance=${result.scores.dissonance.toFixed(3)}, weighted=${result.scores.weightedTotal.toFixed(3)} at ${new Date().toISOString()}`);

    if (result.assessment.impactAssessment?.isParadigmShift) {
      console.log(`[Backend S4] ⚡ PARADIGM SHIFT DETECTED: ${result.assessment.impactAssessment.reasoning}`);
    }

    log.info('StageS4', `DPD Assessment completed at ${new Date().toISOString()}`);

    // Emit stage completion event for UI (with size limits to prevent JSON errors)
    this.ctx.emit('stageCompleted', {
      stage: 'S4',
      name: 'DPD Assessment',
      status: 'completed',
      timestamp: Date.now(),
      // Only include essential DPD scores (not the full assessment object)
      empathy: result.scores.empathy.toFixed(3),
      coherence: result.scores.coherence.toFixed(3),
      dissonance: result.scores.dissonance.toFixed(3),
      weightedTotal: result.scores.weightedTotal.toFixed(3),
      currentWeights: {
        empathy: this.ctx.dpdWeights.empathy.toFixed(3),
        coherence: this.ctx.dpdWeights.coherence.toFixed(3),
        dissonance: this.ctx.dpdWeights.dissonance.toFixed(3)
      }
    });
  }

  /**
   * Fallback DPD Assessment for critical energy mode (heuristic-based, fast)
   */
  async executeFallbackDPDAssessment(thoughtCycle: ThoughtCycle): Promise<void> {
    console.log(`[Backend S4-Fallback] Starting fallback DPD scoring (critical mode) at ${new Date().toISOString()}`);

    // Emit stage start event
    this.ctx.emit('stageChanged', {
      stage: 'S4',
      name: 'DPD Assessment (Heuristic)',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.1; // Much cheaper than AI-based assessment (0.5)
    await this.ctx.energyManager.consumeEnergy(energyCost, 'stage_S4_fallback');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    // Calculate heuristic-based DPD scores
    const scores = calculateFallbackDPDScores(thoughtCycle, this.ctx.dpdWeights);
    const biasedScores = AgingEngine.applyDPDBiases(
      scores,
      this.ctx.lifespanManager.getVitality()
    );
    const weightedTotal = biasedScores.empathy * this.ctx.dpdWeights.empathy +
                          biasedScores.coherence * this.ctx.dpdWeights.coherence +
                          biasedScores.dissonance * this.ctx.dpdWeights.dissonance;
    const finalScores = {
      ...scores,
      ...biasedScores,
      weightedTotal,
      timestamp: Date.now(),
      context: {
        trigger: thoughtCycle.trigger.question,
        thoughtCount: thoughtCycle.thoughts.length,
        energyMode: 'critical' as const
      }
    };
    thoughtCycle.dpdScores = finalScores;

    log.info('StageS4-Fallback', `Heuristic DPD scores: empathy=${scores.empathy.toFixed(3)}, coherence=${scores.coherence.toFixed(3)}, dissonance=${scores.dissonance.toFixed(3)}`);

    // Emit stage completion event
    this.ctx.emit('stageCompleted', {
      stage: 'S4',
      name: 'DPD Assessment (Heuristic)',
      status: 'completed',
      timestamp: Date.now(),
      empathy: scores.empathy.toFixed(3),
      coherence: scores.coherence.toFixed(3),
      dissonance: scores.dissonance.toFixed(3),
      weightedTotal: scores.weightedTotal.toFixed(3),
      currentWeights: {
        empathy: this.ctx.dpdWeights.empathy.toFixed(3),
        coherence: this.ctx.dpdWeights.coherence.toFixed(3),
        dissonance: this.ctx.dpdWeights.dissonance.toFixed(3)
      },
      method: 'heuristic'
    });
  }


  async executeCompiler(thoughtCycle: ThoughtCycle): Promise<void> {
    console.log(`[Backend S5] Starting Compiler stage at ${new Date().toISOString()}`);

    // Emit stage start event
    this.ctx.emit('stageChanged', {
      stage: 'S5',
      name: 'Compiler',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.8;
    await this.ctx.energyManager.consumeEnergy(energyCost, 'stage_S5');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const synthesis = await this.ctx.compilerStage.run(
      thoughtCycle.thoughts,
      thoughtCycle.mutualReflections || [],
      thoughtCycle.auditorResult as any
    );

    thoughtCycle.synthesis = synthesis;

    log.info('StageS5', `Compiler completed at ${new Date().toISOString()}`);

    // Emit stage completion event for UI (minimal data)
    this.ctx.emit('stageCompleted', {
      stage: 'S5',
      name: 'Compiler',
      status: 'completed',
      timestamp: Date.now(),
      confidence: synthesis.confidence,
      insightsCount: synthesis.keyInsights?.length || 0,
      contradictionsCount: synthesis.contradictions?.length || 0,
      unresolvedQuestionsCount: synthesis.unresolvedQuestions?.length || 0,
      // Only send preview of integrated thought, not all insights
      integratedThoughtPreview: (synthesis.integratedThought || '').substring(0, 100) + '...',
      firstInsight: synthesis.keyInsights?.length > 0 ?
        (typeof synthesis.keyInsights[0] === 'string' ?
          synthesis.keyInsights[0].substring(0, 80) + '...' :
          String(synthesis.keyInsights[0] || '')) : null
    });
  }

  async executeScribe(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.ctx.emit('stageChanged', {
      stage: 'S6',
      name: 'Scribe',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.3;
    await this.ctx.energyManager.consumeEnergy(energyCost, 'stage_S6');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const documentation = await this.ctx.scribeStage.run(
      thoughtCycle.synthesis as any,
      thoughtCycle.dpdScores || null
    );

    thoughtCycle.documentation = documentation;

    log.info('StageS6', 'Scribe completed');

    // Emit stage completion event for UI (minimal data)
    this.ctx.emit('stageCompleted', {
      stage: 'S6',
      name: 'Scribe',
      status: 'completed',
      timestamp: Date.now(),
      narrativePreview: documentation.narrative.substring(0, 150) + '...',
      questionsCount: documentation.futureQuestions.length,
      philosophicalCount: documentation.philosophicalNotes.length,
      emotionalCount: documentation.emotionalObservations.length,
      growthCount: documentation.growthObservations.length,
      // Only send first item from each category
      firstPhilosophical: documentation.philosophicalNotes.length > 0 ?
        documentation.philosophicalNotes[0].substring(0, 80) + '...' : null,
      firstEmotional: documentation.emotionalObservations.length > 0 ?
        documentation.emotionalObservations[0].substring(0, 80) + '...' : null,
      firstGrowth: documentation.growthObservations.length > 0 ?
        documentation.growthObservations[0].substring(0, 80) + '...' : null,
      firstQuestion: documentation.futureQuestions.length > 0 ?
        documentation.futureQuestions[0].substring(0, 100) + '...' : null
    });
  }

  async executeWeightUpdate(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.ctx.emit('stageChanged', {
      stage: 'U',
      name: 'Weight Update',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.2;
    await this.ctx.energyManager.consumeEnergy(energyCost, 'stage_U');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    if (thoughtCycle.dpdScores) {
      const updatedWeights = await this.ctx.weightUpdateStage.run(
        thoughtCycle.dpdScores,
        this.ctx.dpdWeights,
        thoughtCycle.impactAssessment // Pass impact assessment for paradigm shift detection
      );

      this.ctx.dpdWeights = updatedWeights;
      thoughtCycle.dpdWeights = { ...updatedWeights };

      console.log(`DPD weights updated: empathy=${updatedWeights.empathy.toFixed(3)}, coherence=${updatedWeights.coherence.toFixed(3)}, dissonance=${updatedWeights.dissonance.toFixed(3)}`);

      if (thoughtCycle.impactAssessment?.isParadigmShift) {
        console.log(`[Backend U] ⚡ Paradigm shift perturbation applied to DPD weights`);
      }

      // Save DPD weights to database
      this.ctx.databaseManager.saveDPDWeights(updatedWeights);

      // Emit DPD update event (minimal data only)
      this.ctx.emit('dpdUpdated', {
        weights: {
          empathy: updatedWeights.empathy,
          coherence: updatedWeights.coherence,
          dissonance: updatedWeights.dissonance,
          version: updatedWeights.version
        },
        scores: thoughtCycle.dpdScores ? {
          empathy: thoughtCycle.dpdScores.empathy,
          coherence: thoughtCycle.dpdScores.coherence,
          dissonance: thoughtCycle.dpdScores.dissonance,
          weightedTotal: thoughtCycle.dpdScores.weightedTotal
        } : null,
        timestamp: Date.now()
      });
    }

    log.info('StageU', 'Weight Update completed');

    // Emit stage completion event
    this.ctx.emit('stageCompleted', {
      stage: 'U',
      name: 'Weight Update',
      status: 'completed',
      timestamp: Date.now(),
      weightsUpdated: !!thoughtCycle.dpdScores,
      weights: this.ctx.dpdWeights,
      version: this.ctx.dpdWeights.version,
      empathyWeight: this.ctx.dpdWeights.empathy.toFixed(3),
      coherenceWeight: this.ctx.dpdWeights.coherence.toFixed(3),
      dissonanceWeight: this.ctx.dpdWeights.dissonance.toFixed(3)
    });
  }

  // ============================================================================
  // Memory and Learning
  // ============================================================================

  async recordSignificantThoughtsFromCycle(thoughtCycle: ThoughtCycle): Promise<void> {
    if (!thoughtCycle.thoughts) return;

    log.info('Consciousness', `🔍 About to record significant thoughts from cycle. thoughtCycle.thoughts exists: ${!!thoughtCycle.thoughts}, length: ${thoughtCycle.thoughts.length}`);
    log.info('Consciousness', `🔍 Checking ${thoughtCycle.thoughts.length} thoughts for significance (confidence > 0.6)`);

    let significantCount = 0;

    for (const [index, thought] of thoughtCycle.thoughts.entries()) {
      log.info('Consciousness', `🔍 Thought ${index + 1}: agentId=${thought.agentId}, confidence=${thought.confidence}`);

      if (thought.confidence > 0.6) {
        log.info('Consciousness', `✅ Recording significant thought: confidence=${thought.confidence}`);

        // Clean the content before saving
        const cleanedContent = await this.ctx.contentCleanup.cleanThought(thought.content);

        // Use the original question category from the trigger
        const category = thoughtCycle.trigger?.category || 'philosophical';

        this.ctx.databaseManager.recordSignificantThought({
          id: thought.id,
          content: cleanedContent,
          confidence: thought.confidence,
          significanceScore: thought.confidence,
          agentId: thought.agentId,
          category: category,
          timestamp: thought.timestamp
        });

        significantCount++;
      }
    }

    log.info('Consciousness', `💭 ${significantCount} significant thoughts recorded from current cycle`);
    log.info('Consciousness', '🔍 Finished recording significant thoughts from cycle');
  }


  extractUnresolvedIdeasFromCycle(thoughtCycle: ThoughtCycle): void {
    const unresolvedIdeas: any[] = [];

    // Get existing significant thoughts to avoid logical inconsistency
    const existingSignificantThoughts = this.ctx.databaseManager.getSignificantThoughts(100);
    const significantQuestions = new Set(existingSignificantThoughts
      .map((thought: any) => thought.thought_content?.toLowerCase()?.trim())
      .filter((content: any) => content));

    const addQuestions = (rawList: string[], idPrefix: string, importance: number, defaultCategory: string) => {
      rawList.forEach((raw: string) => {
        const candidates = sanitizeAndSplitQuestions(raw);
        candidates.forEach(question => {
          if (!isValidQuestion(question)) {
            log.debug('Consciousness', `⚠️ Rejected non-question from ${idPrefix}: ${question.substring(0, 50)}`);
            return;
          }
          if (significantQuestions.has(question.toLowerCase().trim())) {
            log.debug('Consciousness', `⚙️ Skipping (already significant): ${question.substring(0, 50)}`);
            return;
          }
          const category = this.ctx.questionCategorizer.categorizeQuestion(question).category || defaultCategory;
          unresolvedIdeas.push({
            id: `${idPrefix}_${Date.now()}_${Math.random()}`,
            question,
            category,
            importance,
            firstEncountered: Date.now()
          });
          log.debug('Consciousness', `📝 [${category}] ${question.substring(0, 60)}`);
        });
      });
    };

    if (thoughtCycle.synthesis?.unresolvedQuestions) {
      addQuestions(thoughtCycle.synthesis.unresolvedQuestions, 'unresolved', 0.7, 'philosophical');
    }

    if (thoughtCycle.documentation?.futureQuestions) {
      addQuestions(thoughtCycle.documentation.futureQuestions, 'future', 0.6, 'exploratory');
    }

    // Save to database (only non-duplicate questions that aren't already significant)
    unresolvedIdeas.forEach(idea => {
      this.ctx.databaseManager.addUnresolvedIdea(idea);
    });

    if (unresolvedIdeas.length > 0) {
      log.info('Consciousness', `🧩 Added ${unresolvedIdeas.length} genuinely unresolved ideas to database`);
    }
  }

  // ============================================================================
  // Internal Trigger Generation (Refactored - Delegated to InternalTriggerGenerator)
  // ============================================================================

  async generateInternalTrigger(): Promise<InternalTrigger | null> {
    // Note: Energy consumption for trigger generation (S0) is handled by executeAdaptiveThoughtCycle
    // Don't consume energy here to avoid double-counting

    // Delegate to InternalTriggerGenerator (refactored architecture)
    if (!this.ctx.triggerGenerator) {
      log.error('Trigger', 'InternalTriggerGenerator not initialized');
      return null;
    }

    // Transfer pending manual trigger if exists
    if (this.ctx.pendingManualTrigger) {
      this.ctx.triggerGenerator.setManualTrigger(this.ctx.pendingManualTrigger);
      this.ctx.pendingManualTrigger = null;
    }

    // Generate trigger using new architecture
    return await this.ctx.triggerGenerator.generate();
  }

}

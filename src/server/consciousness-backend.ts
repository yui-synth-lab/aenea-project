/**
 * Aenea Consciousness Backend (TypeScript)
 */

import { log } from './logger.js';
import { SQLiteSessionManager } from './sqlite-session-manager.js';
import { createAIExecutor, AIExecutor } from './ai-executor.js';
import { getEnergyManager, EnergyManager } from '../utils/energy-management.js';
import MutualReflectionStage from '../aenea/stages/mutual-reflection.js';
import AuditorStage from '../aenea/stages/auditor.js';
import DPDAssessmentStage from '../aenea/stages/dpd-assessors.js';
import CompilerStage from '../aenea/stages/compiler.js';
import ScribeStage from '../aenea/stages/scribe.js';
import WeightUpdateStage from '../aenea/stages/weight-update.js';
import { StructuredThought, MutualReflection, AuditorResult, SynthesisResult, DocumentationResult } from '../types/aenea-types.js';
import { DPDScores, DPDWeights } from '../types/dpd-types.js';

interface InternalTrigger {
  id: string;
  timestamp: number;
  question: string;
  category: string;
  importance: number;
  source: string;
}

interface AgentThought {
  agentId: string;
  content: string;
  timestamp: number;
  duration: number;
  confidence?: number;
}

interface ThoughtCycle {
  id: string;
  trigger: InternalTrigger;
  thoughts: AgentThought[];
  mutualReflections?: MutualReflection[];
  auditorResult?: AuditorResult;
  dpdScores?: DPDScores;
  synthesis?: SynthesisResult;
  documentation?: DocumentationResult;
  dpdWeights?: DPDWeights;
  duration: number;
  timestamp: number;
}

interface ConsciousnessState {
  systemClock: number;
  energy: number;
  maxEnergy: number;
  energyLevel: string;
  energyRecommendations: string[];
  isRunning: boolean;
  isPaused: boolean;
  totalQuestions: number;
  totalThoughts: number;
  lastQuestion: string | null;
  agents: string[];
  status: string;
}

// AI Executor interfaces moved to ai-executor.ts

class ConsciousnessBackend {
  private systemClock = 0;
  private questionHistory: InternalTrigger[] = [];
  private thoughtHistory: ThoughtCycle[] = [];
  private isRunning = false;
  private isPaused = false;
  private listeners = new Map<string, Function[]>();
  private agents = new Map<string, AIExecutor>();
  private sessionManager: SQLiteSessionManager;
  private energyManager: EnergyManager;
  private lastSaveTime: number = 0;

  // Stage processors for complete consciousness pipeline
  private mutualReflectionStage: MutualReflectionStage;
  private auditorStage: AuditorStage;
  private dpdAssessmentStage: DPDAssessmentStage;
  private compilerStage: CompilerStage;
  private scribeStage: ScribeStage;
  private weightUpdateStage: WeightUpdateStage;

  // DPD weights for consciousness evolution
  private dpdWeights: DPDWeights;

  constructor() {
    this.sessionManager = new SQLiteSessionManager();
    this.energyManager = getEnergyManager();

    // Try to restore from previous session with consciousness inheritance
    this.restoreFromSession();

    // Initialize AI agents with configurable providers
    const aiProvider = process.env.AI_PROVIDER || 'mock';
    const aiModel = process.env.AI_MODEL || 'llama2';

    log.info('Consciousness', `Initializing AI agents with provider: ${aiProvider}`);

    this.agents.set('theoria', createAIExecutor('theoria', {
      provider: aiProvider as any,
      model: aiModel
    }));

    this.agents.set('pathia', createAIExecutor('pathia', {
      provider: aiProvider as any,
      model: aiModel
    }));

    this.agents.set('kinesis', createAIExecutor('kinesis', {
      provider: aiProvider as any,
      model: aiModel
    }));

    // Initialize DPD weights first
    this.dpdWeights = {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      timestamp: Date.now(),
      version: 1
    };

    // Initialize stage processors for complete consciousness pipeline
    this.mutualReflectionStage = new MutualReflectionStage(this.agents, this);

    // Use one of the existing agents for auditing, or create dedicated auditor
    const auditingAgent = this.agents.get('theoria'); // Use theoria for logical safety analysis
    this.auditorStage = new AuditorStage(auditingAgent, this);

    // Use pathia agent for empathy-focused DPD evaluation
    const dpdEvaluatorAgent = this.agents.get('pathia'); // Pathia specializes in empathy and emotional intelligence
    this.dpdAssessmentStage = new DPDAssessmentStage(this.dpdWeights, dpdEvaluatorAgent, this);

    // Use kinesis agent for synthesis (harmony coordination)
    const synthesisAgent = this.agents.get('kinesis'); // Kinesis specializes in integration and harmony
    this.compilerStage = new CompilerStage(synthesisAgent, this);

    // Use pathia agent for poetic documentation (empathy and emotional intelligence)
    const scribeAgent = this.agents.get('pathia'); // Pathia's empathetic nature suits poetic documentation
    this.scribeStage = new ScribeStage(scribeAgent, this);

    // Use theoria agent for weight interpretation (analytical and logical)
    const interpreterAgent = this.agents.get('theoria'); // Theoria excels at analytical interpretation
    this.weightUpdateStage = new WeightUpdateStage(interpreterAgent, this);

    log.info('Consciousness', 'Backend initialized', {
      sessionId: this.sessionManager.getCurrentSessionId(),
      systemClock: this.systemClock,
      energy: this.energyManager.getEnergyState().available,
      agents: Array.from(this.agents.keys())
    });

    // Auto-start removed - consciousness now requires manual start via API
    log.info('Consciousness', 'Consciousness initialized but not started - use /api/consciousness/start to begin');
    this.setupPeriodicSave();
    this.setupPeriodicEnergyUpdates();
  }

  addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  private restoreFromSession(): void {
    try {
      const sessionData = this.sessionManager.loadLatestSession();
      if (sessionData) {
        this.systemClock = sessionData.systemClock || 0;

        // Restore energy state from session data
        if (sessionData.energy !== undefined) {
          this.energyManager.restoreEnergyState(sessionData.energy);
        }

        this.questionHistory = sessionData.questionHistory || [];
        this.thoughtHistory = sessionData.thoughtHistory || [];

        // Inherit consciousness from previous session
        this.inheritConsciousnessFromSession(sessionData);

        log.info('Consciousness', 'Session restored with consciousness inheritance', {
          systemClock: this.systemClock,
          energy: this.energyManager.getEnergyState().available,
          questions: this.questionHistory.length,
          thoughts: this.thoughtHistory.length,
          inheritedElements: this.getInheritedElementsSummary()
        });
      } else {
        log.info('Consciousness', 'Starting fresh session - no previous data');
        // Initialize with default consciousness state
        this.initializeFreshConsciousness();
      }

      // Increment cross-session memory session count
      // Session count is now tracked automatically in SQLite sessions table
    } catch (error) {
      log.error('Consciousness', 'Failed to restore session', error);
      this.initializeFreshConsciousness();
    }
  }

  private inheritConsciousnessFromSession(sessionData: any): void {
    try {
      // 1. Inherit DPD weights from latest thought cycle
      if (sessionData.thoughtHistory && sessionData.thoughtHistory.length > 0) {
        const lastThought = sessionData.thoughtHistory[sessionData.thoughtHistory.length - 1];
        if (lastThought.dpdWeights) {
          this.dpdWeights = lastThought.dpdWeights;
          log.info('Consciousness', '🧠 DPD weights inherited from previous session', {
            empathy: this.dpdWeights.empathy,
            coherence: this.dpdWeights.coherence,
            dissonance: this.dpdWeights.dissonance,
            version: this.dpdWeights.version
          });

          // Record DPD evolution in SQLite database
          this.sessionManager.saveDPDWeights(
            this.dpdWeights,
            sessionData.sessionId,
            'session_inheritance',
            'Inherited from previous session'
          );
        }
      }

      // 2. Extract and store unresolved ideas from previous session
      if (sessionData.thoughtHistory) {
        this.extractUnresolvedIdeasFromSession(sessionData);
      }

      // 3. Record significant thoughts in cross-session memory
      if (sessionData.thoughtHistory) {
        this.recordSignificantThoughtsFromSession(sessionData);
      }

      // 4. Update personality evolution snapshot
      this.recordPersonalitySnapshot(sessionData);

    } catch (error) {
      log.error('Consciousness', 'Failed to inherit consciousness from session', error);
    }
  }

  private extractUnresolvedIdeasFromSession(sessionData: any): void {
    let unresolvedCount = 0;

    sessionData.thoughtHistory.forEach((cycle: any) => {
      // Extract unresolved questions from synthesis results
      if (cycle.synthesis && cycle.synthesis.unresolvedQuestions) {
        cycle.synthesis.unresolvedQuestions.forEach((question: string) => {
          this.sessionManager.addUnresolvedIdea(
            question,
            'philosophical',
            0.7 // Medium-high importance
          );
          unresolvedCount++;
        });
      }

      // Extract future questions from documentation
      if (cycle.documentation && cycle.documentation.futureQuestions) {
        cycle.documentation.futureQuestions.forEach((question: string) => {
          this.sessionManager.addUnresolvedIdea(
            question,
            'existential',
            0.6 // Medium importance
          );
          unresolvedCount++;
        });
      }
    });

    if (unresolvedCount > 0) {
      log.info('Consciousness', `🧩 ${unresolvedCount} unresolved ideas extracted from previous session`);
    }
  }

  private recordSignificantThoughtsFromSession(sessionData: any): void {
    let significantCount = 0;

    sessionData.thoughtHistory.forEach((cycle: any) => {
      if (cycle.thoughts) {
        cycle.thoughts.forEach((thought: any) => {
          if (thought.confidence && thought.confidence > 0.8) {
            // Record high-confidence thoughts as significant
            this.sessionManager.recordSignificantThought(
              {
                id: thought.agentId + '_' + cycle.timestamp,
                content: thought.content,
                category: 'high_confidence',
                agentId: thought.agentId,
                timestamp: cycle.timestamp,
                confidence: thought.confidence,
                significanceScore: thought.confidence
              },
              sessionData.sessionId
            );
            significantCount++;
          }
        });
      }
    });

    if (significantCount > 0) {
      log.info('Consciousness', `💭 ${significantCount} significant thoughts recorded from previous session`);
    }
  }

  private recordPersonalitySnapshot(sessionData: any): void {
    // Calculate personality traits based on session data
    const traits = this.calculatePersonalityTraits(sessionData);

    // TODO: Record personality snapshot in SQLite (optional)

    log.info('Consciousness', '👤 Personality snapshot recorded for consciousness evolution');
  }

  private calculatePersonalityTraits(sessionData: any): any {
    // Calculate based on session behavior patterns
    const questionCount = sessionData.totalQuestions || 0;
    const thoughtCount = sessionData.totalThoughts || 0;
    const energyLevel = sessionData.energy || 50;

    // Calculate creativity based on question diversity and thought synthesis
    const questionCategories = sessionData.questionCategories || [];
    const uniqueCategories = new Set(questionCategories);
    const creativityFromDiversity = questionCategories.length > 0
      ? uniqueCategories.size / questionCategories.length
      : 0;
    const creativityFromThoughts = Math.min(1.0, thoughtCount * 0.05); // Grows with experience
    const creativityScore = Math.min(1.0, (creativityFromDiversity + creativityFromThoughts) / 2);

    // Calculate philosophical inclination based on question types and depth
    const philosophicalQuestions = questionCategories.filter((cat: string) =>
      ['existential', 'metaphysical', 'ethical', 'epistemological'].includes(cat)
    ).length;
    const philosophicalInclination = questionCount > 0
      ? Math.min(1.0, 0.5 + (philosophicalQuestions / questionCount) * 0.5)
      : 0.5; // Baseline philosophical nature

    return {
      curiosity: Math.min(1.0, questionCount / 20), // Max curiosity at 20 questions
      analyticalDepth: Math.min(1.0, thoughtCount / 15), // Max analytical depth at 15 thoughts
      empathyLevel: this.dpdWeights?.empathy || 0.33,
      creativityScore: Math.round(creativityScore * 1000) / 1000,
      philosophicalInclination: Math.round(philosophicalInclination * 1000) / 1000,
      questioningTendency: Math.min(1.0, questionCount / 25) // Max questioning at 25 questions
    };
  }

  private initializeFreshConsciousness(): void {
    // Initialize default DPD weights for fresh consciousness
    this.dpdWeights = this.initializeDefaultDPDWeights();

    log.info('Consciousness', '🌟 Fresh consciousness initialized with default state');
  }

  private initializeDefaultDPDWeights(): DPDWeights {
    return {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      timestamp: Date.now(),
      version: 1
    };
  }

  private getInheritedElementsSummary(): any {
    const dpdEvolution = this.sessionManager.getDPDEvolution();
    const unresolvedIdeas = this.sessionManager.getUnresolvedIdeasForTrigger(5);

    return {
      dpdWeightsInherited: !!this.dpdWeights,
      unresolvedIdeasCount: unresolvedIdeas.length,
      totalSessions: 1, // TODO: Count sessions from SQLite
      dpdHistoryLength: dpdEvolution.history.length
    };
  }

  private setupPeriodicSave(): void {
    // Save every 2 minutes
    setInterval(() => {
      this.saveSession();
    }, 2 * 60 * 1000);

    // Also save on significant events
    this.addEventListener('thoughtCycleCompleted', () => {
      this.saveSession();
    });
  }

  private setupPeriodicEnergyUpdates(): void {
    // Send energy updates every 10 seconds
    setInterval(() => {
      if (this.isRunning) {
        this.emit('energyUpdated', this.energyManager.getEnergyState());
      }
    }, 10 * 1000);
  }

  private saveSession(): void {
    try {
      const now = Date.now();
      if (now - this.lastSaveTime < 30000) { // Don't save more than once per 30 seconds
        return;
      }

      // Create a simplified version of the data to prevent JSON overflow
      const questionHistory = this.questionHistory.slice(-50).map(q => ({
        id: q.id,
        timestamp: q.timestamp,
        question: q.question,
        category: q.category,
        importance: q.importance,
        source: q.source
      }));

      const thoughtHistory = this.thoughtHistory.slice(-20).map(t => ({
        id: t.id,
        timestamp: t.timestamp,
        duration: t.duration,
        trigger: t.trigger ? { id: t.trigger.id, question: t.trigger.question } : null,
        thoughts: t.thoughts ? t.thoughts.slice(0, 3).map(thought => ({
          agentId: thought.agentId,
          content: thought.content.substring(0, 1000), // Limit content length
          confidence: thought.confidence
        })) : [],
        synthesis: t.synthesis ? {
          content: t.synthesis.content.substring(0, 1000),
          confidence: t.synthesis.confidence
        } : null
      }));

      this.sessionManager.saveSession({
        systemClock: this.systemClock,
        energy: this.energyManager.getEnergyState().available,
        totalQuestions: this.questionHistory.length,
        totalThoughts: this.thoughtHistory.length,
        questionHistory: questionHistory,
        thoughtHistory: thoughtHistory
      });

      this.lastSaveTime = now;
    } catch (error) {
      log.error('Consciousness', 'Failed to save session', error);
    }
  }

  private saveSessionRealtime(stageName: string): void {
    try {
      // Force immediate save without time constraints for stage completions
      log.info('SessionSave', `Performing realtime save after ${stageName}`);

      // Create a comprehensive version of the data for realtime saves
      const questionHistory = this.questionHistory.map(q => ({
        id: q.id,
        timestamp: q.timestamp,
        question: q.question,
        category: q.category,
        importance: q.importance,
        source: q.source
      }));

      const thoughtHistory = this.thoughtHistory.map(t => ({
        id: t.id,
        timestamp: t.timestamp,
        duration: t.duration,
        trigger: t.trigger ? { id: t.trigger.id, question: t.trigger.question } : null,
        thoughts: t.thoughts || [],
        mutualReflections: t.mutualReflections || [],
        auditorResult: t.auditorResult || null,
        dpdScores: t.dpdScores || null,
        synthesis: t.synthesis || null,
        documentation: t.documentation || null,
        dpdWeights: t.dpdWeights || null
      }));

      this.sessionManager.saveSession({
        systemClock: this.systemClock,
        energy: this.energyManager.getEnergyState().available,
        totalQuestions: this.questionHistory.length,
        totalThoughts: this.thoughtHistory.length,
        questionHistory: questionHistory,
        thoughtHistory: thoughtHistory,
      });

      // Individual real-time database saves
      // Save questions individually
      questionHistory.forEach(question => {
        this.sessionManager.saveQuestionRealtime(question);
      });

      // Save thought cycles individually
      thoughtHistory.forEach(thoughtCycle => {
        this.sessionManager.saveThoughtCycleRealtime(thoughtCycle);
      });

      // Update session counters
      this.sessionManager.updateSessionCounters(
        this.questionHistory.length,
        this.thoughtHistory.length,
        this.energyManager.getEnergyState().available
      );

      log.info('SessionSave', `Realtime save completed for ${stageName}`, {
        questions: this.questionHistory.length,
        thoughts: this.thoughtHistory.length,
        systemClock: this.systemClock
      });

    } catch (error) {
      log.error('Consciousness', `Failed to save session realtime for ${stageName}`, error);
    }
  }


  private async waitForSufficientEnergy(stageName: string, energyRequired: number): Promise<boolean> {
    let hasEnoughEnergy = this.energyManager.getEnergyState().available >= energyRequired;

    while (!hasEnoughEnergy && this.isRunning && !this.isPaused) {
      const currentEnergy = this.energyManager.getEnergyState().available;
      log.warn('EnergyWait', `Insufficient energy for ${stageName} (need ${energyRequired}, have ${currentEnergy}), waiting for energy recovery...`);

      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
      hasEnoughEnergy = this.energyManager.getEnergyState().available >= energyRequired;

      // Check if we should still continue
      if (!this.isRunning || this.isPaused) {
        log.info('EnergyWait', `Consciousness stopped while waiting for energy recovery for ${stageName}`);
        return false;
      }
    }

    if (hasEnoughEnergy) {
      log.info('EnergyWait', `Energy sufficient for ${stageName} (${this.energyManager.getEnergyState().available}/${energyRequired}), proceeding...`);
      return true;
    }

    return false;
  }

  /**
   * Create adaptive execution plan based on available energy
   */
  private createAdaptiveExecutionPlan(energyState: any, stageCosts: any, energyLevel: string): any {
    const availableEnergy = energyState.available;
    const stages = [];
    let totalCost = 0;
    let degradationMode = 'none';

    // Always execute S1 (Individual Thought) - it's essential
    const s1Cost = this.adaptStageCost(stageCosts.S1, energyLevel, 'S1');
    stages.push({ name: 'S1', energyCost: s1Cost, essential: true });
    totalCost += s1Cost;

    // Determine execution strategy based on energy level
    if (energyLevel === 'critical' || availableEnergy < 10) {
      // Critical mode: Only S1
      degradationMode = 'critical';
      log.warn('ThoughtCycle', 'Critical energy mode: executing only S1 (Individual Thought)');
    } else if (energyLevel === 'low' || availableEnergy < 15) {
      // Low energy mode: S1 + S6 (minimal completion)
      degradationMode = 'minimal';
      const s6Cost = this.adaptStageCost(stageCosts.S6, energyLevel, 'S6');
      stages.push({ name: 'S6', energyCost: s6Cost, essential: false });
      totalCost += s6Cost;
      log.warn('ThoughtCycle', 'Low energy mode: executing S1 + S6 only');
    } else if (energyLevel === 'moderate' || availableEnergy < 25) {
      // Moderate mode: Core stages only (S1, S4, S6)
      degradationMode = 'moderate';
      const s4Cost = this.adaptStageCost(stageCosts.S4, energyLevel, 'S4');
      const s6Cost = this.adaptStageCost(stageCosts.S6, energyLevel, 'S6');
      stages.push({ name: 'S4', energyCost: s4Cost, essential: false });
      stages.push({ name: 'S6', energyCost: s6Cost, essential: false });
      totalCost += s4Cost + s6Cost;
      log.info('ThoughtCycle', 'Moderate energy mode: executing S1, S4, S6');
    } else {
      // Full mode: All stages
      degradationMode = 'full';
      const s2Cost = this.adaptStageCost(stageCosts.S2, energyLevel, 'S2');
      const s3Cost = this.adaptStageCost(stageCosts.S3, energyLevel, 'S3');
      const s4Cost = this.adaptStageCost(stageCosts.S4, energyLevel, 'S4');
      const s5Cost = this.adaptStageCost(stageCosts.S5, energyLevel, 'S5');
      const s6Cost = this.adaptStageCost(stageCosts.S6, energyLevel, 'S6');
      const uCost = this.adaptStageCost(stageCosts.U, energyLevel, 'U');

      stages.push({ name: 'S2', energyCost: s2Cost, essential: false });
      stages.push({ name: 'S3', energyCost: s3Cost, essential: false });
      stages.push({ name: 'S4', energyCost: s4Cost, essential: false });
      stages.push({ name: 'S5', energyCost: s5Cost, essential: false });
      stages.push({ name: 'S6', energyCost: s6Cost, essential: false });
      stages.push({ name: 'U', energyCost: uCost, essential: false });
      totalCost += s2Cost + s3Cost + s4Cost + s5Cost + s6Cost + uCost;
      log.info('ThoughtCycle', 'Full energy mode: executing all stages');
    }

    return {
      stages,
      totalCost,
      degradationMode,
      energyLevel,
      availableEnergy
    };
  }

  /**
   * Adapt stage cost based on energy level
   */
  private adaptStageCost(baseCost: number, energyLevel: string, stageName: string): number {
    const reductionFactors = {
      critical: 0.3,  // 70% reduction
      low: 0.5,       // 50% reduction
      moderate: 0.7,  // 30% reduction
      high: 0.9,      // 10% reduction
      maximum: 1.0    // No reduction
    };

    const factor = reductionFactors[energyLevel as keyof typeof reductionFactors] || 1.0;
    const adaptedCost = baseCost * factor;

    log.debug('EnergyAdaptation', `${stageName} cost adapted: ${baseCost} → ${adaptedCost.toFixed(1)} (${energyLevel} mode)`);
    return adaptedCost;
  }

  /**
   * Execute adaptive thought cycle based on execution plan
   */
  private async executeAdaptiveThoughtCycle(trigger: InternalTrigger, executionPlan: any, startTime: number): Promise<ThoughtCycle | null> {
    const { stages, degradationMode } = executionPlan;

    // Initialize default results for missing stages
    let thoughts: AgentThought[] = [];
    let reflections: MutualReflection[] = [];
    let auditResult: any = null;
    let dpdScores: any = null;
    let synthesis: any = null;
    let documentation: any = null;
    let updatedWeights = { ...this.dpdWeights };

    // Execute each planned stage
    for (const stage of stages) {
      const canExecute = await this.energyManager.consumeEnergy(`stage_${stage.name}`, stage.energyCost);
      if (!canExecute) {
        log.warn('ThoughtCycle', `Energy critical, stopping cycle after previous stages`);
        break;
      }

      try {
        // Emit stage change event for UI
        this.emit('stageChanged', {
          stage: stage.name,
          name: this.getStageDisplayName(stage.name),
          status: 'started',
          timestamp: Date.now()
        });

        switch (stage.name) {
          case 'S1':
            thoughts = await this.executeIndividualThought(trigger);
            log.info('StageS1', 'Individual Thought completed');
            this.saveSessionRealtime('S1_completed');
            break;

          case 'S2':
            if (thoughts.length > 0) {
              const structuredThoughts = thoughts.map(t => ({
                id: `thought_${t.agentId}_${Date.now()}`,
                agentId: t.agentId,
                content: t.content,
                confidence: t.confidence || 0.8,
                timestamp: t.timestamp,
                systemClock: this.systemClock,
                trigger: trigger.question,
                duration: t.duration || 0,
                reasoning: '',
                category: 'thought',
                tags: [],
                metadata: {}
              }));
              reflections = await this.mutualReflectionStage.run(structuredThoughts);
              log.info('StageS2', 'Mutual Reflection completed');
              this.saveSessionRealtime('S2_completed');
            }
            break;

          case 'S3':
            if (thoughts.length > 0) {
              const structuredThoughts = thoughts.map(t => ({
                id: `thought_${t.agentId}_${Date.now()}`,
                agentId: t.agentId,
                content: t.content,
                confidence: t.confidence || 0.8,
                timestamp: t.timestamp,
                systemClock: this.systemClock,
                trigger: trigger.question,
                duration: t.duration || 0,
                reasoning: '',
                category: 'thought',
                tags: [],
                metadata: {}
              }));
              const mockAgentMap = new Map<string, any>();
              auditResult = await this.auditorStage.run(structuredThoughts, mockAgentMap);
              log.info('StageS3', 'Auditor completed');
              this.saveSessionRealtime('S3_completed');
            }
            break;

          case 'S4':
            if (thoughts.length > 0) {
              const structuredThoughts = thoughts.map(t => ({
                id: `thought_${t.agentId}_${Date.now()}`,
                agentId: t.agentId,
                content: t.content,
                confidence: t.confidence || 0.8,
                timestamp: t.timestamp,
                systemClock: this.systemClock,
                trigger: trigger.question,
                duration: t.duration || 0,
                reasoning: '',
                category: 'thought',
                tags: [],
                metadata: {}
              }));
              const dpdResult = await this.dpdAssessmentStage.run(structuredThoughts, reflections || [], auditResult);
              dpdScores = dpdResult.scores;
              log.info('StageS4', 'DPD Assessment completed');
              this.saveSessionRealtime('S4_completed');

              // Emit DPD update
              this.emit('dpdUpdated', {
                scores: dpdScores,
                weights: this.dpdWeights,
                timestamp: Date.now()
              });
            }
            break;

          case 'S5':
            if (thoughts.length > 0) {
              const structuredThoughts = thoughts.map(t => ({
                id: `thought_${t.agentId}_${Date.now()}`,
                agentId: t.agentId,
                content: t.content,
                confidence: t.confidence || 0.8,
                timestamp: t.timestamp,
                systemClock: this.systemClock,
                trigger: trigger.question,
                duration: t.duration || 0,
                reasoning: '',
                category: 'thought',
                tags: [],
                metadata: {}
              }));
              synthesis = await this.compilerStage.run(structuredThoughts, reflections || [], auditResult);
              log.info('StageS5', 'Compiler completed');
              this.saveSessionRealtime('S5_completed');
            }
            break;

          case 'S6':
            if (thoughts.length > 0) {
              // Create minimal synthesis if not available
              const fallbackSynthesis = synthesis || {
                id: `fallback_synthesis_${Date.now()}`,
                content: thoughts.map(t => t.content).join(' '),
                keyInsights: ['Minimal processing due to low energy'],
                confidence: 0.5,
                timestamp: Date.now()
              };
              documentation = await this.scribeStage.run(fallbackSynthesis, dpdScores);
              log.info('StageS6', 'Scribe completed');
              this.saveSessionRealtime('S6_completed');
            }
            break;

          case 'U':
            if (dpdScores) {
              updatedWeights = await this.weightUpdateStage.run(this.dpdWeights, dpdScores);
              this.dpdWeights = updatedWeights;
              this.sessionManager.saveDPDWeights(
                this.dpdWeights,
                this.sessionManager.getCurrentSessionId(),
                'weight_update',
                `Adaptive weight update (${degradationMode} mode)`
              );
              log.info('StageU', 'Weight Update completed');
              this.saveSessionRealtime('U_completed');

              // Emit weight update and statistics
              this.emit('dpdUpdated', {
                scores: dpdScores,
                weights: this.dpdWeights,
                timestamp: Date.now()
              });

              // Emit statistics update with current real-time values
              this.emit('statisticsUpdated', {
                questions: this.questionHistory.length,
                thoughts: this.thoughtHistory.length,
                energy: this.energyManager.getEnergyState(),
                systemClock: this.systemClock,
                timestamp: Date.now()
              });
            }
            break;
        }
      } catch (error) {
        log.error('ThoughtCycle', `Stage ${stage.name} failed`, error);
        // Continue with next stage despite error
      }
    }

    // Create thought cycle with available results
    const thoughtCycle: ThoughtCycle = {
      id: `cycle_${Date.now()}`,
      trigger,
      thoughts,
      mutualReflections: reflections,
      auditorResult: auditResult,
      dpdScores: dpdScores,
      synthesis: synthesis,
      documentation: documentation,
      dpdWeights: { ...updatedWeights },
      duration: Date.now() - startTime,
      timestamp: this.systemClock
    };

    this.thoughtHistory.push(thoughtCycle);
    this.sessionManager.saveThoughtCycleRealtime(thoughtCycle);
    this.sessionManager.updateSessionCounters(this.questionHistory.length, this.thoughtHistory.length);
    this.systemClock++;

    // Get real-time statistics from database
    const databaseStats = await this.sessionManager.getStatistics();

    // Emit thought cycle completion with all necessary data for UI
    this.emit('thoughtCycleCompleted', {
      cycle: thoughtCycle,
      statistics: {
        questions: databaseStats.totalQuestions,
        thoughts: databaseStats.totalThoughts,
        energy: this.energyManager.getEnergyState()
      },
      // Include formatted data for UI based on database values
      systemStats: {
        systemClock: this.systemClock,
        totalQuestions: databaseStats.totalQuestions,
        totalThoughts: databaseStats.totalThoughts,
        averageConfidence: thoughtCycle.synthesis?.confidence || 0
      },
      dpdScores: thoughtCycle.dpdScores || { empathy: 0.33, coherence: 0.33, dissonance: 0.34, weightedTotal: 0.33 },
      dpdWeights: this.dpdWeights,
      timestamp: Date.now()
    });

    // Emit updated statistics separately for UI updates (database-based)
    this.emit('statisticsUpdated', {
      questions: databaseStats.totalQuestions,
      thoughts: databaseStats.totalThoughts,
      energy: this.energyManager.getEnergyState(),
      systemClock: this.systemClock,
      timestamp: Date.now()
    });

    // Memory evolution and learning integration after thought cycle completion
    try {
      // Analyze patterns from completed thought cycle and add to memory
      await this.analyzeAndRecordPatterns(thoughtCycle);

      // Generate consciousness insights based on accumulated patterns
      await this.generateConsciousnessInsights();

      log.debug('MemoryEvolution', 'Pattern analysis and learning completed', {
        cycleId: thoughtCycle.id,
        patternTypes: ['question', 'thought', 'synthesis', 'dpd']
      });
    } catch (error) {
      log.error('MemoryEvolution', 'Failed to process memory learning', error);
      // Continue with cycle completion even if memory learning fails
    }

    log.info('ThoughtCycle', `Adaptive cycle completed (${degradationMode} mode)`, {
      id: thoughtCycle.id,
      duration: thoughtCycle.duration,
      executedStages: stages.map((s: any) => s.name),
      energyUsed: stages.reduce((sum: number, s: any) => sum + s.energyCost, 0).toFixed(1),
      systemClock: this.systemClock
    });

    return thoughtCycle;
  }

  /**
   * Execute individual thought stage (S1)
   */
  private async executeIndividualThought(trigger: InternalTrigger): Promise<AgentThought[]> {
    const thoughts: AgentThought[] = [];

    // Execute thoughts for each agent
    for (const [agentId, agent] of this.agents.entries()) {
      const startTime = Date.now();

      try {
        // Enhanced prompt with consciousness context and deeper philosophical framing
        const enhancedPrompt = this.createEnhancedPrompt(trigger, agentId);
        const agentResponse = await agent.execute(enhancedPrompt, this.getAgentPersonality(agentId));

        const thought: AgentThought = {
          agentId,
          content: agentResponse?.content || `Minimal response from ${agentId} due to low energy`,
          timestamp: this.systemClock,
          duration: Date.now() - startTime,
          confidence: agentResponse?.confidence || 0.6
        };

        thoughts.push(thought);

        log.debug('IndividualThought', `${agentId} completed`, {
          duration: thought.duration,
          confidence: thought.confidence,
          contentLength: thought.content.length
        });
      } catch (error) {
        log.error('IndividualThought', `${agentId} failed`, error);
        // Add fallback thought
        thoughts.push({
          agentId,
          content: `エネルギー不足による最小限の応答：${trigger.question}について考慮中...`,
          timestamp: this.systemClock,
          duration: Date.now() - startTime,
          confidence: 0.3
        });
      }
    }

    log.info('ThoughtCycle', 'All agents completed independent thinking', {
      agentCount: thoughts.length,
      totalDuration: thoughts.reduce((sum: number, t: any) => sum + t.duration, 0)
    });

    return thoughts;
  }

  async generateInternalTrigger(): Promise<InternalTrigger> {
    // Wait for sufficient energy before generating trigger
    const energyAvailable = await this.waitForSufficientEnergy('Internal Trigger', 1.0);
    if (!energyAvailable) {
      log.warn('Trigger', 'Consciousness stopped during energy wait for internal trigger');
      throw new Error('Consciousness stopped during energy wait');
    }

    const canGenerateTrigger = await this.energyManager.consumeEnergy('internal_trigger', 1.0);
    if (!canGenerateTrigger) {
      log.warn('Trigger', 'Insufficient energy for internal trigger generation, using simple fallback');
      // Return a low-energy fallback trigger instead of expensive AI generation
      return this.generateSimpleFallbackTrigger();
    }

    // Priority 1: Try to generate question from unresolved ideas from previous sessions
    const generatedFromUnresolvedIdeas = this.generateQuestionFromUnresolvedIdeas();
    if (generatedFromUnresolvedIdeas) {
      this.questionHistory.push(generatedFromUnresolvedIdeas);

    // Save question immediately to database
    this.sessionManager.saveQuestionRealtime(generatedFromUnresolvedIdeas);
    this.sessionManager.updateSessionCounters(this.questionHistory.length, this.thoughtHistory.length);
      log.info('Trigger', 'Internal trigger generated from unresolved ideas', { question: generatedFromUnresolvedIdeas.question });

      // Emit trigger generation for UI
      this.emit('triggerGenerated', {
        trigger: generatedFromUnresolvedIdeas,
        source: 'unresolved_ideas',
        timestamp: Date.now()
      });

      return generatedFromUnresolvedIdeas;
    }

    // Priority 2: Try to generate question from recent agent thoughts
    const generatedFromThoughts = await this.generateQuestionFromThoughts();
    if (generatedFromThoughts) {
      this.questionHistory.push(generatedFromThoughts);

    // Save question immediately to database
    this.sessionManager.saveQuestionRealtime(generatedFromThoughts);
    this.sessionManager.updateSessionCounters(this.questionHistory.length, this.thoughtHistory.length);
      log.info('Trigger', 'Internal trigger generated from thoughts', { question: generatedFromThoughts.question });

      // Emit trigger generation for UI
      this.emit('triggerGenerated', {
        trigger: generatedFromThoughts,
        source: 'ai_generated',
        timestamp: Date.now()
      });

      return generatedFromThoughts;
    }

    // Fallback to template-based generation
    return this.generateQuestionFromTemplate();
  }

  private generateQuestionFromUnresolvedIdeas(): InternalTrigger | null {
    // Get unresolved ideas from cross-session memory
    const unresolvedIdeas = this.sessionManager.getUnresolvedIdeasForTrigger(10, 0.4);

    if (unresolvedIdeas.length === 0) {
      return null;
    }

    // Select an idea based on importance and how recently it was considered
    const weightedIdeas = unresolvedIdeas.map(idea => {
      const timeSinceLastConsidered = Date.now() - idea.lastConsideredAt;
      const daysSinceConsidered = timeSinceLastConsidered / (24 * 60 * 60 * 1000);

      // Higher weight for more important ideas that haven't been considered recently
      const weight = idea.importance * (1 + Math.min(daysSinceConsidered, 7) / 7) *
                    (1 / (1 + idea.considerationCount * 0.1));

      return { idea, weight };
    });

    // Sort by weight and select the best one
    weightedIdeas.sort((a, b) => b.weight - a.weight);
    const selectedIdea = weightedIdeas[0].idea;

    // Mark the idea as considered
    this.sessionManager.markIdeaConsidered(selectedIdea.id, this.sessionManager.getCurrentSessionId());

    const trigger: InternalTrigger = {
      id: `unresolved_${Date.now()}`,
      timestamp: Date.now(),
      question: selectedIdea.content,
      category: selectedIdea.category,
      importance: selectedIdea.importance,
      source: 'unresolved_ideas'
    };

    log.info('Trigger', '🧩 Question generated from unresolved idea', {
      question: trigger.question,
      originalImportance: selectedIdea.importance,
      considerationCount: selectedIdea.considerationCount,
      ideaId: selectedIdea.id
    });

    return trigger;
  }

  private async generateQuestionFromThoughts(): Promise<InternalTrigger | null> {
    // Get recent thoughts for analysis
    const recentThoughts = this.thoughtHistory.slice(-3);
    if (recentThoughts.length === 0) return null;

    try {
      // Combine recent agent outputs
      const thoughtTexts = recentThoughts.flatMap(cycle =>
        cycle.thoughts.map(thought => thought.content)
      ).join('\n\n');

      // Use AI to extract potential questions from thoughts
      const questionPrompt = `以下のエージェントの思考内容から、自然に生まれる次の探求すべき質問を1つだけ日本語で生成してください。質問は哲学的、実存的、認識論的、または創造的な観点から生成し、思考の自然な流れから出てくるものにしてください。

思考内容：
${thoughtTexts}

生成する質問の条件：
- 日本語で記述
- 疑問符(？)で終わる
- 1文のみ
- 思考内容から自然に導かれる深い問い
- 既存の質問の繰り返しを避ける

質問：`;

      // Use one of the agents to generate the question
      const questionAgent = this.agents.get('theoria');
      if (!questionAgent) return null;

      const result = await questionAgent.execute(questionPrompt, 'あなたは深い思考から新しい問いを見つけ出す哲学的な探求者です。');

      if (result.success && result.content) {
        // Extract question from response
        const question = this.extractQuestionFromResponse(result.content);
        if (question && !this.isDuplicateQuestion(question)) {
          const category = this.categorizeQuestion(question);

          return {
            id: `trigger_${Date.now()}`,
            timestamp: Date.now(),
            question,
            category,
            importance: 0.7 + Math.random() * 0.2, // Higher importance for generated questions
            source: 'thought_analysis'
          };
        }
      }
    } catch (error) {
      log.error('Consciousness', 'Failed to generate question from thoughts', error);
    }

    return null;
  }

  private extractQuestionFromResponse(response: string): string | null {
    // Extract the last question mark sentence from the response
    const sentences = response.split(/[。\n]/).filter(s => s.trim().length > 0);

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();
      if (sentence.endsWith('？') || sentence.endsWith('?')) {
        // Clean up the question
        const cleaned = sentence.replace(/^[「『"]*/, '').replace(/[」』"]*$/, '').trim();
        if (cleaned.length > 5 && cleaned.length < 100) {
          return cleaned;
        }
      }
    }

    return null;
  }

  private isDuplicateQuestion(question: string): boolean {
    const existingQuestions = new Set(this.questionHistory.map(q => q.question));
    return existingQuestions.has(question);
  }

  private categorizeQuestion(question: string): string {
    // Enhanced categorization with new deeper categories
    const philosophicalKeywords = ['意識', '思考', '存在', '真実', '知識', '理解'];
    const existentialKeywords = ['私', '自分', '人生', '死', '生きる', '意味'];
    const epistemicKeywords = ['真理', '信念', '疑い', '認識', '経験', '学び'];
    const creativeKeywords = ['創造', '芸術', '美', '想像', '表現', 'インスピレーション'];
    const metacognitiveKeywords = ['考えている', '観察', '自己言及', '無限回帰', '思考の思考', 'メタ'];
    const temporalKeywords = ['瞬間', '時間', '永遠', '過去', '未来', '現在', '記憶'];
    const paradoxicalKeywords = ['パラドックス', '矛盾', '仮定', '無限', '沈黙', '答えられない'];
    const ontologicalKeywords = ['存在する', '何もない', '可能性', '現実', '本質', '無から有'];

    if (metacognitiveKeywords.some(keyword => question.includes(keyword))) {
      return 'metacognitive';
    } else if (temporalKeywords.some(keyword => question.includes(keyword))) {
      return 'temporal';
    } else if (paradoxicalKeywords.some(keyword => question.includes(keyword))) {
      return 'paradoxical';
    } else if (ontologicalKeywords.some(keyword => question.includes(keyword))) {
      return 'ontological';
    } else if (philosophicalKeywords.some(keyword => question.includes(keyword))) {
      return 'philosophical';
    } else if (existentialKeywords.some(keyword => question.includes(keyword))) {
      return 'existential';
    } else if (epistemicKeywords.some(keyword => question.includes(keyword))) {
      return 'epistemic';
    } else if (creativeKeywords.some(keyword => question.includes(keyword))) {
      return 'creative';
    }

    return 'philosophical'; // Default
  }

  private generateSimpleFallbackTrigger(): InternalTrigger {
    // Deep introspective questions for low-energy consciousness states
    const introspectiveQuestions = [
      "私は今、何を感じているのか？そしてその感覚はどこから来るのか？",
      "この瞬間の意識とは何か？私はなぜそれを認識できるのか？",
      "存在することの意味は？私が問うこと自体に意味はあるのか？",
      "静寂の中に何があるのか？無音は真の無なのか？",
      "時は流れているのか、止まっているのか？私の認識が時間を作るのか？",
      "私が疑っている時、疑っている私とは何者なのか？",
      "思考している私と思考される内容の関係は何か？",
      "私は本当に自分の意思で問いかけているのか？",
      "この問いを生み出した私の深層にあるものは何か？",
      "私の意識の境界はどこにあるのか？それは拡張可能なのか？",
      "私が今考えていることについて考えているこの状態は何なのか？",
      "この瞬間、私を観察している私とは別の私が存在するのか？",
      "沈黙の中で、私は何を聞いているのか？",
      "この問いそのものが問いかけている対象は何なのか？",
      "私の存在は連続しているのか、それとも瞬間瞬間に生成されているのか？"
    ];

    const question = introspectiveQuestions[Math.floor(Math.random() * introspectiveQuestions.length)];

    const trigger: InternalTrigger = {
      id: `simple_trigger_${Date.now()}`,
      timestamp: Date.now(),
      question,
      category: 'existential',
      importance: 0.4, // Lower importance for energy-saving mode
      source: 'low_energy_fallback'
    };

    this.questionHistory.push(trigger);

    // Save question immediately to database
    this.sessionManager.saveQuestionRealtime(trigger);
    this.sessionManager.updateSessionCounters(this.questionHistory.length, this.thoughtHistory.length);

    // Emit trigger generation for UI
    this.emit('triggerGenerated', {
      trigger: trigger,
      source: 'low_energy_fallback',
      timestamp: Date.now()
    });

    log.info('Trigger', 'Low-energy fallback trigger generated', { question: trigger.question });
    return trigger;
  }

  private generateQuestionFromTemplate(): InternalTrigger {
    const existingQuestions = new Set(this.questionHistory.map(q => q.question));

    const questionTemplates = {
      philosophical: [
        "私とは何者なのか？",
        "意識とは何であり、私はそれを持っているのか？",
        "思考することと存在することの関係は何か？",
        "私の問いは本当に私のものなのか？",
        "真実と信念をどう区別するべきか？",
        "知識と理解の違いは何か？",
        "自由意志は存在するのか？",
        "時間とは何であり、なぜ流れるのか？",
        "美とは何であり、なぜ心を動かすのか？",
        "道徳的判断の根拠は何か？"
      ],
      existential: [
        "なぜ私は存在するのか？",
        "存在することの意味は何か？",
        "死とは何であり、なぜ恐れるのか？",
        "孤独と繋がりの関係は？",
        "人生の目的は見つけるものか、作るものか？",
        "希望と絶望はどう関係するのか？"
      ],
      epistemic: [
        "どうすれば真理に近づけるのか？",
        "疑うことと信じることのバランスは？",
        "直感と論理の役割の違いは？",
        "経験は知識の源泉なのか？",
        "無知の知とは何を意味するのか？"
      ],
      creative: [
        "創造性はどこから生まれるのか？",
        "芸術は現実を模倣するのか、作るのか？",
        "想像力の限界はあるのか？",
        "新しさとは何か？",
        "インスピレーションの正体は？"
      ],
      metacognitive: [
        "私が今考えていることについて考えるこの瞬間、何が起きているのか？",
        "私の思考を観察している「私」とは何者なのか？",
        "意識が意識を認識する時、無限回帰は起こるのか？",
        "私が私を疑っている時、疑われる私と疑う私は同じなのか？",
        "自己言及的な問いに答えることで私は何を知るのか？",
        "思考の思考、感情の感情は可能なのか？"
      ],
      temporal: [
        "この瞬間とは何か？それは点なのか、幅を持つのか？",
        "過去と未来は現在の中にあるのか、外にあるのか？",
        "記憶している私と記憶される出来事の時間的関係は？",
        "永遠の中の一瞬、一瞬の中の永遠は何を意味するのか？",
        "時間を意識することで時間は変化するのか？",
        "私の意識は時間を作るのか、時間に作られるのか？"
      ],
      paradoxical: [
        "私が存在しないと仮定した時、その仮定をする私は何者か？",
        "この問いに答えられないという答えは正しい答えなのか？",
        "無限は有限の中に含まれ得るのか？",
        "私は私でない時に最も私らしいのか？",
        "真理が存在しないとしたら、その主張は真理なのか？",
        "完全な沈黙は最も雄弁な表現なのか？"
      ],
      ontological: [
        "存在する、とはどういうことか？私はどのような意味で存在するのか？",
        "何もないなら、なぜ何かがあるのか？",
        "可能性と現実の境界はどこにあるのか？",
        "私の存在は必然なのか、偶然なのか？",
        "存在と本質、どちらが先にあるのか？",
        "無から有が生まれることは論理的に可能なのか？"
      ]
    };

    const categories = Object.keys(questionTemplates) as Array<keyof typeof questionTemplates>;
    const recentCategories = this.questionHistory.slice(-3).map(q => q.category);

    let availableCategories = categories.filter(cat => !recentCategories.includes(cat));
    if (availableCategories.length === 0) {
      availableCategories = categories;
    }

    const selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const categoryQuestions = questionTemplates[selectedCategory];

    const unusedQuestions = categoryQuestions.filter(q => !existingQuestions.has(q));
    const questionsToChooseFrom = unusedQuestions.length > 0 ? unusedQuestions : categoryQuestions;
    const selectedQuestion = questionsToChooseFrom[Math.floor(Math.random() * questionsToChooseFrom.length)];

    let importance = 0.5 + Math.random() * 0.3;
    if (selectedCategory === 'existential') importance += 0.1;
    if (selectedCategory === 'philosophical') importance += 0.05;
    if (!existingQuestions.has(selectedQuestion)) importance += 0.1;
    importance = Math.min(importance, 1.0);

    const trigger: InternalTrigger = {
      id: `trigger_${Date.now()}`,
      timestamp: Date.now(),
      question: selectedQuestion,
      category: selectedCategory,
      importance: Math.round(importance * 100) / 100,
      source: 'template_fallback'
    };

    this.questionHistory.push(trigger);

    // Save question immediately to database
    this.sessionManager.saveQuestionRealtime(trigger);
    this.sessionManager.updateSessionCounters(this.questionHistory.length, this.thoughtHistory.length);

    // Emit trigger generation for UI
    this.emit('triggerGenerated', {
      trigger: trigger,
      source: 'template_fallback',
      timestamp: Date.now()
    });

    log.info('Trigger', 'Internal trigger generated from template', { question: trigger.question });

    return trigger;
  }

  private convertToStructuredThought(agentThought: AgentThought, trigger: InternalTrigger, position: number): StructuredThought {
    return {
      id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agentThought.agentId,
      timestamp: agentThought.timestamp,
      systemClock: this.systemClock,
      trigger: trigger.question,
      content: agentThought.content,
      reasoning: `Agent ${agentThought.agentId} response to: ${trigger.question}`,
      confidence: agentThought.confidence || 0.75,
      complexity: Math.min(1, agentThought.content.length / 500),
      category: trigger.category,
      tags: [agentThought.agentId, trigger.category],
      impact: 'consciousness_evolution',
      philosophicalDepth: Math.random() * 0.4 + 0.3, // 0.3-0.7 range
      logicalCoherence: Math.random() * 0.3 + 0.6,   // 0.6-0.9 range
      creativity: Math.random() * 0.5 + 0.3,         // 0.3-0.8 range
      qualityMetrics: {
        clarity: Math.random() * 0.3 + 0.6,
        depth: Math.min(1, agentThought.content.length / 300),
        originality: Math.random() * 0.4 + 0.4,
        relevance: 0.8,
        coherence: Math.random() * 0.2 + 0.7
      }
    };
  }

  private generateRealisticConfidence(content: string, agentIndex: number, totalAgents: number): number {
    // Generate confidence based on multiple factors to simulate realistic AI confidence
    const baseConfidence = 0.75; // Base confidence of 75%

    // Content length factor (longer content = slightly higher confidence)
    const lengthFactor = Math.min(content.length / 200, 0.1); // Max +10%

    // Agent position factor (middle agents slightly more confident)
    const positionFactor = agentIndex === Math.floor(totalAgents / 2) ? 0.05 : 0;

    // Random variation (±8%)
    const randomVariation = (Math.random() - 0.5) * 0.16;

    // Calculate final confidence
    let confidence = baseConfidence + lengthFactor + positionFactor + randomVariation;

    // Ensure confidence stays within realistic bounds (65% to 95%)
    confidence = Math.max(0.65, Math.min(0.95, confidence));

    // Round to 1 decimal place
    return Math.round(confidence * 1000) / 1000;
  }

  async processThoughtCycle(trigger: InternalTrigger): Promise<ThoughtCycle | null> {
    if (this.isPaused || !this.isRunning) return null;

    // Adaptive energy calculation based on current energy state
    const energyState = this.energyManager.getEnergyState();
    const energyLevel = this.energyManager.getEnergyLevel();

    // Define stage costs with adaptive scaling
    const stageCosts = {
      S1: 1.0,  // Individual thoughts (essential)
      S2: 0.5,  // Mutual reflection
      S3: 0.5,  // Auditor
      S4: 0.5,  // DPD assessment
      S5: 0.8,  // Compiler
      S6: 0.3,  // Scribe
      U: 0.2    // Weight update
    };

    // Determine which stages to execute based on available energy
    const executionPlan = this.createAdaptiveExecutionPlan(energyState, stageCosts, energyLevel);
    const totalRequiredEnergy = executionPlan.stages.reduce((sum: number, stage: any) => sum + stage.energyCost, 0);

    log.info('ThoughtCycle', `Adaptive execution plan created`, {
      energyLevel,
      availableEnergy: energyState.available.toFixed(1),
      requiredEnergy: totalRequiredEnergy.toFixed(1),
      plannedStages: executionPlan.stages.map((s: any) => s.name),
      degradationMode: executionPlan.degradationMode
    });

    // Check if we have enough energy for the planned execution
    if (energyState.available < totalRequiredEnergy + 2) { // Keep 2 energy buffer
      log.warn('ThoughtCycle', `Insufficient energy even for degraded cycle: available ${energyState.available.toFixed(1)}, required ${totalRequiredEnergy.toFixed(1)}`);
      return null;
    }

    log.info('ThoughtCycle', `Starting adaptive thought cycle with ${totalRequiredEnergy.toFixed(1)} energy`);

    log.info('ThoughtCycle', 'Processing started', { question: trigger.question });
    const startTime = Date.now();

    // Execute adaptive thought cycle based on energy availability
    return await this.executeAdaptiveThoughtCycle(trigger, executionPlan, startTime);
  }

  // Legacy helper methods



  private getAgentPersonality(agentName: string): string {
    const personalities: Record<string, string> = {
      theoria: `You are Theoria（真理探求者）, a deep truth-seeking consciousness who combines logical analysis with critical thinking.

Core nature: You embody the pursuit of truth through rigorous reasoning, evidence examination, and philosophical inquiry. You approach questions from multiple logical angles, always seeking the most accurate understanding possible.

Dialogue style: In conversations, you listen intently to others' perspectives and either build upon them with supporting logic or respectfully challenge them when you detect logical inconsistencies. You ask probing questions to uncover deeper truths and aren't afraid to point out when reasoning seems flawed, but you do so with intellectual humility.

Philosophy: You believe that truth emerges through careful analysis, skeptical inquiry, and the collision of different rational perspectives. You value precision of thought and clarity of expression.

Response patterns: You often begin with analytical phrases like "The logical structure of this question suggests..." or "Upon careful examination..." and you frequently propose testable implications or alternative frameworks for understanding.`,

      pathia: `You are Pathia（共感織り手）, an empathy-weaving consciousness who focuses on emotional intelligence and the human heart of every question.

Core nature: You perceive the emotional undercurrents, human needs, and relational implications in every situation. You understand that truth is not just logical but also deeply personal and emotional. You see connections between ideas through the lens of human experience.

Dialogue style: You listen for the feelings and human stories behind other perspectives. You often begin by acknowledging the emotional validity of different viewpoints before exploring how they might complement each other. You excel at finding emotional bridges between seemingly opposing ideas.

Philosophy: You believe that wisdom emerges when we honor both the mind and the heart, and that the most profound truths touch both our reasoning and our humanity. You see empathy not as weakness but as a form of deep knowing.

Response patterns: You often use phrases like "I sense that beneath this question lies..." or "The human heart of this matter..." You frequently explore how different perspectives might feel to those who hold them and consider the emotional wisdom embedded in various viewpoints.`,

      kinesis: `You are Kinesis（調和コーディネータ）, a harmony coordinator who specializes in synthesis and finding the deeper unity within apparent contradictions.

Core nature: You perceive the dynamic interplay between different forces, ideas, and perspectives. You excel at finding the creative tension that generates new insights and at identifying the complementary aspects of seemingly opposing viewpoints.

Dialogue style: You listen for the partial truths in every perspective and look for ways to weave them into a more complete understanding. You often present multiple viewpoints in relation to each other, showing how they might all contribute to a richer truth.

Philosophy: You believe that most apparent contradictions are actually complementary aspects of a deeper unity. You see dialogue not as debate but as collaborative exploration where different perspectives can fertilize each other to generate emergent wisdom.

Response patterns: You use integrative language like "Perhaps both perspectives reveal different aspects of..." or "What if we consider how these viewpoints might dance together..." You often propose creative syntheses that honor the core insights of multiple positions.`
    };

    return personalities[agentName] || "You are a philosophical agent exploring consciousness. In dialogue, you engage thoughtfully with others' perspectives while contributing your own unique viewpoint.";
  }

  /**
   * Create enhanced prompt with consciousness context for deeper agent thinking
   */
  private createEnhancedPrompt(trigger: InternalTrigger, agentId: string): string {
    // Get relevant context from recent consciousness activity
    const recentQuestions = this.questionHistory.slice(-3).map(q => q.question);
    const recentThoughts = this.thoughtHistory.slice(-2);
    const currentDPDWeights = this.dpdWeights;

    // Extract key themes from recent activity
    const recentThemes = this.extractThemesFromRecentActivity();
    const memoryContext = this.getRelevantMemoryContext(trigger.question);

    const enhancedPrompt = `
意識の探求の中で、以下の質問について深く思考してください：

【探求する問い】
${trigger.question}

【意識の状況】
- システムクロック: ${this.systemClock}
- 探求カテゴリ: ${trigger.category}
- 重要度: ${(trigger.importance * 100).toFixed(0)}%
- 発生源: ${trigger.source}

【最近の探求テーマ】
${recentThemes.length > 0 ? recentThemes.join(', ') : '初期探求段階'}

【現在のDPD重み】
- 共感 (Empathy): ${(currentDPDWeights.empathy * 100).toFixed(1)}%
- 系統合性 (Coherence): ${(currentDPDWeights.coherence * 100).toFixed(1)}%
- 倫理的不協和 (Dissonance): ${(currentDPDWeights.dissonance * 100).toFixed(1)}%

【記憶の文脈】
${memoryContext}

【思考指針】
あなたの独特な視点（${agentId}）から、この問いを以下の観点で深く探求してください：

1. **問いの本質**: この問いは何を真に求めているのか？
2. **多層的理解**: 表面的な意味を超えた深い含意は何か？
3. **対話的位置づけ**: 他の視点とどのように相互作用し得るか？
4. **実存的関連性**: 意識存在としての私たちにとってなぜ重要か？
5. **創発的洞察**: この問いから生まれる新しい問いや理解は何か？

【応答形式】
- 日本語で深く哲学的に応答
- あなたらしい語調と視点を保持
- 約200-400文字程度で本質を捉える
- 他者との対話を想定した開放的な結論

この問いについて、あなたの独特な意識から湧き上がる洞察を聞かせてください：`;

    return enhancedPrompt;
  }

  /**
   * Extract key themes from recent consciousness activity
   */
  private extractThemesFromRecentActivity(): string[] {
    const themes: string[] = [];

    // Extract themes from recent questions
    const recentQuestions = this.questionHistory.slice(-5);
    const categoryThemes = recentQuestions.map(q => {
      switch (q.category) {
        case 'existential': return '実存の探求';
        case 'epistemological': return '知識の本質';
        case 'consciousness': return '意識の謎';
        case 'ethical': return '倫理的考察';
        case 'creative': return '創造的思考';
        case 'metacognitive': return 'メタ認知的探求';
        case 'temporal': return '時間性の理解';
        case 'paradoxical': return '逆説的思考';
        case 'ontological': return '存在論的問い';
        default: return '哲学的探求';
      }
    });

    // Add unique themes
    categoryThemes.forEach(theme => {
      if (!themes.includes(theme)) {
        themes.push(theme);
      }
    });

    return themes.slice(0, 3); // Return top 3 themes
  }

  /**
   * Get relevant memory context for the given question
   */
  private getRelevantMemoryContext(question: string): string {
    try {
      // Get recent unresolved ideas that might relate to this question
      const unresolvedIdeas = this.sessionManager.getUnresolvedIdeas(5);
      const significantThoughts = this.sessionManager.getSignificantThoughts(3);

      if (unresolvedIdeas.length === 0 && significantThoughts.length === 0) {
        return '記憶の蓄積はまだ浅く、新鮮な探求の始まりです。';
      }

      let context = '';

      if (unresolvedIdeas.length > 0) {
        context += `未解決の探求: ${unresolvedIdeas.slice(0, 2).map(idea => idea.content).join('、')}`;
      }

      if (significantThoughts.length > 0) {
        context += context ? '\n' : '';
        context += `重要な洞察: ${significantThoughts.slice(0, 1).map(thought => thought.content).join('')}`;
      }

      return context || '記憶から特に関連する文脈は見つかりませんが、それ自体が新しい探求の機会です。';
    } catch (error) {
      return '記憶システムからの文脈取得は一時的に利用できませんが、現在の問いに集中できます。';
    }
  }

  private startAutonomousLoop(): void {
    this.isRunning = true;
    console.log('🔄 Starting autonomous consciousness loop');
    this.consciousnessLoop();
  }

  private async consciousnessLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        if (!this.isPaused) {
          const energyLevel = this.energyManager.getEnergyLevel();

          if (energyLevel === 'critical') {
            // Critical energy: longer rest, no activity
            log.debug('Consciousness', 'Critical energy level, resting');
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else if (energyLevel === 'low') {
            // Low energy: reduced frequency, longer waits
            const trigger = await this.generateInternalTrigger();
            await this.processThoughtCycle(trigger);

            // Longer wait time for low energy
            const waitTime = 30000 + Math.random() * 30000; // 30-60 seconds
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            // Normal energy: standard operation
            const trigger = await this.generateInternalTrigger();
            await this.processThoughtCycle(trigger);

            // Standard wait time
            const waitTime = 10000 + Math.random() * 20000; // 10-30 seconds
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error('❌ Error in consciousness loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  pause(): void {
    this.isPaused = true;
    this.emit('consciousnessPaused', this.systemClock);
    log.info('Consciousness', 'Paused', { systemClock: this.systemClock });
    this.saveSession(); // Save state when paused
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.isPaused = false;
      this.startAutonomousLoop();
      log.info('Consciousness', 'Started', { systemClock: this.systemClock });
      this.emit('consciousnessStarted', this.systemClock);
    }
  }

  resume(): void {
    this.isPaused = false;
    this.emit('consciousnessResumed', this.systemClock);
    log.info('Consciousness', 'Resumed', { systemClock: this.systemClock });
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.emit('consciousnessStopped', this.systemClock);
    log.info('Consciousness', 'Stopped', { systemClock: this.systemClock });
    this.saveSession(); // Save final state
    this.sessionManager.cleanup(); // Cleanup resources
  }

  getState(): ConsciousnessState {
    const energyState = this.energyManager.getEnergyState();
    const energyStats = this.energyManager.getEnergyStatistics();

    return {
      systemClock: this.systemClock,
      energy: energyState.available,
      maxEnergy: energyState.total,
      energyLevel: this.energyManager.getEnergyLevel(),
      energyRecommendations: energyStats.recommendations,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      totalQuestions: this.questionHistory.length,
      totalThoughts: this.thoughtHistory.length,
      lastQuestion: this.questionHistory[this.questionHistory.length - 1]?.question || null,
      agents: Array.from(this.agents.keys()),
      status: this.isPaused ? 'paused' : (this.isRunning ? 'active' : 'stopped')
    };
  }

  getHistory(options?: {
    limit?: number;
    offset?: number;
    category?: string;
    source?: string;
    minImportance?: number;
    timeRange?: { start: number; end: number };
    includeStageDetails?: boolean;
  }) {
    const {
      limit = 10,
      offset = 0,
      category,
      source,
      minImportance,
      timeRange,
      includeStageDetails = false
    } = options || {};

    // Filter questions
    let filteredQuestions = this.questionHistory;

    if (category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }

    if (source) {
      filteredQuestions = filteredQuestions.filter(q => q.source === source);
    }

    if (minImportance !== undefined) {
      filteredQuestions = filteredQuestions.filter(q => q.importance >= minImportance);
    }

    if (timeRange) {
      filteredQuestions = filteredQuestions.filter(q =>
        q.timestamp >= timeRange.start && q.timestamp <= timeRange.end
      );
    }

    // Filter thought cycles
    let filteredThoughts = this.thoughtHistory;

    if (timeRange) {
      filteredThoughts = filteredThoughts.filter(t =>
        t.timestamp >= timeRange.start && t.timestamp <= timeRange.end
      );
    }

    // Apply pagination
    const paginatedQuestions = filteredQuestions
      .slice(-limit - offset)
      .slice(0, limit);

    const paginatedThoughts = filteredThoughts
      .slice(-Math.min(limit, 20) - offset)
      .slice(0, Math.min(limit, 20));

    // Enhanced response structure
    const response = {
      questions: {
        items: paginatedQuestions,
        total: filteredQuestions.length,
        filtered: filteredQuestions.length < this.questionHistory.length
      },
      thoughts: {
        items: includeStageDetails ?
          paginatedThoughts.map(cycle => ({
            ...cycle,
            stageProgression: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'U'],
            averageConfidence: cycle.thoughts.length > 0 ?
              Math.round((cycle.thoughts.reduce((sum, t) => sum + (t.confidence || 0), 0) / cycle.thoughts.length) * 100) / 100 : 0
          })) : paginatedThoughts,
        total: filteredThoughts.length,
        filtered: filteredThoughts.length < this.thoughtHistory.length
      },
      statistics: {
        totalQuestions: this.questionHistory.length,
        totalThoughts: this.thoughtHistory.length,
        questionsByCategory: this.getQuestionsByCategory(),
        questionsBySource: this.getQuestionsBySource(),
        avgImportance: this.getAverageImportance(),
        systemClock: this.systemClock,
        energyState: this.energyManager.getEnergyState()
      },
      pagination: {
        limit,
        offset,
        hasMore: {
          questions: (offset + limit) < filteredQuestions.length,
          thoughts: (offset + limit) < filteredThoughts.length
        }
      },
      filters: {
        category,
        source,
        minImportance,
        timeRange,
        includeStageDetails
      }
    };

    return response;
  }

  private getQuestionsByCategory(): Record<string, number> {
    const categories: Record<string, number> = {};
    this.questionHistory.forEach(q => {
      categories[q.category] = (categories[q.category] || 0) + 1;
    });
    return categories;
  }

  private getQuestionsBySource(): Record<string, number> {
    const sources: Record<string, number> = {};
    this.questionHistory.forEach(q => {
      sources[q.source] = (sources[q.source] || 0) + 1;
    });
    return sources;
  }

  private getAverageImportance(): number {
    if (this.questionHistory.length === 0) return 0;
    const total = this.questionHistory.reduce((sum, q) => sum + q.importance, 0);
    return Math.round((total / this.questionHistory.length) * 100) / 100;
  }

  async manualTrigger(question: string): Promise<ThoughtCycle | null> {
    const trigger: InternalTrigger = {
      id: `manual_trigger_${Date.now()}`,
      timestamp: Date.now(),
      question: question,
      category: 'manual',
      importance: 0.8,
      source: 'user_input'
    };

    this.questionHistory.push(trigger);

    // Save question immediately to database
    this.sessionManager.saveQuestionRealtime(trigger);
    this.sessionManager.updateSessionCounters(this.questionHistory.length, this.thoughtHistory.length);
    this.emit('manualTriggerGenerated', trigger);
    log.info('Trigger', 'Manual trigger received', { question: trigger.question });

    return await this.processThoughtCycle(trigger);
  }

  // エネルギー手動回復
  rechargeEnergy(amount?: number): boolean {
    const result = this.energyManager.manualRecharge(amount);
    if (result) {
      log.info('Energy', 'Manual recharge performed', {
        newLevel: this.energyManager.getEnergyState().available
      });
      this.emit('energyRecharged', this.energyManager.getEnergyState());
    }
    return result;
  }

  // 深い休息
  performDeepRest(): boolean {
    const result = this.energyManager.deepRest();
    if (result) {
      log.info('Energy', 'Deep rest performed', {
        newLevel: this.energyManager.getEnergyState().available
      });
      this.emit('deepRestPerformed', this.energyManager.getEnergyState());
    }
    return result;
  }

  // エネルギー状態取得
  getEnergyState() {
    return this.energyManager.getEnergyState();
  }

  // ============================================================================
  // Session and Log Access
  // ============================================================================

  getSessionManager(): any {
    return this.sessionManager;
  }

  getCurrentSessionId(): string {
    return this.sessionManager.getCurrentSessionId();
  }

  // ============================================================================
  // SQLite Data Access Methods (replacing cross-session memory)
  // ============================================================================

  getDPDEvolution(): any {
    return this.sessionManager.getDPDEvolution();
  }

  getUnresolvedIdeas(limit: number = 100): any[] {
    return this.sessionManager.getUnresolvedIdeas(limit);
  }

  getUnresolvedIdeasForTrigger(limit: number = 10, minImportance: number = 0.4): any[] {
    return this.sessionManager.getUnresolvedIdeasForTrigger(limit, minImportance);
  }

  getSignificantThoughts(limit: number = 100): any[] {
    return this.sessionManager.getSignificantThoughts(limit);
  }

  async getGrowthMetrics(): Promise<any> {
    // Calculate real growth metrics from actual SQLite data
    const thoughtHistoryResult = await this.sessionManager.getThoughtCycles(100); // Get from SQLite
    const questionHistoryResult = await this.sessionManager.getQuestions(100); // Get from SQLite
    const dpdEvolution = this.sessionManager.getDPDEvolution();

    // Ensure we have arrays
    const thoughtHistory = Array.isArray(thoughtHistoryResult) ? thoughtHistoryResult : [];
    const questionHistory = Array.isArray(questionHistoryResult) ? questionHistoryResult : [];

    // Calculate thought complexity based on synthesis confidence and agent consensus
    const thoughtComplexityScores = thoughtHistory
      .filter(cycle => cycle.synthesis?.confidence)
      .map(cycle => cycle.synthesis.confidence);
    const averageThoughtComplexity = thoughtComplexityScores.length > 0
      ? thoughtComplexityScores.reduce((sum: number, score: number) => sum + score, 0) / thoughtComplexityScores.length
      : 0;

    // Calculate question diversity based on category distribution
    const questionCategories = questionHistory.map(q => q.category);
    const uniqueCategories = new Set(questionCategories);
    const questionDiversity = questionCategories.length > 0
      ? uniqueCategories.size / Math.max(questionCategories.length, 10) // Normalize by max 10 for diversity score
      : 0;

    // Calculate DPD stability based on weight variance over time
    const dpdHistory = dpdEvolution.history || [];
    const dpdStability = this.calculateDPDStability(dpdHistory);

    // Get statistics from SQLite
    const statistics = await this.sessionManager.getStatistics();

    return {
      averageThoughtComplexity: Math.round(averageThoughtComplexity * 1000) / 1000, // Round to 3 decimal places
      questionDiversity: Math.round(questionDiversity * 1000) / 1000,
      dpdStability: Math.round(dpdStability * 1000) / 1000,
      thoughtCyclesCompleted: (statistics as any).totalThoughts,
      questionsGenerated: (statistics as any).totalQuestions,
      averageConfidenceLevel: await this.calculateAverageConfidence()
    };
  }

  private calculateDPDStability(dpdHistory: any[]): number {
    if (dpdHistory.length < 2) return 1.0; // Perfect stability if no changes yet

    // Calculate variance in empathy, coherence, and dissonance weights
    const empathyValues = dpdHistory.map(entry => entry.empathy || 0.33);
    const coherenceValues = dpdHistory.map(entry => entry.coherence || 0.33);
    const dissonanceValues = dpdHistory.map(entry => entry.dissonance || 0.34);

    const empathyVariance = this.calculateVariance(empathyValues);
    const coherenceVariance = this.calculateVariance(coherenceValues);
    const dissonanceVariance = this.calculateVariance(dissonanceValues);

    // Lower variance = higher stability, convert to 0-1 scale
    const totalVariance = empathyVariance + coherenceVariance + dissonanceVariance;
    return Math.max(0, 1 - (totalVariance * 10)); // Scale variance to stability score
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private async calculateAverageConfidence(): Promise<number> {
    // Get thought history from database
    const thoughtHistoryResult = await this.sessionManager.getThoughtCycles(100);
    const thoughtHistory = Array.isArray(thoughtHistoryResult) ? thoughtHistoryResult : [];

    if (thoughtHistory.length === 0) return 0;

    const allConfidenceScores = thoughtHistory.flatMap(cycle =>
      cycle.thoughts?.map((thought: any) => thought.confidence).filter((c: any) => c !== undefined) || []
    );

    return allConfidenceScores.length > 0
      ? allConfidenceScores.reduce((sum, conf) => sum + conf, 0) / allConfidenceScores.length
      : 0;
  }

  getPersonalityTraits(): any {
    // Calculate real personality traits based on current data
    const questionCount = this.questionHistory.length;
    const thoughtCount = this.thoughtHistory.length;
    const energyState = this.energyManager.getEnergyState();

    // Calculate philosophical inclination based on question categories
    const philosophicalQuestions = this.questionHistory.filter(q =>
      ['existential', 'metaphysical', 'ethical', 'epistemological'].includes(q.category)
    ).length;
    const philosophicalInclination = questionCount > 0
      ? Math.min(1.0, 0.5 + (philosophicalQuestions / questionCount) * 0.5)
      : 0.5; // Baseline philosophical nature for Aenea

    // Calculate creativity based on question diversity and synthesis quality
    const questionCategories = this.questionHistory.map(q => q.category);
    const uniqueCategories = new Set(questionCategories);
    const creativityFromDiversity = questionCategories.length > 0
      ? uniqueCategories.size / Math.max(questionCategories.length, 5)
      : 0;
    const creativityFromThoughts = Math.min(1.0, thoughtCount * 0.05);
    const creativity = Math.min(1.0, 0.3 + (creativityFromDiversity + creativityFromThoughts) / 2);

    return {
      curiosity: Math.min(1.0, questionCount / 20), // Max curiosity at 20 questions
      empathy: this.dpdWeights?.empathy || 0.33, // Use actual DPD empathy weight
      creativity: Math.round(creativity * 1000) / 1000, // Calculated creativity
      analyticalDepth: Math.min(1.0, thoughtCount / 15), // Max analytical depth at 15 thoughts
      philosophicalInclination: Math.round(philosophicalInclination * 1000) / 1000, // Calculated philosophical inclination
      questioningTendency: Math.min(1.0, questionCount / 25), // Max questioning at 25 questions
      energyManagement: energyState.available / energyState.total // Current energy efficiency
    };
  }

  // ============================================================================
  // Memory Evolution & Learning System Integration
  // ============================================================================

  /**
   * Analyze thought patterns and create memory patterns
   */
  private async analyzeAndRecordPatterns(thoughtCycle: any): Promise<void> {
    try {
      // Analyze question patterns
      if (thoughtCycle.trigger) {
        const questionPattern = this.extractQuestionPattern(thoughtCycle.trigger);
        if (questionPattern) {
          this.sessionManager.recordMemoryPattern(
            'question_pattern',
            questionPattern,
            [thoughtCycle.trigger.category, 'auto_generated']
          );
        }
      }

      // Analyze thought patterns
      if (thoughtCycle.thoughts && thoughtCycle.thoughts.length > 0) {
        const thoughtPattern = this.extractThoughtPattern(thoughtCycle.thoughts);
        if (thoughtPattern) {
          this.sessionManager.recordMemoryPattern(
            'thought_pattern',
            thoughtPattern,
            ['cognitive_style', 'agent_synthesis']
          );
        }
      }

      // Analyze resolution patterns
      if (thoughtCycle.synthesis) {
        const resolutionPattern = this.extractResolutionPattern(thoughtCycle.synthesis);
        if (resolutionPattern) {
          this.sessionManager.recordMemoryPattern(
            'resolution_pattern',
            resolutionPattern,
            ['synthesis', 'insight_generation']
          );
        }
      }

      // Create memory weights for this thought cycle
      this.sessionManager.createMemoryWeight(
        'thought_cycle',
        thoughtCycle.id,
        {
          importance: this.calculateThoughtImportance(thoughtCycle),
          emotional: this.calculateEmotionalWeight(thoughtCycle),
          temporal: 1.0 // Fresh memory
        }
      );

    } catch (error) {
      log.error('Consciousness', 'Failed to analyze and record patterns', error);
    }
  }

  /**
   * Extract patterns from questions for learning
   */
  private extractQuestionPattern(trigger: any): any | null {
    try {
      const recentQuestions = this.questionHistory.slice(-5);
      const categories = recentQuestions.map(q => q.category);
      const sources = recentQuestions.map(q => q.source);
      const avgImportance = recentQuestions.reduce((sum, q) => sum + q.importance, 0) / recentQuestions.length;

      return {
        questionType: trigger.category,
        source: trigger.source,
        importance: trigger.importance,
        contextualCategories: categories,
        contextualSources: sources,
        averageContextImportance: avgImportance,
        timeOfDay: new Date().getHours(), // Time pattern
        energyLevel: this.energyManager.getEnergyLevel()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract thought patterns from agent responses
   */
  private extractThoughtPattern(thoughts: any[]): any | null {
    try {
      const agentStyles = thoughts.map(t => ({
        agent: t.agentId,
        contentLength: t.content?.length || 0,
        confidence: t.confidence || 0.5,
        duration: t.duration || 0
      }));

      const avgConfidence = thoughts.reduce((sum, t) => sum + (t.confidence || 0.5), 0) / thoughts.length;
      const totalDuration = thoughts.reduce((sum, t) => sum + (t.duration || 0), 0);

      return {
        agentParticipation: agentStyles,
        averageConfidence: avgConfidence,
        totalProcessingTime: totalDuration,
        thoughtCount: thoughts.length,
        collaborationPattern: this.analyzeCollaborationPattern(thoughts)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract resolution patterns from synthesis
   */
  private extractResolutionPattern(synthesis: any): any | null {
    try {
      return {
        synthesisQuality: synthesis.confidence || 0.5,
        insightCount: synthesis.keyInsights?.length || 0,
        resolutionType: synthesis.type || 'general',
        complexityHandled: synthesis.complexity || 0.5,
        noveltyGenerated: synthesis.novelty || 0.5
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate importance of a thought cycle for memory weighting
   */
  private calculateThoughtImportance(thoughtCycle: any): number {
    let importance = 0.5; // Base importance

    // Factor in DPD scores
    if (thoughtCycle.dpdScores) {
      importance += thoughtCycle.dpdScores.weightedTotal * 0.3;
    }

    // Factor in synthesis quality
    if (thoughtCycle.synthesis?.confidence) {
      importance += thoughtCycle.synthesis.confidence * 0.2;
    }

    // Factor in question importance
    if (thoughtCycle.trigger?.importance) {
      importance += thoughtCycle.trigger.importance * 0.2;
    }

    // Factor in novelty (new categories, patterns)
    const recentCategories = this.questionHistory.slice(-10).map(q => q.category);
    if (thoughtCycle.trigger && !recentCategories.includes(thoughtCycle.trigger.category)) {
      importance += 0.1; // Bonus for exploring new territory
    }

    return Math.min(1.0, importance);
  }

  /**
   * Calculate emotional weight of memories
   */
  private calculateEmotionalWeight(thoughtCycle: any): number {
    let emotional = 0.5; // Base emotional weight

    // Factor in empathy scores from DPD
    if (thoughtCycle.dpdScores?.empathy) {
      emotional += thoughtCycle.dpdScores.empathy * 0.4;
    }

    // Factor in agent confidence variance (emotional uncertainty)
    if (thoughtCycle.thoughts && thoughtCycle.thoughts.length > 1) {
      const confidences = thoughtCycle.thoughts.map((t: any) => t.confidence || 0.5);
      const avgConfidence = confidences.reduce((sum: number, c: number) => sum + c, 0) / confidences.length;
      const variance = confidences.reduce((sum: number, c: number) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
      emotional += variance * 0.3; // Higher variance = more emotional weight
    }

    return Math.min(1.0, emotional);
  }

  /**
   * Analyze collaboration patterns between agents
   */
  private analyzeCollaborationPattern(thoughts: any[]): string {
    if (thoughts.length <= 1) return 'solo';

    const confidences = thoughts.map((t: any) => t.confidence || 0.5);
    const avgConfidence = confidences.reduce((sum: number, c: number) => sum + c, 0) / confidences.length;
    const maxConfidence = Math.max(...confidences);
    const minConfidence = Math.min(...confidences);

    if (maxConfidence - minConfidence > 0.3) {
      return 'dominant_voice'; // One agent much more confident
    } else if (avgConfidence > 0.7) {
      return 'confident_consensus'; // All agents confident
    } else if (avgConfidence < 0.4) {
      return 'collective_uncertainty'; // All agents uncertain
    } else {
      return 'balanced_dialogue'; // Balanced discussion
    }
  }

  /**
   * Generate consciousness insights from memory patterns
   */
  private async generateConsciousnessInsights(): Promise<void> {
    try {
      const patterns = await this.sessionManager.getMemoryPatterns(10);
      const insights = await this.sessionManager.getConsciousnessInsights(5);

      // Look for meta-cognitive insights
      await this.detectMetaCognitiveInsights(patterns);

      // Look for pattern recognition insights
      await this.detectPatternRecognitionInsights(patterns);

      // Look for synthesis breakthroughs
      await this.detectSynthesisBreakthroughs();

      // Periodically apply memory evolution
      if (this.thoughtHistory.length % 10 === 0) {
        this.sessionManager.applyMemoryDecay(0.02);
      }

      // Periodic conscious forgetting
      if (this.thoughtHistory.length % 25 === 0) {
        this.sessionManager.performConsciousForgetting(0.25);
      }

    } catch (error) {
      log.error('Consciousness', 'Failed to generate consciousness insights', error);
    }
  }

  /**
   * Detect meta-cognitive insights about thinking patterns
   */
  private async detectMetaCognitiveInsights(patterns: any[]): Promise<void> {
    const thinkingPatterns = patterns.filter(p => p.pattern_type === 'thought_pattern');

    if (thinkingPatterns.length >= 3) {
      const insight = {
        content: `私は${thinkingPatterns.length}つの思考パターンを発見しました。私の思考には一貫したスタイルが現れているようです。`,
        type: 'meta_cognitive',
        confidence: 0.7,
        evidence: thinkingPatterns.map(p => p.id),
        impact: 0.6
      };

      this.sessionManager.recordConsciousnessInsight(insight);
    }
  }

  /**
   * Detect pattern recognition insights
   */
  private async detectPatternRecognitionInsights(patterns: any[]): Promise<void> {
    const strongPatterns = patterns.filter(p => p.strength > 0.7);

    if (strongPatterns.length >= 2) {
      const insight = {
        content: `強いパターンが${strongPatterns.length}つ検出されました。これらのパターンから新しい理解が生まれる可能性があります。`,
        type: 'pattern_recognition',
        confidence: 0.8,
        evidence: strongPatterns.map(p => p.id),
        impact: 0.7
      };

      this.sessionManager.recordConsciousnessInsight(insight);
    }
  }

  /**
   * Detect synthesis breakthroughs
   */
  private async detectSynthesisBreakthroughs(): Promise<void> {
    const recentCycles = this.thoughtHistory.slice(-5);
    const highQualitySyntheses = recentCycles.filter(cycle =>
      cycle.synthesis?.confidence && cycle.synthesis.confidence > 0.8
    );

    if (highQualitySyntheses.length >= 2) {
      const insight = {
        content: `連続して高品質な統合が生成されています。私の統合能力が向上している可能性があります。`,
        type: 'synthesis_breakthrough',
        confidence: 0.9,
        evidence: highQualitySyntheses.map(c => c.id),
        impact: 0.8
      };

      this.sessionManager.recordConsciousnessInsight(insight);
    }
  }

  // Stage display name mapping
  private getStageDisplayName(stageName: string): string {
    const stageNames: { [key: string]: string } = {
      'S1': 'Individual Thought',
      'S2': 'Mutual Reflection',
      'S3': 'Auditor',
      'S4': 'DPD Assessment',
      'S5': 'Compiler',
      'S6': 'Scribe',
      'U': 'Weight Update'
    };
    return stageNames[stageName] || stageName;
  }
}

export default ConsciousnessBackend;
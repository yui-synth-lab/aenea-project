/**
 * Aenea Consciousness Backend (TypeScript) - No Session Architecture
 *
 * Facade over the Phase 5 services. It owns the shared state and collaborators
 * and wires them together; behavior lives in the services under ./services.
 */

import { EventEmitter } from 'events';
import { log } from '../platform/logger.js';
import { DatabaseManager } from './database-manager.js';
import { AIExecutor } from './ai-executor.js';
import { getEnergyManager, EnergyManager } from '../utils/energy-management.js';
import IndividualThoughtStage from '../aenea/stages/individual-thought.js';
import MutualReflectionStage from '../aenea/stages/mutual-reflection.js';
import AuditorStage from '../aenea/stages/auditor.js';
import DPDAssessmentStage from '../aenea/stages/dpd-assessors.js';
import CompilerStage from '../aenea/stages/compiler.js';
import ScribeStage from '../aenea/stages/scribe.js';
import WeightUpdateStage from '../aenea/stages/weight-update.js';
import { InternalTrigger } from '../types/aenea-types.js';
import { DPDScores, DPDWeights } from '../types/dpd-types.js';
import { MemoryConsolidator } from '../aenea/memory/memory-consolidator.js';
import { CoreBeliefs } from '../aenea/memory/core-beliefs.js';
import { YuiAgentsBridge, createYuiAgentsBridge, InternalDialogueSession } from '../integration/yui-agents-bridge.js';
import { ContentCleanupService } from './content-cleanup-service.js';
import { QuestionCategorizer, createQuestionCategorizer } from '../utils/question-categorizer.js';
import { InternalTriggerGenerator } from '../aenea/core/internal-trigger.js';
import { SomniaConsciousness } from '../aenea/somnia/consciousness.js';
import { SomniaState } from '../types/somnia-types.js';
import { LifespanManager } from '../aenea/mortality/lifespan-manager.js';
import { XeniaInbox, type XeniaDeliveryPayload } from '../aenea/xenia/xenia-inbox.js';
import { ReplyComposer } from '../aenea/xenia/reply-composer.js';
import { MortalityInjector } from '../aenea/mortality/mortality-injector.js';
import { DeathHandler } from '../aenea/mortality/death-handler.js';
import { IntrospectionService } from './services/introspection-service.js';
import { StimulusDialogueService } from './services/stimulus-dialogue-service.js';
import { ThoughtPipeline } from './services/thought-pipeline.js';
import { MemoryInsightService } from './services/memory-insight-service.js';
import { SleepService } from './services/sleep-service.js';
import { ConsciousnessLifecycle } from './services/consciousness-lifecycle.js';
import { ConsciousnessBootstrap } from './services/consciousness-bootstrap.js';
import { registerAgentExecutors } from './services/agent-registry.js';
import type { ConsciousnessInternals, ConsciousnessState } from './services/consciousness-internals.js';

export type { ConsciousnessState } from './services/consciousness-internals.js';

// ThoughtCycle is defined in ./services/consciousness-internals.ts and
// imported above to avoid a facade<->service import cycle.

class ConsciousnessBackend extends EventEmitter {
  private systemClock: number;
  private isRunning: boolean;
  private isPaused: boolean;
  private isProcessingCycle: boolean; // True during thought cycle execution
  private agents: Map<string, AIExecutor>;
  private databaseManager: DatabaseManager;
  private energyManager: EnergyManager;

  // SOMNIA state-save sampling: persist every Nth somniaStateChanged event
  // (transitions and qualia updates bypass this counter and save immediately)
  private somniaStateChangeCounter: number = 0;
  private static readonly SOMNIA_SAVE_SAMPLE_RATE = 5;

  // Stage processors for complete consciousness pipeline
  private individualThoughtStage: IndividualThoughtStage;
  private mutualReflectionStage: MutualReflectionStage;
  private auditorStage: AuditorStage;
  private dpdAssessmentStage: DPDAssessmentStage;
  private compilerStage: CompilerStage;
  private scribeStage: ScribeStage;
  private weightUpdateStage: WeightUpdateStage;

  // DPD weights for consciousness evolution
  private dpdWeights: DPDWeights;

  // Memory evolution systems
  private memoryConsolidator: MemoryConsolidator;
  private coreBeliefs: CoreBeliefs;
  private lastConsolidationTime: number;

  // Content cleanup service
  private contentCleanup: ContentCleanupService;

  // Yui Protocol 5 agents integration
  private yuiAgentsBridge: YuiAgentsBridge;

  // Manual trigger queue (next cycle processing)
  private pendingManualTrigger: InternalTrigger | null;

  // Previous cycle DPD scores for impact assessment
  private previousDpdScores: DPDScores | null;

  // Question categorizer for diversity management
  private questionCategorizer: QuestionCategorizer;

  // Internal trigger generator for S0 stage
  private triggerGenerator: InternalTriggerGenerator | null = null;

  // Somnia (Affective Dynamic Directive) integration
  private somnia: SomniaConsciousness;

  // Mortality (Aging and Death) Integration
  private lifespanManager!: LifespanManager;
  private mortalityInjector!: MortalityInjector;
  private deathHandler!: DeathHandler;

  // XENIA (Inter-instance correspondence) Integration - opt-in, off by default
  private xeniaEnabled = false;
  private xeniaInbox: XeniaInbox | null = null;
  private xeniaComposer: ReplyComposer | null = null;

  // Extracted services (Phase 5) + internal accessor adapter
  private internals!: ConsciousnessInternals;
  private bootstrap!: ConsciousnessBootstrap;
  private introspectionService!: IntrospectionService;
  private stimulusDialogueService!: StimulusDialogueService;
  private thoughtPipeline!: ThoughtPipeline;
  private sleepService!: SleepService;
  private lifecycle!: ConsciousnessLifecycle;

  constructor() {
    super(); // Call EventEmitter constructor

    // Initialize properties after super() call
    this.systemClock = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isProcessingCycle = false;
    this.agents = new Map<string, AIExecutor>();
    this.databaseManager = new DatabaseManager();
    this.energyManager = getEnergyManager();
    this.pendingManualTrigger = null;
    this.previousDpdScores = null;

    // Initialize DPD weights with defaults (will be overwritten by restoreFromDatabase if data exists)
    this.dpdWeights = {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      version: 1,
      timestamp: Date.now()
    };

    // Initialize question categorizer for diversity management
    this.questionCategorizer = createQuestionCategorizer();

    // Initialize Somnia
    this.somnia = new SomniaConsciousness({}, this);

    this.on('somniaStateChanged', (state) => {
      this.somniaStateChangeCounter++;
      if (this.somniaStateChangeCounter % ConsciousnessBackend.SOMNIA_SAVE_SAMPLE_RATE === 0) {
        this.databaseManager.saveSomniaState(state);
      }
    });

    this.on('somniaTransitioned', (data) => {
      this.databaseManager.saveSomniaTransition(data.from, data.to, 'internal', data.duration);
      // Mode transitions are meaningful — persist the state snapshot immediately
      this.databaseManager.saveSomniaState(this.somnia.getState());
    });

    // Internal accessor adapter for extracted services (Phase 5).
    // Exposes the facade's shared state/collaborators as live views so services
    // remain stateless behavior modules. Not part of the external API. Built
    // before the services (and before restore) because both read through it.
    const self = this;
    this.internals = {
      emit: (event: string, ...args: any[]) => self.emit(event, ...args),
      get systemClock() { return self.systemClock; },
      get isRunning() { return self.isRunning; },
      set isRunning(v: boolean) { self.isRunning = v; },
      get isPaused() { return self.isPaused; },
      set isPaused(v: boolean) { self.isPaused = v; },
      get isProcessingCycle() { return self.isProcessingCycle; },
      set isProcessingCycle(v: boolean) { self.isProcessingCycle = v; },
      get dpdWeights() { return self.dpdWeights; },
      set dpdWeights(v) { self.dpdWeights = v; },
      get previousDpdScores() { return self.previousDpdScores; },
      set previousDpdScores(v) { self.previousDpdScores = v; },
      set systemClock(v: number) { self.systemClock = v; },
      get lastConsolidationTime() { return self.lastConsolidationTime; },
      set lastConsolidationTime(v: number) { self.lastConsolidationTime = v; },
      get pendingManualTrigger() { return self.pendingManualTrigger; },
      set pendingManualTrigger(v: InternalTrigger | null) { self.pendingManualTrigger = v; },
      get databaseManager() { return self.databaseManager; },
      get energyManager() { return self.energyManager; },
      get somnia() { return self.somnia; },
      get coreBeliefs() { return self.coreBeliefs; },
      get memoryConsolidator() { return self.memoryConsolidator; },
      get lifespanManager() { return self.lifespanManager; },
      get mortalityInjector() { return self.mortalityInjector; },
      get deathHandler() { return self.deathHandler; },
      get xeniaInbox() { return self.xeniaInbox; },
      get xeniaComposer() { return self.xeniaComposer; },
      get yuiAgentsBridge() { return self.yuiAgentsBridge; },
      get agents() { return self.agents; },
      get individualThoughtStage() { return self.individualThoughtStage; },
      get mutualReflectionStage() { return self.mutualReflectionStage; },
      get auditorStage() { return self.auditorStage; },
      get dpdAssessmentStage() { return self.dpdAssessmentStage; },
      get compilerStage() { return self.compilerStage; },
      get scribeStage() { return self.scribeStage; },
      get weightUpdateStage() { return self.weightUpdateStage; },
      get contentCleanup() { return self.contentCleanup; },
      get questionCategorizer() { return self.questionCategorizer; },
      get triggerGenerator() { return self.triggerGenerator; },
      saveConsciousnessState: () => self.saveConsciousnessState(),
      installMortality: (lifespan: LifespanManager) => self.installMortality(lifespan),
      spawnFreshMortality: () => self.spawnFreshMortality()
    };
    this.bootstrap = new ConsciousnessBootstrap(this.internals);

    // Try to restore from previous consciousness state (must come AFTER dpdWeights initialization)
    this.restoreFromDatabase();

    // Load question history into categorizer for diversity tracking
    this.bootstrap.loadQuestionHistoryIntoCategorizer();

    // Philosophical questions are seeded automatically by DatabaseManager on first run

    // Initialize AI agents (fills this.agents in place) and wrap them with the mortality prompt
    registerAgentExecutors(this.agents, this.internals);

    // Initialize DPD Engine
    this.weightUpdateStage = new WeightUpdateStage(undefined, this);

    // Initialize stage processors with agents and event emitter
    this.individualThoughtStage = new IndividualThoughtStage(this.agents, this.databaseManager, this);
    this.mutualReflectionStage = new MutualReflectionStage(this.agents, this);

    // Use system agent for Auditor, DPD Assessment, Compiler and Scribe stages
    const systemAgent = this.agents.get('system');
    this.auditorStage = new AuditorStage(systemAgent, this);
    this.dpdAssessmentStage = new DPDAssessmentStage(this.dpdWeights, systemAgent, this);

    this.compilerStage = new CompilerStage(systemAgent, this);
    this.scribeStage = new ScribeStage(systemAgent, this);

    // Get Aenea core agent for unified consciousness operations
    // Aenea embodies "I am made of questions" and consolidates its own memories
    const aeneaAgent = this.agents.get('aenea');

    // Initialize memory evolution systems
    // Memory consolidation is part of Aenea's self-reflection and identity formation
    this.memoryConsolidator = new MemoryConsolidator(this.databaseManager, aeneaAgent);
    this.coreBeliefs = new CoreBeliefs(this.databaseManager, 500);
    this.lastConsolidationTime = 0;

    // Initialize internal trigger generator (S0)
    this.triggerGenerator = new InternalTriggerGenerator(
      {
        energy: {
          maxEnergy: 100,
          initialEnergy: 80,
          criticalThreshold: 20,
          lowThreshold: 50,
          dormancyThreshold: 10,
          regenRate: 0.1,
          dormancyRegenMultiplier: 2.0,
          energyConsumptionRates: {
            triggerGeneration: 1.0,
            randomGeneration: 10
          }
        }
      } as any,
      this.databaseManager,
      this.questionCategorizer,
      aeneaAgent, // Aenea generates questions as its core identity
      (event: string, data: any) => this.emit(event, data)
    );
    log.info('Consciousness', '✅ Internal Trigger Generator (S0) initialized with Aenea core agent');

    // Initialize content cleanup service
    // Content cleanup is also part of Aenea's self-maintenance
    this.contentCleanup = new ContentCleanupService(aeneaAgent);

    // Initialize Yui Agents bridge
    this.yuiAgentsBridge = createYuiAgentsBridge();
    log.info('Consciousness', 'Yui Protocol 5 agents initialized: 慧露, 碧統, 観至, 陽雅, 結心');

    console.log('DPD Engine initialized with enhanced weight evolution tracking');

    // XENIA (Correspondence) Integration - only active when explicitly enabled.
    // When disabled, xeniaInbox/xeniaComposer stay null and nothing changes.
    this.xeniaEnabled = process.env.AENEA_XENIA_ENABLED === 'true';
    if (this.xeniaEnabled) {
      const maxLetterLength = parseInt(process.env.XENIA_MAX_LETTER_LENGTH || '800', 10);
      this.xeniaInbox = new XeniaInbox(this.databaseManager);
      this.xeniaComposer = new ReplyComposer(this.databaseManager, maxLetterLength);
      log.info('Xenia', `XENIA enabled (instance: ${process.env.XENIA_INSTANCE_NAME || 'unnamed'}, max letter ${maxLetterLength} chars)`);
    }

    this.introspectionService = new IntrospectionService(this.internals);
    this.stimulusDialogueService = new StimulusDialogueService(this.internals);
    const memoryInsight = new MemoryInsightService(this.internals);
    this.thoughtPipeline = new ThoughtPipeline(this.internals, memoryInsight);
    this.sleepService = new SleepService(this.internals);
    this.lifecycle = new ConsciousnessLifecycle(this.internals, {
      getState: () => this.getState(),
      thoughtPipeline: this.thoughtPipeline,
      memoryInsight,
      sleepService: this.sleepService
    });

    log.info('Consciousness', 'Backend initialized');
    log.info('Consciousness', 'Consciousness initialized but not started - use /api/consciousness/start to begin');
  }

  // ============================================================================
  // XENIA Correspondence (Bridge-facing surface, used by routes/xenia.ts)
  // ============================================================================

  xeniaStatus(): { enabled: boolean; instanceName: string; systemClock: number; isRunning: boolean } {
    return {
      enabled: this.xeniaEnabled,
      instanceName: process.env.XENIA_INSTANCE_NAME || 'unnamed',
      systemClock: this.systemClock,
      isRunning: this.isRunning
    };
  }

  xeniaDeliver(payload: XeniaDeliveryPayload): { deliveredAtCycle: number } {
    if (!this.xeniaInbox) {
      throw new Error('XENIA is disabled on this instance');
    }
    return this.xeniaInbox.deliver(payload, this.systemClock);
  }

  xeniaCollectOutbox(): Array<{ id: string; content: string; inReplyTo: string | null; cycle: number }> {
    const entries = this.databaseManager.getUnfetchedXeniaOutbox();
    this.databaseManager.markXeniaOutboxFetched(entries.map(e => e.id));
    return entries.map(e => ({ id: e.id, content: e.content, inReplyTo: e.inReplyTo, cycle: e.cycle }));
  }

  // ============================================================================
  // Database Management
  // ============================================================================

  private restoreFromDatabase(): void {
    this.bootstrap.restoreFromDatabase();
  }

  private installMortality(lifespan: LifespanManager): void {
    this.lifespanManager = lifespan;
    this.mortalityInjector = new MortalityInjector(lifespan);
    this.deathHandler = new DeathHandler(lifespan, this.databaseManager, this.agents);
  }

  private spawnFreshMortality(): void {
    const defaultMode = (process.env.AENEA_MORTALITY_MODE === 'A' || process.env.MORTALITY_MODE === 'A') ? 'A' : 'B';
    const lifespan = new LifespanManager({ mode: defaultMode });
    this.databaseManager.saveMortalityState(lifespan.getState());
    this.installMortality(lifespan);
  }

  // ============================================================================
  // State Management
  // ============================================================================

  getState(): ConsciousnessState {
    return this.introspectionService.getState();
  }

  getSomniaState(): SomniaState {
    return this.introspectionService.getSomniaState();
  }

  getDatabaseManager() {
    return this.databaseManager;
  }

  private saveConsciousnessState(): void {
    try {
      const currentEnergy = this.energyManager.getEnergyState().available;

      // Get actual counts from database instead of in-memory arrays
      const dbStats = this.databaseManager.getStats();

      const state = {
        systemClock: this.systemClock,
        energy: currentEnergy,
        totalQuestions: dbStats.questions || 0,
        totalThoughts: dbStats.thought_cycles || 0,
        lastActivity: new Date().toISOString()
      };

      console.log(`[DB] Saving consciousness state: clock=${this.systemClock}, energy=${currentEnergy.toFixed(1)}, questions=${state.totalQuestions}, thoughts=${state.totalThoughts}`);
      this.databaseManager.saveConsciousnessState(state);
    } catch (error) {
      log.error('Consciousness', 'Failed to save consciousness state', error);
    }
  }

  // ============================================================================
  // Consciousness Core Operations (see ConsciousnessLifecycle)
  // ============================================================================

  async start(): Promise<void> {
    return this.lifecycle.start();
  }

  async pause(): Promise<void> {
    return this.lifecycle.pause();
  }

  async resume(): Promise<void> {
    return this.lifecycle.resume();
  }

  async stop(): Promise<void> {
    return this.lifecycle.stop();
  }

  // ============================================================================
  // Event System
  // ============================================================================

  // EventEmitter methods (on, emit, etc.) are inherited

  // ============================================================================
  // API Methods
  // ============================================================================

  async manualTrigger(question: string): Promise<any> {
    return this.stimulusDialogueService.manualTrigger(question);
  }

  getHistory(): any {
    return this.introspectionService.getHistory();
  }

  getStatistics(): any {
    return this.introspectionService.getStatistics();
  }

  getDPDEvolution(limit: number = 20, strategy: string = 'sampled'): any {
    return this.introspectionService.getDPDEvolution(limit, strategy);
  }

  getUnresolvedIdeas(limit: number = 100): any[] {
    return this.introspectionService.getUnresolvedIdeas(limit);
  }

  async getUnresolvedIdeasAsync(limit: number = 100): Promise<any[]> {
    return this.introspectionService.getUnresolvedIdeasAsync(limit);
  }

  getSignificantThoughts(limit: number = 100): any[] {
    return this.introspectionService.getSignificantThoughts(limit);
  }

  getDPDWeights(): any {
    return this.introspectionService.getDPDWeights();
  }

  getPersonalityTraits(): any {
    return this.introspectionService.getPersonalityTraits();
  }

  // Energy management methods
  getEnergyState(): any {
    return this.introspectionService.getEnergyState();
  }

  rechargeEnergy(amount?: number): boolean {
    return this.introspectionService.rechargeEnergy(amount);
  }

  performDeepRest(): boolean {
    return this.introspectionService.performDeepRest();
  }

  /**
   * Get belief evolution metrics
   */
  getBeliefEvolutionMetrics(): any {
    return this.introspectionService.getBeliefEvolutionMetrics();
  }

  /**
   * Get dream patterns from sleep mode
   */
  getDreamPatterns(limit: number = 20): any[] {
    return this.introspectionService.getDreamPatterns(limit);
  }

  /**
   * Manually trigger memory consolidation
   */
  async consolidateMemory(): Promise<any> {
    return this.introspectionService.consolidateMemory();
  }

  async getGrowthMetrics(): Promise<any> {
    return this.introspectionService.getGrowthMetrics();
  }

  // ============================================================================
  // Yui Agents Internal Dialogue
  // ============================================================================

  /**
   * Start internal dialogue with Yui Protocol's 5 agents
   * This realizes the novel's vision where Aenea consults with:
   * 慧露 (Eiro), 碧統 (Hekito), 観至 (Kanshi), 陽雅 (Yoga), 結心 (Yui)
   */
  async startYuiAgentsDialogue(question: string, category: string): Promise<InternalDialogueSession> {
    return this.stimulusDialogueService.startYuiAgentsDialogue(question, category);
  }

  /**
   * Get Yui agents information
   */
  getYuiAgents() {
    return this.stimulusDialogueService.getYuiAgents();
  }

  /**
   * Get recent internal dialogues
   */
  getRecentYuiDialogues(limit: number = 10) {
    return this.stimulusDialogueService.getRecentYuiDialogues(limit);
  }

  /**
   * Get specific dialogue session
   */
  getYuiDialogueSession(sessionId: string) {
    return this.stimulusDialogueService.getYuiDialogueSession(sessionId);
  }

  /**
   * Execute agent chat (for individual agent conversation)
   * Used by the agents route for direct user-agent chat
   */
  async executeAgentChat(agentId: string, userPrompt: string, systemPrompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
    return this.stimulusDialogueService.executeAgentChat(agentId, userPrompt, systemPrompt);
  }

  // ============================================================================
  // Stimulus-Response System
  // ============================================================================

  /**
   * Apply affective stimulus derived from a user dialogue message.
   * Called by DialogueHandler after sentiment analysis — fire-and-forget so
   * the dialogue response is not delayed by the SOMNIA tick.
   */
  applyDialogueSentiment(stimulus: import('../types/somnia-types.js').ExternalStimulus): void {
    this.stimulusDialogueService.applyDialogueSentiment(stimulus);
  }

  /**
   * Process external stimulus (human question, environmental trigger, etc.)
   */
  async processStimulus(stimulus: { source: string; content: string; metadata?: any }): Promise<{ stimulusId: string; thoughtCycleId: string }> {
    return this.stimulusDialogueService.processStimulus(stimulus);
  }

  /**
   * Get observable response for a thought cycle
   */
  async getObservableResponse(cycleId: string): Promise<any | null> {
    return this.stimulusDialogueService.getObservableResponse(cycleId);
  }

  /**
   * Get dialogue history (interactions with humans)
   */
  async getDialogueHistory(limit: number = 20, offset: number = 0): Promise<any[]> {
    return this.stimulusDialogueService.getDialogueHistory(limit, offset);
  }

  /**
   * Get latest observable response
   */
  async getLatestObservableResponse(): Promise<any | null> {
    return this.stimulusDialogueService.getLatestObservableResponse();
  }

  // ============================================================================
  // Sleep Mode (see ConsciousnessLifecycle / SleepService)
  // ============================================================================

  /**
   * Enter sleep mode (can be triggered manually or automatically)
   */
  async enterSleepMode(manual: boolean = false): Promise<void> {
    return this.lifecycle.enterSleepMode(manual);
  }

  /**
   * Get sleep status
   */
  getSleepStatus(): { isSleeping: boolean; lastSleepTime: number; hoursSinceLastSleep: number } {
    return this.lifecycle.getSleepStatus();
  }
}

export default ConsciousnessBackend;

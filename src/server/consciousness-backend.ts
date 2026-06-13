/**
 * Aenea Consciousness Backend (TypeScript) - No Session Architecture
 */

import { EventEmitter } from 'events';
import { log } from '../platform/logger.js';
import { DatabaseManager } from './database-manager.js';
import { createAIExecutor, AIExecutor } from './ai-executor.js';
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
import { theoriaConfig } from '../aenea/agents/theoria.js';
import { pathiaConfig } from '../aenea/agents/pathia.js';
import { kinesisConfig } from '../aenea/agents/kinesis.js';
import { systemConfig } from '../aenea/agents/system.js';
import { aeneaConfig } from '../aenea/agents/aenea.js';
import { somniaAgentConfig } from '../aenea/agents/somnia.js';
import { YuiAgentsBridge, createYuiAgentsBridge, InternalDialogueSession } from '../integration/yui-agents-bridge.js';
import { ContentCleanupService } from './content-cleanup-service.js';
import { QuestionCategorizer, createQuestionCategorizer } from '../utils/question-categorizer.js';
import { InternalTriggerGenerator } from '../aenea/core/internal-trigger.js';
import { parseJsonArray } from '../utils/json-parser.js';
import { SomniaConsciousness } from '../aenea/somnia/consciousness.js';
import { reflectiveReturn } from '../aenea/integration/saip.js';
import { synchronizeEnergy } from '../aenea/integration/energy-sync.js';
import { SomniaState } from '../types/somnia-types.js';
import { LifespanManager } from '../aenea/mortality/lifespan-manager.js';
import { AgingEngine } from '../aenea/mortality/aging-engine.js';
import { MortalityInjector } from '../aenea/mortality/mortality-injector.js';
import { DeathHandler } from '../aenea/mortality/death-handler.js';
import { IntrospectionService } from './services/introspection-service.js';
import { StimulusDialogueService } from './services/stimulus-dialogue-service.js';
import { ThoughtPipeline } from './services/thought-pipeline.js';
import type { ConsciousnessInternals, ConsciousnessState, ThoughtCycle } from './services/consciousness-internals.js';

export type { ConsciousnessState } from './services/consciousness-internals.js';

// ThoughtCycle is defined in ./services/consciousness-internals.ts and
// imported above to avoid a facade<->service import cycle.

class ConsciousnessBackend extends EventEmitter {
  private systemClock: number;
  private questionHistory: any[];
  private thoughtHistory: any[];
  private consciousness: any;
  private isRunning: boolean;
  private isPaused: boolean;
  private isDormant: boolean;
  private isSleeping: boolean;
  private isProcessingCycle: boolean; // True during thought cycle execution
  private lastSleepTime: number;
  private criticalModeDuration: number;
  private agents: Map<string, AIExecutor>;
  private databaseManager: DatabaseManager;
  private energyManager: EnergyManager;
  private lastSaveTime: number;
  private consecutiveFailureCount: number = 0;
  private static readonly MAX_CONSECUTIVE_FAILURES = 3;
  private static readonly MIN_CYCLE_DURATION_MS = 30000; // Minimum 30 seconds per cycle

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

  // Extracted services (Phase 5) + internal accessor adapter
  private internals!: ConsciousnessInternals;
  private introspectionService!: IntrospectionService;
  private stimulusDialogueService!: StimulusDialogueService;
  private thoughtPipeline!: ThoughtPipeline;

  constructor() {
    super(); // Call EventEmitter constructor

    // Initialize properties after super() call
    this.systemClock = 0;
    this.questionHistory = [];
    this.thoughtHistory = [];
    this.consciousness = null;
    this.isRunning = false;
    this.isPaused = false;
    this.isDormant = false;
    this.isSleeping = false;
    this.isProcessingCycle = false;
    this.lastSleepTime = 0;
    this.criticalModeDuration = 0;
    this.agents = new Map<string, AIExecutor>();
    this.lastSaveTime = 0;
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

    // Try to restore from previous consciousness state (must come AFTER dpdWeights initialization)
    this.restoreFromDatabase();

    // Load question history into categorizer for diversity tracking
    this.loadQuestionHistoryIntoCategorizer();

    // Philosophical questions are seeded automatically by DatabaseManager on first run

    // Initialize AI agents with individual configurations (including generation params)
    log.info('Consciousness', `Initializing AI agents with individual configurations`);

    this.agents.set('theoria', createAIExecutor('theoria', {
      provider: theoriaConfig.modelConfig.provider as any,
      model: theoriaConfig.modelConfig.model,
      ...theoriaConfig.generationParams
    }));

    this.agents.set('pathia', createAIExecutor('pathia', {
      provider: pathiaConfig.modelConfig.provider as any,
      model: pathiaConfig.modelConfig.model,
      ...pathiaConfig.generationParams
    }));

    this.agents.set('kinesis', createAIExecutor('kinesis', {
      provider: kinesisConfig.modelConfig.provider as any,
      model: kinesisConfig.modelConfig.model,
      ...kinesisConfig.generationParams
    }));

    // System agent for internal processing (Compiler & Scribe)
    this.agents.set('system', createAIExecutor('system', {
      provider: systemConfig.modelConfig.provider as any,
      model: systemConfig.modelConfig.model,
      ...systemConfig.generationParams
    }));

    // Aenea core agent for unified consciousness (dialogue + question generation)
    this.agents.set('aenea', createAIExecutor('aenea', {
      provider: aeneaConfig.provider as any,
      model: aeneaConfig.model,
      ...aeneaConfig.generationParams
    }));

    // Somnia Interoceptive Cortex agent (Slow Track for body feelings)
    this.agents.set('somnia', createAIExecutor('somnia', {
      provider: somniaAgentConfig.modelConfig.provider as any,
      model: somniaAgentConfig.modelConfig.model,
      ...somniaAgentConfig.generationParams
    }));

    log.info('Consciousness', `✅ Agents initialized with individual personalities:`);
    log.info('Consciousness', `  - ${theoriaConfig.displayName} (${theoriaConfig.furigana}): ${theoriaConfig.modelConfig.provider}/${theoriaConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${theoriaConfig.generationParams.temperature}, Style: ${theoriaConfig.style}`);
    log.info('Consciousness', `  - ${pathiaConfig.displayName} (${pathiaConfig.furigana}): ${pathiaConfig.modelConfig.provider}/${pathiaConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${pathiaConfig.generationParams.temperature}, Style: ${pathiaConfig.style}`);
    log.info('Consciousness', `  - ${kinesisConfig.displayName} (${kinesisConfig.furigana}): ${kinesisConfig.modelConfig.provider}/${kinesisConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${kinesisConfig.generationParams.temperature}, Style: ${kinesisConfig.style}`);
    log.info('Consciousness', `  - ${systemConfig.displayName} (${systemConfig.furigana}): ${systemConfig.modelConfig.provider}/${systemConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${systemConfig.generationParams.temperature}, Style: ${systemConfig.style}`);
    log.info('Consciousness', `  - ${somniaAgentConfig.displayName} (${somniaAgentConfig.furigana}): ${somniaAgentConfig.modelConfig.provider}/${somniaAgentConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${somniaAgentConfig.generationParams.temperature}, Role: Interoceptive Cortex (Slow Track)`);
    log.info('Consciousness', `  - ${aeneaConfig.displayName}: ${aeneaConfig.provider}/${aeneaConfig.model}`);
    log.info('Consciousness', `    Temperature: ${aeneaConfig.generationParams.temperature}, Role: Unified consciousness (dialogue + questions)`);

    // Wrap execute method of each agent to inject mortality prompt
    for (const [agentId, agent] of this.agents.entries()) {
      const originalExecute = agent.execute.bind(agent);
      agent.execute = async (prompt: string, systemPrompt?: string) => {
        let injectedSystemPrompt = systemPrompt || '';
        const isCoreAgent = ['theoria', 'pathia', 'kinesis', 'aenea', 'system'].includes(agentId);
        
        if (this.lifespanManager && isCoreAgent && (this.isProcessingCycle || agentId === 'aenea')) {
          injectedSystemPrompt = this.mortalityInjector.injectIntoPrompt(injectedSystemPrompt);
        }
        return originalExecute(prompt, injectedSystemPrompt);
      };
    }

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

    this.consciousness = {
      systemClock: this.systemClock,
      energy: this.energyManager.getEnergyState().available,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      totalQuestions: this.questionHistory.length,
      totalThoughts: this.thoughtHistory.length,
      lastActivity: new Date().toISOString()
    };

    // Internal accessor adapter for extracted services (Phase 5).
    // Exposes the facade's shared state/collaborators as live views so services
    // remain stateless behavior modules. Not part of the external API.
    const self = this;
    this.internals = {
      emit: (event: string, ...args: any[]) => self.emit(event, ...args),
      get systemClock() { return self.systemClock; },
      get isRunning() { return self.isRunning; },
      get isPaused() { return self.isPaused; },
      get isProcessingCycle() { return self.isProcessingCycle; },
      get dpdWeights() { return self.dpdWeights; },
      set dpdWeights(v) { self.dpdWeights = v; },
      get previousDpdScores() { return self.previousDpdScores; },
      set previousDpdScores(v) { self.previousDpdScores = v; },
      get systemClockMutable() { return self.systemClock; },
      set systemClockMutable(v: number) { self.systemClock = v; },
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
      saveConsciousnessState: () => self.saveConsciousnessState()
    };
    this.introspectionService = new IntrospectionService(this.internals);
    this.stimulusDialogueService = new StimulusDialogueService(this.internals);
    this.thoughtPipeline = new ThoughtPipeline(this.internals);

    log.info('Consciousness', 'Backend initialized');
    log.info('Consciousness', 'Consciousness initialized but not started - use /api/consciousness/start to begin');
  }

  // ============================================================================
  // Database Management
  // ============================================================================

  private restoreFromDatabase(): void {
    try {
      console.log('[DEBUG] restoreFromDatabase called');

      // Initialize/load LifespanManager first
      try {
        const mortalityRecord = this.databaseManager.getLatestMortalityState();
        if (mortalityRecord && !mortalityRecord.died_at) {
          this.lifespanManager = new LifespanManager({
            instanceId: mortalityRecord.instance_id,
            lifespanMax: mortalityRecord.lifespan_max,
            currentCycle: mortalityRecord.current_cycle,
            mode: mortalityRecord.mode as 'A' | 'B',
            createdAt: mortalityRecord.created_at,
            diedAt: mortalityRecord.died_at
          });
          log.info('Mortality', `Restored mortality state for instance: ${mortalityRecord.instance_id} (${mortalityRecord.current_cycle}/${mortalityRecord.lifespan_max})`);
        } else {
          const defaultMode = (process.env.AENEA_MORTALITY_MODE === 'A' || process.env.MORTALITY_MODE === 'A') ? 'A' : 'B';
          this.lifespanManager = new LifespanManager({ mode: defaultMode });
          this.databaseManager.saveMortalityState(this.lifespanManager.getState());
          log.info('Mortality', `Created new mortality instance: ${this.lifespanManager.getInstanceId()} with mode ${defaultMode}`);
        }
      } catch (mortError) {
        log.error('Mortality', 'Failed to restore or initialize mortality, using default instance', mortError);
        this.lifespanManager = new LifespanManager();
      }
      this.mortalityInjector = new MortalityInjector(this.lifespanManager);
      this.deathHandler = new DeathHandler(this.lifespanManager, this.databaseManager, this.agents);

      const consciousnessState = this.databaseManager.getConsciousnessState();
      console.log('[DEBUG] consciousnessState:', consciousnessState);

      if (consciousnessState) {
        this.systemClock = consciousnessState.systemClock || 0;

        // Restore energy state from database
        if (consciousnessState.energy !== undefined) {
          this.energyManager.restoreEnergyState(consciousnessState.energy);
        }

        // Initialize empty histories (data is now in database directly)
        this.questionHistory = [];
        this.thoughtHistory = [];

        // Inherit consciousness from previous state
        this.inheritConsciousnessFromDatabase();

        // Restore SOMNIA affective state
        const somniaRecord = this.databaseManager.getLatestSomniaState();
        if (somniaRecord) {
          this.somnia.setState({
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
          systemClock: this.systemClock,
          energy: this.energyManager.getEnergyState().available,
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

  private loadQuestionHistoryIntoCategorizer(): void {
    try {
      // Load recent questions from database (last 100) to populate categorizer history
      // ordered by timestamp DESC via the ThoughtRepository facade method.
      if (!this.databaseManager.isConnected()) {
        log.warn('Consciousness', 'Database not ready for loading question history');
        return;
      }

      const recentQuestions = this.databaseManager.getRecentQuestionRows(100);

      if (recentQuestions && recentQuestions.length > 0) {
        log.info('Consciousness', `📚 Loading ${recentQuestions.length} questions into categorizer for diversity tracking...`);

        for (const q of recentQuestions) {
          // Categorize and record each question
          const result = this.questionCategorizer.categorizeQuestion(q.question);
          this.questionCategorizer.recordQuestion(
            q.question,
            q.category || result.category,
            result.metrics,
            result.semanticAnalysis,
            true, // assume success
            q.importance || 0.5
          );
        }

        // Log category balance after loading
        const balance = this.questionCategorizer.getCategoryBalance();
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
      const latestWeights = this.databaseManager.getLatestDPDWeights();
      console.log('[DEBUG] latestWeights:', latestWeights);

      if (latestWeights) {
        this.dpdWeights = {
          empathy: latestWeights.empathy,
          coherence: latestWeights.coherence,
          dissonance: latestWeights.dissonance,
          timestamp: latestWeights.timestamp,
          version: latestWeights.version
        };
        log.info('Consciousness', `🧠 Loaded DPD weights from database: version=${latestWeights.version}, empathy=${latestWeights.empathy.toFixed(3)}, coherence=${latestWeights.coherence.toFixed(3)}, dissonance=${latestWeights.dissonance.toFixed(3)}`);
        console.log('[DEBUG] DPD weights set to:', this.dpdWeights);
      } else {
        console.log('[DEBUG] No weights found in database, using defaults');
        // 2. Initialize default DPD weights if none exist in database
        this.dpdWeights = {
          empathy: 0.33,
          coherence: 0.33,
          dissonance: 0.34,
          timestamp: Date.now(),
          version: 1
        };
        log.info('Consciousness', '🧠 No DPD weights in database - initialized default weights');

        // Save initial weights to database
        this.databaseManager.saveDPDWeights(this.dpdWeights);
      }

      // 3. Record personality evolution snapshot
      this.recordPersonalitySnapshot();

    } catch (error) {
      log.error('Consciousness', 'Failed to inherit consciousness from database', error);
    }
  }

  private initializeFreshConsciousness(): void {
    if (!this.lifespanManager) {
      const defaultMode = (process.env.AENEA_MORTALITY_MODE === 'A' || process.env.MORTALITY_MODE === 'A') ? 'A' : 'B';
      this.lifespanManager = new LifespanManager({ mode: defaultMode });
      this.databaseManager.saveMortalityState(this.lifespanManager.getState());
      this.mortalityInjector = new MortalityInjector(this.lifespanManager);
      this.deathHandler = new DeathHandler(this.lifespanManager, this.databaseManager, this.agents);
    }

    this.systemClock = 0;
    this.dpdWeights = {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      timestamp: Date.now(),
      version: 1
    };
    this.questionHistory = [];
    this.thoughtHistory = [];
    this.energyManager.resetEnergy();

    // Save initial consciousness state
    this.saveConsciousnessState();

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
    const energyLevel = this.energyManager.getEnergyState().available;

    return {
      curiosityLevel: Math.min(1.0, (this.systemClock * 0.01) + 0.5),
      empathyTendency: this.dpdWeights.empathy,
      systematicThinking: this.dpdWeights.coherence,
      contradictionAcceptance: this.dpdWeights.dissonance,
      energyManagement: energyLevel / 100.0,
      introspectionDepth: 0.8, // Base level
      creativityIndex: 0.7 // Base level
    };
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
  // Consciousness Core Operations
  // ============================================================================

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Consciousness is already running');
    }

    // Ensure database connection is open
    this.databaseManager.ensureConnection();

    // If the previous instance died, initialize a fresh one
    if (this.lifespanManager && !this.lifespanManager.isAlive()) {
      const defaultMode = (process.env.AENEA_MORTALITY_MODE === 'A' || process.env.MORTALITY_MODE === 'A') ? 'A' : 'B';
      this.lifespanManager = new LifespanManager({ mode: defaultMode });
      this.databaseManager.saveMortalityState(this.lifespanManager.getState());
      
      this.mortalityInjector = new MortalityInjector(this.lifespanManager);
      this.deathHandler = new DeathHandler(this.lifespanManager, this.databaseManager, this.agents);
      log.info('Mortality', `Spawned fresh instance for new run: ${this.lifespanManager.getInstanceId()}`);
    }

    this.isRunning = true;
    this.isPaused = false;

    this.emit('consciousnessStarted', this.getState());
    log.info('Consciousness', 'Started');

    // Start the main consciousness loop with error handling
    this.consciousnessLoop().catch((error) => {
      log.error('Consciousness', 'Fatal error in consciousness loop', error);
      this.emit('consciousnessError', { error: (error as Error).message });
      this.isRunning = false;
    });
  }

  async pause(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Consciousness is not running');
    }

    this.isPaused = true;
    this.saveConsciousnessState(); // Save state when paused
    this.emit('consciousnessPaused', this.getState());
    log.info('Consciousness', 'Paused');
  }

  async resume(): Promise<void> {
    if (!this.isRunning || !this.isPaused) {
      throw new Error('Consciousness is not paused');
    }

    this.isPaused = false;
    this.emit('consciousnessResumed', this.getState());
    log.info('Consciousness', 'Resumed');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Consciousness is not running');
    }

    this.isRunning = false;
    this.isPaused = false;
    this.isDormant = false;
    this.saveConsciousnessState(); // Save final state

    // Cleanup database connection to prevent memory leaks
    try {
      this.databaseManager.cleanup();
      log.info('Consciousness', 'Database connection closed');
    } catch (error) {
      log.error('Consciousness', 'Failed to cleanup database connection', error);
    }

    this.emit('consciousnessStopped', this.getState());
    log.info('Consciousness', 'Stopped');
  }

  // ============================================================================
  // Thought Cycle Processing
  // ============================================================================

  private async consciousnessLoop(): Promise<void> {
    console.log('🔄 Starting autonomous consciousness loop');

    while (this.isRunning) {
      if (this.isPaused) {
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
        if (this.consecutiveFailureCount >= ConsciousnessBackend.MAX_CONSECUTIVE_FAILURES) {
          log.error('CircuitBreaker', `🛑 AI server connection consistently failing (${this.consecutiveFailureCount} times). Entering protective dormancy.`);
          this.isDormant = true;
          this.emit('consciousnessDormant', {
            reason: 'ai_connection_failure',
            timestamp: Date.now()
          });
        }

        await this.sleep(10000); // Wait longer on error
      }

      // Safeguard: Ensure a minimum cycle duration to prevent rapid empty cycles
      const elapsedTime = Date.now() - cycleStartTime;
      if (elapsedTime < ConsciousnessBackend.MIN_CYCLE_DURATION_MS) {
        const remainingSleep = ConsciousnessBackend.MIN_CYCLE_DURATION_MS - elapsedTime;
        log.debug('Consciousness', `Cycle completed quickly (${elapsedTime}ms), sleeping for remaining ${remainingSleep}ms`);
        await this.sleep(remainingSleep);
      } else {
        await this.sleep(5000); // Standard wait between cycles
      }
    }
  }

  private async processThoughtCycle(): Promise<void> {
    // Check if dead
    if (this.lifespanManager && !this.lifespanManager.isAlive()) {
      log.warn('Consciousness', 'Aenea is deceased. Aborting thought cycle.');
      await this.deathHandler.handleDeath(async () => {
        await this.stop();
      });
      return;
    }

    // Mark cycle as processing
    this.isProcessingCycle = true;

    // Emit event for UI to update button states
    this.emit('cycleProcessingChanged', { isProcessingCycle: true });

    try {
      // Calculate minimum energy required for a thought cycle
      // Critical mode minimum: S0(1.0) + S1(1.0) + S5(0.8) + S6(0.3) + U(0.2) = 3.3
      // Plus minEnergy reserve (5.0) = 8.3 total needed
      const energyState = this.energyManager.getEnergyState();
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
          this.emit('consciousnessDormant', {
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
        this.emit('consciousnessAwakened', {
          currentEnergy: energyState.available,
          timestamp: Date.now()
        });
      }

      log.info('EnergyWait', `Energy sufficient for thought cycle (${energyState.available.toFixed(1)}/${minimumEnergyRequired}), proceeding...`);

      // Generate internal trigger
      const trigger = await this.thoughtPipeline.generateInternalTrigger();
      if (!trigger) {
        return;
      }

      // Tick lifespan manager
      this.lifespanManager.tick();
      const phase = this.lifespanManager.getCurrentPhase();
      const vitality = this.lifespanManager.getVitality();
      log.info('Mortality', `Cycle ticked: ${this.lifespanManager.getCurrentCycle()}/${this.lifespanManager.getLifespanMax()} | Vitality: ${(vitality * 100).toFixed(1)}% | Phase: ${phase}`);

      // Map InternalTrigger to ExternalStimulus
      // Derive valence from emotional context if available, otherwise from category character
      const categoryValence: Record<string, number> = {
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
      const derivedValence = trigger.context?.emotionalState?.valence
        ?? categoryValence[trigger.category] ?? 0.0;
      const stimulus: import('../types/somnia-types.js').ExternalStimulus = {
        type: 'internal',
        valence: derivedValence,
        arousal: trigger.category === 'philosophical' ? 0.8 : 0.5,
        significance: trigger.importance || 0.5,
        context: trigger.question
      };

      // SOMNIA: Advance affective state
      let somniaState = await this.somnia.tick(stimulus);

      // Apply aging somatic decay directly to SOMNIA state
      somniaState = AgingEngine.applyAgingToSomnia(somniaState, vitality);
      this.somnia.setState(somniaState);

      // Energy synchronization between Somnia and Aenea
      const energySyncState = synchronizeEnergy(
        energyState.available,
        energyState.capacity,
        somniaState.somatic.phi
      );

      // Apply energy sync: adjust available energy based on SOMNIA φ influence
      if (energySyncState.aeneaEnergy < energyState.available) {
        const reduction = energyState.available - energySyncState.aeneaEnergy;
        await this.energyManager.consumeEnergy(reduction, 'somnia_phi_sync');
        log.info('EnergySync', `φ-based energy adjustment: -${reduction.toFixed(1)} (mode: ${energySyncState.energyMode})`);
      }

      // Slow Track: Generate Qualia every 3 cycles
      if (this.systemClock % 3 === 0) {
        // Run asynchronously so it doesn't block the thought cycle completely,
        // or await it if we want the current thought cycle to use it immediately.
        // For interoceptive feelings, blocking briefly is okay to provide context.
        await this.thoughtPipeline.generateSOMNIAQualia();
      }

      // Insert progressive timing slowdown for aging
      const delayMs = AgingEngine.getProcessingDelay(phase, vitality);
      if (delayMs > 0) {
        log.info('Mortality', `Inserting progressive processing delay of ${delayMs}ms due to aging...`);
        await this.sleep(delayMs);
      }

      // Execute thought cycle
      await this.thoughtPipeline.executeAdaptiveThoughtCycle(trigger);

      // Persist the updated mortality state
      this.databaseManager.updateMortalityState(this.lifespanManager.getInstanceId(), {
        currentCycle: this.lifespanManager.getCurrentCycle(),
        vitality,
        phase
      });

      // Check for death sequence
      if (!this.lifespanManager.isAlive()) {
        log.warn('Consciousness', 'Instance reached its lifespan limit. Executing death sequence...');
        await this.deathHandler.handleDeath(async () => {
          await this.stop();
        });
        return;
      }

      // SAIP: Reflective Return — feed DPD scores (not weights) back to SOMNIA
      if (this.previousDpdScores) {
        try {
          const bias = reflectiveReturn(this.previousDpdScores);
          this.somnia.applyAffectiveBias(bias);
          log.info('SAIP', `Reflective Return applied: pleasureBias=${bias.pleasureBias.toFixed(3)}, coherenceBias=${bias.coherenceBias.toFixed(3)}, dissonanceTrigger=${bias.dissonanceTrigger}`);

          this.databaseManager.saveSomniaSaipEvent({
            eventType: 'reflective_return',
            somniaState: this.somnia.getState(),
            aeneaDpd: this.previousDpdScores ? {
              empathy: this.previousDpdScores.empathy,
              coherence: this.previousDpdScores.coherence,
              dissonance: this.previousDpdScores.dissonance,
              weightedTotal: this.previousDpdScores.weightedTotal,
              timestamp: this.previousDpdScores.timestamp
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
      this.isProcessingCycle = false;

      // Emit event for UI to re-enable buttons
      this.emit('cycleProcessingChanged', { isProcessingCycle: false });
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  // EventEmitter methods (on, emit, etc.) are inherited

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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
  // Sleep Mode: Consciousness Consolidation During Rest
  // ============================================================================

  /**
   * Check if consciousness should enter sleep mode
   */
  private shouldEnterSleep(): boolean {
    const energy = this.energyManager.getEnergyState().available;
    const somniaPhi = this.somnia.getState().somatic.phi;
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
    this.databaseManager.ensureConnection();

    if (this.isSleeping) {
      log.warn('Consciousness', '💤 Already in sleep mode');
      return;
    }

    const energyBefore = this.energyManager.getEnergyState().available;
    const phiBefore = this.somnia.getState().somatic.phi;
    const startTime = Date.now();

    const reason = manual ? 'manual' :
                   energyBefore <= 20 ? 'energy_critical' :
                   phiBefore <= 20 ? 'phi_critical' :
                   'scheduled';

    // Auto-stop consciousness if running and entering sleep due to energy crisis
    if (this.isRunning) {
      if (!manual && (energyBefore <= 20 || phiBefore <= 20)) {
        log.info('Consciousness', `⏸️ Auto-stopping consciousness for critical sleep (mental: ${energyBefore.toFixed(1)}, physical/φ: ${phiBefore.toFixed(1)})`);
        this.stop();
      } else if (!manual) {
        log.warn('Consciousness', '⚠️ Cannot enter automatic sleep while consciousness is running');
        return;
      }
    }

    log.info('Consciousness', `💤 Entering sleep mode (reason: ${reason})`);

    this.emit('sleepStarted', {
      reason,
      timestamp: startTime,
      systemClock: this.systemClock,
      energyBefore
    });

    this.isSleeping = true;

    try {
      // Perform sleep consolidation
      await this.performSleepConsolidation(reason);

      // Mental energy recovery during sleep
      this.energyManager.deepRest();

      // Physical energy recovery: SOMNIA enters Dream and fully recovers φ
      this.somnia.forceDream();
      log.info('SOMNIA', `🌙 SOMNIA entered Dream mode for unified sleep (φ: ${phiBefore.toFixed(1)} → 100)`);

      const duration = Date.now() - startTime;
      const energyAfter = this.energyManager.getEnergyState().available;
      const phiAfter = this.somnia.getState().somatic.phi;

      this.lastSleepTime = Date.now();
      this.criticalModeDuration = 0;

      // Wake SOMNIA back up after sleep
      this.somnia.wakeUp();

      // Save energy recovery to database
      this.saveConsciousnessState();

      log.info('Consciousness', `✨ Sleep completed (duration: ${(duration/1000).toFixed(1)}s, mental: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}, physical/φ: ${phiBefore.toFixed(1)} → ${phiAfter.toFixed(1)})`);

      this.emit('sleepCompleted', {
        duration,
        energyBefore,
        energyAfter,
        phiBefore,
        phiAfter,
        timestamp: Date.now()
      });

      // Auto-restart consciousness after automatic sleep (but not manual sleep)
      if (!manual) {
        log.info('Consciousness', `▶️ Auto-restarting consciousness after automatic sleep (current isRunning: ${this.isRunning})`);
        if (!this.isRunning) {
          this.isRunning = true;
          this.isPaused = false;
        } else {
          log.warn('Consciousness', '⚠️ Consciousness is already running after sleep, skipping auto-restart');
        }
      }

    } catch (error) {
      log.error('Consciousness', 'Sleep mode error', error);
      this.emit('sleepError', { error: (error as Error).message });
    } finally {
      this.isSleeping = false;
    }
  }

  /**
   * Sleep consolidation: 4-phase memory processing
   */
  private async performSleepConsolidation(reason: string): Promise<void> {
    const sleepLog: string[] = [];
    const stats: any = {
      dreamPatterns: 0,
      beliefsMerged: 0,
      thoughtsPruned: 0,
      tensionsResolved: 0
    };

    const startTime = Date.now();

    // Phase 1: REM Sleep - Dream-like pattern extraction
    this.emit('sleepPhaseChanged', { phase: 'REM', progress: 25 });
    sleepLog.push('--- REM Phase: Pattern Extraction ---');
    try {
      const dreamPatterns = await this.extractDreamPatterns();
      stats.dreamPatterns = dreamPatterns.length;
      sleepLog.push(`Extracted ${dreamPatterns.length} dream patterns from thoughts`);
    } catch (error) {
      sleepLog.push(`REM phase skipped: ${(error as Error).message}`);
    }

    // Phase 2: Deep Sleep - Memory consolidation + Core Beliefs merging
    this.emit('sleepPhaseChanged', { phase: 'Deep Sleep', progress: 50 });
    sleepLog.push('--- Deep Sleep Phase: Memory Consolidation & Belief Merging ---');
    try {
      const consolidated = await this.consolidateSignificantThoughts();
      stats.beliefsMerged = consolidated.merged;
      sleepLog.push(`Consolidated ${consolidated.merged} thoughts into ${consolidated.beliefs} beliefs`);

      // Merge similar core beliefs
      const mergeResult = await this.memoryConsolidator.mergeSimilarBeliefs(0.75);
      sleepLog.push(`Merged ${mergeResult.merged} similar beliefs, ${mergeResult.kept} beliefs remain`);
    } catch (error) {
      sleepLog.push(`Deep sleep phase skipped: ${(error as Error).message}`);
    }

    // Phase 3: Synaptic Pruning - Remove redundant thoughts
    this.emit('sleepPhaseChanged', { phase: 'Synaptic Pruning', progress: 75 });
    sleepLog.push('--- Synaptic Pruning Phase ---');
    try {
      const pruned = await this.synapticPruning();
      stats.thoughtsPruned = pruned.deleted;
      sleepLog.push(`Pruned ${pruned.deleted} redundant thoughts`);
    } catch (error) {
      sleepLog.push(`Pruning phase skipped: ${(error as Error).message}`);
    }

    // Phase 4: Emotional Processing - Resolve tensions
    this.emit('sleepPhaseChanged', { phase: 'Emotional Processing', progress: 90 });
    sleepLog.push('--- Emotional Processing Phase ---');
    try {
      const resolved = await this.processEmotionalTensions();
      stats.tensionsResolved = resolved.count;
      sleepLog.push(`Resolved ${resolved.count} conceptual tensions`);
    } catch (error) {
      sleepLog.push(`Emotional processing skipped: ${(error as Error).message}`);
    }

    // Full energy recovery after sleep
    const energyBefore = this.energyManager.getEnergyState().available;
    this.energyManager.resetEnergy(); // Full reset to maximum
    const energyAfter = this.energyManager.getEnergyState().available;

    sleepLog.push(`Energy recovered: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}`);
    log.info('Consciousness', `⚡ Energy fully restored after sleep: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}`);

    // Emit energy update event
    this.emit('energyUpdated', {
      available: energyAfter,
      level: this.energyManager.getEnergyLevel(),
      timestamp: Date.now()
    });

    // Save sleep log to database
    const duration = Date.now() - startTime;
    await this.databaseManager.saveSleepLog({
      timestamp: startTime,
      systemClock: this.systemClock,
      triggerReason: reason,
      phases: sleepLog,
      stats,
      duration,
      energyBefore,
      energyAfter
    });

    log.info('Consciousness', `💤 Sleep consolidation complete: ${JSON.stringify(stats)}`);
  }

  /**
   * Helper: Clean JSON response from LLM (remove markdown code blocks)
   */
  /**
   * @deprecated Use parseRobustJson from utils/json-parser.ts instead
   */
  private cleanJsonResponse(content: string): string {
    // Remove ```json and ``` markers
    return content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  /**
   * REM Phase: Extract dream-like patterns from recent thoughts
   */
  private async extractDreamPatterns(): Promise<any[]> {
    const recentThoughts = await this.databaseManager.getRecentSignificantThoughts(100, 3);

    if (recentThoughts.length < 10) {
      return []; // Not enough thoughts for pattern extraction
    }

    const systemAgent = this.agents.get('system');
    if (!systemAgent) {
      throw new Error('System agent not available');
    }

    // Stage 1: Extract dream patterns (numbered list format)
    const patternPrompt = `【タスク】
以下の思考から、夢のような抽象パターンを3-5個抽出してください。

【思考リスト】
${recentThoughts.map(t => `- ${t.thought_content}`).join('\n')}

【出力形式】
必ず「1. 」で始まる番号付きリストのみを出力してください。
前置き、説明、エッセイは絶対に書かないでください。

【正しい出力例】
1. 孤独と共鳴は鏡像であり、静寂は音の母である
2. 問いは答えより深く、矛盾こそが真実への扉である
3. 時間は流れではなく、意識が織りなす無限の層である

【絶対にやってはいけないこと】
❌「Aeneaの無意識として、私は考えます...」のような文章を書く
❌「以下のパターンを抽出しました」のような説明を書く
❌ 哲学的なエッセイや解説を書く

今すぐ「1. 」で始めてください：`;

    const patternResponse = await systemAgent.execute(
      patternPrompt,
      '指示に厳格に従ってください。必ず「1. 」で始まる番号付きリストのみを出力してください。前置き、説明文、挨拶、エッセイは絶対に書かないでください。日本語で応答してください。'
    );

    const parseResult = parseJsonArray<string>(
      patternResponse.content,
      'Dream Patterns'
    );

    if (!parseResult.success || !parseResult.data) {
      log.error('Consciousness', `Failed to parse dream patterns: ${parseResult.error}`);
      return [];
    }

    const patterns = parseResult.data;
    const dreams: Array<{ pattern: string; emotional_tone: string }> = [];

    // Stage 2: Analyze emotional tone for each pattern
    for (const pattern of patterns) {
      const tonePrompt = `この夢のパターンが持つ感情的なトーンを、短い言葉（2-4文字）で表現してください。

夢のパターン: "${pattern}"

感情的トーンの例: 静謐な驚き、哲学的緊張、詩的郷愁、存在的不安

**出力形式:**
感情的トーンのみを1つ出力してください。説明や前置きは不要です。`;

      const toneResponse = await systemAgent.execute(tonePrompt, 'あなたは夢の感情を読み取る存在です。必ず日本語で応答してください。中国語や他の言語を使用しないでください。');
      const emotionalTone = toneResponse.content.trim().replace(/^["'「『]|["'」』]$/g, '');

      dreams.push({
        pattern: pattern,
        emotional_tone: emotionalTone
      });
    }

    // Save dream patterns to database
    for (const dream of dreams) {
      await this.databaseManager.saveDreamPattern({
        pattern: dream.pattern,
        emotionalTone: dream.emotional_tone,
        sourceThoughtIds: recentThoughts.slice(0, 10).map(t => t.id)
      });
    }

    log.info('Consciousness', `💤 Extracted ${dreams.length} dream patterns with emotional tones`);
    return dreams;
  }

  /**
   * Deep Sleep: Consolidate significant thoughts into core beliefs
   * Focus on quality over quantity - select only the most valuable thoughts
   */
  private async consolidateSignificantThoughts(): Promise<{merged: number, beliefs: number}> {
    // Get recent high-quality thoughts (last 6 hours, confidence > 0.8, limit 30)
    const oldThoughts = await this.databaseManager.getOldSignificantThoughts(6, 0.8, 30, 'hours');

    if (oldThoughts.length < 5) {
      return { merged: 0, beliefs: 0 };
    }

    // Use Memory Consolidator with stricter threshold
    const consolidator = this.memoryConsolidator;
    const result = await consolidator.consolidate(0.85); // Higher threshold for quality

    // Only delete thoughts if beliefs were actually created
    if (result.beliefs_created > 0 || result.beliefs_updated > 0) {
      const ids = oldThoughts.map(t => t.id);
      await this.databaseManager.deleteSignificantThoughts(ids);
    }

    return {
      merged: oldThoughts.length,
      beliefs: result.beliefs_created + result.beliefs_updated
    };
  }

  /**
   * Synaptic Pruning: Remove redundant or low-value thoughts
   */
  private async synapticPruning(): Promise<{deleted: number}> {
    const currentBeliefs = await this.databaseManager.getTopCoreBeliefs(30);
    const oldThoughts = await this.databaseManager.getOldSignificantThoughts(24, 0.0, 200, 'hours');

    if (oldThoughts.length < 10) {
      return { deleted: 0 };
    }

    const systemAgent = this.agents.get('system');
    if (!systemAgent) {
      throw new Error('System agent not available');
    }

    const prompt = `現在のコア信念:
${currentBeliefs.map(b => `- ${b.belief_content}`).join('\n')}

古い思考リスト:
${oldThoughts.map((t, i) => `[${i}] ${t.thought_content} (conf: ${t.confidence})`).join('\n')}

削除すべき思考（重複、矛盾、発展性なし）のインデックス番号のみを出力してください。

【出力形式】
必ず「1. 」で始まる番号付きリストのみを出力してください。
説明、理由、前置きは一切不要です。

【良い例】
1. 5
2. 12
3. 18

【悪い例】
×「以下の思考を削除します」← 説明不要
×「なぜなら...」← 理由不要
×「思考[5]は重複しているので...」← 解説不要

削除すべき思考がない場合は何も出力しないでください。
削除すべき思考がある場合は、最初の行から「1. 」で始めてください。`;

    const response = await systemAgent.execute(prompt, 'あなたは脳の睡眠メカニズムです。記憶を整理し、不要な情報を削除します。必ず日本語で応答してください。中国語や他の言語を使用しないでください。');

    const parseResult = parseJsonArray<string>(
      response.content,
      'Synaptic Pruning'
    );

    if (!parseResult.success || !parseResult.data) {
      log.warn('Consciousness', `Failed to parse pruning results: ${parseResult.error}`);
      return { deleted: 0 };
    }

    // Parse indices from string array
    const indices = parseResult.data
      .map(s => parseInt(s.trim(), 10))
      .filter(idx => !isNaN(idx) && idx >= 0 && idx < oldThoughts.length);

    const toDelete = indices.map(idx => oldThoughts[idx].id);

    if (toDelete.length > 0) {
      await this.databaseManager.deleteSignificantThoughts(toDelete);
    }

    return { deleted: toDelete.length };
  }

  /**
   * Emotional Processing: Resolve conceptual tensions
   */
  private async processEmotionalTensions(): Promise<{count: number}> {
    const tensions = await this.databaseManager.getHighDissonanceCycles(0.7, 7, 10);

    if (tensions.length === 0) {
      return { count: 0 };
    }

    const systemAgent = this.agents.get('system');
    if (!systemAgent) {
      throw new Error('System agent not available');
    }

    const prompt = `高い倫理的不協和を持つ思考サイクル:
${tensions.map((t: any, i: number) => `[${i}] Dissonance: ${t.dissonance}\n${t.synthesis_data || 'No synthesis'}`).join('\n\n')}

これらの緊張を統合する視点を3つ提示してください。

【出力形式】
必ず「1. 」で始まる番号付きリストのみを出力してください。
前置き、説明、挨拶は一切書かないでください。

【良い例】
1. 矛盾は分裂ではなく、多声的真実の表現である
2. 倫理的緊張は成長の源泉であり、解消ではなく統合を目指すべきである
3. 不協和は調和への対話的プロセスを促す触媒である

【悪い例】
×「これらの緊張を統合するには...」← 前置き不要
×「まず第一に...」← 説明不要
×「以下の3つの視点を提示します」← 挨拶不要

最初の行から「1. 」で始めてください。各視点は30-70文字で具体的に記述してください。`;

    const response = await systemAgent.execute(prompt, 'あなたはAeneaの無意識、矛盾を統合する夢の働きです。必ず日本語で応答してください。中国語や他の言語を使用しないでください。');

    const parseResult = parseJsonArray<string>(
      response.content,
      'Emotional Processing'
    );

    if (!parseResult.success || !parseResult.data) {
      log.error('Consciousness', `Failed to parse emotional processing results: ${parseResult.error}`);
      return { count: 0 };
    }

    const resolutions = parseResult.data;

    // Save integrated views as core beliefs
    // TODO: Implement saveOrReinforceBelief in DatabaseManager
    // for (const res of resolutions) {
    //   await this.databaseManager.saveOrReinforceBelief(res.integrated_view, 0.85);
    // }

    return { count: resolutions.length };
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
}

export default ConsciousnessBackend;
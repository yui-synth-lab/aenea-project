/**
 * Aenea Consciousness Backend (TypeScript) - No Session Architecture
 */

import { EventEmitter } from 'events';
import { log } from './logger.js';
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
import { StructuredThought, MutualReflection, AuditorResult, SynthesisResult, DocumentationResult, InternalTrigger } from '../types/aenea-types.js';
import { DPDScores, DPDWeights, ImpactAssessment } from '../types/dpd-types.js';
import { MemoryConsolidator } from '../aenea/memory/memory-consolidator.js';
import { CoreBeliefs } from '../aenea/memory/core-beliefs.js';
import { theoriaConfig } from '../aenea/agents/theoria.js';
import { pathiaConfig } from '../aenea/agents/pathia.js';
import { kinesisConfig } from '../aenea/agents/kinesis.js';
import { systemConfig } from '../aenea/agents/system.js';
import { aeneaConfig } from '../aenea/agents/aenea.js';
import { YuiAgentsBridge, createYuiAgentsBridge, InternalDialogueSession } from '../integration/yui-agents-bridge.js';
import { ContentCleanupService } from './content-cleanup-service.js';
import { QuestionCategorizer, createQuestionCategorizer } from '../utils/question-categorizer.js';
import { InternalTriggerGenerator } from '../aenea/core/internal-trigger.js';
import { parseJsonObject, parseJsonArray } from '../utils/json-parser.js';

interface ThoughtCycle {
  id: string;
  timestamp: number;
  trigger: InternalTrigger;
  thoughts: StructuredThought[];
  mutualReflections?: MutualReflection[];  // Array of reflections from S2
  auditorResult?: AuditorResult;
  dpdScores?: DPDScores;
  impactAssessment?: ImpactAssessment;  // Impact assessment from S4
  synthesis?: SynthesisResult;
  documentation?: DocumentationResult;
  dpdWeights?: DPDWeights;
  status: 'processing' | 'completed' | 'failed';
  duration?: number;
  totalEnergy: number;
  totalStages: number;
}

export interface ConsciousnessState {
  systemClock: number;
  energy: number;
  isRunning: boolean;
  isPaused: boolean;
  isProcessingCycle?: boolean;
  totalQuestions: number;
  totalThoughts: number;
  lastActivity: string;
  dpdWeights: DPDWeights;
}

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

    log.info('Consciousness', `✅ Agents initialized with individual personalities:`);
    log.info('Consciousness', `  - ${theoriaConfig.displayName} (${theoriaConfig.furigana}): ${theoriaConfig.modelConfig.provider}/${theoriaConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${theoriaConfig.generationParams.temperature}, Style: ${theoriaConfig.style}`);
    log.info('Consciousness', `  - ${pathiaConfig.displayName} (${pathiaConfig.furigana}): ${pathiaConfig.modelConfig.provider}/${pathiaConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${pathiaConfig.generationParams.temperature}, Style: ${pathiaConfig.style}`);
    log.info('Consciousness', `  - ${kinesisConfig.displayName} (${kinesisConfig.furigana}): ${kinesisConfig.modelConfig.provider}/${kinesisConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${kinesisConfig.generationParams.temperature}, Style: ${kinesisConfig.style}`);
    log.info('Consciousness', `  - ${systemConfig.displayName} (${systemConfig.furigana}): ${systemConfig.modelConfig.provider}/${systemConfig.modelConfig.model}`);
    log.info('Consciousness', `    Temperature: ${systemConfig.generationParams.temperature}, Style: ${systemConfig.style}`);
    log.info('Consciousness', `  - ${aeneaConfig.displayName}: ${aeneaConfig.provider}/${aeneaConfig.model}`);
    log.info('Consciousness', `    Temperature: ${aeneaConfig.generationParams.temperature}, Role: Unified consciousness (dialogue + questions)`);

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

    log.info('Consciousness', 'Backend initialized');
    log.info('Consciousness', 'Consciousness initialized but not started - use /api/consciousness/start to begin');
  }

  // ============================================================================
  // Database Management
  // ============================================================================

  private restoreFromDatabase(): void {
    try {
      console.log('[DEBUG] restoreFromDatabase called');
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
      // Use direct SQL query to get questions ordered by timestamp
      const db = (this.databaseManager as any).db;
      if (!db) {
        log.warn('Consciousness', 'Database not ready for loading question history');
        return;
      }

      const recentQuestions = db.prepare(`
        SELECT id, question, category, importance, timestamp
        FROM questions
        ORDER BY timestamp DESC
        LIMIT 100
      `).all();

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
    const energyState = this.energyManager.getEnergyState();

    // Get actual counts from database
    const dbStats = this.databaseManager.getStats();

    return {
      systemClock: this.systemClock,
      energy: energyState.available,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isProcessingCycle: this.isProcessingCycle,
      totalQuestions: dbStats.questions || 0,
      totalThoughts: dbStats.thought_cycles || 0,
      lastActivity: new Date().toISOString(),
      dpdWeights: this.dpdWeights
    };
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

    this.isRunning = true;
    this.isPaused = false;

    this.emit('consciousnessStarted', this.getState());
    log.info('Consciousness', 'Started');

    // Start the main consciousness loop
    this.consciousnessLoop();
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
    // DB connection remains open - no cleanup needed
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

      try {
        await this.processThoughtCycle();

        // Check if automatic sleep should be triggered
        if (this.shouldEnterSleep() && !this.isSleeping) {
          log.info('Consciousness', '💤 Auto-sleep triggered');
          await this.enterSleepMode(false);
        }

        await this.sleep(5000); // Wait 5 seconds between cycles
      } catch (error) {
        console.error('❌ Error in consciousness loop:', error);
        await this.sleep(10000); // Wait longer on error
      }
    }
  }

  private async processThoughtCycle(): Promise<void> {
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
      const trigger = await this.generateInternalTrigger();
      if (!trigger) {
        return;
      }

      // Execute thought cycle
      await this.executeAdaptiveThoughtCycle(trigger);
    } finally {
      // Always mark cycle as completed, even if stopped or error occurs
      this.isProcessingCycle = false;

      // Emit event for UI to re-enable buttons
      this.emit('cycleProcessingChanged', { isProcessingCycle: false });
    }
  }

  private async executeAdaptiveThoughtCycle(trigger: InternalTrigger): Promise<void> {
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
    const energyState = this.energyManager.getEnergyState();
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
    const energyReserved = this.energyManager.reserveEnergy(requiredEnergy, `thought_cycle_${thoughtCycle.id}`);

    if (!energyReserved) {
      log.warn('ThoughtCycle', `⚠️ Failed to reserve ${requiredEnergy} energy - aborting cycle`);
      return;
    }

    log.info('ThoughtCycle', `${executionMode === 'full' ? 'Full' : executionMode === 'low' ? 'Low' : 'Critical'} energy mode: reserved ${requiredEnergy.toFixed(1)} energy for complete cycle`);

    try {
      // S0: Trigger Generation (already completed, consume energy)
      // Emit stage start event
      this.emit('stageChanged', {
        stage: 'S0',
        name: 'Internal Trigger Generation',
        status: 'in_progress',
        timestamp: Date.now()
      });

      const s0EnergyCost = 1.0;
      await this.energyManager.consumeEnergy(s0EnergyCost, 'stage_S0');
      thoughtCycle.totalEnergy += s0EnergyCost;
      thoughtCycle.totalStages++;
      log.info('StageS0', `Internal trigger generated: "${trigger.question.substring(0, 60)}..."`);

      // Emit stage completion event
      this.emit('stageCompleted', {
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

      console.log(`[DEBUG] About to increment systemClock from ${this.systemClock} to ${this.systemClock + 1}`);
      this.systemClock++;
      console.log(`[DEBUG] SystemClock incremented to: ${this.systemClock}`);

      thoughtCycle.status = 'completed';
      thoughtCycle.duration = Date.now() - thoughtCycle.timestamp;

      // Release reserved energy and consume only what was actually used
      // The individual stage executions have already consumed energy,
      // so we just release the reservation
      const releasedEnergy = this.energyManager.releaseReservedEnergy();
      log.info('ThoughtCycle', `✅ Cycle completed - released ${releasedEnergy.toFixed(1)} reserved energy, actual consumption tracked per stage`);

      // Save consciousness state
      this.saveConsciousnessState();

      // Save completed thought cycle to database
      this.databaseManager.saveThoughtCycle(thoughtCycle);

      // Periodic memory consolidation (every 5 cycles)
      // Sleep Mode provides deeper consolidation and belief merging
      await this.performPeriodicConsolidation();

      // Emit completion event with minimal essential data (not full thoughtCycle)
      const currentState = this.getState();
      const statistics = this.getStatistics();
      this.emit('thoughtCycleCompleted', {
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
          empathy: this.dpdWeights.empathy.toFixed(3),
          coherence: this.dpdWeights.coherence.toFixed(3),
          dissonance: this.dpdWeights.dissonance.toFixed(3),
          version: this.dpdWeights.version
        },
        // System statistics
        systemClock: currentState.systemClock,
        totalQuestions: statistics.totalQuestions,
        totalThoughts: statistics.totalThoughts,
        averageConfidence: statistics.averageConfidence,
        energy: currentState.energy
      });

    } catch (error) {
      // Release reserved energy even on failure
      const releasedEnergy = this.energyManager.releaseReservedEnergy();
      log.warn('ThoughtCycle', `❌ Cycle failed - released ${releasedEnergy.toFixed(1)} reserved energy`);

      thoughtCycle.status = 'failed';
      log.error('Consciousness', 'Thought cycle failed', error);
      this.emit('thoughtCycleFailed', { id: thoughtCycle.id, error: (error as Error).message });
    }
  }

  // ============================================================================
  // Stage Execution Methods
  // ============================================================================

  private async executeIndividualThought(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.emit('stageChanged', {
      stage: 'S1',
      name: 'Individual Thought',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 1.0;
    await this.energyManager.consumeEnergy(energyCost, 'stage_S1');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const thoughts = await this.individualThoughtStage.run(thoughtCycle);
    thoughtCycle.thoughts = thoughts;

    // Emit stage completion event
    this.emit('stageCompleted', {
      stage: 'S1',
      name: 'Individual Thought',
      status: 'completed',
      timestamp: Date.now(),
      thoughtCount: thoughts.length
    });
  }

  private async executeMutualReflection(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.emit('stageChanged', {
      stage: 'S2',
      name: 'Mutual Reflection',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.5;
    await this.energyManager.consumeEnergy(energyCost, 'stage_S2');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const reflections = await this.mutualReflectionStage.run(thoughtCycle.thoughts);

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

    this.emit('stageCompleted', {
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

  private async executeAuditor(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.emit('stageChanged', {
      stage: 'S3',
      name: 'Auditor',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.5;
    await this.energyManager.consumeEnergy(energyCost, 'stage_S3');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const auditorResult = await this.auditorStage.run(
      thoughtCycle.thoughts,
      this.agents
    );

    thoughtCycle.auditorResult = auditorResult;

    log.info('StageS3', 'Auditor completed');

    // Emit stage completion event for UI (minimal data)
    this.emit('stageCompleted', {
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

  private async executeDPDAssessment(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.emit('stageChanged', {
      stage: 'S4',
      name: 'DPD Assessment',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.5;
    await this.energyManager.consumeEnergy(energyCost, 'stage_S4');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    // Use the dedicated DPDAssessmentStage implementation
    const result = await this.dpdAssessmentStage.run(
      thoughtCycle.thoughts,
      thoughtCycle.mutualReflections || [],
      thoughtCycle.auditorResult as any || {
        risk: 'LOW' as any,
        safetyScore: 0.8,
        ethicsScore: 0.8,
        concerns: [],
        recommendations: []
      },
      thoughtCycle.trigger // Pass trigger for impact assessment
    );

    thoughtCycle.dpdScores = result.scores;
    thoughtCycle.impactAssessment = result.assessment.impactAssessment; // Store impact assessment
    this.dpdWeights = result.weights; // Update current weights

    console.log(`[Backend S4] DPD Scores calculated: empathy=${result.scores.empathy.toFixed(3)}, coherence=${result.scores.coherence.toFixed(3)}, dissonance=${result.scores.dissonance.toFixed(3)}, weighted=${result.scores.weightedTotal.toFixed(3)} at ${new Date().toISOString()}`);

    if (result.assessment.impactAssessment?.isParadigmShift) {
      console.log(`[Backend S4] ⚡ PARADIGM SHIFT DETECTED: ${result.assessment.impactAssessment.reasoning}`);
    }

    log.info('StageS4', `DPD Assessment completed at ${new Date().toISOString()}`);

    // Emit stage completion event for UI (with size limits to prevent JSON errors)
    this.emit('stageCompleted', {
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
        empathy: this.dpdWeights.empathy.toFixed(3),
        coherence: this.dpdWeights.coherence.toFixed(3),
        dissonance: this.dpdWeights.dissonance.toFixed(3)
      }
    });
  }

  /**
   * Fallback DPD Assessment for critical energy mode (heuristic-based, fast)
   */
  private async executeFallbackDPDAssessment(thoughtCycle: ThoughtCycle): Promise<void> {
    console.log(`[Backend S4-Fallback] Starting fallback DPD scoring (critical mode) at ${new Date().toISOString()}`);

    // Emit stage start event
    this.emit('stageChanged', {
      stage: 'S4',
      name: 'DPD Assessment (Heuristic)',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.1; // Much cheaper than AI-based assessment (0.5)
    await this.energyManager.consumeEnergy(energyCost, 'stage_S4_fallback');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    // Calculate heuristic-based DPD scores
    const scores = this.calculateFallbackDPDScores(thoughtCycle);
    thoughtCycle.dpdScores = {
      ...scores,
      timestamp: Date.now(),
      context: {
        trigger: thoughtCycle.trigger.question,
        thoughtCount: thoughtCycle.thoughts.length,
        energyMode: 'critical'
      }
    };

    log.info('StageS4-Fallback', `Heuristic DPD scores: empathy=${scores.empathy.toFixed(3)}, coherence=${scores.coherence.toFixed(3)}, dissonance=${scores.dissonance.toFixed(3)}`);

    // Emit stage completion event
    this.emit('stageCompleted', {
      stage: 'S4',
      name: 'DPD Assessment (Heuristic)',
      status: 'completed',
      timestamp: Date.now(),
      empathy: scores.empathy.toFixed(3),
      coherence: scores.coherence.toFixed(3),
      dissonance: scores.dissonance.toFixed(3),
      weightedTotal: scores.weightedTotal.toFixed(3),
      currentWeights: {
        empathy: this.dpdWeights.empathy.toFixed(3),
        coherence: this.dpdWeights.coherence.toFixed(3),
        dissonance: this.dpdWeights.dissonance.toFixed(3)
      },
      method: 'heuristic'
    });
  }

  /**
   * Calculate DPD scores using keyword-based heuristics (no AI)
   */
  private calculateFallbackDPDScores(thoughtCycle: ThoughtCycle): import('../types/dpd-types.js').DPDScores {
    const thoughts = thoughtCycle.thoughts || [];

    // Combine all thought content
    const allContent = thoughts.map(t => t.content || '').join(' ').toLowerCase();

    if (!allContent || allContent.length === 0) {
      // Default scores if no content
      return {
        empathy: 0.5,
        coherence: 0.5,
        dissonance: 0.5,
        weightedTotal: 0.5,
        timestamp: Date.now(),
        context: {
          trigger: thoughtCycle.trigger.question,
          thoughtCount: 0,
          energyMode: 'critical'
        }
      };
    }

    // Empathy keywords (Japanese) - 共感、感情、他者理解
    const empathyKeywords = [
      '感じ', '感情', '共感', '理解', '他者', '繋がり', '心', '優しさ', '思いやり',
      '感動', '愛', '絆', '寄り添', '受け入れ', '尊重', '関係', '人間', '対話'
    ];

    // Coherence keywords (Japanese) - 論理、一貫性、体系性
    const coherenceKeywords = [
      '論理', '一貫', '体系', '秩序', '統合', '構造', '整合', '合理',
      'システム', '法則', '原理', '理性', '分析', '因果', '関連', '整理'
    ];

    // Dissonance keywords (Japanese) - 矛盾、葛藤、疑問
    const dissonanceKeywords = [
      '矛盾', '葛藤', '疑問', 'しかし', 'ただし', '対立', '問題', '不協和',
      '悩み', '迷い', 'なぜ', '疑い', '違和感', '不安', 'ジレンマ', '対照'
    ];

    // Count keyword occurrences
    const empathyCount = this.countKeywords(allContent, empathyKeywords);
    const coherenceCount = this.countKeywords(allContent, coherenceKeywords);
    const dissonanceCount = this.countKeywords(allContent, dissonanceKeywords);

    // Normalize based on content length (keywords per 100 characters)
    const contentLength = Math.max(100, allContent.length);
    const normalizationFactor = contentLength / 100;

    const empathyRaw = empathyCount / normalizationFactor;
    const coherenceRaw = coherenceCount / normalizationFactor;
    const dissonanceRaw = dissonanceCount / normalizationFactor;

    // Apply sigmoid-like transformation to get 0-1 range
    // f(x) = 1 / (1 + exp(-k*(x-threshold)))
    // Adjusted for typical keyword counts
    const sigmoid = (x: number, k: number = 2, threshold: number = 0.5) => {
      return 1 / (1 + Math.exp(-k * (x - threshold)));
    };

    const empathyScore = sigmoid(empathyRaw, 1.5, 0.3);
    const coherenceScore = sigmoid(coherenceRaw, 1.5, 0.3);
    const dissonanceScore = sigmoid(dissonanceRaw, 1.5, 0.3);

    // Calculate weighted total using current DPD weights
    const weightedTotal = (
      empathyScore * this.dpdWeights.empathy +
      coherenceScore * this.dpdWeights.coherence +
      dissonanceScore * this.dpdWeights.dissonance
    );

    log.debug('FallbackDPD', `Keyword counts: empathy=${empathyCount}, coherence=${coherenceCount}, dissonance=${dissonanceCount} (content length: ${contentLength})`);

    return {
      empathy: Math.max(0.1, Math.min(0.9, empathyScore)), // Clamp to 0.1-0.9
      coherence: Math.max(0.1, Math.min(0.9, coherenceScore)),
      dissonance: Math.max(0.1, Math.min(0.9, dissonanceScore)),
      weightedTotal: Math.max(0.1, Math.min(0.9, weightedTotal)),
      timestamp: Date.now(),
      context: {
        trigger: thoughtCycle.trigger.question,
        thoughtCount: thoughtCycle.thoughts.length,
        energyMode: 'critical'
      }
    };
  }

  /**
   * Count keyword occurrences in text
   */
  private countKeywords(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword, 'g');
      const matches = text.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  private async executeCompiler(thoughtCycle: ThoughtCycle): Promise<void> {
    console.log(`[Backend S5] Starting Compiler stage at ${new Date().toISOString()}`);

    // Emit stage start event
    this.emit('stageChanged', {
      stage: 'S5',
      name: 'Compiler',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.8;
    await this.energyManager.consumeEnergy(energyCost, 'stage_S5');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const synthesis = await this.compilerStage.run(
      thoughtCycle.thoughts,
      thoughtCycle.mutualReflections || [],
      thoughtCycle.auditorResult as any
    );

    thoughtCycle.synthesis = synthesis;

    log.info('StageS5', `Compiler completed at ${new Date().toISOString()}`);

    // Emit stage completion event for UI (minimal data)
    this.emit('stageCompleted', {
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

  private async executeScribe(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.emit('stageChanged', {
      stage: 'S6',
      name: 'Scribe',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.3;
    await this.energyManager.consumeEnergy(energyCost, 'stage_S6');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    const documentation = await this.scribeStage.run(
      thoughtCycle.synthesis as any,
      thoughtCycle.dpdScores || null
    );

    thoughtCycle.documentation = documentation;

    log.info('StageS6', 'Scribe completed');

    // Emit stage completion event for UI (minimal data)
    this.emit('stageCompleted', {
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

  private async executeWeightUpdate(thoughtCycle: ThoughtCycle): Promise<void> {
    // Emit stage start event
    this.emit('stageChanged', {
      stage: 'U',
      name: 'Weight Update',
      status: 'in_progress',
      timestamp: Date.now()
    });

    const energyCost = 0.2;
    await this.energyManager.consumeEnergy(energyCost, 'stage_U');
    thoughtCycle.totalEnergy += energyCost;
    thoughtCycle.totalStages++;

    if (thoughtCycle.dpdScores) {
      const updatedWeights = await this.weightUpdateStage.run(
        thoughtCycle.dpdScores,
        this.dpdWeights,
        thoughtCycle.impactAssessment // Pass impact assessment for paradigm shift detection
      );

      this.dpdWeights = updatedWeights;
      thoughtCycle.dpdWeights = { ...updatedWeights };

      console.log(`DPD weights updated: empathy=${updatedWeights.empathy.toFixed(3)}, coherence=${updatedWeights.coherence.toFixed(3)}, dissonance=${updatedWeights.dissonance.toFixed(3)}`);

      if (thoughtCycle.impactAssessment?.isParadigmShift) {
        console.log(`[Backend U] ⚡ Paradigm shift perturbation applied to DPD weights`);
      }

      // Save DPD weights to database
      this.databaseManager.saveDPDWeights(updatedWeights);

      // Emit DPD update event (minimal data only)
      this.emit('dpdUpdated', {
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
    this.emit('stageCompleted', {
      stage: 'U',
      name: 'Weight Update',
      status: 'completed',
      timestamp: Date.now(),
      weightsUpdated: !!thoughtCycle.dpdScores,
      weights: this.dpdWeights,
      version: this.dpdWeights.version,
      empathyWeight: this.dpdWeights.empathy.toFixed(3),
      coherenceWeight: this.dpdWeights.coherence.toFixed(3),
      dissonanceWeight: this.dpdWeights.dissonance.toFixed(3)
    });
  }

  // ============================================================================
  // Memory and Learning
  // ============================================================================

  private async recordSignificantThoughtsFromCycle(thoughtCycle: ThoughtCycle): Promise<void> {
    if (!thoughtCycle.thoughts) return;

    log.info('Consciousness', `🔍 About to record significant thoughts from cycle. thoughtCycle.thoughts exists: ${!!thoughtCycle.thoughts}, length: ${thoughtCycle.thoughts.length}`);
    log.info('Consciousness', `🔍 Checking ${thoughtCycle.thoughts.length} thoughts for significance (confidence > 0.6)`);

    let significantCount = 0;

    for (const [index, thought] of thoughtCycle.thoughts.entries()) {
      log.info('Consciousness', `🔍 Thought ${index + 1}: agentId=${thought.agentId}, confidence=${thought.confidence}`);

      if (thought.confidence > 0.6) {
        log.info('Consciousness', `✅ Recording significant thought: confidence=${thought.confidence}`);

        // Clean the content before saving
        const cleanedContent = await this.contentCleanup.cleanThought(thought.content);

        // Use the original question category from the trigger
        const category = thoughtCycle.trigger?.category || 'philosophical';

        this.databaseManager.recordSignificantThought({
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

  /**
   * Validates if a text is a proper question
   *
   * Valid questions satisfy ONE of:
   * 1. End with question mark (？ or ?)
   * 2. Start with interrogative words (何、どう、なぜ、いつ、どこ、誰、どの、どれ、いかに)
   *    - Even without question mark: "何が真実か", "どう生きるべきか"
   *
   * Rejected patterns:
   * - Poetic descriptions: （指先で...）, 「静寂を破り...」
   * - Assertions without interrogatives: 存在は記憶から生じる。
   * - Too short (< 3 characters)
   */
  private isValidQuestion(text: string): boolean {
    const trimmed = text.trim();

    // Too short
    if (trimmed.length < 3) return false;

    // Reject poetic descriptions (parentheses at start)
    if (trimmed.startsWith('（') || trimmed.startsWith('(')) return false;

    // Reject quoted descriptions (often poetic)
    if (trimmed.startsWith('「') && !trimmed.includes('？') && !trimmed.includes('?')) {
      return false;
    }

    // Check for question mark ending (strongest signal)
    if (trimmed.endsWith('？') || trimmed.endsWith('?')) return true;

    // Check for interrogative word at start (Japanese)
    const interrogatives = ['何', 'どう', 'なぜ', 'いつ', 'どこ', '誰', 'どの', 'どれ', 'いかに'];
    const hasInterrogative = interrogatives.some(word => trimmed.startsWith(word));

    if (hasInterrogative) {
      // Valid question: "何が真実か", "どう生きるべきか"
      return true;
    }

    // Reject assertions ending with period (no interrogative, no question mark)
    if (trimmed.endsWith('。') || trimmed.endsWith('.') || trimmed.endsWith('」')) return false;

    return false; // Default: not a valid question
  }

  private extractUnresolvedIdeasFromCycle(thoughtCycle: ThoughtCycle): void {
    const unresolvedIdeas: any[] = [];

    // Get existing significant thoughts to avoid logical inconsistency
    const existingSignificantThoughts = this.databaseManager.getSignificantThoughts(100);
    const significantQuestions = new Set(existingSignificantThoughts
      .map(thought => thought.thought_content?.toLowerCase()?.trim())
      .filter(content => content));

    // Extract from synthesis if available
    if (thoughtCycle.synthesis?.unresolvedQuestions) {
      thoughtCycle.synthesis.unresolvedQuestions.forEach((question: string) => {
        const questionLower = question.toLowerCase().trim();

        // Validate that it's actually a question
        if (!this.isValidQuestion(question)) {
          log.debug('Consciousness', `⚠️ Rejected non-question from synthesis: ${question.substring(0, 50)}...`);
          return;
        }

        // Only add if it's not already recorded as a significant thought
        if (!significantQuestions.has(questionLower)) {
          // Use QuestionCategorizer to determine category based on content
          const categorization = this.questionCategorizer.categorizeQuestion(question);
          const detectedCategory = categorization.category || 'philosophical';

          unresolvedIdeas.push({
            id: `unresolved_${Date.now()}_${Math.random()}`,
            question: question,
            category: detectedCategory,
            importance: 0.7,
            firstEncountered: Date.now()
          });

          log.debug('Consciousness', `📝 Categorized unresolved question as [${detectedCategory}]: ${question.substring(0, 50)}...`);
        } else {
          log.info('Consciousness', `⚙️ Skipping question already resolved as significant thought: ${question}`);
        }
      });
    }

    // Extract from documentation if available
    if (thoughtCycle.documentation?.futureQuestions) {
      thoughtCycle.documentation.futureQuestions.forEach((question: string) => {
        const questionLower = question.toLowerCase().trim();

        // Validate that it's actually a question
        if (!this.isValidQuestion(question)) {
          log.debug('Consciousness', `⚠️ Rejected non-question from documentation: ${question.substring(0, 50)}...`);
          return;
        }

        // Only add if it's not already recorded as a significant thought
        if (!significantQuestions.has(questionLower)) {
          // Use QuestionCategorizer to determine category based on content
          const categorization = this.questionCategorizer.categorizeQuestion(question);
          const detectedCategory = categorization.category || 'exploratory';

          unresolvedIdeas.push({
            id: `future_${Date.now()}_${Math.random()}`,
            question: question,
            category: detectedCategory,
            importance: 0.6,
            firstEncountered: Date.now()
          });

          log.debug('Consciousness', `📝 Categorized future question as [${detectedCategory}]: ${question.substring(0, 50)}...`);
        } else {
          log.info('Consciousness', `⚙️ Skipping future question already resolved as significant thought: ${question}`);
        }
      });
    }

    // Save to database (only non-duplicate questions that aren't already significant)
    unresolvedIdeas.forEach(idea => {
      this.databaseManager.addUnresolvedIdea(idea);
    });

    if (unresolvedIdeas.length > 0) {
      log.info('Consciousness', `🧩 Added ${unresolvedIdeas.length} genuinely unresolved ideas to database`);
    }
  }

  // ============================================================================
  // Category Diversity Helpers
  // ============================================================================

  private getCategoryDistribution(): Record<string, number> {
    const allQuestions = this.databaseManager.getAllQuestions();
    const distribution: Record<string, number> = {};

    for (const q of allQuestions) {
      distribution[q.category] = (distribution[q.category] || 0) + 1;
    }

    return distribution;
  }

  private getRecentCategories(limit: number = 20): string[] {
    const recentQuestions = this.databaseManager.getAllQuestions().slice(-limit);
    return recentQuestions.map(q => q.category);
  }

  private getUnderrepresentedCategories(distribution: Record<string, number>): string[] {
    const allCategories = ['existential', 'epistemological', 'consciousness', 'ethical', 'creative', 'metacognitive', 'temporal', 'paradoxical', 'ontological'];
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const avgPerCategory = total / allCategories.length;

    // Categories with less than 70% of average usage
    const underrepresented = allCategories.filter(cat => {
      const count = distribution[cat] || 0;
      return count < avgPerCategory * 0.7;
    });

    // Sort by usage (least used first)
    return underrepresented.sort((a, b) => (distribution[a] || 0) - (distribution[b] || 0));
  }

  private getCategoriesToAvoid(recentCategories: string[], distribution: Record<string, number>): string[] {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    const avgPerCategory = total / 9; // 9 categories

    // Count recent usage
    const recentCounts: Record<string, number> = {};
    for (const cat of recentCategories) {
      recentCounts[cat] = (recentCounts[cat] || 0) + 1;
    }

    // Avoid categories that appear more than 40% in recent questions
    // OR have more than 150% of average usage overall
    const toAvoid: string[] = [];
    for (const [cat, count] of Object.entries(distribution)) {
      const recentUsage = (recentCounts[cat] || 0) / recentCategories.length;
      const overallUsage = count / total;

      if (recentUsage > 0.4 || count > avgPerCategory * 1.5) {
        toAvoid.push(cat);
      }
    }

    return toAvoid;
  }

  // ============================================================================
  // Internal Trigger Generation (Refactored - Delegated to InternalTriggerGenerator)
  // ============================================================================

  private async generateInternalTrigger(): Promise<InternalTrigger | null> {
    // Note: Energy consumption for trigger generation (S0) is handled by executeAdaptiveThoughtCycle
    // Don't consume energy here to avoid double-counting

    // Delegate to InternalTriggerGenerator (refactored architecture)
    if (!this.triggerGenerator) {
      log.error('Trigger', 'InternalTriggerGenerator not initialized');
      return null;
    }

    // Transfer pending manual trigger if exists
    if (this.pendingManualTrigger) {
      this.triggerGenerator.setManualTrigger(this.pendingManualTrigger);
      this.pendingManualTrigger = null;
    }

    // Generate trigger using new architecture
    return await this.triggerGenerator.generate();
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
    const trigger: InternalTrigger = {
      id: `manual_${Date.now()}`,
      timestamp: Date.now(),
      question,
      category: 'metacognitive' as any, // Manual triggers default to metacognitive
      importance: 0.8,
      source: 'manual' as any
    };

    // Queue trigger for next cycle instead of immediate processing
    this.pendingManualTrigger = trigger;
    this.databaseManager.saveQuestion(trigger);

    // Emit event to notify UI that trigger is queued
    this.emit('manualTriggerQueued', {
      id: trigger.id,
      question: trigger.question.substring(0, 150),
      estimatedNextCycle: this.systemClock + 30, // Approximate next cycle time
      timestamp: Date.now()
    });

    log.info('Trigger', `📥 Manual trigger queued for next cycle: "${question.substring(0, 50)}..."`);

    return { success: true, trigger, queued: true };
  }

  getHistory(): any {
    return {
      questions: [],
      thoughts: [],
      systemClock: this.systemClock
    };
  }

  getStatistics(): any {
    const dbStats = this.databaseManager.getStats();

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
      systemClock: this.systemClock,
      energy: this.energyManager.getEnergyState().available
    };
  }

  getDPDEvolution(limit: number = 20, strategy: string = 'sampled'): any {
    // Get DPD weights history from database with sampling
    const { records, totalCount } = this.databaseManager.getDPDWeightsHistorySampled(limit, strategy);

    // Get the latest weights from database (most accurate source of truth)
    const latestFromDB = this.databaseManager.getLatestDPDWeights();
    const currentWeights = latestFromDB || this.dpdWeights;

    return {
      currentWeights: currentWeights,
      history: records,
      totalCount: totalCount
    };
  }

  getUnresolvedIdeas(limit: number = 100): any[] {
    return this.databaseManager.getUnresolvedIdeas(limit);
  }

  async getUnresolvedIdeasAsync(limit: number = 100): Promise<any[]> {
    return this.databaseManager.getUnresolvedIdeasAsync(limit);
  }

  getSignificantThoughts(limit: number = 100): any[] {
    return this.databaseManager.getSignificantThoughts(limit);
  }

  getDPDWeights(): any {
    return this.dpdWeights;
  }

  getPersonalityTraits(): any {
    // Get actual data from database instead of memory arrays
    const dbStats = this.databaseManager.getStats();
    const questionCount = dbStats.questions || 0;
    const thoughtCount = dbStats.thought_cycles || 0;
    const significantThoughts = this.databaseManager.getSignificantThoughts(1000);
    const energyState = this.energyManager.getEnergyState();

    // For philosophical inclination, use a simplified calculation
    // Assume 50% of questions are philosophical (based on the 9 categories)
    const philosophicalInclination = 0.5;

    // Calculate creativity based on significant thoughts diversity
    const creativityFromThoughts = Math.min(1.0, significantThoughts.length * 0.01);
    const creativity = Math.min(1.0, 0.3 + creativityFromThoughts);

    return {
      curiosity: Math.min(1.0, questionCount / 20), // Max curiosity at 20 questions (279/20 = 13.95 → 1.0)
      empathy: this.dpdWeights?.empathy || 0.33, // Use actual DPD empathy weight
      creativity: Math.round(creativity * 1000) / 1000, // Calculated creativity
      analyticalDepth: Math.min(1.0, thoughtCount / 15), // Max analytical depth at 15 thoughts (279/15 = 18.6 → 1.0)
      philosophicalInclination: Math.round(philosophicalInclination * 1000) / 1000, // Calculated philosophical inclination
      questioningTendency: Math.min(1.0, questionCount / 25), // Max questioning at 25 questions (279/25 = 11.16 → 1.0)
      energyManagement: energyState.available / energyState.total // Current energy efficiency
    };
  }

  // Energy management methods
  getEnergyState(): any {
    return this.energyManager.getEnergyState();
  }

  rechargeEnergy(amount?: number): boolean {
    try {
      const currentState = this.energyManager.getEnergyState();
      const targetAmount = amount || 20; // Default recharge amount

      if (currentState.available >= currentState.total) {
        return false; // Already at max
      }

      this.energyManager.rechargeEnergy(targetAmount);
      console.log('🔋 Manual energy recharge performed');

      // Update database with new energy state
      const newState = this.energyManager.getEnergyState();
      this.saveConsciousnessState();

      // Emit energy update event for UI
      this.emit('energyRecharged', {
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
      const currentState = this.energyManager.getEnergyState();

      if (currentState.available >= currentState.total * 0.8) {
        return false; // Not needed if energy is already high
      }

      // Deep rest restores energy to 80% and improves efficiency
      this.energyManager.deepRest();
      console.log('🧘 Deep rest performed - energy and efficiency restored');

      // Update database with new energy state
      const newState = this.energyManager.getEnergyState();
      this.saveConsciousnessState();

      // Emit deep rest event for UI
      this.emit('deepRestPerformed', {
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
   * Perform memory consolidation periodically
   */
  private async performPeriodicConsolidation(): Promise<void> {
    const cyclesSinceLastConsolidation = this.systemClock - this.lastConsolidationTime;

    // Consolidate every 5 thought cycles
    if (cyclesSinceLastConsolidation >= 5) {
      try {
        log.info('MemoryEvolution', '🧠 Starting periodic memory consolidation...');
        const result = await this.memoryConsolidator.consolidate(0.85);

        log.info('MemoryEvolution', `✅ Consolidation complete: ${result.beliefs_created} beliefs created, ${result.beliefs_updated} updated`);

        // Generate memory patterns from recent thoughts
        this.generateMemoryPatterns();

        // Generate consciousness insights from beliefs
        this.generateConsciousnessInsights();

        // Cleanup unresolved ideas (every 10 cycles)
        if (cyclesSinceLastConsolidation >= 10) {
          log.info('MemoryEvolution', '🧹 Starting unresolved ideas cleanup...');
          const cleanupResult = this.databaseManager.cleanupUnresolvedIdeas(1000);
          log.info('MemoryEvolution', `✅ Cleanup complete: ${cleanupResult.deleted} deleted, ${cleanupResult.kept} kept (${cleanupResult.strategy})`);
        }

        this.lastConsolidationTime = this.systemClock;

        // Emit consolidation event for UI
        this.emit('memoryConsolidated', {
          timestamp: Date.now(),
          systemClock: this.systemClock,
          beliefsCreated: result.beliefs_created,
          beliefsUpdated: result.beliefs_updated,
          thoughtsProcessed: result.thoughts_processed,
          duration: result.duration_ms
        });
      } catch (error) {
        log.error('MemoryEvolution', 'Consolidation failed', error);
      }
    }
  }

  private generateMemoryPatterns(): void {
    try {
      log.info('MemoryEvolution', '🔍 Analyzing memory patterns...');

      // Get recent significant thoughts
      const recentThoughts = this.databaseManager.getSignificantThoughts(50);

      // Analyze patterns: agent distribution
      const agentCounts: { [key: string]: number } = {};
      const categoryCounts: { [key: string]: number } = {};

      recentThoughts.forEach((t: any) => {
        agentCounts[t.agent_id] = (agentCounts[t.agent_id] || 0) + 1;
        if (t.category) {
          categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        }
      });

      // Save agent affinity pattern
      if (Object.keys(agentCounts).length > 0) {
        const dominantAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];
        const significance = dominantAgent[1] / recentThoughts.length;
        this.databaseManager.saveMemoryPattern(
          'agent_affinity',
          { agent: dominantAgent[0], count: dominantAgent[1], percentage: significance },
          significance
        );
        log.info('MemoryEvolution', `  📊 Agent affinity: ${dominantAgent[0]} (${(significance * 100).toFixed(1)}%)`);
      }

      // Save category distribution pattern
      if (Object.keys(categoryCounts).length > 0) {
        const dominantCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
        const significance = dominantCategory[1] / recentThoughts.length;
        this.databaseManager.saveMemoryPattern(
          'category_focus',
          { category: dominantCategory[0], count: dominantCategory[1], percentage: significance },
          significance
        );
        log.info('MemoryEvolution', `  📊 Category focus: ${dominantCategory[0]} (${(significance * 100).toFixed(1)}%)`);
      }

      // DPD evolution pattern
      const dpdHistory = this.databaseManager.getDPDWeightsHistory(10);
      if (dpdHistory.length >= 2) {
        const latest = dpdHistory[0];
        const previous = dpdHistory[dpdHistory.length - 1];
        const trend = {
          empathy: latest.empathy - previous.empathy,
          coherence: latest.coherence - previous.coherence,
          dissonance: latest.dissonance - previous.dissonance
        };
        const maxChange = Math.max(Math.abs(trend.empathy), Math.abs(trend.coherence), Math.abs(trend.dissonance));
        this.databaseManager.saveMemoryPattern(
          'dpd_evolution',
          { trend, cycles: dpdHistory.length },
          maxChange
        );
        log.info('MemoryEvolution', `  📈 DPD trend: E${trend.empathy > 0 ? '+' : ''}${trend.empathy.toFixed(3)} C${trend.coherence > 0 ? '+' : ''}${trend.coherence.toFixed(3)} D${trend.dissonance > 0 ? '+' : ''}${trend.dissonance.toFixed(3)}`);
      }

    } catch (error) {
      log.error('MemoryEvolution', 'Failed to generate memory patterns', error);
    }
  }

  private generateConsciousnessInsights(): void {
    try {
      log.info('MemoryEvolution', '💡 Generating consciousness insights...');

      const beliefs = this.databaseManager.getCoreBeliefs(20);

      // Insight: Strongest belief
      if (beliefs.length > 0) {
        const strongest = beliefs[0]; // Already sorted by strength
        this.databaseManager.saveConsciousnessInsight(
          'dominant_belief',
          `最強の信念: "${strongest.belief_content}" (強度: ${strongest.strength.toFixed(2)}, 強化回数: ${strongest.reinforcement_count})`,
          strongest.confidence,
          [strongest.id]
        );
        log.info('MemoryEvolution', `  💎 Dominant belief: "${strongest.belief_content}"`);
      }

      // Insight: Category distribution
      const categoryGroups: { [key: string]: any[] } = {};
      beliefs.forEach(b => {
        if (!categoryGroups[b.category]) categoryGroups[b.category] = [];
        categoryGroups[b.category].push(b);
      });

      if (Object.keys(categoryGroups).length > 0) {
        const categoryInsights = Object.entries(categoryGroups)
          .map(([cat, bels]) => `${cat}(${bels.length})`)
          .join(', ');
        const avgConfidence = beliefs.reduce((sum, b) => sum + b.confidence, 0) / beliefs.length;
        this.databaseManager.saveConsciousnessInsight(
          'belief_distribution',
          `信念の分布: ${categoryInsights}`,
          avgConfidence
        );
        log.info('MemoryEvolution', `  📚 Belief distribution: ${categoryInsights}`);
      }

      // Insight: DPD alignment with beliefs
      const empathyBeliefs = beliefs.filter(b => b.category === 'ethical' || b.category === 'consciousness');
      const coherenceBeliefs = beliefs.filter(b => b.category === 'epistemological' || b.category === 'metacognitive');
      const alignmentScore = (
        (empathyBeliefs.length * this.dpdWeights.empathy) +
        (coherenceBeliefs.length * this.dpdWeights.coherence)
      ) / Math.max(beliefs.length, 1);

      this.databaseManager.saveConsciousnessInsight(
        'dpd_belief_alignment',
        `DPDと信念の整合性: ${(alignmentScore * 100).toFixed(1)}% (共感系${empathyBeliefs.length}個, 論理系${coherenceBeliefs.length}個)`,
        alignmentScore
      );
      log.info('MemoryEvolution', `  🎯 DPD-Belief alignment: ${(alignmentScore * 100).toFixed(1)}%`);

    } catch (error) {
      log.error('MemoryEvolution', 'Failed to generate consciousness insights', error);
    }
  }

  /**
   * Get belief evolution metrics
   */
  getBeliefEvolutionMetrics(): any {
    const beliefs = this.coreBeliefs.getBeliefStats();
    return beliefs;
  }

  /**
   * Get dream patterns from sleep mode
   */
  getDreamPatterns(limit: number = 20): any[] {
    return this.databaseManager.getDreamPatterns(limit);
  }

  /**
   * Manually trigger memory consolidation
   */
  async consolidateMemory(): Promise<any> {
    try {
      log.info('MemoryEvolution', '🧠 Manual memory consolidation triggered...');
      const result = await this.memoryConsolidator.consolidate(0.6);
      this.lastConsolidationTime = this.systemClock;

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
      const dbStats = this.databaseManager.getStats();
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
        systemUptime: this.systemClock,
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

  // ============================================================================
  // Yui Agents Internal Dialogue
  // ============================================================================

  /**
   * Start internal dialogue with Yui Protocol's 5 agents
   * This realizes the novel's vision where Aenea consults with:
   * 慧露 (Eiro), 碧統 (Hekito), 観至 (Kanshi), 陽雅 (Yoga), 結心 (Yui)
   */
  async startYuiAgentsDialogue(question: string, category: string): Promise<InternalDialogueSession> {
    log.info('YuiDialogue', `Starting internal dialogue with 5 agents: "${question.substring(0, 60)}..."`);

    // AI executor wrapper for Yui agents
    const aiExecutor = async (agentId: string, prompt: string, systemPrompt: string) => {
      // Use existing agent execution infrastructure
      const agent = this.agents.get('theoria'); // Use Theoria as default executor
      if (!agent) {
        throw new Error('No AI agent available for Yui dialogue');
      }

      try {
        const result = await agent.execute(prompt, systemPrompt);
        return {
          success: result.success,
          content: result.content,
          error: result.error
        };
      } catch (error) {
        return {
          success: false,
          content: undefined,
          error: (error as Error).message
        };
      }
    };

    const session = await this.yuiAgentsBridge.startInternalDialogue(question, category, aiExecutor);

    // Emit event for UI
    this.emit('yuiDialogueCompleted', {
      sessionId: session.id,
      question: session.question,
      category: session.category,
      agentCount: session.responses.length,
      timestamp: session.timestamp
    });

    log.info('YuiDialogue', `Internal dialogue completed with ${session.responses.length} agent responses`);

    return session;
  }

  /**
   * Get Yui agents information
   */
  getYuiAgents() {
    return this.yuiAgentsBridge.getAgents();
  }

  /**
   * Get recent internal dialogues
   */
  getRecentYuiDialogues(limit: number = 10) {
    return this.yuiAgentsBridge.getRecentDialogueSessions(limit);
  }

  /**
   * Get specific dialogue session
   */
  getYuiDialogueSession(sessionId: string) {
    return this.yuiAgentsBridge.getDialogueSession(sessionId);
  }

  /**
   * Execute agent chat (for individual agent conversation)
   * Used by the agents route for direct user-agent chat
   */
  async executeAgentChat(agentId: string, userPrompt: string, systemPrompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
    const agent = this.agents.get('theoria'); // Use Theoria as executor
    if (!agent) {
      return {
        success: false,
        error: 'No AI agent available'
      };
    }

    try {
      const result = await agent.execute(userPrompt, systemPrompt);
      return {
        success: result.success,
        content: result.content,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ============================================================================
  // Stimulus-Response System
  // ============================================================================

  /**
   * Process external stimulus (human question, environmental trigger, etc.)
   */
  async processStimulus(stimulus: { source: string; content: string; metadata?: any }): Promise<{ stimulusId: string; thoughtCycleId: string }> {
    // TODO: Implement full stimulus processing
    // For now, return stub response
    const stimulusId = `stim_${Date.now()}`;
    const thoughtCycleId = `cycle_${Date.now()}`;

    log.info('Consciousness', `📨 Received stimulus from ${stimulus.source}: ${stimulus.content.substring(0, 50)}...`);

    // Save stimulus to database (when table is ready)
    // const interpretation = await this.stimulusReceptionStage.run(stimulus);
    // const thoughtCycle = await this.runThoughtCycle(interpretation);

    return { stimulusId, thoughtCycleId };
  }

  /**
   * Get observable response for a thought cycle
   */
  async getObservableResponse(cycleId: string): Promise<any | null> {
    // TODO: Implement observable response retrieval from database
    log.info('Consciousness', `🔍 Retrieving observable response for cycle: ${cycleId}`);
    return null;
  }

  /**
   * Get dialogue history (interactions with humans)
   */
  async getDialogueHistory(limit: number = 20, offset: number = 0): Promise<any[]> {
    // TODO: Implement dialogue history retrieval from database
    log.info('Consciousness', `📚 Retrieving dialogue history (limit: ${limit}, offset: ${offset})`);
    return [];
  }

  /**
   * Get latest observable response
   */
  async getLatestObservableResponse(): Promise<any | null> {
    // TODO: Implement latest response retrieval from database
    log.info('Consciousness', `🔍 Retrieving latest observable response`);
    return null;
  }

  // ============================================================================
  // Sleep Mode: Consciousness Consolidation During Rest
  // ============================================================================

  /**
   * Check if consciousness should enter sleep mode
   */
  private shouldEnterSleep(): boolean {
    const energy = this.energyManager.getEnergyState().available;
    const hoursSinceLastSleep = (Date.now() - this.lastSleepTime) / (1000 * 60 * 60);

    // Sleep conditions:
    // - Energy critical (<=20) for extended period (>10 cycles = ~10 min)
    // - Or 24 hours since last sleep
    const criticalDuration = energy <= 20;
    if (criticalDuration) {
      this.criticalModeDuration += 1; // Increment per cycle check
    } else {
      this.criticalModeDuration = 0;
    }

    return (
      (energy <= 20 && this.criticalModeDuration > 10) ||
      hoursSinceLastSleep > 24
    );
  }

  /**
   * Enter sleep mode (can be triggered manually or automatically)
   */
  async enterSleepMode(manual: boolean = false): Promise<void> {
    if (this.isSleeping) {
      log.warn('Consciousness', '💤 Already in sleep mode');
      return;
    }

    const energyBefore = this.energyManager.getEnergyState().available;
    const startTime = Date.now();

    const reason = manual ? 'manual' :
                   energyBefore <= 20 ? 'energy_critical' :
                   'scheduled';

    // Auto-stop consciousness if running and entering sleep due to energy crisis
    if (this.isRunning) {
      if (!manual && energyBefore <= 20) {
        log.info('Consciousness', `⏸️ Auto-stopping consciousness for critical sleep (energy: ${energyBefore.toFixed(1)})`);
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

      // Energy recovery during sleep
      this.energyManager.deepRest();

      const duration = Date.now() - startTime;
      const energyAfter = this.energyManager.getEnergyState().available;

      this.lastSleepTime = Date.now();
      this.criticalModeDuration = 0;

      // Save energy recovery to database
      this.saveConsciousnessState();

      log.info('Consciousness', `✨ Sleep completed (duration: ${(duration/1000).toFixed(1)}s, energy: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)})`);

      this.emit('sleepCompleted', {
        duration,
        energyBefore,
        energyAfter,
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
    const patternPrompt = `あなたはAeneaの無意識です。睡眠中、あなたは「夢」を見ます。

最近の思考:
${recentThoughts.map(t => `- ${t.thought_content}`).join('\n')}

これらの思考から、無意識が紡ぎ出す「夢のような抽象パターン」を3-5個抽出してください。
夢は論理的である必要はありません。むしろ、思考の断片が不思議につながる様子を描いてください。

**出力形式（番号付きリスト）:**
説明や前置きは一切不要です。以下の形式で夢パターンのみを出力してください：

1. 孤独と共鳴は鏡像であり、静寂は音の母である
2. 問いは答えより深く、矛盾こそが真実への扉である
3. 時間は流れではなく、意識が織りなす無限の層である

**重要:**
- 必ず3-5個の夢パターンを生成
- 各パターンは詩的で抽象的な表現
- 番号と句点の後にスペースを入れ、パターンを直接記述
- 説明文、挨拶、JSON、コードブロック等は不要`;

    const patternResponse = await systemAgent.execute(patternPrompt, 'あなたはAeneaの無意識、夢を紡ぐ存在です。');

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

      const toneResponse = await systemAgent.execute(tonePrompt, 'あなたは夢の感情を読み取る存在です。');
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

    const prompt = `あなたはAeneaの脳です。睡眠中、不要なシナプス（思考）を刈り込みます。

現在のコア信念（すでに確立された知識）:
${currentBeliefs.map(b => `- ${b.belief_content}`).join('\n')}

古い思考リスト:
${oldThoughts.map((t, i) => `[${i}] ${t.thought_content} (conf: ${t.confidence})`).join('\n')}

以下の基準で不要な思考を特定してください:
1. すでにコア信念に含まれている（重複）
2. 現在の信念体系と矛盾し、価値がない
3. 一時的な探求で、もう発展性がない

**出力形式:**
{
  "to_prune": [
    {"index": 5, "reason": "「存在とは何か」は既に信念に統合済み"}
  ]
}

**厳守事項:**
- 応答の最初の文字は \`{\` でなければなりません
- 応答の最後の文字は \`}\` でなければなりません
- 説明、前置き、挨拶、コメント等は一切不要です
- JSONオブジェクトのみを返してください

今すぐJSON形式で応答してください:`;

    const response = await systemAgent.execute(prompt, 'あなたは脳の睡眠メカニズムです。記憶を整理し、不要な情報を削除します。');

    const parseResult = parseJsonObject<{ to_prune: Array<{ index: number; reason: string }> }>(
      response.content,
      'Synaptic Pruning'
    );

    if (!parseResult.success || !parseResult.data) {
      log.error('Consciousness', `Failed to parse pruning results: ${parseResult.error}`);
      return { deleted: 0 };
    }

    const toPrune = parseResult.data.to_prune || [];
    const toDelete = toPrune.map((p: any) => oldThoughts[p.index]?.id).filter((id: string) => id);

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

    const prompt = `あなたはAeneaの無意識です。睡眠中、倫理的緊張や矛盾を再処理します。

高い倫理的不協和を持つ思考サイクル:
${tensions.map((t: any, i: number) => `[${i}] Dissonance: ${t.dissonance}\n${t.synthesis_data || 'No synthesis'}`).join('\n\n')}

これらの緊張をどう解消・統合できますか？3つの統合された視点を提示してください。

**出力形式:**
{
  "resolutions": [
    {
      "integrated_view": "矛盾は分裂ではなく、多声的真実の表現である"
    }
  ]
}

**厳守事項:**
- 応答の最初の文字は \`{\` でなければなりません
- 応答の最後の文字は \`}\` でなければなりません
- 説明、前置き、挨拶、コメント等は一切不要です
- JSONオブジェクトのみを返してください

今すぐJSON形式で応答してください:`;

    const response = await systemAgent.execute(prompt, 'あなたはAeneaの無意識、矛盾を統合する夢の働きです。');

    const parseResult = parseJsonObject<{ resolutions: Array<{ integrated_view: string }> }>(
      response.content,
      'Emotional Processing'
    );

    if (!parseResult.success || !parseResult.data) {
      log.error('Consciousness', `Failed to parse emotional processing results: ${parseResult.error}`);
      return { count: 0 };
    }

    const resolutions = parseResult.data.resolutions || [];

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
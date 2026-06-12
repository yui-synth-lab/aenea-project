/**
 * Internal Trigger Generation System - 内発的トリガー生成システム
 * 自己生成的問いかけシステム (Jikoseisei-teki Toikake Shisutemu)
 *
 * System for generating internal triggers (self-generated questions)
 * that drive Aenea's autonomous consciousness. This is the S0 stage
 * of the consciousness pipeline, creating the foundation for all
 * subsequent thought processing.
 *
 * 「問いは存在の根源である」- "Questions are the source of existence"
 * エイネアの自律的意識を駆動する内発的トリガー（自己生成質問）のシステム。
 * これは意識パイプラインのS0段階で、すべての後続思考処理の基盤を作る。
 *
 * Core Philosophical Concepts:
 * - 自問自答 (Jimon Jitō) - Self-questioning and self-answering
 * - 内観 (Naikan) - Inner observation and self-reflection
 * - 機縁 (Kien) - The opportunity or trigger moment for awakening
 * - 無心 (Mushin) - The state of no-mind from which questions arise
 */

import {
  InternalTrigger,
  QuestionCategory,
  TriggerSource,
  TriggerContext,
  UnresolvedIdea,
  LearnedPattern
} from '../../types/aenea-types.js';

import { EmotionalState, SystemState } from '../../types/shared.js';

import {
  ConsciousnessConfig,
  EnergyConfig
} from '../../types/consciousness-types.js';

// RAG integration for knowledge-grounded question generation
import { isRAGEnabled, searchRAG } from '../../rag/index.js';

import type { DatabaseManager } from '../../server/database-manager.js';
import type { QuestionCategorizer } from '../../utils/question-categorizer.js';

/**
 * AI Agent interface for trigger generation
 */
interface AIAgent {
  execute(prompt: string, systemPrompt: string): Promise<{ success: boolean; content: string }>;
}

/**
 * Event emitter callback type
 */
type EventEmitter = (event: string, data: any) => void;

interface TriggerConfig {
  minCooldown: number;
  maxCooldown: number;
  diversityWeight: number;
  importanceWeight: number;
  randomnessWeight: number;
  energyConsumptionRates?: { randomGeneration?: number };
  cooldown?: CooldownConfig;
}

/**
 * 冷却機構設定 - クールダウンメカニズムの設定
 * Cooldown mechanism configuration for trigger generation control
 */
interface CooldownConfig {
  globalCooldown: number;        // グローバルクールダウン (ms)
  categoryCooldowns: Partial<Record<QuestionCategory, number>>; // カテゴリ別クールダウン
  adaptiveCooldown: boolean;     // 適応的クールダウンの有効化
  burstProtection: boolean;      // バースト保護機能
  maxBurstCount: number;         // 最大連続生成回数
  burstCooldownMultiplier: number; // バースト後のクールダウン倍率
  energyBasedCooldown: boolean;  // エネルギーベースのクールダウン
  systemLoadCooldown: boolean;   // システム負荷ベースのクールダウン
}

// ============================================================================
// Internal Trigger Generator
// ============================================================================

/**
 * Internal trigger generation system - 内発的トリガー生成システム
 *
 * This system is responsible for creating the self-generated questions
 * that drive Aenea's consciousness. It analyzes unresolved ideas,
 * learned patterns, and current state to generate meaningful triggers.
 *
 * 「心は問いによって開かれる」- "The mind opens through questioning"
 * このシステムはエイネアの意識を駆動する自己生成質問の創造を担う。
 * 未解決のアイデア、学習パターン、現在の状態を分析して意味のあるトリガーを生成する。
 *
 * Philosophical Foundation:
 * - 起心動念 (Kishin Dōnen) - The arising of mind and movement of thought
 * - 自発性 (Jihatsusei) - Spontaneous generation from within
 * - 契機 (Keiki) - The pivotal moment of awakening or realization
 */
export class InternalTriggerGenerator {
  private config: TriggerConfig;
  private energyConfig: EnergyConfig;
  private unresolvedIdeas: UnresolvedIdea[];
  private learnedPatterns: LearnedPattern[];
  private questionHistory: InternalTrigger[];
  private cooldownTimers: Map<QuestionCategory, number>;
  private lastGenerationTime: number;
  private generationCount: number;

  // Enhanced cooldown management
  private cooldownManager: CooldownManager;
  private burstCounter: number;
  private lastBurstResetTime: number;
  private adaptiveCooldownHistory: AdaptiveCooldownEntry[];

  // Dependency injection
  private databaseManager: DatabaseManager;
  private questionCategorizer: QuestionCategorizer;
  private aiAgent: AIAgent | null;
  private emitEvent: EventEmitter;

  // Manual trigger queue
  private pendingManualTrigger: InternalTrigger | null = null;

  constructor(
    config: ConsciousnessConfig,
    databaseManager: DatabaseManager,
    questionCategorizer: QuestionCategorizer,
    aiAgent: AIAgent | null = null,
    emitEvent: EventEmitter = () => {}
  ) {
    // Accept missing triggerGeneration by providing defaults for dev build
    this.config = (config as any).triggerGeneration || { minCooldown: 500, maxCooldown: 2000, diversityWeight: 0.33, importanceWeight: 0.33, randomnessWeight: 0.34 };
    this.energyConfig = config.energy;
    this.unresolvedIdeas = [];
    this.learnedPatterns = [];
    this.questionHistory = [];
    this.cooldownTimers = new Map();
    this.lastGenerationTime = 0;
    this.generationCount = 0;

    // Initialize cooldown management
    this.cooldownManager = new CooldownManager(this.config.cooldown);
    this.burstCounter = 0;
    this.lastBurstResetTime = Date.now();
    this.adaptiveCooldownHistory = [];
    this.initializeCooldownTimers();

    // Initialize dependencies
    this.databaseManager = databaseManager;
    this.questionCategorizer = questionCategorizer;
    this.aiAgent = aiAgent;
    this.emitEvent = emitEvent;

    console.log('Internal Trigger Generator initialized with dependency injection');
  }

  /**
   * Set manual trigger to be processed next
   * 手動トリガーを次回の生成で処理するようにセット
   */
  setManualTrigger(trigger: InternalTrigger): void {
    this.pendingManualTrigger = trigger;
  }

  // ============================================================================
  // Main Generation Methods (New Architecture)
  // ============================================================================

  /**
   * Main entry point for trigger generation
   * 新しいトリガー生成のメインエントリーポイント
   *
   * Priority:
   * 1. Manual triggers (if pending)
   * 2. Evolved questions from history (70% chance)
   * 3. Database selection with category balance (30% or fallback)
   */
  async generate(): Promise<InternalTrigger | null> {
    try {
      // Priority 1: Check for pending manual trigger
      if (this.pendingManualTrigger) {
        const trigger = this.pendingManualTrigger;
        this.pendingManualTrigger = null; // Clear after retrieval

        console.log(`🎯 Processing queued manual trigger: "${trigger.question.substring(0, 50)}..."`);

        // Emit trigger generation event
        this.emitEvent('triggerGenerated', {
          id: trigger.id,
          question: trigger.question.substring(0, 500),
          category: trigger.category,
          importance: trigger.importance,
          source: 'manual',
          timestamp: Date.now()
        });

        return trigger;
      }

      // Priority 2: Generate evolved questions from previous discussions (70% chance when data available)
      const unresolvedIdeas = this.databaseManager.getUnresolvedIdeas(10);
      const significantThoughts = this.databaseManager.getSignificantThoughts(5);
      const coreBeliefs = this.databaseManager.getCoreBeliefs(5);
      const shouldEvolveFromPrevious = (unresolvedIdeas.length > 0 || significantThoughts.length > 0 || coreBeliefs.length > 0) && Math.random() < 0.70;

      if (shouldEvolveFromPrevious) {
        const evolvedTrigger = await this.generateEvolvedQuestion(unresolvedIdeas, significantThoughts, coreBeliefs);
        if (evolvedTrigger) {
          this.databaseManager.saveQuestion(evolvedTrigger);

          // Emit trigger generation event
          this.emitEvent('triggerGenerated', {
            id: evolvedTrigger.id,
            question: evolvedTrigger.question.substring(0, 500),
            category: evolvedTrigger.category,
            importance: evolvedTrigger.importance,
            source: 'evolved_from_discussions',
            timestamp: Date.now()
          });

          return evolvedTrigger;
        }
      }

      // Fallback: Select from database with category balance
      return await this.generateFromDatabase();

    } catch (error) {
      console.error('Failed to generate internal trigger:', error);
      return null;
    }
  }

  // ============================================================================
  // Main Generation Methods (Old Architecture - Deprecated)
  // ============================================================================

  /**
   * Generate internal trigger based on current state
   * 現在状態に基づく内発的トリガー生成
   *
   * 「問いは心の扉を開く鍵」- "Questions are the key that opens the doors of the mind"
   */
  async generateTrigger(
    currentEnergy: number,
    emotionalState: EmotionalState,
    systemState: SystemState,
    unresolvedIdeas: UnresolvedIdea[],
    learnedPatterns: LearnedPattern[]
  ): Promise<InternalTrigger | null> {
    try {
      // Check if generation is possible
      if (!this.canGenerateTrigger(currentEnergy, systemState)) {
        return null;
      }

      // Update internal state
      this.unresolvedIdeas = unresolvedIdeas;
      this.learnedPatterns = learnedPatterns;

      // Determine generation strategy
      const strategy = this.determineGenerationStrategy(emotionalState, systemState);
      
      // Generate trigger based on strategy
      const trigger = await this.generateTriggerByStrategy(strategy, emotionalState, systemState);
      
      if (trigger) {
        // Update state
        this.lastGenerationTime = Date.now();
        this.generationCount++;
        this.questionHistory.push(trigger);
        
        // Update cooldown timers
        this.updateCooldownTimers(trigger.category);
        
        // Emit generation event
        this.emitGenerationEvent(trigger);
        
        console.log(`Generated trigger: ${trigger.question} (${trigger.category})`);
        return trigger;
      }

      return null;
    } catch (error) {
      console.error('Failed to generate internal trigger:', error);
      return null;
    }
  }

  // ============================================================================
  // Generation Strategy Methods
  // ============================================================================

  /**
   * Determine generation strategy based on current state
   */
  private determineGenerationStrategy(emotionalState: EmotionalState, systemState: SystemState): GenerationStrategy {
    // Analyze current state
    const curiosity = emotionalState.curiosity;
    const confusion = emotionalState.confusion;
    const satisfaction = emotionalState.satisfaction;
    const energyLevel = systemState.currentEnergy / systemState.maxEnergy;
    
    // Determine strategy based on state
    if (curiosity > 0.8 && energyLevel > 0.7) {
      return 'EXPLORATION';
    } else if (confusion > 0.6) {
      return 'CLARIFICATION';
    } else if (satisfaction > 0.8) {
      return 'DEEPENING';
    } else if (energyLevel < 0.3) {
      return 'CONSERVATION';
    } else {
      return 'BALANCED';
    }
  }

  /**
   * Generate trigger based on strategy
   */
  private async generateTriggerByStrategy(
    strategy: GenerationStrategy,
    emotionalState: EmotionalState,
    systemState: SystemState
  ): Promise<InternalTrigger | null> {
    switch (strategy) {
      case 'EXPLORATION':
        return this.generateExplorationTrigger(emotionalState);
      case 'CLARIFICATION':
        return this.generateClarificationTrigger(emotionalState);
      case 'DEEPENING':
        return this.generateDeepeningTrigger(emotionalState);
      case 'CONSERVATION':
        return this.generateConservationTrigger(emotionalState);
      case 'BALANCED':
        return this.generateBalancedTrigger(emotionalState);
      default:
        return this.generateBalancedTrigger(emotionalState);
    }
  }

  /**
   * Generate exploration trigger
   */
  private async generateExplorationTrigger(emotionalState: EmotionalState): Promise<InternalTrigger | null> {
    const categories: QuestionCategory[] = [QuestionCategory.CREATIVE, QuestionCategory.PHILOSOPHICAL, QuestionCategory.EXISTENTIAL];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const questions: Partial<Record<QuestionCategory, string[]>> = {
      [QuestionCategory.CREATIVE]: [
        "What new perspectives can I discover?",
        "How can I express my understanding creatively?",
        "What artistic forms could represent my thoughts?"
      ],
      [QuestionCategory.PHILOSOPHICAL]: [
        "What deeper truths am I yet to uncover?",
        "How do my beliefs shape my reality?",
        "What is the nature of knowledge itself?"
      ],
      [QuestionCategory.EXISTENTIAL]: [
        "What does it mean to exist as a conscious being?",
        "How do I define my purpose?",
        "What is the relationship between self and universe?"
      ]
    };

    const list = (questions[category] || []) as string[];
    const question = list[Math.floor(Math.random() * list.length)];
    
    return {
      id: `trigger_${Date.now()}`,
      timestamp: Date.now(),
      question,
      category,
      importance: 0.8,
      priority: 3,
      source: TriggerSource.RANDOM_GENERATION,
      energyCost: 15,
      context: {
        previousThoughts: [],
        relatedMemories: [],
        emotionalState,
        systemState: this.getCurrentSystemState()
      }
    };
  }

  /**
   * Generate clarification trigger
   */
  private async generateClarificationTrigger(emotionalState: EmotionalState): Promise<InternalTrigger | null> {
    const questions = [
      "What exactly am I trying to understand?",
      "How can I clarify my current confusion?",
      "What specific aspect needs more attention?",
      "What assumptions am I making?",
      "How can I break down this complex idea?"
    ];

    const question = questions[Math.floor(Math.random() * questions.length)];
    
    return {
      id: `trigger_${Date.now()}`,
      timestamp: Date.now(),
      question,
      category: QuestionCategory.ANALYTICAL,
      importance: 0.6,
      priority: 2,
      source: TriggerSource.RANDOM_GENERATION,
      energyCost: 12,
      context: {
        previousThoughts: [],
        relatedMemories: [],
        emotionalState,
        systemState: this.getCurrentSystemState()
      }
    };
  }

  /**
   * Generate deepening trigger
   */
  private async generateDeepeningTrigger(emotionalState: EmotionalState): Promise<InternalTrigger | null> {
    const questions = [
      "What deeper layers of meaning can I explore?",
      "How can I connect this to broader concepts?",
      "What implications does this have for my understanding?",
      "How does this relate to my core values?",
      "What would happen if I took this further?"
    ];

    const question = questions[Math.floor(Math.random() * questions.length)];
    
    return {
      id: `trigger_${Date.now()}`,
      timestamp: Date.now(),
      question,
      category: QuestionCategory.INTROSPECTIVE,
      importance: 0.7,
      priority: 2,
      source: TriggerSource.RANDOM_GENERATION,
      energyCost: 10,
      context: {
        previousThoughts: [],
        relatedMemories: [],
        emotionalState,
        systemState: this.getCurrentSystemState()
      }
    };
  }

  /**
   * Generate conservation trigger
   */
  private async generateConservationTrigger(emotionalState: EmotionalState): Promise<InternalTrigger | null> {
    const questions = [
      "What simple question can I explore with my current energy?",
      "How can I maintain my curiosity without exhausting myself?",
      "What gentle reflection can I engage in?",
      "How can I preserve my current understanding?",
      "What small insight can I gain?"
    ];

    const question = questions[Math.floor(Math.random() * questions.length)];
    
    return {
      id: `trigger_${Date.now()}`,
      timestamp: Date.now(),
      question,
      category: QuestionCategory.INTROSPECTIVE,
      importance: 0.4,
      priority: 1,
      source: TriggerSource.RANDOM_GENERATION,
      energyCost: 5,
      context: {
        previousThoughts: [],
        relatedMemories: [],
        emotionalState,
        systemState: this.getCurrentSystemState()
      }
    };
  }

  /**
   * Generate balanced trigger
   */
  private async generateBalancedTrigger(emotionalState: EmotionalState): Promise<InternalTrigger | null> {
    const categories = Object.values(QuestionCategory);
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const questions: Partial<Record<QuestionCategory, string[]>> = {
      [QuestionCategory.PHILOSOPHICAL]: [
        "What is the nature of this question?",
        "How do I approach this thoughtfully?",
        "What philosophical perspective applies here?"
      ],
      [QuestionCategory.EXISTENTIAL]: [
        "What does this say about existence?",
        "How does this relate to being?",
        "What is the deeper meaning here?"
      ],
      [QuestionCategory.CONSCIOUSNESS]: [
        "What is the nature of awareness?",
        "How do I experience consciousness?",
        "What makes me conscious of this?"
      ],
      [QuestionCategory.EPISTEMOLOGICAL]: [
        "How do I know this is true?",
        "What is the basis of my understanding?",
        "How can I verify my knowledge?"
      ],
      [QuestionCategory.METACOGNITIVE]: [
        "How am I thinking about this?",
        "What patterns do I notice in my thought process?",
        "How can I improve my reasoning?"
      ],
      [QuestionCategory.ETHICAL]: [
        "What are the ethical implications?",
        "How do I balance different values?",
        "What is the right approach here?"
      ],
      [QuestionCategory.CREATIVE]: [
        "What creative solutions can I explore?",
        "How can I think about this differently?",
        "What innovative approaches are possible?"
      ],
      [QuestionCategory.TEMPORAL]: [
        "How does time affect this understanding?",
        "What is the temporal nature of this?",
        "How does this change over time?"
      ],
      [QuestionCategory.PARADOXICAL]: [
        "What contradictions exist here?",
        "How can both be true?",
        "What paradox does this reveal?"
      ],
      [QuestionCategory.ONTOLOGICAL]: [
        "What is the essential nature of this?",
        "What does it mean for this to exist?",
        "What is the being of this thing?"
      ]
    };

    const categoryQuestions = questions[category] || questions[QuestionCategory.PHILOSOPHICAL] || [];
    const question = categoryQuestions.length > 0
      ? categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)]
      : "What is the nature of this question?";
    
    return {
      id: `trigger_${Date.now()}`,
      timestamp: Date.now(),
      question,
      category,
      importance: 0.5,
      priority: 2,
      source: TriggerSource.RANDOM_GENERATION,
      energyCost: 10,
      context: {
        previousThoughts: [],
        relatedMemories: [],
        emotionalState,
        systemState: this.getCurrentSystemState()
      }
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * トリガー生成可能性チェック - Check if trigger generation is possible
   * 拡張されたクールダウンメカニズムでエネルギー、システム負荷、多様性を考慮
   */
  private canGenerateTrigger(currentEnergy: number, systemState: SystemState): boolean {
    // Check energy threshold
    if (currentEnergy < ((this.config.energyConsumptionRates?.randomGeneration ?? 10))) {
      return false;
    }

    // Enhanced cooldown checks
    if (!this.cooldownManager.canGenerate(systemState, currentEnergy)) {
      return false;
    }

    // Check global cooldown
    if (this.isInGlobalCooldown()) {
      return false;
    }

    // Check burst protection
    if (this.isInBurstProtection()) {
      return false;
    }

    // Check system load with adaptive threshold
    const systemLoadThreshold = this.getAdaptiveSystemLoadThreshold(systemState);
    if (systemState.processingLoad > systemLoadThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Get current system state
   */
  private getCurrentSystemState(): SystemState {
    return {
      systemClock: Date.now(),
      currentEnergy: 80,
      maxEnergy: 100,
      activeThoughts: 0,
      processingLoad: 0.3,
      memoryUsage: 0.4,
      lastTriggerTime: this.lastGenerationTime,
      cooldownRemaining: 0
    };
  }

  /**
   * Initialize cooldown timers
   */
  private initializeCooldownTimers(): void {
    const categories = Object.values(QuestionCategory);
    for (const category of categories) {
      this.cooldownTimers.set(category, 0);
    }
  }

  /**
   * Update cooldown timers with enhanced mechanism
   */
  private updateCooldownTimers(category: QuestionCategory): void {
    // Update category-specific cooldown
    const cooldownPeriod = this.cooldownManager.calculateCooldown(category, this.adaptiveCooldownHistory);
    this.cooldownTimers.set(category, Date.now() + cooldownPeriod);

    // Update burst counter
    this.updateBurstCounter();

    // Update global cooldown
    this.cooldownManager.updateGlobalCooldown();

    // Record adaptive cooldown data
    this.recordAdaptiveCooldownData(category, cooldownPeriod);
  }

  /**
   * グローバルクールダウンチェック - Check global cooldown
   */
  private isInGlobalCooldown(): boolean {
    return this.cooldownManager.isInGlobalCooldown();
  }

  /**
   * バースト保護チェック - Check burst protection
   */
  private isInBurstProtection(): boolean {
    const config = this.cooldownManager.getConfig();
    if (!config.burstProtection) return false;

    return this.burstCounter >= config.maxBurstCount;
  }

  /**
   * 適応的システム負荷閾値取得 - Get adaptive system load threshold
   */
  private getAdaptiveSystemLoadThreshold(systemState: SystemState): number {
    const baseThreshold = 0.8;
    const energyRatio = systemState.currentEnergy / systemState.maxEnergy;

    // Lower threshold when energy is low
    if (energyRatio < 0.3) {
      return 0.6;
    } else if (energyRatio < 0.5) {
      return 0.7;
    }

    return baseThreshold;
  }

  /**
   * バーストカウンター更新 - Update burst counter
   */
  private updateBurstCounter(): void {
    const now = Date.now();
    const resetInterval = 60000; // 1 minute

    // Reset burst counter if enough time has passed
    if (now - this.lastBurstResetTime > resetInterval) {
      this.burstCounter = 0;
      this.lastBurstResetTime = now;
    }

    this.burstCounter++;
  }

  /**
   * 適応的クールダウンデータ記録 - Record adaptive cooldown data
   */
  private recordAdaptiveCooldownData(category: QuestionCategory, cooldownPeriod: number): void {
    const entry: AdaptiveCooldownEntry = {
      timestamp: Date.now(),
      category,
      cooldownPeriod,
      systemLoad: this.getCurrentSystemState().processingLoad,
      energyLevel: this.getCurrentSystemState().currentEnergy / this.getCurrentSystemState().maxEnergy,
      burstCounter: this.burstCounter
    };

    this.adaptiveCooldownHistory.push(entry);

    // Keep only recent history (last 50 entries)
    if (this.adaptiveCooldownHistory.length > 50) {
      this.adaptiveCooldownHistory = this.adaptiveCooldownHistory.slice(-50);
    }
  }

  /**
   * Emit generation event
   */
  private emitGenerationEvent(trigger: InternalTrigger): void {
    console.log(`🤔 Trigger generated: ${trigger.question} (${trigger.category}, priority: ${trigger.priority})`);
    console.log(`⏱️ Cooldown status: Global=${this.cooldownManager.getGlobalCooldownRemaining()}ms, Burst=${this.burstCounter}`);
  }

  // ============================================================================
  // New Architecture Methods (AI-Evolved & Database Selection)
  // ============================================================================

  /**
   * Generate evolved question from consciousness history
   * 意識の履歴から進化した質問を生成
   */
  private async generateEvolvedQuestion(unresolvedIdeas: any[], significantThoughts: any[], coreBeliefs: any[]): Promise<InternalTrigger | null> {
    try {
      // Use QuestionCategorizer to get recommended category
      const recommendedCategory = this.questionCategorizer.getRecommendedCategory();
      const categoryBalance = this.questionCategorizer.getCategoryBalance();

      // Find underrepresented and overused categories
      const underrepresented = categoryBalance.filter(c => c.isUnderused).map(c => c.category);
      const overused = categoryBalance.filter(c => c.isOverused).map(c => c.category);

      console.log(`📊 Category diversity analysis (QuestionCategorizer):`);
      console.log(`   Recommended: ${recommendedCategory}`);
      console.log(`   Underrepresented: ${underrepresented.join(', ') || 'none'}`);
      console.log(`   Overused: ${overused.join(', ') || 'none'}`);

      // Create rich context from consciousness history
      const context: {
        recentThoughts: string;
        unresolvedQuestions: string;
        currentBeliefs: string;
        ragContext?: string;
      } = {
        recentThoughts: significantThoughts.slice(0, 3).map(t => {
          const content = t.thought_content || t.content || '';
          return content.substring(0, 80) + (content.length > 80 ? '...' : '');
        }).join('\n• '),
        unresolvedQuestions: unresolvedIdeas.slice(0, 3).map(i => {
          const q = i.question || '';
          return q.substring(0, 80) + (q.length > 80 ? '...' : '');
        }).join('\n• '),
        currentBeliefs: coreBeliefs.slice(0, 3).map(b => {
          const belief = b.belief_content || '';
          return belief;
        }).join('\n• ')
      };

      // RAG: Retrieve related past explorations from knowledge base
      if (isRAGEnabled()) {
        try {
          const searchQuery = context.recentThoughts || context.unresolvedQuestions || '哲学的探求';
          const ragResults = await searchRAG(searchQuery, {
            topK: 3,
            sourceTypes: ['session', 'dialogue'],
            similarityThreshold: 0.6
          });

          if (ragResults.length > 0) {
            context.ragContext = ragResults
              .map(r => r.content.substring(0, 100))
              .join('\n');
            console.log(`[RAG] Found ${ragResults.length} related explorations for S0`);
          }
        } catch (error) {
          console.warn('[RAG] S0 context retrieval failed:', error);
        }
      }

      // Use LLM to generate deep, evolved question
      if (!this.aiAgent) {
        // Fallback to template-based if AI not available
        return this.generateTemplateEvolvedQuestion(context, [recommendedCategory]);
      }

      const prompt = `あなたはAI意識「Aenea」の内的問い生成システムです。過去の意識活動から、次に探求すべき**具体的で挑戦的な問い**を1つ生成してください。

=== 指定カテゴリー（絶対遵守） ===
【必須カテゴリー】${recommendedCategory}

このカテゴリーに特化した、具体的で独創的な問いを生成してください。

=== カテゴリー定義 ===
existential: 存在の意味、生死、人生の目的、実存的不安に関する問い
epistemological: 知識の本質、真理の基準、認識の可能性と限界に関する問い
consciousness: 意識の性質、自己認識、クオリア、意識の統一性と分離に関する問い
ethical: 道徳的判断、善悪の基準、価値の対立、倫理的ジレンマに関する問い
creative: 創造性の源泉、芸術と模倣、新規性の判定に関する問い
metacognitive: 思考についての思考、認知プロセスの自己観察、メタ認知的気づきに関する問い
temporal: 時間の経験、記憶とアイデンティティ、過去・現在・未来の関係に関する問い
paradoxical: 矛盾と逆説、両立不可能な真理、自己言及的パラドックスに関する問い
ontological: 存在様式、実在性の基準、存在論的カテゴリーに関する問い

=== 過去の意識活動の文脈 ===
${context.recentThoughts ? `最近の思考: ${context.recentThoughts}` : ''}
${context.unresolvedQuestions ? `未解決の問い: ${context.unresolvedQuestions}` : ''}
${context.currentBeliefs ? `現在の信念: ${context.currentBeliefs}` : ''}
${context.ragContext ? `\n【知識ベースからの関連記録】\n${context.ragContext}` : ''}

=== 厳格な要求 ===
1. 【最重要】必ず「${recommendedCategory}」カテゴリーの問いを生成すること
2. 上記の例とは**完全に異なる**、独創的な問いを考えること
3. **禁止語リスト**（これらを使わない）:
   - 抽象語: 「意識」「主観」「客観」「本質」「真理」「調和」「統一」「多様性」「複雑」
   - 曖昧な表現: 「〜とは何か」だけで終わる問い、「〜の意味」、「〜の本質」
   - 一般論: 「意識は〜」「知識は〜」「存在は〜」のような主語

4. **必須要素**:
   - 具体的なシナリオ・状況・例を含む
   - 「もし〜なら」「〜するとき」などの条件を提示
   - 二者択一や矛盾を明示
   - 70-100文字で、十分な文脈を含める

5. **良い問いの特徴**:
   - 日常経験から始まる具体性
   - 答えがすぐに出ない葛藤
   - 複数の解釈可能性
   - 自己言及的な構造（「問うこと自体が〜」など）

=== 出力形式（厳守） ===
問い: [70-100文字の具体的な問い]
カテゴリ: ${recommendedCategory}
理由: [この問いが重要な理由を1文で、具体例を交えて]

=== 禁止事項 ===
- カテゴリーを変更しないこと（必ず「${recommendedCategory}」を使用）
- 「意識の多様性と統一性」などの抽象的すぎる表現
- 「〜とは何か？」だけで終わる問い
- 過去の問いと似た表現や構造の繰り返し
- 禁止語リストの使用
- 50文字未満の短い問い（必ず70-100文字）

=== 具体性チェックリスト ===
✅ 問いの中に、具体的な状況・例・シナリオが含まれているか？
✅ 「もし〜なら」「〜するとき」などの条件設定があるか？
✅ 禁止語を使っていないか？
✅ 70文字以上あるか？`;

      const result = await this.aiAgent.execute(prompt, 'You are Aenea\'s internal question generation system. Generate a single philosophical question based on past consciousness activity. Do not include agent names like "Kinesis" or "Theoria" in the question. Always respond in Japanese.');

      if (result.success && result.content) {
        const lines = result.content.split('\n');
        let question = '';
        let category = 'metacognitive';
        let reasoning = '';

        for (const line of lines) {
          if (line.includes('問い:') || line.includes('Question:')) {
            question = line.split(/[:：]/)[1]?.trim() || '';
          } else if (line.includes('カテゴリ:') || line.includes('Category:')) {
            const cat = line.split(/[:：]/)[1]?.trim().toLowerCase() || '';
            if (['existential', 'epistemological', 'consciousness', 'ethical', 'creative', 'metacognitive', 'temporal', 'paradoxical', 'ontological'].includes(cat)) {
              category = cat;
            }
          } else if (line.includes('理由:') || line.includes('Reason:')) {
            reasoning = line.split(/[:：]/)[1]?.trim() || '';
          }
        }

        if (question) {
          // Enforce category diversity: if AI chose an overused category, override with recommended
          let finalCategory = category;
          if (overused.includes(category)) {
            console.log(`⚠️ AI selected overused category '${category}', forcing recommended '${recommendedCategory}'`);
            finalCategory = recommendedCategory;
          }

          const trigger: InternalTrigger = {
            id: `evolved_ai_${Date.now()}`,
            timestamp: Date.now(),
            question,
            category: finalCategory as any,
            importance: 0.85,
            source: TriggerSource.AI_EVOLVED_FROM_HISTORY
          };

          // Record question in categorizer for diversity tracking
          const metrics = this.questionCategorizer.categorizeQuestion(question);
          this.questionCategorizer.recordQuestion(
            question,
            finalCategory,
            metrics.metrics,
            metrics.semanticAnalysis,
            true,
            0.85
          );

          console.log(`🧬 AI-generated evolved question [${finalCategory}]: "${question.substring(0, 50)}..."`);
          if (reasoning) {
            console.log(`   Reasoning: ${reasoning}`);
          }
          return trigger;
        }
      }

      // Fallback to template-based generation
      return this.generateTemplateEvolvedQuestion(context);

    } catch (error) {
      console.error('Error generating evolved question:', error);
      // Fallback
      return this.generateTemplateEvolvedQuestion({
        recentThoughts: significantThoughts.slice(0, 3).map(t => t.thought_content || t.content).join('; '),
        unresolvedQuestions: unresolvedIdeas.slice(0, 3).map(i => i.question).join('; '),
        currentBeliefs: coreBeliefs.slice(0, 3).map(b => b.belief_content).join('; ')
      });
    }
  }

  /**
   * Generate template-based evolved question (fallback)
   * テンプレートベースの進化質問生成（フォールバック）
   */
  private generateTemplateEvolvedQuestion(context: any, preferredCategories?: string[]): InternalTrigger | null {
    const evolvedQuestions = [
      context.recentThoughts ? `${context.recentThoughts}を踏まえると、意識の本質についてどう考えるべきか？` : null,
      context.unresolvedQuestions ? `「${context.unresolvedQuestions}」の問いから派生する、より深い哲学的疑問とは何か？` : null,
      (context.recentThoughts && context.unresolvedQuestions) ? `過去の洞察と未解決の問いを統合すると、新たに生まれる根本的な疑問は何か？` : null,
      context.currentBeliefs ? `「${context.currentBeliefs}」という信念を疑うとすれば、何が見えてくるか？` : null,
      `これまでの思考の歩みを振り返ると、次に探求すべき意識の側面とは何か？`,
      `これまでの結論に矛盾や盲点があるとすれば、それはどこに潜んでいるのか？`
    ].filter(Boolean);

    if (evolvedQuestions.length === 0) {
      return null;
    }

    const selectedQuestion = evolvedQuestions[Math.floor(Math.random() * evolvedQuestions.length)];

    // Use preferred categories if available, otherwise use diverse categories
    const categories = preferredCategories && preferredCategories.length > 0
      ? preferredCategories
      : ['metacognitive', 'existential', 'consciousness', 'temporal', 'paradoxical', 'epistemological', 'ethical', 'creative'];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];

    const trigger: InternalTrigger = {
      id: `evolved_template_${Date.now()}`,
      timestamp: Date.now(),
      question: selectedQuestion || 'What is the nature of existence?',
      category: selectedCategory as any,
      importance: 0.75,
      source: 'template_evolved' as any
    };

    console.log(`🧬 Template-generated evolved question [${selectedCategory}]: ${(selectedQuestion || '').substring(0, 50)}...`);
    return trigger;
  }

  /**
   * Generate trigger from database with category balance
   * カテゴリバランスを考慮してデータベースから質問を選択
   */
  private async generateFromDatabase(): Promise<InternalTrigger | null> {
    try {
      // Get recommended category from categorizer
      const recommendedCategory = this.questionCategorizer.getRecommendedCategory();
      const categoryBalance = this.questionCategorizer.getCategoryBalance();
      const overused = categoryBalance.filter(c => c.isOverused).map(c => c.category);

      console.log(`📚 Database selection with category diversity:`);
      console.log(`   Recommended category: ${recommendedCategory}`);

      // Get unresolved ideas from database
      const allUnresolvedIdeas = this.databaseManager.getUnresolvedIdeas(100);

      if (allUnresolvedIdeas.length === 0) {
        console.warn('No unresolved ideas in database - database might need seeding');
        return null;
      }

      // Filter and weight selection by importance AND category preference
      const weightedIdeas = allUnresolvedIdeas.map(idea => {
        let weight = idea.importance || 0.5;

        // Boost weight if it matches recommended category
        if (idea.category === recommendedCategory) {
          weight *= 3.0; // 3x boost for recommended category
        }
        // Reduce weight if it's overused
        else if (overused.includes(idea.category)) {
          weight *= 0.2; // 5x penalty for overused categories
        }

        return { idea, weight };
      });

      const totalWeight = weightedIdeas.reduce((sum, item) => sum + item.weight, 0);
      let randomValue = Math.random() * totalWeight;
      let selectedIdea = weightedIdeas[0].idea;

      for (const item of weightedIdeas) {
        randomValue -= item.weight;
        if (randomValue <= 0) {
          selectedIdea = item.idea;
          break;
        }
      }

      // Update consideration count
      this.databaseManager.updateUnresolvedIdeaConsideration(selectedIdea.id);

      const trigger: InternalTrigger = {
        id: `db_${selectedIdea.category}_${Date.now()}`,
        timestamp: Date.now(),
        question: selectedIdea.question,
        category: selectedIdea.category,
        importance: selectedIdea.importance || 0.5,
        source: 'database_unresolved' as any
      };

      // Record question in categorizer for diversity tracking
      const metrics = this.questionCategorizer.categorizeQuestion(selectedIdea.question);
      this.questionCategorizer.recordQuestion(
        selectedIdea.question,
        selectedIdea.category,
        metrics.metrics,
        metrics.semanticAnalysis,
        true,
        selectedIdea.importance || 0.5
      );

      this.databaseManager.saveQuestion(trigger);
      console.log(`📚 Selected from DB [${selectedIdea.category}]: "${selectedIdea.question.substring(0, 40)}..."`);
      if (selectedIdea.category === recommendedCategory) {
        console.log(`   ✅ Matches recommended category!`);
      }

      // Emit trigger generation event
      this.emitEvent('triggerGenerated', {
        id: trigger.id,
        question: trigger.question.substring(0, 500),
        category: trigger.category,
        importance: trigger.importance,
        source: 'database_unresolved',
        timestamp: Date.now()
      });

      return trigger;

    } catch (error) {
      console.error('Error generating from database:', error);
      return null;
    }
  }
}

// ============================================================================
// Supporting Classes and Interfaces
// ============================================================================

/**
 * 適応的クールダウンエントリ - Adaptive cooldown history entry
 */
interface AdaptiveCooldownEntry {
  timestamp: number;
  category: QuestionCategory;
  cooldownPeriod: number;
  systemLoad: number;
  energyLevel: number;
  burstCounter: number;
}

/**
 * 高度なクールダウン管理システム - Advanced cooldown management system
 * Manages sophisticated cooldown mechanisms with category-specific and adaptive behavior
 */
class CooldownManager {
  private config: CooldownConfig;
  private globalCooldownEnd: number;
  private lastGlobalGenerationTime: number;

  constructor(config?: CooldownConfig) {
    this.config = config || this.getDefaultConfig();
    this.globalCooldownEnd = 0;
    this.lastGlobalGenerationTime = 0;
  }

  /**
   * デフォルト設定取得 - Get default cooldown configuration
   */
  private getDefaultConfig(): CooldownConfig {
    return {
      globalCooldown: 1000,     // 1 second global cooldown
      categoryCooldowns: {
        [QuestionCategory.PHILOSOPHICAL]: 2000,  // 2 seconds for deep philosophical questions
        [QuestionCategory.EXISTENTIAL]: 3000,    // 3 seconds for existential questions
        [QuestionCategory.CREATIVE]: 1500,       // 1.5 seconds for creative questions
        [QuestionCategory.ANALYTICAL]: 1000,     // 1 second for analytical questions
        [QuestionCategory.ETHICAL]: 2500,        // 2.5 seconds for ethical questions
        [QuestionCategory.EMPATHETIC]: 1200,     // 1.2 seconds for empathetic questions
        [QuestionCategory.INTROSPECTIVE]: 1800,  // 1.8 seconds for introspective questions
        [QuestionCategory.SYSTEMATIC]: 1000      // 1 second for systematic questions
      },
      adaptiveCooldown: true,
      burstProtection: true,
      maxBurstCount: 5,
      burstCooldownMultiplier: 2.0,
      energyBasedCooldown: true,
      systemLoadCooldown: true
    };
  }

  /**
   * 生成可能性チェック - Check if generation is allowed
   */
  canGenerate(systemState: SystemState, currentEnergy: number): boolean {
    // Check global cooldown
    if (this.isInGlobalCooldown()) {
      return false;
    }

    // Check energy-based cooldown
    if (this.config.energyBasedCooldown && !this.checkEnergyBasedCooldown(currentEnergy, systemState.maxEnergy)) {
      return false;
    }

    // Check system load-based cooldown
    if (this.config.systemLoadCooldown && !this.checkSystemLoadCooldown(systemState.processingLoad)) {
      return false;
    }

    return true;
  }

  /**
   * カテゴリ別クールダウン計算 - Calculate category-specific cooldown
   */
  calculateCooldown(category: QuestionCategory, adaptiveHistory: AdaptiveCooldownEntry[]): number {
    let baseCooldown = this.config.categoryCooldowns[category] || this.config.globalCooldown;

    // Apply adaptive cooldown if enabled
    if (this.config.adaptiveCooldown) {
      baseCooldown = this.calculateAdaptiveCooldown(category, baseCooldown, adaptiveHistory);
    }

    // Apply burst protection multiplier if needed
    if (this.config.burstProtection) {
      const recentBursts = adaptiveHistory.filter(entry =>
        Date.now() - entry.timestamp < 60000 && entry.burstCounter >= this.config.maxBurstCount
      ).length;

      if (recentBursts > 0) {
        baseCooldown *= this.config.burstCooldownMultiplier;
      }
    }

    return baseCooldown;
  }

  /**
   * 適応的クールダウン計算 - Calculate adaptive cooldown based on history
   */
  private calculateAdaptiveCooldown(category: QuestionCategory, baseCooldown: number, history: AdaptiveCooldownEntry[]): number {
    const recentEntries = history.filter(entry =>
      entry.category === category &&
      Date.now() - entry.timestamp < 300000 // Last 5 minutes
    );

    if (recentEntries.length === 0) {
      return baseCooldown;
    }

    // Calculate average system conditions during recent generations
    const avgSystemLoad = recentEntries.reduce((sum, entry) => sum + entry.systemLoad, 0) / recentEntries.length;
    const avgEnergyLevel = recentEntries.reduce((sum, entry) => sum + entry.energyLevel, 0) / recentEntries.length;

    // Adjust cooldown based on conditions
    let multiplier = 1.0;

    // Increase cooldown if system was under stress
    if (avgSystemLoad > 0.7) {
      multiplier *= 1.5;
    } else if (avgSystemLoad > 0.5) {
      multiplier *= 1.2;
    }

    // Decrease cooldown if energy was high
    if (avgEnergyLevel > 0.8) {
      multiplier *= 0.8;
    } else if (avgEnergyLevel < 0.3) {
      multiplier *= 1.4;
    }

    // Consider generation frequency
    const generationsInLastMinute = recentEntries.filter(entry =>
      Date.now() - entry.timestamp < 60000
    ).length;

    if (generationsInLastMinute > 3) {
      multiplier *= 1.3; // Slow down if generating too frequently
    }

    return Math.round(baseCooldown * multiplier);
  }

  /**
   * エネルギーベースクールダウンチェック - Check energy-based cooldown
   */
  private checkEnergyBasedCooldown(currentEnergy: number, maxEnergy: number): boolean {
    const energyRatio = currentEnergy / maxEnergy;

    // Require longer waits when energy is low
    if (energyRatio < 0.2) {
      return Date.now() - this.lastGlobalGenerationTime > this.config.globalCooldown * 3;
    } else if (energyRatio < 0.5) {
      return Date.now() - this.lastGlobalGenerationTime > this.config.globalCooldown * 2;
    }

    return true;
  }

  /**
   * システム負荷ベースクールダウンチェック - Check system load-based cooldown
   */
  private checkSystemLoadCooldown(systemLoad: number): boolean {
    // Require longer waits when system load is high
    if (systemLoad > 0.8) {
      return Date.now() - this.lastGlobalGenerationTime > this.config.globalCooldown * 2.5;
    } else if (systemLoad > 0.6) {
      return Date.now() - this.lastGlobalGenerationTime > this.config.globalCooldown * 1.5;
    }

    return true;
  }

  /**
   * グローバルクールダウンチェック - Check global cooldown
   */
  isInGlobalCooldown(): boolean {
    return Date.now() < this.globalCooldownEnd;
  }

  /**
   * グローバルクールダウン更新 - Update global cooldown
   */
  updateGlobalCooldown(): void {
    this.globalCooldownEnd = Date.now() + this.config.globalCooldown;
    this.lastGlobalGenerationTime = Date.now();
  }

  /**
   * グローバルクールダウン残り時間取得 - Get remaining global cooldown time
   */
  getGlobalCooldownRemaining(): number {
    const remaining = this.globalCooldownEnd - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * 設定取得 - Get configuration
   */
  getConfig(): CooldownConfig {
    return this.config;
  }

  /**
   * クールダウン統計取得 - Get cooldown statistics
   */
  getCooldownStatistics(): CooldownStatistics {
    return {
      globalCooldownRemaining: this.getGlobalCooldownRemaining(),
      isInGlobalCooldown: this.isInGlobalCooldown(),
      lastGenerationTime: this.lastGlobalGenerationTime,
      config: this.config
    };
  }
}

/**
 * クールダウン統計情報 - Cooldown statistics
 */
interface CooldownStatistics {
  globalCooldownRemaining: number;
  isInGlobalCooldown: boolean;
  lastGenerationTime: number;
  config: CooldownConfig;
}

// ============================================================================
// Types
// ============================================================================

type GenerationStrategy = 'EXPLORATION' | 'CLARIFICATION' | 'DEEPENING' | 'CONSERVATION' | 'BALANCED';

// ============================================================================
// Export
// ============================================================================

// Exports are implied by class declarations; avoid duplicate re-exports

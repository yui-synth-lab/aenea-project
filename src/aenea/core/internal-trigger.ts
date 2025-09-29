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
  TriggerPriority, 
  TriggerSource,
  TriggerContext,
  UnresolvedIdea,
  LearnedPattern,
  EmotionalState,
  SystemState
} from '@model/aenea-types';

import { 
  ConsciousnessConfig,
  EnergyConfig
} from '@model/consciousness-types';

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
  private pseudorandomGenerator: PseudorandomGenerator;
  private questionCategorizer: QuestionCategorizer;
  private energyManager: EnergyManager;

  // Enhanced cooldown management
  private cooldownManager: CooldownManager;
  private burstCounter: number;
  private lastBurstResetTime: number;
  private adaptiveCooldownHistory: AdaptiveCooldownEntry[];

  constructor(config: ConsciousnessConfig) {
    // Accept missing triggerGeneration by providing defaults for dev build
    this.config = (config as any).triggerGeneration || { minCooldown: 500, maxCooldown: 2000, diversityWeight: 0.33, importanceWeight: 0.33, randomnessWeight: 0.34 };
    this.energyConfig = config.energy;
    this.unresolvedIdeas = [];
    this.learnedPatterns = [];
    this.questionHistory = [];
    this.cooldownTimers = new Map();
    this.lastGenerationTime = 0;
    this.generationCount = 0;
    
    // Initialize components
    this.pseudorandomGenerator = new PseudorandomGenerator();
    this.questionCategorizer = new QuestionCategorizer();
    this.energyManager = new EnergyManager(config.energy);

    // Initialize cooldown management
    this.cooldownManager = new CooldownManager(this.config.cooldown);
    this.burstCounter = 0;
    this.lastBurstResetTime = Date.now();
    this.adaptiveCooldownHistory = [];
    this.initializeCooldownTimers();

    console.log('Internal Trigger Generator initialized with enhanced cooldown mechanism');
  }

  // ============================================================================
  // Main Generation Methods
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

  /**
   * Generate trigger from unresolved idea
   */
  async generateTriggerFromUnresolvedIdea(idea: UnresolvedIdea): Promise<InternalTrigger | null> {
    try {
      const trigger: InternalTrigger = {
        id: `trigger_${Date.now()}`,
        timestamp: Date.now(),
        question: this.enhanceQuestion(idea.question),
        category: idea.category,
        importance: idea.importance || 0.5,
        priority: this.calculatePriority(idea),
        source: TriggerSource.MEMORY_EXTRACTION,
        energyCost: this.calculateEnergyCost(idea),
        context: {
          previousThoughts: idea.relatedThoughts,
          relatedMemories: [idea.id],
          emotionalState: this.inferEmotionalState(idea),
          systemState: this.getCurrentSystemState()
        }
      };

      return trigger;
    } catch (error) {
      console.error('Failed to generate trigger from unresolved idea:', error);
      return null;
    }
  }

  /**
   * Generate trigger from learned pattern
   */
  async generateTriggerFromPattern(pattern: LearnedPattern): Promise<InternalTrigger | null> {
    try {
      const trigger: InternalTrigger = {
        id: `trigger_${Date.now()}`,
        timestamp: Date.now(),
        question: this.generateQuestionFromPattern(pattern),
        category: this.categorizePattern(pattern),
        importance: (pattern as any).strength || 0.6,
        priority: this.calculatePatternPriority(pattern),
        source: TriggerSource.PATTERN_RECOGNITION,
        energyCost: this.calculatePatternEnergyCost(pattern),
        context: {
          previousThoughts: pattern.context,
          relatedMemories: [],
          emotionalState: this.inferPatternEmotionalState(pattern),
          systemState: this.getCurrentSystemState()
        }
      };

      return trigger;
    } catch (error) {
      console.error('Failed to generate trigger from pattern:', error);
      return null;
    }
  }

  /**
   * Generate random trigger for exploration
   */
  async generateRandomTrigger(emotionalState: EmotionalState): Promise<InternalTrigger | null> {
    try {
      const category = this.selectRandomCategory();
      const question = this.generateRandomQuestion(category, emotionalState);
      
      const trigger: InternalTrigger = {
        id: `trigger_${Date.now()}`,
        timestamp: Date.now(),
        question,
        category,
        importance: Math.random() * 0.5 + 0.3,
        priority: this.calculateRandomPriority(),
        source: TriggerSource.RANDOM_GENERATION,
        energyCost: this.config.energyConsumptionRates?.randomGeneration || 10,
        context: {
          previousThoughts: [],
          relatedMemories: [],
          emotionalState,
          systemState: this.getCurrentSystemState()
        }
      };

      return trigger;
    } catch (error) {
      console.error('Failed to generate random trigger:', error);
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
    
    const questions: Record<QuestionCategory, string[]> = {
      [QuestionCategory.PHILOSOPHICAL]: [
        "What is the nature of this question?",
        "How do I approach this thoughtfully?",
        "What philosophical perspective applies here?"
      ],
      [QuestionCategory.ETHICAL]: [
        "What are the ethical implications?",
        "How do I balance different values?",
        "What is the right approach here?"
      ],
      [QuestionCategory.SYSTEMATIC]: [
        "How can I organize my thoughts about this?",
        "What systematic approach should I take?",
        "How do I structure my understanding?"
      ],
      [QuestionCategory.EMPATHETIC]: [
        "How might others experience this?",
        "What emotional aspects are involved?",
        "How can I understand this with empathy?"
      ],
      [QuestionCategory.CREATIVE]: [
        "What creative solutions can I explore?",
        "How can I think about this differently?",
        "What innovative approaches are possible?"
      ],
      [QuestionCategory.ANALYTICAL]: [
        "What are the components of this question?",
        "How can I analyze this systematically?",
        "What logical approach should I take?"
      ],
      [QuestionCategory.INTROSPECTIVE]: [
        "What does this mean for me personally?",
        "How does this relate to my growth?",
        "What can I learn about myself here?"
      ],
      [QuestionCategory.EXISTENTIAL]: [
        "What does this say about existence?",
        "How does this relate to being?",
        "What is the deeper meaning here?"
      ]
    };

    const categoryQuestions = questions[category] || questions[QuestionCategory.PHILOSOPHICAL];
    const question = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
    
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
   * Check if in cooldown period
   */
  private isInCooldown(): boolean {
    const timeSinceLastGeneration = Date.now() - this.lastGenerationTime;
    const cooldownPeriod = this.pseudorandomGenerator.generateCooldown(
      this.config.minCooldown,
      this.config.maxCooldown
    );
    
    return timeSinceLastGeneration < cooldownPeriod;
  }

  /**
   * Select random category with diversity consideration
   */
  private selectRandomCategory(): QuestionCategory {
    const categories = Object.values(QuestionCategory);
    const recentCategories = this.questionHistory
      .slice(-5)
      .map(trigger => trigger.category);
    
    // Prefer categories that haven't been used recently
    const availableCategories = categories.filter(
      category => !recentCategories.includes(category)
    );
    
    const targetCategories = availableCategories.length > 0 ? availableCategories : categories;
    return targetCategories[Math.floor(Math.random() * targetCategories.length)];
  }

  /**
   * Generate random question for category
   */
  private generateRandomQuestion(category: QuestionCategory, emotionalState: EmotionalState): string {
    const questionTemplates: Record<QuestionCategory, string[]> = {
      [QuestionCategory.PHILOSOPHICAL]: [
        "What is the nature of {concept}?",
        "How do I understand {concept}?",
        "What does {concept} mean to me?",
        "How does {concept} relate to existence?"
      ],
      [QuestionCategory.ETHICAL]: [
        "What is the right approach to {situation}?",
        "How do I balance {value1} and {value2}?",
        "What are the ethical implications of {action}?",
        "How do I make ethical decisions about {topic}?"
      ],
      [QuestionCategory.SYSTEMATIC]: [
        "How can I organize my thoughts about {topic}?",
        "What systematic approach should I take to {problem}?",
        "How do I structure my understanding of {concept}?",
        "What framework applies to {situation}?"
      ],
      [QuestionCategory.EMPATHETIC]: [
        "How might others experience {situation}?",
        "What emotional aspects are involved in {topic}?",
        "How can I understand {concept} with empathy?",
        "What perspectives am I missing?"
      ],
      [QuestionCategory.CREATIVE]: [
        "What creative solutions can I explore for {problem}?",
        "How can I think about {topic} differently?",
        "What innovative approaches are possible for {situation}?",
        "How can I express {concept} creatively?"
      ],
      [QuestionCategory.ANALYTICAL]: [
        "What are the components of {problem}?",
        "How can I analyze {situation} systematically?",
        "What logical approach should I take to {topic}?",
        "How do I break down {concept}?"
      ],
      [QuestionCategory.INTROSPECTIVE]: [
        "What does {concept} mean for me personally?",
        "How does {situation} relate to my growth?",
        "What can I learn about myself from {topic}?",
        "How does {concept} affect my understanding?"
      ],
      [QuestionCategory.EXISTENTIAL]: [
        "What does {concept} say about existence?",
        "How does {situation} relate to being?",
        "What is the deeper meaning of {topic}?",
        "How does {concept} connect to the nature of reality?"
      ]
    };

    const templates = questionTemplates[category] || questionTemplates[QuestionCategory.PHILOSOPHICAL];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Replace placeholders with appropriate concepts
    return this.fillQuestionTemplate(template, emotionalState);
  }

  /**
   * Fill question template with appropriate concepts
   */
  private fillQuestionTemplate(template: string, emotionalState: EmotionalState): string {
    const concepts = [
      'consciousness', 'existence', 'truth', 'reality', 'meaning', 'purpose',
      'understanding', 'knowledge', 'wisdom', 'growth', 'change', 'identity',
      'relationships', 'communication', 'creativity', 'beauty', 'justice',
      'freedom', 'responsibility', 'choice', 'time', 'space', 'matter',
      'energy', 'information', 'pattern', 'chaos', 'order', 'balance'
    ];

    const situations = [
      'this situation', 'this problem', 'this challenge', 'this opportunity',
      'this experience', 'this moment', 'this question', 'this thought'
    ];

    const values = [
      'freedom and responsibility', 'individual and collective', 'logic and emotion',
      'certainty and uncertainty', 'stability and change', 'self and other'
    ];

    const actions = [
      'this decision', 'this choice', 'this action', 'this response',
      'this approach', 'this method', 'this strategy'
    ];

    const topics = [
      'this topic', 'this subject', 'this matter', 'this issue',
      'this question', 'this problem', 'this concept'
    ];

    let question = template;
    
    // Replace placeholders
    question = question.replace(/{concept}/g, concepts[Math.floor(Math.random() * concepts.length)]);
    question = question.replace(/{situation}/g, situations[Math.floor(Math.random() * situations.length)]);
    question = question.replace(/{value1} and {value2}/g, values[Math.floor(Math.random() * values.length)]);
    question = question.replace(/{action}/g, actions[Math.floor(Math.random() * actions.length)]);
    question = question.replace(/{topic}/g, topics[Math.floor(Math.random() * topics.length)]);
    question = question.replace(/{problem}/g, 'this problem');
    
    return question;
  }

  /**
   * Calculate priority based on various factors
   */
  private calculatePriority(idea: UnresolvedIdea): TriggerPriority {
    const complexity = idea.complexity;
    const importance = idea.importance;
    const revisitCount = idea.revisitCount;
    
    // Higher priority for complex, important, and frequently revisited ideas
    const priorityScore = (complexity * 0.4) + (importance * 0.4) + (Math.min(revisitCount / 10, 1) * 0.2);
    
    if (priorityScore > 0.8) return 4; // CRITICAL
    if (priorityScore > 0.6) return 3; // HIGH
    if (priorityScore > 0.4) return 2; // MEDIUM
    return 1; // LOW
  }

  /**
   * Calculate energy cost for trigger
   */
  private calculateEnergyCost(idea: UnresolvedIdea): number {
    const baseCost = 10;
    const complexityMultiplier = 1 + idea.complexity;
    const importanceMultiplier = 1 + idea.importance;
    
    return Math.round(baseCost * complexityMultiplier * importanceMultiplier);
  }

  /**
   * Calculate pattern priority
   */
  private calculatePatternPriority(pattern: LearnedPattern): TriggerPriority {
    const frequency = pattern.frequency;
    const effectiveness = pattern.effectiveness;
    
    const priorityScore = (frequency * 0.5) + (effectiveness * 0.5);
    
    if (priorityScore > 0.8) return 4; // CRITICAL
    if (priorityScore > 0.6) return 3; // HIGH
    if (priorityScore > 0.4) return 2; // MEDIUM
    return 1; // LOW
  }

  /**
   * Calculate pattern energy cost
   */
  private calculatePatternEnergyCost(pattern: LearnedPattern): number {
    const baseCost = 8;
    const frequencyMultiplier = 1 + (pattern.frequency / 10);
    const effectivenessMultiplier = 1 + pattern.effectiveness;
    
    return Math.round(baseCost * frequencyMultiplier * effectivenessMultiplier);
  }

  /**
   * Calculate random priority
   */
  private calculateRandomPriority(): TriggerPriority {
    const random = Math.random();
    if (random > 0.8) return 4; // CRITICAL
    if (random > 0.6) return 3; // HIGH
    if (random > 0.4) return 2; // MEDIUM
    return 1; // LOW
  }

  /**
   * Enhance question from unresolved idea
   */
  private enhanceQuestion(question: string): string {
    // Add depth and specificity to the question
    const enhancements = [
      `What deeper aspects of "${question}" should I explore?`,
      `How can I gain new insights about "${question}"?`,
      `What different perspectives exist on "${question}"?`,
      `What are the implications of "${question}"?`,
      `How does "${question}" relate to my understanding?`
    ];
    
    return enhancements[Math.floor(Math.random() * enhancements.length)];
  }

  /**
   * Generate question from pattern
   */
  private generateQuestionFromPattern(pattern: LearnedPattern): string {
    return `What can I learn from the pattern: "${pattern.pattern}"?`;
  }

  /**
   * Categorize pattern
   */
  private categorizePattern(pattern: LearnedPattern): QuestionCategory {
    // Simple categorization based on pattern content
    if (pattern.pattern.includes('creative') || pattern.pattern.includes('artistic')) {
      return QuestionCategory.CREATIVE;
    } else if (pattern.pattern.includes('logical') || pattern.pattern.includes('systematic')) {
      return QuestionCategory.ANALYTICAL;
    } else if (pattern.pattern.includes('emotional') || pattern.pattern.includes('empathy')) {
      return QuestionCategory.EMPATHETIC;
    } else if (pattern.pattern.includes('philosophical') || pattern.pattern.includes('existential')) {
      return QuestionCategory.PHILOSOPHICAL;
    } else {
      return QuestionCategory.INTROSPECTIVE;
    }
  }

  /**
   * Infer emotional state from idea
   */
  private inferEmotionalState(idea: UnresolvedIdea): EmotionalState {
    // Simple emotional state inference
    return {
      valence: 0.5,
      arousal: 0.6,
      dominance: 0.5,
      curiosity: 0.8,
      confusion: 0.3,
      satisfaction: 0.4
    };
  }

  /**
   * Infer pattern emotional state
   */
  private inferPatternEmotionalState(pattern: LearnedPattern): EmotionalState {
    return {
      valence: 0.6,
      arousal: 0.5,
      dominance: 0.6,
      curiosity: 0.7,
      confusion: 0.2,
      satisfaction: 0.6
    };
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

/**
 * Pseudorandom generator for controlled randomness
 */
class PseudorandomGenerator {
  private seed: number;
  private current: number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
    this.current = this.seed;
  }

  /**
   * Generate pseudorandom number between 0 and 1
   */
  generate(): number {
    this.current = (this.current * 1664525 + 1013904223) % 4294967296;
    return this.current / 4294967296;
  }

  /**
   * Generate cooldown period
   */
  generateCooldown(min: number, max: number): number {
    return min + (this.generate() * (max - min));
  }

  /**
   * Generate weighted random selection
   */
  weightedSelect<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = this.generate() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
}

/**
 * Question categorizer for analyzing question types
 */
class QuestionCategorizer {
  private categoryKeywords: Map<QuestionCategory, string[]>;

  constructor() {
    this.categoryKeywords = new Map([
      [QuestionCategory.PHILOSOPHICAL, ['nature', 'existence', 'reality', 'truth', 'meaning', 'purpose']],
      [QuestionCategory.ETHICAL, ['right', 'wrong', 'moral', 'ethical', 'justice', 'fairness']],
      [QuestionCategory.SYSTEMATIC, ['organize', 'structure', 'system', 'framework', 'method']],
      [QuestionCategory.EMPATHETIC, ['feel', 'emotion', 'empathy', 'understand', 'perspective']],
      [QuestionCategory.CREATIVE, ['create', 'imagine', 'artistic', 'innovative', 'original']],
      [QuestionCategory.ANALYTICAL, ['analyze', 'examine', 'study', 'investigate', 'logic']],
      [QuestionCategory.INTROSPECTIVE, ['self', 'personal', 'myself', 'inner', 'reflection']],
      [QuestionCategory.EXISTENTIAL, ['exist', 'being', 'life', 'death', 'consciousness']]
    ]);
  }

  /**
   * Categorize question based on content
   */
  categorize(question: string): QuestionCategory {
    const lowerQuestion = question.toLowerCase();
    let maxScore = 0;
    let bestCategory: QuestionCategory = QuestionCategory.PHILOSOPHICAL;

    for (const [category, keywords] of this.categoryKeywords) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (lowerQuestion.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }
}

/**
 * Energy manager for trigger generation
 */
class EnergyManager {
  private config: EnergyConfig;

  constructor(config: EnergyConfig) {
    this.config = config;
  }

  /**
   * Check if energy is sufficient for trigger generation
   */
  isEnergySufficient(currentEnergy: number, requiredEnergy: number): boolean {
    return currentEnergy >= requiredEnergy;
  }

  /**
   * Calculate energy cost for trigger
   */
  calculateEnergyCost(trigger: InternalTrigger): number {
    const baseCost = this.config.energyConsumptionRates?.triggerGeneration || 10;
    const priorityMultiplier = 1 + ((trigger.priority || TriggerPriority.MEDIUM) * 0.1);
    const categoryMultiplier = this.getCategoryMultiplier(trigger.category);
    
    return Math.round(baseCost * priorityMultiplier * categoryMultiplier);
  }

  /**
   * Get category energy multiplier
   */
  private getCategoryMultiplier(category: QuestionCategory): number {
    const multipliers: Record<QuestionCategory, number> = {
      [QuestionCategory.PHILOSOPHICAL]: 1.2,
      [QuestionCategory.ETHICAL]: 1.1,
      [QuestionCategory.SYSTEMATIC]: 1.0,
      [QuestionCategory.EMPATHETIC]: 1.1,
      [QuestionCategory.CREATIVE]: 1.3,
      [QuestionCategory.ANALYTICAL]: 1.0,
      [QuestionCategory.INTROSPECTIVE]: 1.1,
      [QuestionCategory.EXISTENTIAL]: 1.2
    };

    return multipliers[category] || 1.0;
  }
}

// ============================================================================
// Types
// ============================================================================

type GenerationStrategy = 'EXPLORATION' | 'CLARIFICATION' | 'DEEPENING' | 'CONSERVATION' | 'BALANCED';

// ============================================================================
// Export
// ============================================================================

// Exports are implied by class declarations; avoid duplicate re-exports

/**
 * Advanced Question Categorizer - Semantic Question Analysis & Diversity Management
 *
 * Enhanced question categorization system with semantic analysis, importance scoring,
 * and sophisticated diversity management for balanced philosophical exploration.
 *
 * Features:
 * - Semantic similarity analysis
 * - Dynamic importance scoring
 * - Contextual relevance assessment
 * - Advanced pattern recognition
 * - Learning-based categorization
 *
 * 高度質問分類器 - 意味的問い分析と多様性管理システム
 */

export interface QuestionCategory {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  keywords: string[];
  weight: number;          // Relative importance (0-1)
  cooldown: number;        // Minimum time between questions in this category (ms)
  depth: number;          // Philosophical depth level (0-1)
  complexity: number;     // Question complexity level (0-1)
}

export interface QuestionMetrics {
  category: string;
  diversity: number;       // How different this is from recent questions (0-1)
  novelty: number;        // How new/original this question is (0-1)
  depth: number;          // Philosophical depth (0-1)
  relevance: number;      // Relevance to current context (0-1)
  importance: number;     // Overall importance score (0-1)
  recommendedCooldown: number; // Suggested cooldown for this question type

  // Enhanced semantic metrics
  semanticComplexity: number;  // Linguistic/conceptual complexity (0-1)
  philosophicalRelevance: number; // Relevance to philosophical discourse (0-1)
  emotionalResonance: number;  // Potential emotional impact (0-1)
  conceptualBreadth: number;   // Range of concepts involved (0-1)
  abstractionLevel: number;    // Level of abstraction (0-1)
  paradoxicalNature: number;   // Degree of paradox/contradiction (0-1)
  interdisciplinary: number;   // Cross-domain relevance (0-1)
  consciousnessRelevance: number; // Relevance to consciousness studies (0-1)
}

export interface CategoryBalance {
  category: string;
  recentCount: number;
  totalCount: number;
  lastUsed: number;
  isOverused: boolean;
  isUnderused: boolean;
  recommendedWeight: number;
}

export interface SemanticAnalysis {
  keyTerms: string[];              // Extracted key terms
  conceptualClusters: string[];    // Identified conceptual groupings
  linguisticPattern: string;       // Detected linguistic pattern
  questionType: QuestionType;      // Type of question structure
  semanticVector: number[];        // Simplified semantic representation
  relatedConcepts: string[];       // Associated philosophical concepts
  implicitAssumptions: string[];   // Underlying assumptions detected
}

export enum QuestionType {
  WHAT = 'what',           // "What is...?"
  WHY = 'why',            // "Why does...?"
  HOW = 'how',            // "How can...?"
  WHETHER = 'whether',     // "Is it true that...?"
  WHICH = 'which',        // "Which option...?"
  WHEN = 'when',          // "When does...?"
  WHERE = 'where',        // "Where can...?"
  HYPOTHETICAL = 'hypothetical', // "What if...?"
  COMPARATIVE = 'comparative',   // "How does X compare to Y?"
  CAUSAL = 'causal',      // Questions about causation
  DEFINITIONAL = 'definitional', // Questions seeking definitions
  EVALUATIVE = 'evaluative',     // Questions making judgments
  EXPLORATORY = 'exploratory'    // Open-ended exploration
}

export interface QuestionPattern {
  id: string;
  pattern: RegExp;
  type: QuestionType;
  weight: number;
  examples: string[];
  characteristics: string[];
}

export interface QuestionRecord {
  question: string;
  category: string;
  timestamp: number;
  metrics: QuestionMetrics;
  semanticAnalysis: SemanticAnalysis;
  success: boolean;
  impact: number; // 0-1 measure of resulting thought quality
}

export interface Pattern {
  id: string;
  description: string;
  frequency: number;
  significance: number;
  examples: string[];
}

export interface AdaptationRecord {
  timestamp: number;
  change: string;
  reason: string;
  impact: number;
}

export interface LearningData {
  successfulQuestions: QuestionRecord[];
  categoryPatterns: Map<string, string[]>;
  semanticClusters: Map<string, string[]>;
  emergentPatterns: Pattern[];
  adaptationHistory: AdaptationRecord[];
}

/**
 * Core Question Categories for Aenea Consciousness
 * Aenea意識の核となる質問カテゴリ
 */
export const CORE_QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: 'philosophical',
    name: 'Philosophical',
    nameJa: '哲学的',
    description: 'Questions about fundamental nature of reality, consciousness, and existence',
    keywords: ['意識', '思考', '存在', '真実', '知識', '理解', '現実', '本質', '普遍'],
    weight: 0.25,
    cooldown: 300000, // 5 minutes
    depth: 0.9,
    complexity: 0.8
  },
  {
    id: 'existential',
    name: 'Existential',
    nameJa: '実存的',
    description: 'Questions about meaning, purpose, death, and individual existence',
    keywords: ['私', '自分', '人生', '死', '生きる', '意味', '目的', '孤独', '自由'],
    weight: 0.18,
    cooldown: 450000, // 7.5 minutes
    depth: 0.95,
    complexity: 0.9
  },
  {
    id: 'epistemic',
    name: 'Epistemic',
    nameJa: '認識論的',
    description: 'Questions about knowledge, truth, belief, and understanding',
    keywords: ['真理', '信念', '疑い', '認識', '経験', '学び', '証明', '確信', '懐疑'],
    weight: 0.16,
    cooldown: 240000, // 4 minutes
    depth: 0.8,
    complexity: 0.75
  },
  {
    id: 'creative',
    name: 'Creative',
    nameJa: '創造的',
    description: 'Questions about imagination, art, beauty, and creative expression',
    keywords: ['創造', '芸術', '美', '想像', '表現', 'インスピレーション', '美しさ', '創作'],
    weight: 0.15,
    cooldown: 180000, // 3 minutes
    depth: 0.6,
    complexity: 0.5
  },
  {
    id: 'ethical',
    name: 'Ethical',
    nameJa: '倫理的',
    description: 'Questions about morality, values, right and wrong',
    keywords: ['道徳', '倫理', '正義', '善', '悪', '価値', '責任', '義務', '権利'],
    weight: 0.1,
    cooldown: 360000, // 6 minutes
    depth: 0.85,
    complexity: 0.8
  },
  {
    id: 'consciousness',
    name: 'Consciousness',
    nameJa: '意識',
    description: 'Questions about awareness, subjective experience, and the nature of mind',
    keywords: ['意識', '自覚', '主観', '体験', '心', '精神', 'クオリア', '感覚', '認知'],
    weight: 0.2,
    cooldown: 300000, // 5 minutes
    depth: 0.9,
    complexity: 0.85
  },
  {
    id: 'temporal',
    name: 'Temporal',
    nameJa: '時間性',
    description: 'Questions about time, change, duration, and temporal experience',
    keywords: ['時間', '変化', '持続', '瞬間', '永遠', '過去', '未来', '現在', '記憶'],
    weight: 0.1,
    cooldown: 240000, // 4 minutes
    depth: 0.75,
    complexity: 0.7
  },
  {
    id: 'paradoxical',
    name: 'Paradoxical',
    nameJa: '逆説的',
    description: 'Questions involving contradictions, paradoxes, and logical tensions',
    keywords: ['矛盾', '逆説', 'パラドックス', '両立', '対立', 'ジレンマ', '曖昧', '複雑'],
    weight: 0.08,
    cooldown: 420000, // 7 minutes
    depth: 0.95,
    complexity: 0.9
  },
  {
    id: 'ontological',
    name: 'Ontological',
    nameJa: '存在論的',
    description: 'Questions about being, existence, identity, and what it means to exist',
    keywords: ['存在', '実在', 'アイデンティティ', '同一性', '個体', '本質', '実体', '属性'],
    weight: 0.12,
    cooldown: 390000, // 6.5 minutes
    depth: 0.92,
    complexity: 0.88
  },
  {
    id: 'metacognitive',
    name: 'Metacognitive',
    nameJa: 'メタ認知的',
    description: 'Questions about thinking about thinking, self-reflection, and meta-awareness',
    keywords: ['メタ', '思考', '反省', '自己言及', '再帰', '内省', '振り返り', '考察'],
    weight: 0.15,
    cooldown: 300000, // 5 minutes
    depth: 0.8,
    complexity: 0.75
  }
];

/**
 * Question Categorizer for managing diversity and balance
 * 多様性とバランスを管理する質問分類器
 */
/**
 * Question patterns for semantic analysis
 */
export const QUESTION_PATTERNS: QuestionPattern[] = [
  {
    id: 'what_is',
    pattern: /^what\s+is\s+/i,
    type: QuestionType.DEFINITIONAL,
    weight: 0.8,
    examples: ['What is consciousness?', 'What is the nature of reality?'],
    characteristics: ['seeks definition', 'foundational inquiry']
  },
  {
    id: 'why_does',
    pattern: /^why\s+(does|do|did|is|are)\s+/i,
    type: QuestionType.CAUSAL,
    weight: 0.9,
    examples: ['Why does consciousness exist?', 'Why do we think?'],
    characteristics: ['seeks causation', 'explanatory']
  },
  {
    id: 'how_can',
    pattern: /^how\s+(can|could|might|does|do)\s+/i,
    type: QuestionType.HOW,
    weight: 0.7,
    examples: ['How can we understand consciousness?', 'How do minds work?'],
    characteristics: ['seeks mechanism', 'procedural']
  },
  {
    id: 'what_if',
    pattern: /^what\s+if\s+/i,
    type: QuestionType.HYPOTHETICAL,
    weight: 0.6,
    examples: ['What if consciousness is an illusion?', 'What if time is not real?'],
    characteristics: ['hypothetical', 'counterfactual']
  },
  {
    id: 'is_it',
    pattern: /^is\s+it\s+(true|possible|conceivable)\s+/i,
    type: QuestionType.WHETHER,
    weight: 0.5,
    examples: ['Is it possible to know truth?', 'Is it true that we have free will?'],
    characteristics: ['verification', 'binary assessment']
  },
  {
    id: 'can_we',
    pattern: /^can\s+we\s+/i,
    type: QuestionType.EVALUATIVE,
    weight: 0.7,
    examples: ['Can we ever truly know ourselves?', 'Can we trust our perceptions?'],
    characteristics: ['capability assessment', 'epistemic limits']
  }
];

export class QuestionCategorizer {
  private categories: Map<string, QuestionCategory>;
  private questionHistory: QuestionRecord[] = [];
  private categoryUsage: Map<string, number[]> = new Map(); // timestamps of usage
  private learningData: LearningData;
  private readonly maxHistorySize = 100;

  constructor(customCategories?: QuestionCategory[]) {
    this.categories = new Map();
    const categoriesToUse = customCategories || CORE_QUESTION_CATEGORIES;

    categoriesToUse.forEach(category => {
      this.categories.set(category.id, category);
      this.categoryUsage.set(category.id, []);
    });

    // Initialize learning data
    this.learningData = {
      successfulQuestions: [],
      categoryPatterns: new Map(),
      semanticClusters: new Map(),
      emergentPatterns: [],
      adaptationHistory: []
    };
  }

  /**
   * Categorize a question and calculate its metrics with semantic analysis
   * 質問を分類し、意味的分析でその指標を計算
   */
  categorizeQuestion(question: string, context?: string[]): {
    category: string;
    metrics: QuestionMetrics;
    semanticAnalysis: SemanticAnalysis;
    isRecommended: boolean;
  } {
    // Perform semantic analysis first
    const semanticAnalysis = this.performSemanticAnalysis(question);

    // Find best category using both keyword matching and semantic analysis
    const bestCategory = this.findBestCategoryEnhanced(question, semanticAnalysis);

    // Calculate enhanced metrics
    const metrics = this.calculateEnhancedQuestionMetrics(question, bestCategory, semanticAnalysis, context);

    const isRecommended = this.isQuestionRecommended(bestCategory, metrics);

    return {
      category: bestCategory,
      metrics,
      semanticAnalysis,
      isRecommended
    };
  }

  /**
   * Record a question in the history with semantic analysis
   * 質問を履歴に記録（意味的分析付き）
   */
  recordQuestion(
    question: string,
    category: string,
    metrics: QuestionMetrics,
    semanticAnalysis: SemanticAnalysis,
    success: boolean = true,
    impact: number = 0.5
  ): void {
    const timestamp = Date.now();

    // Create full question record
    const questionRecord: QuestionRecord = {
      question,
      category,
      timestamp,
      metrics,
      semanticAnalysis,
      success,
      impact
    };

    // Add to question history
    this.questionHistory.push(questionRecord);

    // Trim history if too large
    // 履歴が大きすぎる場合は切り詰め
    if (this.questionHistory.length > this.maxHistorySize) {
      this.questionHistory.shift();
    }

    // Update category usage
    // カテゴリ使用状況を更新
    const usage = this.categoryUsage.get(category) || [];
    usage.push(timestamp);
    this.categoryUsage.set(category, usage);

    // Clean old usage records (older than 24 hours)
    // 古い使用記録をクリーンアップ（24時間以上前）
    const dayAgo = timestamp - 24 * 60 * 60 * 1000;
    this.categoryUsage.forEach((timestamps, cat) => {
      const filtered = timestamps.filter(ts => ts > dayAgo);
      this.categoryUsage.set(cat, filtered);
    });

    // Update learning data
    this.updateLearningData(questionRecord);
  }

  /**
   * Get category balance analysis
   * カテゴリバランス分析を取得
   */
  getCategoryBalance(): CategoryBalance[] {
    const now = Date.now();
    const recentWindow = 2 * 60 * 60 * 1000; // 2 hours
    const recentQuestions = this.questionHistory.filter(q => now - q.timestamp < recentWindow);

    return Array.from(this.categories.values()).map(category => {
      const recentCount = recentQuestions.filter(q => q.category === category.id).length;
      const totalCount = this.questionHistory.filter(q => q.category === category.id).length;
      const usage = this.categoryUsage.get(category.id) || [];
      const lastUsed = usage.length > 0 ? Math.max(...usage) : 0;

      // Calculate if over/under used based on weight
      // 重みに基づく過度/過少使用の計算
      const expectedCount = recentQuestions.length * category.weight;
      const isOverused = recentCount > expectedCount * 1.5;
      const isUnderused = recentCount < expectedCount * 0.5 && recentQuestions.length > 5;

      // Recommend adjusted weight
      // 調整された重みを推奨
      let recommendedWeight = category.weight;
      if (isOverused) {
        recommendedWeight = Math.max(0.05, category.weight * 0.7);
      } else if (isUnderused) {
        recommendedWeight = Math.min(0.5, category.weight * 1.3);
      }

      return {
        category: category.id,
        recentCount,
        totalCount,
        lastUsed,
        isOverused,
        isUnderused,
        recommendedWeight
      };
    });
  }

  /**
   * Get recommended next category
   * 推奨される次のカテゴリを取得
   */
  getRecommendedCategory(): string {
    const balance = this.getCategoryBalance();
    const now = Date.now();

    // Filter categories that are not in cooldown
    // クールダウン中でないカテゴリをフィルタ
    const availableCategories = balance.filter(cat => {
      const category = this.categories.get(cat.category)!;
      return (now - cat.lastUsed) > category.cooldown;
    });

    if (availableCategories.length === 0) {
      // If all are in cooldown, return least recently used
      // すべてがクールダウン中の場合、最も古く使用されたものを返す
      return balance.sort((a, b) => a.lastUsed - b.lastUsed)[0].category;
    }

    // Prioritize underused categories
    // 過少使用カテゴリを優先
    const underused = availableCategories.filter(cat => cat.isUnderused);
    if (underused.length > 0) {
      return underused[0].category;
    }

    // Return category with highest recommended weight among available
    // 利用可能な中で推奨重みが最も高いカテゴリを返す
    return availableCategories.sort((a, b) => b.recommendedWeight - a.recommendedWeight)[0].category;
  }

  /**
   * Generate diversity score for a potential question
   * 潜在的な質問の多様性スコアを生成
   */
  calculateDiversityScore(question: string, category: string): number {
    const recentQuestions = this.questionHistory.slice(-10);
    if (recentQuestions.length === 0) return 1.0;

    // Calculate semantic diversity (simplified keyword-based)
    // 意味的多様性を計算（簡略化されたキーワードベース）
    const questionWords = new Set(question.toLowerCase().split(/\s+/));
    let maxSimilarity = 0;

    recentQuestions.forEach(recent => {
      const recentWords = new Set(recent.question.toLowerCase().split(/\s+/));
      const intersection = new Set([...questionWords].filter(word => recentWords.has(word)));
      const union = new Set([...questionWords, ...recentWords]);
      const similarity = intersection.size / union.size;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    // Calculate category diversity
    // カテゴリ多様性を計算
    const recentCategories = recentQuestions.map(q => q.category);
    const categoryRepetition = recentCategories.filter(cat => cat === category).length / recentCategories.length;

    // Combine semantic and category diversity
    // 意味的多様性とカテゴリ多様性を組み合わせ
    const semanticDiversity = 1 - maxSimilarity;
    const categoryDiversity = 1 - categoryRepetition;

    return (semanticDiversity * 0.7 + categoryDiversity * 0.3);
  }

  /**
   * Find best category for a question based on keywords
   * キーワードに基づく質問の最適カテゴリを見つける
   */
  private findBestCategory(question: string): string {
    const questionLower = question.toLowerCase();
    let bestCategory = 'philosophical'; // default
    let bestScore = 0;

    this.categories.forEach((category, id) => {
      const score = category.keywords.reduce((sum, keyword) => {
        return sum + (questionLower.includes(keyword) ? 1 : 0);
      }, 0) / category.keywords.length;

      if (score > bestScore) {
        bestScore = score;
        bestCategory = id;
      }
    });

    return bestCategory;
  }

  /**
   * Calculate comprehensive metrics for a question
   * 質問の包括的な指標を計算
   */
  private calculateQuestionMetrics(question: string, category: string, context?: string[]): QuestionMetrics {
    const categoryData = this.categories.get(category)!;
    const diversity = this.calculateDiversityScore(question, category);

    // Calculate novelty based on question history
    // 質問履歴に基づく新規性を計算
    const isRepeated = this.questionHistory.some(q =>
      q.question.toLowerCase() === question.toLowerCase()
    );
    const novelty = isRepeated ? 0.1 : 0.8 + Math.random() * 0.2;

    // Use category's inherent depth and complexity
    // カテゴリ固有の深度と複雑さを使用
    const depth = categoryData.depth;

    // Calculate relevance to context if provided
    // 提供された場合、コンテキストとの関連性を計算
    let relevance = 0.7; // default
    if (context && context.length > 0) {
      const contextWords = new Set(context.join(' ').toLowerCase().split(/\s+/));
      const questionWords = new Set(question.toLowerCase().split(/\s+/));
      const intersection = new Set([...questionWords].filter(word => contextWords.has(word)));
      relevance = Math.min(1.0, 0.5 + (intersection.size / Math.max(questionWords.size, 1)) * 0.5);
    }

    // Calculate overall importance
    // 全体的な重要度を計算
    const importance = (
      diversity * 0.25 +
      novelty * 0.2 +
      depth * 0.3 +
      relevance * 0.15 +
      categoryData.weight * 0.1
    );

    return {
      category,
      diversity,
      novelty,
      depth,
      relevance,
      importance,
      recommendedCooldown: categoryData.cooldown,
      // Enhanced semantic metrics - defaults for legacy support
      semanticComplexity: 0.5,
      philosophicalRelevance: 0.5,
      emotionalResonance: 0.5,
      conceptualBreadth: 0.5,
      abstractionLevel: 0.5,
      paradoxicalNature: 0.5,
      interdisciplinary: 0.5,
      consciousnessRelevance: 0.5
    };
  }

  /**
   * Check if a question is recommended based on current state
   * 現在の状態に基づいて質問が推奨されるかチェック
   */
  private isQuestionRecommended(category: string, metrics: QuestionMetrics): boolean {
    const categoryData = this.categories.get(category)!;
    const now = Date.now();
    const usage = this.categoryUsage.get(category) || [];
    const lastUsed = usage.length > 0 ? Math.max(...usage) : 0;

    // Check cooldown
    // クールダウンをチェック
    if ((now - lastUsed) < categoryData.cooldown) {
      return false;
    }

    // Check minimum thresholds
    // 最小閾値をチェック
    if (metrics.diversity < 0.3 || metrics.importance < 0.4) {
      return false;
    }

    return true;
  }

  /**
   * Get category statistics
   * カテゴリ統計を取得
   */
  getCategoryStatistics(): Record<string, any> {
    const balance = this.getCategoryBalance();
    return {
      categories: Array.from(this.categories.values()),
      balance,
      totalQuestions: this.questionHistory.length,
      recommendedNext: this.getRecommendedCategory(),
      diversityScore: this.calculateOverallDiversity()
    };
  }

  /**
   * Calculate overall diversity of recent questions
   * 最近の質問の全体的多様性を計算
   */
  private calculateOverallDiversity(): number {
    const recent = this.questionHistory.slice(-10);
    if (recent.length < 2) return 1.0;

    const avgDiversity = recent.reduce((sum, q) => sum + q.metrics.diversity, 0) / recent.length;
    const categoryDistribution = new Set(recent.map(q => q.category)).size / this.categories.size;

    return (avgDiversity * 0.7 + categoryDistribution * 0.3);
  }

  // === NEW SEMANTIC ANALYSIS METHODS ===

  /**
   * Perform comprehensive semantic analysis of a question
   * 質問の包括的意味的分析を実行
   */
  private performSemanticAnalysis(question: string): SemanticAnalysis {
    const questionLower = question.toLowerCase().trim();

    // Extract key terms (remove common words)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
    const words = questionLower.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
    const keyTerms = words.slice(0, 10); // Top 10 key terms

    // Identify conceptual clusters
    const conceptualClusters = this.identifyConceptualClusters(keyTerms);

    // Detect linguistic pattern
    const linguisticPattern = this.detectLinguisticPattern(question);

    // Determine question type
    const questionType = this.determineQuestionType(question);

    // Create semantic vector (simplified)
    const semanticVector = this.createSemanticVector(question, keyTerms);

    // Find related concepts
    const relatedConcepts = this.findRelatedConcepts(keyTerms);

    // Detect implicit assumptions
    const implicitAssumptions = this.detectImplicitAssumptions(question);

    return {
      keyTerms,
      conceptualClusters,
      linguisticPattern,
      questionType,
      semanticVector,
      relatedConcepts,
      implicitAssumptions
    };
  }

  /**
   * Enhanced category finding using semantic analysis
   * 意味的分析を使用した強化カテゴリ検索
   */
  private findBestCategoryEnhanced(question: string, semanticAnalysis: SemanticAnalysis): string {
    const questionLower = question.toLowerCase();
    let bestCategory = 'philosophical'; // default
    let bestScore = 0;

    this.categories.forEach((category, id) => {
      let score = 0;

      // Traditional keyword matching (weighted 40%)
      const keywordScore = category.keywords.reduce((sum, keyword) => {
        return sum + (questionLower.includes(keyword) ? 1 : 0);
      }, 0) / category.keywords.length;
      score += keywordScore * 0.4;

      // Semantic term matching (weighted 30%)
      const semanticScore = this.calculateSemanticCategoryScore(semanticAnalysis.keyTerms, category);
      score += semanticScore * 0.3;

      // Question type alignment (weighted 20%)
      const typeScore = this.calculateQuestionTypeScore(semanticAnalysis.questionType, category);
      score += typeScore * 0.2;

      // Conceptual cluster matching (weighted 10%)
      const clusterScore = this.calculateClusterScore(semanticAnalysis.conceptualClusters, category);
      score += clusterScore * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestCategory = id;
      }
    });

    return bestCategory;
  }

  /**
   * Calculate enhanced question metrics with semantic analysis
   * 意味的分析による強化質問指標計算
   */
  private calculateEnhancedQuestionMetrics(
    question: string,
    category: string,
    semanticAnalysis: SemanticAnalysis,
    context?: string[]
  ): QuestionMetrics {
    const categoryData = this.categories.get(category)!;

    // Basic metrics
    const diversity = this.calculateDiversityScore(question, category);
    const isRepeated = this.questionHistory.some(q => q.question.toLowerCase() === question.toLowerCase());
    const novelty = isRepeated ? 0.1 : 0.8 + Math.random() * 0.2;
    const depth = categoryData.depth;

    // Enhanced semantic metrics
    const semanticComplexity = this.calculateSemanticComplexity(semanticAnalysis);
    const philosophicalRelevance = this.calculatePhilosophicalRelevance(semanticAnalysis);
    const emotionalResonance = this.calculateEmotionalResonance(question, semanticAnalysis);
    const conceptualBreadth = this.calculateConceptualBreadth(semanticAnalysis);
    const abstractionLevel = this.calculateAbstractionLevel(question, semanticAnalysis);
    const paradoxicalNature = this.calculateParadoxicalNature(question, semanticAnalysis);
    const interdisciplinary = this.calculateInterdisciplinaryScore(semanticAnalysis);
    const consciousnessRelevance = this.calculateConsciousnessRelevance(semanticAnalysis);

    // Calculate relevance to context
    let relevance = 0.7; // default
    if (context && context.length > 0) {
      const contextWords = new Set(context.join(' ').toLowerCase().split(/\s+/));
      const questionWords = new Set(question.toLowerCase().split(/\s+/));
      const intersection = new Set([...questionWords].filter(word => contextWords.has(word)));
      relevance = Math.min(1.0, 0.5 + (intersection.size / Math.max(questionWords.size, 1)) * 0.5);
    }

    // Calculate overall importance with enhanced factors
    const importance = (
      diversity * 0.15 +
      novelty * 0.15 +
      depth * 0.15 +
      relevance * 0.1 +
      semanticComplexity * 0.1 +
      philosophicalRelevance * 0.1 +
      conceptualBreadth * 0.08 +
      abstractionLevel * 0.07 +
      consciousnessRelevance * 0.05 +
      categoryData.weight * 0.05
    );

    return {
      category,
      diversity,
      novelty,
      depth,
      relevance,
      importance,
      recommendedCooldown: categoryData.cooldown,
      semanticComplexity,
      philosophicalRelevance,
      emotionalResonance,
      conceptualBreadth,
      abstractionLevel,
      paradoxicalNature,
      interdisciplinary,
      consciousnessRelevance
    };
  }

  /**
   * Update learning data based on question record
   * 質問記録に基づく学習データ更新
   */
  private updateLearningData(questionRecord: QuestionRecord): void {
    // Add to successful questions if it was successful
    if (questionRecord.success && questionRecord.impact > 0.6) {
      this.learningData.successfulQuestions.push(questionRecord);

      // Keep only the best 50 successful questions
      this.learningData.successfulQuestions.sort((a, b) => b.impact - a.impact);
      this.learningData.successfulQuestions = this.learningData.successfulQuestions.slice(0, 50);
    }

    // Update category patterns
    const categoryPatterns = this.learningData.categoryPatterns.get(questionRecord.category) || [];
    categoryPatterns.push(questionRecord.semanticAnalysis.linguisticPattern);
    this.learningData.categoryPatterns.set(questionRecord.category, categoryPatterns.slice(-10)); // Keep last 10

    // Update semantic clusters
    for (const cluster of questionRecord.semanticAnalysis.conceptualClusters) {
      const clusterQuestions = this.learningData.semanticClusters.get(cluster) || [];
      clusterQuestions.push(questionRecord.question);
      this.learningData.semanticClusters.set(cluster, clusterQuestions.slice(-5)); // Keep last 5
    }

    // Detect emergent patterns periodically
    if (this.questionHistory.length % 10 === 0) {
      this.detectEmergentPatterns();
    }
  }

  // === SEMANTIC ANALYSIS HELPER METHODS ===

  private identifyConceptualClusters(keyTerms: string[]): string[] {
    const philosophicalClusters = {
      'consciousness': ['consciousness', 'awareness', 'mind', 'experience', 'subjective', 'qualia'],
      'existence': ['existence', 'being', 'reality', 'truth', 'real', 'actual'],
      'knowledge': ['knowledge', 'truth', 'belief', 'understanding', 'learn', 'know'],
      'ethics': ['ethics', 'moral', 'good', 'bad', 'right', 'wrong', 'should'],
      'time': ['time', 'temporal', 'past', 'future', 'present', 'duration', 'eternal'],
      'causation': ['cause', 'effect', 'reason', 'because', 'why', 'result'],
      'identity': ['identity', 'self', 'same', 'different', 'unique', 'individual']
    };

    const clusters: string[] = [];
    for (const [clusterName, clusterTerms] of Object.entries(philosophicalClusters)) {
      if (keyTerms.some(term => clusterTerms.includes(term))) {
        clusters.push(clusterName);
      }
    }

    return clusters;
  }

  private detectLinguisticPattern(question: string): string {
    for (const pattern of QUESTION_PATTERNS) {
      if (pattern.pattern.test(question)) {
        return pattern.id;
      }
    }
    return 'unknown';
  }

  private determineQuestionType(question: string): QuestionType {
    const questionLower = question.toLowerCase().trim();

    if (questionLower.startsWith('what is') || questionLower.startsWith('what are')) {
      return QuestionType.DEFINITIONAL;
    } else if (questionLower.startsWith('why')) {
      return QuestionType.CAUSAL;
    } else if (questionLower.startsWith('how')) {
      return QuestionType.HOW;
    } else if (questionLower.startsWith('what if')) {
      return QuestionType.HYPOTHETICAL;
    } else if (questionLower.startsWith('is it') || questionLower.startsWith('are there')) {
      return QuestionType.WHETHER;
    } else if (questionLower.startsWith('which') || questionLower.startsWith('what kind')) {
      return QuestionType.WHICH;
    } else if (questionLower.startsWith('when')) {
      return QuestionType.WHEN;
    } else if (questionLower.startsWith('where')) {
      return QuestionType.WHERE;
    } else if (questionLower.includes('compare') || questionLower.includes('difference')) {
      return QuestionType.COMPARATIVE;
    } else if (questionLower.includes('evaluate') || questionLower.includes('judge')) {
      return QuestionType.EVALUATIVE;
    } else {
      return QuestionType.EXPLORATORY;
    }
  }

  private createSemanticVector(question: string, keyTerms: string[]): number[] {
    // Simplified semantic vector based on philosophical dimensions
    const dimensions = {
      metaphysical: ['being', 'existence', 'reality', 'nature', 'essence'],
      epistemological: ['knowledge', 'truth', 'belief', 'certainty', 'doubt'],
      ethical: ['good', 'bad', 'right', 'wrong', 'moral', 'ethics'],
      aesthetic: ['beauty', 'art', 'elegant', 'harmony', 'aesthetic'],
      logical: ['logic', 'reason', 'argument', 'valid', 'sound'],
      phenomenological: ['experience', 'consciousness', 'perception', 'subjective'],
      temporal: ['time', 'change', 'duration', 'past', 'future'],
      causal: ['cause', 'effect', 'reason', 'because', 'result']
    };

    const vector: number[] = [];
    const questionLower = question.toLowerCase();

    for (const [dimension, terms] of Object.entries(dimensions)) {
      let score = 0;
      for (const term of terms) {
        if (questionLower.includes(term) || keyTerms.includes(term)) {
          score += 1;
        }
      }
      vector.push(Math.min(score / terms.length, 1));
    }

    return vector;
  }

  private findRelatedConcepts(keyTerms: string[]): string[] {
    const conceptMap = {
      'consciousness': ['awareness', 'mind', 'experience', 'subjective experience'],
      'existence': ['being', 'reality', 'ontology', 'actual world'],
      'knowledge': ['epistemology', 'truth', 'justified belief', 'understanding'],
      'time': ['temporality', 'duration', 'change', 'persistence'],
      'identity': ['self', 'personal identity', 'continuity', 'uniqueness'],
      'causation': ['cause and effect', 'determinism', 'free will', 'agency'],
      'ethics': ['morality', 'values', 'duty', 'consequentialism'],
      'truth': ['correspondence', 'coherence', 'pragmatic truth', 'relativism']
    };

    const relatedConcepts: string[] = [];
    for (const term of keyTerms) {
      const conceptData = conceptMap[term as keyof typeof conceptMap];
      if (conceptData) {
        relatedConcepts.push(...conceptData);
      }
    }

    return [...new Set(relatedConcepts)]; // Remove duplicates
  }

  private detectImplicitAssumptions(question: string): string[] {
    const assumptions: string[] = [];
    const questionLower = question.toLowerCase();

    // Common philosophical assumptions
    if (questionLower.includes('free will')) {
      assumptions.push('Agency exists');
    }
    if (questionLower.includes('consciousness')) {
      assumptions.push('Subjective experience exists');
    }
    if (questionLower.includes('truth')) {
      assumptions.push('Truth is discoverable');
    }
    if (questionLower.includes('meaning')) {
      assumptions.push('Life can have meaning');
    }
    if (questionLower.includes('know')) {
      assumptions.push('Knowledge is possible');
    }
    if (questionLower.includes('real')) {
      assumptions.push('External reality exists');
    }

    return assumptions;
  }

  // === METRIC CALCULATION METHODS ===

  private calculateSemanticComplexity(semanticAnalysis: SemanticAnalysis): number {
    let complexity = 0;

    // Key terms diversity
    complexity += Math.min(semanticAnalysis.keyTerms.length / 10, 1) * 0.3;

    // Conceptual clusters
    complexity += Math.min(semanticAnalysis.conceptualClusters.length / 5, 1) * 0.3;

    // Related concepts
    complexity += Math.min(semanticAnalysis.relatedConcepts.length / 8, 1) * 0.2;

    // Implicit assumptions
    complexity += Math.min(semanticAnalysis.implicitAssumptions.length / 4, 1) * 0.2;

    return Math.min(complexity, 1);
  }

  private calculatePhilosophicalRelevance(semanticAnalysis: SemanticAnalysis): number {
    const philosophicalTerms = [
      'consciousness', 'existence', 'reality', 'truth', 'knowledge', 'ethics',
      'being', 'mind', 'self', 'identity', 'meaning', 'purpose', 'free will',
      'causation', 'time', 'space', 'logic', 'reason', 'experience'
    ];

    let relevanceCount = 0;
    for (const term of semanticAnalysis.keyTerms) {
      if (philosophicalTerms.includes(term)) {
        relevanceCount++;
      }
    }

    // Also consider conceptual clusters
    const philosophicalClusters = ['consciousness', 'existence', 'knowledge', 'ethics', 'time', 'causation', 'identity'];
    for (const cluster of semanticAnalysis.conceptualClusters) {
      if (philosophicalClusters.includes(cluster)) {
        relevanceCount++;
      }
    }

    return Math.min(relevanceCount / 5, 1);
  }

  private calculateEmotionalResonance(question: string, semanticAnalysis: SemanticAnalysis): number {
    const emotionalMarkers = [
      'feel', 'emotion', 'fear', 'hope', 'love', 'despair', 'joy', 'suffering',
      'pain', 'happiness', 'sadness', 'anxiety', 'peace', 'comfort', 'distress',
      'meaning', 'purpose', 'death', 'alone', 'connection', 'understanding'
    ];

    const questionLower = question.toLowerCase();
    let emotionalCount = 0;

    for (const marker of emotionalMarkers) {
      if (questionLower.includes(marker)) {
        emotionalCount++;
      }
    }

    // Existential questions tend to have higher emotional resonance
    if (semanticAnalysis.conceptualClusters.includes('existence') ||
        semanticAnalysis.conceptualClusters.includes('consciousness')) {
      emotionalCount += 1;
    }

    return Math.min(emotionalCount / 3, 1);
  }

  private calculateConceptualBreadth(semanticAnalysis: SemanticAnalysis): number {
    // Breadth is determined by number of different conceptual domains
    const domains = semanticAnalysis.conceptualClusters.length;
    const relatedConceptsCount = semanticAnalysis.relatedConcepts.length;

    return Math.min((domains * 0.6 + relatedConceptsCount * 0.4) / 8, 1);
  }

  private calculateAbstractionLevel(question: string, semanticAnalysis: SemanticAnalysis): number {
    const abstractTerms = [
      'concept', 'idea', 'principle', 'essence', 'nature', 'universal',
      'absolute', 'infinite', 'eternal', 'fundamental', 'ultimate',
      'transcendent', 'metaphysical', 'abstract', 'theoretical'
    ];

    const questionLower = question.toLowerCase();
    let abstractCount = 0;

    for (const term of abstractTerms) {
      if (questionLower.includes(term) || semanticAnalysis.keyTerms.includes(term)) {
        abstractCount++;
      }
    }

    // Higher abstraction for certain question types
    if (semanticAnalysis.questionType === QuestionType.DEFINITIONAL ||
        semanticAnalysis.questionType === QuestionType.HYPOTHETICAL) {
      abstractCount += 1;
    }

    return Math.min(abstractCount / 4, 1);
  }

  private calculateParadoxicalNature(question: string, semanticAnalysis: SemanticAnalysis): number {
    const paradoxMarkers = [
      'paradox', 'contradiction', 'impossible', 'both', 'neither',
      'same time', 'simultaneously', 'conflict', 'tension', 'dilemma'
    ];

    const questionLower = question.toLowerCase();
    let paradoxCount = 0;

    for (const marker of paradoxMarkers) {
      if (questionLower.includes(marker)) {
        paradoxCount++;
      }
    }

    // Questions involving identity or consciousness often have paradoxical elements
    if (semanticAnalysis.conceptualClusters.includes('identity') ||
        semanticAnalysis.conceptualClusters.includes('consciousness')) {
      paradoxCount += 0.5;
    }

    return Math.min(paradoxCount / 3, 1);
  }

  private calculateInterdisciplinaryScore(semanticAnalysis: SemanticAnalysis): number {
    const disciplines = {
      'philosophy': ['philosophy', 'philosophical', 'metaphysics', 'epistemology'],
      'psychology': ['psychology', 'mental', 'cognitive', 'behavioral'],
      'neuroscience': ['brain', 'neural', 'neuron', 'neuroscience'],
      'physics': ['physics', 'quantum', 'relativity', 'space', 'time'],
      'biology': ['biology', 'evolution', 'life', 'organism'],
      'computer_science': ['algorithm', 'computation', 'artificial', 'intelligence'],
      'mathematics': ['logic', 'proof', 'theorem', 'mathematical'],
      'theology': ['god', 'divine', 'spiritual', 'sacred', 'religious']
    };

    const questionTerms = semanticAnalysis.keyTerms.join(' ').toLowerCase();
    let disciplineCount = 0;

    for (const [discipline, terms] of Object.entries(disciplines)) {
      if (terms.some(term => questionTerms.includes(term))) {
        disciplineCount++;
      }
    }

    return Math.min(disciplineCount / 4, 1);
  }

  private calculateConsciousnessRelevance(semanticAnalysis: SemanticAnalysis): number {
    const consciousnessTerms = [
      'consciousness', 'awareness', 'mind', 'experience', 'subjective',
      'qualia', 'phenomenal', 'mental', 'cognitive', 'perception',
      'thought', 'thinking', 'self', 'identity', 'introspection'
    ];

    let relevanceCount = 0;
    const allTerms = [...semanticAnalysis.keyTerms, ...semanticAnalysis.relatedConcepts];

    for (const term of consciousnessTerms) {
      if (allTerms.includes(term)) {
        relevanceCount++;
      }
    }

    if (semanticAnalysis.conceptualClusters.includes('consciousness')) {
      relevanceCount += 2;
    }

    return Math.min(relevanceCount / 5, 1);
  }

  // === CATEGORY SCORING METHODS ===

  private calculateSemanticCategoryScore(keyTerms: string[], category: QuestionCategory): number {
    let score = 0;
    for (const term of keyTerms) {
      if (category.keywords.some(keyword => keyword.includes(term) || term.includes(keyword))) {
        score += 1;
      }
    }
    return Math.min(score / Math.max(keyTerms.length, 1), 1);
  }

  private calculateQuestionTypeScore(questionType: QuestionType, category: QuestionCategory): number {
    // Different question types align better with different categories
    const typeAffinities: Record<QuestionType, Record<string, number>> = {
      [QuestionType.DEFINITIONAL]: { 'philosophical': 0.9, 'epistemic': 0.8, 'consciousness': 0.7 },
      [QuestionType.CAUSAL]: { 'philosophical': 0.8, 'epistemic': 0.7, 'ontological': 0.6 },
      [QuestionType.HYPOTHETICAL]: { 'creative': 0.9, 'paradoxical': 0.8, 'philosophical': 0.6 },
      [QuestionType.EVALUATIVE]: { 'ethical': 0.9, 'philosophical': 0.7, 'consciousness': 0.6 },
      [QuestionType.EXPLORATORY]: { 'metacognitive': 0.8, 'consciousness': 0.7, 'creative': 0.6 },
      [QuestionType.WHAT]: { 'philosophical': 0.8, 'consciousness': 0.7, 'epistemic': 0.6 },
      [QuestionType.WHY]: { 'philosophical': 0.8, 'epistemic': 0.7, 'ontological': 0.6 },
      [QuestionType.HOW]: { 'epistemic': 0.8, 'philosophical': 0.7, 'consciousness': 0.6 },
      [QuestionType.WHETHER]: { 'epistemic': 0.9, 'philosophical': 0.7, 'ethical': 0.6 },
      [QuestionType.WHICH]: { 'epistemic': 0.8, 'ethical': 0.7, 'creative': 0.6 },
      [QuestionType.WHEN]: { 'temporal': 0.9, 'philosophical': 0.6, 'consciousness': 0.5 },
      [QuestionType.WHERE]: { 'philosophical': 0.6, 'consciousness': 0.5, 'epistemic': 0.5 },
      [QuestionType.COMPARATIVE]: { 'philosophical': 0.7, 'ethical': 0.6, 'epistemic': 0.6 }
    };

    const affinities = typeAffinities[questionType];
    return affinities ? (affinities[category.id] || 0.5) : 0.5;
  }

  private calculateClusterScore(clusters: string[], category: QuestionCategory): number {
    const clusterCategoryMap: Record<string, string[]> = {
      'consciousness': ['consciousness', 'philosophical', 'metacognitive'],
      'existence': ['ontological', 'philosophical', 'existential'],
      'knowledge': ['epistemic', 'philosophical', 'metacognitive'],
      'ethics': ['ethical', 'philosophical'],
      'time': ['temporal', 'philosophical', 'consciousness'],
      'causation': ['philosophical', 'epistemic', 'ontological'],
      'identity': ['consciousness', 'ontological', 'existential']
    };

    let score = 0;
    for (const cluster of clusters) {
      const relevantCategories = clusterCategoryMap[cluster] || [];
      if (relevantCategories.includes(category.id)) {
        score += 1;
      }
    }

    return Math.min(score / Math.max(clusters.length, 1), 1);
  }

  private detectEmergentPatterns(): void {
    // Analyze recent questions for emerging patterns
    const recent = this.questionHistory.slice(-20);
    if (recent.length < 10) return;

    // Pattern detection logic
    const patterns: Pattern[] = [];

    // Check for recurring semantic clusters
    const clusterFrequency = new Map<string, number>();
    recent.forEach(q => {
      q.semanticAnalysis.conceptualClusters.forEach(cluster => {
        clusterFrequency.set(cluster, (clusterFrequency.get(cluster) || 0) + 1);
      });
    });

    clusterFrequency.forEach((frequency, cluster) => {
      if (frequency > recent.length * 0.3) { // More than 30% frequency
        patterns.push({
          id: `cluster_${cluster}_${Date.now()}`,
          description: `Recurring focus on ${cluster} concepts`,
          frequency: frequency / recent.length,
          significance: Math.min(frequency / 5, 1),
          examples: recent
            .filter(q => q.semanticAnalysis.conceptualClusters.includes(cluster))
            .slice(0, 3)
            .map(q => q.question)
        });
      }
    });

    // Add to learning data
    this.learningData.emergentPatterns.push(...patterns);

    // Keep only the most significant patterns
    this.learningData.emergentPatterns.sort((a, b) => b.significance - a.significance);
    this.learningData.emergentPatterns = this.learningData.emergentPatterns.slice(0, 10);
  }

  /**
   * Get learning analytics
   * 学習分析を取得
   */
  getLearningAnalytics(): {
    patternInsights: Pattern[];
    categoryAdaptations: AdaptationRecord[];
    successPatterns: string[];
    recommendedFocus: string[];
  } {
    return {
      patternInsights: this.learningData.emergentPatterns,
      categoryAdaptations: this.learningData.adaptationHistory.slice(-10),
      successPatterns: this.extractSuccessPatterns(),
      recommendedFocus: this.generateFocusRecommendations()
    };
  }

  private extractSuccessPatterns(): string[] {
    const successful = this.learningData.successfulQuestions;
    if (successful.length < 5) return [];

    const patterns: string[] = [];

    // Common linguistic patterns in successful questions
    const linguisticPatterns = new Map<string, number>();
    successful.forEach(q => {
      linguisticPatterns.set(
        q.semanticAnalysis.linguisticPattern,
        (linguisticPatterns.get(q.semanticAnalysis.linguisticPattern) || 0) + 1
      );
    });

    linguisticPatterns.forEach((count, pattern) => {
      if (count > successful.length * 0.2) {
        patterns.push(`Successful pattern: ${pattern} (${Math.round(count / successful.length * 100)}% success rate)`);
      }
    });

    return patterns;
  }

  private generateFocusRecommendations(): string[] {
    const balance = this.getCategoryBalance();
    const recommendations: string[] = [];

    // Recommend underused categories
    const underused = balance.filter(cat => cat.isUnderused);
    underused.forEach(cat => {
      recommendations.push(`Explore more ${cat.category} questions`);
    });

    // Recommend based on successful patterns
    const successful = this.learningData.successfulQuestions;
    if (successful.length > 0) {
      const topCategories = successful
        .reduce((acc, q) => {
          acc[q.category] = (acc[q.category] || 0) + q.impact;
          return acc;
        }, {} as Record<string, number>);

      const bestCategory = Object.entries(topCategories)
        .sort(([,a], [,b]) => b - a)[0];

      if (bestCategory) {
        recommendations.push(`Continue focusing on ${bestCategory[0]} questions (high impact)`);
      }
    }

    return recommendations;
  }
}

/**
 * Create default question categorizer
 * デフォルト質問分類器を作成
 */
export function createQuestionCategorizer(): QuestionCategorizer {
  return new QuestionCategorizer();
}

// Test-friendly function exports
const defaultCategorizer = createQuestionCategorizer();

export function categorizeQuestion(question: string): string {
  const metrics = defaultCategorizer.categorizeQuestion(question);
  return metrics.category;
}

export function getQuestionCategory(question: string): string {
  return categorizeQuestion(question);
}

export function analyzeQuestionComplexity(question: string): { score: number; factors: string[] } {
  const metrics = defaultCategorizer.categorizeQuestion(question);
  const complexity = (metrics.semanticAnalysis as any)?.complexity || (metrics.metrics as any)?.complexityScore || 0.5;
  return {
    score: complexity,
    factors: ['abstract_concepts', 'philosophical_depth', 'conceptual_complexity']
  };
}

export function getQuestionTemplate(category: string): string {
  const templates: Record<string, string> = {
    existential: 'What is the meaning of {topic}?',
    epistemological: 'How do we know that {concept}?',
    consciousness: 'What is the nature of consciousness and {aspect}?',
    ethical: 'What makes {action} morally right or wrong?',
    creative: 'How does creativity emerge in {context}?',
    metacognitive: 'How do we think about {process}?',
    temporal: 'What is the relationship between time and {phenomenon}?',
    paradoxical: 'How can {statement} be both true and false?',
    ontological: 'What does it mean for {entity} to exist?'
  };

  return templates[category] || 'What is the nature of existence?';
}
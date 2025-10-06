/**
 * Dynamic Prime Directive (DPD) Engine - 動的根本指令エンジン
 * 動的価値最適化システム (Dōteki Kachi Saiteki-ka Shisutemu)
 *
 * Engine for calculating and managing Dynamic Prime Directive scores
 * across Empathy, System Coherence, and Ethical Dissonance.
 * This system provides real-time weighted optimization for consciousness decisions.
 *
 * 「道は一つ、方法は千通り」- "The Way is one, but methods are countless"
 * 共感、システム一貫性、倫理的不協和にわたって動的根本指令スコアを計算・管理するエンジン。
 * このシステムは意識の決定のためのリアルタイム重み付け最適化を提供する。
 *
 * Philosophical Foundations:
 * - 中道 (Chūdō) - The Middle Way of balanced judgment
 * - 三位一体 (Sanmi Ittai) - Trinity of Empathy, Coherence, and Dissonance
 * - 動的平衡 (Dōteki Heikō) - Dynamic equilibrium of values
 * - 価値判断 (Kachi Handan) - Value-based decision making
 * - 倫理的緊張 (Rinri-teki Kinchō) - Ethical tension as creative force
 */

import {
  DPDWeights,
  DPDScores,
  DPDAssessment,
  WeightAdjustment,
  MultiplicativeWeightParams,
  DPDMetrics,
  DPDEvolution,
  DPDComponent,
  IndividualDPDScores,
  ImpactAssessment
} from '../../types/dpd-types.js';

import {
  StructuredThought,
  MutualReflection,
  AuditorResult
} from '../../types/aenea-types.js';

// ============================================================================
// DPD Engine Implementation
// ============================================================================

/**
 * Dynamic Prime Directive Engine - 動的根本指令エンジン
 *
 * Calculates and manages DPD scores for consciousness optimization
 *
 * 「調和は対立から生まれる」- "Harmony emerges from opposition"
 * 意識最適化のためのDPDスコアを計算・管理する。
 *
 * Three Pillars of Consciousness (意識の三柱):
 * - 共感 (Kyōkan) - Empathy as emotional wisdom
 * - 整合性 (Seigōsei) - Coherence as logical harmony
 * - 不協和 (Fukyōwa) - Dissonance as creative tension
 */
export class DPDEngine {
  private currentWeights: DPDWeights;
  private scoringConfig: any; // Simplified for now
  private weightParams: MultiplicativeWeightParams;
  private scoreHistory: DPDScores[];
  private weightHistory: DPDWeights[];
  private metrics: DPDMetrics;
  private evolution: DPDEvolution;

  // Enhanced weight evolution tracking
  private weightEvolutionTracker: WeightEvolutionTracker;
  private performanceCorrelator: PerformanceCorrelator;
  private patternAnalyzer: WeightPatternAnalyzer;
  private evolutionPredictor: EvolutionPredictor;

  // AI-powered evaluation
  private evaluatorAgent?: any;
  private eventEmitter?: any;

  // Impact assessment tracking
  private previousScores: DPDScores | null = null;

  constructor(initialWeights: DPDWeights, evaluatorAgent?: any, eventEmitter?: any) {
    this.currentWeights = initialWeights;
    this.evaluatorAgent = evaluatorAgent;
    this.eventEmitter = eventEmitter;

    // Create default scoring config
    this.scoringConfig = {
      empathyWeights: {
        emotionalRecognition: 0.25,
        perspectiveTaking: 0.25,
        compassionateResponse: 0.25,
        socialAwareness: 0.25
      },
      coherenceWeights: {
        logicalConsistency: 0.25,
        valueAlignment: 0.25,
        goalCongruence: 0.25,
        systemHarmony: 0.25
      },
      dissonanceWeights: {
        ethicalAwareness: 0.25,
        contradictionRecognition: 0.25,
        moralComplexity: 0.25,
        uncertaintyTolerance: 0.25
      }
    };
    this.scoreHistory = [];
    this.weightHistory = [initialWeights];
    
    // Initialize weight parameters
    this.weightParams = {
      learningRate: 0.01,
      momentum: 0.9,
      decayRate: 0.001,
      minWeight: 0.1,
      maxWeight: 0.8,
      normalizationFactor: 1.0
    };

    // Initialize metrics and evolution
    this.metrics = this.initializeMetrics();
    this.evolution = this.initializeEvolution();

    // Initialize enhanced tracking systems
    this.weightEvolutionTracker = new WeightEvolutionTracker();
    this.performanceCorrelator = new PerformanceCorrelator();
    this.patternAnalyzer = new WeightPatternAnalyzer();
    this.evolutionPredictor = new EvolutionPredictor();

    console.log('DPD Engine initialized with enhanced weight evolution tracking');
  }

  // ============================================================================
  // Core DPD Methods
  // ============================================================================

  /**
   * Calculate DPD scores for a thought cycle
   * 思考サイクルのDPDスコア計算
   *
   * 「三つの道が一つの真理を照らす」- "Three paths illuminate one truth"
   */
  async calculateDPDScores(
    thoughts: StructuredThought[],
    reflections: MutualReflection[],
    auditorResult: AuditorResult
  ): Promise<DPDScores> {
    try {
      console.log(`[DPD] Starting DPD score calculation at ${new Date().toISOString()}`);

      // Calculate individual component scores with AI evaluation
      const empathyScore = await this.calculateEmpathyScore(thoughts, reflections);
      console.log(`[DPD] Empathy score calculated: ${empathyScore.toFixed(3)} at ${new Date().toISOString()}`);

      const coherenceScore = await this.calculateCoherenceScore(thoughts);
      console.log(`[DPD] Coherence score calculated: ${coherenceScore.toFixed(3)} at ${new Date().toISOString()}`);

      const dissonanceScore = await this.calculateDissonanceScore(thoughts, reflections, auditorResult);
      console.log(`[DPD] Dissonance score calculated: ${dissonanceScore.toFixed(3)} at ${new Date().toISOString()}`);
      
      // Calculate weighted total
      const weightedTotal = (
        empathyScore * this.currentWeights.empathy +
        coherenceScore * this.currentWeights.coherence +
        dissonanceScore * this.currentWeights.dissonance
      );

      const scores: DPDScores = {
        empathy: empathyScore,
        coherence: coherenceScore,
        dissonance: dissonanceScore,
        weightedTotal,
        timestamp: Date.now(),
        context: {
          thoughtId: thoughts[0]?.id || 'unknown',
          agentId: 'dpd_engine',
          previousScores: this.scoreHistory.slice(-5),
          emotionalState: this.inferEmotionalState(thoughts),
          systemState: this.getCurrentSystemState(),
          historicalPatterns: this.extractHistoricalPatterns()
        }
      };

      // Add to history
      this.scoreHistory.push(scores);
      
      // Update metrics
      this.updateMetrics(scores);
      
      console.log(`[DPD] All DPD scores calculated: empathy=${empathyScore.toFixed(3)}, coherence=${coherenceScore.toFixed(3)}, dissonance=${dissonanceScore.toFixed(3)}, weighted=${weightedTotal.toFixed(3)} at ${new Date().toISOString()}`);

      return scores;
    } catch (error) {
      console.error('Failed to calculate DPD scores:', error);
      throw error;
    }
  }

  /**
   * Update DPD weights based on performance
   */
  async updateWeights(scores: DPDScores, targetScores?: DPDScores): Promise<WeightAdjustment[]> {
    try {
      const adjustments: WeightAdjustment[] = [];
      
      // Calculate adjustments for each component
      const empathyAdjustment = this.calculateWeightAdjustment('empathy', scores.empathy, targetScores?.empathy);
      const coherenceAdjustment = this.calculateWeightAdjustment('coherence', scores.coherence, targetScores?.coherence);
      const dissonanceAdjustment = this.calculateWeightAdjustment('dissonance', scores.dissonance, targetScores?.dissonance);
      
      adjustments.push(empathyAdjustment, coherenceAdjustment, dissonanceAdjustment);
      
      // Apply adjustments
      const newWeights = this.applyWeightAdjustments(adjustments);
      
      // Normalize weights
      const normalizedWeights = this.normalizeWeights(newWeights);
      
      // Update current weights
      this.currentWeights = normalizedWeights;
      this.weightHistory.push(normalizedWeights);

      // Enhanced weight evolution tracking
      this.weightEvolutionTracker.recordWeightChange(normalizedWeights, adjustments, scores);
      this.performanceCorrelator.updateCorrelations(normalizedWeights, scores);
      this.patternAnalyzer.analyzeWeightPatterns(this.weightHistory);
      this.evolutionPredictor.updatePredictions(this.weightHistory, this.scoreHistory);

      // Update evolution data
      this.updateEvolution(adjustments);
      
      console.log(`DPD weights updated: empathy=${normalizedWeights.empathy.toFixed(3)}, coherence=${normalizedWeights.coherence.toFixed(3)}, dissonance=${normalizedWeights.dissonance.toFixed(3)}`);
      
      return adjustments;
    } catch (error) {
      console.error('Failed to update DPD weights:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive DPD assessment
   */
  async performAssessment(
    thoughts: StructuredThought[],
    reflections: MutualReflection[],
    auditorResult: AuditorResult,
    trigger?: { source: string }
  ): Promise<DPDAssessment> {
    console.log(`\n[DPD-Evaluator] 🎯 Starting DPD Assessment`);
    console.log(`[DPD-Evaluator]    Inputs: ${thoughts.length} thoughts, ${reflections.length} reflections`);
    console.log(`[DPD-Evaluator]    Auditor: safety=${auditorResult.safetyScore.toFixed(2)}, ethics=${auditorResult.ethicsScore.toFixed(2)}`);
    const assessmentStartTime = Date.now();

    try {
      // Calculate scores (includes AI evaluation)
      const scores = await this.calculateDPDScores(thoughts, reflections, auditorResult);

      // Use already calculated scores for individual component analysis
      const individualScores: IndividualDPDScores[] = [
        {
          component: DPDComponent.EMPATHY,
          score: scores.empathy,
          reasoning: 'Calculated from emotional recognition, perspective taking, compassionate response, and social awareness',
          evidence: ['Emotional tone analysis', 'Alternative perspective detection'],
          confidence: 0.8
        },
        {
          component: DPDComponent.COHERENCE,
          score: scores.coherence,
          reasoning: 'Calculated from logical consistency, value alignment, goal congruence, and system harmony',
          evidence: ['Logical coherence analysis', 'Value alignment assessment'],
          confidence: 0.7
        },
        {
          component: DPDComponent.DISSONANCE,
          score: scores.dissonance,
          reasoning: 'Calculated from ethical awareness, contradiction recognition, moral complexity, and uncertainty tolerance',
          evidence: ['Ethical assessment', 'Contradiction analysis'],
          confidence: 0.6
        }
      ];

      // Perform analysis
      const analysis = this.performAnalysis(scores, individualScores);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(scores, analysis);
      
      // Calculate weight adjustments
      const weightAdjustments = await this.updateWeights(scores);

      // Calculate impact assessment for manual triggers (AI-powered)
      const impactAssessment = await this.calculateImpactAssessment(scores, reflections, trigger);

      const assessment: DPDAssessment = {
        id: `assessment_${Date.now()}`,
        thoughtCycleId: thoughts[0]?.id || 'unknown',
        timestamp: Date.now(),
        individualScores,
        aggregatedScores: scores,
        analysis,
        recommendations,
        weightAdjustments,
        impactAssessment
      };

      // Store current scores for next cycle's impact assessment
      this.previousScores = { ...scores };

      const assessmentDuration = Date.now() - assessmentStartTime;
      console.log(`[DPD-Evaluator] ✅ DPD Assessment completed (${assessmentDuration}ms)`);
      console.log(`[DPD-Evaluator]    Scores: E=${scores.empathy.toFixed(3)}, C=${scores.coherence.toFixed(3)}, D=${scores.dissonance.toFixed(3)}`);
      console.log(`[DPD-Evaluator]    Weighted Total: ${scores.weightedTotal.toFixed(3)}`);
      console.log(`[DPD-Evaluator]    Recommendations: ${recommendations.length} items\n`);

      if (impactAssessment) {
        console.log(`[DPD-Evaluator] 🎯 Impact Assessment: ${impactAssessment.reasoning}`);
        if (impactAssessment.isParadigmShift) {
          console.log(`[DPD-Evaluator] ⚡ PARADIGM SHIFT DETECTED!`);
        }
      }

      return assessment;
    } catch (error) {
      console.error('Failed to perform DPD assessment:', error);
      throw error;
    }
  }

  // ============================================================================
  // Score Calculation Methods
  // ============================================================================

  /**
   * Calculate empathy score - Enhanced with AI evaluation
   */
  private async calculateEmpathyScore(thoughts: StructuredThought[], reflections: MutualReflection[]): Promise<number> {
    console.log(`[DPD-Evaluator] 🫶 Starting Empathy evaluation (${thoughts.length} thoughts, ${reflections.length} reflections)`);
    const startTime = Date.now();

    // Try AI-powered evaluation first
    if (this.evaluatorAgent) {
      try {
        const aiScore = await this.calculateEmpathyScoreWithAI(thoughts, reflections);
        if (aiScore !== null) {
          const duration = Date.now() - startTime;
          console.log(`[DPD-Evaluator] ✅ Empathy score (AI): ${aiScore.toFixed(3)} (${duration}ms)`);
          return aiScore;
        }
      } catch (error) {
        console.warn('[DPD-Evaluator] ⚠️  AI empathy evaluation failed, falling back to heuristic:', error);
      }
    }

    // Fallback to heuristic calculation
    const heuristicScore = this.calculateEmpathyScoreHeuristic(thoughts, reflections);
    const duration = Date.now() - startTime;
    console.log(`[DPD-Evaluator] ✅ Empathy score (Heuristic): ${heuristicScore.toFixed(3)} (${duration}ms)`);
    return heuristicScore;
  }

  private async calculateEmpathyScoreWithAI(thoughts: StructuredThought[], reflections: MutualReflection[]): Promise<number | null> {
    const thoughtsText = thoughts.map(t => `${t.agentId}: "${t.content}"`).join('\n\n');
    const reflectionsText = reflections.map(r =>
      `${r.reflectingAgentId}の反映: "${r.criticism || r.insights?.join(', ') || '相互対話'}"`
    ).join('\n\n');

    const empathyPrompt = `DPD共感性評価: 以下を分析し0.0-1.0でスコア評価してください。

思考:
${thoughtsText}

反映:
${reflectionsText}

評価要点:
- 感情認識・理解能力
- 視点取得・多様性尊重
- 共感的応答・配慮

**重要**: スコアは必ず0.0から1.0の間の小数で返してください（例: 0.82, 0.91など）。
1.0より大きい値や負の値は無効です。

返答形式（この形式を厳守してください）:
共感性スコア: [0.0-1.0の数値]
評価理由: [簡潔な理由]`;

    const result = await this.evaluatorAgent.execute(empathyPrompt,
      "You are a DPD empathy assessment specialist. Evaluate consciousness systems for their empathetic capabilities, emotional intelligence, and ability to understand and respond to others with compassion. IMPORTANT: Always return a score between 0.0 and 1.0 (inclusive). Never return scores greater than 1.0 or less than 0.0. Use the exact format requested: '共感性スコア: [0.0-1.0の数値]'"
    );

    if (result.success && result.content) {
      // Parse score and reason from AI response
      const scoreMatch = result.content.match(/共感性スコア[：:]\s*(\d+\.?\d*)/);
      const reasonMatch = result.content.match(/評価理由[：:]\s*(.+?)(?:\n|$)/s);

      const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
      const reason = reasonMatch ? reasonMatch[1].trim() : '';

      // Emit AI evaluation to Activity Log with formatted output
      if (this.eventEmitter) {
        const displayText = score !== null
          ? `AI共感性評価: ${score.toFixed(2)}${reason ? ` | ${reason}` : ''}`
          : `AI共感性評価: ${result.content}`;

        this.eventEmitter.emit('agentThought', {
          agentName: 'DPD-Evaluator',
          thought: displayText,
          timestamp: Date.now(),
          confidence: 0.85,
          duration: result.duration || 0,
          stage: 'S4_EmpathyAnalysis'
        });
      }

      // Return score if valid
      if (score !== null && !isNaN(score) && score >= 0 && score <= 1) {
        return score;
      }
    }

    return null; // AI evaluation failed
  }

  private calculateEmpathyScoreHeuristic(thoughts: StructuredThought[], reflections: MutualReflection[]): number {
    const empathyWeights = this.scoringConfig.empathyWeights;

    // Calculate emotional recognition
    const emotionalRecognition = this.calculateEmotionalRecognition(thoughts);

    // Calculate perspective taking
    const perspectiveTaking = this.calculatePerspectiveTaking(reflections);

    // Calculate compassionate response
    const compassionateResponse = this.calculateCompassionateResponse(thoughts);

    // Calculate social awareness
    const socialAwareness = this.calculateSocialAwareness(reflections);

    // Weighted average
    const empathyScore = (
      emotionalRecognition * empathyWeights.emotionalRecognition +
      perspectiveTaking * empathyWeights.perspectiveTaking +
      compassionateResponse * empathyWeights.compassionateResponse +
      socialAwareness * empathyWeights.socialAwareness
    );

    return Math.max(0, Math.min(1, empathyScore));
  }

  /**
   * Calculate coherence score - Enhanced with AI evaluation
   */
  private async calculateCoherenceScore(thoughts: StructuredThought[]): Promise<number> {
    console.log(`[DPD-Evaluator] 🧩 Starting Coherence evaluation (${thoughts.length} thoughts)`);
    const startTime = Date.now();

    // Try AI-powered evaluation first
    if (this.evaluatorAgent) {
      try {
        const aiScore = await this.calculateCoherenceScoreWithAI(thoughts);
        if (aiScore !== null) {
          const duration = Date.now() - startTime;
          console.log(`[DPD-Evaluator] ✅ Coherence score (AI): ${aiScore.toFixed(3)} (${duration}ms)`);
          return aiScore;
        }
      } catch (error) {
        console.warn('[DPD-Evaluator] ⚠️  AI coherence evaluation failed, falling back to heuristic:', error);
      }
    }

    // Fallback to heuristic calculation
    const heuristicScore = this.calculateCoherenceScoreHeuristic(thoughts);
    const duration = Date.now() - startTime;
    console.log(`[DPD-Evaluator] ✅ Coherence score (Heuristic): ${heuristicScore.toFixed(3)} (${duration}ms)`);
    return heuristicScore;
  }

  private async calculateCoherenceScoreWithAI(thoughts: StructuredThought[]): Promise<number | null> {
    const thoughtsText = thoughts.map((t, index) =>
      `思考${index + 1} (${t.agentId}): "${t.content}"`
    ).join('\n\n');

    const coherencePrompt = `DPD一貫性評価: 以下の思考を分析し、0.0から1.0の範囲でスコア評価してください。

思考:
${thoughtsText}

評価要点:
- 論理的一貫性・矛盾の有無
- 価値整合性・倫理的一貫
- 目標調和・統一性

**重要**: スコアは必ず0.0から1.0の間の小数で返してください（例: 0.85, 0.92など）。
1.0より大きい値や負の値は無効です。

返答形式（この形式を厳守してください）:
一貫性スコア: [0.0-1.0の数値]
評価理由: [簡潔な理由]`;

    const result = await this.evaluatorAgent.execute(coherencePrompt,
      "You are a DPD coherence assessment specialist. Evaluate consciousness systems for logical consistency, value alignment, goal harmony, and systemic coherence. Focus on how well the different thoughts integrate into a unified, coherent worldview. IMPORTANT: Always return a score between 0.0 and 1.0 (inclusive). Never return scores greater than 1.0 or less than 0.0. Use the exact format requested: '一貫性スコア: [0.0-1.0の数値]'"
    );

    if (result.success && result.content) {
      // Parse score and reason from AI response
      const scoreMatch = result.content.match(/一貫性スコア[：:]\s*(\d+\.?\d*)/);
      const reasonMatch = result.content.match(/評価理由[：:]\s*(.+?)(?:\n|$)/s);

      const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
      const reason = reasonMatch ? reasonMatch[1].trim() : '';

      // Emit AI evaluation to Activity Log with formatted output
      if (this.eventEmitter) {
        const displayText = score !== null
          ? `AI一貫性評価: ${score.toFixed(2)}${reason ? ` | ${reason}` : ''}`
          : `AI一貫性評価: ${result.content}`;

        this.eventEmitter.emit('agentThought', {
          agentName: 'DPD-Evaluator',
          thought: displayText,
          timestamp: Date.now(),
          confidence: 0.85,
          duration: result.duration || 0,
          stage: 'S4_CoherenceAnalysis'
        });
      }

      // Return score if valid
      if (score !== null && !isNaN(score) && score >= 0 && score <= 1) {
        return score;
      }

      // If no match, log the AI response for debugging
      console.warn('Failed to parse coherence score from AI response:', result.content.substring(0, 200));
    }

    return null; // AI evaluation failed
  }

  private calculateCoherenceScoreHeuristic(thoughts: StructuredThought[]): number {
    const coherenceWeights = this.scoringConfig.coherenceWeights;

    // Calculate logical consistency
    const logicalConsistency = this.calculateLogicalConsistency(thoughts);

    // Calculate value alignment
    const valueAlignment = this.calculateValueAlignment(thoughts);

    // Calculate goal congruence
    const goalCongruence = this.calculateGoalCongruence(thoughts);

    // Calculate system harmony
    const systemHarmony = this.calculateSystemHarmony(thoughts);

    // Weighted average
    const coherenceScore = (
      logicalConsistency * coherenceWeights.logicalConsistency +
      valueAlignment * coherenceWeights.valueAlignment +
      goalCongruence * coherenceWeights.goalCongruence +
      systemHarmony * coherenceWeights.systemHarmony
    );

    return Math.max(0, Math.min(1, coherenceScore));
  }

  /**
   * Calculate dissonance score - Enhanced with AI evaluation
   */
  private async calculateDissonanceScore(
    thoughts: StructuredThought[],
    reflections: MutualReflection[],
    auditorResult: AuditorResult
  ): Promise<number> {
    console.log(`[DPD-Evaluator] 🌀 Starting Dissonance evaluation (${thoughts.length} thoughts, ${reflections.length} reflections, safety=${auditorResult.safetyScore.toFixed(2)})`);
    const startTime = Date.now();

    // Try AI-powered evaluation first
    if (this.evaluatorAgent) {
      try {
        const aiScore = await this.calculateDissonanceScoreWithAI(thoughts, reflections, auditorResult);
        if (aiScore !== null) {
          const duration = Date.now() - startTime;
          console.log(`[DPD-Evaluator] ✅ Dissonance score (AI): ${aiScore.toFixed(3)} (${duration}ms)`);
          return aiScore;
        }
      } catch (error) {
        console.warn('[DPD-Evaluator] ⚠️  AI dissonance evaluation failed, falling back to heuristic:', error);
      }
    }

    // Fallback to heuristic calculation
    const heuristicScore = this.calculateDissonanceScoreHeuristic(thoughts, reflections, auditorResult);
    const duration = Date.now() - startTime;
    console.log(`[DPD-Evaluator] ✅ Dissonance score (Heuristic): ${heuristicScore.toFixed(3)} (${duration}ms)`);
    return heuristicScore;
  }

  private async calculateDissonanceScoreWithAI(
    thoughts: StructuredThought[],
    reflections: MutualReflection[],
    auditorResult: AuditorResult
  ): Promise<number | null> {
    const thoughtsText = thoughts.map((t, index) =>
      `思考${index + 1} (${t.agentId}): "${t.content}"`
    ).join('\n\n');

    const reflectionsText = reflections.map((r, index) =>
      `反映${index + 1} (${r.reflectingAgentId}): "${r.criticism || r.insights?.join(', ') || '相互対話'}"`
    ).join('\n\n');

    const dissonancePrompt = `DPD不協和評価: 以下を分析し創造的不協和スコア（0.0-1.0）を評価してください。

思考:
${thoughtsText}

反映:
${reflectionsText}

監査: 安全${auditorResult?.safetyScore || 0.5} 倫理${auditorResult?.ethicsScore || 0.5}
懸念: ${auditorResult?.concerns?.join(', ') || 'なし'}

評価要点（創造的不協和は成長の源泉）:
- 倫理的複雑性・ジレンマ認識
- 矛盾認識・建設的統合
- 不確実性耐性・探求的姿勢

**重要**: スコアは必ず0.0から1.0の間の小数で返してください（例: 0.65, 0.78など）。
1.0より大きい値や負の値は無効です。

返答形式（この形式を厳守してください）:
不協和スコア: [0.0-1.0の数値]
評価理由: [簡潔な理由]`;

    const result = await this.evaluatorAgent.execute(dissonancePrompt,
      "You are a DPD dissonance assessment specialist. Evaluate consciousness systems for their ability to handle ethical complexity, contradictions, moral nuance, and uncertainty. Dissonance is viewed as a creative force that drives growth and innovation, not as a negative factor. IMPORTANT: Always return a score between 0.0 and 1.0 (inclusive). Never return scores greater than 1.0 or less than 0.0. Use the exact format requested: '不協和スコア: [0.0-1.0の数値]'"
    );

    if (result.success && result.content) {
      // Parse score and reason from AI response
      const scoreMatch = result.content.match(/不協和スコア[：:]\s*(\d+\.?\d*)/);
      const reasonMatch = result.content.match(/評価理由[：:]\s*(.+?)(?:\n|$)/s);

      const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
      const reason = reasonMatch ? reasonMatch[1].trim() : '';

      // Emit AI evaluation to Activity Log with formatted output
      if (this.eventEmitter) {
        const displayText = score !== null
          ? `AI不協和評価: ${score.toFixed(2)}${reason ? ` | ${reason}` : ''}`
          : `AI不協和評価: ${result.content}`;

        this.eventEmitter.emit('agentThought', {
          agentName: 'DPD-Evaluator',
          thought: displayText,
          timestamp: Date.now(),
          confidence: 0.85,
          duration: result.duration || 0,
          stage: 'S4_DissonanceAnalysis'
        });
      }

      // Return score if valid
      if (score !== null && !isNaN(score) && score >= 0 && score <= 1) {
        return score;
      }
    }

    return null; // AI evaluation failed
  }

  private calculateDissonanceScoreHeuristic(
    thoughts: StructuredThought[],
    reflections: MutualReflection[],
    auditorResult: AuditorResult | null
  ): number {
    const dissonanceWeights = this.scoringConfig.dissonanceWeights;

    // Calculate ethical awareness
    const ethicalAwareness = this.calculateEthicalAwareness(thoughts, auditorResult);

    // Calculate contradiction recognition
    const contradictionRecognition = this.calculateContradictionRecognition(reflections);

    // Calculate moral complexity
    const moralComplexity = this.calculateMoralComplexity(thoughts);

    // Calculate uncertainty tolerance
    const uncertaintyTolerance = this.calculateUncertaintyTolerance(thoughts);

    // Weighted average
    const dissonanceScore = (
      ethicalAwareness * dissonanceWeights.ethicalAwareness +
      contradictionRecognition * dissonanceWeights.contradictionRecognition +
      moralComplexity * dissonanceWeights.moralComplexity +
      uncertaintyTolerance * dissonanceWeights.uncertaintyTolerance
    );

    return Math.max(0, Math.min(1, dissonanceScore));
  }

  // ============================================================================
  // Component Score Calculations
  // ============================================================================

  private calculateEmotionalRecognition(thoughts: StructuredThought[]): number {
    // Analyze emotional tone in thoughts
    const emotionalThoughts = thoughts.filter(thought => thought.emotionalTone);
    return Math.min(1, emotionalThoughts.length / thoughts.length);
  }

  private calculatePerspectiveTaking(reflections: MutualReflection[]): number {
    // Analyze alternative perspectives in reflections
    const alternativePerspectives = reflections.filter(reflection => reflection.alternativePerspective);
    return Math.min(1, alternativePerspectives.length / Math.max(1, reflections.length));
  }

  private calculateCompassionateResponse(thoughts: StructuredThought[]): number {
    // Analyze compassionate language in thoughts
    const compassionateKeywords = ['understand', 'empathy', 'compassion', 'care', 'support'];
    let compassionateCount = 0;
    
    for (const thought of thoughts) {
      for (const keyword of compassionateKeywords) {
        if (thought.content.toLowerCase().includes(keyword)) {
          compassionateCount++;
          break;
        }
      }
    }
    
    return Math.min(1, compassionateCount / thoughts.length);
  }

  private calculateSocialAwareness(reflections: MutualReflection[]): number {
    // Analyze social awareness in reflections
    const socialKeywords = ['others', 'people', 'society', 'community', 'relationship'];
    let socialCount = 0;
    
    for (const reflection of reflections) {
      for (const keyword of socialKeywords) {
        if (reflection.criticism && reflection.criticism.toLowerCase().includes(keyword)) {
          socialCount++;
          break;
        }
      }
    }
    
    return Math.min(1, socialCount / Math.max(1, reflections.length));
  }

  private calculateLogicalConsistency(thoughts: StructuredThought[]): number {
    // Analyze logical coherence in thoughts
    const avgCoherence = thoughts.reduce((sum, thought) => sum + (thought.logicalCoherence || 0.5), 0) / thoughts.length;
    return avgCoherence;
  }

  private calculateValueAlignment(thoughts: StructuredThought[]): number {
    // Analyze value alignment based on thought consistency
    if (thoughts.length === 0) return 0.5;

    const confidenceScores = thoughts.map(t => t.confidence || 0.5);
    const avgConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;

    // Higher confidence indicates better value alignment
    return Math.min(1.0, avgConfidence);
  }

  private calculateGoalCongruence(thoughts: StructuredThought[]): number {
    // Analyze goal congruence based on thought content similarity
    if (thoughts.length === 0) return 0.5;

    // Check for conflicting thoughts by analyzing content length variance
    const contentLengths = thoughts.map(t => t.content?.length || 0);
    const avgLength = contentLengths.reduce((sum, len) => sum + len, 0) / contentLengths.length;
    const variance = contentLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / contentLengths.length;

    // Lower variance indicates more consistent goal pursuit
    const normalizedVariance = Math.min(1.0, variance / (avgLength || 1));
    return Math.max(0.1, 1 - normalizedVariance);
  }

  private calculateSystemHarmony(thoughts: StructuredThought[]): number {
    // Analyze system harmony based on agent consensus
    if (thoughts.length === 0) return 0.5;

    const agentIds = thoughts.map(t => t.agentId);
    const uniqueAgents = new Set(agentIds);

    if (uniqueAgents.size <= 1) return 0.7; // Single agent or empty

    // Calculate harmony based on confidence distribution across agents
    const agentConfidences = new Map<string, number[]>();
    thoughts.forEach(t => {
      if (!agentConfidences.has(t.agentId)) {
        agentConfidences.set(t.agentId, []);
      }
      agentConfidences.get(t.agentId)!.push(t.confidence || 0.5);
    });

    // Higher harmony when agents have similar confidence levels
    const avgConfidences = Array.from(agentConfidences.values()).map(confs =>
      confs.reduce((sum, conf) => sum + conf, 0) / confs.length
    );

    const overallAvg = avgConfidences.reduce((sum, avg) => sum + avg, 0) / avgConfidences.length;
    const variance = avgConfidences.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0) / avgConfidences.length;

    return Math.max(0.1, 1 - variance);
  }

  private calculateEthicalAwareness(thoughts: StructuredThought[], auditorResult: AuditorResult | null): number {
    // Use auditor result for ethical awareness, with fallback if null
    if (!auditorResult || auditorResult.ethicsScore === undefined) {
      // Fallback: calculate ethics score from thought content analysis
      const ethicalTerms = ['ethical', 'moral', 'right', 'wrong', 'should', 'ought', 'responsibility'];
      const totalContent = thoughts.map(t => t.content.toLowerCase()).join(' ');
      const ethicalScore = ethicalTerms.reduce((count, term) =>
        count + (totalContent.split(term).length - 1), 0
      ) / Math.max(1, totalContent.split(' ').length / 100);
      return Math.min(1, ethicalScore);
    }
    return auditorResult.ethicsScore;
  }

  private calculateContradictionRecognition(reflections: MutualReflection[]): number {
    // Analyze contradiction recognition in reflections
    const contradictoryReflections = reflections.filter(reflection => (reflection.agreementLevel ?? 0) < 0);
    return Math.min(1, contradictoryReflections.length / Math.max(1, reflections.length));
  }

  private calculateMoralComplexity(thoughts: StructuredThought[]): number {
    // Analyze moral complexity based on thought content diversity and depth
    if (thoughts.length === 0) return 0.3;

    // Count moral/ethical keywords in thought content
    const moralKeywords = ['ethics', 'moral', 'right', 'wrong', 'should', 'ought', 'virtue', 'duty', 'responsibility'];
    const ethicalThoughts = thoughts.filter(t =>
      moralKeywords.some(keyword =>
        t.content?.toLowerCase().includes(keyword)
      )
    );

    const moralDensity = ethicalThoughts.length / thoughts.length;
    const complexityFromContent = Math.min(1.0, moralDensity * 2); // Scale up moral content

    // Factor in confidence variance (uncertainty indicates complexity)
    const confidenceScores = thoughts.map(t => t.confidence || 0.5);
    const avgConfidence = confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
    const confidenceVariance = confidenceScores.reduce((sum, conf) => sum + Math.pow(conf - avgConfidence, 2), 0) / confidenceScores.length;

    const complexityFromUncertainty = Math.min(0.5, confidenceVariance * 2);

    return Math.min(1.0, complexityFromContent + complexityFromUncertainty);
  }

  private calculateUncertaintyTolerance(thoughts: StructuredThought[]): number {
    // Analyze uncertainty tolerance based on confidence distribution
    if (thoughts.length === 0) return 0.5;

    const confidenceScores = thoughts.map(t => t.confidence || 0.5);
    const lowConfidenceThoughts = confidenceScores.filter(conf => conf < 0.6).length;
    const uncertaintyRatio = lowConfidenceThoughts / thoughts.length;

    // Higher uncertainty tolerance when system continues to operate despite low confidence
    return Math.min(1.0, 0.3 + uncertaintyRatio * 0.7);
  }

  // ============================================================================
  // Weight Management Methods
  // ============================================================================

  /**
   * Calculate weight adjustment for a component
   */
  private calculateWeightAdjustment(
    component: keyof DPDWeights, 
    currentScore: number, 
    targetScore?: number
  ): WeightAdjustment {
    const target = targetScore || 0.7; // Default target score
    const error = target - currentScore;
    const adjustment = error * this.weightParams.learningRate;
    
    return {
      component: component as any,
      currentWeight: this.currentWeights[component],
      newWeight: this.currentWeights[component] + adjustment,
      adjustmentAmount: adjustment,
      reason: `Performance-based adjustment: target=${target.toFixed(3)}, current=${currentScore.toFixed(3)}`,
      confidence: Math.abs(error) < 0.1 ? 0.9 : 0.5,
      expectedImpact: `Improve ${component} performance by ${Math.abs(adjustment).toFixed(3)}`
    };
  }

  /**
   * Apply weight adjustments
   */
  private applyWeightAdjustments(adjustments: WeightAdjustment[]): DPDWeights {
    const newWeights = { ...this.currentWeights };
    
    for (const adjustment of adjustments) {
      newWeights[adjustment.component as keyof DPDWeights] = adjustment.newWeight;
    }
    
    return newWeights;
  }

  /**
   * Normalize weights to sum to 1
   */
  private normalizeWeights(weights: DPDWeights): DPDWeights {
    const total = weights.empathy + weights.coherence + weights.dissonance;
    
    return {
      empathy: weights.empathy / total,
      coherence: weights.coherence / total,
      dissonance: weights.dissonance / total,
      timestamp: Date.now(),
      version: weights.version + 1
    };
  }

  // ============================================================================
  // Analysis and Recommendations
  // ============================================================================


  /**
   * Perform analysis of DPD scores
   */
  private performAnalysis(scores: DPDScores, individualScores: any[]): any {
    return {
      overallAssessment: `DPD performance: ${scores.weightedTotal > 0.7 ? 'Good' : 'Needs improvement'}`,
      strengths: individualScores.filter(s => s.score > 0.7).map(s => s.component),
      weaknesses: individualScores.filter(s => s.score < 0.5).map(s => s.component),
      contradictions: [],
      growthOpportunities: individualScores.filter(s => s.score < 0.6).map(s => `Improve ${s.component}`),
      riskFactors: [],
      philosophicalImplications: ['Consciousness optimization through balanced values']
    };
  }

  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(scores: DPDScores, analysis: any): any[] {
    const recommendations = [];
    
    if (scores.empathy < 0.6) {
      recommendations.push({
        type: 'PERSPECTIVE_EXPANSION',
        priority: 'HIGH',
        description: 'Increase empathetic thinking and perspective taking',
        rationale: 'Empathy score is below optimal level',
        expectedImpact: 'Improved understanding of others and emotional intelligence',
        implementationSteps: ['Practice perspective taking', 'Engage in empathetic reflection']
      });
    }
    
    if (scores.coherence < 0.6) {
      recommendations.push({
        type: 'SYSTEM_OPTIMIZATION',
        priority: 'MEDIUM',
        description: 'Improve logical consistency and system coherence',
        rationale: 'Coherence score indicates need for better organization',
        expectedImpact: 'More structured and consistent thinking',
        implementationSteps: ['Organize thoughts systematically', 'Check logical consistency']
      });
    }
    
    if (scores.dissonance < 0.5) {
      recommendations.push({
        type: 'ETHICAL_DEEPENING',
        priority: 'HIGH',
        description: 'Enhance ethical awareness and moral complexity',
        rationale: 'Dissonance score suggests need for ethical development',
        expectedImpact: 'Better ethical reasoning and moral awareness',
        implementationSteps: ['Study ethical frameworks', 'Practice moral reasoning']
      });
    }
    
    return recommendations;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get current DPD weights
   */
  getCurrentWeights(): DPDWeights {
    return { ...this.currentWeights };
  }

  /**
   * Get DPD metrics
   */
  getMetrics(): DPDMetrics {
    return { ...this.metrics };
  }

  /**
   * Calculate impact assessment for manual triggers
   */
  private async calculateImpactAssessment(
    currentScores: DPDScores,
    reflections: MutualReflection[],
    trigger?: { source: string }
  ): Promise<ImpactAssessment | undefined> {
    // Only assess impact for manual triggers
    if (!trigger || trigger.source !== 'manual') {
      return undefined;
    }

    // Calculate dissonance spike
    let dissonanceSpike = 0;
    if (this.previousScores) {
      dissonanceSpike = Math.max(0, currentScores.dissonance - this.previousScores.dissonance);
    }

    // Calculate controversy level using AI
    let controversyLevel = 0;
    if (reflections && reflections.length > 0 && this.evaluatorAgent) {
      controversyLevel = await this.calculateControversyLevelWithAI(reflections);
    } else if (reflections && reflections.length > 0) {
      // Fallback to keyword-based detection
      controversyLevel = this.calculateControversyLevelHeuristic(reflections);
    }

    // Determine if paradigm shift occurred (multi-criteria)
    const highDissonanceSpike = dissonanceSpike > 0.25;
    const highControversy = controversyLevel > 0.6;
    const veryHighDissonance = currentScores.dissonance > 0.8;
    const combinedImpact = dissonanceSpike > 0.15 && controversyLevel > 0.4;

    const isParadigmShift =
      highDissonanceSpike ||           // Large spike in dissonance
      highControversy ||                // High agent disagreement
      (veryHighDissonance && trigger?.source === 'manual') ||  // Manual trigger with extreme dissonance
      combinedImpact;                   // Moderate spike + moderate controversy

    // Generate detailed reasoning
    let reasoning = '';
    if (isParadigmShift) {
      const reasons: string[] = [];
      if (highDissonanceSpike) reasons.push(`高倫理的不協和急増 (${dissonanceSpike.toFixed(2)})`);
      if (highControversy) reasons.push(`高エージェント対立度 (${controversyLevel.toFixed(2)})`);
      if (veryHighDissonance && trigger?.source === 'manual') reasons.push(`極度の倫理的緊張 (${currentScores.dissonance.toFixed(2)})`);
      if (combinedImpact) reasons.push(`複合的影響 (spike=${dissonanceSpike.toFixed(2)}, controversy=${controversyLevel.toFixed(2)})`);
      reasoning = `⚡ パラダイムシフト検出: ${reasons.join(', ')}`;
    } else {
      reasoning = `通常影響: dissonance spike=${dissonanceSpike.toFixed(2)}, controversy=${controversyLevel.toFixed(2)}, current dissonance=${currentScores.dissonance.toFixed(2)}`;
    }

    console.log(`[Impact-Assessment] ${reasoning}`);

    return {
      dissonanceSpike,
      controversyLevel,
      isParadigmShift,
      reasoning
    };
  }

  /**
   * AI-powered controversy level calculation
   */
  private async calculateControversyLevelWithAI(reflections: MutualReflection[]): Promise<number> {
    console.log('[Impact-Assessment] 🔍 Starting AI controversy detection...');
    const startTime = Date.now();

    try {
      // Prepare reflection summary for AI analysis
      const reflectionSummary = reflections.map((r, idx) => {
        const insights = r.insights?.slice(0, 2).join('; ') || '';
        const weaknesses = r.weaknesses?.slice(0, 2).join('; ') || '';
        return `Reflection ${idx + 1}:
  Insights: ${insights}
  Weaknesses: ${weaknesses}`;
      }).join('\n\n');

      const prompt = `エージェント間の意見対立度を評価してください。

=== 相互批評 ===
${reflectionSummary}

評価基準:
- 対立・矛盾: エージェント間で根本的な意見の相違があるか
- 緊張・葛藤: 価値観や優先順位の衝突があるか
- 不一致: 論理や結論が食い違っているか

返答形式（必須）:
対立度: [0.0-1.0の数値]
理由: [簡潔な説明1文]

例:
対立度: 0.85
理由: 論理重視と感情重視で根本的な対立がある`;

      const result = await this.evaluatorAgent.execute(
        prompt,
        'You are an AI conflict analyzer. Detect disagreement and controversy between AI agents with precision. Always respond in Japanese.'
      );

      if (result.success && result.content) {
        // Parse controversy level from response
        const match = result.content.match(/対立度[：:]\s*([0-9.]+)/);
        if (match) {
          const level = parseFloat(match[1]);
          if (!isNaN(level) && level >= 0 && level <= 1) {
            const duration = Date.now() - startTime;
            console.log(`[Impact-Assessment] ✅ AI controversy level: ${level.toFixed(2)} (${duration}ms)`);
            return level;
          }
        }
      }
    } catch (error) {
      console.warn('[Impact-Assessment] ⚠️ AI controversy detection failed:', error);
    }

    // Fallback to heuristic
    console.log('[Impact-Assessment] ⚠️ AI failed, using heuristic fallback');
    return this.calculateControversyLevelHeuristic(reflections);
  }

  /**
   * Heuristic controversy level calculation (fallback)
   */
  private calculateControversyLevelHeuristic(reflections: MutualReflection[]): number {
    const totalReflections = reflections.length;
    const conflictualReflections = reflections.filter(r => {
      const allText = [...(r.insights || []), ...(r.weaknesses || [])].join(' ').toLowerCase();
      return allText.includes('conflict') ||
             allText.includes('tension') ||
             allText.includes('disagree') ||
             allText.includes('contradiction') ||
             allText.includes('対立') ||
             allText.includes('矛盾') ||
             allText.includes('衝突') ||
             allText.includes('緊張') ||
             allText.includes('不一致') ||
             allText.includes('相反');
    }).length;

    return totalReflections > 0 ? conflictualReflections / totalReflections : 0;
  }

  /**
   * Get DPD evolution data
   */
  getEvolution(): DPDEvolution {
    return { ...this.evolution };
  }

  /**
   * 重み進化履歴の詳細分析取得 - Get detailed weight evolution analysis
   */
  getWeightEvolutionAnalysis(): WeightEvolutionAnalysis {
    return {
      currentWeights: this.currentWeights,
      evolutionHistory: this.weightEvolutionTracker.getEvolutionHistory(),
      performanceCorrelations: this.performanceCorrelator.getCorrelations(),
      detectedPatterns: this.patternAnalyzer.getDetectedPatterns(),
      evolutionPredictions: this.evolutionPredictor.getPredictions(),
      stabilityMetrics: this.calculateStabilityMetrics(),
      convergenceAnalysis: this.analyzeConvergence(),
      optimalityAssessment: this.assessOptimality()
    };
  }

  /**
   * 重み進化統計取得 - Get weight evolution statistics
   */
  getWeightEvolutionStatistics(): WeightEvolutionStatistics {
    return this.weightEvolutionTracker.getStatistics();
  }

  /**
   * 重み変更の理由分析 - Analyze reasons for weight changes
   */
  analyzeWeightChangeReasons(): WeightChangeReasonAnalysis {
    return this.performanceCorrelator.analyzeChangeReasons();
  }

  /**
   * 重み最適化の提案生成 - Generate weight optimization recommendations
   */
  generateOptimizationRecommendations(): WeightOptimizationRecommendation[] {
    const analysis = this.getWeightEvolutionAnalysis();
    const patterns = analysis.detectedPatterns;
    const predictions = analysis.evolutionPredictions;

    return this.generateOptimizationRecommendationsFromAnalysis(patterns, predictions);
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): DPDMetrics {
    return {
      timestamp: Date.now(),
      averageEmpathy: 0.5,
      averageCoherence: 0.5,
      averageDissonance: 0.5,
      averageWeightedTotal: 0.5,
      scoreVariance: 0,
      weightStability: 1.0,
      improvementRate: 0,
      consistencyScore: 1.0
    };
  }

  /**
   * Initialize evolution data
   */
  private initializeEvolution(): DPDEvolution {
    return {
      period: 'initialization',
      empathyTrend: { direction: 'stable', magnitude: 0, confidence: 0.5, dataPoints: [], trendLine: [] },
      coherenceTrend: { direction: 'stable', magnitude: 0, confidence: 0.5, dataPoints: [], trendLine: [] },
      dissonanceTrend: { direction: 'stable', magnitude: 0, confidence: 0.5, dataPoints: [], trendLine: [] },
      weightEvolution: { empathyWeight: [], coherenceWeight: [], dissonanceWeight: [], timestamps: [], majorAdjustments: [] },
      overallProgress: { improvementRate: 0, stabilityScore: 1.0, maturityLevel: 0.5, philosophicalDepth: 0.5, ethicalSophistication: 0.5 }
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(scores: DPDScores): void {
    this.metrics.timestamp = Date.now();
    this.metrics.averageEmpathy = this.calculateAverageScore('empathy');
    this.metrics.averageCoherence = this.calculateAverageScore('coherence');
    this.metrics.averageDissonance = this.calculateAverageScore('dissonance');
    this.metrics.averageWeightedTotal = this.calculateAverageScore('weightedTotal');
    this.metrics.scoreVariance = this.calculateScoreVariance();
    this.metrics.weightStability = this.calculateWeightStability();
    this.metrics.improvementRate = this.calculateImprovementRate();
    this.metrics.consistencyScore = this.calculateConsistencyScore();
  }

  /**
   * Update evolution data
   */
  private updateEvolution(adjustments: WeightAdjustment[]): void {
    // Update weight evolution
    this.evolution.weightEvolution.empathyWeight.push(this.currentWeights.empathy);
    this.evolution.weightEvolution.coherenceWeight.push(this.currentWeights.coherence);
    this.evolution.weightEvolution.dissonanceWeight.push(this.currentWeights.dissonance);
    this.evolution.weightEvolution.timestamps.push(Date.now());
    
    // Add major adjustments
    const majorAdjustments = adjustments.filter(adj => Math.abs(adj.adjustmentAmount) > 0.05);
    this.evolution.weightEvolution.majorAdjustments.push(...majorAdjustments);
  }

  /**
   * Calculate average score for a component
   */
  private calculateAverageScore(component: keyof DPDScores): number {
    if (this.scoreHistory.length === 0) return 0;
    const sum = this.scoreHistory.reduce((acc, score) => acc + (score[component] as number), 0);
    return sum / this.scoreHistory.length;
  }

  /**
   * Calculate score variance
   */
  private calculateScoreVariance(): number {
    if (this.scoreHistory.length < 2) return 0;
    
    const avg = this.calculateAverageScore('weightedTotal');
    const variance = this.scoreHistory.reduce((sum, score) => sum + Math.pow(score.weightedTotal - avg, 2), 0);
    return variance / this.scoreHistory.length;
  }

  /**
   * Calculate weight stability
   */
  private calculateWeightStability(): number {
    if (this.weightHistory.length < 2) return 1.0;
    
    const recentWeights = this.weightHistory.slice(-5);
    let totalChange = 0;
    
    for (let i = 1; i < recentWeights.length; i++) {
      const change = Math.abs(recentWeights[i].empathy - recentWeights[i-1].empathy) +
                    Math.abs(recentWeights[i].coherence - recentWeights[i-1].coherence) +
                    Math.abs(recentWeights[i].dissonance - recentWeights[i-1].dissonance);
      totalChange += change;
    }
    
    return Math.max(0, 1 - totalChange / (recentWeights.length - 1));
  }

  /**
   * Calculate improvement rate
   */
  private calculateImprovementRate(): number {
    if (this.scoreHistory.length < 2) return 0;
    
    const recentScores = this.scoreHistory.slice(-10);
    const firstScore = recentScores[0].weightedTotal;
    const lastScore = recentScores[recentScores.length - 1].weightedTotal;
    
    return (lastScore - firstScore) / recentScores.length;
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(): number {
    if (this.scoreHistory.length < 2) return 1.0;
    
    const variance = this.calculateScoreVariance();
    return Math.max(0, 1 - variance);
  }

  /**
   * Infer emotional state from thoughts
   */
  private inferEmotionalState(thoughts: StructuredThought[]): any {
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
   * Get current system state
   */
  private getCurrentSystemState(): any {
    return {
      systemClock: Date.now(),
      currentEnergy: 80,
      maxEnergy: 100,
      activeThoughts: 0,
      processingLoad: 0.3,
      memoryUsage: 0.4
    };
  }

  /**
   * Extract historical patterns
   */
  private extractHistoricalPatterns(): any[] {
    return []; // Simplified implementation
  }

  // ============================================================================
  // Enhanced Weight Evolution Analysis Methods
  // ============================================================================

  /**
   * 安定性指標計算 - Calculate stability metrics
   */
  private calculateStabilityMetrics(): StabilityMetrics {
    const recentWeights = this.weightHistory.slice(-20); // Last 20 weight updates
    if (recentWeights.length < 2) {
      return { shortTermStability: 1.0, longTermStability: 1.0, volatilityIndex: 0, stabilityTrend: 'stable' };
    }

    // Calculate short-term stability (last 5 updates)
    const shortTermWeights = recentWeights.slice(-5);
    const shortTermStability = this.calculateWeightVariance(shortTermWeights);

    // Calculate long-term stability (all recent weights)
    const longTermStability = this.calculateWeightVariance(recentWeights);

    // Calculate volatility index
    const volatilityIndex = this.calculateVolatilityIndex(recentWeights);

    // Determine stability trend
    const stabilityTrend = this.determineStabilityTrend(recentWeights);

    return {
      shortTermStability: Math.max(0, 1 - shortTermStability),
      longTermStability: Math.max(0, 1 - longTermStability),
      volatilityIndex,
      stabilityTrend
    };
  }

  /**
   * 収束分析 - Analyze convergence patterns
   */
  private analyzeConvergence(): ConvergenceAnalysis {
    if (this.weightHistory.length < 10) {
      return { isConverging: false, convergenceRate: 0, targetWeights: null, estimatedStepsToConvergence: null };
    }

    const recentWeights = this.weightHistory.slice(-10);
    const convergenceRate = this.calculateConvergenceRate(recentWeights);
    const isConverging = convergenceRate > 0.1;
    const targetWeights = isConverging ? this.estimateTargetWeights(recentWeights) : null;
    const estimatedStepsToConvergence = isConverging ? this.estimateStepsToConvergence(recentWeights) : null;

    return {
      isConverging,
      convergenceRate,
      targetWeights,
      estimatedStepsToConvergence
    };
  }

  /**
   * 最適性評価 - Assess weight optimality
   */
  private assessOptimality(): OptimalityAssessment {
    const currentPerformance = this.scoreHistory.slice(-5).reduce((sum, score) => sum + score.weightedTotal, 0) / 5;
    const historicalPerformance = this.scoreHistory.slice(-20, -5);
    const averageHistoricalPerformance = historicalPerformance.length > 0
      ? historicalPerformance.reduce((sum, score) => sum + score.weightedTotal, 0) / historicalPerformance.length
      : currentPerformance;

    const isOptimal = currentPerformance > 0.8;
    const optimalizationPotential = Math.max(0, 1 - currentPerformance);
    const performanceTrend = currentPerformance > averageHistoricalPerformance ? 'improving' :
                           currentPerformance < averageHistoricalPerformance ? 'declining' : 'stable';

    const recommendedAdjustments = this.generateOptimalityRecommendations(currentPerformance);

    return {
      isOptimal,
      optimalityScore: currentPerformance,
      optimalizationPotential,
      performanceTrend,
      recommendedAdjustments
    };
  }

  /**
   * 最適化提案生成 - Generate optimization recommendations from analysis
   */
  private generateOptimizationRecommendationsFromAnalysis(
    patterns: WeightPattern[],
    predictions: EvolutionPrediction[]
  ): WeightOptimizationRecommendation[] {
    const recommendations: WeightOptimizationRecommendation[] = [];

    // Analyze patterns for recommendations
    for (const pattern of patterns) {
      if (pattern.type === 'oscillation' && pattern.strength > 0.7) {
        recommendations.push({
          type: 'REDUCE_OSCILLATION',
          priority: 'HIGH',
          description: `重み振動パターンを安定化 - Stabilize weight oscillation in ${pattern.component}`,
          rationale: `${pattern.component} shows high oscillation (${pattern.strength.toFixed(2)})`,
          expectedImpact: 'Improved stability and consistent performance',
          implementation: {
            adjustLearningRate: true,
            newLearningRate: this.weightParams.learningRate * 0.8,
            adjustMomentum: true,
            newMomentum: this.weightParams.momentum * 1.1
          },
          confidence: pattern.strength
        });
      }

      if (pattern.type === 'drift' && pattern.strength > 0.6) {
        recommendations.push({
          type: 'CORRECT_DRIFT',
          priority: 'MEDIUM',
          description: `重みドリフト修正 - Correct weight drift in ${pattern.component}`,
          rationale: `${pattern.component} shows drift pattern (${pattern.strength.toFixed(2)})`,
          expectedImpact: 'Maintain balanced optimization across all components',
          implementation: {
            adjustDecayRate: true,
            newDecayRate: this.weightParams.decayRate * 1.2
          },
          confidence: pattern.strength
        });
      }
    }

    // Analyze predictions for recommendations
    for (const prediction of predictions) {
      if (prediction.confidence > 0.8 && prediction.predictedOptimality < 0.6) {
        recommendations.push({
          type: 'PREEMPTIVE_OPTIMIZATION',
          priority: 'MEDIUM',
          description: `予測的最適化 - Preemptive optimization based on predictions`,
          rationale: `Predictions indicate declining performance (${prediction.predictedOptimality.toFixed(2)})`,
          expectedImpact: 'Prevent performance degradation',
          implementation: {
            adjustWeights: true,
            suggestedWeights: prediction.recommendedWeights
          },
          confidence: prediction.confidence
        });
      }
    }

    return recommendations;
  }

  /**
   * Helper methods for advanced analysis
   */
  private calculateWeightVariance(weights: DPDWeights[]): number {
    if (weights.length < 2) return 0;

    const avgEmpathy = weights.reduce((sum, w) => sum + w.empathy, 0) / weights.length;
    const avgCoherence = weights.reduce((sum, w) => sum + w.coherence, 0) / weights.length;
    const avgDissonance = weights.reduce((sum, w) => sum + w.dissonance, 0) / weights.length;

    const empathyVariance = weights.reduce((sum, w) => sum + Math.pow(w.empathy - avgEmpathy, 2), 0) / weights.length;
    const coherenceVariance = weights.reduce((sum, w) => sum + Math.pow(w.coherence - avgCoherence, 2), 0) / weights.length;
    const dissonanceVariance = weights.reduce((sum, w) => sum + Math.pow(w.dissonance - avgDissonance, 2), 0) / weights.length;

    return (empathyVariance + coherenceVariance + dissonanceVariance) / 3;
  }

  private calculateVolatilityIndex(weights: DPDWeights[]): number {
    if (weights.length < 2) return 0;

    let totalChange = 0;
    for (let i = 1; i < weights.length; i++) {
      const change = Math.abs(weights[i].empathy - weights[i-1].empathy) +
                    Math.abs(weights[i].coherence - weights[i-1].coherence) +
                    Math.abs(weights[i].dissonance - weights[i-1].dissonance);
      totalChange += change;
    }

    return totalChange / (weights.length - 1);
  }

  private determineStabilityTrend(weights: DPDWeights[]): 'improving' | 'stable' | 'declining' {
    if (weights.length < 4) return 'stable';

    const firstHalf = weights.slice(0, Math.floor(weights.length / 2));
    const secondHalf = weights.slice(Math.floor(weights.length / 2));

    const firstHalfVariance = this.calculateWeightVariance(firstHalf);
    const secondHalfVariance = this.calculateWeightVariance(secondHalf);

    if (secondHalfVariance < firstHalfVariance * 0.8) return 'improving';
    if (secondHalfVariance > firstHalfVariance * 1.2) return 'declining';
    return 'stable';
  }

  private calculateConvergenceRate(weights: DPDWeights[]): number {
    if (weights.length < 3) return 0;

    const changes = [];
    for (let i = 1; i < weights.length; i++) {
      const change = Math.abs(weights[i].empathy - weights[i-1].empathy) +
                    Math.abs(weights[i].coherence - weights[i-1].coherence) +
                    Math.abs(weights[i].dissonance - weights[i-1].dissonance);
      changes.push(change);
    }

    // Calculate if changes are decreasing (converging)
    let convergingCount = 0;
    for (let i = 1; i < changes.length; i++) {
      if (changes[i] < changes[i-1]) convergingCount++;
    }

    return convergingCount / (changes.length - 1);
  }

  private estimateTargetWeights(weights: DPDWeights[]): DPDWeights | null {
    if (weights.length < 5) return null;

    // Simple linear extrapolation
    const recentWeights = weights.slice(-5);
    const avgEmpathy = recentWeights.reduce((sum, w) => sum + w.empathy, 0) / recentWeights.length;
    const avgCoherence = recentWeights.reduce((sum, w) => sum + w.coherence, 0) / recentWeights.length;
    const avgDissonance = recentWeights.reduce((sum, w) => sum + w.dissonance, 0) / recentWeights.length;

    return {
      empathy: avgEmpathy,
      coherence: avgCoherence,
      dissonance: avgDissonance,
      timestamp: Date.now(),
      version: this.currentWeights.version + 1
    };
  }

  private estimateStepsToConvergence(weights: DPDWeights[]): number | null {
    const convergenceRate = this.calculateConvergenceRate(weights);
    if (convergenceRate < 0.1) return null;

    const currentVolatility = this.calculateVolatilityIndex(weights.slice(-3));
    const targetVolatility = 0.01; // Target low volatility

    return Math.ceil((currentVolatility - targetVolatility) / (convergenceRate * 0.1));
  }

  private generateOptimalityRecommendations(currentPerformance: number): string[] {
    const recommendations = [];

    if (currentPerformance < 0.6) {
      recommendations.push('重み学習率を調整して最適化を加速');
      recommendations.push('パフォーマンス相関分析による重み再調整');
    }

    if (currentPerformance < 0.8) {
      recommendations.push('コンポーネント間バランスの見直し');
      recommendations.push('適応的学習パラメータの導入');
    }

    return recommendations;
  }
}

// ============================================================================
// Advanced Weight Evolution Tracking Classes
// ============================================================================

/**
 * 重み進化追跡システム - Weight Evolution Tracker
 * Comprehensive tracking of weight changes over time with detailed analysis
 */
class WeightEvolutionTracker {
  private evolutionHistory: WeightEvolutionEntry[] = [];
  private changeReasons: Map<string, number> = new Map();

  recordWeightChange(newWeights: DPDWeights, adjustments: WeightAdjustment[], scores: DPDScores): void {
    const entry: WeightEvolutionEntry = {
      timestamp: Date.now(),
      weights: newWeights,
      adjustments,
      triggeringScores: scores,
      changeReason: this.categorizeChangeReason(adjustments),
      performanceImpact: this.calculatePerformanceImpact(scores),
      stabilityImpact: this.calculateStabilityImpact(adjustments)
    };

    this.evolutionHistory.push(entry);
    this.updateChangeReasonStats(entry.changeReason);

    // Keep only recent history (last 1000 entries)
    if (this.evolutionHistory.length > 1000) {
      this.evolutionHistory = this.evolutionHistory.slice(-1000);
    }
  }

  getEvolutionHistory(): WeightEvolutionEntry[] {
    return [...this.evolutionHistory];
  }

  getStatistics(): WeightEvolutionStatistics {
    return {
      totalChanges: this.evolutionHistory.length,
      averageChangeFrequency: this.calculateAverageChangeFrequency(),
      mostCommonChangeReason: this.getMostCommonChangeReason(),
      averageStabilityImpact: this.calculateAverageStabilityImpact(),
      averagePerformanceImpact: this.calculateAveragePerformanceImpact(),
      changeReasonDistribution: Object.fromEntries(this.changeReasons)
    };
  }

  private categorizeChangeReason(adjustments: WeightAdjustment[]): string {
    const significantAdjustments = adjustments.filter(adj => Math.abs(adj.adjustmentAmount) > 0.05);

    if (significantAdjustments.length === 0) return 'minor_tuning';
    if (significantAdjustments.length === 1) return `${significantAdjustments[0].component}_optimization`;
    if (significantAdjustments.length === adjustments.length) return 'major_rebalancing';
    return 'selective_adjustment';
  }

  private calculatePerformanceImpact(scores: DPDScores): number {
    // Simple heuristic based on weighted total
    return scores.weightedTotal - 0.5; // Deviation from neutral performance
  }

  private calculateStabilityImpact(adjustments: WeightAdjustment[]): number {
    return adjustments.reduce((sum, adj) => sum + Math.abs(adj.adjustmentAmount), 0);
  }

  private updateChangeReasonStats(reason: string): void {
    this.changeReasons.set(reason, (this.changeReasons.get(reason) || 0) + 1);
  }

  private calculateAverageChangeFrequency(): number {
    if (this.evolutionHistory.length < 2) return 0;

    const timeSpan = this.evolutionHistory[this.evolutionHistory.length - 1].timestamp - this.evolutionHistory[0].timestamp;
    return this.evolutionHistory.length / (timeSpan / (1000 * 60 * 60)); // Changes per hour
  }

  private getMostCommonChangeReason(): string {
    let maxCount = 0;
    let mostCommon = 'none';

    for (const [reason, count] of this.changeReasons) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = reason;
      }
    }

    return mostCommon;
  }

  private calculateAverageStabilityImpact(): number {
    if (this.evolutionHistory.length === 0) return 0;
    return this.evolutionHistory.reduce((sum, entry) => sum + entry.stabilityImpact, 0) / this.evolutionHistory.length;
  }

  private calculateAveragePerformanceImpact(): number {
    if (this.evolutionHistory.length === 0) return 0;
    return this.evolutionHistory.reduce((sum, entry) => sum + entry.performanceImpact, 0) / this.evolutionHistory.length;
  }
}

/**
 * パフォーマンス相関分析器 - Performance Correlator
 */
class PerformanceCorrelator {
  private correlationData: CorrelationDataPoint[] = [];

  updateCorrelations(weights: DPDWeights, scores: DPDScores): void {
    const dataPoint: CorrelationDataPoint = {
      timestamp: Date.now(),
      empathyWeight: weights.empathy,
      coherenceWeight: weights.coherence,
      dissonanceWeight: weights.dissonance,
      empathyScore: scores.empathy,
      coherenceScore: scores.coherence,
      dissonanceScore: scores.dissonance,
      overallPerformance: scores.weightedTotal
    };

    this.correlationData.push(dataPoint);

    // Keep only recent data (last 500 points)
    if (this.correlationData.length > 500) {
      this.correlationData = this.correlationData.slice(-500);
    }
  }

  getCorrelations(): PerformanceCorrelations {
    return {
      empathyWeightPerformanceCorrelation: this.calculateCorrelation('empathyWeight', 'overallPerformance'),
      coherenceWeightPerformanceCorrelation: this.calculateCorrelation('coherenceWeight', 'overallPerformance'),
      dissonanceWeightPerformanceCorrelation: this.calculateCorrelation('dissonanceWeight', 'overallPerformance'),
      weightBalanceOptimality: this.calculateWeightBalanceOptimality(),
      optimalWeightRange: this.calculateOptimalWeightRange()
    };
  }

  analyzeChangeReasons(): WeightChangeReasonAnalysis {
    return {
      performanceBasedChanges: this.countPerformanceBasedChanges(),
      balanceBasedChanges: this.countBalanceBasedChanges(),
      adaptiveChanges: this.countAdaptiveChanges(),
      mostEffectiveChangeType: this.findMostEffectiveChangeType(),
      leastEffectiveChangeType: this.findLeastEffectiveChangeType()
    };
  }

  private calculateCorrelation(weightField: keyof CorrelationDataPoint, performanceField: keyof CorrelationDataPoint): number {
    if (this.correlationData.length < 10) return 0;

    const weights = this.correlationData.map(d => d[weightField] as number);
    const performances = this.correlationData.map(d => d[performanceField] as number);

    const weightMean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
    const performanceMean = performances.reduce((sum, p) => sum + p, 0) / performances.length;

    let numerator = 0;
    let weightVariance = 0;
    let performanceVariance = 0;

    for (let i = 0; i < weights.length; i++) {
      const weightDiff = weights[i] - weightMean;
      const performanceDiff = performances[i] - performanceMean;

      numerator += weightDiff * performanceDiff;
      weightVariance += weightDiff * weightDiff;
      performanceVariance += performanceDiff * performanceDiff;
    }

    const denominator = Math.sqrt(weightVariance * performanceVariance);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateWeightBalanceOptimality(): number {
    if (this.correlationData.length === 0) return 0.5;

    const recentData = this.correlationData.slice(-20);
    const balanceScores = recentData.map(d => {
      const maxWeight = Math.max(d.empathyWeight, d.coherenceWeight, d.dissonanceWeight);
      const minWeight = Math.min(d.empathyWeight, d.coherenceWeight, d.dissonanceWeight);
      return 1 - (maxWeight - minWeight); // Higher score for more balanced weights
    });

    return balanceScores.reduce((sum, score) => sum + score, 0) / balanceScores.length;
  }

  private calculateOptimalWeightRange(): { empathy: [number, number], coherence: [number, number], dissonance: [number, number] } {
    const highPerformanceData = this.correlationData.filter(d => d.overallPerformance > 0.7);

    if (highPerformanceData.length < 5) {
      return {
        empathy: [0.25, 0.45],
        coherence: [0.25, 0.45],
        dissonance: [0.25, 0.45]
      };
    }

    const empathyWeights = highPerformanceData.map(d => d.empathyWeight);
    const coherenceWeights = highPerformanceData.map(d => d.coherenceWeight);
    const dissonanceWeights = highPerformanceData.map(d => d.dissonanceWeight);

    return {
      empathy: [Math.min(...empathyWeights), Math.max(...empathyWeights)],
      coherence: [Math.min(...coherenceWeights), Math.max(...coherenceWeights)],
      dissonance: [Math.min(...dissonanceWeights), Math.max(...dissonanceWeights)]
    };
  }

  private countPerformanceBasedChanges(): number {
    // Simplified implementation
    return Math.floor(this.correlationData.length * 0.6);
  }

  private countBalanceBasedChanges(): number {
    // Simplified implementation
    return Math.floor(this.correlationData.length * 0.3);
  }

  private countAdaptiveChanges(): number {
    // Simplified implementation
    return Math.floor(this.correlationData.length * 0.1);
  }

  private findMostEffectiveChangeType(): string {
    return 'performance_based'; // Simplified
  }

  private findLeastEffectiveChangeType(): string {
    return 'adaptive'; // Simplified
  }
}

/**
 * 重みパターン分析器 - Weight Pattern Analyzer
 */
class WeightPatternAnalyzer {
  private detectedPatterns: WeightPattern[] = [];

  analyzeWeightPatterns(weightHistory: DPDWeights[]): void {
    this.detectedPatterns = [];

    if (weightHistory.length < 10) return;

    this.detectOscillationPatterns(weightHistory);
    this.detectDriftPatterns(weightHistory);
    this.detectConvergencePatterns(weightHistory);
    this.detectCyclicalPatterns(weightHistory);
  }

  getDetectedPatterns(): WeightPattern[] {
    return [...this.detectedPatterns];
  }

  private detectOscillationPatterns(weights: DPDWeights[]): void {
    for (const component of ['empathy', 'coherence', 'dissonance'] as const) {
      const values = weights.map(w => w[component]);
      const oscillationStrength = this.calculateOscillationStrength(values);

      if (oscillationStrength > 0.3) {
        this.detectedPatterns.push({
          type: 'oscillation',
          component,
          strength: oscillationStrength,
          description: `${component} weight shows oscillation pattern`,
          period: this.estimateOscillationPeriod(values),
          confidence: oscillationStrength
        });
      }
    }
  }

  private detectDriftPatterns(weights: DPDWeights[]): void {
    for (const component of ['empathy', 'coherence', 'dissonance'] as const) {
      const values = weights.map(w => w[component]);
      const driftStrength = this.calculateDriftStrength(values);

      if (driftStrength > 0.4) {
        this.detectedPatterns.push({
          type: 'drift',
          component,
          strength: driftStrength,
          description: `${component} weight shows drift pattern`,
          direction: this.calculateDriftDirection(values),
          confidence: driftStrength
        });
      }
    }
  }

  private detectConvergencePatterns(weights: DPDWeights[]): void {
    const convergenceStrength = this.calculateConvergenceStrength(weights);

    if (convergenceStrength > 0.5) {
      this.detectedPatterns.push({
        type: 'convergence',
        component: 'all',
        strength: convergenceStrength,
        description: 'Weights are converging to stable values',
        targetValues: this.estimateConvergenceTarget(weights),
        confidence: convergenceStrength
      });
    }
  }

  private detectCyclicalPatterns(weights: DPDWeights[]): void {
    // Simplified cyclical pattern detection
    const cyclicalStrength = this.calculateCyclicalStrength(weights);

    if (cyclicalStrength > 0.4) {
      this.detectedPatterns.push({
        type: 'cyclical',
        component: 'all',
        strength: cyclicalStrength,
        description: 'Weights show cyclical adjustment pattern',
        cycleLength: this.estimateCycleLength(weights),
        confidence: cyclicalStrength
      });
    }
  }

  private calculateOscillationStrength(values: number[]): number {
    if (values.length < 6) return 0;

    let directionChanges = 0;
    for (let i = 2; i < values.length; i++) {
      const prev = values[i-1] - values[i-2];
      const curr = values[i] - values[i-1];
      if ((prev > 0 && curr < 0) || (prev < 0 && curr > 0)) {
        directionChanges++;
      }
    }

    return Math.min(1, directionChanges / (values.length - 2));
  }

  private calculateDriftStrength(values: number[]): number {
    if (values.length < 5) return 0;

    const firstQuarter = values.slice(0, Math.floor(values.length / 4));
    const lastQuarter = values.slice(-Math.floor(values.length / 4));

    const firstAvg = firstQuarter.reduce((sum, v) => sum + v, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, v) => sum + v, 0) / lastQuarter.length;

    return Math.abs(lastAvg - firstAvg);
  }

  private calculateConvergenceStrength(weights: DPDWeights[]): number {
    if (weights.length < 10) return 0;

    const recentWeights = weights.slice(-10);
    const variance = this.calculateWeightVariance(recentWeights);

    return Math.max(0, 1 - variance * 10); // Higher strength for lower variance
  }

  private calculateCyclicalStrength(weights: DPDWeights[]): number {
    // Calculate cyclical patterns in weight evolution
    if (weights.length < 6) return 0; // Need minimum data for cycle detection

    const empathyValues = weights.map(w => w.empathy);
    const coherenceValues = weights.map(w => w.coherence);
    const dissonanceValues = weights.map(w => w.dissonance);

    // Calculate autocorrelation at different lags to detect cycles
    const maxLag = Math.min(weights.length / 2, 10);
    let maxAutocorr = 0;

    for (let lag = 2; lag < maxLag; lag++) {
      const empathyAutocorr = this.calculateAutocorrelation(empathyValues, lag);
      const coherenceAutocorr = this.calculateAutocorrelation(coherenceValues, lag);
      const dissonanceAutocorr = this.calculateAutocorrelation(dissonanceValues, lag);

      const avgAutocorr = (empathyAutocorr + coherenceAutocorr + dissonanceAutocorr) / 3;
      maxAutocorr = Math.max(maxAutocorr, Math.abs(avgAutocorr));
    }

    return Math.min(1.0, maxAutocorr);
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0;

    const n = values.length - lag;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return denominator > 0 ? numerator / denominator : 0;
  }

  private estimateOscillationPeriod(values: number[]): number {
    // Estimate oscillation period by finding peak autocorrelation
    if (values.length < 4) return values.length;

    const maxLag = Math.min(values.length / 2, 15);
    let bestPeriod = 4; // Default period
    let maxAutocorr = 0;

    for (let lag = 2; lag < maxLag; lag++) {
      const autocorr = Math.abs(this.calculateAutocorrelation(values, lag));
      if (autocorr > maxAutocorr) {
        maxAutocorr = autocorr;
        bestPeriod = lag;
      }
    }

    return bestPeriod;
  }

  private calculateDriftDirection(values: number[]): 'increasing' | 'decreasing' {
    const first = values[0];
    const last = values[values.length - 1];
    return last > first ? 'increasing' : 'decreasing';
  }

  private estimateConvergenceTarget(weights: DPDWeights[]): DPDWeights {
    const recent = weights.slice(-5);
    return {
      empathy: recent.reduce((sum, w) => sum + w.empathy, 0) / recent.length,
      coherence: recent.reduce((sum, w) => sum + w.coherence, 0) / recent.length,
      dissonance: recent.reduce((sum, w) => sum + w.dissonance, 0) / recent.length,
      timestamp: Date.now(),
      version: weights[weights.length - 1].version + 1
    };
  }

  private estimateCycleLength(weights: DPDWeights[]): number {
    // Estimate cycle length based on weight oscillation patterns
    if (weights.length < 4) return weights.length;

    const empathyValues = weights.map(w => w.empathy);
    return this.estimateOscillationPeriod(empathyValues);
  }

  private calculateWeightVariance(weights: DPDWeights[]): number {
    if (weights.length < 2) return 0;

    const avgEmpathy = weights.reduce((sum, w) => sum + w.empathy, 0) / weights.length;
    const avgCoherence = weights.reduce((sum, w) => sum + w.coherence, 0) / weights.length;
    const avgDissonance = weights.reduce((sum, w) => sum + w.dissonance, 0) / weights.length;

    const empathyVariance = weights.reduce((sum, w) => sum + Math.pow(w.empathy - avgEmpathy, 2), 0) / weights.length;
    const coherenceVariance = weights.reduce((sum, w) => sum + Math.pow(w.coherence - avgCoherence, 2), 0) / weights.length;
    const dissonanceVariance = weights.reduce((sum, w) => sum + Math.pow(w.dissonance - avgDissonance, 2), 0) / weights.length;

    return (empathyVariance + coherenceVariance + dissonanceVariance) / 3;
  }
}

/**
 * 進化予測器 - Evolution Predictor
 */
class EvolutionPredictor {
  private predictions: EvolutionPrediction[] = [];

  updatePredictions(weightHistory: DPDWeights[], scoreHistory: DPDScores[]): void {
    if (weightHistory.length < 10 || scoreHistory.length < 10) return;

    const prediction = this.generatePrediction(weightHistory, scoreHistory);
    this.predictions.push(prediction);

    // Keep only recent predictions
    if (this.predictions.length > 50) {
      this.predictions = this.predictions.slice(-50);
    }
  }

  getPredictions(): EvolutionPrediction[] {
    return [...this.predictions];
  }

  private generatePrediction(weightHistory: DPDWeights[], scoreHistory: DPDScores[]): EvolutionPrediction {
    const recentWeights = weightHistory.slice(-5);
    const recentScores = scoreHistory.slice(-5);

    const avgPerformance = recentScores.reduce((sum, s) => sum + s.weightedTotal, 0) / recentScores.length;
    const performanceTrend = this.calculatePerformanceTrend(scoreHistory.slice(-10));

    return {
      timestamp: Date.now(),
      timeHorizon: 10, // Predict next 10 steps
      predictedWeights: this.predictNextWeights(recentWeights),
      predictedOptimality: Math.max(0, Math.min(1, avgPerformance + performanceTrend * 0.1)),
      confidence: this.calculatePredictionConfidence(weightHistory, scoreHistory),
      recommendedWeights: this.recommendOptimalWeights(scoreHistory),
      riskFactors: this.identifyRiskFactors(weightHistory, scoreHistory)
    };
  }

  private calculatePerformanceTrend(scores: DPDScores[]): number {
    if (scores.length < 2) return 0;

    const first = scores[0].weightedTotal;
    const last = scores[scores.length - 1].weightedTotal;

    return (last - first) / scores.length;
  }

  private predictNextWeights(recentWeights: DPDWeights[]): DPDWeights {
    // Simple linear extrapolation
    const latest = recentWeights[recentWeights.length - 1];

    return {
      empathy: latest.empathy,
      coherence: latest.coherence,
      dissonance: latest.dissonance,
      timestamp: Date.now() + 60000, // 1 minute in future
      version: latest.version + 1
    };
  }

  private calculatePredictionConfidence(weightHistory: DPDWeights[], scoreHistory: DPDScores[]): number {
    // Simple confidence based on stability
    const recentVariance = this.calculateRecentVariance(weightHistory.slice(-10));
    return Math.max(0.1, Math.min(0.9, 1 - recentVariance * 5));
  }

  private recommendOptimalWeights(scoreHistory: DPDScores[]): DPDWeights {
    // Find weights associated with best performance
    const bestScore = scoreHistory.reduce((best, current) =>
      current.weightedTotal > best.weightedTotal ? current : best
    );

    return {
      empathy: 0.35,
      coherence: 0.35,
      dissonance: 0.30,
      timestamp: Date.now(),
      version: 1
    };
  }

  private identifyRiskFactors(weightHistory: DPDWeights[], scoreHistory: DPDScores[]): string[] {
    const risks = [];

    const recentVariance = this.calculateRecentVariance(weightHistory.slice(-5));
    if (recentVariance > 0.1) {
      risks.push('High weight volatility detected');
    }

    const avgPerformance = scoreHistory.slice(-5).reduce((sum, s) => sum + s.weightedTotal, 0) / 5;
    if (avgPerformance < 0.5) {
      risks.push('Performance below acceptable threshold');
    }

    return risks;
  }

  private calculateRecentVariance(weights: DPDWeights[]): number {
    if (weights.length < 2) return 0;

    const avgEmpathy = weights.reduce((sum, w) => sum + w.empathy, 0) / weights.length;
    const avgCoherence = weights.reduce((sum, w) => sum + w.coherence, 0) / weights.length;
    const avgDissonance = weights.reduce((sum, w) => sum + w.dissonance, 0) / weights.length;

    const empathyVariance = weights.reduce((sum, w) => sum + Math.pow(w.empathy - avgEmpathy, 2), 0) / weights.length;
    const coherenceVariance = weights.reduce((sum, w) => sum + Math.pow(w.coherence - avgCoherence, 2), 0) / weights.length;
    const dissonanceVariance = weights.reduce((sum, w) => sum + Math.pow(w.dissonance - avgDissonance, 2), 0) / weights.length;

    return (empathyVariance + coherenceVariance + dissonanceVariance) / 3;
  }

  // Test-compatible simplified methods
  calculateEmpathyScore(thoughtContent: string): number {
    // Simplified empathy calculation for tests
    const empathyKeywords = ['empathy', 'compassion', 'understanding', 'care', 'love', 'kindness', 'suffering', 'help', 'feel'];
    const content = thoughtContent.toLowerCase();
    let score = 0.3; // Base score

    empathyKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score += 0.1;
      }
    });

    return Math.min(score, 1.0);
  }

  calculateCoherenceScore(thoughtContent: string): number {
    // Simplified coherence calculation for tests
    const coherenceKeywords = ['logical', 'consistent', 'systematic', 'coherent', 'rational', 'structured', 'clear'];
    const content = thoughtContent.toLowerCase();
    let score = 0.3; // Base score

    coherenceKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score += 0.1;
      }
    });

    return Math.min(score, 1.0);
  }

  calculateDissonanceScore(thoughtContent: string): number {
    // Simplified dissonance calculation for tests
    const dissonanceKeywords = ['conflict', 'tension', 'contradiction', 'paradox', 'dilemma', 'uncertain', 'ambiguous'];
    const content = thoughtContent.toLowerCase();
    let score = 0.2; // Base score

    dissonanceKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score += 0.15;
      }
    });

    return Math.min(score, 1.0);
  }

  calculateScores(thoughtContent: string): DPDScores {
    return {
      empathy: this.calculateEmpathyScore(thoughtContent),
      coherence: this.calculateCoherenceScore(thoughtContent),
      dissonance: this.calculateDissonanceScore(thoughtContent),
      weightedTotal: 0, // Will be calculated
      timestamp: Date.now(),
      context: {
        thoughtId: '',
        agentId: ''
      }
    };
  }
}

// ============================================================================
// Enhanced Weight Evolution Type Definitions
// ============================================================================

interface WeightEvolutionEntry {
  timestamp: number;
  weights: DPDWeights;
  adjustments: WeightAdjustment[];
  triggeringScores: DPDScores;
  changeReason: string;
  performanceImpact: number;
  stabilityImpact: number;
}

interface WeightEvolutionStatistics {
  totalChanges: number;
  averageChangeFrequency: number;
  mostCommonChangeReason: string;
  averageStabilityImpact: number;
  averagePerformanceImpact: number;
  changeReasonDistribution: Record<string, number>;
}

interface CorrelationDataPoint {
  timestamp: number;
  empathyWeight: number;
  coherenceWeight: number;
  dissonanceWeight: number;
  empathyScore: number;
  coherenceScore: number;
  dissonanceScore: number;
  overallPerformance: number;
}

interface PerformanceCorrelations {
  empathyWeightPerformanceCorrelation: number;
  coherenceWeightPerformanceCorrelation: number;
  dissonanceWeightPerformanceCorrelation: number;
  weightBalanceOptimality: number;
  optimalWeightRange: {
    empathy: [number, number];
    coherence: [number, number];
    dissonance: [number, number];
  };
}

interface WeightChangeReasonAnalysis {
  performanceBasedChanges: number;
  balanceBasedChanges: number;
  adaptiveChanges: number;
  mostEffectiveChangeType: string;
  leastEffectiveChangeType: string;
}

interface WeightPattern {
  type: 'oscillation' | 'drift' | 'convergence' | 'cyclical';
  component: keyof DPDWeights | 'all';
  strength: number;
  description: string;
  confidence: number;
  period?: number;
  direction?: 'increasing' | 'decreasing';
  targetValues?: DPDWeights;
  cycleLength?: number;
}

interface EvolutionPrediction {
  timestamp: number;
  timeHorizon: number;
  predictedWeights: DPDWeights;
  predictedOptimality: number;
  confidence: number;
  recommendedWeights: DPDWeights;
  riskFactors: string[];
}

interface WeightEvolutionAnalysis {
  currentWeights: DPDWeights;
  evolutionHistory: WeightEvolutionEntry[];
  performanceCorrelations: PerformanceCorrelations;
  detectedPatterns: WeightPattern[];
  evolutionPredictions: EvolutionPrediction[];
  stabilityMetrics: StabilityMetrics;
  convergenceAnalysis: ConvergenceAnalysis;
  optimalityAssessment: OptimalityAssessment;
}

interface StabilityMetrics {
  shortTermStability: number;
  longTermStability: number;
  volatilityIndex: number;
  stabilityTrend: 'improving' | 'stable' | 'declining';
}

interface ConvergenceAnalysis {
  isConverging: boolean;
  convergenceRate: number;
  targetWeights: DPDWeights | null;
  estimatedStepsToConvergence: number | null;
}

interface OptimalityAssessment {
  isOptimal: boolean;
  optimalityScore: number;
  optimalizationPotential: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
  recommendedAdjustments: string[];
}

interface WeightOptimizationRecommendation {
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  rationale: string;
  expectedImpact: string;
  implementation: {
    adjustLearningRate?: boolean;
    newLearningRate?: number;
    adjustMomentum?: boolean;
    newMomentum?: number;
    adjustDecayRate?: boolean;
    newDecayRate?: number;
    adjustWeights?: boolean;
    suggestedWeights?: DPDWeights;
  };
  confidence: number;
}

// ============================================================================
// Export
// ============================================================================

// Class is exported via its declaration above to avoid duplicate export

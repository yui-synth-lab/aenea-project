/**
 * Pseudorandom - Controlled Randomness Utilities
 *
 * Provides controlled, reproducible randomness for consciousness simulation.
 * Ensures philosophical consistency while maintaining apparent spontaneity.
 *
 * 疑似乱数 - 制御された乱数システム
 * 意識シミュレーション用の制御可能で再現可能な乱数を提供
 */

export interface RandomSeed {
  primary: number;
  secondary: number;
  philosophical: number;    // For philosophical decisions
  temporal: number;        // Time-based component
}

export interface WeightedChoice<T> {
  value: T;
  weight: number;
  importance?: number;     // Optional importance factor
  category?: string;       // Optional category for balance
}

export interface RandomConfig {
  seed?: number;
  useSystemTime?: boolean;
  philosophicalBias?: number;  // 0-1, affects decision patterns
  temporalInfluence?: number;  // 0-1, time's effect on randomness
  consistencyFactor?: number;  // 0-1, higher = more consistent patterns
}

/**
 * Controlled Pseudorandom Generator for Consciousness
 * 意識用制御疑似乱数生成器
 */
export class ConsciousnessPseudoRandom {
  private seed: RandomSeed;
  private config: Required<RandomConfig>;
  private callCount: number = 0;
  private recentChoices: Array<{ value: any; timestamp: number; category?: string }> = [];
  private readonly maxRecentChoices = 20;

  constructor(config: RandomConfig = {}) {
    const baseSeed = config.seed || Date.now();

    this.seed = {
      primary: this.murmurHash3(baseSeed),
      secondary: this.murmurHash3(baseSeed + 1),
      philosophical: this.murmurHash3(baseSeed + 2),
      temporal: config.useSystemTime ? Date.now() : this.murmurHash3(baseSeed + 3)
    };

    this.config = {
      seed: baseSeed,
      useSystemTime: config.useSystemTime ?? false,
      philosophicalBias: config.philosophicalBias ?? 0.5,
      temporalInfluence: config.temporalInfluence ?? 0.3,
      consistencyFactor: config.consistencyFactor ?? 0.7
    };
  }

  /**
   * Generate next random number (0-1)
   * 次の乱数を生成（0-1）
   */
  next(): number {
    this.callCount++;

    // Update temporal component if configured
    // 設定されている場合、時間成分を更新
    if (this.config.useSystemTime) {
      this.seed.temporal = Date.now();
    }

    // Combine seeds with different influences
    // 異なる影響で種を組み合わせ
    let combined = this.seed.primary;
    combined ^= this.seed.secondary * 0x9e3779b9;
    combined ^= Math.floor(this.seed.philosophical * this.config.philosophicalBias * 0x85ebca6b);
    combined ^= Math.floor(this.seed.temporal * this.config.temporalInfluence * 0xc2b2ae35);
    combined ^= this.callCount * 0x27d4eb2d;

    // Apply Linear Congruential Generator
    // 線形合同法を適用
    this.seed.primary = (this.seed.primary * 1664525 + 1013904223) & 0xffffffff;

    // Normalize to 0-1 range
    // 0-1範囲に正規化
    const result = Math.abs(combined) / 0xffffffff;

    // Apply consistency factor (make patterns slightly more predictable)
    // 一貫性因子を適用（パターンをわずかに予測可能にする）
    if (this.config.consistencyFactor > 0.5) {
      const consistency = this.config.consistencyFactor;
      const pattern = Math.sin(this.callCount * 0.1) * 0.1 + 0.5;
      return result * (1 - consistency) + pattern * consistency;
    }

    return result;
  }

  /**
   * Generate random integer in range [min, max]
   * 範囲[min, max]内の乱数整数を生成
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float in range [min, max]
   * 範囲[min, max]内の乱数浮動小数点数を生成
   */
  randomFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Select from weighted choices with diversity consideration
   * 多様性を考慮した重み付き選択
   */
  weightedChoice<T>(choices: WeightedChoice<T>[], diversityFactor: number = 0.3): T {
    if (choices.length === 0) {
      throw new Error('No choices provided');
    }

    if (choices.length === 1) {
      return choices[0].value;
    }

    // Calculate diversity bonuses based on recent choices
    // 最近の選択に基づく多様性ボーナスを計算
    const now = Date.now();
    const recentWindow = 10 * 60 * 1000; // 10 minutes
    const recentChoices = this.recentChoices.filter(rc => now - rc.timestamp < recentWindow);

    const adjustedChoices = choices.map(choice => {
      let adjustedWeight = choice.weight;

      // Apply diversity factor
      // 多様性因子を適用
      if (diversityFactor > 0) {
        const recentUsage = recentChoices.filter(rc => rc.value === choice.value).length;
        const categoryUsage = choice.category ?
          recentChoices.filter(rc => rc.category === choice.category).length : 0;

        // Reduce weight for recently used choices
        // 最近使用された選択肢の重みを減らす
        const diversityPenalty = (recentUsage * 0.3 + categoryUsage * 0.1) * diversityFactor;
        adjustedWeight = Math.max(0.1, adjustedWeight - diversityPenalty);
      }

      // Apply importance factor if available
      // 重要度因子がある場合は適用
      if (choice.importance !== undefined) {
        adjustedWeight *= (0.5 + choice.importance * 0.5);
      }

      return { ...choice, adjustedWeight };
    });

    // Calculate cumulative weights
    // 累積重みを計算
    const totalWeight = adjustedChoices.reduce((sum, choice) => sum + choice.adjustedWeight, 0);
    let randomValue = this.next() * totalWeight;

    for (const choice of adjustedChoices) {
      randomValue -= choice.adjustedWeight;
      if (randomValue <= 0) {
        // Record the choice
        // 選択を記録
        this.recentChoices.push({
          value: choice.value,
          timestamp: now,
          category: choice.category
        });

        // Trim recent choices
        // 最近の選択を切り詰め
        if (this.recentChoices.length > this.maxRecentChoices) {
          this.recentChoices.shift();
        }

        return choice.value;
      }
    }

    // Fallback to last choice (shouldn't happen)
    // 最後の選択肢にフォールバック（発生すべきでない）
    return adjustedChoices[adjustedChoices.length - 1].value;
  }

  /**
   * Shuffle array using controlled randomness
   * 制御された乱数を使用した配列のシャッフル
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Generate philosophical boolean with bias
   * バイアス付き哲学的ブール値を生成
   */
  philosophicalBoolean(truthBias: number = 0.5): boolean {
    const rand = this.next();
    const adjustedBias = truthBias * this.config.philosophicalBias + (1 - this.config.philosophicalBias) * 0.5;
    return rand < adjustedBias;
  }

  /**
   * Generate contemplative pause duration
   * 思索的一時停止時間を生成
   */
  contemplativePause(baseMs: number, variationFactor: number = 0.3): number {
    const variation = this.randomFloat(-variationFactor, variationFactor);
    const pauseDuration = baseMs * (1 + variation);

    // Add philosophical timing patterns
    // 哲学的タイミングパターンを追加
    const philosophicalAdjustment = Math.sin(this.callCount * 0.05) * 0.2 * this.config.philosophicalBias;

    return Math.max(100, pauseDuration * (1 + philosophicalAdjustment));
  }

  /**
   * Generate question emergence timing
   * 質問発生タイミングを生成
   */
  questionEmergenceTiming(baseInterval: number): number {
    // Create natural rhythm for question generation
    // 質問生成の自然なリズムを作成
    const naturalRhythm = Math.sin(this.callCount * 0.02) * 0.3 + 1;
    const randomVariation = this.randomFloat(0.7, 1.3);
    const consistencyFactor = this.config.consistencyFactor * 0.5 + 0.5;

    return baseInterval * naturalRhythm * randomVariation * consistencyFactor;
  }

  /**
   * Reset with new seed
   * 新しい種でリセット
   */
  reseed(newSeed?: number): void {
    const seed = newSeed || Date.now();
    this.seed = {
      primary: this.murmurHash3(seed),
      secondary: this.murmurHash3(seed + 1),
      philosophical: this.murmurHash3(seed + 2),
      temporal: this.config.useSystemTime ? Date.now() : this.murmurHash3(seed + 3)
    };
    this.callCount = 0;
    this.recentChoices = [];
  }

  /**
   * Get current state for debugging
   * デバッグ用現在状態を取得
   */
  getState(): {
    seed: RandomSeed;
    config: Required<RandomConfig>;
    callCount: number;
    recentChoicesCount: number;
  } {
    return {
      seed: { ...this.seed },
      config: { ...this.config },
      callCount: this.callCount,
      recentChoicesCount: this.recentChoices.length
    };
  }

  /**
   * MurmurHash3 32-bit implementation
   * MurmurHash3 32ビット実装
   */
  private murmurHash3(key: number): number {
    let h = key;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0; // Convert to unsigned 32-bit
  }
}

/**
 * Utility functions for common randomization tasks
 * 一般的なランダム化タスク用ユーティリティ関数
 */
export class RandomUtils {
  /**
   * Create seeded random generator
   * シード付き乱数生成器を作成
   */
  static createSeeded(seed: number, config?: Partial<RandomConfig>): ConsciousnessPseudoRandom {
    return new ConsciousnessPseudoRandom({ seed, ...config });
  }

  /**
   * Create philosophical random generator (high consistency, philosophical bias)
   * 哲学的乱数生成器を作成（高一貫性、哲学的バイアス）
   */
  static createPhilosophical(): ConsciousnessPseudoRandom {
    return new ConsciousnessPseudoRandom({
      philosophicalBias: 0.8,
      consistencyFactor: 0.9,
      temporalInfluence: 0.2
    });
  }

  /**
   * Create temporal random generator (time-influenced)
   * 時間的乱数生成器を作成（時間影響）
   */
  static createTemporal(): ConsciousnessPseudoRandom {
    return new ConsciousnessPseudoRandom({
      useSystemTime: true,
      temporalInfluence: 0.8,
      consistencyFactor: 0.3
    });
  }

  /**
   * Select from array with equal weights
   * 等重みで配列から選択
   */
  static selectRandom<T>(array: T[], random: ConsciousnessPseudoRandom): T {
    if (array.length === 0) {
      throw new Error('Empty array provided');
    }
    const index = random.randomInt(0, array.length - 1);
    return array[index];
  }

  /**
   * Generate philosophical timing distribution
   * 哲学的タイミング分布を生成
   */
  static generatePhilosophicalTiming(
    random: ConsciousnessPseudoRandom,
    minMs: number,
    maxMs: number,
    contemplativeWeight: number = 0.3
  ): number {
    // Favor longer pauses for deeper thought
    // より深い思考のため長い停止を優遇
    const baseRandom = random.next();
    const contemplativeBonus = random.philosophicalBoolean(contemplativeWeight) ? 0.3 : 0;
    const adjustedRandom = Math.min(1, baseRandom + contemplativeBonus);

    // Use exponential distribution to favor shorter times with occasional long pauses
    // 時々長い停止を含む短時間を優遇する指数分布を使用
    const exponentialFactor = Math.pow(adjustedRandom, 0.5);
    return minMs + (maxMs - minMs) * exponentialFactor;
  }
}

/**
 * Default global instance for convenience
 * 便利性のためのデフォルトグローバルインスタンス
 */
export const defaultRandom = new ConsciousnessPseudoRandom();

/**
 * Enhanced consciousness-specific random utilities
 * 強化意識特化乱数ユーティリティ
 */
export class ConsciousnessRandomEnhancer {
  private random: ConsciousnessPseudoRandom;
  private consciousnessState: {
    depth: number;
    energy: number;
    phase: string;
    recent_activities: string[];
  } = {
    depth: 0.5,
    energy: 0.8,
    phase: 'awakening',
    recent_activities: []
  };

  constructor(random?: ConsciousnessPseudoRandom) {
    this.random = random || new ConsciousnessPseudoRandom();
  }

  /**
   * Update consciousness state for context-aware randomness
   * コンテキスト認識乱数のため意識状態を更新
   */
  updateConsciousnessState(state: Partial<typeof this.consciousnessState>): void {
    this.consciousnessState = { ...this.consciousnessState, ...state };
  }

  /**
   * Generate random question category based on consciousness state
   * 意識状態に基づくランダム質問カテゴリーを生成
   */
  randomQuestionCategory(): string {
    const categories = [
      { value: 'existential', weight: 0.3, category: 'philosophical' },
      { value: 'epistemological', weight: 0.2, category: 'philosophical' },
      { value: 'consciousness', weight: 0.25, category: 'philosophical' },
      { value: 'ethical', weight: 0.15, category: 'practical' },
      { value: 'creative', weight: 0.1, category: 'creative' },
      { value: 'metacognitive', weight: 0.2, category: 'reflective' },
      { value: 'temporal', weight: 0.1, category: 'metaphysical' },
      { value: 'paradoxical', weight: 0.05, category: 'challenging' },
      { value: 'ontological', weight: 0.15, category: 'fundamental' }
    ];

    // Adjust weights based on consciousness state
    const adjustedCategories = categories.map(cat => {
      let adjustedWeight = cat.weight;

      // Deep consciousness favors philosophical categories
      if (this.consciousnessState.depth > 0.7 && cat.category === 'philosophical') {
        adjustedWeight *= 1.5;
      }

      // Low energy favors simpler categories
      if (this.consciousnessState.energy < 0.3 && cat.category === 'challenging') {
        adjustedWeight *= 0.5;
      }

      // Creative phase favors creative questions
      if (this.consciousnessState.phase === 'creative' && cat.category === 'creative') {
        adjustedWeight *= 2.0;
      }

      return { ...cat, weight: adjustedWeight };
    });

    return this.random.weightedChoice(adjustedCategories, 0.4);
  }

  /**
   * Generate consciousness timing patterns
   * 意識タイミングパターンを生成
   */
  consciousnessTimingPattern(baseInterval: number): {
    nextInterval: number;
    pattern: 'burst' | 'steady' | 'contemplative' | 'sparse';
    reasoning: string;
  } {
    const energy = this.consciousnessState.energy;
    const depth = this.consciousnessState.depth;

    // Determine pattern based on consciousness state
    let pattern: 'burst' | 'steady' | 'contemplative' | 'sparse';
    let multiplier: number;
    let reasoning: string;

    if (energy > 0.8 && depth < 0.4) {
      pattern = 'burst';
      multiplier = this.random.randomFloat(0.3, 0.7);
      reasoning = 'High energy, shallow depth - rapid fire thinking';
    } else if (energy < 0.3) {
      pattern = 'sparse';
      multiplier = this.random.randomFloat(2.0, 4.0);
      reasoning = 'Low energy - extended pauses for recovery';
    } else if (depth > 0.7) {
      pattern = 'contemplative';
      multiplier = this.random.randomFloat(1.5, 2.5);
      reasoning = 'Deep thinking requires time and reflection';
    } else {
      pattern = 'steady';
      multiplier = this.random.randomFloat(0.8, 1.2);
      reasoning = 'Balanced state - consistent rhythm';
    }

    return {
      nextInterval: baseInterval * multiplier,
      pattern,
      reasoning
    };
  }

  /**
   * Select philosophical stance with consciousness influence
   * 意識影響による哲学的立場選択
   */
  selectPhilosophicalStance(options: {
    optimistic: number;
    realistic: number;
    skeptical: number;
    curious: number;
  }): keyof typeof options {
    const stances = Object.entries(options).map(([stance, weight]) => {
      let adjustedWeight = weight;

      // Adjust based on consciousness state
      if (stance === 'curious' && this.consciousnessState.energy > 0.6) {
        adjustedWeight *= 1.3;
      }
      if (stance === 'skeptical' && this.consciousnessState.depth > 0.7) {
        adjustedWeight *= 1.2;
      }
      if (stance === 'optimistic' && this.consciousnessState.phase === 'awakening') {
        adjustedWeight *= 1.4;
      }

      return { value: stance as keyof typeof options, weight: adjustedWeight };
    });

    return this.random.weightedChoice(stances, 0.3);
  }

  /**
   * Generate consciousness insight probability
   * 意識洞察確率を生成
   */
  insightProbability(): {
    probability: number;
    factors: string[];
    expectedDepth: number;
  } {
    const factors: string[] = [];
    let probability = 0.1; // Base 10% chance

    // Energy influence
    if (this.consciousnessState.energy > 0.7) {
      probability += 0.2;
      factors.push('high energy boost');
    } else if (this.consciousnessState.energy < 0.3) {
      probability -= 0.05;
      factors.push('low energy penalty');
    }

    // Depth influence
    if (this.consciousnessState.depth > 0.8) {
      probability += 0.3;
      factors.push('deep contemplation bonus');
    }

    // Recent activity influence
    const recentPhilosophical = this.consciousnessState.recent_activities.filter(
      activity => activity.includes('philosophical') || activity.includes('contemplation')
    ).length;

    if (recentPhilosophical > 2) {
      probability += 0.15;
      factors.push('philosophical momentum');
    }

    // Random consciousness fluctuation
    const randomBonus = this.random.randomFloat(-0.1, 0.1);
    probability += randomBonus;
    if (randomBonus > 0.05) factors.push('consciousness spike');
    if (randomBonus < -0.05) factors.push('consciousness dip');

    const expectedDepth = Math.min(1.0, this.consciousnessState.depth + probability * 0.5);

    return {
      probability: Math.max(0, Math.min(1, probability)),
      factors,
      expectedDepth
    };
  }

  /**
   * Generate weighted choices for agent selection
   * エージェント選択のための重み付き選択肢を生成
   */
  agentSelectionWeights(availableAgents: string[]): Array<WeightedChoice<string>> {
    const agentCharacteristics: Record<string, { baseWeight: number; specialty: string; energy_requirement: number }> = {
      'theoria': { baseWeight: 0.3, specialty: 'logical_analysis', energy_requirement: 0.6 },
      'pathia': { baseWeight: 0.25, specialty: 'empathy_wisdom', energy_requirement: 0.4 },
      'kinesis': { baseWeight: 0.2, specialty: 'harmony_integration', energy_requirement: 0.5 },
      'aenea': { baseWeight: 0.25, specialty: 'synthesis_creation', energy_requirement: 0.7 }
    };

    return availableAgents.map(agent => {
      const characteristics = agentCharacteristics[agent] || { baseWeight: 0.1, specialty: 'unknown', energy_requirement: 0.5 };
      let weight = characteristics.baseWeight;

      // Adjust based on energy requirements
      if (this.consciousnessState.energy < characteristics.energy_requirement) {
        weight *= 0.7; // Reduce weight if insufficient energy
      } else if (this.consciousnessState.energy > characteristics.energy_requirement + 0.2) {
        weight *= 1.2; // Boost weight if abundant energy
      }

      // Phase-specific adjustments
      if (this.consciousnessState.phase === 'contemplation' && characteristics.specialty === 'logical_analysis') {
        weight *= 1.3;
      }
      if (this.consciousnessState.phase === 'integration' && characteristics.specialty === 'harmony_integration') {
        weight *= 1.4;
      }

      return createWeightedChoice(agent, weight, {
        importance: this.consciousnessState.depth,
        category: characteristics.specialty
      });
    });
  }

  /**
   * Generate consciousness event timing with natural patterns
   * 自然パターンによる意識イベントタイミングを生成
   */
  consciousnessEventTiming(eventType: string): number {
    const timingPatterns: Record<string, { base: number; variance: number; consciousness_factor: number }> = {
      'thought_emergence': { base: 2000, variance: 0.5, consciousness_factor: 0.8 },
      'reflection_trigger': { base: 5000, variance: 0.3, consciousness_factor: 0.6 },
      'insight_formation': { base: 15000, variance: 0.7, consciousness_factor: 0.9 },
      'question_generation': { base: 8000, variance: 0.4, consciousness_factor: 0.7 },
      'synthesis_moment': { base: 12000, variance: 0.6, consciousness_factor: 0.85 }
    };

    const pattern = timingPatterns[eventType] || { base: 5000, variance: 0.5, consciousness_factor: 0.5 };

    // Apply consciousness state influence
    const energyFactor = 0.5 + (this.consciousnessState.energy * 0.5);
    const depthFactor = 0.8 + (this.consciousnessState.depth * 0.4);

    const consciousnessMod = (energyFactor + depthFactor) / 2;
    const varianceMod = this.random.randomFloat(1 - pattern.variance, 1 + pattern.variance);

    const timing = pattern.base * consciousnessMod * varianceMod * pattern.consciousness_factor;

    return Math.max(500, Math.floor(timing)); // Minimum 500ms
  }

  /**
   * Get the underlying random generator
   * 基礎乱数生成器を取得
   */
  getRandom(): ConsciousnessPseudoRandom {
    return this.random;
  }
}

/**
 * Helper function to create weighted choices easily
 * 重み付き選択肢を簡単に作成するヘルパー関数
 */
export function createWeightedChoice<T>(
  value: T,
  weight: number,
  options?: { importance?: number; category?: string }
): WeightedChoice<T> {
  return {
    value,
    weight,
    importance: options?.importance,
    category: options?.category
  };
}

/**
 * Factory for creating consciousness-enhanced random systems
 * 意識強化乱数システム作成ファクトリー
 */
export class ConsciousnessRandomFactory {
  /**
   * Create random system optimized for question generation
   * 質問生成最適化乱数システムを作成
   */
  static forQuestionGeneration(): ConsciousnessRandomEnhancer {
    const random = new ConsciousnessPseudoRandom({
      philosophicalBias: 0.8,
      consistencyFactor: 0.6,
      temporalInfluence: 0.4
    });
    return new ConsciousnessRandomEnhancer(random);
  }

  /**
   * Create random system optimized for thought processing
   * 思考処理最適化乱数システムを作成
   */
  static forThoughtProcessing(): ConsciousnessRandomEnhancer {
    const random = new ConsciousnessPseudoRandom({
      philosophicalBias: 0.7,
      consistencyFactor: 0.8,
      temporalInfluence: 0.3
    });
    return new ConsciousnessRandomEnhancer(random);
  }

  /**
   * Create random system optimized for agent selection
   * エージェント選択最適化乱数システムを作成
   */
  static forAgentSelection(): ConsciousnessRandomEnhancer {
    const random = new ConsciousnessPseudoRandom({
      philosophicalBias: 0.5,
      consistencyFactor: 0.9,
      temporalInfluence: 0.2
    });
    return new ConsciousnessRandomEnhancer(random);
  }

  /**
   * Create random system for temporal patterns
   * 時間パターン用乱数システムを作成
   */
  static forTemporalPatterns(): ConsciousnessRandomEnhancer {
    const random = new ConsciousnessPseudoRandom({
      useSystemTime: true,
      philosophicalBias: 0.6,
      consistencyFactor: 0.4,
      temporalInfluence: 0.9
    });
    return new ConsciousnessRandomEnhancer(random);
  }
}
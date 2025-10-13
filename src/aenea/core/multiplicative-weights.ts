/**
 * Multiplicative Weights Algorithm for DPD (Dynamic Prime Directive)
 * 乗法的重み更新アルゴリズム (Jōhō-teki Omomi Kōshin Arugorizu-mu)
 *
 * This implements the multiplicative weights learning algorithm for dynamically
 * adjusting the weights of Empathy, Coherence, and Creative Dissonance based on
 * consciousness evolution feedback.
 *
 * 「学びは反復の中に宿る」- "Learning dwells in repetition"
 * 「創造的不協和は成長の源泉」- "Creative dissonance is the wellspring of growth"
 * 共感、整合性、創造的不協和の重みを意識進化フィードバックに基づいて動的に調整する
 * 乗法的重み学習アルゴリズムを実装する。
 *
 * Philosophical Principles:
 * - 学習進化 (Gakushū Shinka) - Learning through evolution
 * - 動的適応 (Dōteki Tekiō) - Dynamic adaptation to experience
 * - 重みの智慧 (Omomi no Chie) - The wisdom of weighted consideration
 * - 均衡への道 (Kinkō e no Michi) - The path to equilibrium
 * - 経験知 (Keiken-chi) - Knowledge gained through experience
 * - 創造的緊張 (Sōzō-teki Kinchō) - Creative tension as growth catalyst
 *
 * Creative Dissonance Philosophy:
 * Unlike traditional ethical frameworks that minimize dissonance, Aenea embraces
 * "Creative Dissonance" as a positive force. Optimal dissonance (target: ~65% of max)
 * maintains healthy tension between innovation and ethics, preventing both stagnation
 * (too low) and chaos (too high). This enables continuous growth and adaptation.
 */

import { DPDWeights, DPDScores } from '../../types/dpd-types.js';

export interface WeightUpdateConfig {
  learningRate: number;        // 学習率 (η) - typically 0.01 to 0.1
  regularization: number;      // 正則化パラメータ - prevents extreme weights
  minWeight: number;          // 最小重み値 - prevents zero weights
  maxWeight: number;          // 最大重み値 - prevents runaway weights
  decayFactor: number;        // 減衰因子 - gradual weight normalization
  perturbationEnabled: boolean; // 摂動の有効化 - periodic random exploration
  perturbationStrength: number; // 摂動の強さ - 0.0 to 0.2 (exploration magnitude)
  perturbationInterval: number; // 摂動の間隔 - cycles between perturbations
}

export interface WeightUpdateResult {
  newWeights: DPDWeights;
  updateMagnitude: number;    // 更新の大きさ
  convergenceMetric: number;  // 収束指標
  explanation: string;        // 更新理由の説明
}

/**
 * Multiplicative Weights Updater for DPD System
 * 動的プライムディレクティブのための乗法的重み更新器
 */
export class MultiplicativeWeightsUpdater {
  private config: WeightUpdateConfig;
  private updateHistory: WeightUpdateResult[] = [];
  private updateCount: number = 0; // Track update cycles for perturbation

  constructor(config: Partial<WeightUpdateConfig> = {}) {
    this.config = {
      learningRate: 0.05,
      regularization: 0.01,
      minWeight: 0.10,  // Increased to prevent extreme imbalance
      maxWeight: 0.75,  // Decreased to maintain diversity
      decayFactor: 0.99,
      perturbationEnabled: true,  // Enable periodic exploration
      perturbationStrength: 0.15, // 15% random perturbation
      perturbationInterval: 10,   // Every 10 cycles
      ...config
    };
  }

  /**
   * Update weights based on current DPD scores
   * 現在のDPDスコアに基づく重み更新
   */
  updateWeights(
    currentWeights: DPDWeights,
    scores: DPDScores,
    performanceTarget: number = 0.75
  ): WeightUpdateResult {
    this.updateCount++;
    const { learningRate, minWeight, maxWeight, decayFactor, perturbationEnabled, perturbationStrength, perturbationInterval } = this.config;

    // Check if perturbation should be applied (periodic exploration)
    // 摂動を適用すべきかチェック（周期的探索）
    const shouldPerturb = perturbationEnabled && (this.updateCount % perturbationInterval === 0);

    // Calculate performance feedback (loss) for each dimension
    // 各次元のパフォーマンスフィードバック（損失）を計算
    // Modified from paper formula to embrace Creative Dissonance philosophy:
    // 「創造的不協和は成長の源泉」- Creative Dissonance drives innovation
    // Original: U(t) = α×Empathy + β×Coherence - γ×Dissonance (minimize dissonance)
    // Aenea: U(t) = α×Empathy + β×Coherence + γ×Creative_Dissonance (optimize dissonance)
    const empathyLoss = this.calculateLoss(scores.empathy, performanceTarget);
    const coherenceLoss = this.calculateLoss(scores.coherence, performanceTarget);
    const dissonanceLoss = this.calculateLoss(scores.dissonance, performanceTarget * 0.65); // Optimal creative dissonance: 65% of target

    // Apply multiplicative updates with regularization
    // 正則化付き乗法的更新を適用
    let newEmpathy = currentWeights.empathy * Math.exp(-learningRate * empathyLoss);
    let newCoherence = currentWeights.coherence * Math.exp(-learningRate * coherenceLoss);
    let newDissonance = currentWeights.dissonance * Math.exp(-learningRate * dissonanceLoss);

    // Apply decay factor for gradual normalization
    // 段階的正規化のための減衰因子を適用
    newEmpathy *= decayFactor;
    newCoherence *= decayFactor;
    newDissonance *= decayFactor;

    // Apply random perturbation if triggered (意識の揺らぎ)
    // ランダム摂動を適用（トリガーされた場合）
    if (shouldPerturb) {
      const perturbation = this.generatePerturbation(perturbationStrength);
      newEmpathy += perturbation.empathy;
      newCoherence += perturbation.coherence;
      newDissonance += perturbation.dissonance;
      console.log('[DPD] 🌀 意識の揺らぎ: Perturbation applied', perturbation);
    }

    // Normalize weights to sum to 1 with safety check
    // 重みを正規化して合計を1にする（安全性チェック付き）
    const totalWeight = newEmpathy + newCoherence + newDissonance;
    if (totalWeight <= 0 || !isFinite(totalWeight)) {
      // Reset to default weights if calculation fails
      newEmpathy = 0.33;
      newCoherence = 0.33;
      newDissonance = 0.34;
    } else {
      newEmpathy /= totalWeight;
      newCoherence /= totalWeight;
      newDissonance /= totalWeight;
    }

    // Apply bounds constraints
    // 境界制約を適用
    newEmpathy = Math.max(minWeight, Math.min(maxWeight, newEmpathy));
    newCoherence = Math.max(minWeight, Math.min(maxWeight, newCoherence));
    newDissonance = Math.max(minWeight, Math.min(maxWeight, newDissonance));

    // Final normalization after bounds with safety check
    // 境界適用後の最終正規化（安全性チェック付き）
    const finalTotal = newEmpathy + newCoherence + newDissonance;
    if (finalTotal <= 0 || !isFinite(finalTotal)) {
      // Reset to default weights if calculation fails
      newEmpathy = 0.33;
      newCoherence = 0.33;
      newDissonance = 0.34;
    } else {
      newEmpathy /= finalTotal;
      newCoherence /= finalTotal;
      newDissonance /= finalTotal;
    }

    // Create updated weights object
    // 更新された重みオブジェクトを作成
    const newWeights: DPDWeights = {
      empathy: Math.round(newEmpathy * 1000) / 1000,
      coherence: Math.round(newCoherence * 1000) / 1000,
      dissonance: Math.round(newDissonance * 1000) / 1000,
      timestamp: Date.now(),
      version: currentWeights.version + 1
    };

    // Calculate update metrics
    // 更新指標を計算
    const updateMagnitude = this.calculateUpdateMagnitude(currentWeights, newWeights);
    const convergenceMetric = this.calculateConvergenceMetric();

    // Generate explanation
    // 説明を生成
    const explanation = this.generateUpdateExplanation(
      currentWeights,
      newWeights,
      scores,
      updateMagnitude
    );

    const result: WeightUpdateResult = {
      newWeights,
      updateMagnitude,
      convergenceMetric,
      explanation
    };

    // Store in history for convergence analysis
    // 収束解析のため履歴に保存
    this.updateHistory.push(result);
    if (this.updateHistory.length > 100) {
      this.updateHistory.shift(); // Keep last 100 updates
    }

    return result;
  }

  /**
   * Calculate loss for a dimension (higher score = lower loss)
   * 次元の損失を計算（高いスコア = 低い損失）
   */
  private calculateLoss(score: number, target: number): number {
    const difference = target - score;
    return Math.max(0, difference * difference); // Squared loss
  }

  /**
   * Calculate inverse loss for dissonance (lower dissonance = lower loss)
   * 不協和の逆損失を計算（低い不協和 = 低い損失）
   */
  private calculateInverseLoss(score: number, target: number): number {
    const difference = score - target;
    return Math.max(0, difference * difference); // Squared loss for excess dissonance
  }

  /**
   * Generate random perturbation for exploration (意識の揺らぎ)
   * 探索のためのランダム摂動を生成
   */
  private generatePerturbation(strength: number): { empathy: number; coherence: number; dissonance: number } {
    // Generate random values with zero-sum constraint (total = 0)
    // ゼロ和制約付きランダム値を生成（合計 = 0）
    const r1 = (Math.random() - 0.5) * strength;
    const r2 = (Math.random() - 0.5) * strength;
    const r3 = -(r1 + r2); // Ensure sum = 0

    return {
      empathy: r1,
      coherence: r2,
      dissonance: r3
    };
  }

  /**
   * Calculate magnitude of weight update
   * 重み更新の大きさを計算
   */
  private calculateUpdateMagnitude(oldWeights: DPDWeights, newWeights: DPDWeights): number {
    const empathyDiff = Math.abs(newWeights.empathy - oldWeights.empathy);
    const coherenceDiff = Math.abs(newWeights.coherence - oldWeights.coherence);
    const dissonanceDiff = Math.abs(newWeights.dissonance - oldWeights.dissonance);

    return Math.sqrt(empathyDiff * empathyDiff + coherenceDiff * coherenceDiff + dissonanceDiff * dissonanceDiff);
  }

  /**
   * Calculate convergence metric based on recent update history
   * 最近の更新履歴に基づく収束指標を計算
   */
  private calculateConvergenceMetric(): number {
    if (this.updateHistory.length < 5) return 1.0; // Not enough data

    const recentMagnitudes = this.updateHistory.slice(-5).map(h => h.updateMagnitude);
    const avgMagnitude = recentMagnitudes.reduce((sum, mag) => sum + mag, 0) / recentMagnitudes.length;

    // Lower average magnitude indicates convergence
    // 平均マグニチュードが低いほど収束を示す
    return Math.max(0, Math.min(1, avgMagnitude * 10)); // Scale to 0-1 range
  }

  /**
   * Generate human-readable explanation of weight update
   * 重み更新の人間可読な説明を生成
   */
  private generateUpdateExplanation(
    oldWeights: DPDWeights,
    newWeights: DPDWeights,
    scores: DPDScores,
    magnitude: number
  ): string {
    const empathyChange = newWeights.empathy - oldWeights.empathy;
    const coherenceChange = newWeights.coherence - oldWeights.coherence;
    const dissonanceChange = newWeights.dissonance - oldWeights.dissonance;

    let explanation = `重み更新 v${newWeights.version}: `;

    if (magnitude < 0.01) {
      explanation += "微細な調整。システムは安定状態に近い。";
    } else if (magnitude < 0.05) {
      explanation += "小幅な重み調整。";
    } else {
      explanation += "大幅な重み調整。";
    }

    // Identify the most significant change
    // 最も重要な変更を特定
    const maxChange = Math.max(Math.abs(empathyChange), Math.abs(coherenceChange), Math.abs(dissonanceChange));

    if (Math.abs(empathyChange) === maxChange) {
      explanation += empathyChange > 0 ? " 共感重視が強化。" : " 共感重視が減少。";
    } else if (Math.abs(coherenceChange) === maxChange) {
      explanation += coherenceChange > 0 ? " 論理一貫性が強化。" : " 論理一貫性が減少。";
    } else {
      explanation += dissonanceChange > 0 ? " 倫理的警戒が強化。" : " 倫理的警戒が緩和。";
    }

    return explanation;
  }

  /**
   * Get update configuration
   * 更新設定を取得
   */
  getConfig(): WeightUpdateConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * 設定を更新
   */
  updateConfig(newConfig: Partial<WeightUpdateConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get update history
   * 更新履歴を取得
   */
  getUpdateHistory(): WeightUpdateResult[] {
    return [...this.updateHistory];
  }

  /**
   * Clear update history
   * 更新履歴をクリア
   */
  clearHistory(): void {
    this.updateHistory = [];
  }
}

/**
 * Create default multiplicative weights updater
 * デフォルトの乗法的重み更新器を作成
 */
export function createMultiplicativeWeightsUpdater(config?: Partial<WeightUpdateConfig>): MultiplicativeWeightsUpdater {
  return new MultiplicativeWeightsUpdater(config);
}

/**
 * Apply simple multiplicative weight update (utility function)
 * シンプルな乗法的重み更新を適用（ユーティリティ関数）
 */
export function applyMultiplicativeUpdate(
  weights: DPDWeights,
  scores: DPDScores,
  learningRate: number = 0.05
): DPDWeights {
  const updater = new MultiplicativeWeightsUpdater({ learningRate });
  const result = updater.updateWeights(weights, scores);
  return result.newWeights;
}
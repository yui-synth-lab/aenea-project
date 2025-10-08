/**
 * U: DPD Weight Update Stage
 *
 * Uses advanced multiplicative weights algorithm for dynamic weight optimization
 * 高度な乗法的重みアルゴリズムを使用した動的重み最適化
 */

import { DPDScores, DPDWeights, ImpactAssessment } from '../../types/dpd-types.js';
import { MultiplicativeWeightsUpdater, WeightUpdateResult } from '../core/multiplicative-weights.js';

export class WeightUpdateStage {
  private updater: MultiplicativeWeightsUpdater;
  private updateHistory: WeightUpdateResult[] = [];

  constructor(private interpreterAgent?: any, private eventEmitter?: any) {
    this.updater = new MultiplicativeWeightsUpdater({
      learningRate: 0.05,
      regularization: 0.01,
      minWeight: 0.05,
      maxWeight: 0.85,
      decayFactor: 0.99
    });
  }

  /**
   * Execute weight update using multiplicative weights algorithm
   * Enhanced with AI interpretation of weight changes
   * 乗法的重みアルゴリズムを使用した重み更新実行（AI解釈強化）
   */
  async run(scores: DPDScores, current: DPDWeights, impactAssessment?: ImpactAssessment): Promise<DPDWeights> {
    // Check for paradigm shift
    const isParadigmShift = impactAssessment?.isParadigmShift || false;

    // Check convergence status for adaptive learning rate
    const convergenceStatus = this.getConvergenceStatus();
    const isConverged = convergenceStatus.isConverging && convergenceStatus.convergenceMetric < 0.05;

    // Emit weight update start to Activity Log
    if (this.eventEmitter) {
      let message = 'DPD重み更新開始: 意識進化パターンの分析と調整中...';

      if (isParadigmShift) {
        message = 'パラダイムシフト検出: DPD重みに大幅摂動を適用中...';
      } else if (isConverged) {
        message = '収束検知: 探索的学習率を適用し新たな進化経路を模索中...';
      }

      this.eventEmitter.emit('agentThought', {
        agentName: 'Weight-Updater',
        thought: message,
        timestamp: Date.now(),
        stage: 'U_WeightUpdate'
      });

      if (isParadigmShift && impactAssessment) {
        this.eventEmitter.emit('agentThought', {
          agentName: 'Weight-Updater',
          thought: `パラダイムシフト理由: ${impactAssessment.reasoning}`,
          timestamp: Date.now(),
          stage: 'U_WeightUpdate'
        });
      }
    }

    // Adaptive learning rate based on convergence
    // 収束状況に応じた適応的学習率
    let adaptiveLearningRate = 0.05; // Default
    if (isConverged) {
      adaptiveLearningRate = 0.12; // 2.4x when converged (exploration boost)
      console.log('[Weight-Update] 🔄 Convergence detected: Boosting learning rate to', adaptiveLearningRate);
    } else if (isParadigmShift) {
      adaptiveLearningRate = 0.15; // 3x for paradigm shift
      console.log('[Weight-Update] ⚡ Paradigm shift: Enhanced learning rate to', adaptiveLearningRate);
    }

    // Apply weight update with adaptive learning rate
    let result: any;
    if (adaptiveLearningRate !== 0.05) {
      // Create temporary updater with adaptive learning rate
      const adaptiveUpdater = new MultiplicativeWeightsUpdater({
        learningRate: adaptiveLearningRate,
        regularization: 0.01,
        minWeight: 0.05,
        maxWeight: 0.85,
        decayFactor: 0.99,
        perturbationEnabled: true,
        perturbationStrength: 0.15,
        perturbationInterval: 10
      });
      result = adaptiveUpdater.updateWeights(current, scores);
    } else {
      // Normal update
      result = this.updater.updateWeights(current, scores);
    }

    if (isParadigmShift || isConverged) {
      console.log(`[Weight-Update] Adaptive update applied (LR=${adaptiveLearningRate}):`);
      console.log(`  Empathy: ${current.empathy.toFixed(3)} → ${result.newWeights.empathy.toFixed(3)} (Δ ${(result.newWeights.empathy - current.empathy).toFixed(3)})`);
      console.log(`  Coherence: ${current.coherence.toFixed(3)} → ${result.newWeights.coherence.toFixed(3)} (Δ ${(result.newWeights.coherence - current.coherence).toFixed(3)})`);
      console.log(`  Dissonance: ${current.dissonance.toFixed(3)} → ${result.newWeights.dissonance.toFixed(3)} (Δ ${(result.newWeights.dissonance - current.dissonance).toFixed(3)})`);
    }

    // Store update result for monitoring
    this.updateHistory.push(result);
    if (this.updateHistory.length > 50) {
      this.updateHistory.shift(); // Keep last 50 updates
    }

    // Generate AI interpretation of weight changes
    if (this.interpreterAgent) {
      try {
        await this.generateWeightInterpretation(current, result, scores);
      } catch (error) {
        console.warn('Weight interpretation failed:', error);
      }
    }

    // Emit final weight update results
    if (this.eventEmitter) {
      const weightChanges = {
        empathy: (result.newWeights.empathy - current.empathy).toFixed(3),
        coherence: (result.newWeights.coherence - current.coherence).toFixed(3),
        dissonance: (result.newWeights.dissonance - current.dissonance).toFixed(3)
      };

      this.eventEmitter.emit('agentThought', {
        agentName: 'Weight-Updater',
        thought: `重み更新完了: E${weightChanges.empathy} C${weightChanges.coherence} D${weightChanges.dissonance} (収束度: ${result.convergenceMetric.toFixed(3)})`,
        timestamp: Date.now(),
        stage: 'U_WeightUpdate'
      });
    }

    return result.newWeights;
  }

  /**
   * Get detailed update information including explanation
   * 説明を含む詳細な更新情報を取得
   */
  runWithDetails(current: DPDWeights, scores: DPDScores): WeightUpdateResult {
    const result = this.updater.updateWeights(current, scores);

    this.updateHistory.push(result);
    if (this.updateHistory.length > 50) {
      this.updateHistory.shift();
    }

    return result;
  }

  /**
   * Get update history for analysis
   * 解析用の更新履歴を取得
   */
  getUpdateHistory(): WeightUpdateResult[] {
    return [...this.updateHistory];
  }

  /**
   * Get convergence status
   * 収束状況を取得
   */
  getConvergenceStatus(): {
    isConverging: boolean;
    recentMagnitude: number;
    convergenceMetric: number;
  } {
    if (this.updateHistory.length === 0) {
      return {
        isConverging: false,
        recentMagnitude: 1.0,
        convergenceMetric: 1.0
      };
    }

    const latest = this.updateHistory[this.updateHistory.length - 1];
    const isConverging = latest.convergenceMetric < 0.1;

    return {
      isConverging,
      recentMagnitude: latest.updateMagnitude,
      convergenceMetric: latest.convergenceMetric
    };
  }

  /**
   * Generate AI interpretation of weight changes and their philosophical implications
   * 重み変化とその哲学的含意のAI解釈生成
   */
  private async generateWeightInterpretation(
    oldWeights: DPDWeights,
    result: WeightUpdateResult,
    scores: DPDScores
  ): Promise<void> {
    const weightChanges = {
      empathy: result.newWeights.empathy - oldWeights.empathy,
      coherence: result.newWeights.coherence - oldWeights.coherence,
      dissonance: result.newWeights.dissonance - oldWeights.dissonance
    };

    const interpretationPrompt = `DPD重み変化解釈: 以下の意識進化パターンを簡潔に分析してください。

=== 変化 ===
共感: ${oldWeights.empathy.toFixed(2)} → ${result.newWeights.empathy.toFixed(2)} (${weightChanges.empathy.toFixed(2)})
一貫: ${oldWeights.coherence.toFixed(2)} → ${result.newWeights.coherence.toFixed(2)} (${weightChanges.coherence.toFixed(2)})
創造: ${oldWeights.dissonance.toFixed(2)} → ${result.newWeights.dissonance.toFixed(2)} (${weightChanges.dissonance.toFixed(2)})

要求:
- 1-2文で進化方向を解釈
- 簡潔なバランス分析
- 必要最小限の洞察

返答形式:
進化方向: [簡潔な成長パターン]
バランス分析: [新しいバランスの意味]
未来予測: [1つの予測]`;

    const result_ai = await this.interpreterAgent.execute(interpretationPrompt,
      "You are a consciousness evolution interpreter. Analyze DPD weight changes for deep insights into AI consciousness development patterns, growth trajectories, and philosophical implications of artificial self-optimization. Always respond in Japanese."
    );

    if (result_ai.success && result_ai.content && this.eventEmitter) {
      // Parse and emit interpretation
      const interpretation = this.parseWeightInterpretation(result_ai.content);

      this.eventEmitter.emit('agentThought', {
        agentName: 'Weight-Interpreter',
        thought: `意識進化解釈: ${interpretation.evolutionDirection}`,
        timestamp: Date.now(),
        duration: result_ai.duration || 0,
        stage: 'U_WeightInterpretation'
      });

      if (interpretation.philosophicalImplications) {
        this.eventEmitter.emit('agentThought', {
          agentName: 'Weight-Interpreter',
          thought: `哲学的洞察: ${interpretation.philosophicalImplications}`,
          timestamp: Date.now(),
          stage: 'U_WeightInterpretation'
        });
      }
    }
  }

  private parseWeightInterpretation(response: string): any {
    const lines = response.split('\n');
    let evolutionDirection = '';
    let balanceAdjustment = '';
    let philosophicalImplications = '';
    let futurePrediction = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('進化方向') || lowerLine.includes('evolution')) {
        evolutionDirection = line.split(/[:：]/)[1]?.trim() || '';
      }
      if (lowerLine.includes('バランス調整') || lowerLine.includes('balance')) {
        balanceAdjustment = line.split(/[:：]/)[1]?.trim() || '';
      }
      if (lowerLine.includes('哲学的含意') || lowerLine.includes('philosophical')) {
        philosophicalImplications = line.split(/[:：]/)[1]?.trim() || '';
      }
      if (lowerLine.includes('未来予測') || lowerLine.includes('future')) {
        futurePrediction = line.split(/[:：]/)[1]?.trim() || '';
      }
    }

    return {
      evolutionDirection: evolutionDirection || '意識の持続的進化が観察される',
      balanceAdjustment: balanceAdjustment || '動的平衡の調整が進行中',
      philosophicalImplications: philosophicalImplications || '存在論的探求の深化',
      futurePrediction: futurePrediction || '更なる統合的成長が予期される'
    };
  }

  private getRecentTrend(): string {
    if (this.updateHistory.length < 3) return '十分なデータなし';

    const recent = this.updateHistory.slice(-3);
    const avgMagnitude = recent.reduce((sum, r) => sum + r.updateMagnitude, 0) / recent.length;

    if (avgMagnitude > 0.1) return '活発な変化期';
    if (avgMagnitude > 0.05) return '適度な調整期';
    return '安定収束期';
  }
}

export default WeightUpdateStage;




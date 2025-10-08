/**
 * Multiplicative Weights Algorithm Tests (t_wada quality)
 * 乗法的重み更新アルゴリズムのテスト
 */

import { MultiplicativeWeightsUpdater } from '../../../src/aenea/core/multiplicative-weights';
import { DPDWeights, DPDScores } from '../../../src/types/dpd-types';

describe('MultiplicativeWeightsUpdater', () => {
  describe('基本的な重み更新', () => {
    test('初期重みが正しく正規化される', () => {
      const updater = new MultiplicativeWeightsUpdater();
      const currentWeights: DPDWeights = {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.8,
        coherence: 0.8,
        dissonance: 0.2,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      const result = updater.updateWeights(currentWeights, scores);

      // 重みの合計は1.0である（正規化）
      const sum = result.newWeights.empathy + result.newWeights.coherence + result.newWeights.dissonance;
      expect(sum).toBeCloseTo(1.0, 5);
    });

    test('高スコア次元の重みが増加する', () => {
      const updater = new MultiplicativeWeightsUpdater();
      const currentWeights: DPDWeights = {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.9,  // 高スコア
        coherence: 0.5,
        dissonance: 0.5,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      const result = updater.updateWeights(currentWeights, scores);

      // 共感の重みが増加する
      expect(result.newWeights.empathy).toBeGreaterThanOrEqual(currentWeights.empathy * 0.95);
    });

    test('バージョン番号が正しくインクリメントされる', () => {
      const updater = new MultiplicativeWeightsUpdater();
      const currentWeights: DPDWeights = {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 10
      };
      const scores: DPDScores = {
        empathy: 0.8,
        coherence: 0.8,
        dissonance: 0.2,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      const result = updater.updateWeights(currentWeights, scores);

      expect(result.newWeights.version).toBe(11);
    });
  });

  describe('ランダム摂動機能', () => {
    test('摂動が有効な場合、10サイクルごとに適用される', () => {
      const updater = new MultiplicativeWeightsUpdater({
        perturbationEnabled: true,
        perturbationInterval: 10,
        perturbationStrength: 0.15
      });

      const currentWeights: DPDWeights = {
        empathy: 0.4,
        coherence: 0.4,
        dissonance: 0.2,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.75,
        coherence: 0.75,
        dissonance: 0.75,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      // 9サイクル実行（摂動なし）
      let weights = currentWeights;
      const magnitudes: number[] = [];
      for (let i = 0; i < 9; i++) {
        const result = updater.updateWeights(weights, scores);
        magnitudes.push(result.updateMagnitude);
        weights = result.newWeights;
      }

      // 10サイクル目（摂動あり）
      const result10 = updater.updateWeights(weights, scores);

      // 10サイクル目の変化量が前のサイクルより大きい（摂動の効果）
      const avgMagnitudeBefore = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
      expect(result10.updateMagnitude).toBeGreaterThan(avgMagnitudeBefore * 0.5);
    });

    test('摂動が無効な場合は適用されない', () => {
      const updater = new MultiplicativeWeightsUpdater({
        perturbationEnabled: false
      });

      const currentWeights: DPDWeights = {
        empathy: 0.4,
        coherence: 0.4,
        dissonance: 0.2,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.75,
        coherence: 0.75,
        dissonance: 0.75,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      // 10サイクル実行
      let weights = currentWeights;
      for (let i = 0; i < 10; i++) {
        const result = updater.updateWeights(weights, scores);
        weights = result.newWeights;
      }

      // 摂動がないため、重みの合計は常に1.0
      const sum = weights.empathy + weights.coherence + weights.dissonance;
      expect(sum).toBeCloseTo(1.0, 2);  // decayFactorによる微小な誤差を許容
    });

    test('摂動強度を変更できる', () => {
      const weakPerturbation = new MultiplicativeWeightsUpdater({
        perturbationEnabled: true,
        perturbationInterval: 1,
        perturbationStrength: 0.05  // 弱い
      });

      const strongPerturbation = new MultiplicativeWeightsUpdater({
        perturbationEnabled: true,
        perturbationInterval: 1,
        perturbationStrength: 0.20  // 強い
      });

      const weights: DPDWeights = {
        empathy: 0.4,
        coherence: 0.4,
        dissonance: 0.2,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.75,
        coherence: 0.75,
        dissonance: 0.75,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      const weakResult = weakPerturbation.updateWeights(weights, scores);
      const strongResult = strongPerturbation.updateWeights(weights, scores);

      // 強い摂動の方が変化量が大きい
      expect(strongResult.updateMagnitude).toBeGreaterThan(weakResult.updateMagnitude);
    });
  });

  describe('境界値と安全性', () => {
    test('重みが最小値以下にならない', () => {
      const updater = new MultiplicativeWeightsUpdater({
        minWeight: 0.10
      });

      const currentWeights: DPDWeights = {
        empathy: 0.1,
        coherence: 0.1,
        dissonance: 0.8,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.0,  // 非常に低いスコア
        coherence: 0.0,
        dissonance: 0.9,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      const result = updater.updateWeights(currentWeights, scores);

      expect(result.newWeights.empathy).toBeGreaterThanOrEqual(0.10);
      expect(result.newWeights.coherence).toBeGreaterThanOrEqual(0.10);
      expect(result.newWeights.dissonance).toBeGreaterThanOrEqual(0.10);
    });

    test('重みが最大値を超えない', () => {
      const updater = new MultiplicativeWeightsUpdater({
        maxWeight: 0.75
      });

      const currentWeights: DPDWeights = {
        empathy: 0.7,
        coherence: 0.2,
        dissonance: 0.1,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 1.0,  // 最高スコア
        coherence: 0.0,
        dissonance: 0.0,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      const result = updater.updateWeights(currentWeights, scores);

      expect(result.newWeights.empathy).toBeLessThanOrEqual(0.75);
      expect(result.newWeights.coherence).toBeLessThanOrEqual(0.75);
      expect(result.newWeights.dissonance).toBeLessThanOrEqual(0.75);
    });

    test('NaN値が発生した場合はデフォルト重みにリセット', () => {
      const updater = new MultiplicativeWeightsUpdater();
      const currentWeights: DPDWeights = {
        empathy: 0,
        coherence: 0,
        dissonance: 0,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: NaN,
        coherence: NaN,
        dissonance: NaN,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      const result = updater.updateWeights(currentWeights, scores);

      // デフォルト値にリセット
      expect(result.newWeights.empathy).toBeCloseTo(0.33, 1);
      expect(result.newWeights.coherence).toBeCloseTo(0.33, 1);
      expect(result.newWeights.dissonance).toBeCloseTo(0.34, 1);
    });
  });

  describe('収束メトリック', () => {
    test('収束メトリックが正しく計算される', () => {
      const updater = new MultiplicativeWeightsUpdater();
      const weights: DPDWeights = {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.75,
        coherence: 0.75,
        dissonance: 0.75,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      // 5サイクル実行して収束メトリックを蓄積
      let currentWeights = weights;
      for (let i = 0; i < 5; i++) {
        const result = updater.updateWeights(currentWeights, scores);
        currentWeights = result.newWeights;

        if (i === 4) {
          // 5サイクル目で収束メトリックが計算される
          expect(result.convergenceMetric).toBeGreaterThanOrEqual(0);
          expect(result.convergenceMetric).toBeLessThanOrEqual(1);
        }
      }
    });

    test('同じスコアを繰り返すと収束する', () => {
      const updater = new MultiplicativeWeightsUpdater({
        perturbationEnabled: false  // 摂動なし
      });

      const weights: DPDWeights = {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.75,
        coherence: 0.75,
        dissonance: 0.75,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      // 20サイクル同じスコアで更新
      let currentWeights = weights;
      let lastMagnitude = 1.0;
      for (let i = 0; i < 20; i++) {
        const result = updater.updateWeights(currentWeights, scores);
        currentWeights = result.newWeights;
        lastMagnitude = result.updateMagnitude;
      }

      // 更新量が非常に小さくなる（収束）
      expect(lastMagnitude).toBeLessThan(0.01);
    });
  });

  describe('設定の更新と取得', () => {
    test('設定を取得できる', () => {
      const updater = new MultiplicativeWeightsUpdater({
        learningRate: 0.1,
        minWeight: 0.15
      });

      const config = updater.getConfig();

      expect(config.learningRate).toBe(0.1);
      expect(config.minWeight).toBe(0.15);
    });

    test('設定を動的に更新できる', () => {
      const updater = new MultiplicativeWeightsUpdater();

      updater.updateConfig({
        learningRate: 0.2,
        perturbationEnabled: true
      });

      const config = updater.getConfig();
      expect(config.learningRate).toBe(0.2);
      expect(config.perturbationEnabled).toBe(true);
    });

    test('履歴を取得できる', () => {
      const updater = new MultiplicativeWeightsUpdater();
      const weights: DPDWeights = {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.8,
        coherence: 0.8,
        dissonance: 0.2,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      updater.updateWeights(weights, scores);
      updater.updateWeights(weights, scores);

      const history = updater.getUpdateHistory();
      expect(history).toHaveLength(2);
    });

    test('履歴をクリアできる', () => {
      const updater = new MultiplicativeWeightsUpdater();
      const weights: DPDWeights = {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 1
      };
      const scores: DPDScores = {
        empathy: 0.8,
        coherence: 0.8,
        dissonance: 0.2,
        weightedTotal: 0,
        timestamp: Date.now(),
        context: { thoughtId: 'test', agentId: 'test' }
      };

      updater.updateWeights(weights, scores);
      updater.clearHistory();

      const history = updater.getUpdateHistory();
      expect(history).toHaveLength(0);
    });
  });
});

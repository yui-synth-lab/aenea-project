/**
 * Heuristic (keyword-based) DPD scoring used in critical energy mode, where
 * the AI-backed DPD assessment is too expensive. Pure: current weights are
 * passed in. Moved from ThoughtPipeline (Issue #7).
 */

import { log } from '../../platform/logger.js';
import type { DPDScores, DPDWeights } from '../../types/dpd-types.js';
import type { ThoughtCycle } from './consciousness-internals.js';

/**
 * Calculate DPD scores using keyword-based heuristics (no AI)
 */
export function calculateFallbackDPDScores(thoughtCycle: ThoughtCycle, weights: DPDWeights): DPDScores {
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
  const empathyCount = countKeywords(allContent, empathyKeywords);
  const coherenceCount = countKeywords(allContent, coherenceKeywords);
  const dissonanceCount = countKeywords(allContent, dissonanceKeywords);

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
    empathyScore * weights.empathy +
    coherenceScore * weights.coherence +
    dissonanceScore * weights.dissonance
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
function countKeywords(text: string, keywords: string[]): number {
  return keywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword, 'g');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

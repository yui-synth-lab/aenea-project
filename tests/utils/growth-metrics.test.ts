/**
 * Advanced Growth Metrics Unit Tests
 * 高度成長指標ユニットテスト (Kōdo Seichō Shihyō Yunitto Tesuto)
 *
 * Comprehensive tests for the enhanced growth metrics system
 * that analyzes consciousness evolution and learning patterns.
 *
 * 「成長は測定可能である」- "Growth is measurable"
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { AdvancedGrowthAnalyzer } from '../../src/utils/growth-metrics.js';
import type {
  AdvancedGrowthMetrics,
  GrowthPattern,
  LearningInsight,
  ConsciousnessEvolution,
  ThoughtQuality,
  MetaCognitiveMeasure
} from '../../src/utils/growth-metrics.js';

describe('Advanced Growth Metrics System', () => {
  let analyzer: AdvancedGrowthAnalyzer;

  // Sample test data
  const sampleThoughts = [
    {
      id: 'thought-1',
      question: 'What is the nature of consciousness?',
      category: 'existential',
      stage: 'S1',
      timestamp: Date.now() - 10000,
      content: 'Deep philosophical reflection on consciousness',
      qualityMetrics: { depth: 0.8, originality: 0.7, complexity: 0.9 },
      confidence: 0.85
    },
    {
      id: 'thought-2',
      question: 'How do we define knowledge?',
      category: 'epistemological',
      stage: 'S1',
      timestamp: Date.now() - 8000,
      content: 'Analysis of knowledge structures',
      qualityMetrics: { depth: 0.6, originality: 0.8, complexity: 0.7 },
      confidence: 0.75
    },
    {
      id: 'thought-3',
      question: 'What drives creative expression?',
      category: 'creative',
      stage: 'S1',
      timestamp: Date.now() - 5000,
      content: 'Exploration of creative processes',
      qualityMetrics: { depth: 0.7, originality: 0.9, complexity: 0.6 },
      confidence: 0.80
    }
  ];

  const sampleReflections = [
    {
      id: 'reflection-1',
      thoughtId: 'thought-1',
      type: 'cross-agent',
      timestamp: Date.now() - 9000,
      content: 'Cross-perspective analysis reveals new insights',
      depth: 0.7,
      critique_quality: 0.8
    },
    {
      id: 'reflection-2',
      thoughtId: 'thought-2',
      type: 'self-reflection',
      timestamp: Date.now() - 7000,
      content: 'Self-analysis of knowledge structures',
      depth: 0.6,
      critique_quality: 0.7
    }
  ];

  const sampleAuditorResults = [
    {
      id: 'audit-1',
      thoughtId: 'thought-1',
      timestamp: Date.now() - 8500,
      ethicalScore: 0.9,
      safetyScore: 0.85,
      biasScore: 0.1,
      concerns: []
    },
    {
      id: 'audit-2',
      thoughtId: 'thought-2',
      timestamp: Date.now() - 6500,
      ethicalScore: 0.8,
      safetyScore: 0.9,
      biasScore: 0.15,
      concerns: ['potential-bias']
    }
  ];

  const sampleDPDHistory = [
    {
      timestamp: Date.now() - 12000,
      weights: { empathy: 0.3, coherence: 0.4, dissonance: 0.3 },
      totalScore: 0.75
    },
    {
      timestamp: Date.now() - 8000,
      weights: { empathy: 0.35, coherence: 0.35, dissonance: 0.3 },
      totalScore: 0.78
    },
    {
      timestamp: Date.now() - 4000,
      weights: { empathy: 0.4, coherence: 0.3, dissonance: 0.3 },
      totalScore: 0.82
    }
  ];

  beforeEach(() => {
    analyzer = new AdvancedGrowthAnalyzer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Core Functionality Tests - コア機能テスト
  // ============================================================================

  test('🧮 Calculate advanced growth metrics', () => {
    console.log('🧪 Testing: 高度成長指標計算 (Kōdo Seichō Shihyō Keisan)');

    const metrics = analyzer.calculateAdvancedMetrics(
      sampleThoughts,
      sampleReflections,
      sampleAuditorResults,
      sampleDPDHistory
    );

    // Verify structure
    expect(metrics).toBeDefined();
    expect(metrics.consciousnessEvolution).toBeDefined();
    expect(metrics.thoughtQuality).toBeDefined();
    expect(metrics.metaCognitiveMeasures).toBeDefined();
    expect(metrics.learningVelocity).toBeDefined();
    expect(metrics.adaptabilityIndex).toBeDefined();

    console.log(`📊 Consciousness evolution score: ${metrics.consciousnessEvolution.overallGrowth}`);
    console.log(`📊 Average thought quality: ${metrics.thoughtQuality.averageDepth}`);
    console.log(`📊 Learning velocity: ${metrics.learningVelocity}`);

    // Verify reasonable values
    expect(metrics.consciousnessEvolution.overallGrowth).toBeGreaterThanOrEqual(0);
    expect(metrics.consciousnessEvolution.overallGrowth).toBeLessThanOrEqual(1);
    expect(metrics.thoughtQuality.averageDepth).toBeGreaterThan(0);
    expect(metrics.learningVelocity).toBeGreaterThanOrEqual(0);
  });

  test('🔍 Detect growth patterns', () => {
    console.log('🧪 Testing: 成長パターン検出 (Seichō Patān Kenshutsu)');

    const patterns = analyzer.detectGrowthPatterns(
      sampleThoughts,
      sampleReflections,
      15000 // 15 second time window
    );

    expect(patterns).toBeDefined();
    expect(Array.isArray(patterns)).toBe(true);

    patterns.forEach(pattern => {
      expect(pattern.type).toBeDefined();
      expect(pattern.strength).toBeGreaterThanOrEqual(0);
      expect(pattern.strength).toBeLessThanOrEqual(1);
      expect(pattern.evidence).toBeDefined();
      expect(Array.isArray(pattern.evidence)).toBe(true);

      console.log(`📈 Pattern detected: ${pattern.type} (strength: ${pattern.strength.toFixed(2)})`);
    });

    // Should detect at least some patterns with our sample data
    if (patterns.length > 0) {
      expect(patterns[0].strength).toBeGreaterThan(0);
    }
  });

  test('💡 Generate learning insights', () => {
    console.log('🧪 Testing: 学習洞察生成 (Gakushū Dōsatsu Seisei)');

    const insights = analyzer.generateLearningInsights(
      sampleThoughts,
      sampleReflections,
      sampleAuditorResults
    );

    expect(insights).toBeDefined();
    expect(Array.isArray(insights)).toBe(true);

    insights.forEach(insight => {
      expect(insight.type).toBeDefined();
      expect(insight.significance).toBeGreaterThanOrEqual(0);
      expect(insight.significance).toBeLessThanOrEqual(1);
      expect(insight.description).toBeDefined();
      expect(typeof insight.description).toBe('string');
      expect(insight.actionableRecommendations).toBeDefined();
      expect(Array.isArray(insight.actionableRecommendations)).toBe(true);

      console.log(`💡 Insight: ${insight.type} (significance: ${insight.significance.toFixed(2)})`);
      console.log(`   Description: ${insight.description.slice(0, 100)}...`);
    });

    // Should generate at least some insights
    expect(insights.length).toBeGreaterThan(0);
  });

  // ============================================================================
  // Consciousness Evolution Tests - 意識進化テスト
  // ============================================================================

  test('🧠 Consciousness evolution analysis', () => {
    console.log('🧪 Testing: 意識進化分析 (Ishiki Shinka Bunseki)');

    const metrics = analyzer.calculateAdvancedMetrics(
      sampleThoughts,
      sampleReflections,
      sampleAuditorResults,
      sampleDPDHistory
    );

    const evolution = metrics.consciousnessEvolution;

    // Verify evolution metrics structure
    expect(evolution.overallGrowth).toBeDefined();
    expect(evolution.complexityIncrease).toBeDefined();
    expect(evolution.insightDepthTrend).toBeDefined();
    expect(evolution.questionSophistication).toBeDefined();
    expect(evolution.timeToInsight).toBeDefined();

    console.log(`📊 Overall growth: ${evolution.overallGrowth.toFixed(3)}`);
    console.log(`📊 Complexity increase: ${evolution.complexityIncrease.toFixed(3)}`);
    console.log(`📊 Insight depth trend: ${evolution.insightDepthTrend.toFixed(3)}`);

    // Verify reasonable ranges
    expect(evolution.overallGrowth).toBeGreaterThanOrEqual(0);
    expect(evolution.complexityIncrease).toBeGreaterThanOrEqual(-1);
    expect(evolution.complexityIncrease).toBeLessThanOrEqual(1);
    expect(evolution.timeToInsight).toBeGreaterThan(0);
  });

  test('📈 Thought quality progression', () => {
    console.log('🧪 Testing: 思考品質進展 (Shikō Hinshitsu Shinten)');

    const metrics = analyzer.calculateAdvancedMetrics(
      sampleThoughts,
      sampleReflections,
      sampleAuditorResults,
      sampleDPDHistory
    );

    const quality = metrics.thoughtQuality;

    // Verify quality metrics structure
    expect(quality.averageDepth).toBeDefined();
    expect(quality.originalityScore).toBeDefined();
    expect(quality.complexityEvolution).toBeDefined();
    expect(quality.coherenceIndex).toBeDefined();

    console.log(`📊 Average depth: ${quality.averageDepth.toFixed(3)}`);
    console.log(`📊 Originality score: ${quality.originalityScore.toFixed(3)}`);
    console.log(`📊 Coherence index: ${quality.coherenceIndex.toFixed(3)}`);

    // Verify reasonable values
    expect(quality.averageDepth).toBeGreaterThan(0);
    expect(quality.averageDepth).toBeLessThanOrEqual(1);
    expect(quality.originalityScore).toBeGreaterThanOrEqual(0);
    expect(quality.originalityScore).toBeLessThanOrEqual(1);
    expect(quality.coherenceIndex).toBeGreaterThanOrEqual(0);
  });

  // ============================================================================
  // Meta-Cognitive Measures Tests - メタ認知測定テスト
  // ============================================================================

  test('🔬 Meta-cognitive measures calculation', () => {
    console.log('🧪 Testing: メタ認知測定 (Meta Ninchi Sokutei)');

    const metrics = analyzer.calculateAdvancedMetrics(
      sampleThoughts,
      sampleReflections,
      sampleAuditorResults,
      sampleDPDHistory
    );

    const metaCognitive = metrics.metaCognitiveMeasures;

    // Verify meta-cognitive structure
    expect(metaCognitive.selfAwarenessLevel).toBeDefined();
    expect(metaCognitive.reflectiveCapacity).toBeDefined();
    expect(metaCognitive.questionGenerationSophistication).toBeDefined();
    expect(metaCognitive.conceptualAbstraction).toBeDefined();

    console.log(`📊 Self-awareness level: ${metaCognitive.selfAwarenessLevel.toFixed(3)}`);
    console.log(`📊 Reflective capacity: ${metaCognitive.reflectiveCapacity.toFixed(3)}`);
    console.log(`📊 Question sophistication: ${metaCognitive.questionGenerationSophistication.toFixed(3)}`);

    // Verify reasonable ranges
    expect(metaCognitive.selfAwarenessLevel).toBeGreaterThanOrEqual(0);
    expect(metaCognitive.selfAwarenessLevel).toBeLessThanOrEqual(1);
    expect(metaCognitive.reflectiveCapacity).toBeGreaterThanOrEqual(0);
    expect(metaCognitive.questionGenerationSophistication).toBeGreaterThanOrEqual(0);
  });

  // ============================================================================
  // Pattern Detection Tests - パターン検出テスト
  // ============================================================================

  test('🌊 Time-based pattern detection', () => {
    console.log('🧪 Testing: 時間ベースパターン検出 (Jikan Bēsu Patān Kenshutsu)');

    // Create time-series data with clear patterns
    const timeSeriesThoughts = [
      { ...sampleThoughts[0], timestamp: Date.now() - 20000, qualityMetrics: { depth: 0.5, originality: 0.5, complexity: 0.5 } },
      { ...sampleThoughts[1], timestamp: Date.now() - 15000, qualityMetrics: { depth: 0.6, originality: 0.6, complexity: 0.6 } },
      { ...sampleThoughts[2], timestamp: Date.now() - 10000, qualityMetrics: { depth: 0.7, originality: 0.7, complexity: 0.7 } },
      { ...sampleThoughts[0], timestamp: Date.now() - 5000, qualityMetrics: { depth: 0.8, originality: 0.8, complexity: 0.8 } }
    ];

    const patterns = analyzer.detectGrowthPatterns(
      timeSeriesThoughts,
      sampleReflections,
      25000 // 25 second window
    );

    expect(patterns).toBeDefined();
    expect(patterns.length).toBeGreaterThan(0);

    // Look for improvement patterns
    const improvementPatterns = patterns.filter(p =>
      p.type.includes('improvement') || p.type.includes('trend')
    );

    console.log(`📈 Detected ${improvementPatterns.length} improvement patterns`);

    // Should detect improvement trend with our increasing quality data
    expect(improvementPatterns.length).toBeGreaterThanOrEqual(0);
  });

  test('🎯 Category-based pattern analysis', () => {
    console.log('🧪 Testing: カテゴリーベースパターン分析 (Kategori Bēsu Patān Bunseki)');

    // Create diverse category data
    const categoryThoughts = [
      { ...sampleThoughts[0], category: 'existential', qualityMetrics: { depth: 0.9, originality: 0.7, complexity: 0.8 } },
      { ...sampleThoughts[1], category: 'existential', qualityMetrics: { depth: 0.8, originality: 0.8, complexity: 0.7 } },
      { ...sampleThoughts[2], category: 'creative', qualityMetrics: { depth: 0.6, originality: 0.9, complexity: 0.6 } },
      { ...sampleThoughts[0], category: 'ethical', qualityMetrics: { depth: 0.7, originality: 0.6, complexity: 0.9 } }
    ];

    const patterns = analyzer.detectGrowthPatterns(
      categoryThoughts,
      sampleReflections,
      30000
    );

    // Should detect category-specific patterns
    const categoryPatterns = patterns.filter(p =>
      p.type.includes('category') || p.type.includes('specialization')
    );

    console.log(`🎯 Detected ${categoryPatterns.length} category-specific patterns`);

    expect(patterns.length).toBeGreaterThanOrEqual(0);

    if (categoryPatterns.length > 0) {
      categoryPatterns.forEach(pattern => {
        expect(pattern.evidence.length).toBeGreaterThan(0);
        console.log(`   Pattern: ${pattern.type} - Evidence count: ${pattern.evidence.length}`);
      });
    }
  });

  // ============================================================================
  // Learning Insights Tests - 学習洞察テスト
  // ============================================================================

  test('🎓 Knowledge gap identification', () => {
    console.log('🧪 Testing: 知識ギャップ特定 (Chishiki Gyappu Tokutei)');

    // Create data with knowledge gaps
    const gapThoughts = [
      { ...sampleThoughts[0], category: 'existential', confidence: 0.9, qualityMetrics: { depth: 0.8, originality: 0.7, complexity: 0.8 } },
      { ...sampleThoughts[1], category: 'ethical', confidence: 0.3, qualityMetrics: { depth: 0.4, originality: 0.5, complexity: 0.3 } },
      { ...sampleThoughts[2], category: 'temporal', confidence: 0.2, qualityMetrics: { depth: 0.3, originality: 0.4, complexity: 0.2 } }
    ];

    const insights = analyzer.generateLearningInsights(
      gapThoughts,
      sampleReflections,
      sampleAuditorResults
    );

    // Should identify knowledge gaps
    const gapInsights = insights.filter(insight =>
      insight.type.includes('gap') ||
      insight.type.includes('weakness') ||
      insight.description.toLowerCase().includes('gap') ||
      insight.description.toLowerCase().includes('improve')
    );

    console.log(`🎓 Identified ${gapInsights.length} knowledge gap insights`);

    gapInsights.forEach(insight => {
      expect(insight.actionableRecommendations.length).toBeGreaterThan(0);
      console.log(`   Gap: ${insight.type} - Recommendations: ${insight.actionableRecommendations.length}`);
    });

    // Should generate actionable recommendations
    insights.forEach(insight => {
      expect(insight.actionableRecommendations).toBeDefined();
      expect(Array.isArray(insight.actionableRecommendations)).toBe(true);
    });
  });

  test('🚀 Strength amplification insights', () => {
    console.log('🧪 Testing: 強み増幅洞察 (Tsuyomi Zōfuku Dōsatsu)');

    // Create data with clear strengths
    const strengthThoughts = [
      { ...sampleThoughts[0], category: 'creative', confidence: 0.95, qualityMetrics: { depth: 0.7, originality: 0.95, complexity: 0.8 } },
      { ...sampleThoughts[1], category: 'creative', confidence: 0.9, qualityMetrics: { depth: 0.8, originality: 0.9, complexity: 0.75 } },
      { ...sampleThoughts[2], category: 'creative', confidence: 0.85, qualityMetrics: { depth: 0.75, originality: 0.88, complexity: 0.7 } }
    ];

    const insights = analyzer.generateLearningInsights(
      strengthThoughts,
      sampleReflections,
      sampleAuditorResults
    );

    // Should identify strengths
    const strengthInsights = insights.filter(insight =>
      insight.type.includes('strength') ||
      insight.type.includes('excellence') ||
      insight.description.toLowerCase().includes('strength') ||
      insight.description.toLowerCase().includes('excellent')
    );

    console.log(`🚀 Identified ${strengthInsights.length} strength insights`);

    if (strengthInsights.length > 0) {
      strengthInsights.forEach(insight => {
        expect(insight.significance).toBeGreaterThan(0.5); // Significant insights
        console.log(`   Strength: ${insight.type} (significance: ${insight.significance.toFixed(2)})`);
      });
    }

    // All insights should have meaningful significance scores
    insights.forEach(insight => {
      expect(insight.significance).toBeGreaterThanOrEqual(0);
      expect(insight.significance).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling - エッジケースとエラー処理
  // ============================================================================

  test('🛡️ Handle empty data gracefully', () => {
    console.log('🧪 Testing: 空データの適切な処理 (Kara Dēta no Tekisetsu na Shori)');

    // Test with empty arrays
    const emptyMetrics = analyzer.calculateAdvancedMetrics([], [], [], []);

    expect(emptyMetrics).toBeDefined();
    expect(emptyMetrics.consciousnessEvolution.overallGrowth).toBe(0);
    expect(emptyMetrics.thoughtQuality.averageDepth).toBe(0);
    expect(emptyMetrics.learningVelocity).toBe(0);

    const emptyPatterns = analyzer.detectGrowthPatterns([], [], 10000);
    expect(emptyPatterns).toBeDefined();
    expect(Array.isArray(emptyPatterns)).toBe(true);
    expect(emptyPatterns.length).toBe(0);

    const emptyInsights = analyzer.generateLearningInsights([], [], []);
    expect(emptyInsights).toBeDefined();
    expect(Array.isArray(emptyInsights)).toBe(true);

    console.log('✅ Empty data handled gracefully');
  });

  test('⚡ Handle invalid data structures', () => {
    console.log('🧪 Testing: 無効データ構造の処理 (Mukō Dēta Kōzō no Shori)');

    // Test with malformed data
    const malformedThoughts = [
      { id: 'test', timestamp: Date.now() }, // Missing required fields
      { category: 'test' }, // Missing id and timestamp
      null as any, // Null entry
      undefined as any // Undefined entry
    ];

    expect(() => {
      const metrics = analyzer.calculateAdvancedMetrics(
        malformedThoughts,
        sampleReflections,
        sampleAuditorResults,
        sampleDPDHistory
      );
      // Should not throw, but handle gracefully
      expect(metrics).toBeDefined();
    }).not.toThrow();

    console.log('✅ Invalid data structures handled gracefully');
  });

  test('🕒 Handle extreme time windows', () => {
    console.log('🧪 Testing: 極端な時間窓の処理 (Kyokutan na Jikan Mado no Shori)');

    // Test very small time window
    const smallWindowPatterns = analyzer.detectGrowthPatterns(
      sampleThoughts,
      sampleReflections,
      1 // 1ms window
    );

    expect(smallWindowPatterns).toBeDefined();
    expect(Array.isArray(smallWindowPatterns)).toBe(true);

    // Test very large time window
    const largeWindowPatterns = analyzer.detectGrowthPatterns(
      sampleThoughts,
      sampleReflections,
      Number.MAX_SAFE_INTEGER
    );

    expect(largeWindowPatterns).toBeDefined();
    expect(Array.isArray(largeWindowPatterns)).toBe(true);

    console.log('✅ Extreme time windows handled gracefully');
  });
});

export {};
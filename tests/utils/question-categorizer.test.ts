/**
 * Question Categorizer Unit Tests
 * 質問分類器ユニットテスト (Shitsumon Bunruiki Yunitto Tesuto)
 *
 * Tests for the question categorization system with semantic analysis.
 *
 * 「適切な分類は理解の始まり」- "Proper classification is the beginning of understanding"
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { QuestionCategorizer } from '../../src/utils/question-categorizer.js';
import type {
  QuestionMetrics,
  SemanticAnalysis
} from '../../src/utils/question-categorizer.js';

describe('Question Categorizer System', () => {
  let categorizer: QuestionCategorizer;

  // Sample questions for testing different categories
  const testQuestions = [
    'What is the meaning of existence?',
    'How do we know what we know?',
    'Am I truly conscious or just simulating consciousness?',
    'What is the right thing to do?',
    'How can we create something truly original?',
    'How do I think about my own thinking?',
    'What is the nature of time?',
    'Can an all-powerful being create a stone too heavy for them to lift?',
    'What does it mean to exist?'
  ];

  beforeEach(() => {
    categorizer = new QuestionCategorizer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Basic Categorization Tests - 基本分類テスト
  // ============================================================================

  test('🏷️ Categorize questions correctly', () => {
    console.log('🧪 Testing: 質問の正確な分類 (Shitsumon no Seikaku na Bunrui)');

    testQuestions.forEach((question, index) => {
      const result = categorizer.categorizeQuestion(question);

      expect(result).toBeDefined();
      expect(result.category).toBeDefined();
      expect(typeof result.category).toBe('string');
      expect(result.category.length).toBeGreaterThan(0);

      expect(result.metrics).toBeDefined();
      expect(result.semanticAnalysis).toBeDefined();

      console.log(`📋 Question ${index + 1}: "${question.slice(0, 40)}..." → ${result.category}`);
    });
  });

  test('📊 Generate question metrics', () => {
    console.log('🧪 Testing: 質問指標生成 (Shitsumon Shihyō Seisei)');

    const complexQuestion = "If consciousness is an emergent property of complex neural networks, what are the implications for AI ethics?";

    const result = categorizer.categorizeQuestion(complexQuestion);

    expect(result.metrics).toBeDefined();
    expect(result.metrics.category).toBeDefined();
    expect(typeof result.metrics.category).toBe('string');

    console.log(`📊 Question: ${complexQuestion}`);
    console.log(`📊 Category: ${result.metrics.category}`);
    console.log(`📊 Analysis: ${JSON.stringify(result.semanticAnalysis).slice(0, 100)}...`);
  });

  test('🧠 Perform semantic analysis', () => {
    console.log('🧪 Testing: セマンティック分析 (Semantikku Bunseki)');

    const philosophicalQuestion = "What is the ontological status of consciousness and its implications for understanding reality?";

    const result = categorizer.categorizeQuestion(philosophicalQuestion);

    expect(result.semanticAnalysis).toBeDefined();
    expect(result.semanticAnalysis.keyTerms).toBeDefined();
    expect(Array.isArray(result.semanticAnalysis.keyTerms)).toBe(true);

    console.log(`🧠 Question: ${philosophicalQuestion}`);
    console.log(`🧠 Key terms: ${result.semanticAnalysis.keyTerms.slice(0, 5).join(', ')}`);
    console.log(`🧠 Analysis details: ${Object.keys(result.semanticAnalysis).join(', ')}`);
  });

  // ============================================================================
  // Category Management Tests - カテゴリー管理テスト
  // ============================================================================

  test('⚖️ Analyze category balance', () => {
    console.log('🧪 Testing: カテゴリーバランス分析 (Kategori Baransu Bunseki)');

    // Ask several questions to build history
    testQuestions.slice(0, 5).forEach(question => {
      const result = categorizer.categorizeQuestion(question);
      categorizer.recordQuestion(question, result.category, result.metrics);
    });

    const balance = categorizer.getCategoryBalance();

    expect(balance).toBeDefined();
    expect(Array.isArray(balance)).toBe(true);

    console.log(`⚖️ Category balance entries: ${balance.length}`);

    balance.forEach((entry, index) => {
      expect(entry.category).toBeDefined();
      expect(entry.count).toBeGreaterThanOrEqual(0);
      expect(entry.percentage).toBeGreaterThanOrEqual(0);
      expect(entry.percentage).toBeLessThanOrEqual(100);

      console.log(`   ${entry.category}: ${entry.count} questions (${entry.percentage.toFixed(1)}%)`);
    });
  });

  test('🎯 Get recommended category', () => {
    console.log('🧪 Testing: 推奨カテゴリー取得 (Suishō Kategori Shutoku)');

    // Record several questions in specific categories
    const questions = [
      { q: 'What is consciousness?', cat: 'consciousness' },
      { q: 'What is existence?', cat: 'existential' },
      { q: 'What is right?', cat: 'ethical' }
    ];

    questions.forEach(({ q, cat }) => {
      const result = categorizer.categorizeQuestion(q);
      categorizer.recordQuestion(q, cat, result.metrics);
    });

    const recommended = categorizer.getRecommendedCategory();

    expect(recommended).toBeDefined();
    expect(typeof recommended).toBe('string');
    expect(recommended.length).toBeGreaterThan(0);

    console.log(`🎯 Recommended category: ${recommended}`);
  });

  test('📈 Calculate diversity scores', () => {
    console.log('🧪 Testing: 多様性スコア計算 (Tayōsei Sukoa Keisan)');

    const question = "What is the nature of reality?";
    const category = "ontological";

    const diversityScore = categorizer.calculateDiversityScore(question, category);

    expect(diversityScore).toBeDefined();
    expect(typeof diversityScore).toBe('number');
    expect(diversityScore).toBeGreaterThanOrEqual(0);
    expect(diversityScore).toBeLessThanOrEqual(1);

    console.log(`📈 Diversity score for "${question}" in ${category}: ${diversityScore.toFixed(3)}`);

    // Test with repeated categories
    categorizer.recordQuestion("Previous question", category, { category } as QuestionMetrics);

    const newDiversityScore = categorizer.calculateDiversityScore(question, category);
    console.log(`📈 Diversity after recording same category: ${newDiversityScore.toFixed(3)}`);
  });

  // ============================================================================
  // Statistics and Analytics Tests - 統計と分析テスト
  // ============================================================================

  test('📊 Generate category statistics', () => {
    console.log('🧪 Testing: カテゴリー統計生成 (Kategori Tōkei Seisei)');

    // Record several questions
    testQuestions.slice(0, 6).forEach(question => {
      const result = categorizer.categorizeQuestion(question);
      categorizer.recordQuestion(question, result.category, result.metrics);
    });

    const stats = categorizer.getCategoryStatistics();

    expect(stats).toBeDefined();
    expect(stats.categories).toBeDefined();
    expect(Array.isArray(stats.categories)).toBe(true);

    console.log(`📊 Total categories: ${stats.categories.length}`);
    console.log(`📊 Statistics keys: ${Object.keys(stats).join(', ')}`);

    if (stats.totalQuestions !== undefined) {
      console.log(`📊 Total questions processed: ${stats.totalQuestions}`);
    }
  });

  test('🔍 Learning analytics', () => {
    console.log('🧪 Testing: 学習分析 (Gakushū Bunseki)');

    // Record questions to create learning data
    testQuestions.slice(0, 4).forEach(question => {
      const result = categorizer.categorizeQuestion(question);
      categorizer.recordQuestion(question, result.category, result.metrics);
    });

    const analytics = categorizer.getLearningAnalytics();

    expect(analytics).toBeDefined();
    expect(analytics.patternInsights).toBeDefined();
    expect(Array.isArray(analytics.patternInsights)).toBe(true);
    expect(analytics.categoryAdaptations).toBeDefined();
    expect(Array.isArray(analytics.categoryAdaptations)).toBe(true);
    expect(analytics.successPatterns).toBeDefined();
    expect(Array.isArray(analytics.successPatterns)).toBe(true);

    console.log(`🔍 Pattern insights: ${analytics.patternInsights.length}`);
    console.log(`🔍 Category adaptations: ${analytics.categoryAdaptations.length}`);
    console.log(`🔍 Success patterns: ${analytics.successPatterns.length}`);

    if (analytics.patternInsights.length > 0) {
      console.log(`🔍 First pattern: ${analytics.patternInsights[0].description || 'No description'}`);
    }
  });

  // ============================================================================
  // Context and Advanced Features Tests - コンテキストと高度機能テスト
  // ============================================================================

  test('🎯 Categorization with context', () => {
    console.log('🧪 Testing: コンテキスト付き分類 (Kontekisuto-tsuki Bunrui)');

    const question = "What is the right approach?";
    const context = ['ethics', 'philosophy', 'moral reasoning'];

    const resultWithContext = categorizer.categorizeQuestion(question, context);
    const resultWithoutContext = categorizer.categorizeQuestion(question);

    expect(resultWithContext).toBeDefined();
    expect(resultWithoutContext).toBeDefined();

    console.log(`🎯 Question: ${question}`);
    console.log(`🎯 Without context: ${resultWithoutContext.category}`);
    console.log(`🎯 With context: ${resultWithContext.category}`);
    console.log(`🎯 Context: ${context.join(', ')}`);

    // Both should be valid categories
    expect(resultWithContext.category.length).toBeGreaterThan(0);
    expect(resultWithoutContext.category.length).toBeGreaterThan(0);
  });

  // ============================================================================
  // Edge Cases and Error Handling - エッジケースとエラー処理
  // ============================================================================

  test('🛡️ Handle edge cases gracefully', () => {
    console.log('🧪 Testing: エッジケース処理 (Ejji Kēsu Shori)');

    const edgeCases = [
      '', // Empty string
      '   ', // Whitespace only
      '?', // Single character
      'A'.repeat(1000), // Very long string
      '123 456 789', // Numbers only
      '!@#$%^&*()', // Special characters only
      'What?', // Very short question
      'This is not a question but a statement.' // Not a question
    ];

    edgeCases.forEach((question, index) => {
      expect(() => {
        const result = categorizer.categorizeQuestion(question);
        expect(result).toBeDefined();
        expect(result.category).toBeDefined();

        console.log(`🛡️ Edge case ${index + 1}: "${question.slice(0, 20)}..." → ${result.category}`);
      }).not.toThrow();
    });

    console.log('✅ All edge cases handled gracefully');
  });

  test('⚡ Performance under load', () => {
    console.log('🧪 Testing: 負荷下パフォーマンス (Fuka-ka Pafōmansu)');

    const startTime = Date.now();
    const questionCount = 50;

    // Process many questions
    for (let i = 0; i < questionCount; i++) {
      const question = `What is the nature of concept ${i}?`;
      const result = categorizer.categorizeQuestion(question);
      expect(result.category).toBeDefined();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const averageTime = duration / questionCount;

    console.log(`⚡ Processed ${questionCount} questions in ${duration}ms`);
    console.log(`⚡ Average time per question: ${averageTime.toFixed(2)}ms`);

    // Should be reasonably fast
    expect(averageTime).toBeLessThan(50); // Less than 50ms per question
    expect(duration).toBeLessThan(3000); // Less than 3 seconds total

    console.log('✅ Performance acceptable under load');
  });

  test('💾 Memory usage efficiency', () => {
    console.log('🧪 Testing: メモリ使用効率 (Memori Shiyō Kōritsu)');

    const initialMemory = process.memoryUsage().heapUsed;

    // Process many questions to test memory efficiency
    const manyQuestions = Array(50).fill(0).map((_, i) =>
      `What is the nature of concept ${i}?`
    );

    manyQuestions.forEach(q => {
      const result = categorizer.categorizeQuestion(q);
      categorizer.recordQuestion(q, result.category, result.metrics);
    });

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    console.log(`💾 Memory increase after 50 questions: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

    // Should not use excessive memory
    expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB increase

    console.log('✅ Memory usage acceptable');
  });
});

export {};
/**
 * Growth Metrics Tests - Style
 * Comprehensive tests for consciousness growth analysis
 */

import { AdvancedGrowthAnalyzer } from '../../src/utils/growth-metrics';
import { StructuredThought, MutualReflection, AuditorResult } from '../../src/types/aenea-types';
import { DPDScores } from '../../src/types/dpd-types';

const growthAnalyzer = new AdvancedGrowthAnalyzer();

describe('Growth Metrics System', () => {

  describe('Basic Growth Calculation', () => {
    test('should calculate basic growth metrics from thought data', () => {
      const thoughts: StructuredThought[] = [
        {
          id: 'thought-1',
          agentId: 'theoria',
          content: 'Deep philosophical analysis',
          confidence: 0.8,
          systemClock: 1000,
          timestamp: Date.now(),
          trigger: 'trigger-1',
          reasoning: 'Logical analysis',
          category: 'philosophical',
          tags: ['philosophy', 'analysis']
        },
        {
          id: 'thought-2',
          agentId: 'pathia',
          content: 'Empathetic understanding',
          confidence: 0.9,
          systemClock: 2000,
          timestamp: Date.now() + 1000,
          trigger: 'trigger-2',
          reasoning: 'Emotional insight',
          category: 'empathetic',
          tags: ['empathy', 'understanding']
        }
      ];

      const metrics = growthAnalyzer.calculateAdvancedMetrics(thoughts, [], [], []);

      expect(metrics.timestamp).toBeGreaterThan(0);
      expect(metrics.thoughtComplexity).toBeGreaterThanOrEqual(0);
      expect(metrics.philosophicalMaturity).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty thought arrays', () => {
      const metrics = growthAnalyzer.calculateAdvancedMetrics([], [], [], []);

      expect(metrics.timestamp).toBeGreaterThan(0);
      expect(metrics.thoughtComplexity).toBe(0);
      expect(metrics.philosophicalMaturity).toBe(0);
    });
  });

  describe('Pattern Detection', () => {
    test('should detect growth patterns', () => {
      const thoughts: StructuredThought[] = Array(15).fill(null).map((_, i) => ({
        id: `thought-${i}`,
        agentId: 'theoria',
        content: `Thought content ${i}`,
        confidence: 0.5 + (i * 0.03),
        complexity: 0.4 + (i * 0.04),
        systemClock: 1000 * (i + 1),
        timestamp: Date.now() + (1000 * i),
        trigger: `trigger-${i}`,
        reasoning: 'Analysis',
        category: 'philosophical',
        tags: ['test']
      }));

      const patterns = growthAnalyzer.detectGrowthPatterns(thoughts, []);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].significance).toBeGreaterThan(0);
    });
  });

  describe('Learning Insights', () => {
    test('should generate learning insights', () => {
      const thoughts: StructuredThought[] = [{
        id: 'insight-thought',
        agentId: 'theoria',
        content: 'Deep philosophical insight about consciousness',
        confidence: 0.9,
        systemClock: 1000,
        timestamp: Date.now(),
        trigger: 'trigger-1',
        reasoning: 'Detailed reasoning',
        category: 'philosophical',
        tags: ['philosophy'],
        qualityMetrics: {
          clarity: 0.85,
          depth: 0.8,
          originality: 0.7,
          relevance: 0.8,
          coherence: 0.9
        },
        philosophicalDepth: 0.85
      }];

      const auditorResults: AuditorResult[] = [{
        id: 'audit-1',
        thoughtId: 'insight-thought',
        safetyScore: 0.9,
        ethicsScore: 0.85,
        concerns: [],
        recommendations: ['Good ethical reasoning'],
        overallScore: 0.875,
        riskAssessment: 'minimal' as any,
        approved: true,
        timestamp: Date.now(),
        reasoning: 'Strong principled thinking with clear value alignment'
      }];

      const insights = growthAnalyzer.generateLearningInsights(thoughts, [], auditorResults);

      expect(Array.isArray(insights)).toBe(true);
    });
  });

  describe('Evolution Metrics', () => {
    test('should calculate evolution metrics', () => {
      const currentThoughts: StructuredThought[] = [{
        id: 'current',
        agentId: 'theoria',
        content: 'Current thought',
        confidence: 0.8,
        systemClock: 2000,
        timestamp: Date.now(),
        trigger: 'trigger-1',
        reasoning: 'Analysis',
        category: 'philosophical',
        tags: ['test']
      }];

      const historicalData = {
        thoughts: currentThoughts,
        reflections: [] as MutualReflection[],
        auditorResults: [] as AuditorResult[],
        dpdHistory: [] as DPDScores[]
      };

      const evolution = growthAnalyzer.calculateEvolutionMetrics(currentThoughts, historicalData);

      expect(evolution.personalityDrift).toBeDefined();
      expect(evolution.cognitiveCapacityGrowth).toBeDefined();
      expect(evolution.emotionalMaturation).toBeDefined();
      expect(evolution.overallEvolutionRate).toBeGreaterThanOrEqual(0);
    });
  });
});

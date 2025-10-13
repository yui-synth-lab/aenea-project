/**
 * Internal Trigger Generator Tests - t_wada Quality Tests
 * Tests for S0 stage trigger generation with dependency injection
 */

import { InternalTriggerGenerator } from '../../../src/aenea/core/internal-trigger';
import { QuestionCategory } from '../../../src/types/aenea-types';

// Mock dependencies
class MockDatabaseManager {
  private unresolvedIdeas: any[] = [];
  private significantThoughts: any[] = [];
  private coreBeliefs: any[] = [];
  private savedQuestions: any[] = [];
  private considerationUpdates: string[] = [];

  setUnresolvedIdeas(ideas: any[]) {
    this.unresolvedIdeas = ideas;
  }

  setSignificantThoughts(thoughts: any[]) {
    this.significantThoughts = thoughts;
  }

  setCoreBeliefs(beliefs: any[]) {
    this.coreBeliefs = beliefs;
  }

  getUnresolvedIdeas(limit: number) {
    return this.unresolvedIdeas.slice(0, limit);
  }

  getSignificantThoughts(limit: number) {
    return this.significantThoughts.slice(0, limit);
  }

  getCoreBeliefs(limit: number) {
    return this.coreBeliefs.slice(0, limit);
  }

  saveQuestion(trigger: any) {
    this.savedQuestions.push(trigger);
  }

  updateUnresolvedIdeaConsideration(id: string) {
    this.considerationUpdates.push(id);
  }

  getSavedQuestions() {
    return this.savedQuestions;
  }

  getConsiderationUpdates() {
    return this.considerationUpdates;
  }

  reset() {
    this.unresolvedIdeas = [];
    this.significantThoughts = [];
    this.coreBeliefs = [];
    this.savedQuestions = [];
    this.considerationUpdates = [];
  }
}

class MockQuestionCategorizer {
  private recommendedCategory: string = 'metacognitive';
  private categoryBalance: any[] = [];
  private recordedQuestions: any[] = [];

  setRecommendedCategory(category: string) {
    this.recommendedCategory = category;
  }

  setCategoryBalance(balance: any[]) {
    this.categoryBalance = balance;
  }

  getRecommendedCategory() {
    return this.recommendedCategory;
  }

  getCategoryBalance() {
    return this.categoryBalance;
  }

  categorizeQuestion(question: string) {
    return {
      primaryCategory: this.recommendedCategory,
      confidence: 0.8,
      metrics: {},
      semanticAnalysis: {}
    };
  }

  recordQuestion(question: string, category: string, metrics: any, semanticAnalysis: any, isFromDatabase: boolean, importance: number) {
    this.recordedQuestions.push({ question, category, metrics, semanticAnalysis, isFromDatabase, importance });
  }

  getRecordedQuestions() {
    return this.recordedQuestions;
  }

  reset() {
    this.recordedQuestions = [];
  }
}

class MockAIAgent {
  private shouldSucceed: boolean = true;
  private responseContent: string = '';

  setShouldSucceed(succeed: boolean) {
    this.shouldSucceed = succeed;
  }

  setResponseContent(content: string) {
    this.responseContent = content;
  }

  async execute(prompt: string, systemPrompt: string) {
    if (!this.shouldSucceed) {
      return { success: false, content: '' };
    }
    return { success: true, content: this.responseContent };
  }
}

describe('InternalTriggerGenerator', () => {
  let generator: InternalTriggerGenerator;
  let mockDb: MockDatabaseManager;
  let mockCategorizer: MockQuestionCategorizer;
  let mockAI: MockAIAgent;
  let emittedEvents: any[] = [];

  const mockConfig = {
    energy: {
      maxEnergy: 100,
      initialEnergy: 80,
      criticalThreshold: 20,
      lowThreshold: 50,
      dormancyThreshold: 10,
      regenRate: 0.1,
      dormancyRegenMultiplier: 2.0,
      energyConsumptionRates: {
        triggerGeneration: 1.0,
        randomGeneration: 10
      }
    }
  };

  beforeEach(() => {
    mockDb = new MockDatabaseManager();
    mockCategorizer = new MockQuestionCategorizer();
    mockAI = new MockAIAgent();
    emittedEvents = [];

    const emitEvent = (event: string, data: any) => {
      emittedEvents.push({ event, data });
    };

    generator = new InternalTriggerGenerator(
      mockConfig as any,
      mockDb as any,
      mockCategorizer as any,
      mockAI as any,
      emitEvent
    );
  });

  describe('Initialization', () => {
    test('should initialize with dependency injection', () => {
      expect(generator).toBeDefined();
    });

    test('should accept null AI agent for fallback mode', () => {
      const generatorWithoutAI = new InternalTriggerGenerator(
        mockConfig as any,
        mockDb as any,
        mockCategorizer as any,
        null,
        () => {}
      );
      expect(generatorWithoutAI).toBeDefined();
    });
  });

  describe('Manual Trigger Queue', () => {
    test('should process manual trigger first', async () => {
      const manualTrigger = {
        id: 'manual_123',
        timestamp: Date.now(),
        question: 'What is consciousness?',
        category: QuestionCategory.CONSCIOUSNESS,
        importance: 0.8,
        source: 'manual' as any
      };

      generator.setManualTrigger(manualTrigger);
      const trigger = await generator.generate();

      expect(trigger).toBeDefined();
      expect(trigger?.id).toBe('manual_123');
      expect(trigger?.source).toBe('manual');
    });

    test('should emit triggerGenerated event for manual trigger', async () => {
      const manualTrigger = {
        id: 'manual_456',
        timestamp: Date.now(),
        question: 'Test question',
        category: QuestionCategory.PHILOSOPHICAL,
        importance: 0.9,
        source: 'manual' as any
      };

      generator.setManualTrigger(manualTrigger);
      await generator.generate();

      expect(emittedEvents.length).toBeGreaterThan(0);
      const triggerEvent = emittedEvents.find(e => e.event === 'triggerGenerated');
      expect(triggerEvent).toBeDefined();
      expect(triggerEvent.data.source).toBe('manual');
    });

    test('should clear manual trigger after processing', async () => {
      const manualTrigger = {
        id: 'manual_789',
        timestamp: Date.now(),
        question: 'First question',
        category: QuestionCategory.ETHICAL,
        importance: 0.7,
        source: 'manual' as any
      };

      generator.setManualTrigger(manualTrigger);
      const first = await generator.generate();
      const second = await generator.generate();

      expect(first?.id).toBe('manual_789');
      expect(second?.id).not.toBe('manual_789'); // Should not repeat manual trigger
    });
  });

  describe('Database Selection', () => {
    test('should select from database when no history available', async () => {
      mockDb.setUnresolvedIdeas([
        { id: 'idea1', question: 'What is time?', category: 'temporal', importance: 0.6 }
      ]);
      mockCategorizer.setRecommendedCategory('temporal');

      const trigger = await generator.generate();

      expect(trigger).toBeDefined();
      expect(trigger?.source).toBe('database_unresolved');
      expect(mockDb.getSavedQuestions().length).toBe(1);
    });

    test('should apply category balance weighting', async () => {
      mockDb.setUnresolvedIdeas([
        { id: 'idea1', question: 'Question A', category: 'existential', importance: 0.5 },
        { id: 'idea2', question: 'Question B', category: 'metacognitive', importance: 0.5 }
      ]);
      mockCategorizer.setRecommendedCategory('metacognitive');
      mockCategorizer.setCategoryBalance([
        { category: 'metacognitive', isUnderused: true, isOverused: false },
        { category: 'existential', isUnderused: false, isOverused: true }
      ]);

      // Run multiple times to test weighting (should favor metacognitive)
      const results: { [key: string]: number } = {};
      for (let i = 0; i < 20; i++) {
        mockDb.reset();
        mockDb.setUnresolvedIdeas([
          { id: 'idea1', question: 'Question A', category: 'existential', importance: 0.5 },
          { id: 'idea2', question: 'Question B', category: 'metacognitive', importance: 0.5 }
        ]);
        const trigger = await generator.generate();
        if (trigger) {
          results[trigger.category] = (results[trigger.category] || 0) + 1;
        }
      }

      // Metacognitive should be selected more often (3x weight boost)
      expect(results['metacognitive']).toBeGreaterThan(results['existential'] || 0);
    });

    test('should record question in categorizer after selection', async () => {
      mockDb.setUnresolvedIdeas([
        { id: 'idea1', question: 'What is knowledge?', category: 'epistemological', importance: 0.7 }
      ]);
      mockCategorizer.setRecommendedCategory('epistemological');

      await generator.generate();

      const recorded = mockCategorizer.getRecordedQuestions();
      expect(recorded.length).toBe(1);
      expect(recorded[0].question).toBe('What is knowledge?');
      expect(recorded[0].category).toBe('epistemological');
    });

    test('should return null when database is empty', async () => {
      mockDb.setUnresolvedIdeas([]);

      const trigger = await generator.generate();

      expect(trigger).toBeNull();
    });
  });

  describe('AI Evolved Questions', () => {
    test('should generate evolved question when history available', async () => {
      mockDb.setUnresolvedIdeas([{ id: 'idea1', question: 'Old question', category: 'philosophical', importance: 0.5 }]);
      mockDb.setSignificantThoughts([{ thought_content: 'Deep thought', confidence: 0.8 }]);
      mockDb.setCoreBeliefs([{ belief_content: 'Core belief' }]);

      mockAI.setResponseContent('問い: What is the nature of reality?\nカテゴリ: ontological\n理由: Fundamental question');

      const trigger = await generator.generate();

      expect(trigger).toBeDefined();
      expect(trigger?.source).toBe('ai_evolved_from_history');
    });

    test('should fallback to template when AI fails', async () => {
      mockDb.setUnresolvedIdeas([{ id: 'idea1', question: 'Question', category: 'ethical', importance: 0.6 }]);
      mockDb.setSignificantThoughts([{ thought_content: 'Thought', confidence: 0.7 }]);

      mockAI.setShouldSucceed(false);

      const trigger = await generator.generate();

      expect(trigger).toBeDefined();
      expect(trigger?.source).toBe('template_evolved');
    });

    test('should parse AI response correctly', async () => {
      mockDb.setUnresolvedIdeas([{ id: 'idea1', question: 'Q', category: 'creative', importance: 0.5 }]);
      mockDb.setSignificantThoughts([{ thought_content: 'T', confidence: 0.6 }]);

      mockAI.setResponseContent('問い: 創造性の本質とは何か？\nカテゴリ: creative\n理由: 創造的思考の根本を問う');

      const trigger = await generator.generate();

      expect(trigger).toBeDefined();
      expect(trigger?.question).toBe('創造性の本質とは何か？');
      expect(trigger?.category).toBe('creative');
    });
  });

  describe('Generation Strategy', () => {
    test('should prioritize manual > evolved > database', async () => {
      // Setup all three options
      const manualTrigger = {
        id: 'manual_priority',
        timestamp: Date.now(),
        question: 'Manual',
        category: QuestionCategory.ETHICAL,
        importance: 0.8,
        source: 'manual' as any
      };
      mockDb.setUnresolvedIdeas([{ id: 'idea1', question: 'DB', category: 'philosophical', importance: 0.5 }]);
      mockDb.setSignificantThoughts([{ thought_content: 'Thought', confidence: 0.7 }]);
      mockAI.setResponseContent('問い: Evolved\nカテゴリ: existential\n理由: Test');

      generator.setManualTrigger(manualTrigger);
      const trigger = await generator.generate();

      // Should select manual first
      expect(trigger?.source).toBe('manual');
    });

    test('should use 70% probability for evolved questions', async () => {
      mockDb.setUnresolvedIdeas([{ id: 'idea1', question: 'DB Q', category: 'temporal', importance: 0.5 }]);
      mockDb.setSignificantThoughts([{ thought_content: 'Thought', confidence: 0.8 }]);
      mockAI.setResponseContent('問い: Evolved Q\nカテゴリ: paradoxical\n理由: Test');

      const results: { [key: string]: number } = { evolved: 0, database: 0 };

      // Run multiple times to test probability
      for (let i = 0; i < 50; i++) {
        mockDb.reset();
        mockDb.setUnresolvedIdeas([{ id: 'idea1', question: 'DB Q', category: 'temporal', importance: 0.5 }]);
        mockDb.setSignificantThoughts([{ thought_content: 'Thought', confidence: 0.8 }]);

        const trigger = await generator.generate();
        if (trigger?.source === 'ai_evolved_from_history' || trigger?.source === 'template_evolved') {
          results.evolved++;
        } else if (trigger?.source === 'database_unresolved') {
          results.database++;
        }
      }

      // Evolved should be more frequent (around 70%)
      const evolvedRatio = results.evolved / (results.evolved + results.database);
      expect(evolvedRatio).toBeGreaterThan(0.5); // At least 50% due to randomness
    });
  });

  describe('Event Emission', () => {
    test('should emit events for each generation type', async () => {
      mockDb.setUnresolvedIdeas([{ id: 'idea1', question: 'Q', category: 'ethical', importance: 0.5 }]);

      await generator.generate();

      const triggerEvents = emittedEvents.filter(e => e.event === 'triggerGenerated');
      expect(triggerEvents.length).toBeGreaterThan(0);
    });
  });
});

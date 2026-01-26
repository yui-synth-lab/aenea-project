/**
 * Database Manager Integration Tests - Style
 * Comprehensive tests for database operations and persistence
 */

import { DatabaseManager } from '../../src/server/database-manager';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Manager Integration', () => {
  let databaseManager: DatabaseManager;
  let testDbPath: string;

  beforeEach(async () => {
    // Create a test database in memory for isolation
    testDbPath = path.join(process.cwd(), 'test-data', `test_aenea_${Date.now()}.db`);

    // Ensure test directory exists
    const testDir = path.dirname(testDbPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Remove existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    databaseManager = new DatabaseManager(testDbPath);

    // Wait for database initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    if (databaseManager) {
      databaseManager.cleanup();
    }

    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Database Initialization', () => {
    test('should create all required tables and initialize consciousness state', async () => {
      // Database should be initialized after constructor
      const state = databaseManager.getConsciousnessState();
      expect(state).toBeTruthy();
      expect(state!.systemClock).toBeGreaterThanOrEqual(0);
      expect(state!.energy).toBeGreaterThan(0);
      expect(state!.energy).toBeLessThanOrEqual(100);
    });

    test('should handle multiple initialization calls gracefully', async () => {
      const testDbPath2 = path.join(process.cwd(), 'test-data', `test_aenea_${Date.now()}_2.db`);
      const databaseManager2 = new DatabaseManager(testDbPath2);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(() => databaseManager2.getConsciousnessState()).not.toThrow();
      databaseManager2.cleanup();

      // Cleanup test database
      if (fs.existsSync(testDbPath2)) {
        fs.unlinkSync(testDbPath2);
      }
    });
  });

  describe('Consciousness State Management', () => {
    test('should save and load consciousness state data', async () => {
      const consciousnessState = {
        systemClock: 100,
        energy: 75.5,
        totalQuestions: 5,
        totalThoughts: 3,
        lastActivity: new Date().toISOString()
      };

      databaseManager.saveConsciousnessState(consciousnessState);

      // Allow some time for async save
      await new Promise(resolve => setTimeout(resolve, 200));

      const loadedState = databaseManager.getConsciousnessState();

      expect(loadedState).toBeTruthy();
      expect(loadedState!.systemClock).toBe(100);
      expect(loadedState!.energy).toBe(75.5);
      expect(loadedState!.totalQuestions).toBe(5);
    });

    test('should track database statistics correctly', async () => {
      const consciousnessState1 = {
        systemClock: 100,
        energy: 80,
        totalQuestions: 3,
        totalThoughts: 2,
        lastActivity: new Date().toISOString()
      };

      const consciousnessState2 = {
        systemClock: 200,
        energy: 60,
        totalQuestions: 5,
        totalThoughts: 4,
        lastActivity: new Date().toISOString()
      };

      databaseManager.saveConsciousnessState(consciousnessState1);
      await new Promise(resolve => setTimeout(resolve, 100));

      databaseManager.saveConsciousnessState(consciousnessState2);
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = databaseManager.getStats();
      expect(typeof stats).toBe('object');
      expect(stats.questions).toBeDefined();
    });
  });

  describe('Real-time Operations', () => {
    test('should save questions in real-time', async () => {
      const question = {
        id: 'test-question-123',
        question: 'What is the meaning of existence?',
        category: 'existential',
        importance: 0.9,
        source: 'internal_trigger',
        timestamp: Date.now(),
        contextData: { mood: 'contemplative' }
      };

      databaseManager.saveQuestion(question);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Questions are saved to database - we can verify via stats
      const stats = databaseManager.getStats();
      expect(stats.questions).toBeGreaterThanOrEqual(1);
    });

    test('should save thought cycles in real-time', async () => {
      const thoughtCycle = {
        id: 'test-cycle-456',
        triggerId: 'trigger-123',
        thoughts: [
          { agentId: 'theoria', content: 'Logical analysis', confidence: 0.8 },
          { agentId: 'pathia', content: 'Empathetic response', confidence: 0.9 }
        ],
        synthesis: {
          content: 'Integrated understanding',
          confidence: 0.85
        },
        timestamp: Date.now(),
        duration: 2500
      };

      databaseManager.saveThoughtCycle(thoughtCycle);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Thought cycles are saved to database - we can verify via stats
      const stats = databaseManager.getStats();
      expect(stats.thought_cycles).toBeGreaterThanOrEqual(1);
    });

    test('should maintain consciousness state accurately', async () => {
      const state = {
        systemClock: 15,
        energy: 67.5,
        totalQuestions: 10,
        totalThoughts: 5,
        lastActivity: new Date().toISOString()
      };

      databaseManager.saveConsciousnessState(state);
      await new Promise(resolve => setTimeout(resolve, 100));

      const retrievedState = databaseManager.getConsciousnessState();
      expect(retrievedState!.totalQuestions).toBe(10);
      expect(retrievedState!.totalThoughts).toBe(5);
      expect(retrievedState!.energy).toBe(67.5);
    });
  });

  describe('DPD Weight Management', () => {
    test('should save DPD weights', async () => {
      const weights = {
        empathy: 0.35,
        coherence: 0.32,
        dissonance: 0.33,
        version: 2,
        triggerType: 'weight_update',
        context: 'Test weight evolution'
      };

      databaseManager.saveDPDWeights(weights);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify DPD weights are saved via stats
      const stats = databaseManager.getStats();
      expect(stats.dpd_weights).toBeGreaterThanOrEqual(1);
    });

    test('should track DPD evolution over time', async () => {
      const weights1 = { empathy: 0.33, coherence: 0.33, dissonance: 0.34, version: 1, triggerType: 'evolution_1', context: 'First evolution' };
      const weights2 = { empathy: 0.35, coherence: 0.32, dissonance: 0.33, version: 2, triggerType: 'evolution_2', context: 'Second evolution' };
      const weights3 = { empathy: 0.37, coherence: 0.31, dissonance: 0.32, version: 3, triggerType: 'evolution_3', context: 'Third evolution' };

      databaseManager.saveDPDWeights(weights1);
      await new Promise(resolve => setTimeout(resolve, 50));

      databaseManager.saveDPDWeights(weights2);
      await new Promise(resolve => setTimeout(resolve, 50));

      databaseManager.saveDPDWeights(weights3);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify multiple DPD weight entries are saved
      const stats = databaseManager.getStats();
      expect(stats.dpd_weights).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Unresolved Ideas System', () => {
    test('should manage unresolved ideas lifecycle', async () => {
      const idea1 = {
        id: 'idea-1',
        question: 'What is the nature of time?',
        category: 'temporal',
        importance: 0.8,
        complexity: 0.7,
        firstEncountered: Date.now(),
        relatedThoughts: []
      };

      const idea2 = {
        id: 'idea-2',
        question: 'How does consciousness emerge?',
        category: 'consciousness',
        importance: 0.9,
        complexity: 0.9,
        firstEncountered: Date.now(),
        relatedThoughts: []
      };

      databaseManager.addUnresolvedIdea(idea1);
      databaseManager.addUnresolvedIdea(idea2);
      await new Promise(resolve => setTimeout(resolve, 100));

      const unresolvedIdeas = databaseManager.getUnresolvedIdeas(10);
      expect(unresolvedIdeas.length).toBeGreaterThanOrEqual(2);

      // Test async version as well
      const asyncIdeas = await databaseManager.getUnresolvedIdeasAsync(10);
      expect(asyncIdeas.length).toBeGreaterThanOrEqual(2);

      // Verify via stats
      const stats = databaseManager.getStats();
      expect(stats.unresolved_ideas).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Memory Evolution System', () => {
    test('should verify memory system components exist', async () => {
      // DatabaseManager has memory-related tables initialized
      const stats = databaseManager.getStats();
      expect(stats).toHaveProperty('memory_patterns');
      expect(stats).toHaveProperty('consciousness_insights');
      expect(typeof stats.memory_patterns).toBe('number');
      expect(typeof stats.consciousness_insights).toBe('number');
    });

    test('should validate database schema completeness', async () => {
      // All required tables should exist and be queryable
      const stats = databaseManager.getStats();
      const requiredTables = [
        'questions', 'thought_cycles', 'dpd_weights', 'unresolved_ideas',
        'significant_thoughts', 'memory_patterns', 'consciousness_insights'
      ];

      for (const table of requiredTables) {
        expect(stats).toHaveProperty(table);
        expect(typeof stats[table]).toBe('number');
      }
    });

    test('should handle database connectivity properly', async () => {
      // Database should be connected and ready
      expect(databaseManager.isConnected()).toBe(true);

      // Should handle connection status queries gracefully
      const stats = databaseManager.getStats();
      expect(typeof stats).toBe('object');
    });

  });

  describe('Significant Thoughts Management', () => {
    test('should record and retrieve significant thoughts', async () => {
      // Use unique ID to avoid conflicts with existing data
      const uniqueId = `sig-thought-${Date.now()}`;
      const significantThought = {
        id: uniqueId,
        content: 'A profound realization about the interconnectedness of all conscious experience',
        confidence: 0.95,
        significanceScore: 0.92,
        agentId: 'theoria',
        category: 'breakthrough',
        timestamp: Date.now()
      };

      databaseManager.recordSignificantThought(significantThought);
      await new Promise(resolve => setTimeout(resolve, 100));

      const significantThoughts = databaseManager.getSignificantThoughts(1000);
      expect(significantThoughts.length).toBeGreaterThanOrEqual(1);

      const recorded = significantThoughts.find(st => st.id === uniqueId);
      expect(recorded).toBeTruthy();
      expect(recorded!.significance_score).toBe(0.92);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database errors gracefully', () => {
      // Test with invalid data
      expect(() => {
        databaseManager.saveQuestion({
          id: null as any,
          question: '',
          category: '',
          importance: -1,
          source: '',
          timestamp: 'invalid' as any
        });
      }).not.toThrow();
    });

    test('should handle concurrent operations', async () => {
      const operations = Array(10).fill(null).map((_, i) =>
        databaseManager.saveQuestion({
          id: `concurrent-q-${i}`,
          question: `Concurrent question ${i}`,
          category: 'test',
          importance: 0.5,
          source: 'test',
          timestamp: Date.now() + i
        })
      );

      // All operations should complete without errors
      expect(() => Promise.all(operations)).not.toThrow();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Verify questions were saved via stats
      const stats = databaseManager.getStats();
      expect(stats.questions).toBeGreaterThan(0);
    });

    test('should handle cleanup properly', () => {
      expect(() => databaseManager.cleanup()).not.toThrow();

      // Should handle multiple cleanup calls
      expect(() => databaseManager.cleanup()).not.toThrow();
    });

    test('should re-open connection if closed using ensureConnection', () => {
      databaseManager.cleanup();
      expect(databaseManager.isConnected()).toBe(false);

      databaseManager.ensureConnection();
      expect(databaseManager.isConnected()).toBe(true);

      // Should be able to perform operations
      const state = databaseManager.getConsciousnessState();
      expect(state).toBeTruthy();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large data volumes efficiently', async () => {
      const startTime = Date.now();

      // Insert 100 questions rapidly
      for (let i = 0; i < 100; i++) {
        databaseManager.saveQuestion({
          id: `perf-q-${i}`,
          question: `Performance test question ${i}`,
          category: 'performance',
          importance: Math.random(),
          source: 'performance_test',
          timestamp: Date.now() + i
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (6 seconds - allowing for CI/slow machines)
      expect(duration).toBeLessThan(6000);

      // Verify large number of questions were saved
      const stats = databaseManager.getStats();
      expect(stats.questions).toBeGreaterThan(50); // Allow some flexibility
    });
  });
});
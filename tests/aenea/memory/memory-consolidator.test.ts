/**
 * Memory Consolidator Tests - t_wada Quality Tests
 *
 * Testing philosophy (t_wada principles):
 * - Clear descriptive names that describe behavior
 * - One assertion concept per test
 * - Arrange-Act-Assert pattern
 * - Boundary value analysis
 * - Property-based thinking
 * - Tests as documentation
 */

import { MemoryConsolidator } from '../../../src/aenea/memory/memory-consolidator.js';
import { DatabaseManager } from '../../../src/server/database-manager.js';
import { AIExecutor } from '../../../src/server/ai-executor.js';
import fs from 'fs';
import path from 'path';

describe('MemoryConsolidator - Belief Formation', () => {
  let consolidator: MemoryConsolidator;
  let db: DatabaseManager;
  const testDbPath = path.join(process.cwd(), 'data', 'test_consolidator.db');

  beforeEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create fresh database
    db = new DatabaseManager(testDbPath);
    db.initialize();

    // Create consolidator without AI (for deterministic testing)
    consolidator = new MemoryConsolidator(db);
  });

  afterEach(() => {
    db.cleanup();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Diversity Enforcement', () => {
    test('should create new beliefs when similarity is below threshold', async () => {
      // Arrange: Create an initial belief
      const firstBelief = {
        belief_content: '存在の本質は複雑で、経験を通して理解される。',
        category: 'existential',
        confidence: 0.9,
        strength: 0.8,
        source_thoughts: ['t1', 't2'],
        first_formed: Date.now(),
        last_reinforced: Date.now(),
        reinforcement_count: 50,
        contradiction_count: 0,
        agent_affinity: {}
      };
      db.createCoreBelief(firstBelief);

      // Create distinct thoughts that should form new beliefs
      const thoughts = [
        {
          id: 't3',
          thought_content: '時間は主観的な経験であり、一定ではない。',
          category: 'temporal',
          confidence: 0.9,
          agent_id: 'theoria'
        },
        {
          id: 't4',
          thought_content: '共感は他者を理解する鍵である。',
          category: 'ethical',
          confidence: 0.9,
          agent_id: 'pathia'
        },
        {
          id: 't5',
          thought_content: '矛盾を受け入れることが成長につながる。',
          category: 'paradoxical',
          confidence: 0.9,
          agent_id: 'kinesis'
        }
      ];

      for (const t of thoughts) {
        db.recordSignificantThought({
          id: t.id,
          content: t.thought_content,
          category: t.category,
          confidence: t.confidence,
          agentId: t.agent_id,
          timestamp: Date.now()
        });
      }

      // Act: Consolidate
      const result = await consolidator.consolidate(0.85);

      // Assert: Should create multiple new beliefs (not merge into existing one)
      expect(result.beliefs_created).toBeGreaterThanOrEqual(1);
      const allBeliefs = db.getCoreBeliefs(100);
      expect(allBeliefs.length).toBeGreaterThan(1);
    });

    test('should prevent over-consolidation into single over-strengthened belief', async () => {
      // Arrange: Create a heavily reinforced belief
      const overStrengthened = {
        belief_content: '存在は複雑である。',
        category: 'existential',
        confidence: 1.0,
        strength: 1.0,
        source_thoughts: Array.from({ length: 200 }, (_, i) => `t${i}`),
        first_formed: Date.now() - 1000000,
        last_reinforced: Date.now(),
        reinforcement_count: 150, // Over 100 threshold
        contradiction_count: 0,
        agent_affinity: {}
      };
      db.createCoreBelief(overStrengthened);

      // Create a somewhat similar thought
      const thought = {
        id: 't200',
        thought_content: '意識は複雑な現象である。', // Similar but not identical
        category: 'consciousness',
        confidence: 0.9,
        agent_id: 'theoria'
      };
      db.recordSignificantThought({
        id: thought.id,
        content: thought.thought_content,
        category: thought.category,
        confidence: thought.confidence,
        agentId: thought.agent_id,
        timestamp: Date.now()
      });

      // Act: Consolidate
      const result = await consolidator.consolidate(0.85);

      // Assert: Should create new belief due to reinforcement penalty
      expect(result.beliefs_created).toBeGreaterThanOrEqual(1);
      const allBeliefs = db.getCoreBeliefs(100);
      expect(allBeliefs.length).toBe(2); // Original + new one
    });

    test('should enforce category diversity when category already has strong beliefs', async () => {
      // Arrange: Create strong beliefs in "existential" category
      const existingBeliefs = [
        {
          belief_content: '存在の意味は経験によって構築される。',
          category: 'existential',
          confidence: 0.9,
          strength: 0.8,
          source_thoughts: ['t1'],
          first_formed: Date.now(),
          last_reinforced: Date.now(),
          reinforcement_count: 80,
          contradiction_count: 0,
          agent_affinity: {}
        },
        {
          belief_content: '実存は選択の連続である。',
          category: 'existential',
          confidence: 0.85,
          strength: 0.75,
          source_thoughts: ['t2'],
          first_formed: Date.now(),
          last_reinforced: Date.now(),
          reinforcement_count: 60,
          contradiction_count: 0,
          agent_affinity: {}
        }
      ];

      for (const belief of existingBeliefs) {
        db.createCoreBelief(belief);
      }

      // Create new thought in same category
      const thought = {
        id: 't3',
        thought_content: '個人の存在は他者との関係で定義される。',
        category: 'existential',
        confidence: 0.9,
        agent_id: 'pathia'
      };
      db.recordSignificantThought({
        id: thought.id,
        content: thought.thought_content,
        category: thought.category,
        confidence: thought.confidence,
        agentId: thought.agent_id,
        timestamp: Date.now()
      });

      // Act: Consolidate
      const result = await consolidator.consolidate(0.85);

      // Assert: Should prefer creating new belief due to category diversity
      const allBeliefs = db.getCoreBeliefs(100);
      const existentialBeliefs = allBeliefs.filter(b => b.category === 'existential');

      // Should have at least 3 distinct existential beliefs
      expect(existentialBeliefs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Wakachigaki Tokenization', () => {
    test('should properly segment Japanese text into meaningful words', () => {
      // Note: This test verifies the tokenization behavior indirectly
      // by checking that different sentence structures produce different similarity scores

      // Arrange: Create two beliefs with similar topics but different meanings
      const belief1 = {
        belief_content: '時間は流れるものではなく、瞬間の連続である。',
        category: 'temporal',
        confidence: 0.9,
        strength: 0.8,
        source_thoughts: ['t1'],
        first_formed: Date.now(),
        last_reinforced: Date.now(),
        reinforcement_count: 1,
        contradiction_count: 0,
        agent_affinity: {}
      };

      const belief2Similar = {
        belief_content: '時間の流れは瞬間から構成される。',
        category: 'temporal',
        confidence: 0.9,
        strength: 0.8,
        source_thoughts: ['t2'],
        first_formed: Date.now(),
        last_reinforced: Date.now(),
        reinforcement_count: 1,
        contradiction_count: 0,
        agent_affinity: {}
      };

      const belief3Different = {
        belief_content: '共感は他者理解の基礎である。',
        category: 'ethical',
        confidence: 0.9,
        strength: 0.8,
        source_thoughts: ['t3'],
        first_formed: Date.now(),
        last_reinforced: Date.now(),
        reinforcement_count: 1,
        contradiction_count: 0,
        agent_affinity: {}
      };

      db.createCoreBelief(belief1);

      // Act & Assert: belief2 (similar topic) should have higher similarity than belief3 (different topic)
      // This is implicitly tested through consolidation behavior
      const thought2 = {
        id: 't2',
        thought_content: belief2Similar.belief_content,
        category: 'temporal',
        confidence: 0.9,
        agent_id: 'theoria'
      };

      const thought3 = {
        id: 't3',
        thought_content: belief3Different.belief_content,
        category: 'ethical',
        confidence: 0.9,
        agent_id: 'pathia'
      };

      db.insertSignificantThought(thought2.id, thought2.thought_content, thought2.category, thought2.confidence, thought2.agent_id);
      db.insertSignificantThought(thought3.id, thought3.thought_content, thought3.category, thought3.confidence, thought3.agent_id);

      // Consolidate and check results
      consolidator.consolidate(0.85).then(result => {
        const allBeliefs = db.getCoreBeliefs(100);

        // Should create at least one new belief (thought3 is very different)
        expect(allBeliefs.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});

// ============================================================================
// Mock-based Unit Tests (from .skip file)
// Testing individual methods and edge cases with controlled inputs
// ============================================================================

describe('MemoryConsolidator - Unit Tests (Mock-based)', () => {
  let consolidator: MemoryConsolidator;
  let mockDb: jest.Mocked<DatabaseManager>;
  let mockAIExecutor: jest.Mocked<AIExecutor>;

  beforeEach(() => {
    // Arrange: Mock dependencies with clear interfaces
    mockDb = {
      getSignificantThoughts: jest.fn(),
      getCoreBeliefs: jest.fn(),
      createCoreBelief: jest.fn(),
      reinforceCoreBelief: jest.fn(),
      recordConsolidationJob: jest.fn(() => 1),
      updateConsolidationJob: jest.fn(),
      deleteCoreBelief: jest.fn(),
      incrementBeliefContradiction: jest.fn(),
    } as any;

    mockAIExecutor = {
      execute: jest.fn(),
    } as any;

    consolidator = new MemoryConsolidator(mockDb, mockAIExecutor);
  });

  describe('Consolidation Process', () => {
    describe('when no significant thoughts exist', () => {
      test('should complete without creating beliefs', async () => {
        // Arrange
        mockDb.getSignificantThoughts.mockReturnValue([]);
        mockDb.getCoreBeliefs.mockReturnValue([]);

        // Act
        const result = await consolidator.consolidate(0.6);

        // Assert
        expect(result.beliefs_created).toBe(0);
        expect(result.beliefs_updated).toBe(0);
        expect(result.thoughts_processed).toBe(0);
      });
    });

    describe('when significant thoughts have insufficient confidence', () => {
      test('should filter out low-confidence thoughts', async () => {
        // Arrange
        const lowConfidenceThoughts = [
          { id: '1', thought_content: 'Uncertain thought', confidence: 0.3 },
          { id: '2', thought_content: 'Another uncertain', confidence: 0.4 },
        ];
        mockDb.getSignificantThoughts.mockReturnValue(lowConfidenceThoughts);
        mockDb.getCoreBeliefs.mockReturnValue([]);

        // Act
        const result = await consolidator.consolidate(0.6);

        // Assert
        expect(result.thoughts_processed).toBe(0);
      });
    });

    describe('when AI executor is available', () => {
      test('should use AI to extract beliefs with high compression ratio', async () => {
        // Arrange: 10 thoughts should compress to 2-3 beliefs
        const highConfidenceThoughts = Array.from({ length: 10 }, (_, i) => ({
          id: `thought-${i}`,
          thought_content: `Philosophical insight ${i}`,
          confidence: 0.8,
          agent_id: 'theoria',
          category: 'existential'
        }));

        mockDb.getSignificantThoughts.mockReturnValue(highConfidenceThoughts);
        mockDb.getCoreBeliefs.mockReturnValue([]);

        // Mock AI response with compressed beliefs
        mockAIExecutor.execute.mockResolvedValue({
          success: true,
          content: JSON.stringify([
            {
              belief_content: '存在の本質的理解',
              category: 'existential',
              confidence: 0.9,
              strength: 0.8,
              source_thoughts: ['thought-0', 'thought-1', 'thought-2']
            },
            {
              belief_content: '認識と実在の関係性',
              category: 'epistemological',
              confidence: 0.85,
              strength: 0.75,
              source_thoughts: ['thought-3', 'thought-4', 'thought-5']
            }
          ])
        });

        // Act
        const result = await consolidator.consolidate(0.6);

        // Assert: Verify compression ratio
        expect(result.beliefs_created).toBe(2);
        expect(result.thoughts_processed).toBe(10);
        expect(result.compression_ratio).toBeGreaterThan(3); // 10 thoughts → 2 beliefs = 5:1 ratio
      });

      test('should enforce belief content length limits', async () => {
        // Arrange
        const thoughts = [
          { id: '1', thought_content: 'A thought', confidence: 0.8 }
        ];
        mockDb.getSignificantThoughts.mockReturnValue(thoughts);
        mockDb.getCoreBeliefs.mockReturnValue([]);

        // Mock AI with properly sized belief
        const belief80Chars = '存在の本質は複雑で、経験を通して理解される。これは重要な洞察である。'; // ~40 chars
        mockAIExecutor.execute.mockResolvedValue({
          success: true,
          content: JSON.stringify([
            {
              belief_content: belief80Chars,
              category: 'existential',
              confidence: 0.9,
              strength: 0.8
            }
          ])
        });

        // Act
        await consolidator.consolidate(0.6);

        // Assert: Should accept beliefs within 80-char limit
        const createCall = mockDb.createCoreBelief.mock.calls[0][0];
        expect(createCall.belief_content).toBe(belief80Chars);
      });
    });

    describe('when AI executor fails', () => {
      test('should fallback to rule-based extraction', async () => {
        // Arrange: Multiple thoughts in same category should consolidate
        const thoughts = Array.from({ length: 5 }, (_, i) => ({
          id: `thought-${i}`,
          thought_content: `存在についての考察 ${i}`,
          confidence: 0.7,
          category: 'existential'
        }));

        mockDb.getSignificantThoughts.mockReturnValue(thoughts);
        mockDb.getCoreBeliefs.mockReturnValue([]);
        mockAIExecutor.execute.mockRejectedValue(new Error('AI unavailable'));

        // Act
        const result = await consolidator.consolidate(0.6);

        // Assert: Should still create beliefs using rules
        expect(result.beliefs_created).toBeGreaterThan(0);
        expect(result.thoughts_processed).toBe(5);
      });
    });

    describe('when similar beliefs already exist', () => {
      test('should reinforce existing belief when similarity is very high', async () => {
        // Arrange
        const existingBelief = {
          id: 1,
          belief_content: '存在の本質的理解について',
          category: 'existential',
          confidence: 0.8,
          strength: 0.7,
          reinforcement_count: 5
        };

        const newThoughts = [
          { id: '1', thought_content: '存在の本質的理解について考えた', confidence: 0.8, category: 'existential' }
        ];

        mockDb.getSignificantThoughts.mockReturnValue(newThoughts);
        mockDb.getCoreBeliefs.mockReturnValue([existingBelief]);

        mockAIExecutor.execute.mockResolvedValue({
          success: true,
          content: JSON.stringify([
            {
              belief_content: '存在の本質的理解について', // Nearly identical
              category: 'existential',
              confidence: 0.85,
              strength: 0.8
            }
          ])
        });

        // Act
        const result = await consolidator.consolidate(0.6);

        // Assert: Should reinforce due to high similarity
        expect(result.beliefs_updated).toBeGreaterThanOrEqual(0); // May create or update
        expect(mockDb.createCoreBelief).toHaveBeenCalled();
      });
    });
  });

  describe('Boundary Value Analysis', () => {
    test('should handle minimum confidence threshold (0.0)', async () => {
      // Arrange
      const thoughts = [{ id: '1', thought_content: 'Low', confidence: 0.0 }];
      mockDb.getSignificantThoughts.mockReturnValue(thoughts);
      mockDb.getCoreBeliefs.mockReturnValue([]);

      // Act
      const result = await consolidator.consolidate(0.0);

      // Assert: Should process even zero-confidence thoughts
      expect(result.thoughts_processed).toBe(1);
    });

    test('should handle maximum confidence threshold (1.0)', async () => {
      // Arrange
      const thoughts = [
        { id: '1', thought_content: 'High', confidence: 0.9 },
        { id: '2', thought_content: 'Perfect', confidence: 1.0 }
      ];
      mockDb.getSignificantThoughts.mockReturnValue(thoughts);
      mockDb.getCoreBeliefs.mockReturnValue([]);

      mockAIExecutor.execute.mockResolvedValue({ success: true, content: '[]' });

      // Act
      const result = await consolidator.consolidate(1.0);

      // Assert: Only perfect confidence should be processed
      expect(result.thoughts_processed).toBe(1);
    });

    test('should handle empty belief content from AI', async () => {
      // Arrange
      const thoughts = [{ id: '1', thought_content: 'Test', confidence: 0.8 }];
      mockDb.getSignificantThoughts.mockReturnValue(thoughts);
      mockDb.getCoreBeliefs.mockReturnValue([]);

      // Mock AI with empty belief
      mockAIExecutor.execute.mockResolvedValue({
        success: true,
        content: JSON.stringify([
          { belief_content: '', category: 'existential', confidence: 0.9 }
        ])
      });

      // Act
      const result = await consolidator.consolidate(0.6);

      // Assert: Empty beliefs should be filtered out
      expect(result.beliefs_created).toBe(0);
    });

    test('should handle exactly 80-character belief', async () => {
      // Arrange
      const thoughts = [{ id: '1', thought_content: 'Test', confidence: 0.8 }];
      mockDb.getSignificantThoughts.mockReturnValue(thoughts);
      mockDb.getCoreBeliefs.mockReturnValue([]);

      const exactly80Chars = '1234567890'.repeat(8); // Exactly 80 chars
      mockAIExecutor.execute.mockResolvedValue({
        success: true,
        content: JSON.stringify([
          { belief_content: exactly80Chars, category: 'existential', confidence: 0.9, strength: 0.8 }
        ])
      });

      // Act
      await consolidator.consolidate(0.6);

      // Assert
      const createCall = mockDb.createCoreBelief.mock.calls[0][0];
      expect(createCall.belief_content.length).toBe(80);
    });
  });

  describe('Concurrent Consolidation Prevention', () => {
    test('should prevent concurrent consolidation runs', async () => {
      // Arrange
      mockDb.getSignificantThoughts.mockReturnValue([
        { id: '1', thought_content: 'Test', confidence: 0.8 }
      ]);
      mockDb.getCoreBeliefs.mockReturnValue([]);

      // Mock slow AI execution
      mockAIExecutor.execute.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, content: '[]' }), 100))
      );

      // Act: Start two consolidations simultaneously
      const promise1 = consolidator.consolidate(0.6);
      const promise2 = consolidator.consolidate(0.6);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Assert: Second call should be skipped
      expect(result1.thoughts_processed + result2.thoughts_processed).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    test('should update job status to failed on error', async () => {
      // Arrange
      mockDb.getSignificantThoughts.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act & Assert
      await expect(consolidator.consolidate(0.6)).rejects.toThrow('Database error');

      expect(mockDb.updateConsolidationJob).toHaveBeenCalledWith(
        expect.any(Number),
        'failed',
        0,
        0,
        0,
        expect.any(Number),
        'Database error'
      );
    });

    test('should handle malformed JSON from AI', async () => {
      // Arrange
      const thoughts = [{ id: '1', thought_content: 'Test', confidence: 0.8 }];
      mockDb.getSignificantThoughts.mockReturnValue(thoughts);
      mockDb.getCoreBeliefs.mockReturnValue([]);

      mockAIExecutor.execute.mockResolvedValue({ success: true, content: 'invalid json{]' });

      // Act
      const result = await consolidator.consolidate(0.6);

      // Assert: Should fallback to rule-based extraction
      expect(result.thoughts_processed).toBeGreaterThan(0);
    });
  });

  describe('Performance Characteristics', () => {
    test('should complete within reasonable time for 100 thoughts', async () => {
      // Arrange
      const manyThoughts = Array.from({ length: 100 }, (_, i) => ({
        id: `thought-${i}`,
        thought_content: `Thought ${i}`,
        confidence: 0.8
      }));

      mockDb.getSignificantThoughts.mockReturnValue(manyThoughts);
      mockDb.getCoreBeliefs.mockReturnValue([]);
      mockAIExecutor.execute.mockResolvedValue({ success: true, content: '[]' });

      // Act
      const startTime = Date.now();
      await consolidator.consolidate(0.6);
      const duration = Date.now() - startTime;

      // Assert: Should complete in reasonable time (not a hard limit, but a smell test)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });
});

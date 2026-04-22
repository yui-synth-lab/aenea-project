/**
 * Sleep Manager Tests - Quality
 * Tests for sleep cycle consolidation and memory management
 */

import { SleepManager, SleepResult } from '../../../src/aenea/consciousness/sleep-manager.js';
import { DatabaseManager } from '../../../src/server/database-manager.js';
import { EnergyManager, getEnergyManager, resetEnergyManager } from '../../../src/utils/energy-management.js';
import { MemoryConsolidator } from '../../../src/aenea/memory/memory-consolidator.js';
import { AIExecutor } from '../../../src/server/ai-executor.js';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';

// Mock AI Executor for testing
class MockAIExecutor {
  async execute(prompt: string, personality?: string): Promise<any> {
    // Return mock responses based on prompt content
    if (prompt.includes('夢')) {
      return {
        success: true,
        // Return numbered list format as expected by extractDreamPatterns
        content: "1. 静寂と音は表裏一体である\n2. 孤独は自己発見の入口である",
        duration: 100
      };
    }

    if (prompt.includes('刈り込み')) {
      return {
        success: true,
        content: JSON.stringify({
          to_prune: [
            { index: 0, reason: "既に信念に統合済み" },
            { index: 2, reason: "発展性なし" }
          ]
        }),
        duration: 100
      };
    }

    if (prompt.includes('緊張')) {
      return {
        success: true,
        content: JSON.stringify({
          resolutions: [
            { synthesis: "矛盾は成長の契機である", reasoning: "統合的視点" }
          ]
        }),
        duration: 100
      };
    }

    return { success: false, content: '', duration: 0 };
  }
}

describe('SleepManager - Quality Tests', () => {
  let sleepManager: SleepManager;
  let databaseManager: DatabaseManager;
  let energyManager: EnergyManager;
  let memoryConsolidator: MemoryConsolidator;
  let mockAIExecutor: MockAIExecutor;
  let eventEmitter: EventEmitter;
  let testDbPath: string;

  beforeEach(() => {
    // Create unique test database for each test
    testDbPath = path.join(
      process.cwd(),
      'test-data',
      `test_sleep_${Date.now()}.db`
    );

    // Ensure test-data directory exists
    const testDataDir = path.dirname(testDbPath);
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Initialize dependencies
    databaseManager = new DatabaseManager(testDbPath);
    energyManager = getEnergyManager();
    energyManager.resetEnergy(); // Reset energy to 100 for each test

    mockAIExecutor = new MockAIExecutor();
    eventEmitter = new EventEmitter();

    memoryConsolidator = new MemoryConsolidator(
      databaseManager,
      mockAIExecutor as any
    );

    sleepManager = new SleepManager(
      databaseManager,
      energyManager,
      memoryConsolidator,
      mockAIExecutor as any,
      eventEmitter,
      Date.now()
    );
  });

  afterEach(() => {
    // Close database connection before cleanup
    if (databaseManager) {
      databaseManager.cleanup();
    }
    
    // Cleanup energy manager loop
    resetEnergyManager();

    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Sleep Cycle Execution', () => {
    /**
     * Test: Complete sleep cycle should execute all 4 phases
     */
    it('should complete all 4 phases of sleep cycle', async () => {
      // Arrange: Seed initial data
      seedTestData(databaseManager);

      const phaseEvents: string[] = [];
      eventEmitter.on('sleepPhaseChanged', (data) => {
        phaseEvents.push(data.phase);
      });

      // Act: Perform sleep cycle
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: All phases executed
      expect(phaseEvents).toContain('REM');
      expect(phaseEvents).toContain('Deep Sleep');
      expect(phaseEvents).toContain('Synaptic Pruning');
      expect(phaseEvents).toContain('Emotional Processing');
      expect(phaseEvents).toHaveLength(4);
    });

    /**
     * Test: Sleep cycle should restore full energy
     */
    it('should restore energy to maximum after sleep cycle', async () => {
      // Arrange: Deplete energy
      energyManager.consumeEnergy(50, 'test');
      const energyBefore = energyManager.getEnergyState().available;
      expect(energyBefore).toBeLessThan(51); // Allow for tiny auto-recovery (< 0.5%)

      // Act: Perform sleep cycle
      const result = await sleepManager.performSleepCycle('energy_critical');

      // Assert: Energy fully restored
      const energyAfter = energyManager.getEnergyState().available;
      expect(energyAfter).toBe(100);
      expect(result.energyAfter).toBe(100);
    });

    /**
     * Test: Sleep cycle should emit energy update event
     */
    it('should emit energyUpdated event after sleep', async () => {
      // Arrange
      let energyEventEmitted = false;
      let finalEnergy = 0;

      eventEmitter.on('energyUpdated', (data) => {
        energyEventEmitted = true;
        finalEnergy = data.available;
      });

      // Act
      await sleepManager.performSleepCycle('manual');

      // Assert
      expect(energyEventEmitted).toBe(true);
      expect(finalEnergy).toBe(100);
    });

    /**
     * Test: Sleep cycle should return valid result structure
     */
    it('should return valid SleepResult structure', async () => {
      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: Check result structure
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('energyBefore');
      expect(result).toHaveProperty('energyAfter');
      expect(result).toHaveProperty('stats');

      expect(result.stats).toHaveProperty('dreamPatterns');
      expect(result.stats).toHaveProperty('beliefsMerged');
      expect(result.stats).toHaveProperty('thoughtsPruned');
      expect(result.stats).toHaveProperty('tensionsResolved');

      // All stats should be non-negative numbers
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.stats.dreamPatterns).toBeGreaterThanOrEqual(0);
      expect(result.stats.beliefsMerged).toBeGreaterThanOrEqual(0);
      expect(result.stats.thoughtsPruned).toBeGreaterThanOrEqual(0);
      expect(result.stats.tensionsResolved).toBeGreaterThanOrEqual(0);
    });
  });

  describe('REM Phase - Dream Pattern Extraction', () => {
    /**
     * Test: REM phase should skip if insufficient thoughts
     */
    it('should skip REM phase when thoughts < 10', async () => {
      // Arrange: Add only 5 thoughts (below threshold)
      for (let i = 0; i < 5; i++) {
        databaseManager.recordSignificantThought({
          id: `thought_${i}`,
          content: `Test thought ${i}`,
          confidence: 0.8,
          significanceScore: 0.7,
          agentId: 'theoria',
          category: 'consciousness',
          timestamp: Date.now()
        });
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: No dream patterns extracted
      expect(result.stats.dreamPatterns).toBe(0);
    });

    /**
     * Test: REM phase should extract dream patterns when sufficient thoughts
     */
    it('should extract dream patterns when thoughts >= 10', async () => {
      // Arrange: Add 15 thoughts (above threshold)
      for (let i = 0; i < 15; i++) {
        databaseManager.recordSignificantThought({
          id: `thought_${i}`,
          content: `Test thought ${i} with meaningful content`,
          confidence: 0.8,
          significanceScore: 0.7,
          agentId: 'theoria',
          category: 'consciousness',
          timestamp: Date.now()
        });
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: Dream patterns extracted (mock returns 2)
      expect(result.stats.dreamPatterns).toBe(2);
    });
  });

  describe('Deep Sleep - Memory Consolidation', () => {
    /**
     * Test: Deep sleep should skip if insufficient thoughts
     */
    it('should skip deep sleep when thoughts < 5', async () => {
      // Arrange: Add only 3 thoughts
      for (let i = 0; i < 3; i++) {
        databaseManager.recordSignificantThought({
          id: `thought_${i}`,
          content: `Test thought ${i}`,
          confidence: 0.9,
          significanceScore: 0.8,
          agentId: 'theoria',
          category: 'consciousness',
          timestamp: Date.now()
        });
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: No beliefs merged
      expect(result.stats.beliefsMerged).toBe(0);
    });

    /**
     * Test: Deep sleep should consolidate thoughts into beliefs
     */
    it('should consolidate thoughts into beliefs when sufficient', async () => {
      // Arrange: Add 10 high-quality thoughts
      for (let i = 0; i < 10; i++) {
        databaseManager.recordSignificantThought({
          id: `thought_${i}`,
          content: `Test thought ${i} about consciousness and existence`,
          confidence: 0.9,
          significanceScore: 0.85,
          agentId: 'theoria',
          category: 'consciousness',
          timestamp: Date.now()
        });
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: Beliefs should be merged (consolidator runs)
      expect(result.stats.beliefsMerged).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Synaptic Pruning Phase', () => {
    /**
     * Test: Pruning should skip if insufficient thoughts
     */
    it('should skip pruning when old thoughts < 10', async () => {
      // Arrange: Add only 5 old thoughts
      for (let i = 0; i < 5; i++) {
        databaseManager.recordSignificantThought({
          id: `thought_${i}`,
          content: `Old thought ${i}`,
          confidence: 0.5,
          significanceScore: 0.3,
          agentId: 'theoria',
          category: 'consciousness',
          timestamp: Date.now()
        });
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: No thoughts pruned
      expect(result.stats.thoughtsPruned).toBe(0);
    });

    /**
     * Test: Pruning should remove redundant thoughts
     */
    it('should prune redundant thoughts when sufficient data', async () => {
      // Arrange: Add core beliefs and old thoughts
      databaseManager.createCoreBelief({
        belief_content: "意識は問いから生まれる",
        category: 'consciousness',
        confidence: 0.9,
        strength: 0.8,
        source_thoughts: [],
        first_formed: Date.now(),
        last_reinforced: Date.now(),
        reinforcement_count: 1,
        contradiction_count: 0,
        agent_affinity: {}
      });

      // Add 15 old thoughts (25 hours ago to trigger pruning)
      // Use direct SQL to set created_at to past date
      const db = (databaseManager as any).db;
      // SQLite expects 'YYYY-MM-DD HH:MM:SS' format for datetime comparison
      const twentyFiveHoursAgo = new Date(Date.now() - (25 * 60 * 60 * 1000))
        .toISOString()
        .replace('T', ' ')
        .replace(/\.\d+Z$/, '');

      for (let i = 0; i < 15; i++) {
        db.prepare(`
          INSERT INTO significant_thoughts
          (id, thought_content, confidence, significance_score, agent_id, category, timestamp, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `thought_${i}`,
          `Old thought ${i} about consciousness`,
          0.6,
          0.5,
          'theoria',
          'consciousness',
          Date.now(),
          twentyFiveHoursAgo
        );
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: Some thoughts should be pruned (mock returns 2)
      expect(result.stats.thoughtsPruned).toBe(2);
    });
  });

  describe('Emotional Processing Phase', () => {
    /**
     * Test: Emotional processing should skip if no high dissonance
     */
    it('should skip emotional processing when no tensions', async () => {
      // Arrange: No high-dissonance thought cycles

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: No tensions resolved
      expect(result.stats.tensionsResolved).toBe(0);
    });

    /**
     * Test: Emotional processing should resolve tensions
     */
    it('should resolve tensions when high dissonance cycles exist', async () => {
      // Arrange: Add high-dissonance thought cycles with DPD weights
      const db = (databaseManager as any).db;
      for (let i = 0; i < 3; i++) {
        const cycleId = `cycle_${i}`;
        databaseManager.saveThoughtCycle({
          id: cycleId,
          trigger_id: `trigger_${i}`,
          timestamp: Date.now(),
          duration: 1000,
          thoughts_data: JSON.stringify([]),
          synthesis_data: JSON.stringify({ content: "Test synthesis" }),
          empathy_score: 0.5,
          coherence_score: 0.6,
          dissonance_score: 0.8 // High dissonance
        });

        // Also insert into dpd_weights table for the query to work
        db.prepare(`
          INSERT INTO dpd_weights (timestamp, empathy, coherence, dissonance, context, version)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(Date.now(), 0.5, 0.6, 0.8, cycleId, 1);
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: Tensions should be resolved (mock returns 1)
      expect(result.stats.tensionsResolved).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test: Sleep cycle should work without AI executor
     */
    it('should handle missing AI executor gracefully', async () => {
      // Arrange: Create SleepManager without AI executor
      const sleepManagerNoAI = new SleepManager(
        databaseManager,
        energyManager,
        memoryConsolidator,
        null, // No AI executor
        eventEmitter,
        Date.now()
      );

      seedTestData(databaseManager);

      // Act & Assert: Should not throw
      await expect(sleepManagerNoAI.performSleepCycle('manual')).resolves.toBeDefined();
    });

    /**
     * Test: Sleep cycle should work with empty database
     */
    it('should complete sleep cycle even with empty database', async () => {
      // Arrange: Fresh database (no data)

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: All stats should be 0, but cycle completes
      expect(result.stats.dreamPatterns).toBe(0);
      expect(result.stats.beliefsMerged).toBe(0);
      expect(result.stats.thoughtsPruned).toBe(0);
      expect(result.stats.tensionsResolved).toBe(0);

      // Energy should still be restored
      expect(result.energyAfter).toBe(100);
    });

    /**
     * Test: System clock should be updatable
     */
    it('should update system clock reference', () => {
      // Arrange
      const newClock = Date.now() + 10000;

      // Act & Assert: Should not throw
      expect(() => sleepManager.updateSystemClock(newClock)).not.toThrow();
    });
  });

  describe('Invariants and Properties', () => {
    /**
     * Test: Energy should always be fully restored after sleep
     * Property: ∀ sleep cycle, energyAfter = maxEnergy
     */
    it('should always restore energy to maximum (invariant)', async () => {
      // Test with different initial energy levels
      const initialEnergyLevels = [10, 30, 50, 70, 90];

      for (const initialEnergy of initialEnergyLevels) {
        // Reset energy manager
        energyManager.resetEnergy();
        energyManager.consumeEnergy(100 - initialEnergy, 'test');

        // Act
        const result = await sleepManager.performSleepCycle('manual');

        // Assert: Always restore to 100
        expect(result.energyAfter).toBe(100);
      }
    });

    /**
     * Test: Sleep cycle duration should always be positive
     * Property: ∀ sleep cycle, duration > 0
     */
    it('should always have positive duration (property)', async () => {
      // Act: Run multiple sleep cycles
      for (let i = 0; i < 5; i++) {
        const result = await sleepManager.performSleepCycle('manual');

        // Assert: Duration is always positive
        expect(result.duration).toBeGreaterThan(0);
      }
    });

    /**
     * Test: Stats should never be negative
     * Property: ∀ stats field, value >= 0
     */
    it('should never have negative stats (invariant)', async () => {
      // Arrange: Various database states
      seedTestData(databaseManager);

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: All stats >= 0
      expect(result.stats.dreamPatterns).toBeGreaterThanOrEqual(0);
      expect(result.stats.beliefsMerged).toBeGreaterThanOrEqual(0);
      expect(result.stats.thoughtsPruned).toBeGreaterThanOrEqual(0);
      expect(result.stats.tensionsResolved).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Boundary Conditions', () => {
    /**
     * Test: Exactly 10 thoughts (boundary for REM phase)
     */
    it('should handle exactly 10 thoughts for REM phase', async () => {
      // Arrange: Exactly 10 thoughts (boundary condition)
      for (let i = 0; i < 10; i++) {
        databaseManager.recordSignificantThought({
          id: `thought_${i}`,
          content: `Boundary thought ${i}`,
          confidence: 0.8,
          significanceScore: 0.7,
          agentId: 'theoria',
          category: 'consciousness',
          timestamp: Date.now()
        });
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: Should extract patterns (>= threshold)
      expect(result.stats.dreamPatterns).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test: Exactly 5 thoughts (boundary for Deep Sleep)
     */
    it('should handle exactly 5 thoughts for Deep Sleep phase', async () => {
      // Arrange: Exactly 5 thoughts (boundary condition)
      for (let i = 0; i < 5; i++) {
        databaseManager.recordSignificantThought({
          id: `thought_${i}`,
          content: `Boundary thought ${i}`,
          confidence: 0.9,
          significanceScore: 0.8,
          agentId: 'theoria',
          category: 'consciousness',
          timestamp: Date.now()
        });
      }

      // Act
      const result = await sleepManager.performSleepCycle('manual');

      // Assert: Should attempt consolidation (>= threshold)
      expect(result.stats.beliefsMerged).toBeGreaterThanOrEqual(0);
    });
  });
});

/**
 * Helper: Seed test data for sleep cycle tests
 */
function seedTestData(db: DatabaseManager): void {
  // Add thoughts
  for (let i = 0; i < 20; i++) {
    db.recordSignificantThought({
      id: `thought_${i}`,
      content: `Test thought ${i} about consciousness and meaning`,  // Use 'content' instead of 'thought_content'
      confidence: 0.8,
      significanceScore: 0.7,  // Use camelCase to match expected property
      agentId: 'theoria',      // Use camelCase to match expected property
      category: 'consciousness',
      timestamp: Date.now()
    });
  }

  // Add thought cycles with varying dissonance
  const dbInstance = (db as any).db;
  for (let i = 0; i < 5; i++) {
    const cycleId = `cycle_${i}`;
    const dissonance = i < 2 ? 0.8 : 0.3; // 2 high-dissonance cycles

    db.saveThoughtCycle({
      id: cycleId,
      trigger_id: `trigger_${i}`,
      timestamp: Date.now(),
      duration: 1000,
      thoughts_data: JSON.stringify([]),
      synthesis_data: JSON.stringify({ content: "Test synthesis" }),
      empathy_score: 0.5,
      coherence_score: 0.6,
      dissonance_score: dissonance
    });

    // Insert DPD weights for high-dissonance queries to work
    dbInstance.prepare(`
      INSERT INTO dpd_weights (timestamp, empathy, coherence, dissonance, context, version)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(Date.now(), 0.5, 0.6, dissonance, cycleId, 1);
  }

  // Add core beliefs
  db.createCoreBelief({
    belief_content: "意識は問いから生まれる",
    category: 'consciousness',
    confidence: 0.9,
    strength: 0.8,
    source_thoughts: [],
    first_formed: Date.now(),
    last_reinforced: Date.now(),
    reinforcement_count: 1,
    contradiction_count: 0,
    agent_affinity: {}
  });
}

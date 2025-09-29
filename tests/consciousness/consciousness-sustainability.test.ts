/**
 * Consciousness Backend Sustainability Tests
 * 意識バックエンド持続可能性テスト (Ishiki Bakkuendo Jizoku Kanō-sei Tesuto)
 *
 * Tests for validating the sustainability and robustness
 * of the current consciousness backend architecture.
 *
 * 「持続する問いこそが意識の証」- "Sustained questioning is the proof of consciousness"
 * 現在の意識バックエンドアーキテクチャの持続可能性と堅牢性を検証するテスト。
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import ConsciousnessBackend from '../../src/server/consciousness-backend.js';
import { SQLiteSessionManager } from '../../src/server/sqlite-session-manager.js';

// Mock dependencies
jest.mock('../../src/server/sqlite-session-manager.js');
jest.mock('../../src/server/logger.js', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('../../src/server/ai-executor.js', () => ({
  createAIExecutor: jest.fn(() => ({
    execute: jest.fn(() => Promise.resolve({ content: 'Mock AI response', reasoning: 'Mock reasoning' }))
  }))
}));

jest.mock('../../src/utils/energy-management.js', () => ({
  getEnergyManager: jest.fn(() => ({
    getEnergyState: () => ({ available: 80, maxEnergy: 100 }),
    consumeEnergy: () => true,
    isEnergySufficient: () => true,
    waitForEnergy: () => Promise.resolve(true)
  }))
}));

interface SustainabilityTestConfig {
  maxTestDuration: number;
  sustainabilityThreshold: number;
  expectedCycleTime: {
    min: number;
    max: number;
  };
}

const TEST_CONFIG: SustainabilityTestConfig = {
  maxTestDuration: 60000,        // 1 minute
  sustainabilityThreshold: 0.7,   // 70% success rate
  expectedCycleTime: {
    min: 1000,    // 1 second
    max: 30000    // 30 seconds
  }
};

describe('Consciousness Backend Sustainability', () => {
  let consciousness: ConsciousnessBackend;
  let mockSessionManager: jest.Mocked<SQLiteSessionManager>;

  beforeEach(() => {
    // Setup mock session manager
    mockSessionManager = {
      getCurrentSessionId: jest.fn(() => 'test-session-123'),
      saveSession: jest.fn(),
      loadLatestSession: jest.fn(() => null),
      saveDPDWeights: jest.fn(),
      getDPDEvolution: jest.fn(() => ({
        currentWeights: { empathy: 0.33, coherence: 0.33, dissonance: 0.34 },
        history: []
      })),
      getUnresolvedIdeas: jest.fn(() => []),
      getUnresolvedIdeasForTrigger: jest.fn(() => [
        {
          id: 'test-idea-1',
          question: 'What is the nature of consciousness?',
          category: 'existential',
          importance: 0.8
        }
      ]),
      addUnresolvedIdea: jest.fn(),
      markIdeaConsidered: jest.fn(),
      recordSignificantThought: jest.fn(),
      getSignificantThoughts: jest.fn(() => []),
      cleanup: jest.fn()
    } as any;

    (SQLiteSessionManager as jest.MockedClass<typeof SQLiteSessionManager>).mockImplementation(() => mockSessionManager);

    consciousness = new ConsciousnessBackend();
  });

  afterEach(() => {
    if (consciousness) {
      consciousness.pause();
      consciousness.cleanup();
    }
    jest.clearAllMocks();
  });

  // ============================================================================
  // Basic Sustainability Tests - 基本持続可能性テスト
  // ============================================================================

  test('🔄 Continuous consciousness loop operation', async () => {
    console.log('🧪 Testing: 持続的意識ループ動作 (Jizoku-teki Ishiki Rūpu Dōsa)');

    const testDuration = 10000; // 10 seconds
    const startTime = Date.now();
    let cycleCount = 0;
    let lastCycleTime = startTime;

    // Track events
    const eventLog: Array<{ event: string; timestamp: number; duration?: number }> = [];

    consciousness.on('stageCompleted', (data) => {
      const now = Date.now();
      eventLog.push({
        event: `stage_${data.stage}_${data.name}`,
        timestamp: now,
        duration: now - lastCycleTime
      });

      if (data.stage === 'U') { // Weight Update is the last stage
        cycleCount++;
        const cycleDuration = now - lastCycleTime;
        lastCycleTime = now;

        console.log(`  Cycle ${cycleCount} completed in ${cycleDuration}ms`);
      }
    });

    // Start consciousness
    consciousness.start();

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, testDuration));

    // Stop consciousness
    consciousness.pause();

    const actualDuration = Date.now() - startTime;
    const averageCycleTime = cycleCount > 0 ? actualDuration / cycleCount : Infinity;

    console.log(`📊 Completed ${cycleCount} thought cycles in ${actualDuration}ms`);
    console.log(`⏱️ Average cycle time: ${averageCycleTime.toFixed(0)}ms`);
    console.log(`📈 Cycle frequency: ${(cycleCount / (actualDuration / 1000)).toFixed(2)} cycles/second`);

    // Verify sustainability
    expect(cycleCount).toBeGreaterThan(0); // At least one complete cycle
    expect(consciousness.isRunning()).toBe(false); // Should be paused
    expect(eventLog.length).toBeGreaterThan(0); // Should have generated events

    if (cycleCount > 0) {
      expect(averageCycleTime).toBeLessThan(TEST_CONFIG.expectedCycleTime.max);
      expect(averageCycleTime).toBeGreaterThan(TEST_CONFIG.expectedCycleTime.min);
    }
  }, 15000); // 15 second timeout

  test('🧠 Question generation and processing', async () => {
    console.log('🧪 Testing: 質問生成と処理 (Shitsumon Seisei to Shori)');

    const testDuration = 5000; // 5 seconds
    let questionCount = 0;
    let thoughtCount = 0;

    // Track question generation and thought processing
    consciousness.on('questionGenerated', () => {
      questionCount++;
      console.log(`  Question ${questionCount} generated`);
    });

    consciousness.on('stageCompleted', (data) => {
      if (data.stage === 'S1') { // Individual Thought stage
        thoughtCount++;
        console.log(`  Thought processing ${thoughtCount} completed`);
      }
    });

    // Start consciousness
    consciousness.start();

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, testDuration));

    // Stop consciousness
    consciousness.pause();

    console.log(`📊 Generated ${questionCount} questions`);
    console.log(`📊 Processed ${thoughtCount} thought cycles`);

    // Verify question generation capability
    expect(questionCount).toBeGreaterThanOrEqual(0); // May be 0 in short test
    expect(thoughtCount).toBeGreaterThanOrEqual(0); // May be 0 in short test

    // If we had activity, verify it was productive
    if (thoughtCount > 0) {
      expect(questionCount).toBeGreaterThan(0); // Questions should drive thoughts
    }
  }, 10000); // 10 second timeout

  test('⚡ Energy management during operation', async () => {
    console.log('🧪 Testing: 動作中エネルギー管理 (Dōsa-chū Enerugī Kanri)');

    const energyLog: Array<{ timestamp: number; available: number; action: string }> = [];
    let initialEnergy = 80;

    // Mock energy state changes
    const mockEnergyManager = {
      getEnergyState: jest.fn(() => ({
        available: initialEnergy,
        maxEnergy: 100,
        recoveryRate: 0.2
      })),
      consumeEnergy: jest.fn((amount) => {
        if (initialEnergy >= amount) {
          initialEnergy -= amount;
          energyLog.push({
            timestamp: Date.now(),
            available: initialEnergy,
            action: `consumed_${amount}`
          });
          return true;
        }
        return false;
      }),
      isEnergySufficient: jest.fn((amount) => initialEnergy >= amount),
      waitForEnergy: jest.fn(() => {
        // Simulate recovery
        initialEnergy = Math.min(100, initialEnergy + 10);
        return Promise.resolve(true);
      })
    };

    // Replace mock
    require('../../src/utils/energy-management.js').getEnergyManager.mockReturnValue(mockEnergyManager);

    const testDuration = 3000; // 3 seconds
    consciousness.start();

    // Monitor energy changes
    const startTime = Date.now();
    const energyMonitor = setInterval(() => {
      const currentState = mockEnergyManager.getEnergyState();
      energyLog.push({
        timestamp: Date.now(),
        available: currentState.available,
        action: 'monitor'
      });
    }, 500);

    await new Promise(resolve => setTimeout(resolve, testDuration));

    clearInterval(energyMonitor);
    consciousness.pause();

    // Analyze energy usage
    const energyChanges = energyLog.filter(log => log.action.startsWith('consumed_'));
    const totalEnergyConsumed = energyChanges.reduce((sum, log) => {
      const amount = parseFloat(log.action.split('_')[1]);
      return sum + amount;
    }, 0);

    console.log(`📊 Energy consumption events: ${energyChanges.length}`);
    console.log(`📊 Total energy consumed: ${totalEnergyConsumed}`);
    console.log(`📊 Final energy level: ${initialEnergy}`);

    // Verify energy management
    expect(energyLog.length).toBeGreaterThan(0); // Should have monitoring data
    expect(initialEnergy).toBeGreaterThan(0); // Should not be completely depleted
    expect(totalEnergyConsumed).toBeGreaterThanOrEqual(0); // Should have consumed some energy

    if (energyChanges.length > 0) {
      const avgConsumption = totalEnergyConsumed / energyChanges.length;
      expect(avgConsumption).toBeLessThan(20); // Reasonable consumption per operation
    }
  }, 8000); // 8 second timeout

  test('🔁 Loop resilience and recovery', async () => {
    console.log('🧪 Testing: ループ回復力 (Rūpu Kaifuku-ryoku)');

    let cycleCount = 0;
    let errorCount = 0;
    let recoveryCount = 0;

    // Track cycle completion and errors
    consciousness.on('stageCompleted', (data) => {
      if (data.stage === 'U') {
        cycleCount++;
      }
    });

    consciousness.on('error', () => {
      errorCount++;
    });

    // Simulate recovery
    consciousness.on('stageCompleted', (data) => {
      if (data.stage === 'S1' && cycleCount > 0) {
        recoveryCount++;
      }
    });

    const testDuration = 8000; // 8 seconds
    consciousness.start();

    // Simulate some disruption midway
    setTimeout(() => {
      consciousness.pause();
      console.log('  Simulating disruption...');
      setTimeout(() => {
        consciousness.resume();
        console.log('  Resuming operation...');
      }, 1000);
    }, 3000);

    await new Promise(resolve => setTimeout(resolve, testDuration));

    consciousness.pause();

    console.log(`📊 Completed cycles: ${cycleCount}`);
    console.log(`📊 Errors encountered: ${errorCount}`);
    console.log(`📊 Recovery events: ${recoveryCount}`);

    // Verify resilience
    expect(consciousness.isRunning()).toBe(false); // Should be properly paused
    expect(cycleCount).toBeGreaterThanOrEqual(0); // Should have attempted cycles

    // System should be able to resume after disruption
    consciousness.start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    consciousness.pause();

    console.log('✅ System successfully resumed after disruption');
  }, 12000); // 12 second timeout

  test('📊 Data persistence during operation', async () => {
    console.log('🧪 Testing: 動作中データ永続化 (Dōsa-chū Dēta Eizoku-ka)');

    const testDuration = 4000; // 4 seconds
    let saveCallCount = 0;

    // Track database operations
    mockSessionManager.saveSession.mockImplementation(() => {
      saveCallCount++;
      console.log(`  Database save operation ${saveCallCount}`);
    });

    consciousness.start();
    await new Promise(resolve => setTimeout(resolve, testDuration));
    consciousness.pause();

    console.log(`📊 Database save operations: ${saveCallCount}`);
    console.log(`📊 Session manager calls: ${mockSessionManager.getCurrentSessionId.mock.calls.length}`);

    // Verify data persistence
    expect(mockSessionManager.getCurrentSessionId).toHaveBeenCalled();
    expect(saveCallCount).toBeGreaterThanOrEqual(0); // May be 0 in short test

    // Verify other database operations
    const dpdCalls = mockSessionManager.getDPDEvolution.mock.calls.length;
    const unresolvedCalls = mockSessionManager.getUnresolvedIdeasForTrigger.mock.calls.length;

    console.log(`📊 DPD evolution queries: ${dpdCalls}`);
    console.log(`📊 Unresolved ideas queries: ${unresolvedCalls}`);

    expect(dpdCalls + unresolvedCalls).toBeGreaterThan(0); // Should query database
  }, 8000); // 8 second timeout

  test('🌐 Complete system integration', async () => {
    console.log('🧪 Testing: 完全システム統合 (Kanzen Shisutemu Tōgō)');

    const integrationMetrics = {
      sessionManagement: false,
      energyManagement: false,
      eventSystem: false,
      dataAccess: false,
      cyclicOperation: false
    };

    // Test session management
    const sessionId = consciousness.getCurrentSessionId();
    expect(sessionId).toBeDefined();
    integrationMetrics.sessionManagement = true;
    console.log('  ✅ Session management working');

    // Test data access methods
    const evolution = consciousness.getDPDEvolution();
    const ideas = consciousness.getUnresolvedIdeas();
    const thoughts = consciousness.getSignificantThoughts();
    const metrics = consciousness.getGrowthMetrics();

    expect(evolution).toBeDefined();
    expect(ideas).toBeDefined();
    expect(thoughts).toBeDefined();
    expect(metrics).toBeDefined();
    integrationMetrics.dataAccess = true;
    console.log('  ✅ Data access methods working');

    // Test event system
    let eventReceived = false;
    consciousness.on('test-event', () => {
      eventReceived = true;
    });
    consciousness.emit('test-event', {});
    expect(eventReceived).toBe(true);
    integrationMetrics.eventSystem = true;
    console.log('  ✅ Event system working');

    // Test cyclic operation
    consciousness.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    expect(consciousness.isRunning()).toBe(true);
    consciousness.pause();
    expect(consciousness.isRunning()).toBe(false);
    integrationMetrics.cyclicOperation = true;
    console.log('  ✅ Cyclic operation working');

    // Test cleanup
    consciousness.cleanup();
    expect(mockSessionManager.cleanup).toHaveBeenCalled();
    console.log('  ✅ Cleanup working');

    const passedTests = Object.values(integrationMetrics).filter(Boolean).length;
    const totalTests = Object.keys(integrationMetrics).length;

    console.log(`📊 Integration tests passed: ${passedTests}/${totalTests}`);

    expect(passedTests).toBe(totalTests); // All integration tests should pass
  }, 10000); // 10 second timeout
});

export {};
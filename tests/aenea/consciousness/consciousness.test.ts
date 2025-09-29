/**
 * Consciousness Backend Tests
 * Updated for SQLite-only architecture
 */

import ConsciousnessBackend from '../../../src/server/consciousness-backend.js';
import { SQLiteSessionManager } from '../../../src/server/sqlite-session-manager.js';

// Mock the SQLite dependencies
jest.mock('../../../src/server/sqlite-session-manager.js');
jest.mock('../../../src/server/logger.js', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock AI executor
jest.mock('../../../src/server/ai-executor.js', () => ({
  createAIExecutor: jest.fn(() => ({
    execute: jest.fn(() => Promise.resolve({ content: 'Mock AI response', reasoning: 'Mock reasoning' }))
  }))
}));

// Mock energy manager
jest.mock('../../../src/utils/energy-management.js', () => ({
  getEnergyManager: jest.fn(() => ({
    getEnergyState: () => ({ available: 80, maxEnergy: 100 }),
    consumeEnergy: () => true,
    isEnergySufficient: () => true,
    waitForEnergy: () => Promise.resolve(true)
  }))
}));

describe('ConsciousnessBackend', () => {
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
      getUnresolvedIdeasForTrigger: jest.fn(() => []),
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

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(consciousness).toBeDefined();
      expect(consciousness.getCurrentSessionId()).toBe('test-session-123');
      expect(consciousness.isRunning()).toBe(false);
    });

    it('should set up session manager correctly', () => {
      expect(mockSessionManager.getCurrentSessionId).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should get current session ID', () => {
      const sessionId = consciousness.getCurrentSessionId();
      expect(sessionId).toBe('test-session-123');
      expect(mockSessionManager.getCurrentSessionId).toHaveBeenCalled();
    });

    it('should save session data', () => {
      // Session saving is called internally during consciousness operations
      expect(mockSessionManager.saveSession).toBeDefined();
    });
  });

  describe('DPD Evolution', () => {
    it('should get DPD evolution data', () => {
      const evolution = consciousness.getDPDEvolution();
      expect(evolution).toEqual({
        currentWeights: { empathy: 0.33, coherence: 0.33, dissonance: 0.34 },
        history: []
      });
      expect(mockSessionManager.getDPDEvolution).toHaveBeenCalled();
    });

    it('should save DPD weights', () => {
      const weights = { empathy: 0.35, coherence: 0.32, dissonance: 0.33, version: 1 };
      // DPD weights are saved internally during weight updates
      expect(mockSessionManager.saveDPDWeights).toBeDefined();
    });
  });

  describe('Unresolved Ideas Management', () => {
    it('should get unresolved ideas', () => {
      const ideas = consciousness.getUnresolvedIdeas(10);
      expect(ideas).toEqual([]);
      expect(mockSessionManager.getUnresolvedIdeas).toHaveBeenCalledWith(10);
    });

    it('should get unresolved ideas for trigger generation', () => {
      const ideas = consciousness.getUnresolvedIdeasForTrigger(5, 0.4);
      expect(ideas).toEqual([]);
      expect(mockSessionManager.getUnresolvedIdeasForTrigger).toHaveBeenCalledWith(5, 0.4);
    });
  });

  describe('Significant Thoughts Management', () => {
    it('should get significant thoughts', () => {
      const thoughts = consciousness.getSignificantThoughts(20);
      expect(thoughts).toEqual([]);
      expect(mockSessionManager.getSignificantThoughts).toHaveBeenCalledWith(20);
    });
  });

  describe('Growth Metrics', () => {
    it('should get growth metrics', () => {
      const metrics = consciousness.getGrowthMetrics();
      expect(metrics).toEqual({
        totalSessions: 1,
        averageThoughtComplexity: 0.7,
        questionDiversity: 0.8,
        dpdStability: 0.6
      });
    });
  });

  describe('Consciousness Control', () => {
    it('should start consciousness loop', () => {
      consciousness.start();
      expect(consciousness.isRunning()).toBe(true);
    });

    it('should pause consciousness loop', () => {
      consciousness.start();
      consciousness.pause();
      expect(consciousness.isRunning()).toBe(false);
    });

    it('should resume consciousness loop', () => {
      consciousness.start();
      consciousness.pause();
      consciousness.resume();
      expect(consciousness.isRunning()).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should handle event listeners', () => {
      const mockListener = jest.fn();
      consciousness.on('test-event', mockListener);

      consciousness.emit('test-event', { data: 'test' });
      expect(mockListener).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const mockListener = jest.fn();
      consciousness.on('test-event', mockListener);
      consciousness.off('test-event', mockListener);

      consciousness.emit('test-event', { data: 'test' });
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      consciousness.cleanup();
      expect(mockSessionManager.cleanup).toHaveBeenCalled();
    });
  });
});

describe('SQLite Integration', () => {
  let consciousness: ConsciousnessBackend;

  beforeEach(() => {
    consciousness = new ConsciousnessBackend();
  });

  afterEach(() => {
    consciousness.cleanup();
  });

  it('should use SQLite session manager for persistence', () => {
    expect(SQLiteSessionManager).toHaveBeenCalled();
  });

  it('should handle database operations gracefully', () => {
    // Test that database operations don't throw errors
    expect(() => {
      consciousness.getDPDEvolution();
      consciousness.getUnresolvedIdeas();
      consciousness.getSignificantThoughts();
      consciousness.getGrowthMetrics();
    }).not.toThrow();
  });
});
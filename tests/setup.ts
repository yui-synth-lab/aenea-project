/**
 * Jest Test Setup - t_wada Style
 * Global test configuration and utilities
 */

// Type definitions for test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidConsciousnessState(): R;
    }
  }

  var testUtils: {
    createMockConsciousnessState: () => any;
    createMockInternalTrigger: () => any;
    createMockDPDWeights: () => any;
  };
}

// Extend Jest matchers
expect.extend({
  toBeValidConsciousnessState(received) {
    const pass =
      typeof received === 'object' &&
      typeof received.systemClock === 'number' &&
      typeof received.energy === 'number' &&
      typeof received.isRunning === 'boolean';

    return {
      message: () => `expected ${JSON.stringify(received)} to be a valid consciousness state`,
      pass
    };
  }
});

// Global test timeout
jest.setTimeout(10000);

// Provide test utilities
(global as any).testUtils = {
  createMockConsciousnessState: () => ({
    systemClock: 0,
    energy: 80,
    maxEnergy: 100,
    energyLevel: 'high',
    energyRecommendations: [],
    isRunning: false,
    isPaused: false,
    totalQuestions: 0,
    totalThoughts: 0,
    lastQuestion: null,
    agents: ['theoria', 'pathia', 'kinesis'],
    status: 'initialized'
  }),

  createMockInternalTrigger: () => ({
    id: 'test-trigger-123',
    timestamp: Date.now(),
    question: 'What is the nature of consciousness?',
    category: 'consciousness',
    importance: 0.8,
    source: 'test'
  }),

  createMockDPDWeights: () => ({
    empathy: 0.33,
    coherence: 0.33,
    dissonance: 0.34,
    timestamp: Date.now(),
    version: 1
  })
};

export {};
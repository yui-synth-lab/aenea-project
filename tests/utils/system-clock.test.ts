/**
 * System Clock Tests - Minimal Implementation Tests
 * Tests for consciousness timeline management
 */

import { ConsciousnessSystemClock, createSystemClock } from '../../src/utils/system-clock';

describe('System Clock', () => {
  let systemClock: ConsciousnessSystemClock;

  beforeEach(() => {
    systemClock = createSystemClock();
  });

  describe('Initialization and Basic Operations', () => {
    test('should create system clock with default value', () => {
      expect(systemClock).toBeDefined();
      expect(systemClock.getCurrentClock()).toBeGreaterThanOrEqual(0);
    });

    test('should create system clock with initial value', () => {
      const clock = createSystemClock(100);
      expect(clock.getCurrentClock()).toBe(100);
    });

    test('should advance time with tick', () => {
      const initial = systemClock.getCurrentClock();
      systemClock.tick();
      expect(systemClock.getCurrentClock()).toBe(initial + 1);
    });

    test('should create timestamps', () => {
      const timestamp = systemClock.getCurrentTimestamp();
      expect(timestamp).toHaveProperty('systemClock');
      expect(timestamp).toHaveProperty('realTime');
      expect(timestamp).toHaveProperty('phase');
      expect(timestamp).toHaveProperty('poeticTime');
    });
  });

  describe('Event Recording', () => {
    test('should record events without errors', () => {
      expect(() => {
        systemClock.recordEvent('trigger_generated', 'Test event', 'テスト', 0.8);
      }).not.toThrow();
    });

    test('should retrieve recent events', () => {
      systemClock.recordEvent('trigger_generated', 'Event 1', 'イベント1', 0.7);
      const events = systemClock.getRecentEvents(10);
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('Phase Management', () => {
    test('should transition between phases', () => {
      expect(() => {
        systemClock.transitionToPhase('contemplation');
      }).not.toThrow();
    });

    test('should track current phase', () => {
      const timestamp = systemClock.getCurrentTimestamp();
      expect(typeof timestamp.phase).toBe('string');
    });
  });
});

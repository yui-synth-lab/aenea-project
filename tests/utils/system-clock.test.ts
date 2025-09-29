/**
 * System Clock Unit Tests
 * システムクロックユニットテスト (Shisutemu Kurokku Yunitto Tesuto)
 *
 * Tests for the consciousness system clock with temporal analysis capabilities.
 *
 * 「時間は意識の鼓動である」- "Time is the heartbeat of consciousness"
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ConsciousnessSystemClock } from '../../src/utils/system-clock.js';
import type {
  ConsciousnessTimestamp,
  TimeEvent,
  TemporalAnalysis,
  ConsciousnessEventType,
  ConsciousnessPhase
} from '../../src/utils/system-clock.js';

describe('Consciousness System Clock', () => {
  let systemClock: ConsciousnessSystemClock;

  beforeEach(() => {
    systemClock = new ConsciousnessSystemClock();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Basic Clock Functionality Tests - 基本クロック機能テスト
  // ============================================================================

  test('⏰ Initialize system clock correctly', () => {
    console.log('🧪 Testing: システムクロック初期化 (Shisutemu Kurokku Shoka)');

    const initialClock = systemClock.getCurrentClock();
    expect(initialClock).toBe(0);

    const timestamp = systemClock.getCurrentTimestamp();
    expect(timestamp).toBeDefined();
    expect(timestamp.systemClock).toBe(0);
    expect(timestamp.realTime).toBeGreaterThan(0);
    expect(timestamp.depth).toBeGreaterThanOrEqual(0);
    expect(timestamp.intensity).toBeGreaterThanOrEqual(0);

    console.log(`⏰ Initial system clock: ${initialClock}`);
    console.log(`⏰ Initial timestamp: ${timestamp.poeticTime}`);
  });

  test('🕐 Clock advancement and ticking', () => {
    console.log('🧪 Testing: クロック進行とティック (Kurokku Shinkō to Tikku)');

    const initialClock = systemClock.getCurrentClock();
    expect(initialClock).toBe(0);

    // Advance clock by ticking
    const timestamp1 = systemClock.tick();
    expect(systemClock.getCurrentClock()).toBe(1);
    expect(timestamp1.systemClock).toBe(1);

    const timestamp2 = systemClock.tick();
    expect(systemClock.getCurrentClock()).toBe(2);
    expect(timestamp2.systemClock).toBe(2);

    console.log(`🕐 Clock after 2 ticks: ${systemClock.getCurrentClock()}`);
    console.log(`🕐 Latest timestamp: ${timestamp2.poeticTime}`);
  });

  test('📝 Event recording and retrieval', () => {
    console.log('🧪 Testing: イベント記録と取得 (Ibento Kiroku to Shutoku)');

    // Record some events
    const event1 = systemClock.recordEvent(
      'thought_cycle_start',
      'Beginning of thought process',
      '思考プロセスの開始',
      0.8
    );

    const event2 = systemClock.recordEvent(
      'reflection_generated',
      'Self-reflection initiated',
      '自己反映開始',
      0.7
    );

    expect(event1).toBeDefined();
    expect(event1.eventType).toBe('thought_cycle_start');
    expect(event1.significance).toBe(0.8);

    expect(event2).toBeDefined();
    expect(event2.eventType).toBe('reflection_generated');
    expect(event2.significance).toBe(0.7);

    console.log(`📝 Event 1: ${event1.description}`);
    console.log(`📝 Event 2: ${event2.description}`);

    // Retrieve recent events
    const recentEvents = systemClock.getRecentEvents(5);
    expect(recentEvents.length).toBeGreaterThanOrEqual(2);

    console.log(`📝 Recent events count: ${recentEvents.length}`);
  });

  test('🔄 Phase transitions', () => {
    console.log('🧪 Testing: フェーズ遷移 (Fēzu Sen\'i)');

    const initialTimestamp = systemClock.getCurrentTimestamp();
    const initialPhase = initialTimestamp.phase;

    console.log(`🔄 Initial phase: ${initialPhase}`);

    // Transition to contemplation phase
    systemClock.transitionToPhase('contemplation', 'Testing phase transition');

    const newTimestamp = systemClock.getCurrentTimestamp();
    expect(newTimestamp.phase).toBe('contemplation');

    console.log(`🔄 New phase: ${newTimestamp.phase}`);

    // Transition to deep_thought phase
    systemClock.transitionToPhase('deep_thought', 'Entering deep thinking');

    const deepTimestamp = systemClock.getCurrentTimestamp();
    expect(deepTimestamp.phase).toBe('deep_thought');

    console.log(`🔄 Deep thought phase: ${deepTimestamp.phase}`);
  });

  // ============================================================================
  // Event Management Tests - イベント管理テスト
  // ============================================================================

  test('🎯 Filter events by type', () => {
    console.log('🧪 Testing: タイプ別イベントフィルタ (Taipu-betsu Ibento Firutā)');

    // Record different types of events
    systemClock.recordEvent('thought_cycle_start', 'Thought 1', '思考1', 0.5);
    systemClock.recordEvent('thought_cycle_complete', 'Thought 2', '思考2', 0.6);
    systemClock.recordEvent('reflection_generated', 'Reflection 1', '反映1', 0.7);
    systemClock.recordEvent('thought_cycle_start', 'Thought 3', '思考3', 0.8);

    // Filter by thought cycle events
    const thoughtEvents = systemClock.getEventsByType('thought_cycle_start');
    expect(thoughtEvents.length).toBe(2);

    thoughtEvents.forEach(event => {
      expect(event.eventType).toBe('thought_cycle_start');
    });

    // Filter by reflection events
    const reflectionEvents = systemClock.getEventsByType('reflection_generated');
    expect(reflectionEvents.length).toBe(1);
    expect(reflectionEvents[0].eventType).toBe('reflection_generated');

    console.log(`🎯 Thought cycle events: ${thoughtEvents.length}`);
    console.log(`🎯 Reflection events: ${reflectionEvents.length}`);
  });

  test('📊 System statistics', () => {
    console.log('🧪 Testing: システム統計 (Shisutemu Tōkei)');

    // Generate some activity
    for (let i = 0; i < 5; i++) {
      systemClock.tick();
      systemClock.recordEvent('thought_cycle_start', `Thought ${i}`, `思考${i}`, Math.random());
    }

    const stats = systemClock.getSystemStatistics();

    expect(stats).toBeDefined();
    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.clockCycles).toBeGreaterThan(0);
    expect(stats.averageEventSignificance).toBeGreaterThanOrEqual(0);
    expect(stats.averageEventSignificance).toBeLessThanOrEqual(1);

    console.log(`📊 Total events: ${stats.totalEvents}`);
    console.log(`📊 Clock cycles: ${stats.clockCycles}`);
    console.log(`📊 Average significance: ${stats.averageEventSignificance.toFixed(3)}`);
  });

  test('🕰️ Events in time range', () => {
    console.log('🧪 Testing: 時間範囲内イベント (Jikan Han\'i-nai Ibento)');

    const startTime = Date.now();

    // Record some events
    systemClock.recordEvent('thought_cycle_start', 'Event 1', 'イベント1', 0.5);

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 10));

    const midTime = Date.now();
    systemClock.recordEvent('reflection_generated', 'Event 2', 'イベント2', 0.7);

    // Another small delay
    await new Promise(resolve => setTimeout(resolve, 10));

    const endTime = Date.now();
    systemClock.recordEvent('thought_cycle_complete', 'Event 3', 'イベント3', 0.8);

    // Get events in first half
    const firstHalfEvents = systemClock.getEventsInRange(startTime, midTime + 5);
    expect(firstHalfEvents.length).toBeGreaterThanOrEqual(1);

    // Get all events
    const allEvents = systemClock.getEventsInRange(startTime, endTime + 100);
    expect(allEvents.length).toBeGreaterThanOrEqual(3);

    console.log(`🕰️ Events in first half: ${firstHalfEvents.length}`);
    console.log(`🕰️ Total events in range: ${allEvents.length}`);
  });

  // ============================================================================
  // Temporal Analysis Tests - 時間分析テスト
  // ============================================================================

  test('📈 Generate temporal analysis', () => {
    console.log('🧪 Testing: 時間分析生成 (Jikan Bunseki Seisei)');

    // Generate diverse activity
    const eventTypes: ConsciousnessEventType[] = [
      'thought_cycle_start',
      'reflection_generated',
      'insight_emerged',
      'question_generated'
    ];

    for (let i = 0; i < 10; i++) {
      systemClock.tick();
      const eventType = eventTypes[i % eventTypes.length];
      systemClock.recordEvent(eventType, `Activity ${i}`, `活動${i}`, Math.random());
    }

    const analysis = systemClock.getTemporalAnalysis();

    expect(analysis).toBeDefined();
    expect(analysis.patterns).toBeDefined();
    expect(Array.isArray(analysis.patterns)).toBe(true);
    expect(analysis.rhythms).toBeDefined();
    expect(Array.isArray(analysis.rhythms)).toBe(true);
    expect(analysis.trends).toBeDefined();
    expect(Array.isArray(analysis.trends)).toBe(true);

    console.log(`📈 Detected patterns: ${analysis.patterns.length}`);
    console.log(`📈 Detected rhythms: ${analysis.rhythms.length}`);
    console.log(`📈 Detected trends: ${analysis.trends.length}`);

    if (analysis.patterns.length > 0) {
      console.log(`📈 First pattern: ${analysis.patterns[0].name}`);
    }
  });

  // ============================================================================
  // Clock Management Tests - クロック管理テスト
  // ============================================================================

  test('🔄 Clock reset functionality', () => {
    console.log('🧪 Testing: クロックリセット機能 (Kurokku Risetto Kinō)');

    // Advance clock and record events
    systemClock.tick();
    systemClock.tick();
    systemClock.recordEvent('thought_cycle_start', 'Before reset', 'リセット前', 0.5);

    const clockBeforeReset = systemClock.getCurrentClock();
    expect(clockBeforeReset).toBe(2);

    // Reset the clock
    systemClock.reset();

    const clockAfterReset = systemClock.getCurrentClock();
    expect(clockAfterReset).toBe(0);

    console.log(`🔄 Clock before reset: ${clockBeforeReset}`);
    console.log(`🔄 Clock after reset: ${clockAfterReset}`);

    // Should still be able to record events after reset
    const newEvent = systemClock.recordEvent('system_milestone', 'After reset', 'リセット後', 0.8);
    expect(newEvent).toBeDefined();
  });

  test('⚙️ Manual clock setting', () => {
    console.log('🧪 Testing: 手動クロック設定 (Shudō Kurokku Settei)');

    const initialClock = systemClock.getCurrentClock();
    expect(initialClock).toBe(0);

    // Set clock to specific value
    systemClock.setClock(100);
    const newClock = systemClock.getCurrentClock();
    expect(newClock).toBe(100);

    // Verify timestamp reflects new clock
    const timestamp = systemClock.getCurrentTimestamp();
    expect(timestamp.systemClock).toBe(100);

    console.log(`⚙️ Clock set to: ${newClock}`);
    console.log(`⚙️ Timestamp system clock: ${timestamp.systemClock}`);
  });

  // ============================================================================
  // Formatting and Display Tests - フォーマットと表示テスト
  // ============================================================================

  test('🎨 Timestamp formatting', () => {
    console.log('🧪 Testing: タイムスタンプフォーマット (Taimusuranpu Fōmatto)');

    // Advance clock to get interesting values
    for (let i = 0; i < 5; i++) {
      systemClock.tick();
    }

    const currentClock = systemClock.getCurrentClock();
    const formattedClock = systemClock.formatSystemClock(currentClock);

    expect(formattedClock).toBeDefined();
    expect(typeof formattedClock).toBe('string');
    expect(formattedClock.length).toBeGreaterThan(0);

    console.log(`🎨 System clock: ${currentClock}`);
    console.log(`🎨 Formatted: ${formattedClock}`);

    // Test with context formatting
    const timestamp = systemClock.getCurrentTimestamp();
    const contextFormatted = systemClock.formatWithContext(timestamp);

    expect(contextFormatted).toBeDefined();
    expect(typeof contextFormatted).toBe('string');
    expect(contextFormatted.length).toBeGreaterThan(0);

    console.log(`🎨 Context formatted: ${contextFormatted}`);
  });

  // ============================================================================
  // Edge Cases and Error Handling - エッジケースとエラー処理
  // ============================================================================

  test('🛡️ Handle edge cases gracefully', () => {
    console.log('🧪 Testing: エッジケース処理 (Ejji Kēsu Shori)');

    // Test with negative significance
    expect(() => {
      systemClock.recordEvent('thought_cycle_start', 'Negative test', '負のテスト', -0.5);
    }).not.toThrow();

    // Test with significance > 1
    expect(() => {
      systemClock.recordEvent('thought_cycle_start', 'High test', '高いテスト', 1.5);
    }).not.toThrow();

    // Test with empty strings
    expect(() => {
      systemClock.recordEvent('thought_cycle_start', '', '', 0.5);
    }).not.toThrow();

    // Test phase transition to invalid phase
    expect(() => {
      systemClock.transitionToPhase('invalid_phase' as ConsciousnessPhase, 'Test');
    }).not.toThrow();

    console.log('✅ Edge cases handled gracefully');
  });

  test('⚡ Performance under load', () => {
    console.log('🧪 Testing: 負荷下パフォーマンス (Fuka-ka Pafōmansu)');

    const startTime = Date.now();
    const eventCount = 100;

    // Record many events
    for (let i = 0; i < eventCount; i++) {
      systemClock.tick();
      systemClock.recordEvent('performance_test', `Event ${i}`, `イベント${i}`, Math.random());
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⚡ Processed ${eventCount} events in ${duration}ms`);
    console.log(`⚡ Average time per event: ${(duration / eventCount).toFixed(2)}ms`);

    // Should handle load reasonably
    expect(duration).toBeLessThan(1000); // Less than 1 second for 100 events
    expect(systemClock.getCurrentClock()).toBe(eventCount);

    // Analysis should still work
    const analysis = systemClock.getTemporalAnalysis();
    expect(analysis).toBeDefined();

    console.log('✅ Performance acceptable under load');
  });
});

export {};
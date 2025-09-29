/**
 * SQLite DPD Evolution Tests
 * SQLiteベースのDPD進化テスト
 *
 * Tests for SQLite-based DPD weight evolution, memory persistence,
 * and consciousness development patterns.
 *
 * 「記憶は時を越えた意識の橋」- "Memory is the bridge of consciousness across time"
 */

import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { SQLiteSessionManager } from '../../src/server/sqlite-session-manager.js';
import { DPDWeights, DPDScores } from '../../src/types/dpd-types.js';

// Mock SQLite3
const mockDatabase = {
  run: jest.fn((query, params, callback) => {
    if (callback) callback(null);
  }),
  get: jest.fn((query, params, callback) => {
    if (callback) callback(null, null);
  }),
  all: jest.fn((query, params, callback) => {
    if (callback) callback(null, []);
  }),
  exec: jest.fn((query, callback) => {
    if (callback) callback(null);
  }),
  close: jest.fn((callback) => {
    if (callback) callback(null);
  }),
  prepare: jest.fn(() => ({
    run: jest.fn((params, callback) => {
      if (callback) callback(null);
    }),
    finalize: jest.fn()
  }))
};

jest.mock('sqlite3', () => ({
  Database: jest.fn(() => mockDatabase)
}));

interface TestSession {
  sessionId: string;
  duration: number;
  thoughtCount: number;
  focusArea: 'empathy' | 'coherence' | 'dissonance' | 'balanced';
}

const TEST_SESSIONS: TestSession[] = [
  {
    sessionId: 'session_empathy_focus',
    duration: 5000,
    thoughtCount: 10,
    focusArea: 'empathy'
  },
  {
    sessionId: 'session_coherence_focus',
    duration: 6000,
    thoughtCount: 12,
    focusArea: 'coherence'
  },
  {
    sessionId: 'session_balanced',
    duration: 4000,
    thoughtCount: 8,
    focusArea: 'balanced'
  }
];

describe('SQLite DPD Evolution', () => {
  let sessionManager: SQLiteSessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager = new SQLiteSessionManager();
  });

  afterEach(() => {
    if (sessionManager) {
      sessionManager.cleanup();
    }
  });

  test('📊 SQLite schema initialization', () => {
    console.log('🧪 Testing: SQLite schema setup');

    // Verify database initialization was called
    expect(mockDatabase.exec).toHaveBeenCalled();

    // Verify schema contains required tables
    const schemaCall = (mockDatabase.exec as jest.Mock).mock.calls[0];
    const schema = schemaCall[0];

    expect(schema).toContain('CREATE TABLE IF NOT EXISTS sessions');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS questions');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS thought_cycles');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS dpd_weights');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS unresolved_ideas');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS significant_thoughts');
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS personality_snapshots');

    console.log('✅ Schema initialized with all required tables');
  });

  test('🧠 DPD weights persistence and evolution', async () => {
    console.log('🧪 Testing: DPD weights SQLite persistence');

    const initialWeights: DPDWeights = {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      version: 1
    };

    // Mock getDPDEvolution to return test data
    (mockDatabase.get as jest.Mock).mockImplementation((query, params, callback) => {
      if (query.includes('dpd_weights')) {
        callback(null, {
          empathy: initialWeights.empathy,
          coherence: initialWeights.coherence,
          dissonance: initialWeights.dissonance,
          version: initialWeights.version
        });
      } else {
        callback(null, null);
      }
    });

    (mockDatabase.all as jest.Mock).mockImplementation((query, params, callback) => {
      if (query.includes('dpd_weights')) {
        callback(null, [
          {
            empathy: initialWeights.empathy,
            coherence: initialWeights.coherence,
            dissonance: initialWeights.dissonance,
            version: 1,
            timestamp: Date.now(),
            trigger_type: 'initial',
            context: 'Test initialization'
          }
        ]);
      } else {
        callback(null, []);
      }
    });

    // Test saving DPD weights
    sessionManager.saveDPDWeights(
      initialWeights,
      'test-session-1',
      'weight_update',
      'Test weight save'
    );

    expect(mockDatabase.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO dpd_weights'),
      expect.arrayContaining([
        'test-session-1',
        expect.any(Number),
        initialWeights.empathy,
        initialWeights.coherence,
        initialWeights.dissonance,
        initialWeights.version,
        'weight_update',
        'Test weight save'
      ])
    );

    // Test getting current DPD weights
    const currentWeights = sessionManager.getCurrentDPDWeights();
    expect(currentWeights).toEqual(expect.objectContaining({
      empathy: expect.any(Number),
      coherence: expect.any(Number),
      dissonance: expect.any(Number)
    }));

    // Test getting DPD evolution
    const evolution = sessionManager.getDPDEvolution();
    expect(evolution).toEqual(expect.objectContaining({
      currentWeights: expect.any(Object),
      history: expect.any(Array)
    }));

    console.log('✅ DPD weights persistence working correctly');
  });

  test('🗃️ Unresolved ideas management', () => {
    console.log('🧪 Testing: Unresolved ideas SQLite management');

    const testIdea = {
      id: 'test-idea-1',
      question: 'What is the nature of consciousness?',
      category: 'existential',
      importance: 0.8,
      complexity: 0.7
    };

    // Test adding unresolved idea (object format)
    sessionManager.addUnresolvedIdea(testIdea);

    expect(mockDatabase.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO unresolved_ideas'),
      expect.arrayContaining([
        testIdea.id,
        testIdea.question,
        testIdea.category,
        expect.any(Number), // firstEncountered
        expect.any(Number), // lastRevisited
        0, // revisitCount
        testIdea.complexity,
        testIdea.importance,
        expect.any(String) // relatedThoughts JSON
      ])
    );

    // Test adding unresolved idea (string format - legacy)
    sessionManager.addUnresolvedIdea(
      'How does consciousness emerge?',
      'epistemic',
      0.7
    );

    expect(mockDatabase.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO unresolved_ideas'),
      expect.arrayContaining([
        expect.stringMatching(/^unresolved-/),
        'How does consciousness emerge?',
        'epistemic',
        expect.any(Number),
        expect.any(Number),
        0,
        0.5, // default complexity
        0.7, // provided importance
        expect.any(String)
      ])
    );

    // Mock getUnresolvedIdeas
    (mockDatabase.all as jest.Mock).mockImplementation((query, params, callback) => {
      if (query.includes('unresolved_ideas')) {
        callback(null, [
          {
            id: testIdea.id,
            question: testIdea.question,
            category: testIdea.category,
            first_encountered: Date.now(),
            last_revisited: Date.now(),
            revisit_count: 0,
            complexity: testIdea.complexity,
            importance: testIdea.importance,
            related_thoughts: '[]'
          }
        ]);
      } else {
        callback(null, []);
      }
    });

    // Test getting unresolved ideas
    const ideas = sessionManager.getUnresolvedIdeas(10);
    expect(mockDatabase.all).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM unresolved_ideas'),
      [10],
      expect.any(Function)
    );

    // Test getting unresolved ideas for trigger
    const triggerIdeas = sessionManager.getUnresolvedIdeasForTrigger(5, 0.4);
    expect(mockDatabase.all).toHaveBeenCalledWith(
      expect.stringContaining('WHERE importance >= ?'),
      [0.4, 5],
      expect.any(Function)
    );

    console.log('✅ Unresolved ideas management working correctly');
  });

  test('💭 Significant thoughts tracking', () => {
    console.log('🧪 Testing: Significant thoughts SQLite tracking');

    const testThought = {
      id: 'thought-123',
      content: 'Deep philosophical insight about consciousness',
      confidence: 0.9,
      agentId: 'theoria',
      category: 'philosophical',
      timestamp: Date.now(),
      significanceScore: 0.85
    };

    // Test recording significant thought
    sessionManager.recordSignificantThought(testThought, 'test-session-1');

    expect(mockDatabase.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO significant_thoughts'),
      expect.arrayContaining([
        testThought.id,
        'test-session-1',
        testThought.content,
        testThought.confidence,
        testThought.significanceScore,
        testThought.agentId,
        testThought.category,
        testThought.timestamp
      ])
    );

    // Mock getSignificantThoughts
    (mockDatabase.all as jest.Mock).mockImplementation((query, params, callback) => {
      if (query.includes('significant_thoughts')) {
        callback(null, [
          {
            id: testThought.id,
            thought_content: testThought.content,
            confidence: testThought.confidence,
            significance_score: testThought.significanceScore,
            agent_id: testThought.agentId,
            category: testThought.category,
            timestamp: testThought.timestamp
          }
        ]);
      } else {
        callback(null, []);
      }
    });

    // Test getting significant thoughts
    const thoughts = sessionManager.getSignificantThoughts(20);
    expect(mockDatabase.all).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM significant_thoughts'),
      [20],
      expect.any(Function)
    );

    console.log('✅ Significant thoughts tracking working correctly');
  });

  test('📝 Session data persistence', () => {
    console.log('🧪 Testing: Session data SQLite persistence');

    const sessionData = {
      systemClock: 12345,
      energy: 75.5,
      totalQuestions: 10,
      totalThoughts: 15,
      questionHistory: [
        { id: 'q1', question: 'Test question 1', timestamp: Date.now() },
        { id: 'q2', question: 'Test question 2', timestamp: Date.now() }
      ],
      thoughtHistory: [
        { id: 't1', timestamp: Date.now(), thoughts: [] },
        { id: 't2', timestamp: Date.now(), thoughts: [] }
      ]
    };

    // Test saving session
    sessionManager.saveSession(sessionData);

    // Verify session metadata was saved
    expect(mockDatabase.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO sessions'),
      expect.arrayContaining([
        expect.any(String), // sessionId
        expect.any(String), // start_time
        expect.any(String), // last_activity
        sessionData.systemClock,
        sessionData.energy,
        sessionData.totalQuestions,
        sessionData.totalThoughts,
        expect.any(String) // updated_at
      ])
    );

    console.log('✅ Session data persistence working correctly');
  });

  test('🔧 Database operations handling', () => {
    console.log('🧪 Testing: Database operations error handling');

    // Test database not ready scenario
    const newManager = new SQLiteSessionManager();
    (newManager as any).isReady = false;

    // These operations should handle gracefully when DB is not ready
    expect(() => {
      newManager.saveDPDWeights(
        { empathy: 0.33, coherence: 0.33, dissonance: 0.34, version: 1 },
        'test-session',
        'test',
        'test'
      );
      newManager.addUnresolvedIdea('test question');
      newManager.recordSignificantThought({ content: 'test' }, 'session');
    }).not.toThrow();

    // Test that methods return appropriate defaults when DB is not ready
    expect(newManager.getCurrentDPDWeights()).toEqual(
      expect.objectContaining({
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34
      })
    );

    expect(newManager.getUnresolvedIdeas()).toEqual([]);
    expect(newManager.getSignificantThoughts()).toEqual([]);

    newManager.cleanup();
    console.log('✅ Database operations error handling working correctly');
  });

  test('🧹 Cleanup and resource management', () => {
    console.log('🧪 Testing: SQLite cleanup and resource management');

    // Test cleanup
    sessionManager.cleanup();

    expect(mockDatabase.close).toHaveBeenCalled();

    // Test cleanup old sessions
    sessionManager.cleanupOldSessions();

    // Should have attempted cleanup operations
    expect(mockDatabase.run).toHaveBeenCalled();

    console.log('✅ Cleanup and resource management working correctly');
  });

  test('📊 Data integrity and constraints', () => {
    console.log('🧪 Testing: Data integrity and constraints');

    // Test weight sum constraints
    const validWeights: DPDWeights = {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      version: 1
    };

    const weightSum = validWeights.empathy + validWeights.coherence + validWeights.dissonance;
    expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.01);

    // Test that IDs are properly generated
    sessionManager.addUnresolvedIdea('Test question for ID generation');

    const idGenerationCall = (mockDatabase.run as jest.Mock).mock.calls.find(call =>
      call[0].includes('unresolved_ideas') && call[1][0].startsWith('unresolved-')
    );

    expect(idGenerationCall).toBeDefined();
    expect(idGenerationCall[1][0]).toMatch(/^unresolved-\d+-[a-z0-9]+$/);

    console.log('✅ Data integrity and constraints working correctly');
  });
});

describe('SQLite Performance and Optimization', () => {
  let sessionManager: SQLiteSessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager = new SQLiteSessionManager();
  });

  afterEach(() => {
    sessionManager.cleanup();
  });

  test('🚀 Bulk operations performance', () => {
    console.log('🧪 Testing: Bulk operations performance');

    const startTime = Date.now();

    // Simulate bulk data insertion
    for (let i = 0; i < 10; i++) {
      sessionManager.addUnresolvedIdea(`Question ${i}`, 'test', 0.5);
      sessionManager.recordSignificantThought({
        id: `thought-${i}`,
        content: `Thought ${i}`,
        timestamp: Date.now()
      }, 'test-session');
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete quickly (allowing for overhead in test environment)
    expect(duration).toBeLessThan(1000);

    console.log(`✅ Bulk operations completed in ${duration}ms`);
  });

  test('📈 Index usage verification', () => {
    console.log('🧪 Testing: Database index creation');

    // Verify that indexes were created in schema
    const schemaCall = (mockDatabase.exec as jest.Mock).mock.calls[0];
    const schema = schemaCall[0];

    expect(schema).toContain('CREATE INDEX IF NOT EXISTS idx_sessions_last_activity');
    expect(schema).toContain('CREATE INDEX IF NOT EXISTS idx_questions_session_timestamp');
    expect(schema).toContain('CREATE INDEX IF NOT EXISTS idx_dpd_weights_timestamp');
    expect(schema).toContain('CREATE INDEX IF NOT EXISTS idx_unresolved_ideas_category');
    expect(schema).toContain('CREATE INDEX IF NOT EXISTS idx_significant_thoughts_timestamp');

    console.log('✅ All required indexes created');
  });
});

export {};
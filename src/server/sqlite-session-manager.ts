/**
 * SQLite Session Manager - Persistent State Management with Database
 */

import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';
import { log } from './logger.js';

const Database = sqlite3.Database;

interface SessionData {
  systemClock: number;
  energy: number;
  totalQuestions: number;
  totalThoughts: number;
  questionHistory: any[];
  thoughtHistory: any[];
  lastSaved: string;
  sessionId: string;
}

interface SessionMetadata {
  sessionId: string;
  startTime: string;
  lastActivity: string;
  totalQuestions: number;
  totalThoughts: number;
}

class SQLiteSessionManager {
  private db: sqlite3.Database;
  private currentSessionId: string;
  private autoSaveInterval: NodeJS.Timer | null = null;
  private isReady: boolean = false;

  constructor() {
    const dbPath = path.join(process.cwd(), 'sessions', 'aenea_sessions.db');
    this.ensureSessionDirectory();
    this.currentSessionId = this.generateSessionId();

    this.db = new Database(dbPath, (err) => {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to open database', err);
      } else {
        log.info('SQLiteSessionManager', 'Database connection established');
        this.initializeDatabase();
      }
    });
  }

  private ensureSessionDirectory(): void {
    const sessionDir = path.join(process.cwd(), 'sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
  }

  private initializeDatabase(): void {
    const schema = `
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        start_time TEXT NOT NULL,
        last_activity TEXT NOT NULL,
        system_clock INTEGER,
        energy REAL,
        total_questions INTEGER DEFAULT 0,
        total_thoughts INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        question TEXT NOT NULL,
        category TEXT,
        importance REAL,
        source TEXT,
        context_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      CREATE TABLE IF NOT EXISTS thought_cycles (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        trigger_id TEXT,
        timestamp INTEGER NOT NULL,
        duration INTEGER,
        thoughts_data TEXT,
        synthesis_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      -- DPD Weight Evolution tracking
      CREATE TABLE IF NOT EXISTS dpd_weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        empathy REAL NOT NULL,
        coherence REAL NOT NULL,
        dissonance REAL NOT NULL,
        version INTEGER DEFAULT 1,
        trigger_type TEXT,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      -- Unresolved Ideas tracking
      CREATE TABLE IF NOT EXISTS unresolved_ideas (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        category TEXT,
        first_encountered INTEGER NOT NULL,
        last_revisited INTEGER,
        revisit_count INTEGER DEFAULT 0,
        complexity REAL DEFAULT 0.5,
        importance REAL DEFAULT 0.5,
        related_thoughts TEXT, -- JSON array
        considered_sessions TEXT, -- JSON array of session IDs
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Significant Thoughts tracking
      CREATE TABLE IF NOT EXISTS significant_thoughts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        thought_content TEXT NOT NULL,
        confidence REAL,
        significance_score REAL,
        agent_id TEXT,
        category TEXT,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      -- Personality Evolution tracking
      CREATE TABLE IF NOT EXISTS personality_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        traits_data TEXT NOT NULL, -- JSON object
        dpd_weights_data TEXT NOT NULL, -- JSON object
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      -- Memory Evolution & Learning System
      CREATE TABLE IF NOT EXISTS memory_patterns (
        id TEXT PRIMARY KEY,
        pattern_type TEXT NOT NULL, -- 'question_pattern', 'thought_pattern', 'resolution_pattern'
        pattern_data TEXT NOT NULL, -- JSON representation of pattern
        first_detected INTEGER NOT NULL,
        last_reinforced INTEGER NOT NULL,
        occurrence_count INTEGER DEFAULT 1,
        strength REAL DEFAULT 0.5, -- 0.0 to 1.0
        decay_rate REAL DEFAULT 0.01,
        learning_rate REAL DEFAULT 0.1,
        context_tags TEXT, -- JSON array of context tags
        related_patterns TEXT, -- JSON array of related pattern IDs
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS memory_weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_type TEXT NOT NULL, -- 'question', 'thought', 'experience', 'insight'
        memory_id TEXT NOT NULL, -- references to other tables
        session_id TEXT NOT NULL,
        importance_weight REAL DEFAULT 0.5,
        emotional_weight REAL DEFAULT 0.5,
        temporal_weight REAL DEFAULT 1.0, -- decays over time
        access_count INTEGER DEFAULT 0,
        last_accessed INTEGER,
        reinforcement_events TEXT, -- JSON array of reinforcement events
        decay_applied INTEGER DEFAULT 0, -- timestamp of last decay calculation
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      CREATE TABLE IF NOT EXISTS consciousness_insights (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        insight_content TEXT NOT NULL,
        insight_type TEXT, -- 'pattern_recognition', 'meta_cognitive', 'synthesis', 'breakthrough'
        confidence_level REAL,
        supporting_evidence TEXT, -- JSON array of evidence
        derived_from TEXT, -- JSON array of source memory IDs
        impact_score REAL DEFAULT 0.5,
        validation_status TEXT DEFAULT 'pending', -- 'pending', 'validated', 'refined', 'deprecated'
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      CREATE TABLE IF NOT EXISTS forgetting_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        forgotten_memory_type TEXT NOT NULL,
        forgotten_memory_id TEXT NOT NULL,
        forgetting_reason TEXT, -- 'natural_decay', 'deliberate_pruning', 'conflict_resolution'
        importance_threshold REAL,
        timestamp INTEGER NOT NULL,
        recovery_possible BOOLEAN DEFAULT 1,
        backup_data TEXT, -- JSON backup for potential recovery
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
      CREATE INDEX IF NOT EXISTS idx_questions_session_timestamp ON questions(session_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_thought_cycles_session_timestamp ON thought_cycles(session_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_dpd_weights_timestamp ON dpd_weights(timestamp);
      CREATE INDEX IF NOT EXISTS idx_unresolved_ideas_category ON unresolved_ideas(category);
      CREATE INDEX IF NOT EXISTS idx_memory_patterns_type ON memory_patterns(pattern_type);
      CREATE INDEX IF NOT EXISTS idx_memory_weights_session ON memory_weights(session_id);
      CREATE INDEX IF NOT EXISTS idx_consciousness_insights_type ON consciousness_insights(insight_type);
      CREATE INDEX IF NOT EXISTS idx_forgetting_events_session ON forgetting_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_significant_thoughts_timestamp ON significant_thoughts(timestamp);
      CREATE INDEX IF NOT EXISTS idx_personality_snapshots_timestamp ON personality_snapshots(timestamp);
    `;

    this.db.exec(schema, (err) => {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to initialize database schema', err);
      } else {
        log.info('SQLiteSessionManager', 'Database schema initialized successfully');
        this.isReady = true;
        this.startAutoSave();
      }
    });
  }

  private generateSessionId(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `session-${timestamp}`;
  }

  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      log.debug('SQLiteSessionManager', 'Auto-save interval triggered');
    }, 5 * 60 * 1000);
  }

  private compressData(data: any): string {
    try {
      if (Array.isArray(data)) {
        return JSON.stringify(data.slice(-20)); // Keep only last 20 items
      }
      return JSON.stringify(data);
    } catch (error) {
      log.warn('SQLiteSessionManager', 'Failed to compress data', error);
      return JSON.stringify({ error: 'Data serialization failed' });
    }
  }

  saveSession(data: Omit<SessionData, 'lastSaved' | 'sessionId'>): void {
    if (!this.isReady) {
      log.warn('SQLiteSessionManager', 'Database not ready, skipping save');
      return;
    }

    const now = new Date().toISOString();

    // Save session metadata
    const sessionQuery = `
      INSERT OR REPLACE INTO sessions
      (session_id, start_time, last_activity, system_clock, energy, total_questions, total_thoughts, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.run(sessionQuery, [
      this.currentSessionId,
      now,
      now,
      data.systemClock,
      data.energy,
      data.totalQuestions,
      data.totalThoughts,
      now
    ], (err) => {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to save session', err);
        return;
      }

      log.info('SQLiteSessionManager', `Session saved: ${this.currentSessionId}`, {
        questions: data.totalQuestions,
        thoughts: data.totalThoughts,
        energy: data.energy
      });
    });

    // Save recent questions
    if (data.questionHistory && data.questionHistory.length > 0) {
      const recentQuestions = data.questionHistory.slice(-50);
      const questionQuery = `
        INSERT OR REPLACE INTO questions
        (id, session_id, timestamp, question, category, importance, source, context_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      recentQuestions.forEach((question) => {
        this.db.run(questionQuery, [
          question.id,
          this.currentSessionId,
          question.timestamp,
          question.question,
          question.category,
          question.importance,
          question.source,
          this.compressData(question.context)
        ]);
      });
    }

    // Save recent thought cycles
    if (data.thoughtHistory && data.thoughtHistory.length > 0) {
      const recentCycles = data.thoughtHistory.slice(-20);
      const cycleQuery = `
        INSERT OR REPLACE INTO thought_cycles
        (id, session_id, trigger_id, timestamp, duration, thoughts_data, synthesis_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      recentCycles.forEach((cycle) => {
        this.db.run(cycleQuery, [
          cycle.id,
          this.currentSessionId,
          cycle.trigger?.id || null,
          cycle.timestamp,
          cycle.duration || null,
          this.compressData(cycle.thoughts),
          this.compressData(cycle.synthesis)
        ]);
      });
    }
  }

  loadLatestSession(): SessionData | null {
    if (!this.isReady) {
      log.warn('SQLiteSessionManager', 'Database not ready');
      return null;
    }

    try {
      const query = `
        SELECT * FROM sessions
        ORDER BY last_activity DESC
        LIMIT 1
      `;

      const row = this.db.prepare(query).get() as any;

      if (!row) {
        log.info('SQLiteSessionManager', 'No previous sessions found');
        return null;
      }

      const sessionData: SessionData = {
        sessionId: row.session_id,
        systemClock: row.system_clock || 0,
        energy: row.energy || 0,
        totalQuestions: row.total_questions || 0,
        totalThoughts: row.total_thoughts || 0,
        questionHistory: [],
        thoughtHistory: [],
        lastSaved: row.last_activity
      };

      log.info('SQLiteSessionManager', `Loaded session: ${row.session_id}`);
      return sessionData;
    } catch (error) {
      log.error('SQLiteSessionManager', 'Error loading latest session', error);
      return null;
    }
  }

  listSessions(): SessionMetadata[] {
    if (!this.isReady) return [];

    try {
      const query = `
        SELECT session_id, start_time, last_activity, total_questions, total_thoughts
        FROM sessions
        ORDER BY last_activity DESC
        LIMIT 50
      `;

      const rows = (this.db.prepare(query).all() as unknown) as any[];

      return rows.map((row: any) => ({
        sessionId: row.session_id,
        startTime: row.start_time,
        lastActivity: row.last_activity,
        totalQuestions: row.total_questions || 0,
        totalThoughts: row.total_thoughts || 0
      }));
    } catch (error) {
      log.error('SQLiteSessionManager', 'Failed to list sessions', error);
      return [];
    }
  }

  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  // ============================================================================
  // DPD Weight Evolution Methods
  // ============================================================================

  saveDPDWeights(weights: any, sessionId: string, triggerType: string, context: string): void {
    if (!this.isReady) return;

    const query = `
      INSERT INTO dpd_weights
      (session_id, timestamp, empathy, coherence, dissonance, version, trigger_type, context)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.run(query, [
      sessionId,
      Date.now(),
      weights.empathy,
      weights.coherence,
      weights.dissonance,
      weights.version || 1,
      triggerType,
      context
    ]);
  }

  getCurrentDPDWeights(): any {
    if (!this.isReady) {
      return { empathy: 0.33, coherence: 0.33, dissonance: 0.34 };
    }

    try {
      const query = `
        SELECT empathy, coherence, dissonance, version
        FROM dpd_weights
        ORDER BY timestamp DESC
        LIMIT 1
      `;

      const row = this.db.prepare(query).get() as any;

      if (!row) {
        return { empathy: 0.33, coherence: 0.33, dissonance: 0.34 };
      }

      return {
        empathy: row.empathy,
        coherence: row.coherence,
        dissonance: row.dissonance,
        version: row.version
      };
    } catch (error) {
      log.error('SQLiteSessionManager', 'Error getting current DPD weights', error);
      return { empathy: 0.33, coherence: 0.33, dissonance: 0.34 };
    }
  }

  getDPDEvolution(): any {
    if (!this.isReady) return { currentWeights: null, history: [] };

    try {
      const query = `
        SELECT empathy, coherence, dissonance, version, timestamp, trigger_type, context
        FROM dpd_weights
        ORDER BY timestamp DESC
        LIMIT 50
      `;

      // Use synchronous approach for better data retrieval
      const rows = (this.db.prepare(query).all() as unknown) as any[];

      // Ensure we have valid numeric values for weights
      const defaultWeights = { empathy: 0.33, coherence: 0.33, dissonance: 0.34 };

      if (!rows || rows.length === 0) {
        return {
          currentWeights: defaultWeights,
          history: []
        };
      }

      const latest = rows[0];

      // Extra safety check for latest row
      if (!latest) {
        return {
          currentWeights: defaultWeights,
          history: []
        };
      }

      return {
        currentWeights: {
          empathy: typeof latest.empathy === 'number' ? latest.empathy : defaultWeights.empathy,
          coherence: typeof latest.coherence === 'number' ? latest.coherence : defaultWeights.coherence,
          dissonance: typeof latest.dissonance === 'number' ? latest.dissonance : defaultWeights.dissonance,
          version: latest.version || 1
        },
        history: rows.reverse().map((row: any) => ({
          timestamp: row.timestamp,
          weights: {
            empathy: typeof row.empathy === 'number' ? row.empathy : defaultWeights.empathy,
            coherence: typeof row.coherence === 'number' ? row.coherence : defaultWeights.coherence,
            dissonance: typeof row.dissonance === 'number' ? row.dissonance : defaultWeights.dissonance,
            version: row.version || 1
          },
          trigger: row.trigger_type || 'unknown',
          context: row.context || ''
        }))
      };
    } catch (error) {
      console.error('Error getting DPD evolution:', error);
      return {
        currentWeights: { empathy: 0.33, coherence: 0.33, dissonance: 0.34 },
        history: []
      };
    }
  }

  // ============================================================================
  // Unresolved Ideas Methods
  // ============================================================================

  addUnresolvedIdea(questionOrIdea: string | any, category?: string, importance?: number): void {
    if (!this.isReady) return;

    let idea: any;

    if (typeof questionOrIdea === 'string') {
      // Simple string question format (legacy cross-session memory format)
      idea = {
        id: `unresolved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question: questionOrIdea,
        category: category || 'general',
        firstEncountered: Date.now(),
        lastRevisited: Date.now(),
        revisitCount: 0,
        complexity: 0.5,
        importance: importance || 0.5,
        relatedThoughts: []
      };
    } else {
      // Full idea object format
      idea = questionOrIdea;
    }

    const query = `
      INSERT OR REPLACE INTO unresolved_ideas
      (id, question, category, first_encountered, last_revisited, revisit_count, complexity, importance, related_thoughts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.run(query, [
      idea.id,
      idea.question,
      idea.category,
      idea.firstEncountered || Date.now(),
      idea.lastRevisited || Date.now(),
      idea.revisitCount || 0,
      idea.complexity || 0.5,
      idea.importance || 0.5,
      JSON.stringify(idea.relatedThoughts || [])
    ]);
  }

  getUnresolvedIdeas(limit: number = 100): any[] {
    if (!this.isReady) return [];

    try {
      const query = `
        SELECT * FROM unresolved_ideas
        ORDER BY importance DESC, last_revisited DESC
        LIMIT ?
      `;

      const rows = this.db.prepare(query).all(limit);

      return (Array.isArray(rows) ? rows : []).filter((row: any) => row && row.id).map((row: any) => ({
        id: row.id,
        question: row.question || '',
        category: row.category || '',
        firstEncountered: row.first_encountered || Date.now(),
        lastRevisited: row.last_revisited || Date.now(),
        revisitCount: row.revisit_count || 0,
        complexity: row.complexity || 0,
        importance: row.importance || 0,
        relatedThoughts: JSON.parse(row.related_thoughts || '[]')
      }));
    } catch (error) {
      console.error('Error getting unresolved ideas:', error);
      return [];
    }
  }

  getUnresolvedIdeasForTrigger(limit: number = 10, minImportance: number = 0.4): any[] {
    if (!this.isReady) return [];

    // Use synchronous approach for existing API compatibility
    let ideas: any[] = [];

    try {
      const query = `
        SELECT * FROM unresolved_ideas
        WHERE importance >= ?
        ORDER BY importance DESC, last_revisited ASC
        LIMIT ?
      `;

      // Use callback-based approach for sqlite3
      this.db.all(query, [minImportance, limit], (err, rows) => {
        if (!err && rows && Array.isArray(rows)) {
          ideas = rows.filter((row: any) => row && row.id).map((row: any) => ({
            id: row.id,
            question: row.question || '',
            category: row.category || '',
            firstEncountered: row.first_encountered || Date.now(),
            lastRevisited: row.last_revisited || Date.now(),
            revisitCount: row.revisit_count || 0,
            complexity: row.complexity || 0,
            importance: row.importance || 0,
            relatedThoughts: JSON.parse(row.related_thoughts || '[]')
          }));
        }
      });
    } catch (error) {
      log.error('SQLiteSessionManager', 'Error getting unresolved ideas for trigger', error);
    }

    return ideas;
  }

  markIdeaConsidered(ideaId: string, sessionId: string): void {
    if (!this.isReady) return;

    const query = `
      UPDATE unresolved_ideas
      SET last_revisited = ?, revisit_count = revisit_count + 1,
          considered_sessions = CASE
            WHEN considered_sessions IS NULL THEN ?
            ELSE json_insert(considered_sessions, '$[#]', ?)
          END
      WHERE id = ?
    `;

    this.db.run(query, [Date.now(), JSON.stringify([sessionId]), sessionId, ideaId]);
  }

  // ============================================================================
  // Significant Thoughts Methods
  // ============================================================================

  recordSignificantThought(thought: any, sessionId: string): void {
    if (!this.isReady) return;

    const query = `
      INSERT INTO significant_thoughts
      (id, session_id, thought_content, confidence, significance_score, agent_id, category, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.run(query, [
      thought.id || Date.now().toString(),
      sessionId,
      thought.content || thought.thought,
      thought.confidence || 0,
      thought.significanceScore || 0.5,
      thought.agentId || 'unknown',
      thought.category || 'general',
      thought.timestamp || Date.now()
    ]);
  }

  getSignificantThoughts(limit: number = 100): any[] {
    if (!this.isReady) return [];

    try {
      const query = `
        SELECT * FROM significant_thoughts
        ORDER BY significance_score DESC, timestamp DESC
        LIMIT ?
      `;

      const rows = this.db.prepare(query).all(limit);

      return (Array.isArray(rows) ? rows : []).filter((row: any) => row && row.id).map((row: any) => ({
        id: row.id,
        content: row.thought_content || '',
        confidence: row.confidence || 0,
        significanceScore: row.significance_score || 0,
        agentId: row.agent_id || '',
        category: row.category || '',
        timestamp: row.timestamp || Date.now()
      }));
    } catch (error) {
      console.error('Error getting significant thoughts:', error);
      return [];
    }
  }

  cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval as NodeJS.Timeout);
    }

    if (this.db) {
      this.db.close((err) => {
        if (err) {
          log.error('SQLiteSessionManager', 'Failed to close database', err);
        } else {
          log.info('SQLiteSessionManager', 'Database connection closed');
        }
      });
    }
  }

  cleanupOldSessions(): void {
    if (!this.isReady) return;

    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    this.db.run('DELETE FROM sessions WHERE last_activity < ?', [cutoffDate], function(err) {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to cleanup old sessions', err);
      } else if (this.changes > 0) {
        log.info('SQLiteSessionManager', `Cleaned up ${this.changes} old sessions`);
      }
    });
  }

  // ============================================================================
  // Individual Save Methods (Real-time)
  // ============================================================================

  saveQuestionRealtime(question: any): void {
    if (!this.isReady) {
      log.warn('SQLiteSessionManager', 'Database not ready, skipping question save');
      return;
    }

    const questionQuery = `
      INSERT OR REPLACE INTO questions
      (id, session_id, timestamp, question, category, importance, source, context_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      this.db.run(questionQuery, [
        question.id,
        this.currentSessionId,
        question.timestamp || Date.now(),
        question.question || question.content,
        question.category,
        question.importance || 0.5,
        question.source,
        this.compressData(question.context || {})
      ], (err) => {
        if (err) {
          log.error('SQLiteSessionManager', 'Failed to save question realtime', err);
        } else {
          log.debug('SQLiteSessionManager', `Question saved: ${question.id}`);
        }
      });
    } catch (error) {
      log.error('SQLiteSessionManager', 'Error in saveQuestionRealtime', error);
    }
  }

  saveThoughtCycleRealtime(thoughtCycle: any): void {
    if (!this.isReady) {
      log.warn('SQLiteSessionManager', 'Database not ready, skipping thought cycle save');
      return;
    }

    const cycleQuery = `
      INSERT OR REPLACE INTO thought_cycles
      (id, session_id, trigger_id, timestamp, duration, thoughts_data, synthesis_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      this.db.run(cycleQuery, [
        thoughtCycle.id,
        this.currentSessionId,
        thoughtCycle.trigger?.id || thoughtCycle.triggerId || null,
        thoughtCycle.timestamp || Date.now(),
        thoughtCycle.duration || null,
        this.compressData(thoughtCycle.thoughts || {}),
        this.compressData(thoughtCycle.synthesis || {})
      ], (err) => {
        if (err) {
          log.error('SQLiteSessionManager', 'Failed to save thought cycle realtime', err);
        } else {
          log.debug('SQLiteSessionManager', `Thought cycle saved: ${thoughtCycle.id}`);
        }
      });
    } catch (error) {
      log.error('SQLiteSessionManager', 'Error in saveThoughtCycleRealtime', error);
    }
  }

  updateSessionCounters(totalQuestions: number, totalThoughts: number, energy?: number): void {
    if (!this.isReady) return;

    const now = new Date().toISOString();
    const sessionQuery = `
      UPDATE sessions
      SET total_questions = ?, total_thoughts = ?, energy = COALESCE(?, energy),
          last_activity = ?, updated_at = ?
      WHERE session_id = ?
    `;

    try {
      this.db.run(sessionQuery, [
        totalQuestions,
        totalThoughts,
        energy,
        now,
        now,
        this.currentSessionId
      ], (err) => {
        if (err) {
          log.error('SQLiteSessionManager', 'Failed to update session counters', err);
        } else {
          log.debug('SQLiteSessionManager', `Session counters updated: Q=${totalQuestions}, T=${totalThoughts}`);
        }
      });
    } catch (error) {
      log.error('SQLiteSessionManager', 'Error in updateSessionCounters', error);
    }
  }

  // ============================================================================
  // Statistics and Data Retrieval Methods
  // ============================================================================

  getQuestions(limit: number = 100): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.isReady) {
        resolve([]);
        return;
      }

      const query = `
        SELECT * FROM questions
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;

      this.db.all(query, [this.currentSessionId, limit], (err, rows) => {
        if (err || !rows) {
          log.error('SQLiteSessionManager', 'Error getting questions', err);
          resolve([]);
          return;
        }

        const questions = rows.map((row: any) => ({
          id: row.id || '',
          question: row.question || '',
          category: row.category || '',
          importance: row.importance || 0,
          timestamp: row.timestamp || Date.now()
        }));
        resolve(questions);
      });
    });
  }

  // Synchronous version for backward compatibility (returns empty array and logs warning)
  getQuestionsSync(limit: number = 100): any[] {
    log.warn('SQLiteSessionManager', 'getQuestionsSync called - use async getQuestions instead');
    return [];
  }

  getThoughtCycles(limit: number = 100): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.isReady) {
        resolve([]);
        return;
      }

      const query = `
        SELECT * FROM thought_cycles
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;

      this.db.all(query, [this.currentSessionId, limit], (err, rows) => {
        if (err || !rows) {
          log.error('SQLiteSessionManager', 'Error getting thought cycles', err);
          resolve([]);
          return;
        }

        const cycles = rows.map((row: any) => ({
          id: row.id || '',
          synthesis: row.synthesis_data ? JSON.parse(row.synthesis_data) : null,
          confidence: row.confidence || 0,
          timestamp: row.timestamp || Date.now(),
          triggerType: row.trigger_type || '',
          processingTime: row.duration || 0
        }));
        resolve(cycles);
      });
    });
  }

  // Synchronous version for backward compatibility (returns empty array and logs warning)
  getThoughtCyclesSync(limit: number = 100): any[] {
    log.warn('SQLiteSessionManager', 'getThoughtCyclesSync called - use async getThoughtCycles instead');
    return [];
  }

  getStatistics(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.isReady) {
        resolve({ totalQuestions: 0, totalThoughts: 0, totalSessions: 0 });
        return;
      }

      let stats = { totalQuestions: 0, totalThoughts: 0, totalSessions: 0 };
      let completed = 0;
      const total = 3;

      const checkComplete = () => {
        completed++;
        if (completed === total) {
          resolve(stats);
        }
      };

      // Count questions for current session
      this.db.get('SELECT COUNT(*) as count FROM questions WHERE session_id = ?', [this.currentSessionId], (err, row: any) => {
        if (!err && row) {
          stats.totalQuestions = row.count || 0;
        }
        checkComplete();
      });

      // Count thought cycles for current session
      this.db.get('SELECT COUNT(*) as count FROM thought_cycles WHERE session_id = ?', [this.currentSessionId], (err, row: any) => {
        if (!err && row) {
          stats.totalThoughts = row.count || 0;
        }
        checkComplete();
      });

      // Count total sessions
      this.db.get('SELECT COUNT(*) as count FROM sessions', [], (err, row: any) => {
        if (!err && row) {
          stats.totalSessions = row.count || 0;
        }
        checkComplete();
      });
    });
  }

  // Synchronous version for backward compatibility (returns default values and logs warning)
  getStatisticsSync(): any {
    log.warn('SQLiteSessionManager', 'getStatisticsSync called - use async getStatistics instead');
    return { totalQuestions: 0, totalThoughts: 0, totalSessions: 0 };
  }

  // ============================================================================
  // Memory Evolution & Learning System
  // ============================================================================

  /**
   * Record a new memory pattern detected in consciousness cycles
   */
  recordMemoryPattern(patternType: string, patternData: any, contextTags: string[] = []): void {
    if (!this.isReady) return;

    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const query = `
      INSERT INTO memory_patterns (
        id, pattern_type, pattern_data, first_detected, last_reinforced,
        occurrence_count, strength, context_tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const now = Date.now();
    this.db.run(query, [
      patternId,
      patternType,
      JSON.stringify(patternData),
      now,
      now,
      1,
      0.5,
      JSON.stringify(contextTags)
    ], (err) => {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to record memory pattern', err);
      } else {
        log.debug('SQLiteSessionManager', `Memory pattern recorded: ${patternId} (${patternType})`);
      }
    });
  }

  /**
   * Reinforce an existing memory pattern
   */
  reinforceMemoryPattern(patternId: string, strengthIncrease: number = 0.1): void {
    if (!this.isReady) return;

    const query = `
      UPDATE memory_patterns
      SET occurrence_count = occurrence_count + 1,
          strength = MIN(1.0, strength + ?),
          last_reinforced = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    this.db.run(query, [strengthIncrease, Date.now(), patternId], (err) => {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to reinforce memory pattern', err);
      } else {
        log.debug('SQLiteSessionManager', `Memory pattern reinforced: ${patternId}`);
      }
    });
  }

  /**
   * Create a weighted memory entry for importance tracking
   */
  createMemoryWeight(memoryType: string, memoryId: string, weights: {
    importance?: number;
    emotional?: number;
    temporal?: number;
  } = {}): void {
    if (!this.isReady) return;

    const query = `
      INSERT INTO memory_weights (
        memory_type, memory_id, session_id, importance_weight,
        emotional_weight, temporal_weight, last_accessed
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.run(query, [
      memoryType,
      memoryId,
      this.currentSessionId,
      weights.importance || 0.5,
      weights.emotional || 0.5,
      weights.temporal || 1.0,
      Date.now()
    ], (err) => {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to create memory weight', err);
      } else {
        log.debug('SQLiteSessionManager', `Memory weight created: ${memoryType}/${memoryId}`);
      }
    });
  }

  /**
   * Record a consciousness insight derived from pattern analysis
   */
  recordConsciousnessInsight(insight: {
    content: string;
    type: string;
    confidence: number;
    evidence?: any[];
    derivedFrom?: string[];
    impact?: number;
  }): void {
    if (!this.isReady) return;

    const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const query = `
      INSERT INTO consciousness_insights (
        id, session_id, insight_content, insight_type, confidence_level,
        supporting_evidence, derived_from, impact_score, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.run(query, [
      insightId,
      this.currentSessionId,
      insight.content,
      insight.type,
      insight.confidence,
      JSON.stringify(insight.evidence || []),
      JSON.stringify(insight.derivedFrom || []),
      insight.impact || 0.5,
      Date.now()
    ], (err) => {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to record consciousness insight', err);
      } else {
        log.info('SQLiteSessionManager', `💡 Consciousness insight recorded: ${insight.type} (confidence: ${insight.confidence})`);
      }
    });
  }

  /**
   * Perform memory decay - reduce weights of memories over time
   */
  applyMemoryDecay(decayRate: number = 0.01): void {
    if (!this.isReady) return;

    const now = Date.now();
    const decayQuery = `
      UPDATE memory_weights
      SET temporal_weight = MAX(0.1, temporal_weight * (1 - ?)),
          decay_applied = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE decay_applied < ? - 86400000  -- Apply decay if last applied > 24 hours ago
    `;

    this.db.run(decayQuery, [decayRate, now, now], function(err) {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to apply memory decay', err);
      } else {
        log.debug('SQLiteSessionManager', `Memory decay applied to ${this.changes} entries`);
      }
    });

    // Also decay memory pattern strength
    const patternDecayQuery = `
      UPDATE memory_patterns
      SET strength = MAX(0.1, strength * (1 - ?)),
          updated_at = CURRENT_TIMESTAMP
      WHERE last_reinforced < ? - 604800000  -- Decay patterns not reinforced in 7 days
    `;

    this.db.run(patternDecayQuery, [decayRate * 0.5, now], function(err) {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to apply pattern decay', err);
      } else {
        log.debug('SQLiteSessionManager', `Pattern decay applied to ${this.changes} patterns`);
      }
    });
  }

  /**
   * Deliberate forgetting - remove low-importance memories
   */
  performConsciousForgetting(importanceThreshold: number = 0.2): void {
    if (!this.isReady) return;

    // Find memories to forget
    const findQuery = `
      SELECT memory_type, memory_id, importance_weight, emotional_weight, temporal_weight
      FROM memory_weights
      WHERE (importance_weight * 0.4 + emotional_weight * 0.3 + temporal_weight * 0.3) < ?
      AND access_count < 3
    `;

    this.db.all(findQuery, [importanceThreshold], (err, rows: any[]) => {
      if (err) {
        log.error('SQLiteSessionManager', 'Failed to find memories for forgetting', err);
        return;
      }

      if (rows.length === 0) {
        log.debug('SQLiteSessionManager', 'No memories qualify for conscious forgetting');
        return;
      }

      rows.forEach(memory => {
        // Create forgetting event record
        const forgettingQuery = `
          INSERT INTO forgetting_events (
            session_id, forgotten_memory_type, forgotten_memory_id,
            forgetting_reason, importance_threshold, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;

        this.db.run(forgettingQuery, [
          this.currentSessionId,
          memory.memory_type,
          memory.memory_id,
          'deliberate_pruning',
          importanceThreshold,
          Date.now()
        ]);

        // Remove the memory weight
        const deleteQuery = `DELETE FROM memory_weights WHERE memory_type = ? AND memory_id = ?`;
        this.db.run(deleteQuery, [memory.memory_type, memory.memory_id]);
      });

      log.info('SQLiteSessionManager', `🧠 Conscious forgetting completed: ${rows.length} memories pruned`);
    });
  }

  /**
   * Get memory patterns for analysis
   */
  getMemoryPatterns(limit: number = 20): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        resolve([]);
        return;
      }

      const query = `
        SELECT * FROM memory_patterns
        ORDER BY strength DESC, occurrence_count DESC
        LIMIT ?
      `;

      this.db.all(query, [limit], (err, rows) => {
        if (err) {
          log.error('SQLiteSessionManager', 'Failed to get memory patterns', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Get consciousness insights for meta-cognitive analysis
   */
  getConsciousnessInsights(limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        resolve([]);
        return;
      }

      const query = `
        SELECT * FROM consciousness_insights
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;

      this.db.all(query, [this.currentSessionId, limit], (err, rows) => {
        if (err) {
          log.error('SQLiteSessionManager', 'Failed to get consciousness insights', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}

export { SQLiteSessionManager, SessionData, SessionMetadata };
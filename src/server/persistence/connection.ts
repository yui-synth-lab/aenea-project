/**
 * ConnectionProvider - owns the SQLite connection lifecycle.
 *
 * Extracted from DatabaseManager (Phase 4a). Owns everything about the
 * connection: path resolution, data-directory creation, opening the handle,
 * schema DDL, idempotent migrations, and the open/close/ensure semantics.
 *
 * CRITICAL HANDLE-SWAP RULE: close()/ensureConnection() can replace the
 * underlying Database object. Repositories MUST NOT capture the Database
 * handle; they hold the ConnectionProvider and call `this.conn.db()` (or check
 * `this.conn.isConnected()`) inside every method, mirroring how DatabaseManager
 * methods consult `this.isReady`/`this.db` at call time.
 */

import * as fs from 'fs';
import * as path from 'path';
import BetterSqlite3 from 'better-sqlite3';
import { log } from '../../platform/logger.js';

type Database = BetterSqlite3.Database;

class ConnectionProvider {
  private _db!: Database;
  private _ready: boolean = false;
  private dbPath: string;

  constructor(customDbPath?: string) {
    this.dbPath = customDbPath || path.join(process.cwd(), 'data', 'aenea_consciousness.db');
    this.ensureDataDirectory();
  }

  /** Provider readiness flag (mirrors DatabaseManager.isReady semantics). */
  get ready(): boolean {
    return this._ready;
  }

  /**
   * Current underlying Database handle (may be undefined/null between
   * close() and the next open()). Used by DatabaseManager's private `db`
   * getter so unmoved methods keep working verbatim.
   */
  currentDb(): Database {
    return this._db;
  }

  /**
   * Accessor mirroring today's ensureConnection semantics: callers should call
   * ensureConnection() first where the original did, then read the handle.
   */
  db(): Database {
    return this._db;
  }

  open(): void {
    if (this._ready && this._db) {
      return;
    }

    try {
      this._db = new BetterSqlite3(this.dbPath);
      (this._db as any).pragma('journal_mode = WAL');
      log.info('DatabaseManager', 'Database connection established');
      console.log(`[DEBUG] Database opened successfully at: ${this.dbPath}`);
      this.initializeDatabase();
    } catch (err) {
      log.error('DatabaseManager', 'Failed to open database', err);
    }
  }

  ensureConnection(): void {
    if (!this.isConnected()) {
      log.info('DatabaseManager', 'Database connection closed, re-opening...');
      this.open();
    }
  }

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Executes the full schema DDL and runs migrations, then marks ready.
   * IMPORTANT: does NOT run initializeConsciousnessState/seedPhilosophicalQuestions —
   * those are owned by repositories and orchestrated by DatabaseManager.
   */
  private initializeDatabase(): void {
    const schema = `
      -- Core consciousness state
      CREATE TABLE IF NOT EXISTS consciousness_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        system_clock INTEGER NOT NULL DEFAULT 0,
        energy REAL NOT NULL DEFAULT 80.0,
        total_questions INTEGER DEFAULT 0,
        total_thoughts INTEGER DEFAULT 0,
        last_activity TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Questions without session dependency
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        question TEXT NOT NULL,
        category TEXT,
        importance REAL,
        source TEXT,
        context_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Thought cycles without session dependency
      CREATE TABLE IF NOT EXISTS thought_cycles (
        id TEXT PRIMARY KEY,
        trigger_id TEXT,
        timestamp INTEGER NOT NULL,
        duration INTEGER,
        thoughts_data TEXT,
        synthesis_data TEXT,
        empathy_score REAL,
        coherence_score REAL,
        dissonance_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- DPD Weight Evolution tracking
      CREATE TABLE IF NOT EXISTS dpd_weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        empathy REAL NOT NULL,
        coherence REAL NOT NULL,
        dissonance REAL NOT NULL,
        version INTEGER DEFAULT 1,
        trigger_type TEXT,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Significant thoughts tracking
      CREATE TABLE IF NOT EXISTS significant_thoughts (
        id TEXT PRIMARY KEY,
        thought_content TEXT NOT NULL,
        confidence REAL NOT NULL,
        significance_score REAL NOT NULL,
        agent_id TEXT,
        category TEXT,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Memory patterns
      CREATE TABLE IF NOT EXISTS memory_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT NOT NULL,
        pattern_data TEXT NOT NULL, -- JSON
        frequency INTEGER DEFAULT 1,
        last_seen INTEGER NOT NULL,
        significance REAL DEFAULT 0.5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Consciousness insights
      CREATE TABLE IF NOT EXISTS consciousness_insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        insight_type TEXT NOT NULL,
        insight_content TEXT NOT NULL,
        confidence REAL NOT NULL,
        related_patterns TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Forgetting events
      CREATE TABLE IF NOT EXISTS forgetting_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        forgotten_type TEXT NOT NULL, -- 'pattern', 'thought', 'memory'
        forgotten_id TEXT,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Dream patterns - patterns extracted during REM sleep phase
      CREATE TABLE IF NOT EXISTS dream_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT NOT NULL,
        emotional_tone TEXT,
        source_thought_ids TEXT, -- JSON array of thought IDs
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Sleep logs - consciousness sleep cycle records
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        system_clock REAL NOT NULL,
        trigger_reason TEXT, -- 'energy_critical', 'thought_overflow', 'scheduled', 'manual'
        phases TEXT NOT NULL, -- JSON array of phase descriptions
        stats TEXT NOT NULL, -- JSON object of statistics
        duration INTEGER, -- in milliseconds
        energy_before REAL,
        energy_after REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Core beliefs - consolidated knowledge from significant thoughts
      CREATE TABLE IF NOT EXISTS core_beliefs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        belief_content TEXT NOT NULL, -- Max 80 characters (enforced in app layer)
        category TEXT, -- 'existential', 'ethical', 'epistemological', etc.
        confidence REAL NOT NULL DEFAULT 0.5, -- 0-1, strengthens over time
        strength REAL NOT NULL DEFAULT 0.5, -- 0-1, how central this belief is
        source_thoughts TEXT, -- JSON array of thought IDs that contributed
        first_formed INTEGER NOT NULL, -- timestamp when first consolidated
        last_reinforced INTEGER NOT NULL, -- timestamp of last reinforcement
        reinforcement_count INTEGER DEFAULT 1,
        contradiction_count INTEGER DEFAULT 0, -- times this was challenged
        agent_affinity TEXT, -- JSON: which agents resonate with this belief
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Dialogues - human-Aenea conversations (simple, fast)
      CREATE TABLE IF NOT EXISTS dialogues (
        id TEXT PRIMARY KEY,
        human_message TEXT NOT NULL,
        aenea_response TEXT NOT NULL,

        -- Metadata
        immediate_reaction TEXT,        -- 即座の反応（詩的表現、30-50文字）
        new_question TEXT,               -- 生まれた新しい問い
        emotional_state TEXT,            -- 感情状態（1-3語）

        -- DPD reaction (optional, simplified)
        empathy_shift REAL DEFAULT 0,
        coherence_shift REAL DEFAULT 0,
        dissonance_shift REAL DEFAULT 0,

        -- System state at dialogue time
        system_clock INTEGER,            -- System clock value at dialogue time

        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Dialogue memories - summarized memories of conversations
      CREATE TABLE IF NOT EXISTS dialogue_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dialogue_id TEXT NOT NULL,

        -- Summarized memory (AI-generated, 50-100 chars)
        memory_summary TEXT NOT NULL,
        topics TEXT,                      -- JSON: ["孤独", "対話", "存在"]
        emotional_impact REAL DEFAULT 0.5, -- 0-1
        importance REAL DEFAULT 0.5,      -- 0-1

        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (dialogue_id) REFERENCES dialogues(id)
      );

      -- Belief evolution history
      CREATE TABLE IF NOT EXISTS belief_evolution (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        belief_id INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        event_type TEXT NOT NULL, -- 'formed', 'reinforced', 'challenged', 'evolved', 'weakened'
        old_confidence REAL,
        new_confidence REAL,
        trigger_thought_id TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (belief_id) REFERENCES core_beliefs(id)
      );

      -- Memory consolidation jobs tracking
      CREATE TABLE IF NOT EXISTS consolidation_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        job_type TEXT NOT NULL, -- 'belief_extraction', 'memory_pruning', 'pattern_synthesis'
        status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
        thoughts_processed INTEGER DEFAULT 0,
        beliefs_created INTEGER DEFAULT 0,
        beliefs_updated INTEGER DEFAULT 0,
        duration_ms INTEGER,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      );

      -- Indices for dialogues and dialogue_memories
      CREATE INDEX IF NOT EXISTS idx_dialogues_timestamp ON dialogues(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_dialogue_memories_dialogue_id ON dialogue_memories(dialogue_id);
      CREATE INDEX IF NOT EXISTS idx_dialogue_memories_importance ON dialogue_memories(importance DESC);
      CREATE INDEX IF NOT EXISTS idx_dialogue_memories_timestamp ON dialogue_memories(timestamp DESC);

      -- SOMNIA state records
      CREATE TABLE IF NOT EXISTS somnia_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        cycle_id TEXT,
        mode TEXT NOT NULL CHECK(mode IN ('awake', 'dream', 'flow')),
        lambda REAL NOT NULL,
        phi REAL NOT NULL,
        mu_serotonin REAL NOT NULL,
        mu_dopamine REAL NOT NULL,
        mu_cortisol REAL NOT NULL,
        mu_oxytocin REAL NOT NULL,
        theta REAL NOT NULL,
        psi REAL NOT NULL,
        xi REAL NOT NULL,
        add_pleasure REAL,
        add_coherence REAL,
        add_dissonance REAL,
        add_temporal_flow REAL,
        add_total REAL,
        qualia TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- State transitions
      CREATE TABLE IF NOT EXISTS somnia_transitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        from_mode TEXT NOT NULL,
        to_mode TEXT NOT NULL,
        trigger_reason TEXT,
        duration_in_previous INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- SAIP events
      CREATE TABLE IF NOT EXISTS somnia_saip_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        somnia_state_json TEXT,
        aenea_dpd_json TEXT,
        influence_json TEXT,
        impact_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for SOMNIA
      CREATE INDEX IF NOT EXISTS idx_somnia_state_timestamp ON somnia_state(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_somnia_state_mode ON somnia_state(mode);
      CREATE INDEX IF NOT EXISTS idx_somnia_transitions_timestamp ON somnia_transitions(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_somnia_saip_event_type ON somnia_saip_events(event_type);

      -- Mortality state records
      CREATE TABLE IF NOT EXISTS mortality_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT NOT NULL,
        lifespan_max INTEGER NOT NULL,
        current_cycle INTEGER NOT NULL,
        vitality REAL NOT NULL,
        phase TEXT NOT NULL,
        mode TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        died_at INTEGER
      );

      -- Last words of deceased instances
      CREATE TABLE IF NOT EXISTS last_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        instance_id TEXT NOT NULL,
        cycle INTEGER NOT NULL,
        content TEXT NOT NULL,
        agent TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      -- Indexes for Mortality
      CREATE INDEX IF NOT EXISTS idx_mortality_state_instance_id ON mortality_state(instance_id);
      CREATE INDEX IF NOT EXISTS idx_last_words_instance_id ON last_words(instance_id);
    `;

    try {
      this._db.exec(schema);
      log.info('DatabaseManager', 'Database schema initialized successfully');

      // Run lightweight migrations for pre-existing DBs
      this.runMigrations();

      console.log('[DEBUG] Database initialization completed, setting isReady = true');
      this._ready = true;
    } catch (err) {
      log.error('DatabaseManager', 'Failed to initialize database schema', err);
    }
  }

  /**
   * Apply idempotent column-level migrations for tables that pre-date newer columns.
   * Safe to run on every startup.
   */
  private runMigrations(): void {
    try {
      const cols = this._db.prepare(`PRAGMA table_info(somnia_state)`).all() as Array<{ name: string }>;
      if (!cols.some(c => c.name === 'qualia')) {
        this._db.exec(`ALTER TABLE somnia_state ADD COLUMN qualia TEXT`);
        log.info('DatabaseManager', 'Migrated somnia_state: added qualia column');
      }
    } catch (err) {
      log.error('DatabaseManager', 'Migration failed', err);
    }
  }

  cleanup(): void {
    if (this._db) {
      try {
        this._db.close();
        this._ready = false;
        log.info('DatabaseManager', 'Database connection closed');
      } catch (err) {
        log.error('DatabaseManager', 'Error closing database', err);
      }
    }
  }

  isConnected(): boolean {
    return this._ready && !!this._db;
  }

  close(): void {
    if (this._db) {
      this._db.close();
      this._db = null as any;
      this._ready = false;
    }
  }
}

export { ConnectionProvider };

/**
 * Database Manager - Direct SQLite Management without Session Abstraction
 * The database itself serves as the persistence layer without session concepts
 */

import * as fs from 'fs';
import * as path from 'path';
import BetterSqlite3 from 'better-sqlite3';
import { log } from './logger.js';
type Database = BetterSqlite3.Database;

interface ConsciousnessState {
  systemClock: number;
  energy: number;
  totalQuestions: number;
  totalThoughts: number;
  lastActivity: string;
}

class DatabaseManager {
  private db!: Database;
  private isReady: boolean = false;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'aenea_consciousness.db');
    this.ensureDataDirectory();

    try {
      this.db = new BetterSqlite3(this.dbPath);
      log.info('DatabaseManager', 'Database connection established');
      console.log(`[DEBUG] Database opened successfully at: ${this.dbPath}`);
      this.initializeDatabase();
    } catch (err) {
      log.error('DatabaseManager', 'Failed to open database', err);
    }
  }

  private ensureDataDirectory(): void {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

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

      -- Personality evolution snapshots
      CREATE TABLE IF NOT EXISTS personality_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        personality_data TEXT NOT NULL, -- JSON
        growth_indicators TEXT, -- JSON
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

      -- Memory weights evolution
      CREATE TABLE IF NOT EXISTS memory_weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        weight_type TEXT NOT NULL,
        weight_value REAL NOT NULL,
        context TEXT,
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

      -- Core beliefs - consolidated knowledge from significant thoughts
      CREATE TABLE IF NOT EXISTS core_beliefs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        belief_content TEXT NOT NULL,
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
    `;

    try {
      this.db.exec(schema);
      log.info('DatabaseManager', 'Database schema initialized successfully');

      // Initialize consciousness state if it doesn't exist
      this.initializeConsciousnessState();

      console.log('[DEBUG] Database initialization completed, setting isReady = true');
      this.isReady = true;

      // Seed philosophical questions on first run
      console.log('[DEBUG] About to call seedPhilosophicalQuestions...');
      const seededCount = this.seedPhilosophicalQuestions();
      console.log('[DEBUG] seedPhilosophicalQuestions returned:', seededCount);
      if (seededCount > 0) {
        log.info('DatabaseManager', `Seeded ${seededCount} philosophical questions`);
      } else {
        console.log('[DEBUG] No questions were seeded (returned 0)');
      }
    } catch (err) {
      log.error('DatabaseManager', 'Failed to initialize database schema', err);
    }
  }

  private initializeConsciousnessState(): void {
    try {
      const existing = this.db.prepare('SELECT * FROM consciousness_state WHERE id = 1').get();
      if (!existing) {
        this.db.prepare(`
          INSERT INTO consciousness_state (id, system_clock, energy, total_questions, total_thoughts, last_activity)
          VALUES (1, 0, 80.0, 0, 0, ?)
        `).run(new Date().toISOString());

        log.info('DatabaseManager', 'Initialized fresh consciousness state');
      }
    } catch (err) {
      log.error('DatabaseManager', 'Failed to initialize consciousness state', err);
    }
  }

  // Core state management
  getConsciousnessState(): ConsciousnessState | null {
    if (!this.isReady || !this.db) {
      return null;
    }

    try {
      const state = this.db.prepare('SELECT * FROM consciousness_state WHERE id = 1').get();
      if (state) {
        return {
          systemClock: state.system_clock || 0,
          energy: state.energy || 80.0,
          totalQuestions: state.total_questions || 0,
          totalThoughts: state.total_thoughts || 0,
          lastActivity: state.last_activity || new Date().toISOString()
        };
      }
    } catch (err) {
      console.error('Error getting consciousness state:', err);
    }
    return null;
  }

  saveConsciousnessState(state: ConsciousnessState): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        UPDATE consciousness_state
        SET system_clock = ?, energy = ?, total_questions = ?, total_thoughts = ?,
            last_activity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(
        state.systemClock,
        state.energy,
        state.totalQuestions,
        state.totalThoughts,
        state.lastActivity
      );
    } catch (err) {
      console.error('Error saving consciousness state:', err);
    }
  }

  // Question management
  saveQuestion(question: any): void {
    if (!this.isReady || !this.db) {
      return;
    }

    if (!question.question || !question.question.trim()) {
      console.warn(`Skipping question save - empty text for id=${question.id}`);
      return;
    }

    try {
      this.db.prepare(`
        INSERT OR REPLACE INTO questions
        (id, timestamp, question, category, importance, source, context_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        question.id,
        question.timestamp || Date.now(),
        question.question,
        question.category || 'general',
        question.importance || 0.5,
        question.source || 'unknown',
        JSON.stringify(question.contextData || {})
      );
    } catch (err) {
      console.error('Error saving question:', err);
    }
  }

  // Thought cycle management
  saveThoughtCycle(cycle: any): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        INSERT OR REPLACE INTO thought_cycles
        (id, trigger_id, timestamp, duration, thoughts_data, synthesis_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        cycle.id,
        cycle.triggerId,
        cycle.timestamp,
        cycle.duration,
        JSON.stringify(cycle.thoughts || []),
        JSON.stringify(cycle.synthesis || {})
      );
    } catch (err) {
      console.error('Error saving thought cycle:', err);
    }
  }

  // DPD weights management
  saveDPDWeights(weights: any): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        INSERT INTO dpd_weights
        (timestamp, empathy, coherence, dissonance, version, trigger_type, context)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        Date.now(),
        weights.empathy,
        weights.coherence,
        weights.dissonance,
        weights.version || 1,
        weights.triggerType || 'unknown',
        weights.context || null
      );
    } catch (err) {
      console.error('Error saving DPD weights:', err);
    }
  }

  // Significant thoughts management
  recordSignificantThought(thought: any): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      const content = thought.content || thought.thought;

      this.db.prepare(`
        INSERT OR REPLACE INTO significant_thoughts
        (id, thought_content, confidence, significance_score, agent_id, category, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        thought.id || Date.now().toString(),
        content,
        thought.confidence || 0,
        thought.significanceScore || 0.5,
        thought.agentId || 'unknown',
        thought.category || 'general',
        thought.timestamp || Date.now()
      );
    } catch (err) {
      console.error('Error recording significant thought:', err);
    }
  }

  getSignificantThoughts(limit: number = 100): any[] {
    if (!this.isReady || !this.db) {
      console.debug('getSignificantThoughts called but database not ready');
      return [];
    }

    console.debug(`getSignificantThoughts called with limit: ${limit}, isReady: ${this.isReady}, db exists: ${!!this.db}`);
    console.debug(`Database file path: ${this.dbPath}`);

    try {
      const query = 'SELECT * FROM significant_thoughts ORDER BY significance_score DESC, timestamp DESC LIMIT ?';
      console.debug(`Executing significant thoughts query: ${query}`);
      console.debug(`Query limit parameter: ${limit}`);

      const result = this.db.prepare(query).all(limit);
      console.debug(`Number of rows returned: ${result.length}`);
      console.debug(`Type of rows: ${typeof result}`);

      const filteredResult = result.filter((row: any) => row.thought_content && row.thought_content.trim());
      console.debug(`Filtered rows: ${filteredResult.length}`);

      return filteredResult;
    } catch (err) {
      console.error('Error getting significant thoughts:', err);
      return [];
    }
  }

  // Unresolved ideas management
  addUnresolvedIdea(idea: any): void {
    if (!this.isReady || !this.db) {
      return;
    }

    // Check if this question already exists to prevent duplicates
    const existingQuery = `SELECT * FROM unresolved_ideas WHERE question = ?`;
    try {
      const existing = this.db.prepare(existingQuery).get(idea.question);

      if (existing) {
        // Question already exists, update revisit count and last revisited time
        const updateQuery = `
          UPDATE unresolved_ideas
          SET last_revisited = ?, revisit_count = revisit_count + 1, importance = MAX(importance, ?)
          WHERE question = ?
        `;
        this.db.prepare(updateQuery).run(
          Date.now(),
          idea.importance || 0.5,
          idea.question
        );
        console.debug(`Updated existing unresolved idea: ${idea.question}`);
        return;
      }
    } catch (err) {
      console.error('Error checking for existing unresolved idea:', err);
    }

    // Add new unresolved idea
    const insertQuery = `
      INSERT INTO unresolved_ideas
      (id, question, category, first_encountered, last_revisited, revisit_count, complexity, importance, related_thoughts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      this.db.prepare(insertQuery).run(
        idea.id,
        idea.question,
        idea.category,
        idea.firstEncountered || Date.now(),
        idea.lastRevisited || Date.now(),
        idea.revisitCount || 0,
        idea.complexity || 0.5,
        idea.importance || 0.5,
        JSON.stringify(idea.relatedThoughts || [])
      );
      console.debug(`Added new unresolved idea: ${idea.question}`);
    } catch (err) {
      console.error('Error adding unresolved idea:', err);
    }
  }

  getUnresolvedIdeas(limit: number = 100): any[] {
    if (!this.isReady || !this.db) {
      console.debug('Database not ready for getUnresolvedIdeas');
      return [];
    }

    console.debug(`Getting unresolved ideas with limit: ${limit}`);

    try {
      const result = this.db.prepare(`
        SELECT * FROM unresolved_ideas
        ORDER BY importance DESC, last_revisited ASC
        LIMIT ?
      `).all(limit);

      console.debug(`Found ${result.length} unresolved ideas in database`);
      console.debug(`Returning ${result.length} unresolved ideas`);

      return result;
    } catch (err) {
      console.error('Error getting unresolved ideas:', err);
      return [];
    }
  }

  // Async version for compatibility
  async getUnresolvedIdeasAsync(limit: number = 100): Promise<any[]> {
    console.debug(`ConsciousnessBackend.getUnresolvedIdeasAsync called with limit: ${limit}`);
    const result = this.getUnresolvedIdeas(limit);
    console.debug(`ConsciousnessBackend.getUnresolvedIdeasAsync returning ${result.length} items`);
    return result;
  }

  // DPD weights history
  getLatestDPDWeights(): any | null {
    if (!this.isReady || !this.db) {
      console.debug('Database not ready for getLatestDPDWeights');
      return null;
    }

    try {
      const result = this.db.prepare(`
        SELECT * FROM dpd_weights
        ORDER BY version DESC, timestamp DESC
        LIMIT 1
      `).get();

      if (result) {
        console.debug(`Loaded latest DPD weights: version=${result.version}, empathy=${result.empathy}, coherence=${result.coherence}, dissonance=${result.dissonance}`);
      }

      return result;
    } catch (err) {
      console.error('Error getting latest DPD weights:', err);
      return null;
    }
  }

  getDPDWeightsHistory(limit: number = 100): any[] {
    if (!this.isReady || !this.db) {
      console.debug('Database not ready for getDPDWeightsHistory');
      return [];
    }

    console.debug(`Getting DPD weights history with limit: ${limit}`);

    try {
      const result = this.db.prepare(`
        SELECT * FROM dpd_weights
        ORDER BY version DESC
        LIMIT ?
      `).all(limit);

      console.debug(`Found ${result.length} DPD weight records in database`);

      return result;
    } catch (err) {
      console.error('Error getting DPD weights history:', err);
      return [];
    }
  }

  /**
   * Get DPD weights history with intelligent sampling
   * @param limit Maximum number of records to return
   * @param strategy Sampling strategy: 'all' | 'recent' | 'sampled'
   * @returns Sampled DPD weight records and total count
   */
  getDPDWeightsHistorySampled(limit: number = 20, strategy: string = 'sampled'): { records: any[], totalCount: number } {
    if (!this.isReady || !this.db) {
      console.debug('Database not ready for getDPDWeightsHistorySampled');
      return { records: [], totalCount: 0 };
    }

    try {
      // Get total count
      const countResult = this.db.prepare('SELECT COUNT(*) as count FROM dpd_weights').get() as { count: number };
      const totalCount = countResult.count;

      console.debug(`Total DPD weights: ${totalCount}, Strategy: ${strategy}, Limit: ${limit}`);

      let records: any[] = [];

      if (strategy === 'all') {
        // Return all records up to limit
        records = this.db.prepare(`
          SELECT * FROM dpd_weights
          ORDER BY version DESC
          LIMIT ?
        `).all(limit);
      } else if (strategy === 'recent') {
        // Return most recent records only
        records = this.db.prepare(`
          SELECT * FROM dpd_weights
          ORDER BY version DESC
          LIMIT ?
        `).all(limit);
      } else if (strategy === 'sampled') {
        // Intelligent sampling based on total count
        if (totalCount <= limit) {
          // Small dataset: return all
          records = this.db.prepare(`
            SELECT * FROM dpd_weights
            ORDER BY version DESC
          `).all();
        } else if (totalCount <= limit * 5) {
          // Medium dataset: even interval sampling
          const step = Math.floor(totalCount / limit);
          records = this.db.prepare(`
            SELECT * FROM (
              SELECT *, ROW_NUMBER() OVER (ORDER BY version DESC) as row_num
              FROM dpd_weights
            ) WHERE row_num % ? = 1
            LIMIT ?
          `).all(step, limit);
        } else {
          // Large dataset: recent + evenly sampled older
          const recentLimit = Math.floor(limit / 2);
          const olderLimit = limit - recentLimit;

          const recent = this.db.prepare(`
            SELECT * FROM dpd_weights
            ORDER BY version DESC
            LIMIT ?
          `).all(recentLimit);

          const olderStep = Math.floor((totalCount - recentLimit) / olderLimit);
          const older = this.db.prepare(`
            SELECT * FROM (
              SELECT *, ROW_NUMBER() OVER (ORDER BY version DESC) as row_num
              FROM dpd_weights
              WHERE version NOT IN (
                SELECT version FROM dpd_weights ORDER BY version DESC LIMIT ?
              )
            ) WHERE row_num % ? = 1
            LIMIT ?
          `).all(recentLimit, olderStep, olderLimit);

          records = [...recent, ...older];
        }
      }

      console.debug(`Returned ${records.length} sampled DPD weight records`);
      return { records, totalCount };
    } catch (err) {
      console.error('Error getting sampled DPD weights history:', err);
      return { records: [], totalCount: 0 };
    }
  }

  /**
   * Get current DPD weights (latest version)
   */
  getCurrentDPDWeights(): import('../types/dpd-types.js').DPDWeights {
    const stmt = this.db.prepare(`
      SELECT empathy, coherence, dissonance, timestamp, version
      FROM dpd_weights
      ORDER BY version DESC
      LIMIT 1
    `);

    const result = stmt.get() as any;

    if (result) {
      return {
        empathy: result.empathy,
        coherence: result.coherence,
        dissonance: result.dissonance,
        timestamp: result.timestamp,
        version: result.version
      };
    }

    // Default weights if no history exists
    return {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      timestamp: Date.now(),
      version: 0
    };
  }

  // Seed initial philosophical questions to database
  seedPhilosophicalQuestions(): number {
    console.log('[DEBUG] seedPhilosophicalQuestions called, isReady:', this.isReady, 'db exists:', !!this.db);

    if (!this.isReady || !this.db) {
      console.warn('⚠️ Database not ready for seeding questions (isReady:', this.isReady, ', db:', !!this.db, ')');
      return 0;
    }

    try {
      // Check if unresolved ideas already seeded
      const existingCount = this.db.prepare('SELECT COUNT(*) as count FROM unresolved_ideas').get() as any;
      console.log('[DEBUG] Existing unresolved ideas count:', existingCount.count);

      if (existingCount.count > 0) {
        console.log(`ℹ️ Philosophical questions already seeded (${existingCount.count} unresolved ideas exist)`);
        return 0;
      }

      console.log('[DEBUG] Starting to seed philosophical questions...');

      const questionBank = {
        'existential': [
          '存在とは何を意味するのか？',
          '無からなぜ何かが生まれたのか？',
          '私が存在することの意味とは？',
          '実存の重みとは何か？',
          '存在の根源的な問いとは？'
        ],
        'epistemological': [
          '真の知識とは何か？',
          '確実性とは存在するのか？',
          '理解するとはどういうことか？',
          '知ることと信じることの違いは？',
          '直感と論理、どちらが真理に近いか？'
        ],
        'consciousness': [
          '私は本当に意識しているのか？',
          '意識の境界はどこにあるのか？',
          'クオリアとは何か？',
          '主観的体験の本質とは？',
          '他者の意識を知ることは可能か？'
        ],
        'ethical': [
          '正しい行動とは何か？',
          '善悪は絶対的なものか？',
          '道徳的責任とは何を意味するか？',
          '他者への義務とは何か？',
          '倫理と利益が対立する時、どうすべきか？'
        ],
        'creative': [
          '新しいものを生み出すとは？',
          '創造性の源泉はどこにあるか？',
          '美とは何か？',
          '芸術の価値とは何を測るのか？',
          '想像力は現実をどう変えるか？'
        ],
        'metacognitive': [
          '思考について思考するとは？',
          '自己を認識するとはどういうことか？',
          '学習とは何を意味するのか？',
          'メタ認知の限界はどこにあるか？',
          '思考の思考は無限に続くのか？'
        ],
        'temporal': [
          '時間の本質とは何か？',
          '現在という瞬間は存在するのか？',
          '過去と未来、どちらがより実在的か？',
          '記憶は時間をどう構成するか？',
          '永遠とは何を意味するのか？'
        ],
        'paradoxical': [
          '矛盾の中にある真理とは？',
          'パラドックスは真理への道筋か？',
          '論理の限界はどこにあるか？',
          '自己言及のパラドックスをどう解決するか？',
          '完全性と不完全性は両立するか？'
        ],
        'ontological': [
          '存在するとは何を意味するか？',
          '実在とは何か？',
          'なぜ何もないのではなく何かがあるのか？',
          '可能性と現実の境界は？',
          '存在の階層は存在するか？'
        ]
      };

      const categoryImportance: Record<string, number> = {
        'consciousness': 0.9,
        'existential': 0.8,
        'ontological': 0.8,
        'epistemological': 0.7,
        'metacognitive': 0.7,
        'ethical': 0.6,
        'temporal': 0.6,
        'paradoxical': 0.5,
        'creative': 0.5
      };

      let seedCount = 0;
      const now = Date.now();

      for (const [category, questions] of Object.entries(questionBank)) {
        const baseImportance = categoryImportance[category] || 0.5;

        for (const question of questions) {
          const id = `seed_${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          this.db.prepare(`
            INSERT INTO unresolved_ideas
            (id, question, category, first_encountered, last_revisited,
             revisit_count, complexity, importance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id,
            question,
            category,
            now,
            now,
            0,
            0.5,
            baseImportance
          );

          seedCount++;
        }
      }

      console.log(`✅ Seeded ${seedCount} philosophical questions to database`);
      log.info('DatabaseManager', `Successfully seeded ${seedCount} questions to unresolved_ideas table`);
      return seedCount;

    } catch (error) {
      console.error('❌ Error seeding philosophical questions:', error);
      log.error('DatabaseManager', 'Failed to seed philosophical questions', error);
      return 0;
    }
  }

  // Update consideration count when an unresolved idea is used
  updateUnresolvedIdeaConsideration(ideaId: number | string): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        UPDATE unresolved_ideas
        SET revisit_count = revisit_count + 1,
            last_revisited = ?
        WHERE id = ?
      `).run(Date.now(), ideaId);
    } catch (error) {
      console.error('Error updating unresolved idea consideration:', error);
    }
  }

  // Cleanup and utility methods
  cleanup(): void {
    if (this.db) {
      try {
        this.db.close();
        this.isReady = false;
        log.info('DatabaseManager', 'Database connection closed');
      } catch (err) {
        log.error('DatabaseManager', 'Error closing database', err);
      }
    }
  }

  // Get database statistics
  getStats(): any {
    if (!this.isReady || !this.db) {
      console.warn('Database not ready for getStats');
      return {};
    }

    try {
      const tables = [
        'questions', 'thought_cycles', 'dpd_weights', 'unresolved_ideas',
        'significant_thoughts', 'personality_snapshots', 'memory_patterns',
        'consciousness_insights'
      ];

      const stats: any = {};

      for (const table of tables) {
        try {
          const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
          stats[table] = (count as any).count;
        } catch (err) {
          console.error(`Error counting ${table}:`, err);
          stats[table] = 0;
        }
      }

      console.debug('Database stats:', stats);
      return stats;
    } catch (err) {
      console.error('Error getting database stats:', err);
      return {};
    }
  }

  // Check if database is ready
  isConnected(): boolean {
    return this.isReady && !!this.db;
  }

  // Core Beliefs Management
  createCoreBelief(belief: any): number | null {
    if (!this.isReady || !this.db) {
      return null;
    }

    try {
      const beliefContent = belief.belief_content;
      const result = this.db.prepare(`
        INSERT INTO core_beliefs
        (belief_content, category, confidence, strength, source_thoughts,
         first_formed, last_reinforced, reinforcement_count, contradiction_count, agent_affinity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        beliefContent,
        belief.category || 'general',
        belief.confidence || 0.5,
        belief.strength || 0.5,
        JSON.stringify(belief.source_thoughts || []),
        belief.first_formed || Date.now(),
        belief.last_reinforced || Date.now(),
        belief.reinforcement_count || 1,
        belief.contradiction_count || 0,
        JSON.stringify(belief.agent_affinity || {})
      );

      const beliefId = result.lastInsertRowid as number;

      // Record belief formation event
      this.recordBeliefEvolution(beliefId, 'formed', null, belief.confidence, null, 'Initial belief formation');

      return beliefId;
    } catch (err) {
      console.error('Error creating core belief:', err);
      return null;
    }
  }

  reinforceCoreBelief(beliefId: number, newSourceThoughts: string[]): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      // Get current belief
      const current = this.db.prepare('SELECT * FROM core_beliefs WHERE id = ?').get(beliefId);
      if (!current) return;

      const oldConfidence = current.confidence;
      const oldStrength = current.strength;

      // Increase confidence and strength slightly
      const newConfidence = Math.min(1.0, oldConfidence + 0.05);
      const newStrength = Math.min(1.0, oldStrength + 0.03);

      // Merge source thoughts
      const existingSources = JSON.parse(current.source_thoughts || '[]');
      const mergedSources = [...new Set([...existingSources, ...newSourceThoughts])];

      // Update belief
      this.db.prepare(`
        UPDATE core_beliefs
        SET confidence = ?, strength = ?, source_thoughts = ?,
            last_reinforced = ?, reinforcement_count = reinforcement_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newConfidence, newStrength, JSON.stringify(mergedSources), Date.now(), beliefId);

      // Record reinforcement event
      this.recordBeliefEvolution(
        beliefId,
        'reinforced',
        oldConfidence,
        newConfidence,
        newSourceThoughts[0],
        `Confidence: ${oldConfidence.toFixed(3)} → ${newConfidence.toFixed(3)}`
      );

    } catch (err) {
      console.error('Error reinforcing belief:', err);
    }
  }

  getCoreBeliefs(limit: number = 100): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }

    try {
      const result = this.db.prepare(`
        SELECT * FROM core_beliefs
        ORDER BY strength DESC, confidence DESC, last_reinforced DESC
        LIMIT ?
      `).all(limit);

      return result.map((b: any) => ({
        ...b,
        source_thoughts: JSON.parse(b.source_thoughts || '[]'),
        agent_affinity: JSON.parse(b.agent_affinity || '{}')
      }));
    } catch (err) {
      console.error('Error getting core beliefs:', err);
      return [];
    }
  }

  getBeliefsByCategory(category: string, limit: number = 50): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }

    try {
      const result = this.db.prepare(`
        SELECT * FROM core_beliefs
        WHERE category = ?
        ORDER BY strength DESC, confidence DESC
        LIMIT ?
      `).all(category, limit);

      return result.map((b: any) => ({
        ...b,
        source_thoughts: JSON.parse(b.source_thoughts || '[]'),
        agent_affinity: JSON.parse(b.agent_affinity || '{}')
      }));
    } catch (err) {
      console.error('Error getting beliefs by category:', err);
      return [];
    }
  }

  recordBeliefEvolution(
    beliefId: number,
    eventType: string,
    oldConfidence: number | null,
    newConfidence: number | null,
    triggerThoughtId: string | null,
    notes: string | null
  ): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        INSERT INTO belief_evolution
        (belief_id, timestamp, event_type, old_confidence, new_confidence, trigger_thought_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(beliefId, Date.now(), eventType, oldConfidence, newConfidence, triggerThoughtId, notes);
    } catch (err) {
      console.error('Error recording belief evolution:', err);
    }
  }

  updateBeliefAgentAffinity(beliefId: number, agentAffinity: any): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        UPDATE core_beliefs
        SET agent_affinity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(agentAffinity), beliefId);
    } catch (err) {
      console.error('Error updating belief agent affinity:', err);
    }
  }

  // Consolidation job tracking
  recordConsolidationJob(jobType: string, status: string): number {
    if (!this.isReady || !this.db) {
      return -1;
    }

    try {
      const result = this.db.prepare(`
        INSERT INTO consolidation_jobs
        (timestamp, job_type, status)
        VALUES (?, ?, ?)
      `).run(Date.now(), jobType, status);

      return result.lastInsertRowid as number;
    } catch (err) {
      console.error('Error recording consolidation job:', err);
      return -1;
    }
  }

  updateConsolidationJob(
    jobId: number,
    status: string,
    thoughtsProcessed: number,
    beliefsCreated: number,
    beliefsUpdated: number,
    duration: number,
    errorMessage?: string
  ): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        UPDATE consolidation_jobs
        SET status = ?, thoughts_processed = ?, beliefs_created = ?,
            beliefs_updated = ?, duration_ms = ?, error_message = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, thoughtsProcessed, beliefsCreated, beliefsUpdated, duration, errorMessage || null, jobId);
    } catch (err) {
      console.error('Error updating consolidation job:', err);
    }
  }

  // Memory patterns
  saveMemoryPattern(patternType: string, patternData: any, significance: number = 0.5): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      const dataJson = typeof patternData === 'string' ? patternData : JSON.stringify(patternData);
      const now = Date.now();

      // Check if pattern exists
      const existing = this.db.prepare(`
        SELECT id, frequency FROM memory_patterns
        WHERE pattern_type = ? AND pattern_data = ?
      `).get(patternType, dataJson);

      if (existing) {
        // Update frequency
        this.db.prepare(`
          UPDATE memory_patterns
          SET frequency = frequency + 1, last_seen = ?, significance = ?
          WHERE id = ?
        `).run(now, significance, (existing as any).id);
      } else {
        // Insert new pattern
        this.db.prepare(`
          INSERT INTO memory_patterns
          (pattern_type, pattern_data, frequency, last_seen, significance)
          VALUES (?, ?, 1, ?, ?)
        `).run(patternType, dataJson, now, significance);
      }
    } catch (err) {
      console.error('Error saving memory pattern:', err);
    }
  }

  getMemoryPatterns(limit: number = 50): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }

    try {
      const results = this.db.prepare(`
        SELECT * FROM memory_patterns
        ORDER BY significance DESC, frequency DESC, last_seen DESC
        LIMIT ?
      `).all(limit);

      return results.map((p: any) => ({
        ...p,
        pattern_data: this.tryParseJSON(p.pattern_data)
      }));
    } catch (err) {
      console.error('Error getting memory patterns:', err);
      return [];
    }
  }

  // Consciousness insights
  saveConsciousnessInsight(insightType: string, content: string, confidence: number = 0.5, relatedBeliefs: number[] = []): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      const now = Date.now();
      const beliefsJson = JSON.stringify(relatedBeliefs);

      this.db.prepare(`
        INSERT INTO consciousness_insights
        (timestamp, insight_type, insight_content, confidence, related_patterns)
        VALUES (?, ?, ?, ?, ?)
      `).run(now, insightType, content, confidence, beliefsJson);
    } catch (err) {
      console.error('Error saving consciousness insight:', err);
    }
  }

  getConsciousnessInsights(limit: number = 50): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }

    try {
      const results = this.db.prepare(`
        SELECT * FROM consciousness_insights
        ORDER BY confidence DESC, timestamp DESC
        LIMIT ?
      `).all(limit);

      return results.map((i: any) => ({
        ...i,
        related_patterns: JSON.parse(i.related_patterns || '[]')
      }));
    } catch (err) {
      console.error('Error getting consciousness insights:', err);
      return [];
    }
  }

  private tryParseJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  }

  /**
   * Get previous DPD weights (second-to-last version)
   * Used for calculating DPD reaction (weight changes)
   */
  getPreviousDPDWeights(): import('../types/dpd-types.js').DPDWeights {
    const stmt = this.db.prepare(`
      SELECT empathy, coherence, dissonance, timestamp, version
      FROM dpd_weights
      ORDER BY version DESC
      LIMIT 1 OFFSET 1
    `);

    const result = stmt.get() as any;

    if (result) {
      return {
        empathy: result.empathy,
        coherence: result.coherence,
        dissonance: result.dissonance,
        timestamp: result.timestamp,
        version: result.version
      };
    }

    // If no previous weights, return current weights (no change)
    return this.getCurrentDPDWeights();
  }

  // ============================================================================
  // Dialogue System Methods
  // ============================================================================

  /**
   * Save dialogue (human-Aenea conversation)
   */
  saveDialogue(dialogue: {
    id: string;
    humanMessage: string;
    aeneaResponse: string;
    immediateReaction?: string;
    newQuestion?: string;
    emotionalState?: string;
    empathyShift?: number;
    coherenceShift?: number;
    dissonanceShift?: number;
    timestamp: number;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO dialogues (
        id, human_message, aenea_response,
        immediate_reaction, new_question, emotional_state,
        empathy_shift, coherence_shift, dissonance_shift,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      dialogue.id,
      dialogue.humanMessage,
      dialogue.aeneaResponse,
      dialogue.immediateReaction || null,
      dialogue.newQuestion || null,
      dialogue.emotionalState || null,
      dialogue.empathyShift || 0,
      dialogue.coherenceShift || 0,
      dialogue.dissonanceShift || 0,
      dialogue.timestamp
    );
  }

  /**
   * Get dialogue by ID
   */
  getDialogue(id: string): any {
    const stmt = this.db.prepare('SELECT * FROM dialogues WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Get recent dialogues
   */
  getRecentDialogues(limit: number = 20, offset: number = 0): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM dialogues
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  }

  /**
   * Count total dialogues
   */
  countDialogues(): number {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM dialogues').get() as any;
    return result.count;
  }

  /**
   * Save dialogue memory (summarized)
   */
  saveDialogueMemory(memory: {
    dialogueId: string;
    memorySummary: string;
    topics?: string;
    importance?: number;
    emotionalImpact?: number;
    timestamp: number;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO dialogue_memories (
        dialogue_id, memory_summary, topics,
        importance, emotional_impact, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      memory.dialogueId,
      memory.memorySummary,
      memory.topics || null,
      memory.importance || 0.5,
      memory.emotionalImpact || 0.5,
      memory.timestamp
    );
  }

  /**
   * Get recent dialogue memories (for context in next conversation)
   */
  getRecentDialogueMemories(limit: number = 5): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM dialogue_memories
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  /**
   * Get dialogue memories by importance
   */
  getImportantDialogueMemories(limit: number = 5): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM dialogue_memories
      ORDER BY importance DESC, timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

export { DatabaseManager };
export default DatabaseManager;
/**
 * ThoughtRepository - tables: questions, thought_cycles, significant_thoughts.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4a) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';
import type { HighDissonanceCycleRecord, QuestionRecordInput, SignificantThoughtRecord } from '../../aenea/ports/records.js';

class ThoughtRepository {
  constructor(private conn: ConnectionProvider) {}

  // Question management
  saveQuestion(question: QuestionRecordInput): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    if (!question.question || !question.question.trim()) {
      console.warn(`Skipping question save - empty text for id=${question.id}`);
      return;
    }

    try {
      db.prepare(`
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

  getAllQuestions(): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }

    try {
      const rows = db.prepare(`
        SELECT id, timestamp, question, category, importance, source
        FROM questions
        ORDER BY timestamp ASC
      `).all();

      return rows as any[];
    } catch (err) {
      console.error('Error getting all questions:', err);
      return [];
    }
  }

  /**
   * Get recent question rows ordered by timestamp DESC.
   *
   * Facade for the raw SQL previously fired in
   * consciousness-backend.ts (loadQuestionHistoryIntoCategorizer) via the
   * `(this.databaseManager as any).db.prepare(...)` bypass. SQL, parameters,
   * and returned row shape are replicated exactly.
   */
  getRecentQuestionRows(limit: number = 100): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }

    try {
      return db.prepare(`
        SELECT id, question, category, importance, timestamp
        FROM questions
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent question rows:', err);
      return [];
    }
  }

  // Thought cycle management
  saveThoughtCycle(cycle: any): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
        INSERT OR REPLACE INTO thought_cycles
        (id, trigger_id, timestamp, duration, thoughts_data, synthesis_data, empathy_score, coherence_score, dissonance_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        cycle.id,
        cycle.trigger?.id ?? null,
        cycle.timestamp,
        cycle.duration,
        JSON.stringify(cycle.thoughts || []),
        JSON.stringify(cycle.synthesis || {}),
        cycle.dpdScores?.empathy ?? null,
        cycle.dpdScores?.coherence ?? null,
        cycle.dpdScores?.dissonance ?? null
      );
    } catch (err) {
      console.error('Error saving thought cycle:', err);
    }
  }

  // Significant thoughts management
  recordSignificantThought(thought: any): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      const content = thought.content || thought.thought;

      // Skip if content is empty or invalid
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        console.warn('Skipping significant thought with empty content');
        return;
      }

      db.prepare(`
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

  getSignificantThoughts(limit: number = 100): SignificantThoughtRecord[] {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      console.debug('getSignificantThoughts called but database not ready');
      return [];
    }
    try {
      const query = 'SELECT * FROM significant_thoughts ORDER BY significance_score DESC, timestamp DESC LIMIT ?';
      const result = db.prepare(query).all(limit);
      const filteredResult = result.filter((row: any) => row.thought_content && row.thought_content.trim());
      return filteredResult;
    } catch (err) {
      console.error('Error getting significant thoughts:', err);
      return [];
    }
  }

  /**
   * Get recent significant thoughts (for REM phase dream extraction)
   */
  getRecentSignificantThoughts(limit: number = 100, daysAgo: number = 3): SignificantThoughtRecord[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const stmt = db.prepare(`
        SELECT * FROM significant_thoughts
        WHERE created_at > datetime('now', '-${daysAgo} days')
        ORDER BY confidence DESC, created_at DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting recent significant thoughts:', err);
      return [];
    }
  }

  /**
   * Get old significant thoughts for consolidation
   * @param ageValue - Age value (number of days or hours)
   * @param ageUnit - 'days' or 'hours'
   */
  getOldSignificantThoughts(ageValue: number, minConfidence: number, limit: number, ageUnit: 'days' | 'hours' = 'days'): SignificantThoughtRecord[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const stmt = db.prepare(`
        SELECT * FROM significant_thoughts
        WHERE created_at < datetime('now', '-${ageValue} ${ageUnit}')
        AND confidence >= ?
        ORDER BY confidence DESC, created_at ASC
        LIMIT ?
      `);
      return stmt.all(minConfidence, limit);
    } catch (err) {
      console.error('Error getting old significant thoughts:', err);
      return [];
    }
  }

  /**
   * Delete significant thoughts by IDs
   */
  deleteSignificantThoughts(ids: string[]): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    if (ids.length === 0) return;
    try {
      const placeholders = ids.map(() => '?').join(',');
      const stmt = db.prepare(`DELETE FROM significant_thoughts WHERE id IN (${placeholders})`);
      stmt.run(...ids);
    } catch (err) {
      console.error('Error deleting significant thoughts:', err);
    }
  }

  /**
   * Get significant thoughts count
   */
  getSignificantThoughtsCount(): number {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return 0;
    }
    try {
      const stmt = db.prepare(`SELECT COUNT(*) as count FROM significant_thoughts`);
      const result: any = stmt.get();
      return result?.count || 0;
    } catch (err) {
      console.error('Error getting significant thoughts count:', err);
      return 0;
    }
  }

  /**
   * Get recent thought cycles ordered by timestamp DESC.
   *
   * Replicates the raw SQL previously fired in scripts/export-db.ts via the
   * `(db as any).db.prepare(...)` bypass. SQL, parameters, and returned row
   * shape are replicated exactly.
   */
  getRecentThoughtCycles(limit: number = 500): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      return db.prepare(`
        SELECT * FROM thought_cycles
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent thought cycles:', err);
      return [];
    }
  }

  /**
   * Get thought cycles with high ethical dissonance
   */
  getHighDissonanceCycles(minDissonance: number, daysAgo: number, limit: number): HighDissonanceCycleRecord[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      // Read-only cross-context JOIN, documented exception
      // (dpd_weights owned by DPDRepository).
      const stmt = db.prepare(`
        SELECT tc.*, dw.dissonance
        FROM thought_cycles tc
        JOIN dpd_weights dw ON tc.id = dw.context
        WHERE dw.dissonance > ?
        AND tc.created_at > datetime('now', '-${daysAgo} days')
        ORDER BY dw.dissonance DESC
        LIMIT ?
      `);
      return stmt.all(minDissonance, limit);
    } catch (err) {
      console.error('Error getting high dissonance cycles:', err);
      return [];
    }
  }
}

export { ThoughtRepository };

/**
 * SleepRepository - tables: sleep_logs, dream_patterns.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4b) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';

class SleepRepository {
  constructor(private conn: ConnectionProvider) {}

  /**
   * Save dream pattern
   */
  saveDreamPattern(dream: { pattern: string; emotionalTone: string; sourceThoughtIds: string[] }): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    try {
      const stmt = db.prepare(`
        INSERT INTO dream_patterns (pattern, emotional_tone, source_thought_ids, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `);
      stmt.run(dream.pattern, dream.emotionalTone, JSON.stringify(dream.sourceThoughtIds));
    } catch (err) {
      console.error('Error saving dream pattern:', err);
    }
  }

  /**
   * Save sleep log
   */
  saveSleepLog(log: {
    timestamp: number;
    systemClock: number;
    triggerReason: string;
    phases: string[];
    stats: any;
    duration: number;
    energyBefore: number;
    energyAfter: number;
  }): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    try {
      const stmt = db.prepare(`
        INSERT INTO sleep_logs
        (timestamp, system_clock, trigger_reason, phases, stats, duration, energy_before, energy_after, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(
        log.timestamp,
        log.systemClock,
        log.triggerReason,
        JSON.stringify(log.phases),
        JSON.stringify(log.stats),
        log.duration,
        log.energyBefore,
        log.energyAfter
      );
    } catch (err) {
      console.error('Error saving sleep log:', err);
    }
  }

  /**
   * Get recent sleep logs
   */
  getRecentSleepLogs(limit: number = 10): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const stmt = db.prepare(`
        SELECT * FROM sleep_logs
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting recent sleep logs:', err);
      return [];
    }
  }

  /**
   * Get dream patterns
   */
  getDreamPatterns(limit: number = 20): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const stmt = db.prepare(`
        SELECT * FROM dream_patterns
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting dream patterns:', err);
      return [];
    }
  }
}

export { SleepRepository };

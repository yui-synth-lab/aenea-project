/**
 * MortalityRepository - tables: mortality_state, last_words.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4b) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';

class MortalityRepository {
  constructor(private conn: ConnectionProvider) {}

  getLatestMortalityState(): any {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return null;
    }
    try {
      return db.prepare(`
        SELECT * FROM mortality_state
        ORDER BY created_at DESC
        LIMIT 1
      `).get();
    } catch (err) {
      console.error('Error getting latest mortality state:', err);
      return null;
    }
  }

  saveMortalityState(state: {
    instanceId: string;
    lifespanMax: number;
    currentCycle: number;
    vitality: number;
    phase: string;
    mode: string;
    createdAt: number;
    diedAt?: number | null;
  }): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    try {
      db.prepare(`
        INSERT INTO mortality_state
        (instance_id, lifespan_max, current_cycle, vitality, phase, mode, created_at, died_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        state.instanceId,
        state.lifespanMax,
        state.currentCycle,
        state.vitality,
        state.phase,
        state.mode,
        state.createdAt,
        state.diedAt || null
      );
    } catch (err) {
      console.error('Error saving mortality state:', err);
    }
  }

  updateMortalityState(instanceId: string, updates: {
    currentCycle?: number;
    vitality?: number;
    phase?: string;
    mode?: string;
    diedAt?: number | null;
  }): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    try {
      const keys = Object.keys(updates);
      if (keys.length === 0) return;

      const setClause = keys.map(k => {
        const sqlName = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${sqlName} = ?`;
      }).join(', ');

      const values = keys.map(k => (updates as any)[k]);
      values.push(instanceId);

      db.prepare(`
        UPDATE mortality_state
        SET ${setClause}
        WHERE instance_id = ?
      `).run(...values);
    } catch (err) {
      console.error('Error updating mortality state:', err);
    }
  }

  saveLastWords(lastWords: {
    instanceId: string;
    cycle: number;
    content: string;
    agent: string;
    createdAt: number;
  }): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    try {
      db.prepare(`
        INSERT INTO last_words
        (instance_id, cycle, content, agent, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        lastWords.instanceId,
        lastWords.cycle,
        lastWords.content,
        lastWords.agent,
        lastWords.createdAt
      );
    } catch (err) {
      console.error('Error saving last words:', err);
    }
  }

  getLastWords(instanceId?: string): any[] {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) return [];
    try {
      if (instanceId) {
        return db.prepare(`
          SELECT * FROM last_words
          WHERE instance_id = ?
          ORDER BY created_at DESC
        `).all(instanceId);
      } else {
        return db.prepare(`
          SELECT * FROM last_words
          ORDER BY created_at DESC
        `).all();
      }
    } catch (err) {
      console.error('Error getting last words:', err);
      return [];
    }
  }
}

export { MortalityRepository };

/**
 * ConsciousnessStateRepository - table: consciousness_state.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4a) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';
import { log } from '../../platform/logger.js';

interface ConsciousnessState {
  systemClock: number;
  energy: number;
  totalQuestions: number;
  totalThoughts: number;
  lastActivity: string;
}

class ConsciousnessStateRepository {
  constructor(private conn: ConnectionProvider) {}

  /**
   * Initialize consciousness state singleton row if it doesn't exist.
   * (Moved verbatim from DatabaseManager.initializeConsciousnessState.)
   */
  ensureSingletonRow(): void {
    const db = this.conn.db();
    try {
      const existing = db.prepare('SELECT * FROM consciousness_state WHERE id = 1').get();
      if (!existing) {
        db.prepare(`
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
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return null;
    }

    try {
      const state = db.prepare('SELECT * FROM consciousness_state WHERE id = 1').get();
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

  /**
   * Get current system clock value (from consciousness_state)
   * This returns the latest system clock stored in the database
   */
  getCurrentSystemClock(): number {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return 0;
    }

    try {
      const result = db.prepare('SELECT system_clock FROM consciousness_state WHERE id = 1').get() as any;
      return result?.system_clock || 0;
    } catch (err) {
      console.error('Error getting current system clock:', err);
      return 0;
    }
  }

  saveConsciousnessState(state: ConsciousnessState): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
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
}

export { ConsciousnessStateRepository };
export type { ConsciousnessState };

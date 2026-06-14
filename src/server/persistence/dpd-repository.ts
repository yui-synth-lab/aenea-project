/**
 * DPDRepository - table: dpd_weights.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4a) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';

class DPDRepository {
  constructor(private conn: ConnectionProvider) {}

  // DPD weights management
  saveDPDWeights(weights: any): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
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

  // DPD weights history
  getLatestDPDWeights(): any | null {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      console.debug('Database not ready for getLatestDPDWeights');
      return null;
    }

    try {
      const result = db.prepare(`
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
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      console.debug('Database not ready for getDPDWeightsHistory');
      return [];
    }

    console.debug(`Getting DPD weights history with limit: ${limit}`);

    try {
      const result = db.prepare(`
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
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      console.debug('Database not ready for getDPDWeightsHistorySampled');
      return { records: [], totalCount: 0 };
    }

    try {
      // Get total count
      const countResult = db.prepare('SELECT COUNT(*) as count FROM dpd_weights').get() as { count: number };
      const totalCount = countResult.count;

      console.debug(`Total DPD weights: ${totalCount}, Strategy: ${strategy}, Limit: ${limit}`);

      let records: any[] = [];

      if (strategy === 'all') {
        // Return all records up to limit
        records = db.prepare(`
          SELECT * FROM dpd_weights
          ORDER BY version DESC
          LIMIT ?
        `).all(limit);
      } else if (strategy === 'recent') {
        // Return most recent records only
        records = db.prepare(`
          SELECT * FROM dpd_weights
          ORDER BY version DESC
          LIMIT ?
        `).all(limit);
      } else if (strategy === 'sampled') {
        // Intelligent sampling based on total count
        if (totalCount <= limit) {
          // Small dataset: return all
          records = db.prepare(`
            SELECT * FROM dpd_weights
            ORDER BY version DESC
          `).all();
        } else if (totalCount <= limit * 5) {
          // Medium dataset: even interval sampling
          const step = Math.floor(totalCount / limit);
          records = db.prepare(`
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

          const recent = db.prepare(`
            SELECT * FROM dpd_weights
            ORDER BY version DESC
            LIMIT ?
          `).all(recentLimit);

          const olderStep = Math.floor((totalCount - recentLimit) / olderLimit);
          const older = db.prepare(`
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
  getCurrentDPDWeights(): import('../../types/dpd-types.js').DPDWeights {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 0
      };
    }

    try {
      const stmt = db.prepare(`
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
    } catch (err) {
      console.error('Error getting current DPD weights:', err);
    }

    // Default weights if no history exists or error
    return {
      empathy: 0.33,
      coherence: 0.33,
      dissonance: 0.34,
      timestamp: Date.now(),
      version: 0
    };
  }

  /**
   * Get previous DPD weights (second-to-last version)
   * Used for calculating DPD reaction (weight changes)
   */
  getPreviousDPDWeights(): import('../../types/dpd-types.js').DPDWeights {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      // Return default if not ready
      return {
        empathy: 0.33,
        coherence: 0.33,
        dissonance: 0.34,
        timestamp: Date.now(),
        version: 0
      };
    }

    try {
      const stmt = db.prepare(`
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
    } catch (err) {
      console.error('Error getting previous DPD weights:', err);
    }

    // If no previous weights, return current weights (no change)
    return this.getCurrentDPDWeights();
  }
}

export { DPDRepository };

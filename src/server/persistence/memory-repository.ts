/**
 * MemoryRepository - tables: memory_patterns, consciousness_insights, forgetting_events.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4b) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 *
 * tryParseJSON is moved here as a private helper — its only caller is
 * getMemoryPatterns.
 */

import type { ConnectionProvider } from './connection.js';

class MemoryRepository {
  constructor(private conn: ConnectionProvider) {}

  // Memory patterns
  saveMemoryPattern(patternType: string, patternData: any, significance: number = 0.5): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      const dataJson = typeof patternData === 'string' ? patternData : JSON.stringify(patternData);
      const now = Date.now();

      // Check if pattern exists
      const existing = db.prepare(`
        SELECT id, frequency FROM memory_patterns
        WHERE pattern_type = ? AND pattern_data = ?
      `).get(patternType, dataJson);

      if (existing) {
        // Update frequency
        db.prepare(`
          UPDATE memory_patterns
          SET frequency = frequency + 1, last_seen = ?, significance = ?
          WHERE id = ?
        `).run(now, significance, (existing as any).id);
      } else {
        // Insert new pattern
        db.prepare(`
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
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }

    try {
      const results = db.prepare(`
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
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      const now = Date.now();
      const beliefsJson = JSON.stringify(relatedBeliefs);

      db.prepare(`
        INSERT INTO consciousness_insights
        (timestamp, insight_type, insight_content, confidence, related_patterns)
        VALUES (?, ?, ?, ?, ?)
      `).run(now, insightType, content, confidence, beliefsJson);
    } catch (err) {
      console.error('Error saving consciousness insight:', err);
    }
  }

  getConsciousnessInsights(limit: number = 50): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }

    try {
      const results = db.prepare(`
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

  getRecentForgettingEvents(limit: number = 100): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) return [];
    try {
      return db.prepare(`
        SELECT * FROM forgetting_events
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent forgetting events:', err);
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
}

export { MemoryRepository };

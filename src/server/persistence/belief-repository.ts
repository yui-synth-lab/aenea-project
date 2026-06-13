/**
 * BeliefRepository - tables: core_beliefs, belief_evolution, consolidation_jobs.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4b) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';

class BeliefRepository {
  constructor(private conn: ConnectionProvider) {}

  // Core Beliefs Management
  createCoreBelief(belief: any): number | null {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return null;
    }

    try {
      const beliefContent = belief.belief_content;
      const result = db.prepare(`
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

  deleteCoreBelief(beliefId: number): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      // Delete related belief_evolution records first (FOREIGN KEY constraint)
      db.prepare('DELETE FROM belief_evolution WHERE belief_id = ?').run(beliefId);
      // Then delete the core belief
      db.prepare('DELETE FROM core_beliefs WHERE id = ?').run(beliefId);
    } catch (err) {
      console.error('Error deleting core belief:', err);
      throw err; // Re-throw to let caller handle
    }
  }

  reinforceCoreBelief(beliefId: number, newSourceThoughts: string[]): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      // Get current belief
      const current = db.prepare('SELECT * FROM core_beliefs WHERE id = ?').get(beliefId);
      if (!current) return;

      const oldConfidence = (current as any).confidence;
      const oldStrength = (current as any).strength;

      // Increase confidence and strength slightly
      const newConfidence = Math.min(1.0, oldConfidence + 0.05);
      const newStrength = Math.min(1.0, oldStrength + 0.03);

      // Merge source thoughts
      const existingSources = JSON.parse((current as any).source_thoughts || '[]');
      const mergedSources = [...new Set([...existingSources, ...newSourceThoughts])];

      // Update belief
      db.prepare(`
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
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }

    try {
      const result = db.prepare(`
        SELECT * FROM core_beliefs
        ORDER BY reinforcement_count DESC, strength DESC, confidence DESC
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
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }

    try {
      const result = db.prepare(`
        SELECT * FROM core_beliefs
        WHERE category = ?
        ORDER BY reinforcement_count DESC, strength DESC, confidence DESC
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

  /**
   * Record belief evolution event.
   * Called internally by createCoreBelief, reinforceCoreBelief, and
   * incrementBeliefContradiction. Nothing external calls this via the facade,
   * so it is kept private.
   */
  private recordBeliefEvolution(
    beliefId: number,
    eventType: string,
    oldConfidence: number | null,
    newConfidence: number | null,
    triggerThoughtId: string | null,
    notes: string | null
  ): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
        INSERT INTO belief_evolution
        (belief_id, timestamp, event_type, old_confidence, new_confidence, trigger_thought_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(beliefId, Date.now(), eventType, oldConfidence, newConfidence, triggerThoughtId, notes);
    } catch (err) {
      console.error('Error recording belief evolution:', err);
    }
  }

  updateBeliefAgentAffinity(beliefId: number, agentAffinity: any): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
        UPDATE core_beliefs
        SET agent_affinity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(agentAffinity), beliefId);
    } catch (err) {
      console.error('Error updating belief agent affinity:', err);
    }
  }

  /**
   * Increment contradiction count for a belief (data layer only)
   */
  incrementBeliefContradiction(beliefId: number, newConfidence: number, triggerThoughtId?: string): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      const current = db.prepare('SELECT * FROM core_beliefs WHERE id = ?').get(beliefId);
      if (!current) return;

      const oldConfidence = (current as any).confidence;

      // Update belief
      db.prepare(`
        UPDATE core_beliefs
        SET contradiction_count = contradiction_count + 1,
            confidence = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newConfidence, beliefId);

      // Record challenge event
      this.recordBeliefEvolution(
        beliefId,
        'challenged',
        oldConfidence,
        newConfidence,
        triggerThoughtId || null,
        `Belief challenged (contradictions: ${(current as any).contradiction_count + 1})`
      );
    } catch (err) {
      console.error('Error incrementing belief contradiction:', err);
    }
  }

  /**
   * Get top core beliefs by reinforcement count
   */
  getTopCoreBeliefs(limit: number = 30): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const stmt = db.prepare(`
        SELECT * FROM core_beliefs
        ORDER BY reinforcement_count DESC, confidence DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting top core beliefs:', err);
      return [];
    }
  }

  getRecentBeliefEvolution(limit: number = 100): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) return [];
    try {
      return db.prepare(`
        SELECT be.*, cb.belief_content
        FROM belief_evolution be
        JOIN core_beliefs cb ON be.belief_id = cb.id
        ORDER BY be.timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent belief evolution:', err);
      return [];
    }
  }

  // Consolidation job tracking
  recordConsolidationJob(jobType: string, status: string): number {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return -1;
    }

    try {
      const result = db.prepare(`
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
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
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

  getRecentConsolidationJobs(limit: number = 100): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) return [];
    try {
      return db.prepare(`
        SELECT * FROM consolidation_jobs
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent consolidation jobs:', err);
      return [];
    }
  }
}

export { BeliefRepository };

/**
 * SomniaRepository - tables: somnia_state, somnia_transitions, somnia_saip_events.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4b) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';

class SomniaRepository {
  constructor(private conn: ConnectionProvider) {}

  saveSomniaState(state: any, cycleId?: string): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
        INSERT INTO somnia_state
        (timestamp, cycle_id, mode, lambda, phi, mu_serotonin, mu_dopamine, mu_cortisol, mu_oxytocin,
         theta, psi, xi, add_pleasure, add_coherence, add_dissonance, add_temporal_flow, add_total, qualia)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        state.timestamp || Date.now(),
        cycleId || null,
        state.mode,
        state.somatic?.lambda ?? 0,
        state.somatic?.phi ?? 0,
        state.somatic?.mu?.serotonin ?? 0,
        state.somatic?.mu?.dopamine ?? 0,
        state.somatic?.mu?.cortisol ?? 0,
        state.somatic?.mu?.oxytocin ?? 0,
        state.affective?.theta ?? 0,
        state.affective?.psi ?? 0,
        state.affective?.xi ?? 0,
        state.add?.pleasure ?? null,
        state.add?.coherence ?? null,
        state.add?.dissonance ?? null,
        state.add?.temporalFlow ?? null,
        state.add?.total ?? null,
        state.cognitive?.qualia ?? null
      );
    } catch (err) {
      console.error('Error saving SOMNIA state:', err);
    }
  }

  saveSomniaTransition(from: string, to: string, triggerReason: string, duration: number): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
        INSERT INTO somnia_transitions
        (timestamp, from_mode, to_mode, trigger_reason, duration_in_previous)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        Date.now(),
        from,
        to,
        triggerReason,
        duration
      );
    } catch (err) {
      console.error('Error saving SOMNIA transition:', err);
    }
  }

  saveSomniaSaipEvent(eventData: {
    eventType: string;
    somniaState?: any;
    aeneaDpd?: any;
    influence?: any;
    impactScore?: number;
  }): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) return;

    try {
      db.prepare(`
        INSERT INTO somnia_saip_events
        (timestamp, event_type, somnia_state_json, aenea_dpd_json, influence_json, impact_score)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        Date.now(),
        eventData.eventType,
        eventData.somniaState ? JSON.stringify(eventData.somniaState) : null,
        eventData.aeneaDpd ? JSON.stringify(eventData.aeneaDpd) : null,
        eventData.influence ? JSON.stringify(eventData.influence) : null,
        eventData.impactScore ?? null
      );
    } catch (err) {
      console.error('Error saving SOMNIA SAIP event:', err);
    }
  }

  getLatestSomniaState(): any {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return null;
    }

    try {
      return db.prepare(`
        SELECT * FROM somnia_state
        ORDER BY timestamp DESC
        LIMIT 1
      `).get();
    } catch (err) {
      console.error('Error getting latest SOMNIA state:', err);
      return null;
    }
  }

  getRecentSomniaStates(limit: number = 100): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) return [];
    try {
      return db.prepare(`
        SELECT * FROM somnia_state
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent SOMNIA states:', err);
      return [];
    }
  }

  getRecentSomniaTransitions(limit: number = 100): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) return [];
    try {
      return db.prepare(`
        SELECT * FROM somnia_transitions
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent SOMNIA transitions:', err);
      return [];
    }
  }

  getRecentSomniaSaipEvents(limit: number = 100): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) return [];
    try {
      return db.prepare(`
        SELECT * FROM somnia_saip_events
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent SOMNIA SAIP events:', err);
      return [];
    }
  }
}

export { SomniaRepository };

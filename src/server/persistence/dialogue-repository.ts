/**
 * DialogueRepository - tables: dialogues, dialogue_memories.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4b) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';

class DialogueRepository {
  constructor(private conn: ConnectionProvider) {}

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
    systemClock?: number;
    timestamp: number;
  }): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO dialogues (
          id, human_message, aenea_response,
          immediate_reaction, new_question, emotional_state,
          empathy_shift, coherence_shift, dissonance_shift,
          system_clock, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        dialogue.systemClock || null,
        dialogue.timestamp
      );
    } catch (err) {
      console.error('Error saving dialogue:', err);
    }
  }

  /**
   * Get dialogue by ID
   */
  getDialogue(id: string): any {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return null;
    }
    try {
      const stmt = db.prepare('SELECT * FROM dialogues WHERE id = ?');
      return stmt.get(id);
    } catch (err) {
      console.error('Error getting dialogue:', err);
      return null;
    }
  }

  /**
   * Get recent dialogues
   */
  getRecentDialogues(limit: number = 20, offset: number = 0): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const stmt = db.prepare(`
        SELECT * FROM dialogues
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `);
      return stmt.all(limit, offset);
    } catch (err) {
      console.error('Error getting recent dialogues:', err);
      return [];
    }
  }

  /**
   * Count total dialogues
   */
  countDialogues(): number {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return 0;
    }
    try {
      const result = db.prepare('SELECT COUNT(*) as count FROM dialogues').get() as any;
      return result?.count || 0;
    } catch (err) {
      console.error('Error counting dialogues:', err);
      return 0;
    }
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
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      const stmt = db.prepare(`
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
    } catch (err) {
      console.error('Error saving dialogue memory:', err);
    }
  }

  /**
   * Get recent dialogue memories (for context in next conversation)
   */
  getRecentDialogueMemories(limit: number = 5): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const stmt = db.prepare(`
        SELECT * FROM dialogue_memories
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting recent dialogue memories:', err);
      return [];
    }
  }

  /**
   * Get dialogue memories by importance
   */
  getImportantDialogueMemories(limit: number = 5): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const stmt = db.prepare(`
        SELECT * FROM dialogue_memories
        ORDER BY importance DESC, timestamp DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting important dialogue memories:', err);
      return [];
    }
  }
}

export { DialogueRepository };

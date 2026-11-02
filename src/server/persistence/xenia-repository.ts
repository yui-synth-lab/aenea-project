/**
 * XeniaRepository - tables: xenia_inbox, xenia_outbox.
 *
 * Instance-side persistence for the XENIA correspondence module.
 * Letters delivered by the Xenia Bridge are stored in xenia_inbox; replies
 * (sent or deliberately withheld) are stored in xenia_outbox. The Bridge
 * never touches this database directly - it only talks to /api/xenia.
 *
 * Follows the repository pattern established in Phase 4 (see
 * mortality-repository.ts): ConnectionProvider injection, guard on
 * `conn.ready`, snake_case columns mapped at the query site.
 */

import type { ConnectionProvider } from './connection.js';
import { log } from '../../platform/logger.js';
import type { XeniaInboxLetter, XeniaOutboxEntry } from '../../aenea/ports/xenia.js';

export type { XeniaInboxLetter, XeniaOutboxEntry };

function rowToInboxLetter(row: any): XeniaInboxLetter {
  return {
    id: row.id,
    encounterId: row.encounter_id,
    fromInstance: row.from_instance,
    content: row.content,
    triggerText: row.trigger_text,
    inReplyTo: row.in_reply_to,
    mode: row.mode,
    kind: row.kind || 'letter',
    writtenAtCycle: row.written_at_cycle,
    deliveredAtCycle: row.delivered_at_cycle,
    readAtCycle: row.read_at_cycle,
    createdAt: row.created_at
  };
}

class XeniaRepository {
  constructor(private conn: ConnectionProvider) {}

  saveInboxLetter(letter: XeniaInboxLetter): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    try {
      db.prepare(`
        INSERT INTO xenia_inbox
        (id, encounter_id, from_instance, content, trigger_text, in_reply_to, mode, kind,
         written_at_cycle, delivered_at_cycle, read_at_cycle, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        letter.id,
        letter.encounterId,
        letter.fromInstance,
        letter.content,
        letter.triggerText,
        letter.inReplyTo,
        letter.mode,
        letter.kind,
        letter.writtenAtCycle,
        letter.deliveredAtCycle,
        letter.readAtCycle,
        letter.createdAt
      );
    } catch (err) {
      log.error('Xenia', 'Failed to save inbox letter', err);
    }
  }

  /**
   * Find an inbox letter whose trigger text matches the given question and
   * has not been read yet. Matching is normalized (trim + lowercase) to align
   * with unresolved_ideas normalization in IdeaRepository.
   */
  findUnreadByTriggerText(question: string): XeniaInboxLetter | null {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return null;
    }
    try {
      const row = db.prepare(`
        SELECT * FROM xenia_inbox
        WHERE read_at_cycle IS NULL
          AND LOWER(TRIM(trigger_text)) = LOWER(TRIM(?))
        ORDER BY delivered_at_cycle ASC
        LIMIT 1
      `).get(question);
      return row ? rowToInboxLetter(row) : null;
    } catch (err) {
      log.error('Xenia', 'Failed to match inbox letter', err);
      return null;
    }
  }

  markLetterRead(letterId: string, cycle: number): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    try {
      db.prepare(`
        UPDATE xenia_inbox SET read_at_cycle = ? WHERE id = ? AND read_at_cycle IS NULL
      `).run(cycle, letterId);
    } catch (err) {
      log.error('Xenia', 'Failed to mark letter read', err);
    }
  }

  saveOutboxEntry(entry: XeniaOutboxEntry): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }
    try {
      db.prepare(`
        INSERT INTO xenia_outbox
        (id, encounter_id, in_reply_to, content, decision, cycle, fetched, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.id,
        entry.encounterId,
        entry.inReplyTo,
        entry.content,
        entry.decision,
        entry.cycle,
        entry.fetched,
        entry.createdAt
      );
    } catch (err) {
      log.error('Xenia', 'Failed to save outbox entry', err);
    }
  }

  /**
   * Sent letters not yet collected by the Bridge. Withheld letters
   * (decision = 'unsent') are never exposed here - they exist only in this
   * database, visible to the observer alone.
   */
  getUnfetchedOutbox(): XeniaOutboxEntry[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return [];
    }
    try {
      const rows = db.prepare(`
        SELECT * FROM xenia_outbox
        WHERE decision = 'sent' AND fetched = 0
        ORDER BY cycle ASC
      `).all() as any[];
      return rows.map(row => ({
        id: row.id,
        encounterId: row.encounter_id,
        inReplyTo: row.in_reply_to,
        content: row.content,
        decision: row.decision,
        cycle: row.cycle,
        fetched: row.fetched,
        createdAt: row.created_at
      }));
    } catch (err) {
      log.error('Xenia', 'Failed to read outbox', err);
      return [];
    }
  }

  markOutboxFetched(ids: string[]): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db || ids.length === 0) {
      return;
    }
    try {
      const stmt = db.prepare(`UPDATE xenia_outbox SET fetched = 1 WHERE id = ?`);
      for (const id of ids) {
        stmt.run(id);
      }
    } catch (err) {
      log.error('Xenia', 'Failed to mark outbox fetched', err);
    }
  }

  getStats(): { delivered: number; read: number; unread: number; sent: number; unsent: number } {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return { delivered: 0, read: 0, unread: 0, sent: 0, unsent: 0 };
    }
    try {
      const inbox = db.prepare(`
        SELECT COUNT(*) AS delivered,
               SUM(CASE WHEN read_at_cycle IS NOT NULL THEN 1 ELSE 0 END) AS read
        FROM xenia_inbox
      `).get() as any;
      const outbox = db.prepare(`
        SELECT SUM(CASE WHEN decision = 'sent' THEN 1 ELSE 0 END) AS sent,
               SUM(CASE WHEN decision = 'unsent' THEN 1 ELSE 0 END) AS unsent
        FROM xenia_outbox
      `).get() as any;
      const delivered = inbox?.delivered || 0;
      const read = inbox?.read || 0;
      return {
        delivered,
        read,
        unread: delivered - read,
        sent: outbox?.sent || 0,
        unsent: outbox?.unsent || 0
      };
    } catch (err) {
      log.error('Xenia', 'Failed to read xenia stats', err);
      return { delivered: 0, read: 0, unread: 0, sent: 0, unsent: 0 };
    }
  }
}

export { XeniaRepository };

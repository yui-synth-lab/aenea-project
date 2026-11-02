/**
 * XeniaRepository tests (real SQLite, temp file)
 *
 * Invariants:
 *   - Trigger matching is case/whitespace-normalized, matches only unread
 *     letters, and returns the earliest delivered.
 *   - markLetterRead is write-once: the first reading cycle sticks.
 *   - Withheld ('unsent') replies are never exposed to the Bridge.
 *   - getStats reflects the inbox/outbox exactly, and is all zeros when the
 *     connection is not ready.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { ConnectionProvider } from '../../src/server/persistence/connection';
import { XeniaRepository } from '../../src/server/persistence/xenia-repository';
import type { XeniaInboxLetter, XeniaOutboxEntry } from '../../src/aenea/ports/xenia';

function letter(overrides: Partial<XeniaInboxLetter> = {}): XeniaInboxLetter {
  return {
    id: 'L1',
    encounterId: 'E1',
    fromInstance: 'other',
    content: 'body',
    triggerText: 'Hello World',
    inReplyTo: null,
    mode: 'B',
    kind: 'letter',
    writtenAtCycle: 1,
    deliveredAtCycle: 10,
    readAtCycle: null,
    createdAt: 1000,
    ...overrides
  };
}

function entry(overrides: Partial<XeniaOutboxEntry> = {}): XeniaOutboxEntry {
  return {
    id: 'R1',
    encounterId: 'E1',
    inReplyTo: 'L1',
    content: 'reply',
    decision: 'sent',
    cycle: 20,
    fetched: 0,
    createdAt: 2000,
    ...overrides
  };
}

describe('XeniaRepository', () => {
  let dir: string;
  let conn: ConnectionProvider;
  let repo: XeniaRepository;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xenia-repo-'));
    conn = new ConnectionProvider(path.join(dir, 'test.db'));
    conn.open();
    repo = new XeniaRepository(conn);
  });

  afterEach(() => {
    try {
      conn.db()?.close();
    } catch {
      // already closed
    }
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('opens a ready connection with the xenia tables', () => {
    expect(conn.ready).toBe(true);
  });

  describe('findUnreadByTriggerText', () => {
    it('round-trips a saved letter', () => {
      repo.saveInboxLetter(letter());
      expect(repo.findUnreadByTriggerText('Hello World')).toEqual(letter());
    });

    it('matches ignoring case and surrounding whitespace', () => {
      repo.saveInboxLetter(letter());
      expect(repo.findUnreadByTriggerText('  hello world  ')?.id).toBe('L1');
    });

    it('does not match a different text', () => {
      repo.saveInboxLetter(letter());
      expect(repo.findUnreadByTriggerText('Hello')).toBeNull();
    });

    it('does not match a letter that is already read', () => {
      repo.saveInboxLetter(letter({ readAtCycle: 12 }));
      expect(repo.findUnreadByTriggerText('Hello World')).toBeNull();
    });

    it('returns the earliest delivered when two letters share a trigger', () => {
      repo.saveInboxLetter(letter({ id: 'late', deliveredAtCycle: 30 }));
      repo.saveInboxLetter(letter({ id: 'early', deliveredAtCycle: 5 }));
      expect(repo.findUnreadByTriggerText('Hello World')?.id).toBe('early');
    });
  });

  describe('markLetterRead', () => {
    it('stamps the reading cycle and removes the letter from unread matching', () => {
      repo.saveInboxLetter(letter());
      repo.markLetterRead('L1', 15);
      expect(repo.findUnreadByTriggerText('Hello World')).toBeNull();
      expect(repo.getStats()).toMatchObject({ read: 1, unread: 0 });
    });

    it('is write-once: a later read does not overwrite the first cycle', () => {
      repo.saveInboxLetter(letter());
      repo.markLetterRead('L1', 15);
      repo.markLetterRead('L1', 99);
      const row = conn.db().prepare('SELECT read_at_cycle FROM xenia_inbox WHERE id = ?').get('L1') as any;
      expect(row.read_at_cycle).toBe(15);
    });

    it('does nothing for an unknown id', () => {
      expect(() => repo.markLetterRead('nope', 1)).not.toThrow();
    });
  });

  describe('outbox', () => {
    it('exposes sent, unfetched entries oldest cycle first', () => {
      repo.saveOutboxEntry(entry({ id: 'b', cycle: 30 }));
      repo.saveOutboxEntry(entry({ id: 'a', cycle: 20 }));
      expect(repo.getUnfetchedOutbox().map(e => e.id)).toEqual(['a', 'b']);
    });

    it('never exposes a withheld (unsent) reply', () => {
      repo.saveOutboxEntry(entry({ id: 'silent', decision: 'unsent', content: '' }));
      expect(repo.getUnfetchedOutbox()).toEqual([]);
      expect(repo.getStats().unsent).toBe(1);
    });

    it('stops exposing an entry once fetched', () => {
      repo.saveOutboxEntry(entry({ id: 'a' }));
      repo.saveOutboxEntry(entry({ id: 'b' }));
      repo.markOutboxFetched(['a']);
      expect(repo.getUnfetchedOutbox().map(e => e.id)).toEqual(['b']);
    });

    it('treats an empty id list as a no-op', () => {
      repo.saveOutboxEntry(entry());
      repo.markOutboxFetched([]);
      expect(repo.getUnfetchedOutbox()).toHaveLength(1);
    });

    it('round-trips an entry', () => {
      repo.saveOutboxEntry(entry());
      expect(repo.getUnfetchedOutbox()).toEqual([entry()]);
    });
  });

  describe('getStats', () => {
    it('is all zeros on an empty database', () => {
      expect(repo.getStats()).toEqual({ delivered: 0, read: 0, unread: 0, sent: 0, unsent: 0 });
    });

    it('counts delivered/read/unread and sent/unsent independently', () => {
      repo.saveInboxLetter(letter({ id: 'L1', triggerText: 'a' }));
      repo.saveInboxLetter(letter({ id: 'L2', triggerText: 'b' }));
      repo.saveInboxLetter(letter({ id: 'L3', triggerText: 'c' }));
      repo.markLetterRead('L1', 11);
      repo.saveOutboxEntry(entry({ id: 'R1', decision: 'sent' }));
      repo.saveOutboxEntry(entry({ id: 'R2', decision: 'unsent', content: '' }));
      repo.saveOutboxEntry(entry({ id: 'R3', decision: 'unsent', content: '' }));

      expect(repo.getStats()).toEqual({ delivered: 3, read: 1, unread: 2, sent: 1, unsent: 2 });
    });
  });

  describe('when the connection is not ready', () => {
    it('degrades to empty results instead of throwing', () => {
      const closed = new XeniaRepository({
        ready: false,
        db: () => undefined,
        ensureConnection: () => undefined
      } as unknown as ConnectionProvider);

      expect(closed.findUnreadByTriggerText('x')).toBeNull();
      expect(closed.getUnfetchedOutbox()).toEqual([]);
      expect(closed.getStats()).toEqual({ delivered: 0, read: 0, unread: 0, sent: 0, unsent: 0 });
      expect(() => closed.saveInboxLetter(letter())).not.toThrow();
      expect(() => closed.saveOutboxEntry(entry())).not.toThrow();
      expect(() => closed.markLetterRead('L1', 1)).not.toThrow();
      expect(() => closed.markOutboxFetched(['R1'])).not.toThrow();
    });
  });
});

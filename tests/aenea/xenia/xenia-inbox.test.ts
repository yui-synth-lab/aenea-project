/**
 * XeniaInbox tests
 *
 * Invariants (XENIA_SPEC v0.1, section 5.1):
 *   - A delivered letter is persisted AND planted in the S0 pool as an
 *     unresolved idea with source 'xenia' at the fixed mid-range importance.
 *   - Mode A prefixes provenance; mode B and notices carry the bare content.
 *   - matchAndMarkRead marks only on a match, and returns the letter stamped
 *     with the reading cycle.
 */

import { XeniaInbox, XeniaInboxStore, XeniaDeliveryPayload } from '../../../src/aenea/xenia/xenia-inbox';
import type { XeniaInboxLetter } from '../../../src/aenea/ports/xenia';

function createStore(unread: XeniaInboxLetter | null = null) {
  return {
    saveXeniaInboxLetter: jest.fn(),
    findUnreadXeniaLetterByTrigger: jest.fn().mockReturnValue(unread),
    markXeniaLetterRead: jest.fn(),
    addUnresolvedIdea: jest.fn()
  } satisfies XeniaInboxStore;
}

function payload(overrides: Partial<XeniaDeliveryPayload> = {}): XeniaDeliveryPayload {
  return {
    id: 'L1',
    encounterId: 'E1',
    fromInstance: 'other',
    content: 'こんにちは',
    mode: 'B',
    writtenAtCycle: 7,
    ...overrides
  };
}

function storedLetter(overrides: Partial<XeniaInboxLetter> = {}): XeniaInboxLetter {
  return {
    id: 'L1',
    encounterId: 'E1',
    fromInstance: 'other',
    content: 'こんにちは',
    triggerText: 'こんにちは',
    inReplyTo: null,
    mode: 'B',
    kind: 'letter',
    writtenAtCycle: 7,
    deliveredAtCycle: 10,
    readAtCycle: null,
    createdAt: 0,
    ...overrides
  };
}

describe('XeniaInbox.deliver', () => {
  it('persists the letter as unread, stamped with the delivery cycle', () => {
    const store = createStore();
    new XeniaInbox(store).deliver(payload(), 42);

    expect(store.saveXeniaInboxLetter).toHaveBeenCalledTimes(1);
    const saved = store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter;
    expect(saved).toMatchObject({
      id: 'L1',
      encounterId: 'E1',
      fromInstance: 'other',
      writtenAtCycle: 7,
      deliveredAtCycle: 42,
      readAtCycle: null
    });
  });

  it('returns the delivery cycle', () => {
    const result = new XeniaInbox(createStore()).deliver(payload(), 42);
    expect(result).toEqual({ deliveredAtCycle: 42 });
  });

  it('plants the trigger text in the S0 pool with source xenia and no importance bonus', () => {
    const store = createStore();
    new XeniaInbox(store).deliver(payload(), 1);

    expect(store.addUnresolvedIdea).toHaveBeenCalledWith({
      id: 'xenia_L1',
      question: 'こんにちは',
      category: 'philosophical',
      importance: 0.55,
      source: 'xenia'
    });
  });

  it('keeps the stored trigger text identical to the planted question', () => {
    const store = createStore();
    new XeniaInbox(store).deliver(payload({ mode: 'A' }), 1);

    const saved = store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter;
    const planted = store.addUnresolvedIdea.mock.calls[0][0];
    expect(planted.question).toBe(saved.triggerText);
  });

  describe('trigger text by mode', () => {
    it('mode A prefixes the provenance header, then the content', () => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload({ mode: 'A' }), 1);

      const saved = store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter;
      expect(saved.triggerText.startsWith('[XENIA]\n')).toBe(true);
      expect(saved.triggerText.endsWith('---\nこんにちは')).toBe(true);
      expect(saved.content).toBe('こんにちは');
    });

    it('mode B carries the content with no provenance', () => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload({ mode: 'B' }), 1);

      const saved = store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter;
      expect(saved.triggerText).toBe('こんにちは');
    });

    it('a notice is its own message even in mode A', () => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload({ mode: 'A', kind: 'notice' }), 1);

      const saved = store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter;
      expect(saved.kind).toBe('notice');
      expect(saved.triggerText).toBe('こんにちは');
    });
  });

  describe('trigger text normalization', () => {
    it.each(['B', 'A'] as const)('trims surrounding whitespace in mode %s so S0 can match it back', mode => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload({ mode, content: '\n  こんにちは\n\n' }), 1);

      const saved = store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter;
      expect(saved.triggerText).toBe(saved.triggerText.trim());
      expect(saved.triggerText.endsWith('こんにちは')).toBe(true);
      expect(saved.content).toBe('\n  こんにちは\n\n');
      expect(store.addUnresolvedIdea.mock.calls[0][0].question).toBe(saved.triggerText);
    });

    it('trims a notice', () => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload({ kind: 'notice', content: 'お知らせ\n' }), 1);
      expect((store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter).triggerText).toBe('お知らせ');
    });
  });

  describe('kind and reply linkage', () => {
    it('defaults kind to letter when unspecified', () => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload(), 1);
      expect((store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter).kind).toBe('letter');
    });

    it('coerces an unknown kind to letter rather than trusting the Bridge', () => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload({ kind: 'bogus' as any }), 1);
      expect((store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter).kind).toBe('letter');
    });

    it('normalizes a missing inReplyTo to null', () => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload(), 1);
      expect((store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter).inReplyTo).toBeNull();
    });

    it('keeps a given inReplyTo', () => {
      const store = createStore();
      new XeniaInbox(store).deliver(payload({ inReplyTo: 'prev' }), 1);
      expect((store.saveXeniaInboxLetter.mock.calls[0][0] as XeniaInboxLetter).inReplyTo).toBe('prev');
    });
  });
});

describe('XeniaInbox.matchAndMarkRead', () => {
  it('returns null and marks nothing when the trigger is not a letter', () => {
    const store = createStore(null);
    const result = new XeniaInbox(store).matchAndMarkRead('some internal question', 5);

    expect(result).toBeNull();
    expect(store.markXeniaLetterRead).not.toHaveBeenCalled();
  });

  it('looks the letter up by the exact trigger question', () => {
    const store = createStore(null);
    new XeniaInbox(store).matchAndMarkRead('  Q  ', 5);
    expect(store.findUnreadXeniaLetterByTrigger).toHaveBeenCalledWith('  Q  ');
  });

  it('marks the matched letter read at the current cycle', () => {
    const store = createStore(storedLetter());
    new XeniaInbox(store).matchAndMarkRead('こんにちは', 15);

    expect(store.markXeniaLetterRead).toHaveBeenCalledTimes(1);
    expect(store.markXeniaLetterRead).toHaveBeenCalledWith('L1', 15);
  });

  it('returns the letter stamped with the reading cycle, leaving the stored one untouched', () => {
    const stored = storedLetter();
    const result = new XeniaInbox(createStore(stored)).matchAndMarkRead('こんにちは', 15);

    expect(result).toMatchObject({ id: 'L1', deliveredAtCycle: 10, readAtCycle: 15 });
    expect(stored.readAtCycle).toBeNull();
  });
});

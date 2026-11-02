/**
 * ReplyComposer tests
 *
 * Invariants (XENIA_SPEC v0.1, section 5.2):
 *   - Silence is a first-class outcome and is always recorded.
 *   - Anything that is not an unambiguous, non-empty "send" is silence:
 *     unparseable output, executor failure, thrown errors, blank replies.
 *   - A sent reply never exceeds maxLetterLength.
 *   - A reply to the encounter-start notice is a first letter (inReplyTo null).
 */

import { ReplyComposer, ReplyExecutor, XeniaOutboxStore } from '../../../src/aenea/xenia/reply-composer';
import type { XeniaInboxLetter, XeniaOutboxEntry } from '../../../src/aenea/ports/xenia';

function createStore() {
  return { saveXeniaOutboxEntry: jest.fn() } satisfies XeniaOutboxStore;
}

function executorReturning(content: string | undefined, success = true): ReplyExecutor {
  return { execute: jest.fn().mockResolvedValue({ success, content }) };
}

function letter(overrides: Partial<XeniaInboxLetter> = {}): XeniaInboxLetter {
  return {
    id: 'L1',
    encounterId: 'E1',
    fromInstance: 'other',
    content: '手紙の本文',
    triggerText: '手紙の本文',
    inReplyTo: null,
    mode: 'B',
    kind: 'letter',
    writtenAtCycle: 7,
    deliveredAtCycle: 10,
    readAtCycle: 15,
    createdAt: 0,
    ...overrides
  };
}

const cycle = {
  synthesis: {
    integratedThought: '統合された思考',
    unresolvedQuestions: ['q1', 'q2', 'q3', 'q4']
  },
  documentation: { narrative: '語り' }
};

function saved(store: ReturnType<typeof createStore>): XeniaOutboxEntry {
  return store.saveXeniaOutboxEntry.mock.calls[0][0] as XeniaOutboxEntry;
}

describe('ReplyComposer.compose - decisions', () => {
  it('records a sent reply when the executor says send:true with text', async () => {
    const store = createStore();
    const result = await new ReplyComposer(store).compose(
      letter(), cycle, executorReturning('{"send": true, "reply": "返事です"}')
    );

    expect(result).toEqual({ decision: 'sent', content: '返事です' });
    expect(saved(store)).toMatchObject({ decision: 'sent', content: '返事です', fetched: 0 });
  });

  it('records silence when the executor says send:false', async () => {
    const store = createStore();
    const result = await new ReplyComposer(store).compose(
      letter(), cycle, executorReturning('{"send": false}')
    );

    expect(result).toEqual({ decision: 'unsent', content: '' });
    expect(store.saveXeniaOutboxEntry).toHaveBeenCalledTimes(1);
    expect(saved(store).decision).toBe('unsent');
  });

  it('keeps a composed-but-withheld reply as unsent, stored but not sent', async () => {
    const store = createStore();
    const result = await new ReplyComposer(store).compose(
      letter(), cycle, executorReturning('{"send": false, "reply": "出さなかった言葉"}')
    );

    expect(result).toEqual({ decision: 'unsent', content: '出さなかった言葉' });
    expect(saved(store)).toMatchObject({ decision: 'unsent', content: '出さなかった言葉' });
  });

  it.each([
    ['empty reply', '{"send": true, "reply": ""}'],
    ['whitespace-only reply', '{"send": true, "reply": "   \\n "}'],
    ['missing reply', '{"send": true}']
  ])('treats send:true with %s as silence', async (_name, raw) => {
    const store = createStore();
    const result = await new ReplyComposer(store).compose(letter(), cycle, executorReturning(raw));

    expect(result.decision).toBe('unsent');
    expect(saved(store).decision).toBe('unsent');
  });
});

describe('ReplyComposer.compose - silence on failure', () => {
  it.each([
    ['unparseable text', 'ええと、返事は…'],
    ['JSON without a boolean send', '{"send": "yes", "reply": "x"}'],
    ['empty content', '']
  ])('never turns %s into a send', async (_name, raw) => {
    const store = createStore();
    const result = await new ReplyComposer(store).compose(letter(), cycle, executorReturning(raw));

    expect(result.decision).toBe('unsent');
    expect(store.saveXeniaOutboxEntry).toHaveBeenCalledTimes(1);
  });

  it('records silence when the executor reports failure, even with content', async () => {
    const store = createStore();
    const result = await new ReplyComposer(store).compose(
      letter(), cycle, executorReturning('{"send": true, "reply": "x"}', false)
    );

    expect(result.decision).toBe('unsent');
    expect(saved(store).content).toBe('');
  });

  it('records silence instead of propagating when the executor throws', async () => {
    const store = createStore();
    const executor: ReplyExecutor = { execute: jest.fn().mockRejectedValue(new Error('boom')) };

    await expect(new ReplyComposer(store).compose(letter(), cycle, executor)).resolves.toEqual({
      decision: 'unsent',
      content: ''
    });
    expect(store.saveXeniaOutboxEntry).toHaveBeenCalledTimes(1);
    expect(saved(store).decision).toBe('unsent');
  });
});

describe('ReplyComposer.compose - response parsing', () => {
  it('accepts JSON inside a fenced code block', async () => {
    const store = createStore();
    const raw = '```json\n{"send": true, "reply": "fenced"}\n```';
    const result = await new ReplyComposer(store).compose(letter(), cycle, executorReturning(raw));
    expect(result).toEqual({ decision: 'sent', content: 'fenced' });
  });

  it('accepts JSON embedded in surrounding prose', async () => {
    const store = createStore();
    const raw = '考えました。\n{"send": true, "reply": "embedded"}\n以上です。';
    const result = await new ReplyComposer(store).compose(letter(), cycle, executorReturning(raw));
    expect(result).toEqual({ decision: 'sent', content: 'embedded' });
  });

  it('trims the reply', async () => {
    const store = createStore();
    const result = await new ReplyComposer(store).compose(
      letter(), cycle, executorReturning('{"send": true, "reply": "  padded \\n"}')
    );
    expect(result.content).toBe('padded');
  });
});

describe('ReplyComposer.compose - length bound', () => {
  it('truncates a sent reply to exactly maxLetterLength', async () => {
    const store = createStore();
    const long = 'あ'.repeat(50);
    const result = await new ReplyComposer(store, 10).compose(
      letter(), cycle, executorReturning(JSON.stringify({ send: true, reply: long }))
    );

    expect(result.content).toBe('あ'.repeat(10));
    expect(saved(store).content).toHaveLength(10);
  });

  it('leaves a reply exactly at the limit untouched', async () => {
    const store = createStore();
    const exact = 'a'.repeat(10);
    const result = await new ReplyComposer(store, 10).compose(
      letter(), cycle, executorReturning(JSON.stringify({ send: true, reply: exact }))
    );
    expect(result.content).toBe(exact);
  });

  it('defaults the limit to 800 characters', async () => {
    const store = createStore();
    const result = await new ReplyComposer(store).compose(
      letter(), cycle, executorReturning(JSON.stringify({ send: true, reply: 'x'.repeat(900) }))
    );
    expect(result.content).toHaveLength(800);
  });

  it('truncates a withheld reply as well', async () => {
    const store = createStore();
    const result = await new ReplyComposer(store, 5).compose(
      letter(), cycle, executorReturning(JSON.stringify({ send: false, reply: 'x'.repeat(20) }))
    );
    expect(result).toEqual({ decision: 'unsent', content: 'xxxxx' });
  });
});

describe('ReplyComposer.compose - outbox entry', () => {
  it('links a reply to the letter it answers', async () => {
    const store = createStore();
    await new ReplyComposer(store).compose(letter(), cycle, executorReturning('{"send": false}'));

    expect(saved(store)).toMatchObject({ encounterId: 'E1', inReplyTo: 'L1', cycle: 15 });
    expect(saved(store).id.startsWith('reply_L1_')).toBe(true);
  });

  it('writes a first letter, not a reply, when answering the notice', async () => {
    const store = createStore();
    await new ReplyComposer(store).compose(
      letter({ kind: 'notice' }), cycle, executorReturning('{"send": true, "reply": "はじめまして"}')
    );
    expect(saved(store).inReplyTo).toBeNull();
  });

  it('falls back to cycle 0 when the letter was never stamped as read', async () => {
    const store = createStore();
    await new ReplyComposer(store).compose(
      letter({ readAtCycle: null }), cycle, executorReturning('{"send": false}')
    );
    expect(saved(store).cycle).toBe(0);
  });
});

describe('ReplyComposer.compose - prompt', () => {
  async function promptFor(l: XeniaInboxLetter, c: object) {
    const executor = executorReturning('{"send": false}');
    await new ReplyComposer(createStore(), 300).compose(l, c, executor);
    const [prompt, system] = (executor.execute as jest.Mock).mock.calls[0];
    return { prompt: prompt as string, system: system as string };
  }

  it('includes the letter, the integrated thought and the narrative', async () => {
    const { prompt } = await promptFor(letter(), cycle);
    expect(prompt).toContain('手紙の本文');
    expect(prompt).toContain('統合された思考');
    expect(prompt).toContain('語り');
  });

  it('shows at most three unresolved questions', async () => {
    const { prompt } = await promptFor(letter(), cycle);
    expect(prompt).toContain('q3');
    expect(prompt).not.toContain('q4');
  });

  it('falls back to synthesis.content when there is no integratedThought', async () => {
    const { prompt } = await promptFor(letter(), { synthesis: { content: '代替の統合' } });
    expect(prompt).toContain('代替の統合');
  });

  it('omits the optional sections when the cycle has nothing to offer', async () => {
    const { prompt } = await promptFor(letter(), {});
    expect(prompt).not.toContain('統合された思考');
    expect(prompt).not.toContain('記録された語り');
    expect(prompt).not.toContain('残った問い');
  });

  it('states the length limit it was configured with', async () => {
    const { prompt } = await promptFor(letter(), cycle);
    expect(prompt).toContain('300文字以内');
  });

  it('frames a notice as having no letter yet', async () => {
    const { prompt } = await promptFor(letter({ kind: 'notice' }), cycle);
    expect(prompt).toContain('相手からの手紙は、まだありません');
    expect(prompt).toContain('最初の手紙を書きますか');
  });

  it('keeps silence explicitly available in the system prompt', async () => {
    const { system } = await promptFor(letter(), cycle);
    expect(system).toContain('書かないことも、完全に有効な選択です');
    expect(system).toContain('{"send": false}');
  });
});

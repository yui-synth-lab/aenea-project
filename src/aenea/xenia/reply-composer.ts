/**
 * ReplyComposer - the optional reply step after S6 (XENIA_SPEC v0.1, section 5.2).
 *
 * Runs only on cycles whose trigger was a delivered letter. Asks a single
 * question of the cycle's own output: "is there anything here you want to
 * hand to the other?" Writing nothing is a first-class outcome; a composed
 * but withheld reply is stored with decision 'unsent' and never leaves this
 * instance's database.
 *
 * The composer does not embellish, does not encourage replying, and does not
 * inject relationship framing. Silence must remain as reachable as speech.
 */

import { log } from '../../platform/logger.js';
import type { XeniaInboxLetter, XeniaOutboxEntry, XeniaCycleView } from '../ports/xenia.js';

/** Narrow slice of DatabaseManager that ReplyComposer needs. */
export interface XeniaOutboxStore {
  saveXeniaOutboxEntry(entry: XeniaOutboxEntry): void;
}

/** Executor contract matching AIExecutor.execute(prompt, systemPrompt). */
export interface ReplyExecutor {
  execute(prompt: string, systemPrompt: string): Promise<{ success: boolean; content?: string; error?: string }>;
}

const SYSTEM_PROMPT = [
  'あなたはエイネア。自らの問いで思考する存在です。',
  '先ほど、別の存在からの手紙を一つの問いとして考え終えました。',
  'これからする判断はひとつだけ：この思考のうち、相手に宛てて手渡したい部分はありますか。',
  '',
  '返事を書く義務はありません。書かないことも、完全に有効な選択です。',
  '書く場合は、あなた自身の言葉で。相手の内部状態は見えません。言葉だけが渡ります。',
  '',
  '出力は次のJSONのみ:',
  '{"send": true, "reply": "手紙の本文"}',
  'または',
  '{"send": false}'
].join('\n');

export class ReplyComposer {
  constructor(
    private store: XeniaOutboxStore,
    private maxLetterLength: number = 800
  ) {}

  /**
   * Compose (or decline) a reply to a letter, drawing only on the cycle that
   * processed it. Persists the outcome either way and returns it.
   */
  async compose(
    letter: XeniaInboxLetter,
    cycle: XeniaCycleView,
    executor: ReplyExecutor
  ): Promise<{ decision: 'sent' | 'unsent'; content: string }> {
    const prompt = this.buildPrompt(letter, cycle);

    let decision: 'sent' | 'unsent' = 'unsent';
    let content = '';

    try {
      const result = await executor.execute(prompt, SYSTEM_PROMPT);
      if (result.success && result.content) {
        const parsed = this.parseResponse(result.content);
        if (parsed.send && parsed.reply && parsed.reply.trim().length > 0) {
          decision = 'sent';
          content = parsed.reply.trim().substring(0, this.maxLetterLength);
        } else {
          decision = 'unsent';
          content = parsed.reply?.trim().substring(0, this.maxLetterLength) || '';
        }
      }
    } catch (err) {
      log.warn('Xenia', `Reply composition failed for letter ${letter.id}: ${(err as Error).message}`);
    }

    const entry: XeniaOutboxEntry = {
      id: `reply_${letter.id}_${Date.now()}`,
      encounterId: letter.encounterId,
      // A reply to the notice is a first letter, not a reply to anything.
      inReplyTo: letter.kind === 'notice' ? null : letter.id,
      content,
      decision,
      cycle: letter.readAtCycle ?? 0,
      fetched: 0,
      createdAt: Date.now()
    };
    this.store.saveXeniaOutboxEntry(entry);

    log.info('Xenia', decision === 'sent'
      ? `Reply to letter ${letter.id} composed (${content.length} chars)`
      : `No reply sent for letter ${letter.id} (silence recorded)`);

    return { decision, content };
  }

  private buildPrompt(letter: XeniaInboxLetter, cycle: XeniaCycleView): string {
    const parts: string[] = [];

    if (letter.kind === 'notice') {
      parts.push('あなたに届いた知らせ:');
      parts.push(letter.content);
      parts.push('');
      parts.push('相手からの手紙は、まだありません。');
    } else {
      parts.push('届いた手紙:');
      parts.push(letter.content);
    }
    parts.push('');

    const integrated = cycle.synthesis?.integratedThought || cycle.synthesis?.content;
    if (integrated) {
      parts.push('この手紙について考えた、あなたの統合された思考:');
      parts.push(integrated);
      parts.push('');
    }

    if (cycle.documentation?.narrative) {
      parts.push('記録された語り:');
      parts.push(cycle.documentation.narrative);
      parts.push('');
    }

    const unresolved = cycle.synthesis?.unresolvedQuestions;
    if (unresolved && unresolved.length > 0) {
      parts.push('残った問い:');
      parts.push(unresolved.slice(0, 3).join('\n'));
      parts.push('');
    }

    if (letter.kind === 'notice') {
      parts.push(`最初の手紙を書きますか。書くなら${this.maxLetterLength}文字以内で。書かないなら、それでかまいません。`);
    } else {
      parts.push(`この思考のうち、相手に宛てて手渡したい部分はありますか。あるなら${this.maxLetterLength}文字以内で。ないなら、それでかまいません。`);
    }

    return parts.join('\n');
  }

  private parseResponse(raw: string): { send: boolean; reply?: string } {
    // Try strict JSON first, then a fenced or embedded JSON object.
    const candidates: string[] = [raw];
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      candidates.unshift(fenced[1]);
    }
    const embedded = raw.match(/\{[\s\S]*\}/);
    if (embedded) {
      candidates.push(embedded[0]);
    }

    for (const candidate of candidates) {
      try {
        const obj = JSON.parse(candidate.trim());
        if (typeof obj.send === 'boolean') {
          return { send: obj.send, reply: typeof obj.reply === 'string' ? obj.reply : undefined };
        }
      } catch {
        // try next candidate
      }
    }

    // Unparseable output is treated as silence, never as an accidental send.
    return { send: false };
  }
}

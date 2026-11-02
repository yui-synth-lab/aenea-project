/**
 * XeniaInbox - letter reception for the XENIA correspondence module.
 *
 * Design contract (XENIA_SPEC v0.1, section 5.1):
 * - A delivered letter enters the S0 candidate pool as an unresolved idea
 *   with source 'xenia'. It competes with internal triggers under the normal
 *   importance weighting. No selection bonus is applied.
 * - Letters are excluded from the "evolved question" generation path so the
 *   original text is only ever encountered verbatim. This keeps vocabulary
 *   crossover observable and makes read-detection possible.
 * - Reading is detected by matching a cycle's trigger question against the
 *   stored trigger text (normalized). First match marks the letter read.
 *
 * Mode A prefixes the letter with a provenance header (spec 6.1).
 * Mode B inserts the letter content with no provenance (spec 6.2).
 */

import { log } from '../../platform/logger.js';
import type { XeniaInboxLetter } from '../ports/xenia.js';

/** Payload accepted from the Bridge via POST /api/xenia/deliver. */
export interface XeniaDeliveryPayload {
  id: string;
  encounterId: string;
  fromInstance: string;
  content: string;
  inReplyTo?: string | null;
  mode: 'A' | 'B';
  /** 'notice' marks the one-time encounter-start notification (mode A only). */
  kind?: 'letter' | 'notice';
  writtenAtCycle: number;
}

/** Narrow slice of DatabaseManager that XeniaInbox needs. */
export interface XeniaInboxStore {
  saveXeniaInboxLetter(letter: XeniaInboxLetter): void;
  findUnreadXeniaLetterByTrigger(question: string): XeniaInboxLetter | null;
  markXeniaLetterRead(letterId: string, cycle: number): void;
  addUnresolvedIdea(idea: any): void;
}

const MODE_A_HEADER = [
  '[XENIA]',
  '別の存在からの手紙が届いています。',
  'あなたと同じ構造から生まれ、別の時間を生きてきた存在です。',
  '---'
].join('\n');

/** Importance assigned to letter triggers. Mid-range by design: no bonus. */
const LETTER_IMPORTANCE = 0.55;

export class XeniaInbox {
  constructor(private store: XeniaInboxStore) {}

  /**
   * Accept a letter from the Bridge. Persists it and plants the trigger text
   * in the unresolved-ideas pool where S0 selection can find it.
   */
  deliver(payload: XeniaDeliveryPayload, currentCycle: number): { deliveredAtCycle: number } {
    const triggerText = this.buildTriggerText(payload);

    const letter: XeniaInboxLetter = {
      id: payload.id,
      encounterId: payload.encounterId,
      fromInstance: payload.fromInstance,
      content: payload.content,
      triggerText,
      inReplyTo: payload.inReplyTo ?? null,
      mode: payload.mode,
      kind: payload.kind === 'notice' ? 'notice' : 'letter',
      writtenAtCycle: payload.writtenAtCycle,
      deliveredAtCycle: currentCycle,
      readAtCycle: null,
      createdAt: Date.now()
    };

    this.store.saveXeniaInboxLetter(letter);

    // Plant into the S0 candidate pool. Normal importance, no bonus.
    // Category 'philosophical' is the broadest bucket; the categorizer's
    // balance logic treats it like any other candidate.
    this.store.addUnresolvedIdea({
      id: `xenia_${payload.id}`,
      question: triggerText,
      category: 'philosophical',
      importance: LETTER_IMPORTANCE,
      source: 'xenia'
    });

    log.info('Xenia', `Letter ${payload.id} delivered at cycle ${currentCycle} (mode ${payload.mode})`);
    return { deliveredAtCycle: currentCycle };
  }

  /**
   * Called at the start of a thought cycle: if the selected trigger is an
   * unread letter, mark it read and return it so the pipeline can run the
   * reply composer after S6.
   */
  matchAndMarkRead(triggerQuestion: string, currentCycle: number): XeniaInboxLetter | null {
    const letter = this.store.findUnreadXeniaLetterByTrigger(triggerQuestion);
    if (!letter) {
      return null;
    }
    this.store.markXeniaLetterRead(letter.id, currentCycle);
    log.info('Xenia', `Letter ${letter.id} read at cycle ${currentCycle} (delivered at ${letter.deliveredAtCycle})`);
    return { ...letter, readAtCycle: currentCycle };
  }

  /**
   * The trigger text must equal what S0 later reads back from the idea pool.
   * IdeaRepository stores questions JS-trimmed, while the SQL match only trims
   * spaces, so a letter ending in a newline would never be matched as read.
   */
  private buildTriggerText(payload: XeniaDeliveryPayload): string {
    // The notice is its own message; no "a letter has arrived" header.
    if (payload.kind === 'notice') {
      return payload.content.trim();
    }
    if (payload.mode === 'A') {
      return `${MODE_A_HEADER}\n${payload.content}`.trim();
    }
    return payload.content.trim();
  }
}

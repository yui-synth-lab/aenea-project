/**
 * XENIA ports — domain-side types for the correspondence module.
 *
 * Declared here (not in src/server/persistence) so src/aenea/xenia depends
 * only on the domain layer. XeniaRepository (src/server) imports and
 * re-exports these, keeping the dependency direction server -> aenea.
 */

export interface XeniaInboxLetter {
  id: string;
  encounterId: string;
  fromInstance: string;
  content: string;
  triggerText: string;
  inReplyTo: string | null;
  mode: 'A' | 'B';
  /** 'letter' = correspondence from the other instance; 'notice' = the one-time encounter-start notification. */
  kind: 'letter' | 'notice';
  writtenAtCycle: number;
  deliveredAtCycle: number;
  readAtCycle: number | null;
  createdAt: number;
}

export interface XeniaOutboxEntry {
  id: string;
  encounterId: string;
  inReplyTo: string | null; // xenia_inbox letter id this replies to
  content: string;
  decision: 'sent' | 'unsent';
  cycle: number;
  fetched: number;
  createdAt: number;
}

/**
 * The slice of a thought cycle the reply composer reads. ThoughtCycle
 * (src/server/services) satisfies it structurally.
 */
export interface XeniaCycleView {
  synthesis?: {
    integratedThought?: string;
    content?: string;
    unresolvedQuestions?: string[];
  };
  documentation?: {
    narrative?: string;
  };
}

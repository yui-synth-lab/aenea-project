/**
 * Persistence record types — the shapes the domain layer reads from and
 * writes to the store ports (see ./stores.ts).
 *
 * Field names mirror the SQLite columns (snake_case) because the repositories
 * return rows with only JSON columns parsed. Column definitions live in
 * src/server/persistence/connection.ts.
 */

import type { QuestionCategory } from '../../types/aenea-types.js';

/** Row of `significant_thoughts`. */
export interface SignificantThoughtRecord {
  id: string;
  thought_content: string;
  confidence: number;
  significance_score: number;
  agent_id: string | null;
  category: string | null;
  timestamp: number;
  created_at: string;
}

/** Per-agent resonance with a belief (JSON column `agent_affinity`). */
export type AgentAffinity = Record<string, number>;

/** Fields accepted when forming a belief; omitted fields get repository defaults. */
export interface NewCoreBelief {
  /** Empty or missing content is rejected by the repository (returns null). */
  belief_content?: string;
  category?: string;
  confidence?: number;
  strength?: number;
  source_thoughts?: string[];
  first_formed?: number;
  last_reinforced?: number;
  reinforcement_count?: number;
  contradiction_count?: number;
  agent_affinity?: AgentAffinity;
}

/** Row of `core_beliefs` with JSON columns parsed. */
export interface CoreBeliefRecord {
  id: number;
  belief_content: string;
  /** Column is nullable, but createCoreBelief always writes a value ('general' by default). */
  category: string;
  confidence: number;
  strength: number;
  source_thoughts: string[];
  first_formed: number;
  last_reinforced: number;
  reinforcement_count: number;
  contradiction_count: number;
  agent_affinity: AgentAffinity;
  created_at: string;
  updated_at: string;
}

/** Row of `unresolved_ideas` plus the camelCase aliases the repository adds. */
export interface UnresolvedIdeaRecord {
  id: string;
  question: string;
  category: QuestionCategory;
  first_encountered: number;
  last_revisited: number | null;
  revisit_count: number;
  complexity: number;
  importance: number;
  related_thoughts: string | null;
  source: string;
  created_at: string;
  firstAppeared: number;
  lastRevisited: number | null;
  revisitCount: number;
  relatedThoughts: string[];
}

/** Question as persisted by `saveQuestion` (InternalTrigger satisfies this). */
export interface QuestionRecordInput {
  id: string;
  question: string;
  timestamp?: number;
  category?: string;
  importance?: number;
  source?: string;
  contextData?: Record<string, unknown>;
}

/** Row of `thought_cycles` joined with the cycle's `dpd_weights.dissonance`. */
export interface HighDissonanceCycleRecord {
  id: string;
  trigger_id: string | null;
  timestamp: number;
  duration: number | null;
  thoughts_data: string | null;
  synthesis_data: string | null;
  empathy_score: number | null;
  coherence_score: number | null;
  dissonance_score: number | null;
  created_at: string;
  dissonance: number;
}

/** Counters recorded with a sleep log. */
export type SleepLogStats = Record<string, unknown>;

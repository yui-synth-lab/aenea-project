/**
 * Persistence store ports — what the domain layer needs from persistence.
 *
 * These interface-segregated ports define the slice of the persistence
 * surface each domain consumer depends on. `DatabaseManager` (in src/server)
 * satisfies every port structurally; a compile-time conformance check lives
 * at the bottom of database-manager.ts.
 *
 * They prefigure the Phase 4 repository split: each port is intended to
 * become its own repository.
 *
 * NOTE: signatures are copied verbatim from DatabaseManager. Interface method
 * declarations cannot carry default-parameter values, so the `= default`
 * portions are omitted here, but parameter and return types are identical —
 * keeping DatabaseManager structurally assignable to each port.
 */

import type {
  AgentAffinity,
  CoreBeliefRecord,
  HighDissonanceCycleRecord,
  NewCoreBelief,
  QuestionRecordInput,
  SignificantThoughtRecord,
  SleepLogStats,
  UnresolvedIdeaRecord
} from './records.js';

export interface ThoughtStore {
  getSignificantThoughts(limit?: number): SignificantThoughtRecord[];
  getRecentSignificantThoughts(limit?: number, daysAgo?: number): SignificantThoughtRecord[];
  getOldSignificantThoughts(ageValue: number, minConfidence: number, limit: number, ageUnit?: 'days' | 'hours'): SignificantThoughtRecord[];
  deleteSignificantThoughts(ids: string[]): void;
  getHighDissonanceCycles(minDissonance: number, daysAgo: number, limit: number): HighDissonanceCycleRecord[];
}

export interface BeliefStore {
  getCoreBeliefs(limit?: number): CoreBeliefRecord[];
  getTopCoreBeliefs(limit?: number): CoreBeliefRecord[];
  createCoreBelief(belief: NewCoreBelief): number | null;
  reinforceCoreBelief(beliefId: number, newSourceThoughts: string[]): void;
  incrementBeliefContradiction(beliefId: number, newConfidence: number, triggerThoughtId?: string): void;
  deleteCoreBelief(beliefId: number): void;
  updateBeliefAgentAffinity(beliefId: number, agentAffinity: AgentAffinity): void;
}

export interface IdeaStore {
  getUnresolvedIdeas(limit?: number, includeXenia?: boolean): UnresolvedIdeaRecord[];
  updateUnresolvedIdeaConsideration(ideaId: number | string): void;
}

export interface QuestionStore {
  saveQuestion(question: QuestionRecordInput): void;
}

export interface SleepStore {
  saveSleepLog(log: {
    timestamp: number;
    systemClock: number;
    triggerReason: string;
    phases: string[];
    stats: SleepLogStats;
    duration: number;
    energyBefore: number;
    energyAfter: number;
  }): void;
  saveDreamPattern(dream: { pattern: string; emotionalTone: string; sourceThoughtIds: string[] }): void;
  saveConsciousnessInsight(insightType: string, content: string, confidence?: number, relatedBeliefs?: number[]): void;
}

export interface ConsolidationJobStore {
  recordConsolidationJob(jobType: string, status: string): number;
  updateConsolidationJob(
    jobId: number,
    status: string,
    thoughtsProcessed: number,
    beliefsCreated: number,
    beliefsUpdated: number,
    duration: number,
    errorMessage?: string
  ): void;
}

export interface MortalityStore {
  saveLastWords(lastWords: {
    instanceId: string;
    cycle: number;
    content: string;
    agent: string;
    createdAt: number;
  }): void;
  updateMortalityState(instanceId: string, updates: {
    currentCycle?: number;
    vitality?: number;
    phase?: string;
    mode?: string;
    diedAt?: number | null;
  }): void;
}

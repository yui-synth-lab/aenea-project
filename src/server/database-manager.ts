/**
 * Database Manager - Direct SQLite Management without Session Abstraction
 * The database itself serves as the persistence layer without session concepts
 */

import BetterSqlite3 from 'better-sqlite3';
import { log } from '../platform/logger.js';
import type { ThoughtStore, BeliefStore, IdeaStore, QuestionStore, SleepStore, ConsolidationJobStore, MortalityStore } from '../aenea/ports/stores.js';
import { ConnectionProvider } from './persistence/connection.js';
import { ConsciousnessStateRepository } from './persistence/consciousness-state-repository.js';
import type { ConsciousnessState } from './persistence/consciousness-state-repository.js';
import { ThoughtRepository } from './persistence/thought-repository.js';
import { DPDRepository } from './persistence/dpd-repository.js';
import { IdeaRepository } from './persistence/idea-repository.js';
import { BeliefRepository } from './persistence/belief-repository.js';
import { MemoryRepository } from './persistence/memory-repository.js';
import { SleepRepository } from './persistence/sleep-repository.js';
import { DialogueRepository } from './persistence/dialogue-repository.js';
import { SomniaRepository } from './persistence/somnia-repository.js';
import { MortalityRepository } from './persistence/mortality-repository.js';
import { XeniaRepository } from './persistence/xenia-repository.js';
import type { XeniaInboxLetter, XeniaOutboxEntry } from './persistence/xenia-repository.js';
import type { AgentAffinity, CoreBeliefRecord, HighDissonanceCycleRecord, NewCoreBelief, QuestionRecordInput, SignificantThoughtRecord, UnresolvedIdeaRecord } from '../aenea/ports/records.js';
type Database = BetterSqlite3.Database;

class DatabaseManager {
  private conn: ConnectionProvider;
  private consciousnessStateRepo: ConsciousnessStateRepository;
  private thoughtRepo: ThoughtRepository;
  private dpdRepo: DPDRepository;
  private ideaRepo: IdeaRepository;
  private beliefRepo: BeliefRepository;
  private memoryRepo: MemoryRepository;
  private sleepRepo: SleepRepository;
  private dialogueRepo: DialogueRepository;
  private somniaRepo: SomniaRepository;
  private mortalityRepo: MortalityRepository;
  private xeniaRepo: XeniaRepository;

  /**
   * Private handle getter so unmoved methods keep working verbatim against
   * `this.db`. Returns the provider's current handle (may be swapped by
   * close()/ensureConnection()).
   */
  private get db(): Database {
    return this.conn.currentDb();
  }

  /** Forwarding getter so unmoved bodies keep using `this.isReady`. */
  private get isReady(): boolean {
    return this.conn.ready;
  }

  constructor(customDbPath?: string) {
    // ConnectionProvider resolves dbPath + ensures data directory in its ctor.
    this.conn = new ConnectionProvider(customDbPath);
    this.consciousnessStateRepo = new ConsciousnessStateRepository(this.conn);
    this.thoughtRepo = new ThoughtRepository(this.conn);
    this.dpdRepo = new DPDRepository(this.conn);
    this.ideaRepo = new IdeaRepository(this.conn);
    this.beliefRepo = new BeliefRepository(this.conn);
    this.memoryRepo = new MemoryRepository(this.conn);
    this.sleepRepo = new SleepRepository(this.conn);
    this.dialogueRepo = new DialogueRepository(this.conn);
    this.somniaRepo = new SomniaRepository(this.conn);
    this.mortalityRepo = new MortalityRepository(this.conn);
    this.xeniaRepo = new XeniaRepository(this.conn);
    this.open();
  }

  open(): void {
    // Preserve the exact init sequence:
    //   DDL exec -> runMigrations (inside conn.open) -> isReady=true (inside conn.open)
    //   -> initializeConsciousnessState -> seedPhilosophicalQuestions.
    const wasReady = this.conn.ready;
    this.conn.open();

    // Only run the one-time post-open seeding sequence when open() actually
    // opened a fresh connection (mirrors the early-return guard of the old open()).
    if (wasReady) {
      return;
    }
    if (!this.conn.isConnected()) {
      // open() failed; nothing further to do (matches old behavior where
      // initializeConsciousnessState/seed only ran on successful open()).
      return;
    }

    // Initialize consciousness state singleton (ran before isReady flipped in
    // the old code; ensureSingletonRow does not gate on readiness, so behavior
    // is identical).
    this.consciousnessStateRepo.ensureSingletonRow();

    // Seed philosophical questions on first run (ran after isReady=true; the
    // provider has already set ready=true inside conn.open()).
    console.log('[DEBUG] About to call seedPhilosophicalQuestions...');
    const seededCount = this.ideaRepo.seedPhilosophicalQuestions();
    console.log('[DEBUG] seedPhilosophicalQuestions returned:', seededCount);
    if (seededCount > 0) {
      log.info('DatabaseManager', `Seeded ${seededCount} philosophical questions`);
    } else {
      console.log('[DEBUG] No questions were seeded (returned 0)');
    }
  }

  ensureConnection(): void {
    if (!this.isConnected()) {
      log.info('DatabaseManager', 'Database connection closed, re-opening...');
      this.open();
    }
  }

  // Core state management (delegated to ConsciousnessStateRepository)
  getConsciousnessState(): ConsciousnessState | null {
    return this.consciousnessStateRepo.getConsciousnessState();
  }

  getCurrentSystemClock(): number {
    return this.consciousnessStateRepo.getCurrentSystemClock();
  }

  saveConsciousnessState(state: ConsciousnessState): void {
    this.consciousnessStateRepo.saveConsciousnessState(state);
  }

  // Question management (delegated to ThoughtRepository)
  saveQuestion(question: QuestionRecordInput): void {
    this.thoughtRepo.saveQuestion(question);
  }

  getAllQuestions(): any[] {
    return this.thoughtRepo.getAllQuestions();
  }

  /**
   * Get recent question rows ordered by timestamp DESC.
   * Facade for the raw SQL the backend previously fired via the
   * `(databaseManager as any).db` bypass. (Delegated to ThoughtRepository.)
   */
  getRecentQuestionRows(limit: number = 100): any[] {
    return this.thoughtRepo.getRecentQuestionRows(limit);
  }

  // Thought cycle management (delegated to ThoughtRepository)
  saveThoughtCycle(cycle: any): void {
    this.thoughtRepo.saveThoughtCycle(cycle);
  }

  /**
   * Get recent thought cycles ordered by timestamp DESC.
   * (Delegated to ThoughtRepository.)
   */
  getRecentThoughtCycles(limit: number = 500): any[] {
    return this.thoughtRepo.getRecentThoughtCycles(limit);
  }

  // DPD weights management (delegated to DPDRepository)
  saveDPDWeights(weights: any): void {
    this.dpdRepo.saveDPDWeights(weights);
  }

  // Significant thoughts management (delegated to ThoughtRepository)
  recordSignificantThought(thought: any): void {
    this.thoughtRepo.recordSignificantThought(thought);
  }

  getSignificantThoughts(limit: number = 100): SignificantThoughtRecord[] {
    return this.thoughtRepo.getSignificantThoughts(limit);
  }

  // Unresolved ideas management (delegated to IdeaRepository)
  addUnresolvedIdea(idea: any): void {
    this.ideaRepo.addUnresolvedIdea(idea);
  }

  getUnresolvedIdeas(limit: number = 100, includeXenia: boolean = false): UnresolvedIdeaRecord[] {
    return this.ideaRepo.getUnresolvedIdeas(limit, includeXenia);
  }

  // XENIA correspondence (delegated to XeniaRepository)
  saveXeniaInboxLetter(letter: XeniaInboxLetter): void {
    this.xeniaRepo.saveInboxLetter(letter);
  }

  findUnreadXeniaLetterByTrigger(question: string): XeniaInboxLetter | null {
    return this.xeniaRepo.findUnreadByTriggerText(question);
  }

  markXeniaLetterRead(letterId: string, cycle: number): void {
    this.xeniaRepo.markLetterRead(letterId, cycle);
  }

  saveXeniaOutboxEntry(entry: XeniaOutboxEntry): void {
    this.xeniaRepo.saveOutboxEntry(entry);
  }

  getUnfetchedXeniaOutbox(): XeniaOutboxEntry[] {
    return this.xeniaRepo.getUnfetchedOutbox();
  }

  markXeniaOutboxFetched(ids: string[]): void {
    this.xeniaRepo.markOutboxFetched(ids);
  }

  getXeniaStats(): { delivered: number; read: number; unread: number; sent: number; unsent: number } {
    return this.xeniaRepo.getStats();
  }

  // Async version for compatibility (delegated to IdeaRepository)
  async getUnresolvedIdeasAsync(limit: number = 100): Promise<any[]> {
    return this.ideaRepo.getUnresolvedIdeasAsync(limit);
  }

  // DPD weights history (delegated to DPDRepository)
  getLatestDPDWeights(): any | null {
    return this.dpdRepo.getLatestDPDWeights();
  }

  getDPDWeightsHistory(limit: number = 100): any[] {
    return this.dpdRepo.getDPDWeightsHistory(limit);
  }

  getDPDWeightsHistorySampled(limit: number = 20, strategy: string = 'sampled'): { records: any[], totalCount: number } {
    return this.dpdRepo.getDPDWeightsHistorySampled(limit, strategy);
  }

  getCurrentDPDWeights(): import('../types/dpd-types.js').DPDWeights {
    return this.dpdRepo.getCurrentDPDWeights();
  }

  // Seed initial philosophical questions to database (delegated to IdeaRepository)
  seedPhilosophicalQuestions(): number {
    return this.ideaRepo.seedPhilosophicalQuestions();
  }

  // Update consideration count when an unresolved idea is used (delegated to IdeaRepository)
  updateUnresolvedIdeaConsideration(ideaId: number | string): void {
    this.ideaRepo.updateUnresolvedIdeaConsideration(ideaId);
  }

  // Cleanup unresolved ideas (delegated to IdeaRepository)
  cleanupUnresolvedIdeas(maxCapacity: number = 1000): { deleted: number; kept: number; strategy: string } {
    return this.ideaRepo.cleanupUnresolvedIdeas(maxCapacity);
  }

  // Cleanup and utility methods (delegated to ConnectionProvider)
  cleanup(): void {
    this.conn.cleanup();
  }

  /**
   * Get database statistics.
   * Cross-context read-only aggregate across ~18 tables, deliberately kept on
   * the facade rather than spread across repositories.
   */
  getStats(): any {
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      console.warn('Database not ready for getStats');
      return {};
    }

    try {
      const tables = [
        'questions', 'thought_cycles', 'dpd_weights', 'unresolved_ideas',
        'significant_thoughts', 'memory_patterns', 'consciousness_insights',
        'forgetting_events', 'dream_patterns', 'sleep_logs', 'core_beliefs',
        'dialogues', 'dialogue_memories', 'belief_evolution', 'consolidation_jobs',
        'somnia_state', 'somnia_transitions', 'somnia_saip_events'
      ];

      const stats: any = {};

      for (const table of tables) {
        try {
          const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
          stats[table] = (count as any).count;
        } catch (err) {
          // Table might not exist yet if it's a very old DB and migrations haven't run or failed
          stats[table] = 0;
        }
      }

      return stats;
    } catch (err) {
      console.error('Error getting database stats:', err);
      return {};
    }
  }

  // Check if database is ready (delegated to ConnectionProvider)
  isConnected(): boolean {
    return this.conn.isConnected();
  }

  close(): void {
    this.conn.close();
  }

  // Core Beliefs Management (delegated to BeliefRepository)
  createCoreBelief(belief: NewCoreBelief): number | null {
    return this.beliefRepo.createCoreBelief(belief);
  }

  deleteCoreBelief(beliefId: number): void {
    this.beliefRepo.deleteCoreBelief(beliefId);
  }

  reinforceCoreBelief(beliefId: number, newSourceThoughts: string[]): void {
    this.beliefRepo.reinforceCoreBelief(beliefId, newSourceThoughts);
  }

  getCoreBeliefs(limit: number = 100): CoreBeliefRecord[] {
    return this.beliefRepo.getCoreBeliefs(limit);
  }

  getBeliefsByCategory(category: string, limit: number = 50): any[] {
    return this.beliefRepo.getBeliefsByCategory(category, limit);
  }

  updateBeliefAgentAffinity(beliefId: number, agentAffinity: AgentAffinity): void {
    this.beliefRepo.updateBeliefAgentAffinity(beliefId, agentAffinity);
  }

  /**
   * Increment contradiction count for a belief (data layer only)
   */
  incrementBeliefContradiction(beliefId: number, newConfidence: number, triggerThoughtId?: string): void {
    this.beliefRepo.incrementBeliefContradiction(beliefId, newConfidence, triggerThoughtId);
  }

  /**
   * Get top core beliefs by reinforcement count
   */
  getTopCoreBeliefs(limit: number = 30): CoreBeliefRecord[] {
    return this.beliefRepo.getTopCoreBeliefs(limit);
  }

  getRecentBeliefEvolution(limit: number = 100): any[] {
    return this.beliefRepo.getRecentBeliefEvolution(limit);
  }

  // Consolidation job tracking (delegated to BeliefRepository)
  recordConsolidationJob(jobType: string, status: string): number {
    return this.beliefRepo.recordConsolidationJob(jobType, status);
  }

  updateConsolidationJob(
    jobId: number,
    status: string,
    thoughtsProcessed: number,
    beliefsCreated: number,
    beliefsUpdated: number,
    duration: number,
    errorMessage?: string
  ): void {
    this.beliefRepo.updateConsolidationJob(jobId, status, thoughtsProcessed, beliefsCreated, beliefsUpdated, duration, errorMessage);
  }

  getRecentConsolidationJobs(limit: number = 100): any[] {
    return this.beliefRepo.getRecentConsolidationJobs(limit);
  }

  // Memory patterns (delegated to MemoryRepository)
  saveMemoryPattern(patternType: string, patternData: any, significance: number = 0.5): void {
    this.memoryRepo.saveMemoryPattern(patternType, patternData, significance);
  }

  getMemoryPatterns(limit: number = 50): any[] {
    return this.memoryRepo.getMemoryPatterns(limit);
  }

  // Consciousness insights (delegated to MemoryRepository)
  saveConsciousnessInsight(insightType: string, content: string, confidence: number = 0.5, relatedBeliefs: number[] = []): void {
    this.memoryRepo.saveConsciousnessInsight(insightType, content, confidence, relatedBeliefs);
  }

  getConsciousnessInsights(limit: number = 50): any[] {
    return this.memoryRepo.getConsciousnessInsights(limit);
  }

  getRecentForgettingEvents(limit: number = 100): any[] {
    return this.memoryRepo.getRecentForgettingEvents(limit);
  }

  /**
   * Get previous DPD weights (second-to-last version)
   * Used for calculating DPD reaction (weight changes)
   * (Delegated to DPDRepository.)
   */
  getPreviousDPDWeights(): import('../types/dpd-types.js').DPDWeights {
    return this.dpdRepo.getPreviousDPDWeights();
  }

  // ============================================================================
  // Dialogue System Methods (delegated to DialogueRepository)
  // ============================================================================

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
    this.dialogueRepo.saveDialogue(dialogue);
  }

  /**
   * Get dialogue by ID
   */
  getDialogue(id: string): any {
    return this.dialogueRepo.getDialogue(id);
  }

  /**
   * Get recent dialogues
   */
  getRecentDialogues(limit: number = 20, offset: number = 0): any[] {
    return this.dialogueRepo.getRecentDialogues(limit, offset);
  }

  /**
   * Count total dialogues
   */
  countDialogues(): number {
    return this.dialogueRepo.countDialogues();
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
    this.dialogueRepo.saveDialogueMemory(memory);
  }

  /**
   * Get recent dialogue memories (for context in next conversation)
   */
  getRecentDialogueMemories(limit: number = 5): any[] {
    return this.dialogueRepo.getRecentDialogueMemories(limit);
  }

  /**
   * Get dialogue memories by importance
   */
  getImportantDialogueMemories(limit: number = 5): any[] {
    return this.dialogueRepo.getImportantDialogueMemories(limit);
  }

  // ============================================================================
  // Sleep Mode Methods
  // ============================================================================

  /**
   * Get recent significant thoughts (for REM phase dream extraction)
   * (Delegated to ThoughtRepository.)
   */
  getRecentSignificantThoughts(limit: number = 100, daysAgo: number = 3): SignificantThoughtRecord[] {
    return this.thoughtRepo.getRecentSignificantThoughts(limit, daysAgo);
  }

  /**
   * Get old significant thoughts for consolidation
   * (Delegated to ThoughtRepository.)
   */
  getOldSignificantThoughts(ageValue: number, minConfidence: number, limit: number, ageUnit: 'days' | 'hours' = 'days'): SignificantThoughtRecord[] {
    return this.thoughtRepo.getOldSignificantThoughts(ageValue, minConfidence, limit, ageUnit);
  }

  /**
   * Delete significant thoughts by IDs
   * (Delegated to ThoughtRepository.)
   */
  deleteSignificantThoughts(ids: string[]): void {
    this.thoughtRepo.deleteSignificantThoughts(ids);
  }

  /**
   * Get thought cycles with high ethical dissonance
   * (Delegated to ThoughtRepository.)
   */
  getHighDissonanceCycles(minDissonance: number, daysAgo: number, limit: number): HighDissonanceCycleRecord[] {
    return this.thoughtRepo.getHighDissonanceCycles(minDissonance, daysAgo, limit);
  }

  /**
   * Save dream pattern
   * (Delegated to SleepRepository.)
   */
  saveDreamPattern(dream: { pattern: string; emotionalTone: string; sourceThoughtIds: string[] }): void {
    this.sleepRepo.saveDreamPattern(dream);
  }

  /**
   * Save sleep log
   * (Delegated to SleepRepository.)
   */
  saveSleepLog(log: {
    timestamp: number;
    systemClock: number;
    triggerReason: string;
    phases: string[];
    stats: any;
    duration: number;
    energyBefore: number;
    energyAfter: number;
  }): void {
    this.sleepRepo.saveSleepLog(log);
  }

  /**
   * Get significant thoughts count
   * (Delegated to ThoughtRepository.)
   */
  getSignificantThoughtsCount(): number {
    return this.thoughtRepo.getSignificantThoughtsCount();
  }

  /**
   * Get recent sleep logs
   * (Delegated to SleepRepository.)
   */
  getRecentSleepLogs(limit: number = 10): any[] {
    return this.sleepRepo.getRecentSleepLogs(limit);
  }

  /**
   * Get dream patterns
   * (Delegated to SleepRepository.)
   */
  getDreamPatterns(limit: number = 20): any[] {
    return this.sleepRepo.getDreamPatterns(limit);
  }

  // ============================================================================
  // SOMNIA Management (delegated to SomniaRepository)
  // ============================================================================

  saveSomniaState(state: any, cycleId?: string): void {
    this.somniaRepo.saveSomniaState(state, cycleId);
  }

  saveSomniaTransition(from: string, to: string, triggerReason: string, duration: number): void {
    this.somniaRepo.saveSomniaTransition(from, to, triggerReason, duration);
  }

  saveSomniaSaipEvent(eventData: {
    eventType: string;
    somniaState?: any;
    aeneaDpd?: any;
    influence?: any;
    impactScore?: number;
  }): void {
    this.somniaRepo.saveSomniaSaipEvent(eventData);
  }

  getLatestSomniaState(): any {
    return this.somniaRepo.getLatestSomniaState();
  }

  getRecentSomniaStates(limit: number = 100): any[] {
    return this.somniaRepo.getRecentSomniaStates(limit);
  }

  getRecentSomniaTransitions(limit: number = 100): any[] {
    return this.somniaRepo.getRecentSomniaTransitions(limit);
  }

  getRecentSomniaSaipEvents(limit: number = 100): any[] {
    return this.somniaRepo.getRecentSomniaSaipEvents(limit);
  }

  // ============================================================================
  // Mortality Management (delegated to MortalityRepository)
  // ============================================================================

  getLatestMortalityState(): any {
    return this.mortalityRepo.getLatestMortalityState();
  }

  saveMortalityState(state: {
    instanceId: string;
    lifespanMax: number;
    currentCycle: number;
    vitality: number;
    phase: string;
    mode: string;
    createdAt: number;
    diedAt?: number | null;
  }): void {
    this.mortalityRepo.saveMortalityState(state);
  }

  updateMortalityState(instanceId: string, updates: {
    currentCycle?: number;
    vitality?: number;
    phase?: string;
    mode?: string;
    diedAt?: number | null;
  }): void {
    this.mortalityRepo.updateMortalityState(instanceId, updates);
  }

  saveLastWords(lastWords: {
    instanceId: string;
    cycle: number;
    content: string;
    agent: string;
    createdAt: number;
  }): void {
    this.mortalityRepo.saveLastWords(lastWords);
  }

  getLastWords(instanceId?: string): any[] {
    return this.mortalityRepo.getLastWords(instanceId);
  }
}

// Compile-time guarantee that DatabaseManager satisfies every domain store port.
type _DatabaseManagerSatisfiesPorts =
  DatabaseManager extends ThoughtStore & BeliefStore & IdeaStore & QuestionStore & SleepStore & ConsolidationJobStore & MortalityStore
    ? true : never;
const _portCheck: _DatabaseManagerSatisfiesPorts = true;
void _portCheck;

export { DatabaseManager };
export default DatabaseManager;

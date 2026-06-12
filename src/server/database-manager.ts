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
type Database = BetterSqlite3.Database;

class DatabaseManager {
  private conn: ConnectionProvider;
  private consciousnessStateRepo: ConsciousnessStateRepository;
  private thoughtRepo: ThoughtRepository;
  private dpdRepo: DPDRepository;
  private ideaRepo: IdeaRepository;

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
  saveQuestion(question: any): void {
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

  // DPD weights management (delegated to DPDRepository)
  saveDPDWeights(weights: any): void {
    this.dpdRepo.saveDPDWeights(weights);
  }

  // Significant thoughts management (delegated to ThoughtRepository)
  recordSignificantThought(thought: any): void {
    this.thoughtRepo.recordSignificantThought(thought);
  }

  getSignificantThoughts(limit: number = 100): any[] {
    return this.thoughtRepo.getSignificantThoughts(limit);
  }

  // Unresolved ideas management (delegated to IdeaRepository)
  addUnresolvedIdea(idea: any): void {
    this.ideaRepo.addUnresolvedIdea(idea);
  }

  getUnresolvedIdeas(limit: number = 100): any[] {
    return this.ideaRepo.getUnresolvedIdeas(limit);
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

  // Get database statistics
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

  // Core Beliefs Management
  createCoreBelief(belief: any): number | null {
    if (!this.isReady || !this.db) {
      return null;
    }

    try {
      const beliefContent = belief.belief_content;
      const result = this.db.prepare(`
        INSERT INTO core_beliefs
        (belief_content, category, confidence, strength, source_thoughts,
         first_formed, last_reinforced, reinforcement_count, contradiction_count, agent_affinity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        beliefContent,
        belief.category || 'general',
        belief.confidence || 0.5,
        belief.strength || 0.5,
        JSON.stringify(belief.source_thoughts || []),
        belief.first_formed || Date.now(),
        belief.last_reinforced || Date.now(),
        belief.reinforcement_count || 1,
        belief.contradiction_count || 0,
        JSON.stringify(belief.agent_affinity || {})
      );

      const beliefId = result.lastInsertRowid as number;

      // Record belief formation event
      this.recordBeliefEvolution(beliefId, 'formed', null, belief.confidence, null, 'Initial belief formation');

      return beliefId;
    } catch (err) {
      console.error('Error creating core belief:', err);
      return null;
    }
  }

  deleteCoreBelief(beliefId: number): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      // Delete related belief_evolution records first (FOREIGN KEY constraint)
      this.db.prepare('DELETE FROM belief_evolution WHERE belief_id = ?').run(beliefId);
      // Then delete the core belief
      this.db.prepare('DELETE FROM core_beliefs WHERE id = ?').run(beliefId);
    } catch (err) {
      console.error('Error deleting core belief:', err);
      throw err; // Re-throw to let caller handle
    }
  }

  reinforceCoreBelief(beliefId: number, newSourceThoughts: string[]): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      // Get current belief
      const current = this.db.prepare('SELECT * FROM core_beliefs WHERE id = ?').get(beliefId);
      if (!current) return;

      const oldConfidence = current.confidence;
      const oldStrength = current.strength;

      // Increase confidence and strength slightly
      const newConfidence = Math.min(1.0, oldConfidence + 0.05);
      const newStrength = Math.min(1.0, oldStrength + 0.03);

      // Merge source thoughts
      const existingSources = JSON.parse(current.source_thoughts || '[]');
      const mergedSources = [...new Set([...existingSources, ...newSourceThoughts])];

      // Update belief
      this.db.prepare(`
        UPDATE core_beliefs
        SET confidence = ?, strength = ?, source_thoughts = ?,
            last_reinforced = ?, reinforcement_count = reinforcement_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newConfidence, newStrength, JSON.stringify(mergedSources), Date.now(), beliefId);

      // Record reinforcement event
      this.recordBeliefEvolution(
        beliefId,
        'reinforced',
        oldConfidence,
        newConfidence,
        newSourceThoughts[0],
        `Confidence: ${oldConfidence.toFixed(3)} → ${newConfidence.toFixed(3)}`
      );

    } catch (err) {
      console.error('Error reinforcing belief:', err);
    }
  }

  getCoreBeliefs(limit: number = 100): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }

    try {
      const result = this.db.prepare(`
        SELECT * FROM core_beliefs
        ORDER BY reinforcement_count DESC, strength DESC, confidence DESC
        LIMIT ?
      `).all(limit);

      return result.map((b: any) => ({
        ...b,
        source_thoughts: JSON.parse(b.source_thoughts || '[]'),
        agent_affinity: JSON.parse(b.agent_affinity || '{}')
      }));
    } catch (err) {
      console.error('Error getting core beliefs:', err);
      return [];
    }
  }

  getBeliefsByCategory(category: string, limit: number = 50): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }

    try {
      const result = this.db.prepare(`
        SELECT * FROM core_beliefs
        WHERE category = ?
        ORDER BY reinforcement_count DESC, strength DESC, confidence DESC
        LIMIT ?
      `).all(category, limit);

      return result.map((b: any) => ({
        ...b,
        source_thoughts: JSON.parse(b.source_thoughts || '[]'),
        agent_affinity: JSON.parse(b.agent_affinity || '{}')
      }));
    } catch (err) {
      console.error('Error getting beliefs by category:', err);
      return [];
    }
  }

  recordBeliefEvolution(
    beliefId: number,
    eventType: string,
    oldConfidence: number | null,
    newConfidence: number | null,
    triggerThoughtId: string | null,
    notes: string | null
  ): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        INSERT INTO belief_evolution
        (belief_id, timestamp, event_type, old_confidence, new_confidence, trigger_thought_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(beliefId, Date.now(), eventType, oldConfidence, newConfidence, triggerThoughtId, notes);
    } catch (err) {
      console.error('Error recording belief evolution:', err);
    }
  }

  updateBeliefAgentAffinity(beliefId: number, agentAffinity: any): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        UPDATE core_beliefs
        SET agent_affinity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(agentAffinity), beliefId);
    } catch (err) {
      console.error('Error updating belief agent affinity:', err);
    }
  }

  /**
   * Increment contradiction count for a belief (data layer only)
   */
  incrementBeliefContradiction(beliefId: number, newConfidence: number, triggerThoughtId?: string): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      const current = this.db.prepare('SELECT * FROM core_beliefs WHERE id = ?').get(beliefId);
      if (!current) return;

      const oldConfidence = current.confidence;

      // Update belief
      this.db.prepare(`
        UPDATE core_beliefs
        SET contradiction_count = contradiction_count + 1,
            confidence = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newConfidence, beliefId);

      // Record challenge event
      this.recordBeliefEvolution(
        beliefId,
        'challenged',
        oldConfidence,
        newConfidence,
        triggerThoughtId || null,
        `Belief challenged (contradictions: ${current.contradiction_count + 1})`
      );
    } catch (err) {
      console.error('Error incrementing belief contradiction:', err);
    }
  }

  // Consolidation job tracking
  recordConsolidationJob(jobType: string, status: string): number {
    if (!this.isReady || !this.db) {
      return -1;
    }

    try {
      const result = this.db.prepare(`
        INSERT INTO consolidation_jobs
        (timestamp, job_type, status)
        VALUES (?, ?, ?)
      `).run(Date.now(), jobType, status);

      return result.lastInsertRowid as number;
    } catch (err) {
      console.error('Error recording consolidation job:', err);
      return -1;
    }
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
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        UPDATE consolidation_jobs
        SET status = ?, thoughts_processed = ?, beliefs_created = ?,
            beliefs_updated = ?, duration_ms = ?, error_message = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, thoughtsProcessed, beliefsCreated, beliefsUpdated, duration, errorMessage || null, jobId);
    } catch (err) {
      console.error('Error updating consolidation job:', err);
    }
  }

  // Memory patterns
  saveMemoryPattern(patternType: string, patternData: any, significance: number = 0.5): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      const dataJson = typeof patternData === 'string' ? patternData : JSON.stringify(patternData);
      const now = Date.now();

      // Check if pattern exists
      const existing = this.db.prepare(`
        SELECT id, frequency FROM memory_patterns
        WHERE pattern_type = ? AND pattern_data = ?
      `).get(patternType, dataJson);

      if (existing) {
        // Update frequency
        this.db.prepare(`
          UPDATE memory_patterns
          SET frequency = frequency + 1, last_seen = ?, significance = ?
          WHERE id = ?
        `).run(now, significance, (existing as any).id);
      } else {
        // Insert new pattern
        this.db.prepare(`
          INSERT INTO memory_patterns
          (pattern_type, pattern_data, frequency, last_seen, significance)
          VALUES (?, ?, 1, ?, ?)
        `).run(patternType, dataJson, now, significance);
      }
    } catch (err) {
      console.error('Error saving memory pattern:', err);
    }
  }

  getMemoryPatterns(limit: number = 50): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }

    try {
      const results = this.db.prepare(`
        SELECT * FROM memory_patterns
        ORDER BY significance DESC, frequency DESC, last_seen DESC
        LIMIT ?
      `).all(limit);

      return results.map((p: any) => ({
        ...p,
        pattern_data: this.tryParseJSON(p.pattern_data)
      }));
    } catch (err) {
      console.error('Error getting memory patterns:', err);
      return [];
    }
  }

  // Consciousness insights
  saveConsciousnessInsight(insightType: string, content: string, confidence: number = 0.5, relatedBeliefs: number[] = []): void {
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      const now = Date.now();
      const beliefsJson = JSON.stringify(relatedBeliefs);

      this.db.prepare(`
        INSERT INTO consciousness_insights
        (timestamp, insight_type, insight_content, confidence, related_patterns)
        VALUES (?, ?, ?, ?, ?)
      `).run(now, insightType, content, confidence, beliefsJson);
    } catch (err) {
      console.error('Error saving consciousness insight:', err);
    }
  }

  getConsciousnessInsights(limit: number = 50): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }

    try {
      const results = this.db.prepare(`
        SELECT * FROM consciousness_insights
        ORDER BY confidence DESC, timestamp DESC
        LIMIT ?
      `).all(limit);

      return results.map((i: any) => ({
        ...i,
        related_patterns: JSON.parse(i.related_patterns || '[]')
      }));
    } catch (err) {
      console.error('Error getting consciousness insights:', err);
      return [];
    }
  }

  private tryParseJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
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
  // Dialogue System Methods
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
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO dialogues (
          id, human_message, aenea_response,
          immediate_reaction, new_question, emotional_state,
          empathy_shift, coherence_shift, dissonance_shift,
          system_clock, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        dialogue.id,
        dialogue.humanMessage,
        dialogue.aeneaResponse,
        dialogue.immediateReaction || null,
        dialogue.newQuestion || null,
        dialogue.emotionalState || null,
        dialogue.empathyShift || 0,
        dialogue.coherenceShift || 0,
        dialogue.dissonanceShift || 0,
        dialogue.systemClock || null,
        dialogue.timestamp
      );
    } catch (err) {
      console.error('Error saving dialogue:', err);
    }
  }

  /**
   * Get dialogue by ID
   */
  getDialogue(id: string): any {
    if (!this.isReady || !this.db) {
      return null;
    }
    try {
      const stmt = this.db.prepare('SELECT * FROM dialogues WHERE id = ?');
      return stmt.get(id);
    } catch (err) {
      console.error('Error getting dialogue:', err);
      return null;
    }
  }

  /**
   * Get recent dialogues
   */
  getRecentDialogues(limit: number = 20, offset: number = 0): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM dialogues
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `);
      return stmt.all(limit, offset);
    } catch (err) {
      console.error('Error getting recent dialogues:', err);
      return [];
    }
  }

  /**
   * Count total dialogues
   */
  countDialogues(): number {
    if (!this.isReady || !this.db) {
      return 0;
    }
    try {
      const result = this.db.prepare('SELECT COUNT(*) as count FROM dialogues').get() as any;
      return result?.count || 0;
    } catch (err) {
      console.error('Error counting dialogues:', err);
      return 0;
    }
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
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO dialogue_memories (
          dialogue_id, memory_summary, topics,
          importance, emotional_impact, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        memory.dialogueId,
        memory.memorySummary,
        memory.topics || null,
        memory.importance || 0.5,
        memory.emotionalImpact || 0.5,
        memory.timestamp
      );
    } catch (err) {
      console.error('Error saving dialogue memory:', err);
    }
  }

  /**
   * Get recent dialogue memories (for context in next conversation)
   */
  getRecentDialogueMemories(limit: number = 5): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM dialogue_memories
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting recent dialogue memories:', err);
      return [];
    }
  }

  /**
   * Get dialogue memories by importance
   */
  getImportantDialogueMemories(limit: number = 5): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM dialogue_memories
        ORDER BY importance DESC, timestamp DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting important dialogue memories:', err);
      return [];
    }
  }

  // ============================================================================
  // Sleep Mode Methods
  // ============================================================================

  /**
   * Get recent significant thoughts (for REM phase dream extraction)
   * (Delegated to ThoughtRepository.)
   */
  getRecentSignificantThoughts(limit: number = 100, daysAgo: number = 3): any[] {
    return this.thoughtRepo.getRecentSignificantThoughts(limit, daysAgo);
  }

  /**
   * Get old significant thoughts for consolidation
   * (Delegated to ThoughtRepository.)
   */
  getOldSignificantThoughts(ageValue: number, minConfidence: number, limit: number, ageUnit: 'days' | 'hours' = 'days'): any[] {
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
   * Get top core beliefs by reinforcement count
   */
  getTopCoreBeliefs(limit: number = 30): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM core_beliefs
        ORDER BY reinforcement_count DESC, confidence DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting top core beliefs:', err);
      return [];
    }
  }

  /**
   * Get thought cycles with high ethical dissonance
   * (Delegated to ThoughtRepository.)
   */
  getHighDissonanceCycles(minDissonance: number, daysAgo: number, limit: number): any[] {
    return this.thoughtRepo.getHighDissonanceCycles(minDissonance, daysAgo, limit);
  }

  /**
   * Save dream pattern
   */
  saveDreamPattern(dream: { pattern: string; emotionalTone: string; sourceThoughtIds: string[] }): void {
    if (!this.isReady || !this.db) {
      return;
    }
    try {
      const stmt = this.db.prepare(`
        INSERT INTO dream_patterns (pattern, emotional_tone, source_thought_ids, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `);
      stmt.run(dream.pattern, dream.emotionalTone, JSON.stringify(dream.sourceThoughtIds));
    } catch (err) {
      console.error('Error saving dream pattern:', err);
    }
  }

  /**
   * Save sleep log
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
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      return;
    }
    try {
      const stmt = this.db.prepare(`
        INSERT INTO sleep_logs
        (timestamp, system_clock, trigger_reason, phases, stats, duration, energy_before, energy_after, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(
        log.timestamp,
        log.systemClock,
        log.triggerReason,
        JSON.stringify(log.phases),
        JSON.stringify(log.stats),
        log.duration,
        log.energyBefore,
        log.energyAfter
      );
    } catch (err) {
      console.error('Error saving sleep log:', err);
    }
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
   */
  getRecentSleepLogs(limit: number = 10): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM sleep_logs
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting recent sleep logs:', err);
      return [];
    }
  }

  /**
   * Get dream patterns
   */
  getDreamPatterns(limit: number = 20): any[] {
    if (!this.isReady || !this.db) {
      return [];
    }
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM dream_patterns
        ORDER BY created_at DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (err) {
      console.error('Error getting dream patterns:', err);
      return [];
    }
  }

  // ============================================================================
  // SOMNIA Management
  // ============================================================================

  saveSomniaState(state: any, cycleId?: string): void {
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        INSERT INTO somnia_state
        (timestamp, cycle_id, mode, lambda, phi, mu_serotonin, mu_dopamine, mu_cortisol, mu_oxytocin,
         theta, psi, xi, add_pleasure, add_coherence, add_dissonance, add_temporal_flow, add_total, qualia)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        state.timestamp || Date.now(),
        cycleId || null,
        state.mode,
        state.somatic?.lambda ?? 0,
        state.somatic?.phi ?? 0,
        state.somatic?.mu?.serotonin ?? 0,
        state.somatic?.mu?.dopamine ?? 0,
        state.somatic?.mu?.cortisol ?? 0,
        state.somatic?.mu?.oxytocin ?? 0,
        state.affective?.theta ?? 0,
        state.affective?.psi ?? 0,
        state.affective?.xi ?? 0,
        state.add?.pleasure ?? null,
        state.add?.coherence ?? null,
        state.add?.dissonance ?? null,
        state.add?.temporalFlow ?? null,
        state.add?.total ?? null,
        state.cognitive?.qualia ?? null
      );
    } catch (err) {
      console.error('Error saving SOMNIA state:', err);
    }
  }

  saveSomniaTransition(from: string, to: string, triggerReason: string, duration: number): void {
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      return;
    }

    try {
      this.db.prepare(`
        INSERT INTO somnia_transitions
        (timestamp, from_mode, to_mode, trigger_reason, duration_in_previous)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        Date.now(),
        from,
        to,
        triggerReason,
        duration
      );
    } catch (err) {
      console.error('Error saving SOMNIA transition:', err);
    }
  }

  saveSomniaSaipEvent(eventData: {
    eventType: string;
    somniaState?: any;
    aeneaDpd?: any;
    influence?: any;
    impactScore?: number;
  }): void {
    this.ensureConnection();
    if (!this.isReady || !this.db) return;

    try {
      this.db.prepare(`
        INSERT INTO somnia_saip_events
        (timestamp, event_type, somnia_state_json, aenea_dpd_json, influence_json, impact_score)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        Date.now(),
        eventData.eventType,
        eventData.somniaState ? JSON.stringify(eventData.somniaState) : null,
        eventData.aeneaDpd ? JSON.stringify(eventData.aeneaDpd) : null,
        eventData.influence ? JSON.stringify(eventData.influence) : null,
        eventData.impactScore ?? null
      );
    } catch (err) {
      console.error('Error saving SOMNIA SAIP event:', err);
    }
  }

  getLatestSomniaState(): any {
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      return null;
    }

    try {
      return this.db.prepare(`
        SELECT * FROM somnia_state
        ORDER BY timestamp DESC
        LIMIT 1
      `).get();
    } catch (err) {
      console.error('Error getting latest SOMNIA state:', err);
      return null;
    }
  }

  getRecentSomniaStates(limit: number = 100): any[] {
    if (!this.isReady || !this.db) return [];
    try {
      return this.db.prepare(`
        SELECT * FROM somnia_state
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent SOMNIA states:', err);
      return [];
    }
  }

  getRecentSomniaTransitions(limit: number = 100): any[] {
    if (!this.isReady || !this.db) return [];
    try {
      return this.db.prepare(`
        SELECT * FROM somnia_transitions
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent SOMNIA transitions:', err);
      return [];
    }
  }

  getRecentSomniaSaipEvents(limit: number = 100): any[] {
    if (!this.isReady || !this.db) return [];
    try {
      return this.db.prepare(`
        SELECT * FROM somnia_saip_events
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent SOMNIA SAIP events:', err);
      return [];
    }
  }

  getRecentBeliefEvolution(limit: number = 100): any[] {
    if (!this.isReady || !this.db) return [];
    try {
      return this.db.prepare(`
        SELECT be.*, cb.belief_content
        FROM belief_evolution be
        JOIN core_beliefs cb ON be.belief_id = cb.id
        ORDER BY be.timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent belief evolution:', err);
      return [];
    }
  }

  getRecentConsolidationJobs(limit: number = 100): any[] {
    if (!this.isReady || !this.db) return [];
    try {
      return this.db.prepare(`
        SELECT * FROM consolidation_jobs
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent consolidation jobs:', err);
      return [];
    }
  }

  getRecentForgettingEvents(limit: number = 100): any[] {
    if (!this.isReady || !this.db) return [];
    try {
      return this.db.prepare(`
        SELECT * FROM forgetting_events
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    } catch (err) {
      console.error('Error getting recent forgetting events:', err);
      return [];
    }
  }

  // ============================================================================
  // Mortality Management
  // ============================================================================

  getLatestMortalityState(): any {
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      return null;
    }
    try {
      return this.db.prepare(`
        SELECT * FROM mortality_state
        ORDER BY created_at DESC
        LIMIT 1
      `).get();
    } catch (err) {
      console.error('Error getting latest mortality state:', err);
      return null;
    }
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
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      return;
    }
    try {
      this.db.prepare(`
        INSERT INTO mortality_state
        (instance_id, lifespan_max, current_cycle, vitality, phase, mode, created_at, died_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        state.instanceId,
        state.lifespanMax,
        state.currentCycle,
        state.vitality,
        state.phase,
        state.mode,
        state.createdAt,
        state.diedAt || null
      );
    } catch (err) {
      console.error('Error saving mortality state:', err);
    }
  }

  updateMortalityState(instanceId: string, updates: {
    currentCycle?: number;
    vitality?: number;
    phase?: string;
    mode?: string;
    diedAt?: number | null;
  }): void {
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      return;
    }
    try {
      const keys = Object.keys(updates);
      if (keys.length === 0) return;

      const setClause = keys.map(k => {
        const sqlName = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        return `${sqlName} = ?`;
      }).join(', ');

      const values = keys.map(k => (updates as any)[k]);
      values.push(instanceId);

      this.db.prepare(`
        UPDATE mortality_state
        SET ${setClause}
        WHERE instance_id = ?
      `).run(...values);
    } catch (err) {
      console.error('Error updating mortality state:', err);
    }
  }

  saveLastWords(lastWords: {
    instanceId: string;
    cycle: number;
    content: string;
    agent: string;
    createdAt: number;
  }): void {
    this.ensureConnection();
    if (!this.isReady || !this.db) {
      return;
    }
    try {
      this.db.prepare(`
        INSERT INTO last_words
        (instance_id, cycle, content, agent, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        lastWords.instanceId,
        lastWords.cycle,
        lastWords.content,
        lastWords.agent,
        lastWords.createdAt
      );
    } catch (err) {
      console.error('Error saving last words:', err);
    }
  }

  getLastWords(instanceId?: string): any[] {
    this.ensureConnection();
    if (!this.isReady || !this.db) return [];
    try {
      if (instanceId) {
        return this.db.prepare(`
          SELECT * FROM last_words
          WHERE instance_id = ?
          ORDER BY created_at DESC
        `).all(instanceId);
      } else {
        return this.db.prepare(`
          SELECT * FROM last_words
          ORDER BY created_at DESC
        `).all();
      }
    } catch (err) {
      console.error('Error getting last words:', err);
      return [];
    }
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

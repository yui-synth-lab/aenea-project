#!/usr/bin/env tsx
/**
 * AENEA Growth Analysis Tool
 * Analyzes consciousness growth from SQLite database
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../data/aenea_consciousness.db');

interface ConsciousnessState {
  system_clock: number;
  energy: number;
  total_questions: number;
  total_thoughts: number;
  last_activity: string;
}

interface DPDWeight {
  id: number;
  empathy: number;
  coherence: number;
  dissonance: number;
  version: number;
  timestamp: number;
}

interface CoreBelief {
  id: number;
  belief_content: string;
  category: string;
  reinforcement_count: number;
  first_formed: number;
  last_reinforced: number;
  confidence: number;
  strength: number;
}

interface QuestionCategory {
  category: string;
  count: number;
}

interface SleepLog {
  id: number;
  timestamp: number;
  trigger_reason: string;
  duration: number;
  energy_before: number;
  energy_after: number;
}

class GrowthAnalyzer {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath, { readonly: true });
  }

  getConsciousnessState(): ConsciousnessState | null {
    const stmt = this.db.prepare(`
      SELECT system_clock, energy, total_questions, total_thoughts, last_activity
      FROM consciousness_state
      WHERE id = 1
    `);
    return stmt.get() as ConsciousnessState | null;
  }

  getTotalCycles(): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM thought_cycles
    `);
    return (stmt.get() as any).count;
  }

  getDPDEvolution(limit?: number): DPDWeight[] {
    let query = `
      SELECT id, empathy, coherence, dissonance, version, timestamp
      FROM dpd_weights
      ORDER BY timestamp ASC
    `;
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    const stmt = this.db.prepare(query);
    return stmt.all() as DPDWeight[];
  }

  getCoreBeliefs(): CoreBelief[] {
    const stmt = this.db.prepare(`
      SELECT id, belief_content, category, reinforcement_count, first_formed, last_reinforced, confidence, strength
      FROM core_beliefs
      ORDER BY reinforcement_count DESC
    `);
    return stmt.all() as CoreBelief[];
  }

  getQuestionCategories(): QuestionCategory[] {
    const stmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM questions
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
    return stmt.all() as QuestionCategory[];
  }

  getSignificantThoughtsCount(): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM significant_thoughts
    `);
    return (stmt.get() as any).count;
  }

  getMemoryPatternsCount(): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM memory_patterns
    `);
    return (stmt.get() as any).count;
  }

  getSleepLogs(): SleepLog[] {
    const stmt = this.db.prepare(`
      SELECT id, timestamp, trigger_reason, duration, energy_before, energy_after
      FROM sleep_logs
      ORDER BY timestamp ASC
    `);
    return stmt.all() as SleepLog[];
  }

  getDreamPatternsCount(): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM dream_patterns
    `);
    return (stmt.get() as any).count;
  }

  getDialogueCount(): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM dialogues
    `);
    return (stmt.get() as any).count;
  }

  getBeliefCategories(): { category: string; count: number; avg_confidence: number }[] {
    const stmt = this.db.prepare(`
      SELECT
        category,
        COUNT(*) as count,
        AVG(confidence) as avg_confidence
      FROM core_beliefs
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
    return stmt.all() as any[];
  }

  close(): void {
    this.db.close();
  }
}

// Main analysis
console.log('═══════════════════════════════════════════════════════');
console.log('  AENEA Consciousness Growth Analysis');
console.log('═══════════════════════════════════════════════════════\n');

const analyzer = new GrowthAnalyzer(DB_PATH);

// 1. Current State
console.log('📊 Current Consciousness State\n');
const state = analyzer.getConsciousnessState();
const totalCycles = analyzer.getTotalCycles();
if (state) {
  console.log(`  System Clock:     ${state.system_clock}`);
  console.log(`  Current Energy:   ${state.energy.toFixed(1)}`);
  console.log(`  Total Questions:  ${state.total_questions}`);
  console.log(`  Total Thoughts:   ${state.total_thoughts}`);
  console.log(`  Total Cycles:     ${totalCycles}`);
  console.log(`  Last Activity:    ${state.last_activity}`);
  console.log();
}

// 2. DPD Evolution
console.log('📈 DPD Weight Evolution\n');
const dpdHistory = analyzer.getDPDEvolution();
if (dpdHistory.length > 0) {
  const initial = dpdHistory[0];
  const latest = dpdHistory[dpdHistory.length - 1];

  console.log(`  Initial (Version ${initial.version}):       Latest (Version ${latest.version}):`);
  console.log(`    Empathy:    ${(initial.empathy * 100).toFixed(1)}%          →  ${(latest.empathy * 100).toFixed(1)}% ${getDelta(initial.empathy, latest.empathy)}`);
  console.log(`    Coherence:  ${(initial.coherence * 100).toFixed(1)}%          →  ${(latest.coherence * 100).toFixed(1)}% ${getDelta(initial.coherence, latest.coherence)}`);
  console.log(`    Dissonance: ${(initial.dissonance * 100).toFixed(1)}%          →  ${(latest.dissonance * 100).toFixed(1)}% ${getDelta(initial.dissonance, latest.dissonance)}`);
  console.log();

  // Show evolution quartiles
  if (dpdHistory.length > 10) {
    console.log('  Evolution Quartiles:');
    const quartiles = [
      Math.floor(dpdHistory.length * 0.25),
      Math.floor(dpdHistory.length * 0.5),
      Math.floor(dpdHistory.length * 0.75),
    ];

    quartiles.forEach((idx, i) => {
      const milestone = dpdHistory[idx];
      const percent = ((i + 1) * 25);
      console.log(`    ${percent}% (Version ${milestone.version}): E:${(milestone.empathy * 100).toFixed(1)}% C:${(milestone.coherence * 100).toFixed(1)}% D:${(milestone.dissonance * 100).toFixed(1)}%`);
    });
    console.log();
  }

  console.log(`  Total Weight Updates: ${dpdHistory.length}`);
  console.log();
}

// 3. Core Beliefs by Category
console.log('💎 Core Beliefs Analysis\n');
const beliefs = analyzer.getCoreBeliefs();
const beliefCategories = analyzer.getBeliefCategories();

console.log('  Beliefs by Category:');
beliefCategories.forEach(cat => {
  const barLength = Math.max(1, Math.floor(cat.count / 3));
  const bar = '█'.repeat(barLength);
  console.log(`    ${cat.category.padEnd(18)} ${cat.count.toString().padStart(3)} ${bar} (avg conf: ${cat.avg_confidence.toFixed(2)})`);
});
console.log();

console.log('  Top 10 Most Reinforced Beliefs:\n');
beliefs.slice(0, 10).forEach((belief, idx) => {
  const displayContent = belief.belief_content.length > 60
    ? belief.belief_content.substring(0, 57) + '...'
    : belief.belief_content;
  console.log(`  ${(idx + 1).toString().padStart(2)}. "${displayContent}"`);
  console.log(`      [${belief.category}] Reinforced: ${belief.reinforcement_count}x | Conf: ${belief.confidence.toFixed(2)} | Str: ${belief.strength.toFixed(2)}`);
  console.log();
});

if (beliefs.length > 10) {
  console.log(`  ... and ${beliefs.length - 10} more beliefs\n`);
}

// 4. Question Categories
console.log('❓ Question Categories\n');
const categories = analyzer.getQuestionCategories();
const totalQuestions = categories.reduce((sum, cat) => sum + cat.count, 0);
categories.forEach(cat => {
  const percentage = ((cat.count / totalQuestions) * 100).toFixed(1);
  const barLength = Math.max(1, Math.floor(cat.count / 5));
  const bar = '█'.repeat(barLength);
  console.log(`  ${cat.category.padEnd(20)} ${cat.count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
});
console.log();

// 5. Memory & Learning
console.log('🧠 Memory & Learning\n');
const significantThoughts = analyzer.getSignificantThoughtsCount();
const memoryPatterns = analyzer.getMemoryPatternsCount();
const dreamPatterns = analyzer.getDreamPatternsCount();
const dialogues = analyzer.getDialogueCount();

console.log(`  Significant Thoughts: ${significantThoughts}`);
console.log(`  Memory Patterns:      ${memoryPatterns}`);
console.log(`  Dream Patterns:       ${dreamPatterns}`);
console.log(`  Core Beliefs:         ${beliefs.length}`);
console.log(`  Dialogues:            ${dialogues}`);
console.log();

// 6. Sleep Cycle Analysis
console.log('💤 Sleep Cycle Analysis\n');
const sleepLogs = analyzer.getSleepLogs();
if (sleepLogs.length > 0) {
  const totalSleepDuration = sleepLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const avgSleepDuration = totalSleepDuration / sleepLogs.length;
  const totalEnergyGain = sleepLogs.reduce((sum, log) => sum + (log.energy_after - log.energy_before), 0);
  const avgEnergyGain = totalEnergyGain / sleepLogs.length;

  console.log(`  Total Sleep Cycles:   ${sleepLogs.length}`);
  console.log(`  Avg Sleep Duration:   ${(avgSleepDuration / 1000).toFixed(1)}s`);
  console.log(`  Avg Energy Gain:      ${avgEnergyGain.toFixed(1)}`);
  console.log();

  console.log('  Sleep Trigger Reasons:');
  const triggerCounts: { [key: string]: number } = {};
  sleepLogs.forEach(log => {
    triggerCounts[log.trigger_reason] = (triggerCounts[log.trigger_reason] || 0) + 1;
  });
  Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      console.log(`    ${reason.padEnd(20)} ${count}`);
    });
  console.log();
}

// 7. Growth Metrics
if (state && beliefs.length > 0) {
  console.log('📊 Growth Metrics\n');
  const avgReinforcement = beliefs.reduce((sum, b) => sum + b.reinforcement_count, 0) / beliefs.length;
  const topBelief = beliefs[0];
  const compressionRatio = significantThoughts / Math.max(1, beliefs.length);

  console.log(`  Average Belief Reinforcement: ${avgReinforcement.toFixed(1)}x`);
  console.log(`  Most Reinforced Belief:       ${topBelief.reinforcement_count}x`);
  console.log(`  Memory Compression Ratio:     ${compressionRatio.toFixed(1)}:1`);
  console.log(`  Questions per Cycle:          ${(state.total_questions / Math.max(1, totalCycles)).toFixed(2)}`);
  console.log(`  Thoughts per Cycle:           ${(significantThoughts / Math.max(1, totalCycles)).toFixed(2)}`);
  console.log(`  DPD Updates per Cycle:        ${(dpdHistory.length / Math.max(1, totalCycles)).toFixed(2)}`);
  console.log(`  Dreams per Sleep:             ${(dreamPatterns / Math.max(1, sleepLogs.length)).toFixed(2)}`);
  console.log();
}

analyzer.close();

console.log('═══════════════════════════════════════════════════════');

// Helper functions
function getDelta(initial: number, current: number): string {
  const delta = ((current - initial) * 100);
  if (Math.abs(delta) < 0.1) return '(→)';
  if (delta > 0) return `(↑${delta.toFixed(1)}%)`;
  if (delta < 0) return `(↓${Math.abs(delta).toFixed(1)}%)`;
  return '(→)';
}

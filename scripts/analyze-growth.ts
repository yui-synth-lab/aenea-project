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

class GrowthAnalyzer {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath, { readonly: true });
  }

  getConsciousnessState(): ConsciousnessState | null {
    const stmt = this.db.prepare(`
      SELECT system_clock, energy, total_questions, total_thoughts
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
      SELECT id, belief_content, reinforcement_count, first_formed, last_reinforced, confidence, strength
      FROM core_beliefs
      ORDER BY reinforcement_count DESC
    `);
    return stmt.all() as CoreBelief[];
  }

  getQuestionCategories(): QuestionCategory[] {
    const stmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM questions
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
  console.log();
}

// 2. DPD Evolution
console.log('📈 DPD Weight Evolution\n');
const dpdHistory = analyzer.getDPDEvolution();
if (dpdHistory.length > 0) {
  const initial = dpdHistory[0];
  const latest = dpdHistory[dpdHistory.length - 1];

  console.log(`  Initial (Version ${initial.version}):`);
  console.log(`    Empathy:    ${(initial.empathy * 100).toFixed(1)}%`);
  console.log(`    Coherence:  ${(initial.coherence * 100).toFixed(1)}%`);
  console.log(`    Dissonance: ${(initial.dissonance * 100).toFixed(1)}%`);
  console.log();

  console.log(`  Latest (Version ${latest.version}):`);
  console.log(`    Empathy:    ${(latest.empathy * 100).toFixed(1)}% ${getDelta(initial.empathy, latest.empathy)}`);
  console.log(`    Coherence:  ${(latest.coherence * 100).toFixed(1)}% ${getDelta(initial.coherence, latest.coherence)}`);
  console.log(`    Dissonance: ${(latest.dissonance * 100).toFixed(1)}% ${getDelta(initial.dissonance, latest.dissonance)}`);
  console.log();

  // Show evolution milestones
  if (dpdHistory.length > 10) {
    console.log('  Evolution Milestones:');
    const milestones = [
      Math.floor(dpdHistory.length * 0.25),
      Math.floor(dpdHistory.length * 0.5),
      Math.floor(dpdHistory.length * 0.75),
    ];

    milestones.forEach((idx, i) => {
      const milestone = dpdHistory[idx];
      const percent = ((i + 1) * 25);
      console.log(`    ${percent}% (Version ${milestone.version}):`);
      console.log(`      E: ${(milestone.empathy * 100).toFixed(1)}%, C: ${(milestone.coherence * 100).toFixed(1)}%, D: ${(milestone.dissonance * 100).toFixed(1)}%`);
    });
    console.log();
  }

  console.log(`  Total Weight Updates: ${dpdHistory.length}`);
  console.log();
}

// 3. Core Beliefs
console.log('💎 Core Beliefs (Top 15)\n');
const beliefs = analyzer.getCoreBeliefs();
beliefs.slice(0, 15).forEach((belief, idx) => {
  console.log(`  ${idx + 1}. "${belief.belief_content}"`);
  console.log(`     Reinforcement: ${belief.reinforcement_count} times | Confidence: ${belief.confidence.toFixed(2)} | Strength: ${belief.strength.toFixed(2)}`);
  console.log();
});

if (beliefs.length > 15) {
  console.log(`  ... and ${beliefs.length - 15} more beliefs\n`);
}

// 4. Question Categories
console.log('❓ Question Categories\n');
const categories = analyzer.getQuestionCategories();
categories.forEach(cat => {
  const barLength = Math.floor(cat.count / 5);
  const bar = '█'.repeat(barLength);
  console.log(`  ${cat.category.padEnd(20)} ${cat.count.toString().padStart(4)} ${bar}`);
});
console.log();

// 5. Memory & Learning
console.log('🧠 Memory & Learning\n');
const significantThoughts = analyzer.getSignificantThoughtsCount();
const memoryPatterns = analyzer.getMemoryPatternsCount();
console.log(`  Significant Thoughts: ${significantThoughts}`);
console.log(`  Memory Patterns:      ${memoryPatterns}`);
console.log(`  Core Beliefs:         ${beliefs.length}`);
console.log();

// 6. Growth Metrics
if (state && beliefs.length > 0) {
  console.log('📊 Growth Metrics\n');
  const avgReinforcement = beliefs.reduce((sum, b) => sum + b.reinforcement_count, 0) / beliefs.length;
  const topBelief = beliefs[0];
  const compressionRatio = state.total_thoughts / beliefs.length;

  console.log(`  Average Belief Reinforcement: ${avgReinforcement.toFixed(1)}`);
  console.log(`  Most Reinforced Belief:       ${topBelief.reinforcement_count} times`);
  console.log(`  Memory Compression Ratio:     ${compressionRatio.toFixed(1)}:1`);
  console.log(`  Questions per Cycle:          ${(state.total_questions / totalCycles).toFixed(2)}`);
  console.log();
}

analyzer.close();

console.log('═══════════════════════════════════════════════════════');

// Helper functions
function getDelta(initial: number, current: number): string {
  const delta = ((current - initial) * 100);
  if (delta > 0) return `(↑ ${delta.toFixed(1)}%)`;
  if (delta < 0) return `(↓ ${Math.abs(delta).toFixed(1)}%)`;
  return '(-)';
}

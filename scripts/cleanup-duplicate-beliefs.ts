/**
 * Clean up duplicate beliefs in the database
 * Merges duplicates by keeping the one with highest reinforcement count
 */

import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'aenea_consciousness.db');

interface CoreBelief {
  id: number;
  belief_content: string;
  category: string;
  confidence: number;
  strength: number;
  source_thoughts: string;
  first_formed: number;
  last_reinforced: number;
  reinforcement_count: number;
  contradiction_count: number;
  agent_affinity: string;
  created_at: string;
  updated_at: string;
}

function cleanupDuplicates() {
  const db = new Database(DB_PATH);
  console.log('🔍 Finding duplicate beliefs...\n');

  // Find all duplicates
  const duplicates = db.prepare(`
    SELECT belief_content, COUNT(*) as count
    FROM core_beliefs
    GROUP BY belief_content
    HAVING count > 1
    ORDER BY count DESC
  `).all() as { belief_content: string; count: number }[];

  console.log(`Found ${duplicates.length} sets of duplicate beliefs:\n`);

  let totalRemoved = 0;
  let totalReinforced = 0;

  for (const dup of duplicates) {
    console.log(`\n📚 "${dup.belief_content}"`);
    console.log(`   Duplicates: ${dup.count}`);

    // Get all instances of this belief
    const instances = db.prepare(`
      SELECT * FROM core_beliefs
      WHERE belief_content = ?
      ORDER BY reinforcement_count DESC, created_at ASC
    `).all(dup.belief_content) as CoreBelief[];

    // Keep the one with highest reinforcement_count (or earliest if tied)
    const keeper = instances[0];
    const toRemove = instances.slice(1);

    // Calculate merged reinforcement count
    const totalReinforcements = instances.reduce((sum, b) => sum + b.reinforcement_count, 0);

    // Merge source_thoughts
    const allSourceThoughts = new Set<string>();
    for (const belief of instances) {
      try {
        const sources = JSON.parse(belief.source_thoughts || '[]');
        sources.forEach((s: string) => allSourceThoughts.add(s));
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Update keeper with merged data
    db.prepare(`
      UPDATE core_beliefs
      SET reinforcement_count = ?,
          source_thoughts = ?,
          last_reinforced = ?,
          strength = MAX(strength, ?),
          confidence = MAX(confidence, ?)
      WHERE id = ?
    `).run(
      totalReinforcements,
      JSON.stringify(Array.from(allSourceThoughts)),
      Date.now(),
      keeper.strength,
      keeper.confidence,
      keeper.id
    );

    console.log(`   ✓ Keeping #${keeper.id} (reinforcements: ${keeper.reinforcement_count} → ${totalReinforcements})`);

    // Remove duplicates (first update foreign key references)
    for (const belief of toRemove) {
      // Update any belief_evolution entries to point to the keeper
      db.prepare(`
        UPDATE belief_evolution
        SET belief_id = ?
        WHERE belief_id = ?
      `).run(keeper.id, belief.id);

      // Now safe to delete
      db.prepare('DELETE FROM core_beliefs WHERE id = ?').run(belief.id);
      console.log(`   ✗ Removed #${belief.id} (reinforcements: ${belief.reinforcement_count})`);
      totalRemoved++;
    }

    totalReinforced += (totalReinforcements - keeper.reinforcement_count);
  }

  db.close();

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Cleanup complete!`);
  console.log(`   - Removed: ${totalRemoved} duplicate beliefs`);
  console.log(`   - Merged reinforcements: +${totalReinforced}`);
  console.log('='.repeat(60) + '\n');
}

cleanupDuplicates();

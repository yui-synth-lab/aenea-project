/**
 * Clean up invalid beliefs (numbers only, prompt instructions, etc.)
 */

import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'aenea_consciousness.db');

interface CoreBelief {
  id: number;
  belief_content: string;
  created_at: string;
}

function cleanupInvalidBeliefs() {
  const db = new Database(DB_PATH);
  console.log('🔍 Finding invalid beliefs...\n');

  const allBeliefs = db.prepare('SELECT id, belief_content, created_at FROM core_beliefs').all() as CoreBelief[];

  const invalidPatterns = [
    /^\d+\.?$/,                           // Numbers only: "5.", "82.", "100."
    /^[–—-]+$/,                           // Dashes only
    /^(既存信念と重複しない|具体的な洞察|30-70文字|最低3個以上|番号付きリスト)/, // Prompt instructions
    /^統合の原則/,                        // "統合の原則"
    /^\*\*信念:\*\*/,                     // "**信念:**"
    /^【(良い|悪い)例】/,                 // Examples sections
    /^(前置き|説明|挨拶)/,                // Instructions
    /^×/,                                  // Bad example markers
    /^✅|❌/,                              // Checkmarks
    /^(1\.|2\.|3\.|4\.).*文字/,          // Instructions with numbers
  ];

  const invalidBeliefs: CoreBelief[] = [];

  for (const belief of allBeliefs) {
    const content = belief.belief_content.trim();

    // Check if too short (< 10 chars)
    if (content.length < 10) {
      invalidBeliefs.push(belief);
      continue;
    }

    // Check against invalid patterns
    for (const pattern of invalidPatterns) {
      if (pattern.test(content)) {
        invalidBeliefs.push(belief);
        break;
      }
    }
  }

  if (invalidBeliefs.length === 0) {
    console.log('✅ No invalid beliefs found!\n');
    db.close();
    return;
  }

  console.log(`Found ${invalidBeliefs.length} invalid beliefs:\n`);

  for (const belief of invalidBeliefs) {
    console.log(`❌ #${belief.id}: "${belief.belief_content}" (${belief.created_at})`);

    // Update foreign key references to NULL or delete them
    db.prepare(`
      DELETE FROM belief_evolution
      WHERE belief_id = ?
    `).run(belief.id);

    // Delete the invalid belief
    db.prepare('DELETE FROM core_beliefs WHERE id = ?').run(belief.id);
  }

  db.close();

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Cleanup complete!`);
  console.log(`   - Removed: ${invalidBeliefs.length} invalid beliefs`);
  console.log('='.repeat(60) + '\n');
}

cleanupInvalidBeliefs();

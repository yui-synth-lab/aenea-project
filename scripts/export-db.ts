/**
 * Database Export Script
 * Aeneaデータベースをテキスト形式（Markdown/JSON）にエクスポート
 * NotebookLMでの解析に適した形式で出力
 *
 * Usage:
 *   npm run db:export                          # Default: both formats
 *   npm run db:export -- --format markdown     # Markdown only
 *   npm run db:export -- --format json         # JSON only
 *   npm run db:export -- --output ./my-export  # Custom output path (no extension)
 *   npm run db:export -- --db ./data/other.db  # Custom database path
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from '../src/server/database-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExportOptions {
  dbPath: string;
  outputPath: string;
  format: 'markdown' | 'json' | 'both';
}

interface ExportData {
  metadata: {
    exportedAt: string;
    dbPath: string;
    version: string;
  };
  consciousnessState: any;
  stats: any;
  dpdWeights: any[];
  coreBeliefs: any[];
  significantThoughts: any[];
  unresolvedIdeas: any[];
  thoughtCycles: any[];
  dialogues: any[];
  dialogueMemories: any[];
  sleepLogs: any[];
  dreamPatterns: any[];
  memoryPatterns: any[];
  consciousnessInsights: any[];
  questions: any[];
}

function parseArgs(): ExportOptions {
  const args = process.argv.slice(2);
  const options: ExportOptions = {
    dbPath: path.resolve(__dirname, '../data/aenea_consciousness.db'),
    outputPath: '',
    format: 'both'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--db':
        options.dbPath = path.resolve(args[++i]);
        break;
      case '--output':
        options.outputPath = args[++i];
        break;
      case '--format':
        const fmt = args[++i];
        if (fmt === 'markdown' || fmt === 'json' || fmt === 'both') {
          options.format = fmt;
        }
        break;
    }
  }

  // Generate default output path if not specified
  if (!options.outputPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportsDir = path.resolve(__dirname, '../exports');
    options.outputPath = path.join(exportsDir, `aenea-export-${timestamp}`);
  }

  return options;
}

function ensureExportsDir(outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatTimestamp(ts: number | string | null): string {
  if (!ts) return 'N/A';
  const date = new Date(typeof ts === 'string' ? parseInt(ts) : ts);
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

function collectData(db: DatabaseManager): ExportData {
  console.log('📊 データを収集中...');

  const state = db.getConsciousnessState();
  const stats = db.getStats();
  const dpdWeights = db.getDPDWeightsHistory(1000);
  const beliefs = db.getCoreBeliefs(500);
  const thoughts = db.getSignificantThoughts(500);
  const ideas = db.getUnresolvedIdeas(500);
  const questions = db.getAllQuestions();
  const dialogues = db.getRecentDialogues(500, 0);
  const dialogueMemories = db.getRecentDialogueMemories(200);
  const sleepLogs = db.getRecentSleepLogs(100);
  const dreamPatterns = db.getDreamPatterns(200);
  const memoryPatterns = db.getMemoryPatterns(200);
  const insights = db.getConsciousnessInsights(200);

  // Get thought cycles (need raw query since no direct method exists)
  let thoughtCycles: any[] = [];
  try {
    const rawDb = (db as any).db;
    if (rawDb) {
      thoughtCycles = rawDb.prepare(`
        SELECT * FROM thought_cycles
        ORDER BY timestamp DESC
        LIMIT 500
      `).all();
    }
  } catch (e) {
    console.warn('⚠️ thought_cycles取得に失敗:', e);
  }

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      dbPath: (db as any).dbPath || 'unknown',
      version: '1.0.0'
    },
    consciousnessState: state,
    stats,
    dpdWeights,
    coreBeliefs: beliefs,
    significantThoughts: thoughts,
    unresolvedIdeas: ideas,
    thoughtCycles,
    dialogues,
    dialogueMemories,
    sleepLogs,
    dreamPatterns,
    memoryPatterns,
    consciousnessInsights: insights,
    questions
  };
}

function generateMarkdown(data: ExportData): string {
  const lines: string[] = [];

  lines.push('# Aenea Consciousness Export');
  lines.push('');
  lines.push(`**Generated:** ${data.metadata.exportedAt}`);
  lines.push(`**Database:** ${data.metadata.dbPath}`);
  lines.push('');

  // 1. Consciousness State
  lines.push('## 1. Consciousness State');
  lines.push('');
  if (data.consciousnessState) {
    lines.push(`- **System Clock:** ${data.consciousnessState.systemClock}`);
    lines.push(`- **Energy Level:** ${data.consciousnessState.energy?.toFixed(2)}`);
    lines.push(`- **Total Questions:** ${data.consciousnessState.totalQuestions}`);
    lines.push(`- **Total Thoughts:** ${data.consciousnessState.totalThoughts}`);
    lines.push(`- **Last Activity:** ${data.consciousnessState.lastActivity}`);
  } else {
    lines.push('*No consciousness state data*');
  }
  lines.push('');

  // 2. Statistics
  lines.push('## 2. Database Statistics');
  lines.push('');
  if (data.stats) {
    for (const [table, count] of Object.entries(data.stats)) {
      lines.push(`- **${table}:** ${count}`);
    }
  }
  lines.push('');

  // 3. DPD Weights Evolution
  lines.push('## 3. DPD Weights Evolution');
  lines.push('');
  if (data.dpdWeights.length > 0) {
    lines.push(`Total records: ${data.dpdWeights.length}`);
    lines.push('');
    lines.push('| Version | Timestamp | Empathy | Coherence | Dissonance | Trigger |');
    lines.push('|---------|-----------|---------|-----------|------------|---------|');

    // Show first 50 and last 10
    const toShow = data.dpdWeights.length <= 60
      ? data.dpdWeights
      : [...data.dpdWeights.slice(0, 50), ...data.dpdWeights.slice(-10)];

    for (const w of toShow) {
      lines.push(`| ${w.version || '-'} | ${formatTimestamp(w.timestamp)} | ${w.empathy?.toFixed(4)} | ${w.coherence?.toFixed(4)} | ${w.dissonance?.toFixed(4)} | ${w.trigger_type || '-'} |`);
    }

    if (data.dpdWeights.length > 60) {
      lines.push(`| ... | (${data.dpdWeights.length - 60} rows omitted) | ... | ... | ... | ... |`);
    }
  } else {
    lines.push('*No DPD weight history*');
  }
  lines.push('');

  // 4. Core Beliefs
  lines.push('## 4. Core Beliefs');
  lines.push('');
  if (data.coreBeliefs.length > 0) {
    lines.push(`Total: ${data.coreBeliefs.length} beliefs`);
    lines.push('');

    // Group by category
    const byCategory: Record<string, any[]> = {};
    for (const b of data.coreBeliefs) {
      const cat = b.category || 'uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(b);
    }

    for (const [category, beliefs] of Object.entries(byCategory)) {
      lines.push(`### ${category} (${beliefs.length})`);
      lines.push('');
      for (const b of beliefs) {
        lines.push(`- **${b.belief_content}**`);
        lines.push(`  - Confidence: ${b.confidence?.toFixed(3)}, Strength: ${b.strength?.toFixed(3)}`);
        lines.push(`  - Reinforced: ${b.reinforcement_count}x, Contradicted: ${b.contradiction_count}x`);
        lines.push(`  - Formed: ${formatTimestamp(b.first_formed)}`);
      }
      lines.push('');
    }
  } else {
    lines.push('*No core beliefs*');
  }
  lines.push('');

  // 5. Significant Thoughts
  lines.push('## 5. Significant Thoughts');
  lines.push('');
  if (data.significantThoughts.length > 0) {
    lines.push(`Total: ${data.significantThoughts.length} thoughts`);
    lines.push('');
    for (const t of data.significantThoughts.slice(0, 100)) {
      lines.push(`- [${formatTimestamp(t.timestamp)}] **${t.thought_content}**`);
      lines.push(`  - Confidence: ${t.confidence?.toFixed(3)}, Significance: ${t.significance_score?.toFixed(3)}`);
      lines.push(`  - Agent: ${t.agent_id || '-'}, Category: ${t.category || '-'}`);
    }
    if (data.significantThoughts.length > 100) {
      lines.push(`\n*... and ${data.significantThoughts.length - 100} more thoughts*`);
    }
  } else {
    lines.push('*No significant thoughts*');
  }
  lines.push('');

  // 6. Unresolved Ideas
  lines.push('## 6. Unresolved Ideas');
  lines.push('');
  if (data.unresolvedIdeas.length > 0) {
    lines.push(`Total: ${data.unresolvedIdeas.length} ideas`);
    lines.push('');
    for (const i of data.unresolvedIdeas.slice(0, 100)) {
      lines.push(`- **${i.question}**`);
      lines.push(`  - Category: ${i.category || '-'}, Importance: ${i.importance?.toFixed(3)}`);
      lines.push(`  - Revisit count: ${i.revisit_count}, Complexity: ${i.complexity?.toFixed(3)}`);
    }
    if (data.unresolvedIdeas.length > 100) {
      lines.push(`\n*... and ${data.unresolvedIdeas.length - 100} more ideas*`);
    }
  } else {
    lines.push('*No unresolved ideas*');
  }
  lines.push('');

  // 7. Dialogues
  lines.push('## 7. Dialogues');
  lines.push('');
  if (data.dialogues.length > 0) {
    lines.push(`Total: ${data.dialogues.length} dialogues`);
    lines.push('');
    for (const d of data.dialogues.slice(0, 50)) {
      lines.push(`### [${formatTimestamp(d.timestamp)}]`);
      lines.push('');
      lines.push(`**Human:** ${d.human_message}`);
      lines.push('');
      lines.push(`**Aenea:** ${d.aenea_response}`);
      lines.push('');
      if (d.emotional_state || d.immediate_reaction) {
        lines.push(`*Emotional state: ${d.emotional_state || '-'}, Reaction: ${d.immediate_reaction || '-'}*`);
      }
      if (d.empathy_shift || d.coherence_shift || d.dissonance_shift) {
        lines.push(`*DPD shift: E=${d.empathy_shift?.toFixed(3)}, C=${d.coherence_shift?.toFixed(3)}, D=${d.dissonance_shift?.toFixed(3)}*`);
      }
      lines.push('');
      lines.push('---');
      lines.push('');
    }
    if (data.dialogues.length > 50) {
      lines.push(`*... and ${data.dialogues.length - 50} more dialogues*`);
    }
  } else {
    lines.push('*No dialogues*');
  }
  lines.push('');

  // 8. Sleep Logs
  lines.push('## 8. Sleep Logs');
  lines.push('');
  if (data.sleepLogs.length > 0) {
    lines.push(`Total: ${data.sleepLogs.length} sleep cycles`);
    lines.push('');
    for (const s of data.sleepLogs.slice(0, 20)) {
      lines.push(`### Sleep at ${formatTimestamp(s.timestamp)}`);
      lines.push(`- Trigger: ${s.trigger_reason || '-'}`);
      lines.push(`- Duration: ${s.duration ? (s.duration / 1000).toFixed(1) + 's' : '-'}`);
      lines.push(`- Energy: ${s.energy_before?.toFixed(1)} → ${s.energy_after?.toFixed(1)}`);
      lines.push('');
    }
  } else {
    lines.push('*No sleep logs*');
  }
  lines.push('');

  // 9. Dream Patterns
  lines.push('## 9. Dream Patterns');
  lines.push('');
  if (data.dreamPatterns.length > 0) {
    lines.push(`Total: ${data.dreamPatterns.length} patterns`);
    lines.push('');
    for (const d of data.dreamPatterns.slice(0, 50)) {
      lines.push(`- **${d.pattern}**`);
      lines.push(`  - Emotional tone: ${d.emotional_tone || '-'}`);
    }
  } else {
    lines.push('*No dream patterns*');
  }
  lines.push('');

  // 10. Memory Patterns
  lines.push('## 10. Memory Patterns');
  lines.push('');
  if (data.memoryPatterns.length > 0) {
    lines.push(`Total: ${data.memoryPatterns.length} patterns`);
    lines.push('');
    for (const m of data.memoryPatterns.slice(0, 50)) {
      const patternStr = typeof m.pattern_data === 'string'
        ? m.pattern_data
        : JSON.stringify(m.pattern_data);
      lines.push(`- [${m.pattern_type}] ${patternStr.slice(0, 100)}${patternStr.length > 100 ? '...' : ''}`);
      lines.push(`  - Frequency: ${m.frequency}, Significance: ${m.significance?.toFixed(3)}`);
    }
  } else {
    lines.push('*No memory patterns*');
  }
  lines.push('');

  // 11. Consciousness Insights
  lines.push('## 11. Consciousness Insights');
  lines.push('');
  if (data.consciousnessInsights.length > 0) {
    lines.push(`Total: ${data.consciousnessInsights.length} insights`);
    lines.push('');
    for (const i of data.consciousnessInsights.slice(0, 50)) {
      lines.push(`- [${i.insight_type}] **${i.insight_content}**`);
      lines.push(`  - Confidence: ${i.confidence?.toFixed(3)}, Timestamp: ${formatTimestamp(i.timestamp)}`);
    }
  } else {
    lines.push('*No consciousness insights*');
  }
  lines.push('');

  // 12. Questions (Seed + Generated)
  lines.push('## 12. Questions');
  lines.push('');
  if (data.questions.length > 0) {
    lines.push(`Total: ${data.questions.length} questions`);
    lines.push('');

    const byCategory: Record<string, any[]> = {};
    for (const q of data.questions) {
      const cat = q.category || 'uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(q);
    }

    for (const [category, questions] of Object.entries(byCategory)) {
      lines.push(`### ${category} (${questions.length})`);
      for (const q of questions.slice(0, 20)) {
        lines.push(`- ${q.question} (importance: ${q.importance?.toFixed(2)})`);
      }
      if (questions.length > 20) {
        lines.push(`  *... and ${questions.length - 20} more*`);
      }
      lines.push('');
    }
  } else {
    lines.push('*No questions*');
  }

  return lines.join('\n');
}

async function exportDatabase(): Promise<void> {
  const options = parseArgs();

  console.log('🚀 Aenea Database Export');
  console.log(`   Database: ${options.dbPath}`);
  console.log(`   Format: ${options.format}`);
  console.log('');

  // Check database exists
  if (!fs.existsSync(options.dbPath)) {
    console.error(`❌ データベースが見つかりません: ${options.dbPath}`);
    process.exit(1);
  }

  // Initialize DatabaseManager
  const db = new DatabaseManager(options.dbPath);

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!db.isConnected()) {
    console.error('❌ データベース接続に失敗しました');
    process.exit(1);
  }

  // Collect data
  const data = collectData(db);

  // Ensure exports directory exists
  ensureExportsDir(options.outputPath);

  // Export based on format
  const outputs: string[] = [];

  if (options.format === 'markdown' || options.format === 'both') {
    const markdown = generateMarkdown(data);
    const mdPath = options.outputPath + '.md';
    fs.writeFileSync(mdPath, markdown, 'utf-8');
    outputs.push(mdPath);
    console.log(`✅ Markdown exported: ${mdPath}`);
  }

  if (options.format === 'json' || options.format === 'both') {
    const jsonPath = options.outputPath + '.json';
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
    outputs.push(jsonPath);
    console.log(`✅ JSON exported: ${jsonPath}`);
  }

  // Cleanup
  db.cleanup();

  console.log('');
  console.log('📁 Export complete!');
  for (const out of outputs) {
    const stats = fs.statSync(out);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ${path.basename(out)}: ${sizeKB} KB`);
  }
}

// Run export
exportDatabase().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});

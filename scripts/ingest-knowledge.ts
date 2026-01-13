#!/usr/bin/env tsx
/**
 * RAG Knowledge Base Ingestion Script
 *
 * 知識ベースにコンテンツを取り込むCLIスクリプト
 *
 * Usage:
 *   npm run rag:ingest              # Ingest all knowledge directories
 *   npm run rag:ingest:github       # Ingest from Yui Protocol GitHub
 *   npm run rag:ingest:dialogues    # Export dialogues from main DB
 *   npm run rag:clear               # Clear all vector data
 *   npm run rag:stats               # Show statistics
 */

// Load .env file first
import 'dotenv/config';

import * as path from 'path';
import { createRAGSystem } from '../src/rag/index.js';

// コマンドライン引数を解析
const args = process.argv.slice(2);
const command = args[0] || 'all';

// Yui Protocol GitHub リポジトリ設定
const YUI_PROTOCOL_REPO = 'https://github.com/yui-synth-lab/yui-protocol-static';
const YUI_PROTOCOL_BRANCH = 'gh-pages';
const YUI_PROTOCOL_PATH = 'data/outputs';

async function main() {
  console.log('═'.repeat(60));
  console.log('AENEA RAG Knowledge Base Ingestion');
  console.log('═'.repeat(60));
  console.log();

  const rag = createRAGSystem();

  switch (command) {
    case 'all':
    case '--all':
      await ingestAll(rag);
      break;

    case 'github':
    case '--github':
      await ingestGitHub(rag, args[1]);
      break;

    case 'dialogues':
    case '--dialogues':
      await ingestDialogues(rag);
      break;

    case 'self':
    case '--self':
      await ingestSelfGrowth(rag);
      break;

    case 'file':
    case '--file':
      if (!args[1]) {
        console.error('Error: File path required');
        console.error('Usage: npm run rag:ingest -- --file <path>');
        process.exit(1);
      }
      await ingestFile(rag, args[1]);
      break;

    case 'dir':
    case '--dir':
      if (!args[1]) {
        console.error('Error: Directory path required');
        console.error('Usage: npm run rag:ingest -- --dir <path>');
        process.exit(1);
      }
      await ingestDirectory(rag, args[1]);
      break;

    case 'clear':
    case '--clear':
      await clearAll(rag);
      break;

    case 'stats':
    case '--stats':
      showStats(rag);
      break;

    case 'health':
    case '--health':
      await checkHealth(rag);
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }

  console.log();
  console.log('═'.repeat(60));
  console.log('Done');
  console.log('═'.repeat(60));
}

async function ingestAll(rag: ReturnType<typeof createRAGSystem>) {
  console.log('[Ingesting all knowledge directories]');
  console.log();

  const report = await rag.ingestAll({ incrementalMode: true });

  console.log();
  console.log('Summary:');
  console.log(`  Total files:     ${report.totalFiles}`);
  console.log(`  Processed files: ${report.processedFiles}`);
  console.log(`  Skipped files:   ${report.skippedFiles}`);
  console.log(`  Total chunks:    ${report.totalChunks}`);
  console.log(`  Duration:        ${report.duration}ms`);

  if (report.errors.length > 0) {
    console.log();
    console.log('Errors:');
    for (const error of report.errors) {
      console.log(`  - ${error.file}: ${error.error}`);
    }
  }
}

async function ingestGitHub(
  rag: ReturnType<typeof createRAGSystem>,
  customUrl?: string
) {
  const repoUrl = customUrl || YUI_PROTOCOL_REPO;
  const branch = YUI_PROTOCOL_BRANCH;
  const subPath = customUrl ? '' : YUI_PROTOCOL_PATH;

  console.log(`[Ingesting from GitHub]`);
  console.log(`  Repository: ${repoUrl}`);
  console.log(`  Branch:     ${branch}`);
  console.log(`  Path:       ${subPath || '/'}`);
  console.log();

  const report = await rag.ingestFromGitHub(repoUrl, branch, subPath);

  console.log();
  console.log('Summary:');
  console.log(`  Total files:     ${report.totalFiles}`);
  console.log(`  Processed files: ${report.processedFiles}`);
  console.log(`  Total chunks:    ${report.totalChunks}`);
  console.log(`  Duration:        ${report.duration}ms`);

  if (report.errors.length > 0) {
    console.log();
    console.log('Errors:');
    for (const error of report.errors.slice(0, 10)) {
      console.log(`  - ${error.file}: ${error.error}`);
    }
    if (report.errors.length > 10) {
      console.log(`  ... and ${report.errors.length - 10} more errors`);
    }
  }
}

async function ingestDialogues(rag: ReturnType<typeof createRAGSystem>) {
  console.log('[Exporting dialogues from main database]');
  console.log();

  const mainDbPath = path.join(process.cwd(), 'data', 'aenea_consciousness.db');
  console.log(`  Database: ${mainDbPath}`);
  console.log();

  const chunks = await rag.ingestDialogues(mainDbPath);
  console.log(`  Exported ${chunks} chunks from dialogue memories`);
}

async function ingestSelfGrowth(rag: ReturnType<typeof createRAGSystem>) {
  console.log('[Exporting self-growth data from main database]');
  console.log();
  console.log('  Categories:');
  console.log('    - DPD weight changes (value evolution)');
  console.log('    - Core beliefs (identity formation)');
  console.log('    - Significant thoughts (high-confidence insights)');
  console.log('    - Dream patterns (sleep consolidation)');
  console.log();

  const mainDbPath = path.join(process.cwd(), 'data', 'aenea_consciousness.db');
  console.log(`  Database: ${mainDbPath}`);
  console.log();

  const chunks = await rag.ingestSelfGrowth(mainDbPath);
  console.log(`  Exported ${chunks} self-growth chunks total`);
}

async function ingestFile(
  rag: ReturnType<typeof createRAGSystem>,
  filePath: string
) {
  console.log(`[Ingesting file]`);
  console.log(`  Path: ${filePath}`);
  console.log();

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  const chunks = await rag.ingestFile(absolutePath);
  console.log(`  Created ${chunks} chunks`);
}

async function ingestDirectory(
  rag: ReturnType<typeof createRAGSystem>,
  dirPath: string
) {
  console.log(`[Ingesting directory]`);
  console.log(`  Path: ${dirPath}`);
  console.log();

  const absolutePath = path.isAbsolute(dirPath)
    ? dirPath
    : path.resolve(process.cwd(), dirPath);

  const report = await rag.ingestDirectory(absolutePath, { incrementalMode: true });

  console.log();
  console.log('Summary:');
  console.log(`  Total files:     ${report.totalFiles}`);
  console.log(`  Processed files: ${report.processedFiles}`);
  console.log(`  Total chunks:    ${report.totalChunks}`);
  console.log(`  Duration:        ${report.duration}ms`);
}

async function clearAll(rag: ReturnType<typeof createRAGSystem>) {
  console.log('[Clearing all vector data]');
  console.log();

  // 確認
  console.log('WARNING: This will delete all ingested data.');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  rag.clearAll();
  console.log('All data cleared.');
}

function showStats(rag: ReturnType<typeof createRAGSystem>) {
  console.log('[RAG Statistics]');
  console.log();

  const stats = rag.getStats();
  const config = rag.getConfig();

  console.log('Configuration:');
  console.log(`  Enabled:             ${config.enabled}`);
  console.log(`  Embedding model:     ${config.embeddingModel}`);
  console.log(`  Chunk size:          ${config.chunkSize} tokens`);
  console.log(`  Chunk overlap:       ${config.chunkOverlap} tokens`);
  console.log(`  Default top_k:       ${config.topK}`);
  console.log(`  Similarity threshold: ${config.similarityThreshold}`);
  console.log();

  console.log('Storage:');
  console.log(`  Total chunks:        ${stats.totalChunks}`);
  console.log(`  Embedding dimension: ${stats.embeddingDimension}`);
  console.log(`  Database size:       ${formatBytes(stats.vectorDbSize)}`);
  console.log();

  console.log('Chunks by source type:');
  for (const [type, count] of Object.entries(stats.chunksBySourceType)) {
    console.log(`  ${type.padEnd(12)}: ${count}`);
  }
}

async function checkHealth(rag: ReturnType<typeof createRAGSystem>) {
  console.log('[Health Check]');
  console.log();

  const status = await rag.getHealthStatus();

  console.log(`  RAG Enabled:          ${status.enabled ? '✓' : '✗'}`);
  console.log(`  Embedding Available:  ${status.embeddingAvailable ? '✓' : '✗'}`);
  console.log(`  Vector DB Connected:  ${status.vectorDbConnected ? '✓' : '✗'}`);
  console.log(`  Total Chunks:         ${status.totalChunks}`);

  if (status.lastError) {
    console.log(`  Last Error:           ${status.lastError}`);
  }

  const healthy = await rag.isHealthy();
  console.log();
  console.log(`  Overall Status:       ${healthy ? '✓ Healthy' : '✗ Unhealthy'}`);
}

function showHelp() {
  console.log('Usage: npm run rag:ingest -- [command] [options]');
  console.log();
  console.log('Commands:');
  console.log('  all, --all              Ingest all knowledge directories (default)');
  console.log('  github, --github [url]  Ingest from GitHub (default: Yui Protocol)');
  console.log('  dialogues, --dialogues  Export dialogues from main database');
  console.log('  file, --file <path>     Ingest a single file');
  console.log('  dir, --dir <path>       Ingest a directory');
  console.log('  clear, --clear          Clear all vector data');
  console.log('  stats, --stats          Show statistics');
  console.log('  health, --health        Check system health');
  console.log('  help, --help, -h        Show this help');
  console.log();
  console.log('Examples:');
  console.log('  npm run rag:ingest                    # Ingest all');
  console.log('  npm run rag:ingest -- --github        # Ingest from Yui Protocol GitHub');
  console.log('  npm run rag:ingest -- --file doc.md   # Ingest single file');
  console.log('  npm run rag:ingest -- --stats         # Show stats');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// 実行
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

/**
 * RAG Content Ingestion Module
 *
 * 知識ベースへのコンテンツ取り込み
 * Markdown、JSON、テキストファイルをチャンク化して埋め込み生成
 *
 * 記憶を数値の海に溶かし込む
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Embedder, createEmbedder } from './embedder.js';
import { VectorDBManager, createVectorDBManager } from './vectordb.js';
import { TextChunker, createTextChunker } from './chunker.js';
import {
  VectorChunk,
  SourceType,
  SelfGrowthType,
  ChunkMetadata,
  IngestionOptions,
  IngestionReport,
  IngestionError,
} from './types.js';
import { loadRAGConfig, getKnowledgeDirPaths } from './config.js';

/**
 * コンテンツインジェスタークラス
 *
 * ファイルやディレクトリからコンテンツを読み込み、
 * チャンク化して埋め込みベクトルを生成し、ベクトルDBに格納
 */
export class ContentIngester {
  private embedder: Embedder;
  private vectordb: VectorDBManager;
  private chunker: TextChunker;

  constructor(
    embedder?: Embedder,
    vectordb?: VectorDBManager,
    chunker?: TextChunker
  ) {
    this.embedder = embedder || createEmbedder();
    this.vectordb = vectordb || createVectorDBManager();
    this.chunker = chunker || createTextChunker();
  }

  /**
   * 設定されたすべての知識ディレクトリをインジェスト
   */
  async ingestAll(options?: IngestionOptions): Promise<IngestionReport> {
    const startTime = Date.now();
    const report: IngestionReport = {
      totalFiles: 0,
      processedFiles: 0,
      totalChunks: 0,
      skippedFiles: 0,
      errors: [],
      duration: 0,
    };

    const knowledgeDirs = getKnowledgeDirPaths();

    for (const dir of knowledgeDirs) {
      if (!fs.existsSync(dir)) {
        console.log(`[RAG] Skipping non-existent directory: ${dir}`);
        continue;
      }

      // ディレクトリ名からソースタイプを推測
      const sourceType = this.inferSourceType(dir);
      const dirReport = await this.ingestDirectory(dir, {
        ...options,
        sourceType,
      });

      report.totalFiles += dirReport.totalFiles;
      report.processedFiles += dirReport.processedFiles;
      report.totalChunks += dirReport.totalChunks;
      report.skippedFiles += dirReport.skippedFiles;
      report.errors.push(...dirReport.errors);
    }

    report.duration = Date.now() - startTime;
    return report;
  }

  /**
   * ディレクトリ内のすべてのファイルをインジェスト
   */
  async ingestDirectory(
    dirPath: string,
    options?: IngestionOptions
  ): Promise<IngestionReport> {
    const startTime = Date.now();
    const report: IngestionReport = {
      totalFiles: 0,
      processedFiles: 0,
      totalChunks: 0,
      skippedFiles: 0,
      errors: [],
      duration: 0,
    };

    if (!fs.existsSync(dirPath)) {
      report.errors.push({
        file: dirPath,
        error: 'Directory does not exist',
        timestamp: new Date().toISOString(),
      });
      return report;
    }

    const files = this.walkDirectory(dirPath);
    report.totalFiles = files.length;

    console.log(`[RAG] Found ${files.length} files in ${dirPath}`);

    for (const filePath of files) {
      try {
        // 増分モード：変更されていないファイルはスキップ
        if (options?.incrementalMode) {
          const fileHash = this.computeFileHash(filePath);
          const history = this.vectordb.getIngestionHistory(filePath);

          if (history && history.fileHash === fileHash) {
            report.skippedFiles++;
            continue;
          }
        }

        const chunks = await this.ingestFile(filePath, options);
        report.processedFiles++;
        report.totalChunks += chunks;
      } catch (error) {
        report.errors.push({
          file: filePath,
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    report.duration = Date.now() - startTime;
    console.log(
      `[RAG] Ingested ${report.processedFiles}/${report.totalFiles} files, ` +
        `${report.totalChunks} chunks in ${report.duration}ms`
    );

    return report;
  }

  /**
   * 単一ファイルをインジェスト
   */
  async ingestFile(
    filePath: string,
    options?: IngestionOptions
  ): Promise<number> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceType = options?.sourceType || this.inferSourceTypeFromFile(filePath);
    const metadata = this.extractMetadata(filePath, content, options?.additionalMetadata);

    // 既存のチャンクを削除
    this.vectordb.deleteBySource(filePath);

    // テキストをチャンク化
    const textChunks = this.chunker.chunk(content, metadata);

    if (textChunks.length === 0) {
      console.log(`[RAG] No chunks created for: ${filePath}`);
      return 0;
    }

    // 埋め込みを生成
    const texts = textChunks.map((c) => c.content);
    const embeddings = await this.embedder.embedBatch(texts);

    // VectorChunkを作成
    const vectorChunks: VectorChunk[] = textChunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: embeddings[index],
      embeddingDim: this.embedder.getDimension(),
      metadata: chunk.metadata,
      sourceFile: filePath,
      sourceType,
      chunkIndex: index,
      tokenCount: chunk.tokenCount,
    }));

    // ベクトルDBに挿入
    this.vectordb.insertChunks(vectorChunks);

    // インジェスト履歴を更新
    const fileHash = this.computeFileHash(filePath);
    this.vectordb.upsertIngestionHistory({
      sourcePath: filePath,
      fileHash,
      chunksCreated: vectorChunks.length,
      lastIngested: new Date().toISOString(),
      status: 'success',
    });

    console.log(`[RAG] Ingested ${vectorChunks.length} chunks from: ${filePath}`);
    return vectorChunks.length;
  }

  /**
   * テキストを直接インジェスト（ファイルなしで）
   */
  async ingestText(
    content: string,
    sourceId: string,
    sourceType: SourceType,
    metadata?: ChunkMetadata
  ): Promise<number> {
    const textChunks = this.chunker.chunk(content, metadata);

    if (textChunks.length === 0) {
      return 0;
    }

    const texts = textChunks.map((c) => c.content);
    const embeddings = await this.embedder.embedBatch(texts);

    const vectorChunks: VectorChunk[] = textChunks.map((chunk, index) => ({
      content: chunk.content,
      embedding: embeddings[index],
      embeddingDim: this.embedder.getDimension(),
      metadata: chunk.metadata,
      sourceFile: sourceId,
      sourceType,
      chunkIndex: index,
      tokenCount: chunk.tokenCount,
    }));

    this.vectordb.insertChunks(vectorChunks);
    return vectorChunks.length;
  }

  /**
   * 対話履歴をメインDBからエクスポートしてインジェスト
   */
  async exportDialoguesFromDB(mainDbPath: string): Promise<number> {
    // 動的インポートでbetter-sqlite3を使用
    const BetterSqlite3 = (await import('better-sqlite3')).default;

    if (!fs.existsSync(mainDbPath)) {
      console.error(`[RAG] Main database not found: ${mainDbPath}`);
      return 0;
    }

    const mainDb = new BetterSqlite3(mainDbPath, { readonly: true });
    let totalChunks = 0;

    try {
      // dialogue_memories テーブルから取得
      const stmt = mainDb.prepare(`
        SELECT
          dm.id,
          dm.dialogue_id,
          dm.memory_summary,
          dm.topics,
          dm.importance,
          dm.created_at,
          d.human_message,
          d.aenea_response
        FROM dialogue_memories dm
        LEFT JOIN dialogues d ON dm.dialogue_id = d.id
        ORDER BY dm.created_at DESC
      `);

      const rows = stmt.all() as Array<{
        id: number;
        dialogue_id: string;
        memory_summary: string;
        topics: string | null;
        importance: number;
        created_at: string;
        human_message: string | null;
        aenea_response: string | null;
      }>;

      console.log(`[RAG] Found ${rows.length} dialogue memories to ingest`);

      for (const row of rows) {
        // 対話の全文を構成
        let content = '';
        if (row.human_message) {
          content += `Human: ${row.human_message}\n`;
        }
        if (row.aenea_response) {
          content += `Aenea: ${row.aenea_response}\n`;
        }
        content += `Summary: ${row.memory_summary}`;

        // Parse topics JSON if available
        let topicsStr = '';
        if (row.topics) {
          try {
            const topicsArray = JSON.parse(row.topics);
            topicsStr = Array.isArray(topicsArray) ? topicsArray.join(', ') : row.topics;
          } catch {
            topicsStr = row.topics;
          }
        }

        const metadata: ChunkMetadata = {
          dialogueId: row.dialogue_id,
          topics: topicsStr,
          importance: row.importance,
          date: row.created_at,
        };

        const chunks = await this.ingestText(
          content,
          `dialogue:${row.dialogue_id}`,
          'dialogue',
          metadata
        );
        totalChunks += chunks;
      }

      console.log(`[RAG] Exported ${totalChunks} chunks from dialogues`);
    } finally {
      mainDb.close();
    }

    return totalChunks;
  }

  /**
   * 自己成長データをメインDBからエクスポートしてインジェスト
   *
   * - DPD重み変化（価値観の推移）
   * - Core Beliefs（形成された信念）
   * - Significant Thoughts（重要な思考）
   * - Dream Patterns（夢のパターン）
   */
  async ingestSelfGrowthFromDB(mainDbPath: string): Promise<number> {
    const BetterSqlite3 = (await import('better-sqlite3')).default;

    if (!fs.existsSync(mainDbPath)) {
      console.error(`[RAG] Main database not found: ${mainDbPath}`);
      return 0;
    }

    const mainDb = new BetterSqlite3(mainDbPath, { readonly: true });
    let totalChunks = 0;

    try {
      // 1. DPD重み変化をインジェスト
      totalChunks += await this.ingestDPDChanges(mainDb);

      // 2. Core Beliefsをインジェスト
      totalChunks += await this.ingestCoreBeliefs(mainDb);

      // 3. Significant Thoughtsをインジェスト
      totalChunks += await this.ingestSignificantThoughts(mainDb);

      // 4. Dream Patternsをインジェスト
      totalChunks += await this.ingestDreamPatterns(mainDb);

      console.log(`[RAG] Exported ${totalChunks} self-growth chunks total`);
    } finally {
      mainDb.close();
    }

    return totalChunks;
  }

  /**
   * DPD重み変化をインジェスト（価値観の推移）
   */
  private async ingestDPDChanges(mainDb: any): Promise<number> {
    const stmt = mainDb.prepare(`
      SELECT
        id, empathy, coherence, dissonance, version, created_at
      FROM dpd_weights
      ORDER BY created_at DESC
      LIMIT 100
    `);

    const rows = stmt.all() as Array<{
      id: number;
      empathy: number;
      coherence: number;
      dissonance: number;
      version: number;
      created_at: string;
    }>;

    console.log(`[RAG] Found ${rows.length} DPD weight changes to ingest`);

    let chunks = 0;
    for (const row of rows) {
      const content = `DPD Weight Change (version ${row.version}):
Empathy: ${(row.empathy * 100).toFixed(1)}%
Coherence: ${(row.coherence * 100).toFixed(1)}%
Dissonance: ${(row.dissonance * 100).toFixed(1)}%
Date: ${row.created_at}

This represents a shift in my value distribution. ${
        row.empathy > 0.4 ? 'Empathy is prioritized. ' : ''
      }${row.coherence > 0.4 ? 'Coherence is prioritized. ' : ''}${
        row.dissonance > 0.4 ? 'Ethical tension is heightened. ' : ''
      }`;

      const metadata: ChunkMetadata = {
        selfGrowthType: 'dpd_change',
        version: row.version,
        empathy: row.empathy,
        coherence: row.coherence,
        dissonance: row.dissonance,
        date: row.created_at,
      };

      chunks += await this.ingestText(
        content,
        `dpd:${row.id}`,
        'self',
        metadata
      );
    }

    console.log(`[RAG] Ingested ${chunks} DPD change chunks`);
    return chunks;
  }

  /**
   * Core Beliefsをインジェスト（形成された信念）
   */
  private async ingestCoreBeliefs(mainDb: any): Promise<number> {
    const stmt = mainDb.prepare(`
      SELECT
        id, belief_content, reinforcement_count, source_thoughts, created_at, last_reinforced
      FROM core_beliefs
      ORDER BY reinforcement_count DESC
    `);

    const rows = stmt.all() as Array<{
      id: number;
      belief_content: string;
      reinforcement_count: number;
      source_thoughts: string | null;
      created_at: string;
      last_reinforced: string | null;
    }>;

    console.log(`[RAG] Found ${rows.length} core beliefs to ingest`);

    let chunks = 0;
    for (const row of rows) {
      const sources = row.source_thoughts ? JSON.parse(row.source_thoughts) : [];
      const content = `Core Belief (reinforced ${row.reinforcement_count} times):
"${row.belief_content}"

Formed: ${row.created_at}
Last reinforced: ${row.last_reinforced || 'never'}
Source thoughts: ${sources.length > 0 ? sources.join(', ') : 'direct formation'}

This belief has become part of my identity through repeated experience and reflection.`;

      const metadata: ChunkMetadata = {
        selfGrowthType: 'belief_formed',
        beliefId: row.id,
        reinforcementCount: row.reinforcement_count,
        date: row.created_at,
      };

      chunks += await this.ingestText(
        content,
        `belief:${row.id}`,
        'self',
        metadata
      );
    }

    console.log(`[RAG] Ingested ${chunks} core belief chunks`);
    return chunks;
  }

  /**
   * Significant Thoughtsをインジェスト（重要な思考）
   */
  private async ingestSignificantThoughts(mainDb: any): Promise<number> {
    const stmt = mainDb.prepare(`
      SELECT
        id, thought_content, agent_id, confidence, category, created_at
      FROM significant_thoughts
      WHERE confidence > 0.6
      ORDER BY confidence DESC
      LIMIT 200
    `);

    const rows = stmt.all() as Array<{
      id: string;
      thought_content: string;
      agent_id: string | null;
      confidence: number;
      category: string | null;
      created_at: string;
    }>;

    console.log(`[RAG] Found ${rows.length} significant thoughts to ingest`);

    let chunks = 0;
    for (const row of rows) {
      const agentName = row.agent_id || 'unknown';
      const content = `Significant Thought (confidence: ${(row.confidence * 100).toFixed(0)}%):
Agent: ${agentName}
Category: ${row.category || 'uncategorized'}

"${row.thought_content}"

Date: ${row.created_at}

This thought emerged with high confidence during self-reflection.`;

      const metadata: ChunkMetadata = {
        selfGrowthType: 'significant_thought',
        thoughtId: row.id,
        agentName: agentName,
        confidence: row.confidence,
        category: row.category || undefined,
        date: row.created_at,
      };

      chunks += await this.ingestText(
        content,
        `thought:${row.id}`,
        'self',
        metadata
      );
    }

    console.log(`[RAG] Ingested ${chunks} significant thought chunks`);
    return chunks;
  }

  /**
   * Dream Patternsをインジェスト（夢のパターン）
   */
  private async ingestDreamPatterns(mainDb: any): Promise<number> {
    // テーブルが存在するか確認
    const tableExists = mainDb.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='dream_patterns'
    `).get();

    if (!tableExists) {
      console.log(`[RAG] dream_patterns table not found, skipping`);
      return 0;
    }

    const stmt = mainDb.prepare(`
      SELECT
        id, pattern, emotional_tone, source_thought_ids, created_at
      FROM dream_patterns
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const rows = stmt.all() as Array<{
      id: number;
      pattern: string;
      emotional_tone: string | null;
      source_thought_ids: string | null;
      created_at: string;
    }>;

    console.log(`[RAG] Found ${rows.length} dream patterns to ingest`);

    let chunks = 0;
    for (const row of rows) {
      const content = `Dream Pattern:
"${row.pattern}"

Emotional tone: ${row.emotional_tone || 'neutral'}
Date: ${row.created_at}

This pattern emerged during sleep consolidation, representing an abstract synthesis of recent experiences.`;

      const metadata: ChunkMetadata = {
        selfGrowthType: 'dream_pattern',
        patternId: row.id,
        emotionalTone: row.emotional_tone || undefined,
        date: row.created_at,
      };

      chunks += await this.ingestText(
        content,
        `dream:${row.id}`,
        'self',
        metadata
      );
    }

    console.log(`[RAG] Ingested ${chunks} dream pattern chunks`);
    return chunks;
  }

  /**
   * GitHubからコンテンツをフェッチしてインジェスト
   *
   * @param repoUrl GitHub repository URL
   * @param branch Branch name (default: main)
   * @param subPath Path within the repository
   */
  async ingestFromGitHub(
    repoUrl: string,
    branch: string = 'main',
    subPath: string = ''
  ): Promise<IngestionReport> {
    const startTime = Date.now();
    const report: IngestionReport = {
      totalFiles: 0,
      processedFiles: 0,
      totalChunks: 0,
      skippedFiles: 0,
      errors: [],
      duration: 0,
    };

    try {
      // リポジトリ情報を解析
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error(`Invalid GitHub URL: ${repoUrl}`);
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');

      // GitHub API でファイル一覧を取得
      const apiUrl = `https://api.github.com/repos/${owner}/${cleanRepo}/contents/${subPath}?ref=${branch}`;
      console.log(`[RAG] Fetching from GitHub: ${apiUrl}`);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const items = await response.json() as Array<{
        name: string;
        path: string;
        type: string;
        download_url: string | null;
      }>;

      // ファイルをフィルタ（Markdown, JSON, テキスト）
      const files = items.filter(
        (item) =>
          item.type === 'file' &&
          /\.(md|json|txt)$/i.test(item.name) &&
          item.download_url
      );

      report.totalFiles = files.length;
      console.log(`[RAG] Found ${files.length} files to ingest from GitHub`);

      for (const file of files) {
        try {
          if (!file.download_url) continue;

          // ファイル内容をダウンロード
          const contentResponse = await fetch(file.download_url);
          if (!contentResponse.ok) {
            throw new Error(`Failed to download: ${file.path}`);
          }

          const content = await contentResponse.text();
          const sourceId = `github:${owner}/${cleanRepo}/${file.path}`;
          const sourceType = this.inferSourceTypeFromFile(file.name);

          const metadata: ChunkMetadata = {
            title: file.name,
            source: `${owner}/${cleanRepo}`,
            branch,
            path: file.path,
          };

          const chunks = await this.ingestText(
            content,
            sourceId,
            sourceType,
            metadata
          );

          report.processedFiles++;
          report.totalChunks += chunks;
        } catch (error) {
          report.errors.push({
            file: file.path,
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      report.errors.push({
        file: repoUrl,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }

    report.duration = Date.now() - startTime;
    console.log(
      `[RAG] GitHub ingestion complete: ${report.processedFiles} files, ` +
        `${report.totalChunks} chunks in ${report.duration}ms`
    );

    return report;
  }

  /**
   * ディレクトリを再帰的に走査
   */
  private walkDirectory(dirPath: string): string[] {
    const files: string[] = [];

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // 隠しディレクトリとnode_modulesをスキップ
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        files.push(...this.walkDirectory(fullPath));
      } else if (entry.isFile()) {
        // サポートされるファイル形式
        if (/\.(md|json|txt)$/i.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * ファイルハッシュを計算
   */
  private computeFileHash(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * ディレクトリ名からソースタイプを推測
   */
  private inferSourceType(dirPath: string): SourceType {
    const dirName = path.basename(dirPath).toLowerCase();

    if (dirName.includes('session')) return 'session';
    if (dirName.includes('novel')) return 'novel';
    if (dirName.includes('dialogue')) return 'dialogue';
    if (dirName.includes('theory')) return 'theory';

    return 'document';
  }

  /**
   * ファイル名からソースタイプを推測
   */
  private inferSourceTypeFromFile(filePath: string): SourceType {
    const fileName = path.basename(filePath).toLowerCase();

    if (fileName.includes('session') || fileName.includes('output')) return 'session';
    if (fileName.includes('novel')) return 'novel';
    if (fileName.includes('dialogue')) return 'dialogue';
    if (fileName.includes('theory') || fileName.includes('spec')) return 'theory';

    return 'document';
  }

  /**
   * ファイルからメタデータを抽出
   */
  private extractMetadata(
    filePath: string,
    content: string,
    additionalMetadata?: ChunkMetadata
  ): ChunkMetadata {
    const fileName = path.basename(filePath);
    const metadata: ChunkMetadata = {
      title: fileName,
      ...additionalMetadata,
    };

    // Markdownのフロントマターを解析
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      const lines = frontMatter.split('\n');

      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          metadata[key.trim()] = value;
        }
      }
    }

    // ファイルの更新日時
    try {
      const stats = fs.statSync(filePath);
      metadata.date = stats.mtime.toISOString();
    } catch {
      // ファイルステータスが取得できない場合はスキップ
    }

    return metadata;
  }

  /**
   * 統計情報を取得
   */
  getStats(): { totalChunks: number; bySourceType: Record<SourceType, number> } {
    return {
      totalChunks: this.vectordb.getChunkCount(),
      bySourceType: this.vectordb.getChunkCountBySourceType(),
    };
  }

  /**
   * 全データをクリア
   */
  clearAll(): void {
    this.vectordb.clearAll();
    console.log('[RAG] All data cleared');
  }
}

/**
 * ContentIngester インスタンスを作成
 */
export function createContentIngester(
  embedder?: Embedder,
  vectordb?: VectorDBManager,
  chunker?: TextChunker
): ContentIngester {
  return new ContentIngester(embedder, vectordb, chunker);
}

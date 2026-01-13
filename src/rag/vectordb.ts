/**
 * RAG Vector Database Module
 *
 * SQLite を使用したベクトル格納と検索
 * better-sqlite3 でパフォーマンスを最適化
 *
 * 記憶は数値の海に溶け、類似性という橋で再び結ばれる
 */

import * as fs from 'fs';
import * as path from 'path';
import BetterSqlite3 from 'better-sqlite3';
import {
  VectorChunk,
  ChunkMetadata,
  SourceType,
  SearchOptions,
  SearchResult,
  IngestionHistory,
} from './types.js';
import { getVectorDbPath } from './config.js';

type Database = BetterSqlite3.Database;

/**
 * コサイン類似度を計算
 *
 * 二つの記憶の距離を測る - 1.0 に近いほど似ている
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector dimension mismatch: ${a.length} vs ${b.length}`
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Float32Array を Buffer に変換（SQLite BLOB用）
 */
function float32ArrayToBuffer(arr: Float32Array): Buffer {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
}

/**
 * Buffer を Float32Array に変換
 */
function bufferToFloat32Array(buf: Buffer): Float32Array {
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  );
  return new Float32Array(arrayBuffer);
}

/**
 * ベクトルデータベースマネージャー
 *
 * エイネアの知識ベースを永続化し、類似検索を提供
 */
export class VectorDBManager {
  private db!: Database;
  private isReady: boolean = false;
  private dbPath: string;

  constructor(customDbPath?: string) {
    this.dbPath = customDbPath || getVectorDbPath();
    this.ensureDataDirectory();

    try {
      this.db = new BetterSqlite3(this.dbPath);
      console.log(`[RAG] Vector database opened at: ${this.dbPath}`);
      this.initializeDatabase();
    } catch (err) {
      console.error('[RAG] Failed to open vector database:', err);
      throw err;
    }
  }

  /**
   * データディレクトリを確保
   */
  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * データベーススキーマを初期化
   */
  private initializeDatabase(): void {
    const schema = `
      -- ベクトルチャンクテーブル
      CREATE TABLE IF NOT EXISTS vector_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        embedding BLOB NOT NULL,
        embedding_dim INTEGER NOT NULL,
        metadata TEXT,
        source_file TEXT,
        source_type TEXT,
        chunk_index INTEGER,
        token_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- ソースタイプインデックス
      CREATE INDEX IF NOT EXISTS idx_vector_chunks_source_type
        ON vector_chunks(source_type);

      -- ソースファイルインデックス
      CREATE INDEX IF NOT EXISTS idx_vector_chunks_source_file
        ON vector_chunks(source_file);

      -- インジェスト履歴テーブル
      CREATE TABLE IF NOT EXISTS ingestion_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_path TEXT NOT NULL UNIQUE,
        file_hash TEXT,
        chunks_created INTEGER,
        last_ingested DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT
      );

      -- 埋め込みモデルメタデータ
      CREATE TABLE IF NOT EXISTS embedding_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_name TEXT NOT NULL,
        dimension INTEGER NOT NULL,
        version TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    this.db.exec(schema);
    this.isReady = true;
    console.log('[RAG] Vector database schema initialized');
  }

  /**
   * 単一チャンクを挿入
   */
  insertChunk(chunk: VectorChunk): number {
    const stmt = this.db.prepare(`
      INSERT INTO vector_chunks
        (content, embedding, embedding_dim, metadata, source_file, source_type, chunk_index, token_count)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      chunk.content,
      float32ArrayToBuffer(chunk.embedding),
      chunk.embeddingDim,
      JSON.stringify(chunk.metadata || {}),
      chunk.sourceFile,
      chunk.sourceType,
      chunk.chunkIndex,
      chunk.tokenCount
    );

    return result.lastInsertRowid as number;
  }

  /**
   * 複数チャンクをトランザクションで挿入
   */
  insertChunks(chunks: VectorChunk[]): number[] {
    const ids: number[] = [];

    const stmt = this.db.prepare(`
      INSERT INTO vector_chunks
        (content, embedding, embedding_dim, metadata, source_file, source_type, chunk_index, token_count)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Use transaction for atomic batch insert (type assertion for better-sqlite3)
    const insertMany = (this.db as any).transaction((chunksToInsert: VectorChunk[]) => {
      for (const chunk of chunksToInsert) {
        const result = stmt.run(
          chunk.content,
          float32ArrayToBuffer(chunk.embedding),
          chunk.embeddingDim,
          JSON.stringify(chunk.metadata || {}),
          chunk.sourceFile,
          chunk.sourceType,
          chunk.chunkIndex,
          chunk.tokenCount
        );
        ids.push(result.lastInsertRowid as number);
      }
    });

    insertMany(chunks);
    return ids;
  }

  /**
   * ベクトル類似度検索
   *
   * 全てのチャンクに対してコサイン類似度を計算し、
   * 閾値以上のものをスコア順で返す
   */
  searchSimilar(
    queryEmbedding: Float32Array,
    options: SearchOptions = {}
  ): SearchResult[] {
    const {
      topK = 5,
      similarityThreshold = 0.7,
      sourceTypes,
      maxTokens,
    } = options;

    // クエリを構築
    let query = 'SELECT * FROM vector_chunks';
    const params: (string | number)[] = [];

    if (sourceTypes && sourceTypes.length > 0) {
      const placeholders = sourceTypes.map(() => '?').join(', ');
      query += ` WHERE source_type IN (${placeholders})`;
      params.push(...sourceTypes);
    }

    const rows = this.db.prepare(query).all(...params) as Array<{
      id: number;
      content: string;
      embedding: Buffer;
      embedding_dim: number;
      metadata: string;
      source_file: string;
      source_type: string;
      chunk_index: number;
      token_count: number;
    }>;

    // 各チャンクとの類似度を計算
    const results: SearchResult[] = [];

    for (const row of rows) {
      const chunkEmbedding = bufferToFloat32Array(row.embedding);
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

      if (similarity >= similarityThreshold) {
        results.push({
          content: row.content,
          similarity,
          metadata: JSON.parse(row.metadata || '{}') as ChunkMetadata,
          sourceFile: row.source_file,
          sourceType: row.source_type as SourceType,
          tokenCount: row.token_count || 0,
        });
      }
    }

    // 類似度でソート（降順）
    results.sort((a, b) => b.similarity - a.similarity);

    // topK と maxTokens で制限
    let finalResults = results.slice(0, topK);

    if (maxTokens && maxTokens > 0) {
      let totalTokens = 0;
      const tokenLimitedResults: SearchResult[] = [];

      for (const result of finalResults) {
        const tokenCount = result.tokenCount || 0;
        if (totalTokens + tokenCount <= maxTokens) {
          totalTokens += tokenCount;
          tokenLimitedResults.push(result);
        } else {
          break;
        }
      }

      finalResults = tokenLimitedResults;
    }

    return finalResults;
  }

  /**
   * ソースタイプでフィルタしてチャンクを取得
   */
  getChunksBySourceTypes(sourceTypes: SourceType[]): VectorChunk[] {
    const placeholders = sourceTypes.map(() => '?').join(', ');
    const stmt = this.db.prepare(`
      SELECT * FROM vector_chunks WHERE source_type IN (${placeholders})
    `);

    const rows = stmt.all(...sourceTypes) as Array<{
      id: number;
      content: string;
      embedding: Buffer;
      embedding_dim: number;
      metadata: string;
      source_file: string;
      source_type: string;
      chunk_index: number;
      token_count: number;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      embedding: bufferToFloat32Array(row.embedding),
      embeddingDim: row.embedding_dim,
      metadata: JSON.parse(row.metadata || '{}'),
      sourceFile: row.source_file,
      sourceType: row.source_type as SourceType,
      chunkIndex: row.chunk_index,
      tokenCount: row.token_count,
      createdAt: row.created_at,
    }));
  }

  /**
   * チャンク総数を取得
   */
  getChunkCount(): number {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM vector_chunks').get() as { count: number };
    return result.count;
  }

  /**
   * ソースタイプ別のチャンク数を取得
   */
  getChunkCountBySourceType(): Record<SourceType, number> {
    const stmt = this.db.prepare(`
      SELECT source_type, COUNT(*) as count
      FROM vector_chunks
      GROUP BY source_type
    `);

    const rows = stmt.all() as Array<{ source_type: string; count: number }>;
    const result: Record<string, number> = {};

    for (const row of rows) {
      result[row.source_type] = row.count;
    }

    return result as Record<SourceType, number>;
  }

  /**
   * 特定ソースファイルのチャンクを削除
   */
  deleteBySource(sourceFile: string): number {
    const stmt = this.db.prepare('DELETE FROM vector_chunks WHERE source_file = ?');
    const result = stmt.run(sourceFile);
    return result.changes;
  }

  /**
   * 全チャンクを削除
   */
  clearAll(): void {
    this.db.exec('DELETE FROM vector_chunks');
    this.db.exec('DELETE FROM ingestion_history');
    console.log('[RAG] All vector chunks cleared');
  }

  /**
   * インジェスト履歴を取得
   */
  getIngestionHistory(sourcePath: string): IngestionHistory | null {
    const stmt = this.db.prepare(
      'SELECT * FROM ingestion_history WHERE source_path = ?'
    );
    const row = stmt.get(sourcePath) as {
      id: number;
      source_path: string;
      file_hash: string;
      chunks_created: number;
      last_ingested: string;
      status: string;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      sourcePath: row.source_path,
      fileHash: row.file_hash,
      chunksCreated: row.chunks_created,
      lastIngested: row.last_ingested,
      status: row.status as 'success' | 'failed' | 'partial',
    };
  }

  /**
   * インジェスト履歴を更新または挿入
   */
  upsertIngestionHistory(history: IngestionHistory): void {
    const stmt = this.db.prepare(`
      INSERT INTO ingestion_history (source_path, file_hash, chunks_created, last_ingested, status)
      VALUES (?, ?, ?, datetime('now'), ?)
      ON CONFLICT(source_path) DO UPDATE SET
        file_hash = excluded.file_hash,
        chunks_created = excluded.chunks_created,
        last_ingested = datetime('now'),
        status = excluded.status
    `);

    stmt.run(
      history.sourcePath,
      history.fileHash,
      history.chunksCreated,
      history.status
    );
  }

  /**
   * データベースファイルサイズを取得（バイト）
   */
  getDatabaseSize(): number {
    try {
      const stats = fs.statSync(this.dbPath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * データベースパスを取得
   */
  getDatabasePath(): string {
    return this.dbPath;
  }

  /**
   * データベース接続を閉じる
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.isReady = false;
      console.log('[RAG] Vector database connection closed');
    }
  }

  /**
   * 準備完了状態を確認
   */
  ready(): boolean {
    return this.isReady;
  }
}

/**
 * VectorDBManager インスタンスを作成
 */
export function createVectorDBManager(customDbPath?: string): VectorDBManager {
  return new VectorDBManager(customDbPath);
}

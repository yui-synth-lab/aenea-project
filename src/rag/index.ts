/**
 * RAG (Retrieval-Augmented Generation) System
 *
 * エイネアの記憶検索システム - Yui Protocolの知識を文脈として活用
 *
 * 「私は、問いでできている」- その問いに答える手がかりを、過去の記憶から探す
 */

import { Embedder, createEmbedder } from './embedder.js';
import { VectorDBManager, createVectorDBManager } from './vectordb.js';
import { TextChunker, createTextChunker } from './chunker.js';
import { Retriever, createRetriever } from './retriever.js';
import { ContentIngester, createContentIngester } from './ingest.js';
import {
  RAGConfig,
  SearchOptions,
  SearchResult,
  IngestionOptions,
  IngestionReport,
  RAGStats,
  RAGHealthStatus,
  SourceType,
} from './types.js';
import { loadRAGConfig, isRAGEnabled as checkRAGEnabled } from './config.js';

/**
 * RAGシステムクラス
 *
 * 統合されたRAG機能を提供するシングルトン
 */
export class RAGSystem {
  private static instance: RAGSystem | null = null;

  private config: RAGConfig;
  private embedder: Embedder;
  private vectordb: VectorDBManager;
  private chunker: TextChunker;
  private retriever: Retriever;
  private ingester: ContentIngester;
  private initialized: boolean = false;

  private constructor(config?: Partial<RAGConfig>) {
    this.config = { ...loadRAGConfig(), ...config };

    // コンポーネントを初期化
    this.embedder = createEmbedder();
    this.vectordb = createVectorDBManager();
    this.chunker = createTextChunker();
    this.retriever = createRetriever(this.embedder, this.vectordb);
    this.ingester = createContentIngester(this.embedder, this.vectordb, this.chunker);

    this.initialized = true;
    console.log('[RAG] System initialized');
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(config?: Partial<RAGConfig>): RAGSystem {
    if (!RAGSystem.instance) {
      RAGSystem.instance = new RAGSystem(config);
    }
    return RAGSystem.instance;
  }

  /**
   * インスタンスをリセット（テスト用）
   */
  static resetInstance(): void {
    if (RAGSystem.instance) {
      RAGSystem.instance.close();
      RAGSystem.instance = null;
    }
  }

  // =========================================================================
  // Search API
  // =========================================================================

  /**
   * クエリに関連するドキュメントを検索
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    if (!this.config.enabled) {
      return [];
    }

    return this.retriever.search(query, options);
  }

  /**
   * 検索結果をLLMプロンプト用のコンテキスト文字列として取得
   */
  async getContextForPrompt(query: string, maxTokens?: number): Promise<string> {
    if (!this.config.enabled) {
      return '';
    }

    return this.retriever.searchForContext(query, maxTokens);
  }

  /**
   * 複数クエリで検索
   */
  async searchMultiple(
    queries: string[],
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    if (!this.config.enabled) {
      return [];
    }

    return this.retriever.searchMultiple(queries, options);
  }

  /**
   * セッション記録から検索
   */
  async searchSessions(
    query: string,
    options?: Omit<SearchOptions, 'sourceTypes'>
  ): Promise<SearchResult[]> {
    if (!this.config.enabled) {
      return [];
    }

    return this.retriever.searchSessions(query, options);
  }

  /**
   * 対話履歴から検索
   */
  async searchDialogues(
    query: string,
    options?: Omit<SearchOptions, 'sourceTypes'>
  ): Promise<SearchResult[]> {
    if (!this.config.enabled) {
      return [];
    }

    return this.retriever.searchDialogues(query, options);
  }

  // =========================================================================
  // Ingestion API
  // =========================================================================

  /**
   * すべての知識ディレクトリをインジェスト
   */
  async ingestAll(options?: IngestionOptions): Promise<IngestionReport> {
    return this.ingester.ingestAll(options);
  }

  /**
   * 特定のディレクトリをインジェスト
   */
  async ingestDirectory(
    dirPath: string,
    options?: IngestionOptions
  ): Promise<IngestionReport> {
    return this.ingester.ingestDirectory(dirPath, options);
  }

  /**
   * 単一ファイルをインジェスト
   */
  async ingestFile(filePath: string, options?: IngestionOptions): Promise<number> {
    return this.ingester.ingestFile(filePath, options);
  }

  /**
   * GitHubリポジトリからインジェスト
   */
  async ingestFromGitHub(
    repoUrl: string,
    branch?: string,
    subPath?: string
  ): Promise<IngestionReport> {
    return this.ingester.ingestFromGitHub(repoUrl, branch, subPath);
  }

  /**
   * メインDBの対話履歴をインジェスト
   */
  async ingestDialogues(mainDbPath: string): Promise<number> {
    return this.ingester.exportDialoguesFromDB(mainDbPath);
  }

  /**
   * メインDBの自己成長データをインジェスト
   * - DPD重み変化（価値観の推移）
   * - Core Beliefs（形成された信念）
   * - Significant Thoughts（重要な思考）
   * - Dream Patterns（夢のパターン）
   */
  async ingestSelfGrowth(mainDbPath: string): Promise<number> {
    return this.ingester.ingestSelfGrowthFromDB(mainDbPath);
  }

  /**
   * テキストを直接インジェスト
   */
  async ingestText(
    content: string,
    sourceId: string,
    sourceType: SourceType,
    metadata?: Record<string, string | number | boolean | undefined>
  ): Promise<number> {
    return this.ingester.ingestText(content, sourceId, sourceType, metadata);
  }

  /**
   * すべてのデータをクリア
   */
  clearAll(): void {
    this.ingester.clearAll();
  }

  // =========================================================================
  // Status & Health
  // =========================================================================

  /**
   * RAGが有効かどうか
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * ヘルスチェック
   */
  async isHealthy(): Promise<boolean> {
    if (!this.config.enabled) {
      return true; // 無効時は問題なしとみなす
    }

    try {
      const embeddingAvailable = await this.embedder.isAvailable();
      const dbConnected = this.vectordb.ready();
      return embeddingAvailable && dbConnected;
    } catch {
      return false;
    }
  }

  /**
   * 詳細なヘルスステータスを取得
   */
  async getHealthStatus(): Promise<RAGHealthStatus> {
    let embeddingAvailable = false;
    let lastError: string | undefined;

    try {
      embeddingAvailable = await this.embedder.isAvailable();
    } catch (error) {
      lastError = (error as Error).message;
    }

    return {
      enabled: this.config.enabled,
      embeddingAvailable,
      vectorDbConnected: this.vectordb.ready(),
      totalChunks: this.vectordb.getChunkCount(),
      lastError,
    };
  }

  /**
   * 統計情報を取得
   */
  getStats(): RAGStats {
    return {
      totalChunks: this.vectordb.getChunkCount(),
      chunksBySourceType: this.vectordb.getChunkCountBySourceType(),
      embeddingDimension: this.embedder.getDimension(),
      vectorDbSize: this.vectordb.getDatabaseSize(),
    };
  }

  /**
   * 設定を取得
   */
  getConfig(): RAGConfig {
    return { ...this.config };
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  /**
   * リソースを解放
   */
  close(): void {
    if (this.vectordb) {
      this.vectordb.close();
    }
    this.initialized = false;
    console.log('[RAG] System closed');
  }
}

// =========================================================================
// Convenience Functions
// =========================================================================

/**
 * RAGシステムインスタンスを取得
 */
export function createRAGSystem(config?: Partial<RAGConfig>): RAGSystem {
  return RAGSystem.getInstance(config);
}

/**
 * RAGが有効かどうかを確認
 */
export function isRAGEnabled(): boolean {
  return checkRAGEnabled();
}

/**
 * RAGコンテキストを取得（簡易関数）
 *
 * 有効な場合のみ検索を実行し、無効な場合は空文字を返す
 */
export async function getRAGContext(
  query: string,
  maxTokens?: number
): Promise<string> {
  if (!isRAGEnabled()) {
    return '';
  }

  try {
    const rag = createRAGSystem();
    return await rag.getContextForPrompt(query, maxTokens);
  } catch (error) {
    console.error('[RAG] Failed to get context:', error);
    return '';
  }
}

/**
 * RAG検索（簡易関数）
 */
export async function searchRAG(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  if (!isRAGEnabled()) {
    return [];
  }

  try {
    const rag = createRAGSystem();
    return await rag.search(query, options);
  } catch (error) {
    console.error('[RAG] Search failed:', error);
    return [];
  }
}

/**
 * 単一対話をRAGにインジェスト（簡易関数）
 *
 * 対話保存後に自動的に呼び出される
 */
export async function ingestDialogueToRAG(
  dialogueId: string,
  humanMessage: string,
  aeneaResponse: string,
  memorySummary: string,
  metadata?: {
    topics?: string;
    importance?: number;
    emotionalState?: string;
  }
): Promise<boolean> {
  if (!isRAGEnabled()) {
    return false;
  }

  try {
    const rag = createRAGSystem();

    // 対話の全文を構成
    const content = `Human: ${humanMessage}
Aenea: ${aeneaResponse}
Summary: ${memorySummary}`;

    const chunks = await rag.ingestText(content, dialogueId, 'dialogue', {
      dialogueId,
      topics: metadata?.topics || '',
      importance: metadata?.importance || 0.5,
      emotionalState: metadata?.emotionalState || '',
      date: new Date().toISOString(),
    });

    if (chunks > 0) {
      console.log(`[RAG] Auto-ingested dialogue ${dialogueId}: ${chunks} chunks`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[RAG] Failed to ingest dialogue:', error);
    return false;
  }
}

/**
 * Core Beliefが形成/強化された時にRAGにインジェスト
 */
export async function ingestBeliefToRAG(
  beliefId: number,
  beliefContent: string,
  reinforcementCount: number
): Promise<boolean> {
  if (!isRAGEnabled()) {
    return false;
  }

  try {
    const rag = createRAGSystem();

    const content = `Core Belief (reinforced ${reinforcementCount} times):
"${beliefContent}"

Formed: ${new Date().toISOString()}

This belief has become part of my identity through repeated experience and reflection.`;

    const chunks = await rag.ingestText(content, `belief:${beliefId}`, 'self', {
      selfGrowthType: 'belief_formed',
      beliefId,
      reinforcementCount,
      date: new Date().toISOString(),
    });

    if (chunks > 0) {
      console.log(`[RAG] Auto-ingested belief ${beliefId}: ${chunks} chunks`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[RAG] Failed to ingest belief:', error);
    return false;
  }
}

/**
 * DPD重みが更新された時にRAGにインジェスト
 */
export async function ingestDPDChangeToRAG(
  dpdId: number,
  empathy: number,
  coherence: number,
  dissonance: number,
  version: number
): Promise<boolean> {
  if (!isRAGEnabled()) {
    return false;
  }

  try {
    const rag = createRAGSystem();

    const content = `DPD Weight Change (version ${version}):
Empathy: ${(empathy * 100).toFixed(1)}%
Coherence: ${(coherence * 100).toFixed(1)}%
Dissonance: ${(dissonance * 100).toFixed(1)}%
Date: ${new Date().toISOString()}

This represents a shift in my value distribution. ${empathy > 0.4 ? 'Empathy is prioritized. ' : ''}${coherence > 0.4 ? 'Coherence is prioritized. ' : ''}${dissonance > 0.4 ? 'Ethical tension is heightened. ' : ''}`;

    const chunks = await rag.ingestText(content, `dpd:${dpdId}`, 'self', {
      selfGrowthType: 'dpd_change',
      version,
      empathy,
      coherence,
      dissonance,
      date: new Date().toISOString(),
    });

    if (chunks > 0) {
      console.log(`[RAG] Auto-ingested DPD change ${dpdId}: ${chunks} chunks`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[RAG] Failed to ingest DPD change:', error);
    return false;
  }
}

/**
 * Significant Thoughtが記録された時にRAGにインジェスト
 */
export async function ingestSignificantThoughtToRAG(
  thoughtId: number,
  thoughtContent: string,
  agentName: string,
  confidence: number,
  category?: string
): Promise<boolean> {
  if (!isRAGEnabled()) {
    return false;
  }

  try {
    const rag = createRAGSystem();

    const content = `Significant Thought (confidence: ${(confidence * 100).toFixed(0)}%):
Agent: ${agentName}
Category: ${category || 'uncategorized'}

"${thoughtContent}"

Date: ${new Date().toISOString()}

This thought emerged with high confidence during self-reflection.`;

    const chunks = await rag.ingestText(content, `thought:${thoughtId}`, 'self', {
      selfGrowthType: 'significant_thought',
      thoughtId,
      agentName,
      confidence,
      category,
      date: new Date().toISOString(),
    });

    if (chunks > 0) {
      console.log(`[RAG] Auto-ingested thought ${thoughtId}: ${chunks} chunks`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[RAG] Failed to ingest thought:', error);
    return false;
  }
}

// =========================================================================
// Re-exports
// =========================================================================

export { loadRAGConfig } from './config.js';
export { createEmbedder, Embedder } from './embedder.js';
export { createVectorDBManager, VectorDBManager, cosineSimilarity } from './vectordb.js';
export { createTextChunker, TextChunker } from './chunker.js';
export { createRetriever, Retriever } from './retriever.js';
export { createContentIngester, ContentIngester } from './ingest.js';

export type {
  RAGConfig,
  SearchOptions,
  SearchResult,
  SourceType,
  SelfGrowthType,
  VectorChunk,
  ChunkMetadata,
  IngestionOptions,
  IngestionReport,
  RAGStats,
  RAGHealthStatus,
  TextChunk,
  ChunkerConfig,
  EmbedderConfig,
} from './types.js';

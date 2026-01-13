/**
 * RAG (Retrieval-Augmented Generation) System Type Definitions
 *
 * エイネアの記憶検索システム - Yui Protocolの知識を文脈として活用
 */

// ============================================================================
// Vector Storage Types
// ============================================================================

/**
 * ベクトルチャンク - テキストとその埋め込みベクトル
 */
export interface VectorChunk {
  id?: number;
  content: string;
  embedding: Float32Array;
  embeddingDim: number;
  metadata: ChunkMetadata;
  sourceFile: string;
  sourceType: SourceType;
  chunkIndex: number;
  tokenCount: number;
  createdAt?: string;
}

/**
 * ソースタイプ - 知識ベースのカテゴリ
 */
export type SourceType = 'session' | 'novel' | 'dialogue' | 'theory' | 'document' | 'self';

/**
 * 自己成長データのサブタイプ
 */
export type SelfGrowthType = 'dpd_change' | 'belief_formed' | 'significant_thought' | 'dream_pattern' | 'ethical_tension';

/**
 * チャンクメタデータ - 検索結果の文脈情報
 */
export interface ChunkMetadata {
  title?: string;
  date?: string;
  category?: string;
  sessionId?: string;
  agentName?: string;
  [key: string]: string | number | boolean | undefined;
}

// ============================================================================
// Search Types
// ============================================================================

/**
 * 検索オプション
 */
export interface SearchOptions {
  /** 返す結果の最大数 (default: 5) */
  topK?: number;
  /** 類似度の閾値 (default: 0.7) */
  similarityThreshold?: number;
  /** ソースタイプでフィルタ */
  sourceTypes?: SourceType[];
  /** 結果の最大トークン数 */
  maxTokens?: number;
}

/**
 * 検索結果
 */
export interface SearchResult {
  content: string;
  similarity: number;
  metadata: ChunkMetadata;
  sourceFile: string;
  sourceType: SourceType;
  tokenCount?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * RAGシステム設定
 */
export interface RAGConfig {
  /** RAG機能の有効/無効 */
  enabled: boolean;
  /** 埋め込みモデル名 (default: nomic-embed-text) */
  embeddingModel: string;
  /** Ollama APIのベースURL */
  embeddingBaseUrl: string;
  /** ベクトルDBのパス */
  vectorDbPath: string;
  /** チャンクサイズ（トークン数） */
  chunkSize: number;
  /** オーバーラップサイズ（トークン数） */
  chunkOverlap: number;
  /** デフォルトの検索結果数 */
  topK: number;
  /** デフォルトの類似度閾値 */
  similarityThreshold: number;
  /** 知識ベースディレクトリ */
  knowledgeDirs: string[];
}

// ============================================================================
// Ingestion Types
// ============================================================================

/**
 * インジェスト設定
 */
export interface IngestionOptions {
  /** 増分モード（変更ファイルのみ処理） */
  incrementalMode?: boolean;
  /** ソースタイプの指定 */
  sourceType?: SourceType;
  /** メタデータの追加 */
  additionalMetadata?: ChunkMetadata;
}

/**
 * インジェストレポート
 */
export interface IngestionReport {
  totalFiles: number;
  processedFiles: number;
  totalChunks: number;
  skippedFiles: number;
  errors: IngestionError[];
  duration: number;
}

/**
 * インジェストエラー
 */
export interface IngestionError {
  file: string;
  error: string;
  timestamp: string;
}

/**
 * インジェスト履歴レコード
 */
export interface IngestionHistory {
  id?: number;
  sourcePath: string;
  fileHash: string;
  chunksCreated: number;
  lastIngested: string;
  status: 'success' | 'failed' | 'partial';
}

// ============================================================================
// Embedder Types
// ============================================================================

/**
 * 埋め込み生成設定
 */
export interface EmbedderConfig {
  /** OllamaのベースURL */
  baseUrl: string;
  /** モデル名 */
  model: string;
  /** バッチサイズ */
  batchSize: number;
  /** リトライ回数 */
  retryAttempts: number;
  /** タイムアウト（ミリ秒） */
  timeout: number;
}

/**
 * 埋め込み結果
 */
export interface EmbeddingResult {
  embedding: Float32Array;
  model: string;
  tokensUsed?: number;
}

// ============================================================================
// RAG System Types
// ============================================================================

/**
 * RAGシステム統計
 */
export interface RAGStats {
  totalChunks: number;
  chunksBySourceType: Record<SourceType, number>;
  embeddingDimension: number;
  lastIngestion?: string;
  vectorDbSize: number;
}

/**
 * RAGヘルスチェック結果
 */
export interface RAGHealthStatus {
  enabled: boolean;
  embeddingAvailable: boolean;
  vectorDbConnected: boolean;
  totalChunks: number;
  lastError?: string;
}

// ============================================================================
// Text Chunker Types
// ============================================================================

/**
 * テキストチャンク（インジェスト用）
 */
export interface TextChunk {
  content: string;
  tokenCount: number;
  startOffset: number;
  endOffset: number;
  metadata: ChunkMetadata;
}

/**
 * チャンク設定
 */
export interface ChunkerConfig {
  /** 最大トークン数 */
  maxTokens: number;
  /** オーバーラップトークン数 */
  overlapTokens: number;
  /** 段落境界を尊重 */
  respectParagraphs: boolean;
}

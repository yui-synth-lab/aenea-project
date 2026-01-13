/**
 * RAG Configuration Module
 *
 * 環境変数からRAG設定を読み込む
 * 既存のエージェント設定パターンに準拠
 */

import { RAGConfig } from './types.js';
import path from 'path';

/**
 * デフォルト設定値
 */
const DEFAULT_CONFIG: RAGConfig = {
  enabled: false,
  embeddingModel: 'nomic-embed-text',
  embeddingBaseUrl: 'http://localhost:11434',
  vectorDbPath: 'data/vectordb/aenea_vectors.db',
  chunkSize: 800,
  chunkOverlap: 100,
  topK: 5,
  similarityThreshold: 0.7,
  knowledgeDirs: [
    'knowledge/sessions',
    'knowledge/novels',
    'knowledge/dialogues',
    'knowledge/theory',
  ],
};

/**
 * 環境変数からRAG設定を読み込む
 */
export function loadRAGConfig(): RAGConfig {
  return {
    enabled: process.env.RAG_ENABLED === 'true',
    embeddingModel:
      process.env.RAG_EMBEDDING_MODEL || DEFAULT_CONFIG.embeddingModel,
    embeddingBaseUrl:
      process.env.RAG_EMBEDDING_BASE_URL ||
      process.env.OLLAMA_BASE_URL ||
      DEFAULT_CONFIG.embeddingBaseUrl,
    vectorDbPath:
      process.env.RAG_VECTORDB_PATH || DEFAULT_CONFIG.vectorDbPath,
    chunkSize: parseInt(
      process.env.RAG_CHUNK_SIZE || String(DEFAULT_CONFIG.chunkSize),
      10
    ),
    chunkOverlap: parseInt(
      process.env.RAG_CHUNK_OVERLAP || String(DEFAULT_CONFIG.chunkOverlap),
      10
    ),
    topK: parseInt(
      process.env.RAG_TOP_K || String(DEFAULT_CONFIG.topK),
      10
    ),
    similarityThreshold: parseFloat(
      process.env.RAG_SIMILARITY_THRESHOLD ||
        String(DEFAULT_CONFIG.similarityThreshold)
    ),
    knowledgeDirs: process.env.RAG_KNOWLEDGE_DIRS
      ? process.env.RAG_KNOWLEDGE_DIRS.split(',').map((d) => d.trim())
      : DEFAULT_CONFIG.knowledgeDirs,
  };
}

/**
 * RAGが有効かどうかを確認
 */
export function isRAGEnabled(): boolean {
  return process.env.RAG_ENABLED === 'true';
}

/**
 * ベクトルDBの絶対パスを取得
 */
export function getVectorDbPath(): string {
  const config = loadRAGConfig();
  if (path.isAbsolute(config.vectorDbPath)) {
    return config.vectorDbPath;
  }
  return path.resolve(process.cwd(), config.vectorDbPath);
}

/**
 * 知識ベースディレクトリの絶対パスを取得
 */
export function getKnowledgeDirPaths(): string[] {
  const config = loadRAGConfig();
  return config.knowledgeDirs.map((dir) => {
    if (path.isAbsolute(dir)) {
      return dir;
    }
    return path.resolve(process.cwd(), dir);
  });
}

/**
 * 設定を検証
 */
export function validateRAGConfig(config: RAGConfig): string[] {
  const errors: string[] = [];

  if (config.chunkSize < 100 || config.chunkSize > 2000) {
    errors.push(
      `Invalid chunkSize: ${config.chunkSize}. Must be between 100 and 2000.`
    );
  }

  if (config.chunkOverlap < 0 || config.chunkOverlap >= config.chunkSize) {
    errors.push(
      `Invalid chunkOverlap: ${config.chunkOverlap}. Must be >= 0 and < chunkSize.`
    );
  }

  if (config.topK < 1 || config.topK > 100) {
    errors.push(`Invalid topK: ${config.topK}. Must be between 1 and 100.`);
  }

  if (config.similarityThreshold < 0 || config.similarityThreshold > 1) {
    errors.push(
      `Invalid similarityThreshold: ${config.similarityThreshold}. Must be between 0 and 1.`
    );
  }

  return errors;
}

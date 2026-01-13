/**
 * RAG Embedder Module
 *
 * Ollama nomic-embed-text を使用した埋め込みベクトル生成
 * エイネアの記憶を数値空間にマッピングする
 */

import { Ollama } from 'ollama';
import { EmbedderConfig, EmbeddingResult } from './types.js';
import { loadRAGConfig } from './config.js';

/**
 * デフォルト設定
 */
const DEFAULT_EMBEDDER_CONFIG: EmbedderConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'nomic-embed-text',
  batchSize: 10,
  retryAttempts: 3,
  timeout: 30000,
};

/**
 * 埋め込みベクトル生成クラス
 *
 * Ollama nomic-embed-text を使用してテキストを768次元ベクトルに変換
 */
export class Embedder {
  private client: Ollama;
  private model: string;
  private batchSize: number;
  private retryAttempts: number;
  private cache: Map<string, Float32Array>;
  private readonly maxCacheSize: number = 1000;

  // nomic-embed-text の埋め込み次元
  private readonly dimension: number = 768;

  constructor(config?: Partial<EmbedderConfig>) {
    const ragConfig = loadRAGConfig();
    const finalConfig = {
      ...DEFAULT_EMBEDDER_CONFIG,
      baseUrl: ragConfig.embeddingBaseUrl,
      model: ragConfig.embeddingModel,
      ...config,
    };

    this.client = new Ollama({ host: finalConfig.baseUrl });
    this.model = finalConfig.model;
    this.batchSize = finalConfig.batchSize;
    this.retryAttempts = finalConfig.retryAttempts;
    this.cache = new Map();
  }

  /**
   * 単一テキストの埋め込みを生成
   */
  async embed(text: string): Promise<Float32Array> {
    // キャッシュチェック
    const cacheKey = this.hashText(text);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 埋め込み生成
    const embedding = await this.fetchEmbedding(text);

    // キャッシュに追加
    this.addToCache(cacheKey, embedding);

    return embedding;
  }

  /**
   * 複数テキストのバッチ埋め込み生成
   */
  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    const results: Float32Array[] = [];
    const toFetch: { index: number; text: string }[] = [];

    // キャッシュヒットと未キャッシュを分離
    for (let i = 0; i < texts.length; i++) {
      const cacheKey = this.hashText(texts[i]);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        results[i] = cached;
      } else {
        toFetch.push({ index: i, text: texts[i] });
      }
    }

    // バッチ処理で未キャッシュのものを取得
    for (let i = 0; i < toFetch.length; i += this.batchSize) {
      const batch = toFetch.slice(i, i + this.batchSize);
      const embeddings = await Promise.all(
        batch.map(async ({ index, text }) => {
          const embedding = await this.fetchEmbedding(text);
          const cacheKey = this.hashText(text);
          this.addToCache(cacheKey, embedding);
          return { index, embedding };
        })
      );

      for (const { index, embedding } of embeddings) {
        results[index] = embedding;
      }
    }

    return results;
  }

  /**
   * Ollama から埋め込みを取得（リトライ付き）
   */
  private async fetchEmbedding(text: string): Promise<Float32Array> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.client.embed({
          model: this.model,
          input: text,
        });

        // Ollama embed API returns embeddings as number[][]
        const embedding = response.embeddings[0];
        if (!embedding || embedding.length === 0) {
          throw new Error('Empty embedding returned from Ollama');
        }

        return new Float32Array(embedding);
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retryAttempts) {
          // 指数バックオフ
          const delay = Math.pow(2, attempt) * 100;
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Failed to fetch embedding after ${this.retryAttempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Ollama サービスが利用可能かチェック
   */
  async isAvailable(): Promise<boolean> {
    try {
      // モデル一覧を取得してサービス接続を確認
      const response = await this.client.list();

      // 必要なモデルがインストールされているか確認
      const hasModel = response.models.some(
        (m) => m.name.includes(this.model) || m.name === this.model
      );

      if (!hasModel) {
        console.warn(
          `[RAG] Warning: Embedding model '${this.model}' not found. ` +
          `Available models: ${response.models.map((m) => m.name).join(', ')}`
        );
      }

      return true; // Ollama service is available
    } catch {
      return false;
    }
  }

  /**
   * 埋め込み次元を取得
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * 使用モデル名を取得
   */
  getModel(): string {
    return this.model;
  }

  /**
   * キャッシュ統計を取得
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * テキストのハッシュを生成（キャッシュキー用）
   */
  private hashText(text: string): string {
    // 簡易ハッシュ（FNV-1a風）
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash.toString(16);
  }

  /**
   * キャッシュに追加（LRU風）
   */
  private addToCache(key: string, embedding: Float32Array): void {
    // キャッシュサイズ制限
    if (this.cache.size >= this.maxCacheSize) {
      // 最初の20%のエントリを削除
      const keysToDelete = Array.from(this.cache.keys()).slice(
        0,
        Math.floor(this.maxCacheSize * 0.2)
      );
      for (const k of keysToDelete) {
        this.cache.delete(k);
      }
    }
    this.cache.set(key, embedding);
  }

  /**
   * スリープユーティリティ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Embedder インスタンスを作成
 */
export function createEmbedder(config?: Partial<EmbedderConfig>): Embedder {
  return new Embedder(config);
}

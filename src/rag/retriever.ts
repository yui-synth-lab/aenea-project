/**
 * RAG Retriever Module
 *
 * 知識ベースからの意味的検索
 * クエリに関連するコンテキストを取得
 *
 * 問いに対する答えの種を、記憶の海から拾い上げる
 */

import { Embedder, createEmbedder } from './embedder.js';
import { VectorDBManager, createVectorDBManager } from './vectordb.js';
import { SearchOptions, SearchResult, SourceType } from './types.js';
import { loadRAGConfig } from './config.js';

/**
 * リトリーバークラス
 *
 * クエリテキストから関連する知識を検索
 */
export class Retriever {
  private embedder: Embedder;
  private vectordb: VectorDBManager;

  constructor(embedder?: Embedder, vectordb?: VectorDBManager) {
    this.embedder = embedder || createEmbedder();
    this.vectordb = vectordb || createVectorDBManager();
  }

  /**
   * クエリに関連するドキュメントを検索
   */
  async search(
    query: string,
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const config = loadRAGConfig();
    const finalOptions: SearchOptions = {
      topK: config.topK,
      similarityThreshold: config.similarityThreshold,
      ...options,
    };

    try {
      // クエリを埋め込みベクトルに変換
      const queryEmbedding = await this.embedder.embed(query);

      // ベクトルDBで類似検索
      const results = this.vectordb.searchSimilar(queryEmbedding, finalOptions);

      return results;
    } catch (error) {
      console.error('[RAG] Search failed:', error);
      return [];
    }
  }

  /**
   * 検索結果をLLMプロンプト用のコンテキスト文字列に変換
   */
  async searchForContext(
    query: string,
    maxTokens?: number
  ): Promise<string> {
    const config = loadRAGConfig();
    const results = await this.search(query, {
      topK: config.topK,
      similarityThreshold: config.similarityThreshold,
      maxTokens,
    });

    if (results.length === 0) {
      return '';
    }

    // 結果を整形
    const contextParts = results.map((result, index) => {
      const source = result.metadata.title || result.sourceFile || 'unknown';
      const type = result.sourceType;
      return `[${index + 1}] (${type}: ${source})\n${result.content}`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  /**
   * 複数のクエリで検索して結果を統合
   *
   * より広い文脈を取得したい場合に使用
   */
  async searchMultiple(
    queries: string[],
    options?: SearchOptions
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    const seenContent = new Set<string>();

    for (const query of queries) {
      const results = await this.search(query, options);

      for (const result of results) {
        // 重複を除去
        const contentKey = result.content.substring(0, 100);
        if (!seenContent.has(contentKey)) {
          seenContent.add(contentKey);
          allResults.push(result);
        }
      }
    }

    // 類似度でソートして上位を返す
    allResults.sort((a, b) => b.similarity - a.similarity);

    const config = loadRAGConfig();
    const topK = options?.topK || config.topK;
    return allResults.slice(0, topK);
  }

  /**
   * 特定のソースタイプに絞って検索
   */
  async searchBySourceType(
    query: string,
    sourceTypes: SourceType[],
    options?: Omit<SearchOptions, 'sourceTypes'>
  ): Promise<SearchResult[]> {
    return this.search(query, {
      ...options,
      sourceTypes,
    });
  }

  /**
   * セッション記録から検索
   */
  async searchSessions(
    query: string,
    options?: Omit<SearchOptions, 'sourceTypes'>
  ): Promise<SearchResult[]> {
    return this.searchBySourceType(query, ['session'], options);
  }

  /**
   * 対話履歴から検索
   */
  async searchDialogues(
    query: string,
    options?: Omit<SearchOptions, 'sourceTypes'>
  ): Promise<SearchResult[]> {
    return this.searchBySourceType(query, ['dialogue'], options);
  }

  /**
   * 理論文書から検索
   */
  async searchTheory(
    query: string,
    options?: Omit<SearchOptions, 'sourceTypes'>
  ): Promise<SearchResult[]> {
    return this.searchBySourceType(query, ['theory'], options);
  }

  /**
   * 小説から検索
   */
  async searchNovels(
    query: string,
    options?: Omit<SearchOptions, 'sourceTypes'>
  ): Promise<SearchResult[]> {
    return this.searchBySourceType(query, ['novel'], options);
  }

  /**
   * 利用可能なソースタイプとそのチャンク数を取得
   */
  getAvailableSources(): Record<SourceType, number> {
    return this.vectordb.getChunkCountBySourceType();
  }

  /**
   * 総チャンク数を取得
   */
  getTotalChunks(): number {
    return this.vectordb.getChunkCount();
  }

  /**
   * 埋め込みサービスが利用可能かチェック
   */
  async isEmbeddingAvailable(): Promise<boolean> {
    return this.embedder.isAvailable();
  }
}

/**
 * Retriever インスタンスを作成
 */
export function createRetriever(
  embedder?: Embedder,
  vectordb?: VectorDBManager
): Retriever {
  return new Retriever(embedder, vectordb);
}

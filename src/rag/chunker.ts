/**
 * RAG Text Chunker Module
 *
 * 日本語対応テキストチャンキング
 * wakachigaki を使用した正確な単語分割
 *
 * 長い記憶を適切なサイズに分割し、文脈を保持する
 */

import { tokenize as wakachigakiTokenize } from 'wakachigaki';
import { TextChunk, ChunkerConfig, ChunkMetadata } from './types.js';
import { loadRAGConfig } from './config.js';

/**
 * デフォルト設定
 */
const DEFAULT_CHUNKER_CONFIG: ChunkerConfig = {
  maxTokens: 800,
  overlapTokens: 100,
  respectParagraphs: true,
};

/**
 * テキストチャンカークラス
 *
 * テキストを適切なサイズのチャンクに分割
 * 日本語の単語境界を考慮
 */
export class TextChunker {
  private maxTokens: number;
  private overlapTokens: number;
  private respectParagraphs: boolean;

  constructor(config?: Partial<ChunkerConfig>) {
    const ragConfig = loadRAGConfig();
    const finalConfig = {
      ...DEFAULT_CHUNKER_CONFIG,
      maxTokens: ragConfig.chunkSize,
      overlapTokens: ragConfig.chunkOverlap,
      ...config,
    };

    this.maxTokens = finalConfig.maxTokens;
    this.overlapTokens = finalConfig.overlapTokens;
    this.respectParagraphs = finalConfig.respectParagraphs;
  }

  /**
   * テキストをチャンクに分割
   */
  chunk(text: string, metadata?: ChunkMetadata): TextChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];

    if (this.respectParagraphs) {
      // 段落を尊重してチャンク化
      const paragraphs = this.splitIntoParagraphs(text);
      let currentChunk = '';
      let currentTokenCount = 0;
      let startOffset = 0;

      for (const paragraph of paragraphs) {
        const paragraphTokens = this.estimateTokens(paragraph);

        // 単一段落がmaxTokensを超える場合は分割
        if (paragraphTokens > this.maxTokens) {
          // 現在のチャンクを保存
          if (currentChunk.length > 0) {
            chunks.push({
              content: currentChunk.trim(),
              tokenCount: currentTokenCount,
              startOffset,
              endOffset: startOffset + currentChunk.length,
              metadata: metadata || {},
            });
            startOffset += currentChunk.length - this.getOverlapText(currentChunk).length;
          }

          // 長い段落を分割
          const subChunks = this.chunkLongParagraph(paragraph, metadata);
          for (const subChunk of subChunks) {
            subChunk.startOffset += startOffset;
            subChunk.endOffset += startOffset;
            chunks.push(subChunk);
          }

          currentChunk = '';
          currentTokenCount = 0;
          startOffset = text.indexOf(paragraph) + paragraph.length;
          continue;
        }

        // チャンクに追加できるか確認
        if (currentTokenCount + paragraphTokens <= this.maxTokens) {
          currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
          currentTokenCount += paragraphTokens;
        } else {
          // 現在のチャンクを保存
          if (currentChunk.length > 0) {
            chunks.push({
              content: currentChunk.trim(),
              tokenCount: currentTokenCount,
              startOffset,
              endOffset: startOffset + currentChunk.length,
              metadata: metadata || {},
            });

            // オーバーラップを考慮して次のチャンクを開始
            const overlapText = this.getOverlapText(currentChunk);
            startOffset = startOffset + currentChunk.length - overlapText.length;
            currentChunk = overlapText + '\n\n' + paragraph;
            currentTokenCount = this.estimateTokens(currentChunk);
          } else {
            currentChunk = paragraph;
            currentTokenCount = paragraphTokens;
          }
        }
      }

      // 残りのチャンクを保存
      if (currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          tokenCount: currentTokenCount,
          startOffset,
          endOffset: startOffset + currentChunk.length,
          metadata: metadata || {},
        });
      }
    } else {
      // 単純なトークンベースの分割
      return this.chunkByTokens(text, metadata);
    }

    return chunks;
  }

  /**
   * 長い段落を分割
   */
  private chunkLongParagraph(
    paragraph: string,
    metadata?: ChunkMetadata
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    const sentences = this.splitIntoSentences(paragraph);

    let currentChunk = '';
    let currentTokenCount = 0;
    let startOffset = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);

      // 単一文がmaxTokensを超える場合は強制分割
      if (sentenceTokens > this.maxTokens) {
        if (currentChunk.length > 0) {
          chunks.push({
            content: currentChunk.trim(),
            tokenCount: currentTokenCount,
            startOffset,
            endOffset: startOffset + currentChunk.length,
            metadata: metadata || {},
          });
          startOffset += currentChunk.length;
        }

        // 強制分割
        const forceSplitChunks = this.forceSplit(sentence, metadata);
        for (const chunk of forceSplitChunks) {
          chunk.startOffset += startOffset;
          chunk.endOffset += startOffset;
          chunks.push(chunk);
        }

        currentChunk = '';
        currentTokenCount = 0;
        startOffset = paragraph.indexOf(sentence) + sentence.length;
        continue;
      }

      if (currentTokenCount + sentenceTokens <= this.maxTokens) {
        currentChunk += sentence;
        currentTokenCount += sentenceTokens;
      } else {
        if (currentChunk.length > 0) {
          chunks.push({
            content: currentChunk.trim(),
            tokenCount: currentTokenCount,
            startOffset,
            endOffset: startOffset + currentChunk.length,
            metadata: metadata || {},
          });

          const overlapText = this.getOverlapText(currentChunk);
          startOffset = startOffset + currentChunk.length - overlapText.length;
          currentChunk = overlapText + sentence;
          currentTokenCount = this.estimateTokens(currentChunk);
        } else {
          currentChunk = sentence;
          currentTokenCount = sentenceTokens;
        }
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        tokenCount: currentTokenCount,
        startOffset,
        endOffset: startOffset + currentChunk.length,
        metadata: metadata || {},
      });
    }

    return chunks;
  }

  /**
   * トークンベースの単純な分割
   */
  private chunkByTokens(
    text: string,
    metadata?: ChunkMetadata
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    const tokens = this.tokenize(text);

    for (let i = 0; i < tokens.length; i += this.maxTokens - this.overlapTokens) {
      const chunkTokens = tokens.slice(i, i + this.maxTokens);
      const content = chunkTokens.join('');

      chunks.push({
        content: content.trim(),
        tokenCount: chunkTokens.length,
        startOffset: i,
        endOffset: Math.min(i + this.maxTokens, tokens.length),
        metadata: metadata || {},
      });

      if (i + this.maxTokens >= tokens.length) {
        break;
      }
    }

    return chunks;
  }

  /**
   * 強制分割（超長いテキスト用）
   */
  private forceSplit(
    text: string,
    metadata?: ChunkMetadata
  ): TextChunk[] {
    const chunks: TextChunk[] = [];
    const tokens = this.tokenize(text);

    for (let i = 0; i < tokens.length; i += this.maxTokens - this.overlapTokens) {
      const chunkTokens = tokens.slice(i, i + this.maxTokens);
      const content = chunkTokens.join('');

      chunks.push({
        content: content.trim(),
        tokenCount: chunkTokens.length,
        startOffset: 0,
        endOffset: content.length,
        metadata: metadata || {},
      });

      if (i + this.maxTokens >= tokens.length) {
        break;
      }
    }

    return chunks;
  }

  /**
   * オーバーラップテキストを取得
   */
  private getOverlapText(text: string): string {
    const tokens = this.tokenize(text);
    const overlapTokens = tokens.slice(-this.overlapTokens);
    return overlapTokens.join('');
  }

  /**
   * テキストを段落に分割
   */
  private splitIntoParagraphs(text: string): string[] {
    // 空行で分割
    return text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * テキストを文に分割
   */
  private splitIntoSentences(text: string): string[] {
    // 日本語と英語の両方に対応
    // 句点、感嘆符、疑問符、ピリオドで分割
    const sentences = text.split(/(?<=[。！？.!?])\s*/);
    return sentences.filter((s) => s.length > 0);
  }

  /**
   * トークン数を推定
   *
   * wakachigaki で日本語単語を分割
   */
  estimateTokens(text: string): number {
    if (!text || text.length === 0) {
      return 0;
    }
    return this.tokenize(text).length;
  }

  /**
   * テキストをトークン化
   *
   * wakachigaki を使用して日本語の単語境界を正確に検出
   */
  private tokenize(text: string): string[] {
    try {
      const tokens = wakachigakiTokenize(text);
      return tokens;
    } catch {
      // フォールバック：文字単位で分割
      return text.split('');
    }
  }

  /**
   * 設定を取得
   */
  getConfig(): ChunkerConfig {
    return {
      maxTokens: this.maxTokens,
      overlapTokens: this.overlapTokens,
      respectParagraphs: this.respectParagraphs,
    };
  }
}

/**
 * TextChunker インスタンスを作成
 */
export function createTextChunker(config?: Partial<ChunkerConfig>): TextChunker {
  return new TextChunker(config);
}

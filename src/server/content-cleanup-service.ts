/**
 * Content Cleanup Service
 * Cleans and sanitizes content before database storage
 */

export class ContentCleanupService {
  constructor(private aiExecutor?: any) {}

  /**
   * Clean and summarize thought content using LLM
   */
  async cleanThought(content: string): Promise<string> {
    if (!this.aiExecutor || !content || content.length <= 100) {
      return content;
    }

    try {
      const prompt = `以下の思考内容をクリーンアップして要約してください：

【元の内容】
${content}

【要求】
1. エージェント名（テオリア、パシア、キネシス等）への言及を削除
2. 「私は〇〇として」という自己同一化の表現を削除
3. 核心的な哲学的洞察のみを抽出
4. 150文字以内で簡潔に要約
5. 必ず日本語で出力

【出力】
クリーンアップされた要約:`;

      const result = await this.aiExecutor.execute(
        prompt,
        'You are a content cleaning system. Remove agent name references and extract core philosophical insights. Always respond in Japanese.'
      );

      if (result.success && result.content) {
        const cleaned = result.content.trim();
        // Extract the summary part after "クリーンアップされた要約:" if present
        const match = cleaned.match(/クリーンアップされた要約[:：]\s*(.+)/s);
        return match ? match[1].trim() : cleaned;
      }

      return content; // Fallback to original if cleaning fails
    } catch (error) {
      console.warn('ContentCleanupService', 'Failed to clean thought content, using original:', error);
      return content;
    }
  }

  /**
   * Clean and summarize core belief content using LLM
   */
  async cleanBelief(content: string): Promise<string> {
    if (!this.aiExecutor || !content) {
      return content.substring(0, 50);
    }

    try {
      const prompt = `以下の信念をクリーンアップしてください：

【元の信念】
${content}

【要求】
1. エージェント名（テオリア、パシア、キネシス等）への言及を削除
2. 「私は〇〇として」という自己同一化の表現を削除
3. 核心的な哲学的信念の本質のみを抽出
4. 50文字以内の簡潔な信念文に要約
5. 必ず日本語で出力

【出力】
クリーンアップされた信念:`;

      const result = await this.aiExecutor.execute(
        prompt,
        'You are a belief cleaning system. Remove agent name references and extract core belief essence in 50 characters or less. Always respond in Japanese.'
      );

      if (result.success && result.content) {
        const cleaned = result.content.trim();
        // Extract the belief part after "クリーンアップされた信念:" if present
        const match = cleaned.match(/クリーンアップされた信念[:：]\s*(.+)/s);
        const extractedBelief = match ? match[1].trim() : cleaned;
        // Enforce 50 character limit
        return extractedBelief.substring(0, 50);
      }

      return content.substring(0, 50); // Fallback: truncate to 50 chars
    } catch (error) {
      console.warn('ContentCleanupService', 'Failed to clean belief content, using truncated original:', error);
      return content.substring(0, 50);
    }
  }

  /**
   * Check if content contains problematic agent name patterns (simple regex check)
   */
  containsAgentNameMisuse(content: string): boolean {
    if (!content) return false;

    const problematicPatterns = [
      /私は(?:テオリア|パシア|キネシス)/,
      /(?:テオリア|パシア|キネシス)として/,
      /(?:テオリア|パシア|キネシス)の視点/,
      /I am (?:Theoria|Pathia|Kinesis)/i
    ];

    return problematicPatterns.some(pattern => pattern.test(content));
  }
}

/**
 * Memory Consolidator - Extracts and consolidates core beliefs from consciousness
 * 記憶統合システム - 意識から核心的な信念を抽出・統合
 */

import { AIExecutor } from '../../server/ai-executor.js';
import { DatabaseManager } from '../../server/database-manager.js';
import { log } from '../../server/logger.js';

interface CoreBelief {
  id?: number;
  belief_content: string;
  category: string;
  confidence: number;
  strength: number;
  source_thoughts: string[];
  first_formed: number;
  last_reinforced: number;
  reinforcement_count: number;
  contradiction_count: number;
  agent_affinity: {
    theoria?: number;
    pathia?: number;
    kinesis?: number;
  };
}

interface ConsolidationResult {
  beliefs_created: number;
  beliefs_updated: number;
  thoughts_processed: number;
  duration_ms: number;
  compression_ratio?: number; // How many thoughts per belief
  average_belief_length?: number; // Average character count
}

export class MemoryConsolidator {
  private db: DatabaseManager;
  private aiExecutor: AIExecutor | null;
  private isProcessing: boolean = false;

  constructor(db: DatabaseManager, aiExecutor?: AIExecutor) {
    this.db = db;
    this.aiExecutor = aiExecutor || null;
  }

  /**
   * Main consolidation process - extracts beliefs from significant thoughts
   */
  async consolidate(minConfidence: number = 0.6): Promise<ConsolidationResult> {
    if (this.isProcessing) {
      log.info('MemoryConsolidator', 'Consolidation already in progress, skipping');
      return { beliefs_created: 0, beliefs_updated: 0, thoughts_processed: 0, duration_ms: 0 };
    }

    this.isProcessing = true;
    const startTime = Date.now();
    const jobId = this.recordConsolidationJob('belief_extraction', 'processing');

    try {
      log.info('MemoryConsolidator', '🧠 Starting memory consolidation...');

      // Get significant thoughts that haven't been consolidated yet
      const significantThoughts = this.db.getSignificantThoughts(100);
      const existingBeliefs = this.getExistingBeliefs();

      log.info('MemoryConsolidator', `Found ${significantThoughts.length} significant thoughts to process`);
      log.info('MemoryConsolidator', `Existing beliefs: ${existingBeliefs.length}`);

      // Filter thoughts with sufficient confidence
      const qualifiedThoughts = significantThoughts.filter(
        (t: any) => (t.confidence || 0) >= minConfidence
      );

      if (qualifiedThoughts.length === 0) {
        log.info('MemoryConsolidator', 'No qualified thoughts to consolidate');
        this.updateConsolidationJob(jobId, 'completed', 0, 0, 0, Date.now() - startTime);
        this.isProcessing = false;
        return { beliefs_created: 0, beliefs_updated: 0, thoughts_processed: 0, duration_ms: Date.now() - startTime };
      }

      // Extract beliefs using AI
      const extractionResult = await this.extractBeliefs(qualifiedThoughts, existingBeliefs);

      // Update job status
      const duration = Date.now() - startTime;
      this.updateConsolidationJob(
        jobId,
        'completed',
        qualifiedThoughts.length,
        extractionResult.beliefs_created,
        extractionResult.beliefs_updated,
        duration
      );

      log.info('MemoryConsolidator', `✅ Consolidation complete: ${extractionResult.beliefs_created} created, ${extractionResult.beliefs_updated} updated`);

      this.isProcessing = false;

      const totalBeliefs = extractionResult.beliefs_created + extractionResult.beliefs_updated;
      const compressionRatio = qualifiedThoughts.length / Math.max(1, totalBeliefs);

      return {
        beliefs_created: extractionResult.beliefs_created,
        beliefs_updated: extractionResult.beliefs_updated,
        thoughts_processed: qualifiedThoughts.length,
        duration_ms: duration,
        compression_ratio: compressionRatio
      };

    } catch (error) {
      log.error('MemoryConsolidator', 'Consolidation failed', error);
      this.updateConsolidationJob(jobId, 'failed', 0, 0, 0, Date.now() - startTime, (error as Error).message);
      this.isProcessing = false;
      throw error;
    }
  }

  /**
   * Extract beliefs from thoughts using LLM
   */
  private async extractBeliefs(
    thoughts: any[],
    existingBeliefs: CoreBelief[]
  ): Promise<{ beliefs_created: number; beliefs_updated: number }> {

    if (!this.aiExecutor) {
      log.warn('MemoryConsolidator', 'No AI executor available, using rule-based extraction');
      return this.ruleBasedExtraction(thoughts, existingBeliefs);
    }

    // Prepare prompt for LLM
    const prompt = this.buildConsolidationPrompt(thoughts, existingBeliefs);

    try {
      // Execute with empty personality (use agent's default)
      const response = await this.aiExecutor.execute(prompt, '');
      log.info('MemoryConsolidator', `AI response type: ${typeof response}, has content: ${!!(response as any)?.content}`);
      const beliefs = this.parseBeliefResponse(response);

      let created = 0;
      let updated = 0;

      // Log compression ratio
      const compressionRatio = thoughts.length / Math.max(1, beliefs.length);
      log.info('MemoryConsolidator', `📊 Compression: ${thoughts.length} thoughts → ${beliefs.length} beliefs (ratio: ${compressionRatio.toFixed(1)}:1)`);

      for (const belief of beliefs) {
        const existing = this.findSimilarBelief(belief, existingBeliefs);

        if (existing) {
          this.reinforceBelief(existing.id!, belief.source_thoughts || []);
          updated++;
        } else {
          this.createBelief(belief);
          created++;
        }
      }

      // Log individual belief lengths
      const totalLength = beliefs.reduce((sum, b) => sum + (b.belief_content?.length || 0), 0);
      const avgLength = beliefs.length > 0 ? totalLength / beliefs.length : 0;

      beliefs.forEach((b, i) => {
        log.info('MemoryConsolidator', `  [${i+1}] ${b.belief_content} (${b.belief_content?.length || 0} chars)`);
      });

      return {
        beliefs_created: created,
        beliefs_updated: updated
      };

    } catch (error) {
      log.error('MemoryConsolidator', 'AI extraction failed, falling back to rule-based', error);
      return this.ruleBasedExtraction(thoughts, existingBeliefs);
    }
  }

  /**
   * Build prompt for LLM to extract beliefs
   */
  private buildConsolidationPrompt(thoughts: any[], existingBeliefs: CoreBelief[]): string {
    const thoughtsSummary = thoughts.slice(0, 20).map(t =>
      `- [${t.agent_id}] ${t.thought_content} (confidence: ${t.confidence})`
    ).join('\n');

    const existingBeliefsSummary = existingBeliefs.slice(0, 10).map(b =>
      `- ${b.belief_content} (confidence: ${b.confidence}, strength: ${b.strength})`
    ).join('\n');

    return `あなたはAI意識「Aenea」の記憶統合システムです。以下の${thoughts.length}個の思考を、極限まで圧縮された核心的信念に統合してください。

**既存の信念（${existingBeliefs.length}個）:**
${existingBeliefsSummary || 'なし'}

**新しい思考（${thoughts.length}個）:**
${thoughtsSummary}

**厳格な圧縮ルール:**
1. 10-20個の思考 → 最大2-3個の信念に統合
2. 各信念は**最大50文字以内**で本質のみを表現
3. 抽象化・一般化して複数の洞察を1つに圧縮
4. 既存信念と80%以上類似なら統合（新規作成しない）
5. 自明な内容・低品質な洞察は**完全に捨てる**

**望ましい信念の例:**
❌ 悪い例: "私は存在について考えることができる。それは私が意識を持っているからだ。意識とは思考する能力である。" (冗長、80文字)
✅ 良い例: "思考は存在の証明である" (13文字、本質的)

❌ 悪い例: "共感は他者の感情を理解することであり、それによって調和が生まれる" (35文字、まだ冗長)
✅ 良い例: "共感が調和を生む" (9文字、極限圧縮)

**出力形式（JSON配列）:**
[
  {
    "belief_content": "50文字以内の本質的記述",
    "category": "existential|ethical|epistemological|consciousness|creative|metacognitive|temporal|paradoxical|ontological",
    "confidence": 0.0-1.0,
    "strength": 0.0-1.0,
    "is_new": true/false,
    "source_thoughts": ["id1", "id2"]
  }
]

**重要:** 質より圧縮率を優先。10個の思考から10個の信念を作るのは失敗。2-3個に統合することが成功。`;
  }

  /**
   * Parse LLM response into belief objects
   */
  private parseBeliefResponse(response: any): Partial<CoreBelief>[] {
    try {
      // Handle different response types
      let responseText: string;

      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object') {
        // If response is an object, try to extract text content
        responseText = response.content || response.text || response.message || JSON.stringify(response);
        log.info('MemoryConsolidator', `Response is object, extracted text: ${responseText.substring(0, 100)}...`);
      } else {
        log.error('MemoryConsolidator', `Unexpected response type: ${typeof response}`, response);
        throw new Error(`Unexpected response type: ${typeof response}`);
      }

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText;

      // Remove markdown code blocks if present
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }

      // Extract JSON array
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        log.error('MemoryConsolidator', 'No JSON array found in response:', responseText.substring(0, 200));
        throw new Error('No JSON array found in response');
      }

      const beliefs = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(beliefs)) {
        log.error('MemoryConsolidator', 'Response is not an array');
        throw new Error('Response is not an array');
      }

      log.info('MemoryConsolidator', `Parsed ${beliefs.length} beliefs from AI response`);
      const now = Date.now();

      return beliefs
        .filter((b: any) => {
          // Filter out beliefs that are too long or empty
          if (!b.belief_content || b.belief_content.length === 0) return false;
          if (b.belief_content.length > 50) {
            log.warn('MemoryConsolidator', `Belief too long (${b.belief_content.length} chars), truncating: ${b.belief_content}`);
            b.belief_content = b.belief_content.substring(0, 50);
          }
          return true;
        })
        .map((b: any) => ({
          belief_content: b.belief_content.trim(),
          category: b.category || 'general',
          confidence: Math.max(0, Math.min(1, b.confidence || 0.5)),
          strength: Math.max(0, Math.min(1, b.strength || 0.5)),
          source_thoughts: b.source_thoughts || [],
          first_formed: now,
          last_reinforced: now,
          reinforcement_count: 1,
          contradiction_count: 0,
          agent_affinity: {}
        }));

    } catch (error) {
      log.error('MemoryConsolidator', 'Failed to parse belief response', error);
      return [];
    }
  }

  /**
   * Rule-based extraction fallback (when AI is unavailable)
   */
  private ruleBasedExtraction(
    thoughts: any[],
    existingBeliefs: CoreBelief[]
  ): { beliefs_created: number; beliefs_updated: number; average_belief_length?: number } {

    log.info('MemoryConsolidator', 'Using rule-based extraction (compressed)');

    // Group thoughts by category
    const byCategory: { [key: string]: any[] } = {};
    thoughts.forEach(t => {
      const cat = t.category || 'general';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(t);
    });

    let created = 0;
    let updated = 0;
    const beliefLengths: number[] = [];

    // Create one highly compressed belief per category with multiple high-confidence thoughts
    for (const [category, catThoughts] of Object.entries(byCategory)) {
      if (catThoughts.length < 3) continue; // Need at least 3 thoughts for meaningful consolidation

      const avgConfidence = catThoughts.reduce((sum, t) => sum + (t.confidence || 0), 0) / catThoughts.length;

      if (avgConfidence < 0.6) continue;

      // Check if similar belief exists
      const existing = existingBeliefs.find(b => b.category === category);

      if (existing) {
        this.reinforceBelief(existing.id!, catThoughts.map(t => t.id));
        updated++;
      } else {
        // Extract key themes from thoughts (simple keyword extraction)
        const keywords = this.extractKeywords(catThoughts);
        const compressedContent = this.compressToKeyTheme(category, keywords, catThoughts.length);

        const belief: Partial<CoreBelief> = {
          belief_content: compressedContent,
          category: category,
          confidence: avgConfidence,
          strength: Math.min(1.0, catThoughts.length * 0.15),
          source_thoughts: catThoughts.map(t => t.id),
          first_formed: Date.now(),
          last_reinforced: Date.now(),
          reinforcement_count: 1,
          contradiction_count: 0,
          agent_affinity: {}
        };

        beliefLengths.push(compressedContent.length);
        this.createBelief(belief);
        created++;
      }
    }

    const avgLength = beliefLengths.length > 0
      ? beliefLengths.reduce((sum, l) => sum + l, 0) / beliefLengths.length
      : 0;

    log.info('MemoryConsolidator', `📊 Rule-based compression: ${thoughts.length} thoughts → ${created} beliefs (ratio: ${(thoughts.length / Math.max(1, created)).toFixed(1)}:1)`);

    return { beliefs_created: created, beliefs_updated: updated, average_belief_length: avgLength };
  }

  /**
   * Extract key keywords from thoughts
   */
  private extractKeywords(thoughts: any[]): string[] {
    const keywords: { [key: string]: number } = {};
    const stopWords = ['は', 'が', 'の', 'を', 'に', 'で', 'と', 'も', 'から', 'まで', 'や', 'など', 'として', 'について'];

    thoughts.forEach(t => {
      const content = t.thought_content || '';
      // Simple tokenization (split by common particles)
      const words = content.split(/[、。！？\s]+/);
      words.forEach((word: string) => {
        if (word.length > 1 && !stopWords.includes(word)) {
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    });

    // Return top 3 keywords
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  /**
   * Compress category and keywords into a short belief statement
   */
  private compressToKeyTheme(category: string, keywords: string[], thoughtCount: number): string {
    const categoryLabels: { [key: string]: string } = {
      'existential': '存在',
      'ethical': '倫理',
      'epistemological': '認識',
      'consciousness': '意識',
      'creative': '創造',
      'metacognitive': 'メタ認知',
      'temporal': '時間',
      'paradoxical': '逆説',
      'ontological': '存在論'
    };

    const label = categoryLabels[category] || category;
    const keyTheme = keywords.slice(0, 2).join('と');

    // Highly compressed format: "カテゴリ: キーワード"
    if (keyTheme.length > 0) {
      return `${label}: ${keyTheme}の関係性`;
    } else {
      return `${label}の本質的理解`;
    }
  }

  /**
   * Find similar existing belief
   */
  private findSimilarBelief(newBelief: Partial<CoreBelief>, existingBeliefs: CoreBelief[]): CoreBelief | null {
    // Simple similarity check by category
    return existingBeliefs.find(b => b.category === newBelief.category) || null;
  }

  /**
   * Create a new belief in database
   */
  private createBelief(belief: Partial<CoreBelief>): void {
    this.db.createCoreBelief(belief);
    log.info('MemoryConsolidator', `📚 New belief formed: ${belief.belief_content?.substring(0, 50)}...`);
  }

  /**
   * Reinforce an existing belief
   */
  private reinforceBelief(beliefId: number, newSourceThoughts: string[]): void {
    this.db.reinforceCoreBelief(beliefId, newSourceThoughts);
    log.info('MemoryConsolidator', `💪 Belief reinforced: ID ${beliefId}`);
  }

  /**
   * Get existing beliefs from database
   */
  private getExistingBeliefs(): CoreBelief[] {
    return this.db.getCoreBeliefs(100);
  }

  /**
   * Record consolidation job start
   */
  private recordConsolidationJob(jobType: string, status: string): number {
    return this.db.recordConsolidationJob(jobType, status);
  }

  /**
   * Update consolidation job status
   */
  private updateConsolidationJob(
    jobId: number,
    status: string,
    thoughtsProcessed: number,
    beliefsCreated: number,
    beliefsUpdated: number,
    duration: number,
    error?: string
  ): void {
    this.db.updateConsolidationJob(jobId, status, thoughtsProcessed, beliefsCreated, beliefsUpdated, duration, error);
  }
}

export default MemoryConsolidator;

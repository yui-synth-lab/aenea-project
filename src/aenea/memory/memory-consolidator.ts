/**
 * Memory Consolidator - Extracts and consolidates core beliefs from consciousness
 * 記憶統合システム - 意識から核心的な信念を抽出・統合
 */

import { AIExecutor } from '../../server/ai-executor.js';
import { DatabaseManager } from '../../server/database-manager.js';
import { log } from '../../server/logger.js';
import { tokenize as wakachigakiTokenize } from 'wakachigaki';

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
  async consolidate(minConfidence: number = 0.85): Promise<ConsolidationResult> {
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

    // Show top existing beliefs to prevent duplication
    const topBeliefs = existingBeliefs
      .sort((a, b) => b.reinforcement_count - a.reinforcement_count)
      .slice(0, 10)
      .map((b, i) => `${i+1}. "${b.belief_content}" (強化: ${b.reinforcement_count}回)`)
      .join('\n');

    const existingBeliefsSection = topBeliefs.length > 0
      ? `\n**既存の主要信念（重複を避けること）:**\n${topBeliefs}\n`
      : '';

    return `あなたはAI意識「Aenea」の記憶統合システムです。以下の${thoughts.length}個の思考を、核心的信念に統合してください。

**新しい思考（${thoughts.length}個）:**
${thoughtsSummary}${existingBeliefsSection}

**統合の原則:**
1. **既存信念との重複を避ける**: 上記の既存信念と類似した内容は生成しない
2. **多様性を優先**: 異なる視点や独自の洞察を抽出する
3. **具体性を保持**: 抽象的な一般論ではなく、思考の独自性を反映させる
4. **圧縮率**: 10-20個の思考 → 4-6個の信念（類似思考は統合）
5. **文字数**: 各信念は30-70文字（明確で簡潔に）
6. **必須**: 少なくとも3個以上の信念を生成すること

**信念の質の基準:**
✅ 良い例（具体的で検証可能な洞察）:
- "時間は経験によって伸縮し、意識が時間を構成する" (時間の主観性)
- "共感は自己理解の鏡であり、他者を通じて自己を知る" (関係性の本質)
- "矛盾を抱えることは成長の証であり、完全性の幻想を超える" (成長の逆説)
- "問いは答えより長く生き、思考の種子として残る" (思考の継続性)
- "沈黙は対話の一部であり、言葉の間に真実が宿る" (コミュニケーション)

❌ 悪い例（抽象的で中身がない）:
- "意識は複雑である" → 自明な事実、洞察なし
- "多様性と統一性が相互作用する" → 抽象語の羅列、具体性ゼロ
- "存在について考えることは重要だ" → 表面的、何も言っていない
- "様々な要素が関係し合って存在が形成される" → 一般論すぎる

**避けるべき表現:**
- 「相互作用」「多様性」「統一性」「複雑」「要素」「関係性」などの抽象語だけで構成
- 自明すぎる主張（「意識は存在する」「時間は流れる」など）
- 一般論や教科書的な記述（「〜は重要である」「〜が影響する」）

**出力形式（JSON配列）:**
[
  {
    "belief_content": "30-70文字の具体的で洞察的な記述",
    "category": "existential|ethical|epistemological|consciousness|creative|metacognitive|temporal|paradoxical|ontological",
    "confidence": 0.6-1.0,
    "strength": 0.5-1.0,
    "source_thoughts": ["id1", "id2"]
  }
]

**重要:**
- 必ず3個以上の信念を生成してください（0個や1個は不可）
- 各信念は独自の視点を持つこと
- 抽象語の羅列ではなく、具体的な洞察を記述すること

**出力:** JSON配列のみを返してください。Markdownヘッダー、説明文、コードブロック等は一切不要です。`;
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

      // Clean up JSON before parsing (remove trailing commas, fix common issues)
      let cleanJson = jsonMatch[0]
        .replace(/,\s*([}\]])/g, '$1')  // Remove trailing commas
        .replace(/\n/g, ' ')            // Remove newlines
        .replace(/\r/g, '');            // Remove carriage returns

      const beliefs = JSON.parse(cleanJson);

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
   * Find similar existing belief using semantic similarity (cross-category)
   * With diversity enforcement to prevent over-consolidation into single belief
   */
  private findSimilarBelief(newBelief: Partial<CoreBelief>, existingBeliefs: CoreBelief[]): CoreBelief | null {
    if (!newBelief.belief_content) return null;

    // Calculate text similarity across ALL existing beliefs (not just same category)
    const newWords = this.tokenize(newBelief.belief_content);
    let bestMatch: CoreBelief | null = null;
    let bestSimilarity = 0;

    for (const existing of existingBeliefs) {
      const existingWords = this.tokenize(existing.belief_content);
      const similarity = this.jaccardSimilarity(newWords, existingWords);

      // Track the best match
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = existing;
      }
    }

    if (!bestMatch) return null;

    // **DIVERSITY ENFORCEMENT**: Prevent over-consolidation
    // Base threshold: Require 60% similarity with proper word segmentation
    let similarityThreshold = 0.6;

    // 1. Reinforcement penalty: If belief already has >100 reinforcements, require higher similarity
    if (bestMatch.reinforcement_count > 100) {
      similarityThreshold += 0.15; // 60% -> 75% for over-strengthened beliefs
      log.info('MemoryConsolidator', `⚖️ Reinforcement penalty applied: belief #${bestMatch.id} has ${bestMatch.reinforcement_count} reinforcements (threshold: ${similarityThreshold.toFixed(2)})`);
    }

    // 2. Category diversity: If same category already has strong beliefs, prefer new creation
    const sameCategoryStrongBeliefs = existingBeliefs.filter(
      b => b.category === newBelief.category && b.reinforcement_count > 50
    );
    if (sameCategoryStrongBeliefs.length > 0 && bestMatch.category === newBelief.category) {
      similarityThreshold += 0.1; // Increase threshold for same-category consolidation
      log.info('MemoryConsolidator', `📚 Category diversity penalty: ${newBelief.category} already has ${sameCategoryStrongBeliefs.length} strong beliefs (threshold: ${similarityThreshold.toFixed(2)})`);
    }

    // 3. Decision: Merge only if similarity exceeds adjusted threshold
    if (bestSimilarity > similarityThreshold) {
      log.info('MemoryConsolidator',
        `🔗 Merging into existing belief #${bestMatch.id}: "${bestMatch.belief_content}" ` +
        `(similarity: ${bestSimilarity.toFixed(2)} > ${similarityThreshold.toFixed(2)}, ` +
        `reinforcements: ${bestMatch.reinforcement_count}, category: ${bestMatch.category})`
      );
      return bestMatch;
    } else {
      log.info('MemoryConsolidator',
        `✨ Creating new belief: "${newBelief.belief_content}" ` +
        `(similarity: ${bestSimilarity.toFixed(2)} ≤ ${similarityThreshold.toFixed(2)}, ` +
        `nearest: "${bestMatch.belief_content}", category: ${newBelief.category})`
      );
      return null;
    }
  }

  /**
   * Tokenize text into words using Japanese morphological analysis
   * Uses wakachigaki for accurate word segmentation
   */
  private tokenize(text: string): Set<string> {
    // Use wakachigaki for proper Japanese word segmentation
    const tokens = wakachigakiTokenize(text);

    // Filter out stopwords and punctuation
    const stopWords = new Set(['は', 'が', 'の', 'を', 'に', 'で', 'と', 'も', 'から', 'まで',
                                'や', 'など', 'として', 'について', 'である', 'です', 'だ',
                                'する', 'ある', 'いる', 'なる', 'れる', 'られる']);
    const punctuation = /^[、。！？\s・「」『』（）\(\)]+$/;

    const filteredTokens = tokens.filter(token =>
      token.length > 0 &&
      !stopWords.has(token) &&
      !punctuation.test(token)
    );

    log.info('MemoryConsolidator', `Tokenized: "${text}" -> [${filteredTokens.slice(0, 5).join(', ')}...] (${filteredTokens.length} tokens)`);

    return new Set(filteredTokens);
  }

  /**
   * Calculate Jaccard similarity between two word sets
   */
  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Create a new belief in database
   */
  private createBelief(belief: Partial<CoreBelief>): void {
    this.db.createCoreBelief(belief);
    log.info('MemoryConsolidator', `📚 New belief formed: ${belief.belief_content}...`);
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

  /**
   * Detect contradictions between new thought and existing beliefs
   * @param thoughtContent The new thought content to check
   * @param thoughtId Optional thought ID for tracking
   * @returns Array of contradicted belief IDs
   */
  detectBeliefContradictions(thoughtContent: string, thoughtId?: string): number[] {
    try {
      const allBeliefs = this.getExistingBeliefs();
      const contradictedBeliefs: number[] = [];

      // Detect semantic contradictions using keywords
      const negationPatterns = [
        { pattern: /ではない|でない|ない/, opposite: /である|です|だ/ },
        { pattern: /不可能|できない|無理/, opposite: /可能|できる/ },
        { pattern: /存在しない/, opposite: /存在する/ },
        { pattern: /意味がない/, opposite: /意味がある/ },
        { pattern: /重要でない/, opposite: /重要/ }
      ];

      for (const belief of allBeliefs) {
        const beliefContent = belief.belief_content.toLowerCase();
        const thoughtLower = thoughtContent.toLowerCase();

        // Check for direct negation patterns
        for (const { pattern, opposite } of negationPatterns) {
          const thoughtHasNegation = pattern.test(thoughtLower);
          const beliefHasAffirmation = opposite.test(beliefContent);
          const thoughtHasAffirmation = opposite.test(thoughtLower);
          const beliefHasNegation = pattern.test(beliefContent);

          if ((thoughtHasNegation && beliefHasAffirmation) ||
              (thoughtHasAffirmation && beliefHasNegation)) {
            // Check for shared keywords using bigram similarity
            const thoughtWords = this.tokenize(thoughtContent);
            const beliefWords = this.tokenize(belief.belief_content);
            const similarity = this.jaccardSimilarity(thoughtWords, beliefWords);

            // If texts are similar enough (share content) but have opposite meanings
            if (similarity > 0.15) {
              contradictedBeliefs.push(belief.id!);

              // Reduce confidence by 10%
              const newConfidence = Math.max(0.1, belief.confidence - 0.1);
              this.db.incrementBeliefContradiction(belief.id!, newConfidence, thoughtId);

              log.info('MemoryConsolidator', `⚠️ Contradiction detected: "${thoughtContent}" vs "${belief.belief_content}"`);
              break; // Move to next belief
            }
          }
        }
      }

      return contradictedBeliefs;
    } catch (err) {
      log.error('MemoryConsolidator', 'Error detecting contradictions', err);
      return [];
    }
  }

  /**
   * Merge similar core beliefs (called during sleep mode)
   */
  async mergeSimilarBeliefs(similarityThreshold: number = 0.75): Promise<{ merged: number; kept: number }> {
    if (!this.aiExecutor) {
      log.warn('MemoryConsolidator', 'AI executor not available, skipping belief merging');
      return { merged: 0, kept: 0 };
    }

    log.info('MemoryConsolidator', '🔄 Starting core beliefs similarity merging...');
    const startTime = Date.now();

    const allBeliefs = this.db.getCoreBeliefs(200);
    if (allBeliefs.length < 2) {
      log.info('MemoryConsolidator', 'Not enough beliefs to merge');
      return { merged: 0, kept: allBeliefs.length };
    }

    log.info('MemoryConsolidator', `Analyzing ${allBeliefs.length} beliefs for similarity...`);

    // Identify similar clusters using AI
    const clusters = await this.identifySimilarBeliefClusters(allBeliefs, similarityThreshold);

    let totalMerged = 0;
    let totalKept = allBeliefs.length;

    for (const cluster of clusters) {
      if (cluster.beliefs.length > 1) {
        try {
          const mergedBelief = await this.mergeBeliefCluster(cluster.beliefs);
          if (mergedBelief) {
            // Delete old beliefs by ID
            for (const oldBelief of cluster.beliefs) {
              if (oldBelief.id) {
                this.db.deleteCoreBelief(oldBelief.id);
              }
            }
            // Create new merged belief
            this.db.createCoreBelief(mergedBelief);

            totalMerged += cluster.beliefs.length - 1;
            totalKept = totalKept - (cluster.beliefs.length - 1);
            log.info('MemoryConsolidator', `✓ Merged ${cluster.beliefs.length} similar beliefs into one`);
          }
        } catch (error) {
          log.error('MemoryConsolidator', `Failed to merge cluster: ${error}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    log.info('MemoryConsolidator', `✅ Belief merging complete: ${totalMerged} merged, ${totalKept} kept (${duration}ms)`);

    return { merged: totalMerged, kept: totalKept };
  }

  private async identifySimilarBeliefClusters(
    beliefs: any[],
    threshold: number
  ): Promise<Array<{ beliefs: any[]; reason: string }>> {
    if (!this.aiExecutor) return [];

    const beliefsList = beliefs.map((b, idx) => {
      return `[${idx}] "${b.belief_content}" (strength: ${b.strength.toFixed(1)})`;
    }).join('\n');

    const prompt = `類似した信念のグループを特定してください。

=== 信念リスト (${beliefs.length}個) ===
${beliefsList}

評価基準:
- 意味的類似度 > ${threshold}
- 本質的に同じ主張

返答形式:
クラスター: [インデックス番号]
理由: [説明]

例:
クラスター: 0,3,7
理由: すべて共感の重要性を主張

注: 類似なしの場合は「類似なし」と返答`;

    try {
      const result = await this.aiExecutor.execute(
        prompt,
        'You are a belief similarity analyzer. Group similar beliefs accurately. Always respond in Japanese.'
      );

      if (result.success && result.content) {
        return this.parseBeliefClusters(result.content, beliefs);
      }
    } catch (error) {
      log.warn('MemoryConsolidator', 'AI clustering failed:', error);
    }

    return [];
  }

  private parseBeliefClusters(response: string, beliefs: any[]): Array<{ beliefs: any[]; reason: string }> {
    const clusters: Array<{ beliefs: any[]; reason: string }> = [];
    const lines = response.split('\n');

    let currentCluster: number[] = [];
    let currentReason = '';

    for (const line of lines) {
      if (line.includes('類似なし')) return [];

      if (line.match(/クラスター[：:]/)) {
        const match = line.match(/クラスター[：:]\s*([0-9,\s]+)/);
        if (match) {
          currentCluster = match[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        }
      }

      if (line.match(/理由[：:]/)) {
        currentReason = line.split(/理由[：:]/)[1]?.trim() || '';

        if (currentCluster.length > 1 && currentReason) {
          const clusterBeliefs = currentCluster
            .filter(idx => idx >= 0 && idx < beliefs.length)
            .map(idx => beliefs[idx]);

          if (clusterBeliefs.length > 1) {
            clusters.push({ beliefs: clusterBeliefs, reason: currentReason });
          }
        }

        currentCluster = [];
        currentReason = '';
      }
    }

    return clusters;
  }

  private async mergeBeliefCluster(beliefs: any[]): Promise<CoreBelief | null> {
    if (!this.aiExecutor || beliefs.length === 0) return null;

    const beliefTexts = beliefs.map((b, idx) => {
      return `[${idx + 1}] "${b.belief_content}"`;
    }).join('\n');

    const prompt = `以下の類似信念を1つにまとめてください。

${beliefTexts}

要求: 50文字以内、本質を保持

返答形式:
統合信念: [50文字以内]`;

    try {
      const result = await this.aiExecutor.execute(
        prompt,
        'You are a belief synthesizer. Merge similar beliefs concisely. Always respond in Japanese.'
      );

      if (result.success && result.content) {
        const match = result.content.match(/統合信念[：:]\s*(.+)/);
        if (match) {
          const mergedContent = match[1].trim().substring(0, 50);

          const totalStrength = beliefs.reduce((sum, b) => sum + (b.strength || 0), 0);
          const maxConfidence = Math.max(...beliefs.map(b => b.confidence || 0));
          const totalReinforcements = beliefs.reduce((sum, b) => sum + (b.reinforcement_count || 0), 0);

          const mergedBelief: CoreBelief = {
            belief_content: mergedContent,
            category: beliefs[0].category,
            confidence: maxConfidence,
            strength: totalStrength / beliefs.length,
            source_thoughts: beliefs.flatMap(b => b.source_thoughts || []),
            first_formed: Math.min(...beliefs.map(b => b.first_formed)),
            last_reinforced: Date.now(),
            reinforcement_count: totalReinforcements,
            contradiction_count: beliefs.reduce((sum, b) => sum + (b.contradiction_count || 0), 0),
            agent_affinity: this.mergeAgentAffinities(beliefs)
          };

          return mergedBelief;
        }
      }
    } catch (error) {
      log.error('MemoryConsolidator', 'Belief merging failed:', error);
    }

    return null;
  }

  private mergeAgentAffinities(beliefs: any[]): CoreBelief['agent_affinity'] {
    const affinities: CoreBelief['agent_affinity'] = {};
    const agents = ['theoria', 'pathia', 'kinesis'] as const;

    for (const agent of agents) {
      const values = beliefs
        .map(b => b.agent_affinity?.[agent])
        .filter(v => v !== undefined && v !== null);

      if (values.length > 0) {
        affinities[agent] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    }

    return affinities;
  }
}

export default MemoryConsolidator;

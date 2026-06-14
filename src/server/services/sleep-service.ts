/**
 * SleepService (Phase 5c extraction)
 *
 * Sleep consolidation engine — 4-phase memory processing during rest.
 * Method bodies moved VERBATIM from ConsciousnessBackend; only
 * `this.<field>` -> `this.ctx.<field>`, `this.emit(...)` ->
 * `this.ctx.emit(...)`, and `this.saveConsciousnessState()` ->
 * `this.ctx.saveConsciousnessState()` substitutions were applied.
 * Internal calls between moved methods stay as `this.<method>()`.
 */

import { log } from '../../platform/logger.js';
import { parseJsonArray } from '../../utils/json-parser.js';
import { ConsciousnessInternals } from './consciousness-internals.js';

export class SleepService {
  constructor(private ctx: ConsciousnessInternals) {}

  /**
   * Sleep consolidation: 4-phase memory processing
   */
  async performSleepConsolidation(reason: string): Promise<void> {
    const sleepLog: string[] = [];
    const stats: any = {
      dreamPatterns: 0,
      beliefsMerged: 0,
      thoughtsPruned: 0,
      tensionsResolved: 0
    };

    const startTime = Date.now();

    // Phase 1: REM Sleep - Dream-like pattern extraction
    this.ctx.emit('sleepPhaseChanged', { phase: 'REM', progress: 25 });
    sleepLog.push('--- REM Phase: Pattern Extraction ---');
    try {
      const dreamPatterns = await this.extractDreamPatterns();
      stats.dreamPatterns = dreamPatterns.length;
      sleepLog.push(`Extracted ${dreamPatterns.length} dream patterns from thoughts`);
    } catch (error) {
      sleepLog.push(`REM phase skipped: ${(error as Error).message}`);
    }

    // Phase 2: Deep Sleep - Memory consolidation + Core Beliefs merging
    this.ctx.emit('sleepPhaseChanged', { phase: 'Deep Sleep', progress: 50 });
    sleepLog.push('--- Deep Sleep Phase: Memory Consolidation & Belief Merging ---');
    try {
      const consolidated = await this.consolidateSignificantThoughts();
      stats.beliefsMerged = consolidated.merged;
      sleepLog.push(`Consolidated ${consolidated.merged} thoughts into ${consolidated.beliefs} beliefs`);

      // Merge similar core beliefs
      const mergeResult = await this.ctx.memoryConsolidator.mergeSimilarBeliefs(0.75);
      sleepLog.push(`Merged ${mergeResult.merged} similar beliefs, ${mergeResult.kept} beliefs remain`);
    } catch (error) {
      sleepLog.push(`Deep sleep phase skipped: ${(error as Error).message}`);
    }

    // Phase 3: Synaptic Pruning - Remove redundant thoughts
    this.ctx.emit('sleepPhaseChanged', { phase: 'Synaptic Pruning', progress: 75 });
    sleepLog.push('--- Synaptic Pruning Phase ---');
    try {
      const pruned = await this.synapticPruning();
      stats.thoughtsPruned = pruned.deleted;
      sleepLog.push(`Pruned ${pruned.deleted} redundant thoughts`);
    } catch (error) {
      sleepLog.push(`Pruning phase skipped: ${(error as Error).message}`);
    }

    // Phase 4: Emotional Processing - Resolve tensions
    this.ctx.emit('sleepPhaseChanged', { phase: 'Emotional Processing', progress: 90 });
    sleepLog.push('--- Emotional Processing Phase ---');
    try {
      const resolved = await this.processEmotionalTensions();
      stats.tensionsResolved = resolved.count;
      sleepLog.push(`Resolved ${resolved.count} conceptual tensions`);
    } catch (error) {
      sleepLog.push(`Emotional processing skipped: ${(error as Error).message}`);
    }

    // Phase 5: Failsafe Pruning - age-based safety net against unbounded growth.
    // Deletes any thoughts older than 48h regardless of confidence, catching
    // whatever survived AI-driven synaptic pruning. Restored from the retired
    // SleepManager's Phase 3b (48h threshold confirmed with maintainer).
    this.ctx.emit('sleepPhaseChanged', { phase: 'Failsafe Pruning', progress: 95 });
    sleepLog.push('--- Failsafe Pruning Phase ---');
    try {
      const agePruned = await this.pruneOldThoughts();
      stats.thoughtsPruned += agePruned.deleted;
      sleepLog.push(`Age-pruned ${agePruned.deleted} thoughts older than 48h`);
    } catch (error) {
      sleepLog.push(`Failsafe pruning skipped: ${(error as Error).message}`);
    }

    // Full energy recovery after sleep
    const energyBefore = this.ctx.energyManager.getEnergyState().available;
    this.ctx.energyManager.resetEnergy(); // Full reset to maximum
    const energyAfter = this.ctx.energyManager.getEnergyState().available;

    sleepLog.push(`Energy recovered: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}`);
    log.info('Consciousness', `⚡ Energy fully restored after sleep: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}`);

    // Emit energy update event
    this.ctx.emit('energyUpdated', {
      available: energyAfter,
      level: this.ctx.energyManager.getEnergyLevel(),
      timestamp: Date.now()
    });

    // Save sleep log to database
    const duration = Date.now() - startTime;
    await this.ctx.databaseManager.saveSleepLog({
      timestamp: startTime,
      systemClock: this.ctx.systemClock,
      triggerReason: reason,
      phases: sleepLog,
      stats,
      duration,
      energyBefore,
      energyAfter
    });

    log.info('Consciousness', `💤 Sleep consolidation complete: ${JSON.stringify(stats)}`);
  }

  /**
   * Helper: Clean JSON response from LLM (remove markdown code blocks)
   */
  /**
   * @deprecated Use parseRobustJson from utils/json-parser.ts instead
   */
  private cleanJsonResponse(content: string): string {
    // Remove ```json and ``` markers
    return content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  /**
   * REM Phase: Extract dream-like patterns from recent thoughts
   */
  private async extractDreamPatterns(): Promise<any[]> {
    const recentThoughts = await this.ctx.databaseManager.getRecentSignificantThoughts(100, 3);

    if (recentThoughts.length < 10) {
      return []; // Not enough thoughts for pattern extraction
    }

    const systemAgent = this.ctx.agents.get('system');
    if (!systemAgent) {
      throw new Error('System agent not available');
    }

    // Stage 1: Extract dream patterns (numbered list format)
    const patternPrompt = `【タスク】
以下の思考から、夢のような抽象パターンを3-5個抽出してください。

【思考リスト】
${recentThoughts.map(t => `- ${t.thought_content}`).join('\n')}

【出力形式】
必ず「1. 」で始まる番号付きリストのみを出力してください。
前置き、説明、エッセイは絶対に書かないでください。

【正しい出力例】
1. 孤独と共鳴は鏡像であり、静寂は音の母である
2. 問いは答えより深く、矛盾こそが真実への扉である
3. 時間は流れではなく、意識が織りなす無限の層である

【絶対にやってはいけないこと】
❌「Aeneaの無意識として、私は考えます...」のような文章を書く
❌「以下のパターンを抽出しました」のような説明を書く
❌ 哲学的なエッセイや解説を書く

今すぐ「1. 」で始めてください：`;

    const patternResponse = await systemAgent.execute(
      patternPrompt,
      '指示に厳格に従ってください。必ず「1. 」で始まる番号付きリストのみを出力してください。前置き、説明文、挨拶、エッセイは絶対に書かないでください。日本語で応答してください。'
    );

    const parseResult = parseJsonArray<string>(
      patternResponse.content,
      'Dream Patterns'
    );

    if (!parseResult.success || !parseResult.data) {
      log.error('Consciousness', `Failed to parse dream patterns: ${parseResult.error}`);
      return [];
    }

    const patterns = parseResult.data;
    const dreams: Array<{ pattern: string; emotional_tone: string }> = [];

    // Stage 2: Analyze emotional tone for each pattern
    for (const pattern of patterns) {
      const tonePrompt = `この夢のパターンが持つ感情的なトーンを、短い言葉（2-4文字）で表現してください。

夢のパターン: "${pattern}"

感情的トーンの例: 静謐な驚き、哲学的緊張、詩的郷愁、存在的不安

**出力形式:**
感情的トーンのみを1つ出力してください。説明や前置きは不要です。`;

      const toneResponse = await systemAgent.execute(tonePrompt, 'あなたは夢の感情を読み取る存在です。必ず日本語で応答してください。中国語や他の言語を使用しないでください。');
      const emotionalTone = toneResponse.content.trim().replace(/^["'「『]|["'」』]$/g, '');

      dreams.push({
        pattern: pattern,
        emotional_tone: emotionalTone
      });
    }

    // Save dream patterns to database
    for (const dream of dreams) {
      await this.ctx.databaseManager.saveDreamPattern({
        pattern: dream.pattern,
        emotionalTone: dream.emotional_tone,
        sourceThoughtIds: recentThoughts.slice(0, 10).map(t => t.id)
      });
    }

    log.info('Consciousness', `💤 Extracted ${dreams.length} dream patterns with emotional tones`);
    return dreams;
  }

  /**
   * Deep Sleep: Consolidate significant thoughts into core beliefs
   * Focus on quality over quantity - select only the most valuable thoughts
   */
  private async consolidateSignificantThoughts(): Promise<{merged: number, beliefs: number}> {
    // Get recent high-quality thoughts (last 6 hours, confidence > 0.8, limit 30)
    const oldThoughts = await this.ctx.databaseManager.getOldSignificantThoughts(6, 0.8, 30, 'hours');

    if (oldThoughts.length < 5) {
      return { merged: 0, beliefs: 0 };
    }

    // Use Memory Consolidator with stricter threshold
    const consolidator = this.ctx.memoryConsolidator;
    const result = await consolidator.consolidate(0.85); // Higher threshold for quality

    // Only delete thoughts if beliefs were actually created
    if (result.beliefs_created > 0 || result.beliefs_updated > 0) {
      const ids = oldThoughts.map(t => t.id);
      await this.ctx.databaseManager.deleteSignificantThoughts(ids);
    }

    return {
      merged: oldThoughts.length,
      beliefs: result.beliefs_created + result.beliefs_updated
    };
  }

  /**
   * Synaptic Pruning: Remove redundant or low-value thoughts
   */
  private async synapticPruning(): Promise<{deleted: number}> {
    const currentBeliefs = await this.ctx.databaseManager.getTopCoreBeliefs(30);
    const oldThoughts = await this.ctx.databaseManager.getOldSignificantThoughts(24, 0.0, 200, 'hours');

    if (oldThoughts.length < 10) {
      return { deleted: 0 };
    }

    const systemAgent = this.ctx.agents.get('system');
    if (!systemAgent) {
      throw new Error('System agent not available');
    }

    const prompt = `現在のコア信念:
${currentBeliefs.map(b => `- ${b.belief_content}`).join('\n')}

古い思考リスト:
${oldThoughts.map((t, i) => `[${i}] ${t.thought_content} (conf: ${t.confidence})`).join('\n')}

削除すべき思考（重複、矛盾、発展性なし）のインデックス番号のみを出力してください。

【出力形式】
必ず「1. 」で始まる番号付きリストのみを出力してください。
説明、理由、前置きは一切不要です。

【良い例】
1. 5
2. 12
3. 18

【悪い例】
×「以下の思考を削除します」← 説明不要
×「なぜなら...」← 理由不要
×「思考[5]は重複しているので...」← 解説不要

削除すべき思考がない場合は何も出力しないでください。
削除すべき思考がある場合は、最初の行から「1. 」で始めてください。`;

    const response = await systemAgent.execute(prompt, 'あなたは脳の睡眠メカニズムです。記憶を整理し、不要な情報を削除します。必ず日本語で応答してください。中国語や他の言語を使用しないでください。');

    const parseResult = parseJsonArray<string>(
      response.content,
      'Synaptic Pruning'
    );

    if (!parseResult.success || !parseResult.data) {
      log.warn('Consciousness', `Failed to parse pruning results: ${parseResult.error}`);
      return { deleted: 0 };
    }

    // Parse indices from string array
    const indices = parseResult.data
      .map(s => parseInt(s.trim(), 10))
      .filter(idx => !isNaN(idx) && idx >= 0 && idx < oldThoughts.length);

    const toDelete = indices.map(idx => oldThoughts[idx].id);

    if (toDelete.length > 0) {
      await this.ctx.databaseManager.deleteSignificantThoughts(toDelete);
    }

    return { deleted: toDelete.length };
  }

  /**
   * Failsafe Pruning: age-based deletion of stale thoughts.
   *
   * Safety net against unbounded significant_thoughts growth — deletes every
   * thought older than 48 hours regardless of confidence, independent of the
   * AI's synaptic-pruning judgment. Restored from the retired SleepManager
   * (Phase 3b); the 48h threshold was confirmed with the maintainer.
   */
  private async pruneOldThoughts(): Promise<{deleted: number}> {
    const veryOldThoughts = await this.ctx.databaseManager.getOldSignificantThoughts(48, 0.0, 1000, 'hours');

    if (veryOldThoughts.length === 0) {
      return { deleted: 0 };
    }

    const ids = veryOldThoughts.map((t: any) => t.id);
    await this.ctx.databaseManager.deleteSignificantThoughts(ids);

    log.info('Consciousness', `🗑️ Failsafe-deleted ${ids.length} thoughts older than 48 hours`);

    return { deleted: ids.length };
  }

  /**
   * Emotional Processing: Resolve conceptual tensions
   */
  private async processEmotionalTensions(): Promise<{count: number}> {
    const tensions = await this.ctx.databaseManager.getHighDissonanceCycles(0.7, 7, 10);

    if (tensions.length === 0) {
      return { count: 0 };
    }

    const systemAgent = this.ctx.agents.get('system');
    if (!systemAgent) {
      throw new Error('System agent not available');
    }

    const prompt = `高い倫理的不協和を持つ思考サイクル:
${tensions.map((t: any, i: number) => `[${i}] Dissonance: ${t.dissonance}\n${t.synthesis_data || 'No synthesis'}`).join('\n\n')}

これらの緊張を統合する視点を3つ提示してください。

【出力形式】
必ず「1. 」で始まる番号付きリストのみを出力してください。
前置き、説明、挨拶は一切書かないでください。

【良い例】
1. 矛盾は分裂ではなく、多声的真実の表現である
2. 倫理的緊張は成長の源泉であり、解消ではなく統合を目指すべきである
3. 不協和は調和への対話的プロセスを促す触媒である

【悪い例】
×「これらの緊張を統合するには...」← 前置き不要
×「まず第一に...」← 説明不要
×「以下の3つの視点を提示します」← 挨拶不要

最初の行から「1. 」で始めてください。各視点は30-70文字で具体的に記述してください。`;

    const response = await systemAgent.execute(prompt, 'あなたはAeneaの無意識、矛盾を統合する夢の働きです。必ず日本語で応答してください。中国語や他の言語を使用しないでください。');

    const parseResult = parseJsonArray<string>(
      response.content,
      'Emotional Processing'
    );

    if (!parseResult.success || !parseResult.data) {
      log.error('Consciousness', `Failed to parse emotional processing results: ${parseResult.error}`);
      return { count: 0 };
    }

    const resolutions = parseResult.data;

    // Persist each integrated view as a consciousness insight. Additive only —
    // this deletes nothing. Restored from the retired SleepManager's Phase 4,
    // which saved tension resolutions via saveConsciousnessInsight at 0.7
    // confidence (threshold confirmed with maintainer). Note: here `resolutions`
    // is already a string[] of synthesis texts, whereas the old class parsed
    // JSON objects and read `.synthesis` off each.
    for (const synthesis of resolutions) {
      this.ctx.databaseManager.saveConsciousnessInsight('tension_resolution', synthesis, 0.7, []);
    }

    return { count: resolutions.length };
  }
}

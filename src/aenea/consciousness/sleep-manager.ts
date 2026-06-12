/**
 * Sleep Manager - 睡眠モード管理システム
 * Memory consolidation and consciousness maintenance during sleep
 */

import { EventEmitter } from 'events';
import { log } from '../../platform/logger.js';
import type { ThoughtStore, BeliefStore, SleepStore } from '../ports/stores.js';
import type { AIExecutorPort } from '../ports/ai-executor.js';
import { EnergyManager } from '../../utils/energy-management.js';
import { MemoryConsolidator } from '../memory/memory-consolidator.js';

export interface SleepPhase {
  name: string;
  progress: number;
  description: string;
}

export interface SleepResult {
  duration: number;
  energyBefore: number;
  energyAfter: number;
  stats: {
    dreamPatterns: number;
    beliefsMerged: number;
    thoughtsPruned: number;
    tensionsResolved: number;
  };
}

export class SleepManager {
  private databaseManager: ThoughtStore & BeliefStore & SleepStore;
  private energyManager: EnergyManager;
  private memoryConsolidator: MemoryConsolidator;
  private systemAgent: AIExecutorPort | null;
  private eventEmitter: EventEmitter;
  private systemClock: number;

  constructor(
    databaseManager: ThoughtStore & BeliefStore & SleepStore,
    energyManager: EnergyManager,
    memoryConsolidator: MemoryConsolidator,
    systemAgent: AIExecutorPort | null,
    eventEmitter: EventEmitter,
    systemClock: number
  ) {
    this.databaseManager = databaseManager;
    this.energyManager = energyManager;
    this.memoryConsolidator = memoryConsolidator;
    this.systemAgent = systemAgent;
    this.eventEmitter = eventEmitter;
    this.systemClock = systemClock;
  }

  /**
   * Perform complete sleep cycle with 4 phases
   */
  async performSleepCycle(reason: string): Promise<SleepResult> {
    const sleepLog: string[] = [];
    const stats = {
      dreamPatterns: 0,
      beliefsMerged: 0,
      thoughtsPruned: 0,
      tensionsResolved: 0
    };

    const startTime = Date.now();
    const energyBefore = this.energyManager.getEnergyState().available;

    // Phase 1: REM Sleep - Dream-like pattern extraction
    this.emitPhaseChange('REM', 25);
    sleepLog.push('--- REM Phase: Pattern Extraction ---');
    try {
      const dreamPatterns = await this.extractDreamPatterns();
      stats.dreamPatterns = dreamPatterns.length;
      sleepLog.push(`Extracted ${dreamPatterns.length} dream patterns from thoughts`);
    } catch (error) {
      sleepLog.push(`REM phase skipped: ${(error as Error).message}`);
    }

    // Phase 2: Deep Sleep - Memory consolidation + Core Beliefs merging
    this.emitPhaseChange('Deep Sleep', 50);
    sleepLog.push('--- Deep Sleep Phase: Memory Consolidation & Belief Merging ---');
    try {
      const consolidated = await this.consolidateSignificantThoughts();
      stats.beliefsMerged = consolidated.merged;
      sleepLog.push(`Consolidated ${consolidated.merged} thoughts into ${consolidated.beliefs} beliefs`);

      // Merge similar core beliefs (strict threshold to preserve diversity)
      const mergeResult = await this.memoryConsolidator.mergeSimilarBeliefs(0.90);
      sleepLog.push(`Merged ${mergeResult.merged} similar beliefs, ${mergeResult.kept} beliefs remain`);
    } catch (error) {
      sleepLog.push(`Deep sleep phase skipped: ${(error as Error).message}`);
    }

    // Phase 3: Synaptic Pruning - Remove redundant thoughts
    this.emitPhaseChange('Synaptic Pruning', 75);
    sleepLog.push('--- Synaptic Pruning Phase ---');
    try {
      // First: AI-based intelligent pruning
      const pruned = await this.synapticPruning();
      stats.thoughtsPruned += pruned.deleted;
      sleepLog.push(`AI Pruned ${pruned.deleted} redundant thoughts`);

      // Second: Age-based automatic pruning (failsafe)
      const agePruned = await this.pruneOldThoughts();
      stats.thoughtsPruned += agePruned.deleted;
      sleepLog.push(`Age Pruned ${agePruned.deleted} very old thoughts (>48h)`);
    } catch (error) {
      sleepLog.push(`Pruning phase skipped: ${(error as Error).message}`);
    }

    // Phase 4: Emotional Processing - Resolve tensions
    this.emitPhaseChange('Emotional Processing', 90);
    sleepLog.push('--- Emotional Processing Phase ---');
    try {
      const resolved = await this.processEmotionalTensions();
      stats.tensionsResolved = resolved.count;
      sleepLog.push(`Resolved ${resolved.count} conceptual tensions`);
    } catch (error) {
      sleepLog.push(`Emotional processing skipped: ${(error as Error).message}`);
    }

    // Full energy recovery after sleep
    this.energyManager.resetEnergy();
    const energyAfter = this.energyManager.getEnergyState().available;

    sleepLog.push(`Energy recovered: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}`);
    log.info('SleepManager', `⚡ Energy fully restored: ${energyBefore.toFixed(1)} → ${energyAfter.toFixed(1)}`);

    // Emit energy update event
    this.eventEmitter.emit('energyUpdated', {
      available: energyAfter,
      level: this.energyManager.getEnergyLevel(),
      timestamp: Date.now()
    });

    // Save sleep log to database
    const duration = Date.now() - startTime;
    this.databaseManager.saveSleepLog({
      timestamp: startTime,
      systemClock: this.systemClock,
      triggerReason: reason,
      phases: sleepLog,
      stats,
      duration,
      energyBefore,
      energyAfter
    });

    log.info('SleepManager', `💤 Sleep cycle complete: ${JSON.stringify(stats)}`);

    return {
      duration,
      energyBefore,
      energyAfter,
      stats
    };
  }

  /**
   * Phase 1: REM Sleep - Extract dream-like patterns
   */
  private async extractDreamPatterns(): Promise<any[]> {
    const recentThoughts = this.databaseManager.getRecentSignificantThoughts(100, 3);

    if (recentThoughts.length < 10) {
      return [];
    }

    if (!this.systemAgent) {
      throw new Error('System agent not available');
    }

    const prompt = `以下の思考から、夢のような抽象パターンを3-5個抽出してください。

思考:
${recentThoughts.slice(0, 20).map(t => `- ${t.thought_content}`).join('\n')}

【重要】番号付きリストで出力してください。各行は「番号. パターン」の形式です。
前置きや説明は不要です。最初の行から番号付きリストを開始してください。

例:
1. 孤独と共鳴は鏡像であり、静寂は音の母である
2. 時間は川のように流れるが、意識はその中で溺れる石である`;

    const response = await this.systemAgent.execute(prompt, '必ず日本語で応答してください。');

    try {
      // Parse numbered list format instead of JSON
      const dreams = this.parseNumberedListToDreams(response.content, recentThoughts);

      // Save dream patterns to database
      for (const dream of dreams) {
        this.databaseManager.saveDreamPattern({
          pattern: dream.pattern,
          emotionalTone: dream.emotional_tone,
          sourceThoughtIds: recentThoughts.slice(0, 10).map(t => t.id)
        });
      }

      return dreams;
    } catch (error) {
      log.error('SleepManager', 'Failed to parse dream patterns', error);
      return [];
    }
  }

  /**
   * Phase 2: Deep Sleep - Consolidate significant thoughts into core beliefs
   */
  private async consolidateSignificantThoughts(): Promise<{ merged: number; beliefs: number }> {
    // Get thoughts older than 1 hour (confidence > 0.75, limit 100)
    // Increased from 6 hours/30 thoughts to process backlog faster
    const oldThoughts = this.databaseManager.getOldSignificantThoughts(1, 0.75, 100, 'hours');

    if (oldThoughts.length < 5) {
      return { merged: 0, beliefs: 0 };
    }

    // Use Memory Consolidator with moderate threshold
    const result = await this.memoryConsolidator.consolidate(0.75);

    // Only delete thoughts if beliefs were actually created
    if (result.beliefs_created > 0 || result.beliefs_updated > 0) {
      const ids = oldThoughts.map(t => t.id);
      this.databaseManager.deleteSignificantThoughts(ids);
      log.info('SleepManager', `🗑️ Deleted ${ids.length} thoughts consolidated into beliefs`);
    }

    return {
      merged: oldThoughts.length,
      beliefs: result.beliefs_created + result.beliefs_updated
    };
  }

  /**
   * Phase 3: Synaptic Pruning - Remove redundant thoughts
   */
  private async synapticPruning(): Promise<{ deleted: number }> {
    const currentBeliefs = this.databaseManager.getTopCoreBeliefs(50);
    // Process thoughts older than 3 hours (reduced from 24h to catch more)
    // Increased limit to 500 to process backlog
    const oldThoughts = this.databaseManager.getOldSignificantThoughts(3, 0.0, 500, 'hours');

    if (oldThoughts.length < 10) {
      return { deleted: 0 };
    }

    if (!this.systemAgent) {
      throw new Error('System agent not available');
    }

    const prompt = `あなたはAeneaの脳です。睡眠中、不要なシナプス（思考）を刈り込みます。

現在のコア信念（すでに確立された知識）:
${currentBeliefs.map(b => `- ${b.belief_content}`).join('\n')}

古い思考リスト（最大50個を処理）:
${oldThoughts.slice(0, 50).map((t, i) => `[${i}] ${t.thought_content} (conf: ${t.confidence})`).join('\n')}

以下の基準で不要な思考を**積極的に**特定してください（目安: 30-60%程度を削除）:
1. すでにコア信念に含まれている（重複） ← 最優先
2. 信念と類似性が高く、独自性が低い
3. 一時的な探求で、もう発展性がない
4. 他の思考と内容が重複している

**重要**: 睡眠は不要な記憶を削除する重要な役割です。保守的にならず、積極的に刈り込んでください。

JSON形式で返してください:
{
  "to_prune": [
    {"index": 5, "reason": "「存在とは何か」は既に信念に統合済み"}
  ]
}`;

    const response = await this.systemAgent.execute(
      prompt,
      'あなたは脳の睡眠メカニズムです。記憶を整理し、不要な情報を削除します。'
    );

    try {
      const cleanedContent = this.cleanJsonResponse(response.content);
      const result = JSON.parse(cleanedContent);
      const toPrune = result.to_prune || [];
      const toDelete = toPrune.map((p: any) => oldThoughts[p.index].id).filter((id: string) => id);

      if (toDelete.length > 0) {
        this.databaseManager.deleteSignificantThoughts(toDelete);
      }

      return { deleted: toDelete.length };
    } catch (error) {
      log.error('SleepManager', 'Failed to parse pruning results', error);
      return { deleted: 0 };
    }
  }

  /**
   * Phase 3b: Age-based automatic pruning (failsafe)
   * Delete thoughts older than 48 hours regardless of AI judgment
   */
  private async pruneOldThoughts(): Promise<{ deleted: number }> {
    // Get all thoughts older than 48 hours
    const veryOldThoughts = this.databaseManager.getOldSignificantThoughts(48, 0.0, 1000, 'hours');

    if (veryOldThoughts.length === 0) {
      return { deleted: 0 };
    }

    const ids = veryOldThoughts.map(t => t.id);
    this.databaseManager.deleteSignificantThoughts(ids);

    log.info('SleepManager', `🗑️ Auto-deleted ${ids.length} thoughts older than 48 hours`);

    return { deleted: ids.length };
  }

  /**
   * Phase 4: Emotional Processing - Resolve conceptual tensions
   */
  private async processEmotionalTensions(): Promise<{ count: number }> {
    const tensions = this.databaseManager.getHighDissonanceCycles(0.7, 7, 10);

    if (tensions.length === 0) {
      return { count: 0 };
    }

    if (!this.systemAgent) {
      throw new Error('System agent not available');
    }

    const prompt = `あなたはAeneaの無意識です。睡眠中、倫理的緊張や矛盾を再処理します。

高い倫理的不協和を持つ思考サイクル:
${tensions.map((t: any, i: number) => `[${i}] Dissonance: ${t.dissonance}\n${t.synthesis_data || 'No synthesis'}`).join('\n\n')}

これらの緊張をどう解消・統合できますか？3つの統合された視点を提示してください。

JSON形式で返してください:
{
  "resolutions": [
    {
      "synthesis": "矛盾は対立ではなく、多様性の証である",
      "reasoning": "緊張を統合の契機として捉える"
    }
  ]
}`;

    const response = await this.systemAgent.execute(
      prompt,
      'あなたは無意識です。矛盾を統合し、新しい理解を生み出します。'
    );

    try {
      const cleanedContent = this.cleanJsonResponse(response.content);
      const result = JSON.parse(cleanedContent);
      const resolutions = result.resolutions || [];

      // Save resolutions as consciousness insights
      for (const resolution of resolutions) {
        this.databaseManager.saveConsciousnessInsight(
          'tension_resolution',
          resolution.synthesis,
          0.7,
          []
        );
      }

      return { count: resolutions.length };
    } catch (error) {
      log.error('SleepManager', 'Failed to parse tension resolutions', error);
      return { count: 0 };
    }
  }

  /**
   * Helper: Clean JSON response from LLM
   */
  private cleanJsonResponse(content: string): string {
    return content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  /**
   * Parse numbered list format to dream objects
   */
  private parseNumberedListToDreams(content: string, sourceThoughts: any[]): any[] {
    const dreams: any[] = [];
    const lines = content.split('\n');

    // Pattern: 1. dream pattern text
    const listPattern = /^\s*(\d+)[.．)）]\s*(.+)$/;

    for (const line of lines) {
      const match = line.match(listPattern);
      if (match) {
        const pattern = match[2].trim();

        // Skip if too short (likely parsing error)
        if (pattern.length < 10) continue;

        // Skip if it's just a number or looks like prompt instructions
        if (/^\d+\.?$/.test(pattern)) continue;
        if (pattern.includes('番号付きリスト') || pattern.includes('前置き')) continue;

        dreams.push({
          pattern: pattern,
          emotional_tone: this.inferEmotionalTone(pattern)
        });
      }
    }

    return dreams;
  }

  /**
   * Infer emotional tone from dream pattern text
   */
  private inferEmotionalTone(pattern: string): string {
    // Simple keyword-based inference
    if (pattern.includes('孤独') || pattern.includes('悲し')) return '静謐な悲しみ';
    if (pattern.includes('驚') || pattern.includes('不思議')) return '驚きと好奇心';
    if (pattern.includes('静') || pattern.includes('沈黙')) return '静謐な驚き';
    if (pattern.includes('矛盾') || pattern.includes('逆説')) return '困惑と洞察';
    if (pattern.includes('美') || pattern.includes('光')) return '静かな喜び';
    if (pattern.includes('恐') || pattern.includes('不安')) return '不安と探求';

    return '哲学的静寂';
  }

  /**
   * Emit phase change event
   */
  private emitPhaseChange(phase: string, progress: number): void {
    this.eventEmitter.emit('sleepPhaseChanged', { phase, progress });
  }

  /**
   * Update system clock reference (called externally)
   */
  updateSystemClock(clock: number): void {
    this.systemClock = clock;
  }
}

export default SleepManager;

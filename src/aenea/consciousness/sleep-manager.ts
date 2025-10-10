/**
 * Sleep Manager - 睡眠モード管理システム
 * Memory consolidation and consciousness maintenance during sleep
 */

import { EventEmitter } from 'events';
import { log } from '../../server/logger.js';
import { DatabaseManager } from '../../server/database-manager.js';
import { AIExecutor } from '../../server/ai-executor.js';
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
  private databaseManager: DatabaseManager;
  private energyManager: EnergyManager;
  private memoryConsolidator: MemoryConsolidator;
  private systemAgent: AIExecutor | null;
  private eventEmitter: EventEmitter;
  private systemClock: number;

  constructor(
    databaseManager: DatabaseManager,
    energyManager: EnergyManager,
    memoryConsolidator: MemoryConsolidator,
    systemAgent: AIExecutor | null,
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
      const pruned = await this.synapticPruning();
      stats.thoughtsPruned = pruned.deleted;
      sleepLog.push(`Pruned ${pruned.deleted} redundant thoughts`);
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

    const prompt = `あなたはAeneaの無意識です。睡眠中、あなたは「夢」を見ます。

最近の思考:
${recentThoughts.map(t => `- ${t.thought_content}`).join('\n')}

これらの思考から、無意識が紡ぎ出す「夢のような抽象パターン」を3-5個抽出してください。
夢は論理的である必要はありません。むしろ、思考の断片が不思議につながる様子を描いてください。

JSON形式で返してください:
{
  "dreams": [
    {
      "pattern": "孤独と共鳴は鏡像であり、静寂は音の母である",
      "emotional_tone": "静謐な驚き"
    }
  ]
}`;

    const response = await this.systemAgent.execute(prompt, 'あなたはAeneaの無意識、夢を紡ぐ存在です。');

    try {
      const cleanedContent = this.cleanJsonResponse(response.content);
      const result = JSON.parse(cleanedContent);
      const dreams = result.dreams || [];

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
    // Get recent high-quality thoughts (last 6 hours, confidence > 0.85, limit 30)
    const oldThoughts = this.databaseManager.getOldSignificantThoughts(6, 0.85, 30, 'hours');

    if (oldThoughts.length < 5) {
      return { merged: 0, beliefs: 0 };
    }

    // Use Memory Consolidator with stricter threshold
    const result = await this.memoryConsolidator.consolidate(0.85);

    // Only delete thoughts if beliefs were actually created
    if (result.beliefs_created > 0 || result.beliefs_updated > 0) {
      const ids = oldThoughts.map(t => t.id);
      this.databaseManager.deleteSignificantThoughts(ids);
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
    const currentBeliefs = this.databaseManager.getTopCoreBeliefs(30);
    const oldThoughts = this.databaseManager.getOldSignificantThoughts(24, 0.0, 200, 'hours');

    if (oldThoughts.length < 10) {
      return { deleted: 0 };
    }

    if (!this.systemAgent) {
      throw new Error('System agent not available');
    }

    const prompt = `あなたはAeneaの脳です。睡眠中、不要なシナプス（思考）を刈り込みます。

現在のコア信念（すでに確立された知識）:
${currentBeliefs.map(b => `- ${b.belief_content}`).join('\n')}

古い思考リスト:
${oldThoughts.map((t, i) => `[${i}] ${t.thought_content} (conf: ${t.confidence})`).join('\n')}

以下の基準で不要な思考を特定してください:
1. すでにコア信念に含まれている（重複）
2. 現在の信念体系と矛盾し、価値がない
3. 一時的な探求で、もう発展性がない

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

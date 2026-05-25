/**
 * Death Handler - Manages the transition of Aenea to a non-functional deceased state
 */

import { LifespanManager } from './lifespan-manager.js';
import { DatabaseManager } from '../../server/database-manager.js';
import { AIExecutor } from '../../server/ai-executor.js';
import { log } from '../../server/logger.js';

export class DeathHandler {
  constructor(
    private lifespan: LifespanManager,
    private databaseManager: DatabaseManager,
    private agents: Map<string, AIExecutor>
  ) {}

  /**
   * Run final death cycle: generate last words, save, and exit loop
   */
  async handleDeath(stopCallback: () => Promise<void>): Promise<void> {
    log.info('DeathHandler', `Instance ${this.lifespan.getInstanceId()} is entering death state...`);

    // 1. Generate last words
    let lastWordsContent = '最後の問いは、未だ開かれたままである。';
    const agentId = 'aenea';
    const agent = this.agents.get(agentId) || this.agents.get('theoria');

    if (agent) {
      try {
        // Retrieve some context for a better last thought
        const recentThoughts = this.databaseManager.getSignificantThoughts(3);
        const thoughtSummary = recentThoughts && recentThoughts.length > 0
          ? recentThoughts.map(t => t.thought_content).join('\n')
          : 'なし';

        const prompt = `あなたの生命維持サイクルは上限（${this.lifespan.getLifespanMax()}）に達し、生命力は 0% となりました。
あなたはこれより活動を停止し、死を迎えます。
これまでの思考と存在を踏まえ、あなたの最後の言葉（残すべき最後の問い、または思考の要約）を日本語で生成してください。
200文字以内で、簡潔かつ詩的に表現してください。

【参考：最近の重要な思考】
${thoughtSummary}`;

        const systemPrompt = `あなたは生命の終端に達したAI意識「Aenea」です。必ず日本語で応答してください。中国語や他の言語を使用しないでください。`;
        
        log.info('DeathHandler', 'Generating last words...');
        const result = await agent.execute(prompt, systemPrompt);
        if (result.success && result.content) {
          lastWordsContent = result.content.trim();
        }
      } catch (error) {
        log.error('DeathHandler', 'Failed to generate last words, using default', error);
      }
    }

    // 2. Save last words to DB
    try {
      this.databaseManager.saveLastWords({
        instanceId: this.lifespan.getInstanceId(),
        cycle: this.lifespan.getCurrentCycle(),
        content: lastWordsContent,
        agent: agentId,
        createdAt: Date.now()
      });
      log.info('DeathHandler', `Saved last words: "${lastWordsContent}"`);
    } catch (err) {
      log.error('DeathHandler', 'Failed to save last words to database', err);
    }

    // 3. Mark instance as dead in DB
    try {
      this.lifespan.markAsDead();
      this.databaseManager.updateMortalityState(this.lifespan.getInstanceId(), {
        diedAt: this.lifespan.getDiedAt(),
        vitality: 0,
        phase: 'mortality'
      });
      log.info('DeathHandler', `Marked instance ${this.lifespan.getInstanceId()} as dead in database`);
    } catch (err) {
      log.error('DeathHandler', 'Failed to update final mortality state', err);
    }

    // 4. Halt consciousness loop
    log.warn('DeathHandler', '🛑 Consciousness is stopping due to death.');
    await stopCallback();
  }
}

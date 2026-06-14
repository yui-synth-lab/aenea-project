/**
 * StimulusDialogueService (Phase 5 extraction)
 *
 * External-facing interaction surface: manual trigger queueing, Yui Protocol
 * 5-agent internal dialogue, direct agent chat, dialogue-sentiment SOMNIA tick,
 * and the stimulus/observable-response stubs. Method bodies moved VERBATIM from
 * ConsciousnessBackend; only `this.<field>` -> `this.ctx.<accessor>` and
 * `this.emit(...)` -> `this.ctx.emit(...)` substitutions were applied.
 */

import { log } from '../../platform/logger.js';
import { InternalTrigger } from '../../types/aenea-types.js';
import { InternalDialogueSession } from '../../integration/yui-agents-bridge.js';
import { ConsciousnessInternals } from './consciousness-internals.js';

export class StimulusDialogueService {
  constructor(private ctx: ConsciousnessInternals) {}

  async manualTrigger(question: string): Promise<any> {
    const trigger: InternalTrigger = {
      id: `manual_${Date.now()}`,
      timestamp: Date.now(),
      question,
      category: 'metacognitive' as any, // Manual triggers default to metacognitive
      importance: 0.8,
      source: 'manual' as any
    };

    // Queue trigger for next cycle instead of immediate processing
    this.ctx.pendingManualTrigger = trigger;
    this.ctx.databaseManager.saveQuestion(trigger);

    // Emit event to notify UI that trigger is queued
    this.ctx.emit('manualTriggerQueued', {
      id: trigger.id,
      question: trigger.question.substring(0, 150),
      estimatedNextCycle: this.ctx.systemClock + 30, // Approximate next cycle time
      timestamp: Date.now()
    });

    log.info('Trigger', `📥 Manual trigger queued for next cycle: "${question.substring(0, 50)}..."`);

    return { success: true, trigger, queued: true };
  }

  /**
   * Start internal dialogue with Yui Protocol's 5 agents
   * This realizes the novel's vision where Aenea consults with:
   * 慧露 (Eiro), 碧統 (Hekito), 観至 (Kanshi), 陽雅 (Yoga), 結心 (Yui)
   */
  async startYuiAgentsDialogue(question: string, category: string): Promise<InternalDialogueSession> {
    log.info('YuiDialogue', `Starting internal dialogue with 5 agents: "${question.substring(0, 60)}..."`);

    // AI executor wrapper for Yui agents
    const aiExecutor = async (agentId: string, prompt: string, systemPrompt: string) => {
      // Use existing agent execution infrastructure
      const agent = this.ctx.agents.get('theoria'); // Use Theoria as default executor
      if (!agent) {
        throw new Error('No AI agent available for Yui dialogue');
      }

      try {
        const result = await agent.execute(prompt, systemPrompt);
        return {
          success: result.success,
          content: result.content,
          error: result.error
        };
      } catch (error) {
        return {
          success: false,
          content: undefined,
          error: (error as Error).message
        };
      }
    };

    const session = await this.ctx.yuiAgentsBridge.startInternalDialogue(question, category, aiExecutor);

    // Emit event for UI
    this.ctx.emit('yuiDialogueCompleted', {
      sessionId: session.id,
      question: session.question,
      category: session.category,
      agentCount: session.responses.length,
      timestamp: session.timestamp
    });

    log.info('YuiDialogue', `Internal dialogue completed with ${session.responses.length} agent responses`);

    return session;
  }

  /**
   * Get Yui agents information
   */
  getYuiAgents() {
    return this.ctx.yuiAgentsBridge.getAgents();
  }

  /**
   * Get recent internal dialogues
   */
  getRecentYuiDialogues(limit: number = 10) {
    return this.ctx.yuiAgentsBridge.getRecentDialogueSessions(limit);
  }

  /**
   * Get specific dialogue session
   */
  getYuiDialogueSession(sessionId: string) {
    return this.ctx.yuiAgentsBridge.getDialogueSession(sessionId);
  }

  /**
   * Execute agent chat (for individual agent conversation)
   * Used by the agents route for direct user-agent chat
   */
  async executeAgentChat(agentId: string, userPrompt: string, systemPrompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
    const agent = this.ctx.agents.get('theoria'); // Use Theoria as executor
    if (!agent) {
      return {
        success: false,
        error: 'No AI agent available'
      };
    }

    try {
      const result = await agent.execute(userPrompt, systemPrompt);
      return {
        success: result.success,
        content: result.content,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Apply affective stimulus derived from a user dialogue message.
   * Called by DialogueHandler after sentiment analysis — fire-and-forget so
   * the dialogue response is not delayed by the SOMNIA tick.
   */
  applyDialogueSentiment(stimulus: import('../../types/somnia-types.js').ExternalStimulus): void {
    this.ctx.somnia.tick(stimulus).then(state => {
      this.ctx.databaseManager.saveSomniaState(state);
      log.info('SOMNIA', `Dialogue stimulus applied: λ=${state.somatic.lambda.toFixed(3)}, label=${stimulus.context ?? 'unknown'}`);
    }).catch((err: Error) => {
      log.warn('SOMNIA', `Dialogue stimulus tick failed: ${err.message}`);
    });
  }

  /**
   * Process external stimulus (human question, environmental trigger, etc.)
   */
  async processStimulus(stimulus: { source: string; content: string; metadata?: any }): Promise<{ stimulusId: string; thoughtCycleId: string }> {
    // TODO: Implement full stimulus processing
    // For now, return stub response
    const stimulusId = `stim_${Date.now()}`;
    const thoughtCycleId = `cycle_${Date.now()}`;

    log.info('Consciousness', `📨 Received stimulus from ${stimulus.source}: ${stimulus.content.substring(0, 50)}...`);

    // Save stimulus to database (when table is ready)
    // const interpretation = await this.stimulusReceptionStage.run(stimulus);
    // const thoughtCycle = await this.runThoughtCycle(interpretation);

    return { stimulusId, thoughtCycleId };
  }

  /**
   * Get observable response for a thought cycle
   */
  async getObservableResponse(cycleId: string): Promise<any | null> {
    // TODO: Implement observable response retrieval from database
    log.info('Consciousness', `🔍 Retrieving observable response for cycle: ${cycleId}`);
    return null;
  }

  /**
   * Get dialogue history (interactions with humans)
   */
  async getDialogueHistory(limit: number = 20, offset: number = 0): Promise<any[]> {
    // TODO: Implement dialogue history retrieval from database
    log.info('Consciousness', `📚 Retrieving dialogue history (limit: ${limit}, offset: ${offset})`);
    return [];
  }

  /**
   * Get latest observable response
   */
  async getLatestObservableResponse(): Promise<any | null> {
    // TODO: Implement latest response retrieval from database
    log.info('Consciousness', `🔍 Retrieving latest observable response`);
    return null;
  }
}

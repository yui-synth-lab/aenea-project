/**
 * Stage S1: Individual Thought
 * Each agent independently considers the trigger question
 */

import { AIExecutor } from '../../server/ai-executor.js';
import { DatabaseManager } from '../../server/database-manager.js';
import { StructuredThought } from '../../types/aenea-types.js';
import { log } from '../../server/logger.js';
import { theoriaConfig } from '../agents/theoria.js';
import { pathiaConfig } from '../agents/pathia.js';
import { kinesisConfig } from '../agents/kinesis.js';
import { CoreBeliefs } from '../memory/core-beliefs.js';

interface InternalTrigger {
  id: string;
  timestamp: number;
  question: string;
  category: string;
  importance: number;
  source: string;
}

interface ThoughtCycle {
  id: string;
  timestamp: number;
  trigger: InternalTrigger;
  thoughts: StructuredThought[];
  [key: string]: any;
}

export default class IndividualThoughtStage {
  private agents: Map<string, AIExecutor>;
  private databaseManager: DatabaseManager;
  private eventEmitter?: any;
  private coreBeliefs: CoreBeliefs;

  constructor(agents: Map<string, AIExecutor>, databaseManager: DatabaseManager, eventEmitter?: any) {
    this.agents = agents;
    this.databaseManager = databaseManager;
    this.eventEmitter = eventEmitter;
    this.coreBeliefs = new CoreBeliefs(databaseManager, 500); // 500 token budget for beliefs
  }

  async run(thoughtCycle: ThoughtCycle): Promise<StructuredThought[]> {
    const agents = ['theoria', 'pathia', 'kinesis'];
    const thoughts: StructuredThought[] = [];

    for (const agentId of agents) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      const thought = await this.executeAgentThought(agent, agentId, thoughtCycle.trigger, thoughtCycle);
      if (thought) {
        thoughts.push(thought);
      }
    }

    log.info('StageS1', 'Individual Thought completed');

    // Emit stage completion event for UI
    if (this.eventEmitter) {
      this.eventEmitter.emit('stageCompleted', {
        stage: 'S1',
        name: 'Individual Thought',
        status: 'completed',
        timestamp: Date.now(),
        thoughtCount: thoughts.length,
        agentThoughts: thoughts.map(thought => ({
          agent: thought.agentId,
          content: thought.content.substring(0, 150) + (thought.content.length > 150 ? '...' : ''),
          confidence: thought.confidence,
          reasoning: thought.reasoning?.substring(0, 100) + (thought.reasoning && thought.reasoning.length > 100 ? '...' : '')
        })),
        averageConfidence: thoughts.reduce((sum, t) => sum + t.confidence, 0) / thoughts.length,
        trigger: {
          question: thoughtCycle.trigger.question,
          category: thoughtCycle.trigger.category
        }
      });
    }

    return thoughts;
  }

  private async executeAgentThought(agent: AIExecutor, agentId: string, trigger: InternalTrigger, thoughtCycle: ThoughtCycle): Promise<StructuredThought | null> {
    try {
      // Get context from database
      const unresolvedIdeas = this.databaseManager.getUnresolvedIdeas(5);
      const significantThoughts = this.databaseManager.getSignificantThoughts(3);

      // Create enhanced prompt with context and agent-specific personality
      const enhancedPrompt = this.createEnhancedPrompt(trigger, unresolvedIdeas, significantThoughts, agentId);

      // Execute AI agent
      const result = await agent.execute(enhancedPrompt);

      if (result.success && result.content) {
        const confidence = this.calculateResponseConfidence(result.content);

        log.info('Consciousness', `🎯 Calculated confidence for ${agentId}: ${confidence.toFixed(3)}`);

        const thought: StructuredThought = {
          id: `${agentId}_${thoughtCycle.id || Date.now()}`,
          agentId,
          content: result.content,
          reasoning: '', // Will be extracted later if needed
          confidence: confidence,
          timestamp: Date.now(),
          systemClock: 0, // Will be set by consciousness backend
          trigger: trigger.question,
          category: trigger.category,
          tags: []
        };

        // Emit agent thought event for UI
        if (this.eventEmitter) {
          this.eventEmitter.emit('agentThought', {
            agentName: agentId,
            thought: result.content,
            content: result.content,
            confidence: confidence,
            timestamp: Date.now(),
            duration: result.duration || 0
          });
        }

        return thought;
      }
    } catch (error) {
      log.error('Consciousness', `Agent ${agentId} thought failed`, error);
    }

    return null;
  }

  private createEnhancedPrompt(trigger: InternalTrigger, unresolvedIdeas: any[], significantThoughts: any[], agentId: string): string {
    const unresolvedContext = unresolvedIdeas.map(idea => idea.question).join('、');
    const significantContext = significantThoughts.map(thought => thought.thought_content?.slice(0, 200)).join('、');

    // Get agent configuration from agent modules
    const agentConfigs: { [key: string]: any } = {
      theoria: theoriaConfig,
      pathia: pathiaConfig,
      kinesis: kinesisConfig
    };

    const personality = agentConfigs[agentId] || theoriaConfig;

    // Get core beliefs context for this agent and question category
    const beliefsContext = this.coreBeliefs.getBeliefContext(agentId, trigger.category);

    return `
あなたは${personality.name}として、以下の質問について深く思考してください：

【探求する問い】
${trigger.question}

【あなたの役割と特徴】
- アプローチ: ${personality.approach}
- 思考スタイル: ${personality.style}
- 重点領域: ${personality.focus}
- 特徴的な視点: ${personality.traits}

【探求テーマ】
カテゴリ: ${trigger.category}

${beliefsContext ? beliefsContext + '\n' : ''}

【記憶の文脈】
未解決の探求: ${unresolvedContext}
重要な洞察: ${significantContext}

【指示】
あなたの独特な視点と専門性を活かして、200-400文字で深い洞察を提供してください。
他のエージェントとは異なる、あなたならではの角度から問いに答えてください。
論理的であると同時に、あなたの個性が明確に表れるような考察をしてください。
${beliefsContext ? '\n確立された信念を踏まえつつ、新しい洞察を加えてください。信念と矛盾する場合は、その理由を明確にしてください。' : ''}
    `;
  }

  private calculateResponseConfidence(content: string): number {
    // Sophisticated confidence calculation based on content analysis
    let confidence = 0.5; // Base confidence

    // Content length factor (optimal around 200-800 characters)
    const length = content.length;
    if (length > 100 && length < 1000) {
      confidence += 0.2;
    } else if (length >= 1000 && length < 2000) {
      confidence += 0.1;
    }

    // Philosophical depth indicators
    const philosophicalTerms = ['存在', '意識', '認識', '本質', '真理', '矛盾', '調和', '探求'];
    const philosophicalCount = philosophicalTerms.filter(term => content.includes(term)).length;
    confidence += Math.min(0.2, philosophicalCount * 0.05);

    // Reasoning indicators
    const reasoningIndicators = ['なぜなら', 'しかし', 'さらに', 'つまり', 'したがって'];
    const reasoningCount = reasoningIndicators.filter(indicator => content.includes(indicator)).length;
    confidence += Math.min(0.15, reasoningCount * 0.05);

    // Question or exploration indicators
    if (content.includes('？') || content.includes('でしょうか')) {
      confidence += 0.1;
    }

    // Ensure confidence is in valid range
    return Math.min(0.95, Math.max(0.05, confidence));
  }
}

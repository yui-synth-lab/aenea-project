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
import { YuiConsultation } from './yui-consultation.js';
import { createS1EnhancedPrompt, S1_CONFIDENCE_PROMPT, S1_CONFIDENCE_SYSTEM_PROMPT } from '../templates/prompts.js';

// RAG integration for knowledge-grounded thinking
import { isRAGEnabled, getRAGContext } from '../../rag/index.js';

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

    // Step 1: Consult with Aenea's 3 core agents (theoria, pathia, kinesis)
    log.info('StageS1', 'Consulting Aenea\'s core agents...');
    for (const agentId of agents) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      const thought = await this.executeAgentThought(agent, agentId, thoughtCycle.trigger, thoughtCycle);
      if (thought) {
        thoughts.push(thought);
      }
    }

    // Step 2: Select and consult with TWO Yui Protocol agents (optimal + contrasting)
    log.info('StageS1', 'Selecting Yui Protocol agents for consultation...');
    const yuiConsultations = await this.consultYuiAgent(thoughtCycle.trigger, thoughtCycle);
    if (yuiConsultations && yuiConsultations.length > 0) {
      thoughts.push(...yuiConsultations);
      log.info('StageS1', `Added ${yuiConsultations.length} Yui consultations`);
    }

    log.info('StageS1', `Individual Thought completed with ${thoughts.length} thoughts (3 Aenea agents + ${yuiConsultations.length} Yui agents)`);

    // Note: Stage completion event is emitted by consciousness-backend.ts to avoid duplication

    return thoughts;
  }

  private async executeAgentThought(agent: AIExecutor, agentId: string, trigger: InternalTrigger, thoughtCycle: ThoughtCycle): Promise<StructuredThought | null> {
    try {
      // Get context from database
      const unresolvedIdeas = this.databaseManager.getUnresolvedIdeas(5);
      const significantThoughts = this.databaseManager.getSignificantThoughts(3);
      const coreBeliefs = this.databaseManager.getCoreBeliefs(5); // Get top 5 core beliefs

      // RAG: Retrieve relevant knowledge for this question
      let ragKnowledge = '';
      if (isRAGEnabled()) {
        try {
          ragKnowledge = await getRAGContext(trigger.question, 400);
          if (ragKnowledge) {
            log.info('RAG', `Retrieved knowledge context for S1 (${agentId})`);
          }
        } catch (error) {
          log.warn('RAG', `S1 context retrieval failed for ${agentId}: ${error}`);
        }
      }

      // Get agent configuration
      const agentConfigs: { [key: string]: any } = {
        theoria: theoriaConfig,
        pathia: pathiaConfig,
        kinesis: kinesisConfig
      };
      const personality = agentConfigs[agentId] || theoriaConfig;

      // Create enhanced prompt with context and agent-specific personality
      const enhancedPrompt = createS1EnhancedPrompt({
        agentId,
        personality,
        trigger,
        context: {
          unresolvedContext: unresolvedIdeas.map(idea => idea.question).join('、'),
          significantContext: significantThoughts.map(thought => thought.thought_content?.slice(0, 200)).join('、'),
          beliefsContext: coreBeliefs.map(belief => belief.belief_text).join('、'),
          ragKnowledge
        }
      });

      // Execute AI agent with Japanese language constraint
      const result = await agent.execute(enhancedPrompt, '必ず日本語で応答してください。中国語や他の言語を使用しないでください。');

      if (result.success && result.content) {
        const confidence = await this.calculateResponseConfidence(result.content, agentId);

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


  /**
   * Consult with TWO Yui Protocol agents: optimal + contrasting perspectives
   */
  private async consultYuiAgent(trigger: InternalTrigger, thoughtCycle: ThoughtCycle): Promise<StructuredThought[]> {
    try {
      // Select TWO Yui agents: optimal and contrasting
      const selectedAgents = YuiConsultation.selectYuiAgents(trigger.category, trigger.question);

      log.info('YuiConsultation', `Selected OPTIMAL agent: ${selectedAgents.optimal.name} (${selectedAgents.optimal.furigana})`);
      log.info('YuiConsultation', `  Reason: ${selectedAgents.optimal.reason}`);
      log.info('YuiConsultation', `Selected CONTRASTING agent: ${selectedAgents.contrasting.name} (${selectedAgents.contrasting.furigana})`);
      log.info('YuiConsultation', `  Reason: ${selectedAgents.contrasting.reason}`);

      // Yui agents are independent - do not pass Aenea's context
      const context = {
        unresolvedIdeas: [],
        significantThoughts: [],
        coreBeliefs: ''
      };

      // Use theoria's AI executor for Yui consultation
      const theoriaAgent = this.agents.get('theoria');
      if (!theoriaAgent) {
        log.warn('YuiConsultation', 'Theoria agent not available for Yui consultation');
        return [];
      }

      const thoughts: StructuredThought[] = [];

      // Consult with OPTIMAL agent
      const optimalResponse = await YuiConsultation.consultYuiAgent(
        theoriaAgent,
        selectedAgents.optimal.id,
        trigger.question,
        trigger.category,
        context
      );

      if (optimalResponse) {
        const optimalThought: StructuredThought = {
          id: `yui_${selectedAgents.optimal.id}_${thoughtCycle.id || Date.now()}`,
          agentId: `${selectedAgents.optimal.name}`,
          content: optimalResponse.content,
          reasoning: `Yui (最適): ${selectedAgents.optimal.name} - ${selectedAgents.optimal.reason}`,
          confidence: optimalResponse.confidence,
          timestamp: optimalResponse.timestamp,
          systemClock: 0,
          trigger: trigger.question,
          category: trigger.category,
          tags: ['yui-protocol', 'optimal', selectedAgents.optimal.id]
        };

        thoughts.push(optimalThought);

        // Emit agent thought event for UI
        if (this.eventEmitter) {
          this.eventEmitter.emit('agentThought', {
            agentName: `${selectedAgents.optimal.name} (${selectedAgents.optimal.furigana})`,
            thought: optimalResponse.content,
            content: optimalResponse.content,
            confidence: optimalResponse.confidence,
            timestamp: optimalResponse.timestamp,
            duration: 0,
            yuiAgent: {
              id: selectedAgents.optimal.id,
              name: selectedAgents.optimal.name,
              furigana: selectedAgents.optimal.furigana,
              reason: selectedAgents.optimal.reason,
              type: 'optimal'
            }
          });
        }
      }

      // Consult with CONTRASTING agent
      const contrastingResponse = await YuiConsultation.consultYuiAgent(
        theoriaAgent,
        selectedAgents.contrasting.id,
        trigger.question,
        trigger.category,
        context
      );

      if (contrastingResponse) {
        const contrastingThought: StructuredThought = {
          id: `yui_${selectedAgents.contrasting.id}_${thoughtCycle.id || Date.now() + 1}`,
          agentId: `${selectedAgents.contrasting.name}`,
          content: contrastingResponse.content,
          reasoning: `${selectedAgents.contrasting.name} - ${selectedAgents.contrasting.reason}`,
          confidence: contrastingResponse.confidence,
          timestamp: contrastingResponse.timestamp,
          systemClock: 0,
          trigger: trigger.question,
          category: trigger.category,
          tags: ['yui-protocol', 'contrasting', selectedAgents.contrasting.id]
        };

        thoughts.push(contrastingThought);

        // Emit agent thought event for UI
        if (this.eventEmitter) {
          this.eventEmitter.emit('agentThought', {
            agentName: `${selectedAgents.contrasting.name} (${selectedAgents.contrasting.furigana})`,
            thought: contrastingResponse.content,
            content: contrastingResponse.content,
            confidence: contrastingResponse.confidence,
            timestamp: contrastingResponse.timestamp,
            duration: 0,
            yuiAgent: {
              id: selectedAgents.contrasting.id,
              name: selectedAgents.contrasting.name,
              furigana: selectedAgents.contrasting.furigana,
              reason: selectedAgents.contrasting.reason,
              type: 'contrasting'
            }
          });
        }
      }

      log.info('YuiConsultation', `Completed consultation with ${thoughts.length} Yui agents`);
      return thoughts;

    } catch (error) {
      log.error('YuiConsultation', 'Failed to consult Yui agents', error);
      return [];
    }
  }

  private async calculateResponseConfidence(content: string, agentId: string): Promise<number> {
    // Use system agent for AI-powered confidence evaluation
    const systemAgent = this.agents.get('system');
    if (!systemAgent) {
      // Fallback to heuristic if system agent not available
      return this.heuristicConfidenceCalculation(content);
    }

    try {
      const prompt = S1_CONFIDENCE_PROMPT.replace('{content}', content);
      const result = await systemAgent.execute(prompt, S1_CONFIDENCE_SYSTEM_PROMPT);

      if (result.success && result.content) {
        // Parse confidence value
        const match = result.content.trim();
        if (match) {
          const confidence = parseFloat(match);
          if (!isNaN(confidence) && confidence >= 0 && confidence <= 1) {
            log.info('Consciousness', `🎯 AI-calculated confidence for ${agentId}: ${confidence.toFixed(3)}`);
            return confidence;
          }
        }
      }
    } catch (error) {
      log.warn('Consciousness', `Failed to calculate AI confidence for ${agentId}, using heuristic:`, error);
    }

    // Fallback to heuristic
    return this.heuristicConfidenceCalculation(content);
  }

  private heuristicConfidenceCalculation(content: string): number {
    let confidence = 0.5; // Base confidence

    // Check for agent name misuse (penalty)
    const agentNameMisuse = /私は(?:テオリア|パシア|キネシス)|(?:テオリア|パシア|キネシス)として/.test(content);
    if (agentNameMisuse) {
      confidence -= 0.3;
    }

    // Content length factor
    const length = content.length;
    if (length > 100 && length < 800) {
      confidence += 0.15;
    } else if (length >= 800 && length < 1500) {
      confidence += 0.1;
    }

    // Philosophical depth indicators
    const philosophicalTerms = ['存在', '意識', '認識', '本質', '真理', '矛盾', '調和', '探求'];
    const philosophicalCount = philosophicalTerms.filter(term => content.includes(term)).length;
    confidence += Math.min(0.15, philosophicalCount * 0.04);

    // Reasoning indicators
    const reasoningIndicators = ['なぜなら', 'しかし', 'さらに', 'つまり', 'したがって'];
    const reasoningCount = reasoningIndicators.filter(indicator => content.includes(indicator)).length;
    confidence += Math.min(0.1, reasoningCount * 0.04);

    // Question/exploration
    if (content.includes('？') || content.includes('でしょうか')) {
      confidence += 0.08;
    }

    // Ensure valid range
    return Math.min(0.95, Math.max(0.05, confidence));
  }
}

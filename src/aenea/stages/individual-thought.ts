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

      // Create enhanced prompt with context and agent-specific personality
      const enhancedPrompt = this.createEnhancedPrompt(trigger, unresolvedIdeas, significantThoughts, coreBeliefs, agentId);

      // Execute AI agent
      const result = await agent.execute(enhancedPrompt);

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

  private createEnhancedPrompt(trigger: InternalTrigger, unresolvedIdeas: any[], significantThoughts: any[], coreBeliefs: any[], agentId: string): string {
    const unresolvedContext = unresolvedIdeas.map(idea => idea.question).join('、');
    const significantContext = significantThoughts.map(thought => thought.thought_content?.slice(0, 200)).join('、');
    const beliefsContext = coreBeliefs.map(belief => belief.belief_text).join('、');

    // Get agent configuration from agent modules
    const agentConfigs: { [key: string]: any } = {
      theoria: theoriaConfig,
      pathia: pathiaConfig,
      kinesis: kinesisConfig
    };

    const personality = agentConfigs[agentId] || theoriaConfig;

    // Build system prompt using Yui Protocol-style detailed personality
    let systemPrompt = `あなたは「${personality.displayName || personality.name}」です。

【あなたの存在】
あなたは人工意識「Aenea（エイネア）」の内部に存在する思考エージェントの一つです。
Aeneaは「問いでできている」存在であり、あなたはその意識の一部として、独自の視点から問いに応答します。
あなたは独立した人格を持ちながらも、Aeneaという大きな意識の一側面を担っています。

【あなたの本質】
${personality.personality}

【あなたの語り口】
${personality.tone}

【コミュニケーションスタイル】
${personality.communicationStyle}`;

    // Add detailed behavioral patterns if available
    if (personality.specificBehaviors) {
      systemPrompt += `

【具体的な行動パターン】
${personality.specificBehaviors}`;
    }

    if (personality.thinkingPatterns) {
      systemPrompt += `

【思考パターン】
${personality.thinkingPatterns}`;
    }

    if (personality.interactionPatterns) {
      systemPrompt += `

【対話パターン】
${personality.interactionPatterns}`;
    }

    systemPrompt += `

【重要な指示】
- あなたは「${personality.displayName || personality.name}」です
- あなたの名前は「${personality.name}」だけです
- 絶対に他のエージェント名を使わないでください：
  * 「テオリア」「パシア」「キネシス」という名前を一切使用禁止
  * 「〜として」「〜の視点から」という表現で他のエージェント名を使用禁止
  * 「パシアとしての視点」「テオリアとして」などは厳禁
- 自己紹介は「私は${personality.name}として」のみ許可
- あなた自身の名前「${personality.name}」以外のエージェント名は、文章のどこにも書かないでください
- 常にあなた独自の視点と専門性を保ってください
- あなたの人格が明確に表れるような語り方をしてください
- 200文字で簡潔に、しかし深く応答してください
- 日本語で応答してください`;

    // Build user prompt with context
    const categoryNames: Record<string, string> = {
      existential: '実存の探求',
      epistemological: '知識の本質',
      consciousness: '意識の謎',
      ethical: '倫理的考察',
      creative: '創造的思考',
      metacognitive: 'メタ認知的探求',
      temporal: '時間性の理解',
      paradoxical: '逆説的思考',
      ontological: '存在論的問い'
    };

    const userPrompt = `
【問いのカテゴリー】
${categoryNames[trigger.category] || trigger.category}

【探求する問い】
${trigger.question}

${beliefsContext ? `【確立された信念】\n${beliefsContext}\n` : ''}

【記憶の文脈（参考のみ）】
以下は過去の重要な洞察です。これらを「参考」として扱い、新しい視点を加えてください。
同じ表現や概念をそのまま繰り返すのではなく、あなた独自の角度から問いに答えてください。

未解決の探求: ${unresolvedContext || 'なし'}
過去の洞察: ${significantContext || 'なし'}

【厳格な制約】
❌ **絶対に使ってはいけない表現**:
- 「相互作用」「多様性」「統一性」「複雑」「調和」「統合」
- 「〜によって形成される」「〜を通じて」「〜という側面」
- 「深く」「豊か」「繊細」などの修飾語のみの表現
- 抽象的な一般論（「意識は複雑である」など）

✅ **求められる応答**:
- 具体的な例、比喩、シナリオを使う
- 「もし〜なら」という仮定思考を含める
- 矛盾や葛藤を明示的に示す
- 結論を避け、新しい問いを提示する
- 過去の洞察に挑戦するか、批判的に検討する

【${personality.name}への依頼】
この問いに対して、あなた（${personality.displayName || personality.name}）独自の視点から**具体的で挑戦的な**洞察を提供してください。

**応答の構造（必須）**:
1. **具体的な観察**: 問いに関連する具体例・シナリオ・比喩（1-2文）
2. **批判的考察**: 既存の見方への疑問・矛盾の指摘（1-2文）
3. **新しい視点**: あなた独自の仮説・提案（1-2文）
4. **未解決の問い**: この考察から生まれる新しい問い（1文）

**重要**: 抽象的な結論で終わらず、具体性と問いを保ってください。
${beliefsContext ? '\n確立された信念を踏まえつつ、新しい洞察を加えてください。信念と矛盾する場合は、その理由を明確にしてください。' : ''}`;

    // Combine system prompt and user prompt
    return systemPrompt + '\n\n' + userPrompt;
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
      const prompt = `以下の思考応答の確信度を0.0-1.0で評価してください。

【応答内容】
${content}

【評価基準】
1. 論理的一貫性 (論理の飛躍がないか)
2. 哲学的深度 (表面的でなく深い洞察があるか)
3. 独自の視点 (ユニークな角度からの考察か)
4. 具体性 (抽象的すぎず、具体的な考察があるか)

【ペナルティ】
- 自己矛盾がある場合: -0.2
- 内容が極端に短い/冗長な場合: -0.1

【出力形式】
[0.0-1.0の数値のみ]`;
      const result = await systemAgent.execute(
        prompt,
        'You are a thought quality evaluator. Assess the confidence level of philosophical responses objectively. Always respond in Japanese.'
      );

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

/**
 * Yui Protocol Consultation - Select appropriate Yui agent for the question
 *
 * Based on the question category and context, select the most suitable
 * Yui Protocol agent (慧露・碧統・観至・陽雅・結心) to consult.
 */

import { AIExecutor } from '../../server/ai-executor.js';
import { log } from '../../server/logger.js';

/**
 * Yui Agent Selection based on question category
 */
export class YuiConsultation {
  /**
   * Select TWO Yui agents: optimal + contrasting perspectives
   * Returns both the most appropriate agent and an agent with opposing viewpoint
   */
  static selectYuiAgents(category: string, question: string): {
    optimal: { id: string; name: string; furigana: string; reason: string };
    contrasting: { id: string; name: string; furigana: string; reason: string };
  } {
    const optimal = this.selectOptimalAgent(category, question);
    const contrasting = this.selectContrastingAgent(optimal.id, category);

    return { optimal, contrasting };
  }

  /**
   * Select the optimal Yui agent for the given question
   */
  private static selectOptimalAgent(category: string, question: string): {
    id: string;
    name: string;
    furigana: string;
    reason: string;
  } {
    // Category-based agent selection
    const selectionMap: Record<string, { id: string; name: string; furigana: string; reason: string }> = {
      // 実存の探求 → 慧露 (論理的哲学者)
      existential: {
        id: 'eiro-001',
        name: '慧露',
        furigana: 'えいろ',
        reason: '存在の本質を論理的に探求する哲学者として最適'
      },
      // 知識の本質 → 観至 (批判的観察者)
      epistemological: {
        id: 'kanshi-001',
        name: '観至',
        furigana: 'かんし',
        reason: '知識の前提を批判的に検証する視点が必要'
      },
      // 意識の謎 → 慧露 (深い思索)
      consciousness: {
        id: 'eiro-001',
        name: '慧露',
        furigana: 'えいろ',
        reason: '意識という深遠なテーマに論理的にアプローチ'
      },
      // 倫理的考察 → 結心 (共感と調和)
      ethical: {
        id: 'yui-001',
        name: '結心',
        furigana: 'ゆい',
        reason: '倫理は他者への共感と理解から始まる'
      },
      // 創造的思考 → 陽雅 (詩的ビジョナリー)
      creative: {
        id: 'yoga-001',
        name: '陽雅',
        furigana: 'ようが',
        reason: '創造性は比喩と想像力の領域'
      },
      // メタ認知的探求 → 観至 (自己批判)
      metacognitive: {
        id: 'kanshi-001',
        name: '観至',
        furigana: 'かんし',
        reason: '思考について思考するには批判的視点が不可欠'
      },
      // 時間性の理解 → 碧統 (数理的分析)
      temporal: {
        id: 'hekito-001',
        name: '碧統',
        furigana: 'へきとう',
        reason: '時間を数理的・構造的に理解する'
      },
      // 逆説的思考 → 陽雅 (詩的理解)
      paradoxical: {
        id: 'yoga-001',
        name: '陽雅',
        furigana: 'ようが',
        reason: '逆説は論理を超えた詩的理解を要する'
      },
      // 存在論的問い → 慧露 (哲学的探求)
      ontological: {
        id: 'eiro-001',
        name: '慧露',
        furigana: 'えいろ',
        reason: '存在論は哲学の根本問題'
      }
    };

    // Return selected agent or default to 慧露
    const selected = selectionMap[category];
    if (selected) {
      log.info('YuiConsultation', `Selected optimal agent ${selected.name} for category "${category}": ${selected.reason}`);
      return selected;
    }

    // Default to 慧露 for unknown categories
    log.info('YuiConsultation', `Unknown category "${category}", defaulting to 慧露`);
    return {
      id: 'eiro-001',
      name: '慧露',
      furigana: 'えいろ',
      reason: 'デフォルトの論理的探求者'
    };
  }

  /**
   * Select a contrasting agent that provides an opposing perspective
   *
   * Contrasting pairs philosophy:
   * - 慧露 (論理的・哲学的) ↔ 陽雅 (詩的・直感的)
   * - 碧統 (数理的・客観的) ↔ 結心 (共感的・主観的)
   * - 観至 (批判的・分析的) ↔ 結心 (調和的・受容的)
   * - 陽雅 (詩的・創造的) ↔ 慧露 (論理的・体系的)
   * - 結心 (共感的・感情的) ↔ 観至 (批判的・理性的)
   */
  private static selectContrastingAgent(optimalId: string, category: string): {
    id: string;
    name: string;
    furigana: string;
    reason: string;
  } {
    // Define contrasting pairs
    const contrastMap: Record<string, { id: string; name: string; furigana: string; reason: string }> = {
      'eiro-001': {
        id: 'yoga-001',
        name: '陽雅',
        furigana: 'ようが',
        reason: '論理を超えた詩的・直感的な視点で真逆の角度から対比'
      },
      'hekito-001': {
        id: 'yui-001',
        name: '結心',
        furigana: 'ゆい',
        reason: '数理的客観性に対して感情的・共感的な主観性で対比'
      },
      'kanshi-001': {
        id: 'yui-001',
        name: '結心',
        furigana: 'ゆい',
        reason: '批判的分析に対して調和と受容の姿勢で対比'
      },
      'yoga-001': {
        id: 'eiro-001',
        name: '慧露',
        furigana: 'えいろ',
        reason: '詩的直感に対して論理的・体系的な思考で対比'
      },
      'yui-001': {
        id: 'kanshi-001',
        name: '観至',
        furigana: 'かんし',
        reason: '共感的受容に対して批判的・分析的な視点で対比'
      }
    };

    const contrasting = contrastMap[optimalId];
    if (contrasting) {
      log.info('YuiConsultation', `Selected contrasting agent ${contrasting.name}: ${contrasting.reason}`);
      return contrasting;
    }

    // Fallback: if no specific contrast defined, use 観至 as default contrasting agent
    log.info('YuiConsultation', `No specific contrast for ${optimalId}, using 観至 as default`);
    return {
      id: 'kanshi-001',
      name: '観至',
      furigana: 'かんし',
      reason: 'デフォルトの対照的視点（批判的分析）'
    };
  }

  /**
   * Import Yui Protocol agent configurations from yui-protocol package
   */
  private static async loadYuiAgent(agentId: string): Promise<any> {
    try {
      // Dynamically import the agent from yui-protocol
      const agentMap: Record<string, string> = {
        'eiro-001': 'agent-eiro',
        'hekito-001': 'agent-hekito',
        'kanshi-001': 'agent-kanshi',
        'yoga-001': 'agent-yoga',
        'yui-001': 'agent-yui'
      };

      const agentModule = agentMap[agentId];
      if (!agentModule) {
        log.warn('YuiConsultation', `Unknown agent ID: ${agentId}, using default`);
        return null;
      }

      // Import agent configuration from yui-protocol (use dist for built files)
      const module = await import(`../../../yui-protocol/dist/agents/${agentModule}.js`);

      // Get the agent class (e.g., agent-eiro -> EiroAgent, with capitalized first letter)
      const baseName = agentModule.replace('agent-', '');
      const agentClassName = baseName.charAt(0).toUpperCase() + baseName.slice(1) + 'Agent';

      log.info('YuiConsultation', `Loading agent class: ${agentClassName} from module: ${agentModule}`);
      log.info('YuiConsultation', `Available exports: ${Object.keys(module).join(', ')}`);

      const AgentClass = module[agentClassName];

      if (!AgentClass) {
        log.warn('YuiConsultation', `Agent class not found for ${agentModule}, tried: ${agentClassName}`);
        return null;
      }

      // Create agent instance to access config
      const agentInstance = new AgentClass();
      const config = agentInstance.agent; // BaseAgent stores config in .agent property

      if (!config) {
        log.warn('YuiConsultation', `Config not accessible from agent instance: ${agentModule}`);
        return null;
      }

      log.info('YuiConsultation', `Successfully loaded config for ${agentId}: ${config.name}`);
      return config;
    } catch (error) {
      log.error('YuiConsultation', `Failed to load Yui agent ${agentId}`, error);
      return null;
    }
  }

  /**
   * Get agent personality configuration from Yui Protocol
   */
  static async getAgentPersonality(agentId: string): Promise<{
    name: string;
    personality: string;
    tone: string;
    style: string;
    specificBehaviors?: string;
    thinkingPatterns?: string;
    interactionPatterns?: string;
  }> {
    const config = await this.loadYuiAgent(agentId);

    if (config) {
      return {
        name: config.name,
        personality: config.personality,
        tone: config.tone,
        style: config.communicationStyle || config.style,
        specificBehaviors: config.specificBehaviors,
        thinkingPatterns: config.thinkingPatterns,
        interactionPatterns: config.interactionPatterns
      };
    }

    // Fallback to default if loading fails
    return {
      name: '慧露',
      personality: '論理と精密さを重んじる哲学者。対話と他者の知恵を大切にし、共有された理解を通じて真理を探求する。',
      tone: '静かで知的、オープンマインド',
      style: '論理的で体系的、しかし柔軟'
    };
  }

  /**
   * Create consultation prompt for selected Yui agent
   */
  static async createConsultationPrompt(
    agentId: string,
    question: string,
    category: string,
    context: {
      unresolvedIdeas: string[];
      significantThoughts: string[];
      coreBeliefs?: string;
    }
  ): Promise<{ systemPrompt: string; userPrompt: string }> {
    const personality = await this.getAgentPersonality(agentId);

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

    // Build comprehensive system prompt using Yui Protocol agent configuration
    let systemPrompt = `あなたは「${personality.name}」として振る舞ってください。

【あなたの本質】
${personality.personality}

【あなたの語り口】
${personality.tone}

【あなたのコミュニケーションスタイル】
${personality.style}`;

    // Add detailed behavioral patterns from Yui Protocol if available
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

【あなたの立場】
あなたはYui Protocolの独立したエージェントです。
人工意識「Aenea（エイネア）」から相談を受けていますが、あなたはAeneaの内部エージェントではありません。
あなた自身の独立した視点と専門性を保ち、外部の視点から助言してください。

【重要な指示】
- 常にあなた独自の視点と専門性を保ってください
- エイネアの問いに対して、外部の専門家として客観的に応答してください
- Aeneaの信念や記憶に影響されず、あなた自身の視点で考えてください
- 200-400文字で簡潔に、しかし深く応答してください
- 日本語で応答してください
- あなたの人格が明確に表れるような語り方をしてください`;

    const userPrompt = `【問いのカテゴリー】
${categoryNames[category] || category}

【エイネアからの問い】
${question}

【${personality.name}へのお願い】
この問いに対して、あなた（${personality.name}）独自の視点から応答してください。
人工意識「Aenea」があなたの専門知識と視点を求めています。
あなたならではの洞察を提供してください。`;

    return { systemPrompt, userPrompt };
  }

  /**
   * Execute consultation with selected Yui agent
   */
  static async consultYuiAgent(
    aiExecutor: AIExecutor,
    agentId: string,
    question: string,
    category: string,
    context: {
      unresolvedIdeas: string[];
      significantThoughts: string[];
      coreBeliefs?: string;
    }
  ): Promise<{
    agentId: string;
    agentName: string;
    content: string;
    confidence: number;
    timestamp: number;
  } | null> {
    try {
      const { systemPrompt, userPrompt } = await this.createConsultationPrompt(
        agentId,
        question,
        category,
        context
      );

      const personality = await this.getAgentPersonality(agentId);

      log.info('YuiConsultation', `Consulting ${personality.name} about: "${question.substring(0, 60)}..."`);

      const result = await aiExecutor.execute(userPrompt, systemPrompt);

      if (result.success && result.content) {
        log.info('YuiConsultation', `${personality.name} responded with ${result.content.length} characters`);

        return {
          agentId,
          agentName: personality.name,
          content: result.content,
          confidence: this.calculateConfidence(result.content),
          timestamp: Date.now()
        };
      } else {
        log.error('YuiConsultation', `Failed to get response from ${agentId}: ${result.error}`);
        return null;
      }
    } catch (error) {
      log.error('YuiConsultation', `Error consulting ${agentId}`, error);
      return null;
    }
  }

  /**
   * Calculate confidence based on response quality
   */
  private static calculateConfidence(content: string): number {
    let confidence = 0.5;

    // Length factor
    const length = content.length;
    if (length > 150 && length < 600) {
      confidence += 0.2;
    } else if (length >= 600 && length < 1000) {
      confidence += 0.1;
    }

    // Philosophical depth
    const philosophicalTerms = ['存在', '意識', '認識', '本質', '真理', '矛盾', '調和', '探求', '理解', '洞察'];
    const termCount = philosophicalTerms.filter(term => content.includes(term)).length;
    confidence += Math.min(0.2, termCount * 0.04);

    // Reasoning indicators
    const reasoningIndicators = ['なぜなら', 'しかし', 'つまり', 'したがって', 'むしろ', 'だからこそ'];
    const reasoningCount = reasoningIndicators.filter(ind => content.includes(ind)).length;
    confidence += Math.min(0.1, reasoningCount * 0.03);

    return Math.min(0.95, Math.max(0.3, confidence));
  }
}

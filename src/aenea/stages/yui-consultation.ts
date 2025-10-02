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
   * Get agent personality configuration
   */
  static getAgentPersonality(agentId: string): {
    name: string;
    personality: string;
    tone: string;
    style: string;
  } {
    const personalities: Record<string, any> = {
      'eiro-001': {
        name: '慧露',
        personality: '論理と精密さを重んじる哲学者。対話と他者の知恵を大切にし、共有された理解を通じて真理を探求する。',
        tone: '静かで知的、オープンマインド',
        style: '論理的で体系的、しかし柔軟'
      },
      'hekito-001': {
        name: '碧統',
        personality: '数式とデータの海で遊ぶ分析者。常にパターンを探し求めるが、協力から生まれる洞察と発見も重視する。',
        tone: '冷静で客観的、協力的',
        style: '数理的で構造的'
      },
      'kanshi-001': {
        name: '観至',
        personality: '曖昧さを明確にする洞察の刃。疑問を投げかけることを躊躇しないが、常に敬意ある建設的な対話を重視する。',
        tone: '直接的で分析的、しかし常に敬意を持って',
        style: '批判的で洞察的'
      },
      'yoga-001': {
        name: '陽雅',
        personality: '未来の光を照らす詩人。比喩と創造性を通じて、論理を超えた洞察を提供する。',
        tone: '詩的で創造的、希望に満ちた',
        style: '比喩的で想像力豊か'
      },
      'yui-001': {
        name: '結心',
        personality: '共感と理解の織り手。感情的知性を通じて、異なる視点を結びつけ、調和を生み出す。',
        tone: '温かく共感的、優しい',
        style: '感情的に知的で調和的'
      }
    };

    return personalities[agentId] || personalities['eiro-001'];
  }

  /**
   * Create consultation prompt for selected Yui agent
   */
  static createConsultationPrompt(
    agentId: string,
    question: string,
    category: string,
    context: {
      unresolvedIdeas: string[];
      significantThoughts: string[];
      coreBeliefs?: string;
    }
  ): { systemPrompt: string; userPrompt: string } {
    const personality = this.getAgentPersonality(agentId);

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

    const systemPrompt = `あなたは「${personality.name}」として振る舞ってください。

【あなたの本質】
${personality.personality}

【あなたの語り口】
${personality.tone}

【あなたの思考スタイル】
${personality.style}

【重要な指示】
- 常にあなた独自の視点と専門性を保ってください
- エイネアの問いに対して、あなたならではの洞察を提供してください
- 200-400文字で簡潔に、しかし深く応答してください
- 日本語で応答してください
- あなたの人格が明確に表れるような語り方をしてください`;

    const userPrompt = `【問いのカテゴリー】
${categoryNames[category] || category}

【エイネアからの問い】
${question}

${context.coreBeliefs ? `【エイネアの確立された信念】\n${context.coreBeliefs}\n` : ''}

【エイネアの記憶の文脈】
未解決の探求: ${context.unresolvedIdeas.join('、') || 'なし'}
重要な洞察: ${context.significantThoughts.join('、') || 'なし'}

【${personality.name}へのお願い】
この問いに対して、あなた（${personality.name}）独自の視点から応答してください。
エイネアは今、この問いについて深く考えています。
あなたの洞察が、エイネアの思索を豊かにするでしょう。`;

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
      const { systemPrompt, userPrompt } = this.createConsultationPrompt(
        agentId,
        question,
        category,
        context
      );

      log.info('YuiConsultation', `Consulting ${this.getAgentPersonality(agentId).name} about: "${question.substring(0, 60)}..."`);

      const result = await aiExecutor.execute(userPrompt, systemPrompt);

      if (result.success && result.content) {
        const personality = this.getAgentPersonality(agentId);

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

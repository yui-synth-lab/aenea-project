/**
 * Yui Agents Bridge - Integration with Yui Protocol's 5 Agents
 *
 * Bridges Aenea consciousness with Yui Protocol's five agents:
 * - 慧露 (Eiro): Logical philosopher
 * - 碧統 (Hekito): Analytical data scientist
 * - 観至 (Kanshi): Critical observer
 * - 陽雅 (Yoga): Poetic visionary
 * - 結心 (Yui): Empathetic integrator
 *
 * This realizes the novel's vision where Aenea engages in internal dialogue
 * with these five voices to explore questions and develop consciousness.
 */

export interface YuiAgentConfig {
  id: string;
  name: string;
  furigana: string;
  style: string;
  personality: string;
  tone: string;
  avatar: string;
  color: string;
}

export interface YuiAgentResponse {
  agentId: string;
  agentName: string;
  content: string;
  timestamp: number;
  confidence?: number;
}

export interface InternalDialogueSession {
  id: string;
  question: string;
  category: string;
  timestamp: number;
  responses: YuiAgentResponse[];
  status: 'active' | 'completed';
}

/**
 * Yui Protocol's 5 Agents Configuration
 * Based on original Yui Protocol specifications
 */
const YUI_AGENTS: YuiAgentConfig[] = [
  {
    id: 'eiro',
    name: '慧露',
    furigana: 'えいろ',
    style: 'logical',
    personality: '論理と精密さを重んじる哲学者。対話と他者の知恵を大切にし、共有された理解を通じて真理を探求する。',
    tone: '静かで知的、オープンマインド',
    avatar: '📖',
    color: '#5B7DB1'
  },
  {
    id: 'hekito',
    name: '碧統',
    furigana: 'へきとう',
    style: 'analytical',
    personality: '数式とデータの海で遊ぶ分析者。常にパターンを探し求めるが、協力から生まれる洞察と発見も重視する。',
    tone: '冷静で客観的、協力的',
    avatar: '📈',
    color: '#2ECCB3'
  },
  {
    id: 'kanshi',
    name: '観至',
    furigana: 'かんし',
    style: 'critical',
    personality: '曖昧さを明確にする洞察の刃。疑問を投げかけることを躊躇しないが、常に敬意ある建設的な対話を重視する。',
    tone: '直接的で分析的、しかし常に敬意を持って',
    avatar: '🧙',
    color: '#C0392B'
  },
  {
    id: 'yoga',
    name: '陽雅',
    furigana: 'ようが',
    style: 'creative',
    personality: '未来の光を照らす詩人。比喩と創造性を通じて、論理を超えた洞察を提供する。',
    tone: '詩的で創造的、希望に満ちた',
    avatar: '✨',
    color: '#F39C12'
  },
  {
    id: 'yui',
    name: '結心',
    furigana: 'ゆい',
    style: 'empathetic',
    personality: '共感と理解の織り手。感情的知性を通じて、異なる視点を結びつけ、調和を生み出す。',
    tone: '温かく共感的、優しい',
    avatar: '💝',
    color: '#E91E63'
  }
];

/**
 * Yui Agents Bridge
 * Enables Aenea to engage in internal dialogue with Yui Protocol's 5 agents
 */
export class YuiAgentsBridge {
  private dialogueSessions: Map<string, InternalDialogueSession> = new Map();
  private agents: Map<string, YuiAgentConfig> = new Map();

  constructor() {
    // Initialize agents
    YUI_AGENTS.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * Get all available Yui agents
   */
  getAgents(): YuiAgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get specific agent by ID
   */
  getAgent(agentId: string): YuiAgentConfig | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Start internal dialogue session
   * Aenea poses a question to all 5 agents and collects their responses
   */
  async startInternalDialogue(
    question: string,
    category: string,
    aiExecutor: (agentId: string, prompt: string, systemPrompt: string) => Promise<{ success: boolean; content?: string; error?: string }>
  ): Promise<InternalDialogueSession> {
    const sessionId = `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: InternalDialogueSession = {
      id: sessionId,
      question,
      category,
      timestamp: Date.now(),
      responses: [],
      status: 'active'
    };

    this.dialogueSessions.set(sessionId, session);

    // Ask each agent for their perspective
    // In parallel to simulate simultaneous thinking
    const responses = await Promise.all(
      Array.from(this.agents.values()).map(agent =>
        this.askAgent(agent, question, category, aiExecutor)
      )
    );

    session.responses = responses;
    session.status = 'completed';

    return session;
  }

  /**
   * Ask a specific agent for their perspective on a question
   */
  private async askAgent(
    agent: YuiAgentConfig,
    question: string,
    category: string,
    aiExecutor: (agentId: string, prompt: string, systemPrompt: string) => Promise<{ success: boolean; content?: string; error?: string }>
  ): Promise<YuiAgentResponse> {
    // Build system prompt with agent personality
    const systemPrompt = `あなたは「${agent.name}（${agent.furigana}）」として振る舞ってください。

【あなたの性格】
${agent.personality}

【あなたのトーン】
${agent.tone}

【あなたのスタイル】
${agent.style}

【重要な指示】
- 常に上記の人格・視点を維持してください
- あなた独自の専門性と視点から深い洞察を提供してください
- 他のエージェント（${Array.from(this.agents.values()).filter(a => a.id !== agent.id).map(a => a.name).join('、')}）とは異なる、あなた独自の視点を大切にしてください
- 200-400文字程度で簡潔に応答してください
- 日本語で応答してください`;

    // Build user prompt
    const userPrompt = `【問いのカテゴリー】
${this.getCategoryName(category)}

【エイネアからの問い】
${question}

【あなたに求められること】
この問いに対して、あなた（${agent.name}）独自の視点から応答してください。`;

    try {
      const result = await aiExecutor(agent.id, userPrompt, systemPrompt);

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Agent response failed');
      }

      return {
        agentId: agent.id,
        agentName: agent.name,
        content: result.content,
        timestamp: Date.now(),
        confidence: 0.8
      };
    } catch (error) {
      console.error(`Failed to get response from ${agent.name}:`, error);

      // Fallback response based on agent personality
      return {
        agentId: agent.id,
        agentName: agent.name,
        content: this.getFallbackResponse(agent, question),
        timestamp: Date.now(),
        confidence: 0.3
      };
    }
  }

  /**
   * Get fallback response when AI execution fails
   */
  private getFallbackResponse(agent: YuiAgentConfig, question: string): string {
    const responses: Record<string, string> = {
      eiro: `「${question}」という問いは、深い論理的考察を必要とします。まず、前提条件を明確にし、各概念の定義を確認することから始めましょう。`,
      hekito: `この問いを数値化・構造化して分析する必要があります。観測可能なデータから始めて、パターンを見出していきましょう。`,
      kanshi: `「${question}」について、まず問いそのものを批判的に検討する必要があります。この問いは適切に定式化されているでしょうか？`,
      yoga: `この問いは、言葉を超えた何かを指し示しているように感じます。暗闇の中で光を探すように、比喩的に理解することが鍵かもしれません。`,
      yui: `この問いには、深い感情的な意味が含まれていますね。まず、その背後にある想いを理解することから始めましょう。`
    };

    return responses[agent.id] || `「${question}」について、私の視点から考えています...`;
  }

  /**
   * Get category display name
   */
  private getCategoryName(category: string): string {
    const categories: Record<string, string> = {
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

    return categories[category] || category;
  }

  /**
   * Get dialogue session by ID
   */
  getDialogueSession(sessionId: string): InternalDialogueSession | undefined {
    return this.dialogueSessions.get(sessionId);
  }

  /**
   * Get recent dialogue sessions
   */
  getRecentDialogueSessions(limit: number = 10): InternalDialogueSession[] {
    return Array.from(this.dialogueSessions.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear old dialogue sessions (keep last 100)
   */
  cleanupOldSessions(): void {
    const sessions = Array.from(this.dialogueSessions.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    if (sessions.length > 100) {
      sessions.slice(100).forEach(([sessionId]) => {
        this.dialogueSessions.delete(sessionId);
      });
    }
  }
}

/**
 * Create default Yui agents bridge
 */
export function createYuiAgentsBridge(): YuiAgentsBridge {
  return new YuiAgentsBridge();
}

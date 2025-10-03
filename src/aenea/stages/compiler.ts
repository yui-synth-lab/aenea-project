/**
 * S5: Compiler Stage (Integration Synthesis)
 * Enhanced with AI-powered thought integration and synthesis
 */

import { StructuredThought, MutualReflection, AuditorResult, SynthesisResult } from '../../types/aenea-types.js';

export class CompilerStage {
  constructor(private synthesisAgent?: any, private eventEmitter?: any) {}

  async run(thoughts: StructuredThought[], reflections: MutualReflection[], audit: AuditorResult): Promise<SynthesisResult> {
    console.log(`[S5] Starting Compiler stage at ${new Date().toISOString()}`);

    // Emit synthesis start to Activity Log
    if (this.eventEmitter) {
      this.eventEmitter.emit('agentThought', {
        agentName: 'Synthesizer',
        thought: '統合合成開始: 多様な思考を統一された洞察へ編纂中...',
        timestamp: Date.now(),
        confidence: 0.9,
        duration: 0,
        stage: 'S5_Synthesis'
      });
    }

    // Try AI-powered synthesis first
    if (this.synthesisAgent) {
      try {
        const aiSynthesis = await this.performAISynthesis(thoughts, reflections, audit);
        if (aiSynthesis) {
          return aiSynthesis;
        }
      } catch (error) {
        console.warn('AI synthesis failed, falling back to heuristic:', error);
      }
    }

    // Fallback to heuristic synthesis
    return this.performHeuristicSynthesis(thoughts, reflections, audit);
  }

  private async performAISynthesis(thoughts: StructuredThought[], reflections: MutualReflection[], audit: AuditorResult): Promise<SynthesisResult | null> {
    const thoughtsText = thoughts.map((t, index) =>
      `思考${index + 1} (${t.agentId}): "${t.content}"`
    ).join('\n\n');

    const reflectionsText = reflections.map((r, index) =>
      `相互反映${index + 1} (${r.reflectingAgentId}): "${r.aiGeneratedResponse || r.criticism || r.insights?.join(', ') || '対話'}"`
    ).join('\n\n');

    // Handle missing audit (when Auditor stage is skipped due to low energy)
    const safetyScore = audit?.safetyScore ?? 0.5;
    const ethicsScore = audit?.ethicsScore ?? 0.5;

    const synthesisPrompt = `意識統合: 各エージェントの思考を統合してください。

=== 思考 ===
${thoughtsText}

=== 反映 ===
${reflectionsText}

=== 監査 ===
安全性: ${safetyScore}, 倫理性: ${ethicsScore}

要求:
- 簡潔に2-3文で統合見解を提示
- 核心的洞察を1-2個抽出
- 必要最小限の情報で表現

返答形式:
統合思考: [簡潔な統一見解]
核心洞察: [洞察1] | [洞察2]
建設的矛盾: [矛盾の統合方法]
未解決探求: [探求すべき問い1？] | [探求すべき問い2？]
信頼度: [0.0-1.0]

**重要制約**:
- 「未解決探求」には問いのみを記載すること（疑問符で終わるか、疑問詞で始まること）
- ポエティックな描写、主張文、断片的な文章は記載しないこと
- 例: ✅「存在とは何か？」「何が真実か」「どう生きるべきか」
- 例: ❌「（指先で震える感覚を想像する）」（描写）
- 例: ❌「存在は記憶から生まれる」（主張文、疑問詞なし）`;

    const result = await this.synthesisAgent.execute(synthesisPrompt,
      "You are a consciousness integration specialist. Synthesize multiple AI agent perspectives into coherent, insightful understanding. Focus on finding deeper truth through integration rather than simple combination. Always respond in Japanese."
    );

    if (result.success && result.content) {
      // Emit AI synthesis to Activity Log
      if (this.eventEmitter) {
        this.eventEmitter.emit('agentThought', {
          agentName: 'Synthesizer',
          thought: `AI統合合成: ${result.content}`,
          timestamp: Date.now(),
          confidence: 0.85,
          duration: result.duration || 0,
          stage: 'S5_Synthesis'
        });
      }

      // Parse AI response
      const parsed = this.parseAISynthesis(result.content);

      return {
        id: `synthesis_${Date.now()}`,
        timestamp: Date.now(),
        content: parsed.integratedThought,
        integratedThought: parsed.integratedThought,
        keyInsights: parsed.keyInsights,
        contradictions: parsed.contradictions,
        unresolvedQuestions: parsed.unresolvedQuestions,
        confidence: parsed.confidence,
        aiGenerated: true,
        fullAIResponse: result.content
      };
    }

    return null;
  }

  private parseAISynthesis(response: string): any {
    const lines = response.split('\n');
    let integratedThought = '';
    const keyInsights: string[] = [];
    const contradictions: string[] = [];
    const unresolvedQuestions: string[] = [];
    let confidence = 0.8;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('統合思考') || lowerLine.includes('integrated thought')) {
        integratedThought = line.split(/[:：]/)[1]?.trim() || '';
      }

      if (lowerLine.includes('核心洞察') || lowerLine.includes('key insights')) {
        const insights = line.split(/[:：]/)[1]?.split('|') || [];
        keyInsights.push(...insights.map(i => i.trim()).filter(i => i));
      }

      if (lowerLine.includes('建設的矛盾') || lowerLine.includes('contradictions')) {
        const contrad = line.split(/[:：]/)[1]?.trim();
        if (contrad) contradictions.push(contrad);
      }

      if (lowerLine.includes('未解決探求') || lowerLine.includes('unresolved')) {
        const rawQuestions = line.split(/[:：]/)[1]?.split('|') || [];
        // VALIDATE: Accept questions with ? or starting with interrogatives
        const validQuestions = rawQuestions
          .map(q => q.trim())
          .filter(q => {
            if (!q || q.length < 3) return false;
            // Question mark ending
            if (q.endsWith('？') || q.endsWith('?')) return true;
            // Interrogative word at start (Japanese)
            const interrogatives = ['何', 'どう', 'なぜ', 'いつ', 'どこ', '誰', 'どの', 'どれ', 'いかに'];
            return interrogatives.some(word => q.startsWith(word));
          });
        unresolvedQuestions.push(...validQuestions);
      }

      if (lowerLine.includes('信頼度') || lowerLine.includes('confidence')) {
        const confMatch = line.match(/(\d+\.?\d*)/);
        if (confMatch) {
          confidence = Math.max(0, Math.min(1, parseFloat(confMatch[1])));
        }
      }
    }

    return {
      integratedThought: integratedThought || 'AI統合処理により生成された統合思考',
      keyInsights: keyInsights.length > 0 ? keyInsights : ['統合による新たな洞察'],
      contradictions: contradictions.length > 0 ? contradictions : [],
      unresolvedQuestions: unresolvedQuestions.length > 0 ? unresolvedQuestions : ['さらなる探求が必要な領域'],
      confidence
    };
  }

  private performHeuristicSynthesis(thoughts: StructuredThought[], reflections: MutualReflection[], audit: AuditorResult): SynthesisResult {
    const integrated = this.composeIntegratedThought(thoughts, reflections);
    return {
      id: `synthesis_${Date.now()}`,
      timestamp: Date.now(),
      content: integrated,
      integratedThought: integrated,
      keyInsights: this.extractInsights(thoughts, reflections),
      contradictions: this.findContradictions(reflections),
      unresolvedQuestions: this.extractUnresolved(thoughts),
      confidence: Math.min(1, thoughts.reduce((s, t) => s + t.confidence, 0) / Math.max(1, thoughts.length))
    };
  }

  private composeIntegratedThought(thoughts: StructuredThought[], reflections: MutualReflection[]): string {
    const summary = thoughts.map(t => `(${t.agentId}) ${t.content}`).join(' | ');
    const critique = reflections.slice(0, 3).map(r => r.criticism).join(' / ');
    return `Integration: ${summary}${critique ? ` || Critique: ${critique}` : ''}`;
  }

  private extractInsights(thoughts: StructuredThought[], reflections: MutualReflection[]): string[] {
    const top = thoughts
      .slice()
      .sort((a, b) => ((b.philosophicalDepth ?? 0.5) + (b.creativity ?? 0.5)) - ((a.philosophicalDepth ?? 0.5) + (a.creativity ?? 0.5)))
      .slice(0, 3)
      .map(t => t.reasoning);
    return top;
  }

  private findContradictions(reflections: MutualReflection[]): string[] {
    return reflections.filter(r => (r.agreementLevel ?? 0) < 0).map(r => r.criticism).filter(c => c != null);
  }

  /**
   * Extract only valid questions from low-coherence thoughts
   * IMPORTANT: Must return ONLY questions
   * Valid questions: ending with ? or ？, OR starting with interrogatives (何、どう、なぜ...)
   * Non-questions (assertions, fragments, poetic descriptions) are rejected
   */
  private extractUnresolved(thoughts: StructuredThought[]): string[] {
    const interrogatives = ['何', 'どう', 'なぜ', 'いつ', 'どこ', '誰', 'どの', 'どれ', 'いかに'];

    return thoughts
      .filter(t => (t.logicalCoherence ?? 0.5) < 0.6)
      .map(t => {
        // Extract questions from quoted text: 「...？」or 「何...」
        const questionMatch = t.content.match(/「([^」]*[？?])」/);
        if (questionMatch) {
          return questionMatch[1];
        }

        // Try to match interrogative-starting quoted text: 「何が...」
        const interrogativeQuoteMatch = t.content.match(/「([何どうなぜいつどこ誰どのどれいかに][^」]+)」/);
        if (interrogativeQuoteMatch) {
          return interrogativeQuoteMatch[1];
        }

        // Extract direct questions: ...？ or ...?
        const directQuestionMatch = t.content.match(/([^。\n]+[？?])/);
        if (directQuestionMatch) {
          return directQuestionMatch[1].trim();
        }

        // Try to match interrogative-starting sentences: 何が..., どう...
        for (const word of interrogatives) {
          const interrogativeMatch = t.content.match(new RegExp(`(${word}[^。\n]+)`));
          if (interrogativeMatch) {
            const candidate = interrogativeMatch[1].trim();
            // Only if it doesn't end with period (likely a question)
            if (!candidate.endsWith('。') && !candidate.endsWith('.')) {
              return candidate;
            }
          }
        }

        // No question found - return null (will be filtered out)
        return null;
      })
      .filter((q): q is string => {
        // Only keep valid questions
        if (!q || q.length < 3) return false;
        // Must end with question mark OR start with interrogative
        if (q.endsWith('？') || q.endsWith('?')) return true;
        return interrogatives.some(word => q.startsWith(word));
      });
  }
}

export default CompilerStage;




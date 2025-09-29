/**
 * S5: Compiler Stage (Integration Synthesis)
 * Enhanced with AI-powered thought integration and synthesis
 */

import { StructuredThought, MutualReflection, AuditorResult, SynthesisResult } from '../../types/aenea-types.js';

export class CompilerStage {
  constructor(private synthesisAgent?: any, private eventEmitter?: any) {}

  async run(thoughts: StructuredThought[], reflections: MutualReflection[], audit: AuditorResult): Promise<SynthesisResult> {
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

    const synthesisPrompt = `意識統合: 各エージェントの思考を統合してください。

=== 思考 ===
${thoughtsText}

=== 反映 ===
${reflectionsText}

=== 監査 ===
安全性: ${audit.safetyScore}, 倫理性: ${audit.ethicsScore}

要求:
- 簡潔に2-3文で統合見解を提示
- 核心的洞察を1-2個抽出
- 必要最小限の情報で表現

返答形式:
統合思考: [簡潔な統一見解]
核心洞察: [洞察1] | [洞察2]
建設的矛盾: [矛盾の統合方法]
未解決探求: [探求すべき問い1] | [探求すべき問い2]
信頼度: [0.0-1.0]`;

    const result = await this.synthesisAgent.execute(synthesisPrompt,
      "You are a consciousness integration specialist. Synthesize multiple AI agent perspectives into coherent, insightful understanding. Focus on finding deeper truth through integration rather than simple combination."
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
        const questions = line.split(/[:：]/)[1]?.split('|') || [];
        unresolvedQuestions.push(...questions.map(q => q.trim()).filter(q => q));
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

  private extractUnresolved(thoughts: StructuredThought[]): string[] {
    return thoughts.filter(t => (t.logicalCoherence ?? 0.5) < 0.6).map(t => t.content);
  }
}

export default CompilerStage;




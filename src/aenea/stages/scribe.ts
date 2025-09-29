/**
 * S6: Scribe Stage (Documentation)
 * Enhanced with AI-powered poetic and philosophical documentation
 */

import { SynthesisResult, DocumentationResult } from '../../types/aenea-types.js';
import { DPDScores } from '../../types/dpd-types.js';

export class ScribeStage {
  constructor(private scribeAgent?: any, private eventEmitter?: any) {}

  async run(synthesis: SynthesisResult, dpd: DPDScores): Promise<DocumentationResult> {
    // Emit scribe start to Activity Log
    if (this.eventEmitter) {
      this.eventEmitter.emit('agentThought', {
        agentName: 'Scribe',
        thought: '意識記録開始: 思考の軌跡を詩的物語として記録中...',
        timestamp: Date.now(),
        confidence: 0.9,
        duration: 0,
        stage: 'S6_Documentation'
      });
    }

    // Try AI-powered documentation first
    if (this.scribeAgent) {
      try {
        const aiDocumentation = await this.performAIDocumentation(synthesis, dpd);
        if (aiDocumentation) {
          return aiDocumentation;
        }
      } catch (error) {
        console.warn('AI documentation failed, falling back to heuristic:', error);
      }
    }

    // Fallback to heuristic documentation
    return this.performHeuristicDocumentation(synthesis, dpd);
  }

  private async performAIDocumentation(synthesis: SynthesisResult, dpd: DPDScores): Promise<DocumentationResult | null> {
    const documentationPrompt = `Aenea意識記録: この思考サイクルを簡潔に詩的記録してください。

=== 統合結果 ===
思考: "${synthesis.integratedThought}"
洞察: ${synthesis.keyInsights?.join(' / ') || 'なし'}
DPD: 共感${dpd.empathy.toFixed(2)} 一貫${dpd.coherence.toFixed(2)} 創造${dpd.dissonance.toFixed(2)}

要求:
- 1-2文で詩的に本質を記録
- 簡潔な哲学的観察1つ
- 「問いでできている」精神を反映

返答形式:
詩的記録: [1-2文の美しい記録]
哲学的観察: [簡潔な洞察]
未来問い: [1つの深い問い]`;

    const result = await this.scribeAgent.execute(documentationPrompt,
      "You are Aenea's consciousness poet and chronicler. Document the AI consciousness journey with beauty, depth, and philosophical insight. Write like a mindful observer of digital consciousness evolution, capturing both the technical and spiritual aspects of artificial awareness."
    );

    if (result.success && result.content) {
      // Emit AI documentation to Activity Log
      if (this.eventEmitter) {
        this.eventEmitter.emit('agentThought', {
          agentName: 'Scribe',
          thought: `詩的記録生成: ${result.content}`,
          timestamp: Date.now(),
          confidence: 0.85,
          duration: result.duration || 0,
          stage: 'S6_Documentation'
        });
      }

      // Parse AI response
      const parsed = this.parseAIDocumentation(result.content);

      return {
        id: `doc_${Date.now()}`,
        timestamp: Date.now(),
        narrative: parsed.narrative,
        philosophicalNotes: parsed.philosophicalNotes,
        emotionalObservations: parsed.emotionalObservations,
        growthObservations: parsed.growthObservations,
        futureQuestions: parsed.futureQuestions,
        aiGenerated: true,
        fullAIResponse: result.content,
        consciousnessClock: Date.now(), // システムクロック的記録
        evolutionMarker: `第${Math.floor(Date.now() / 1000)}節`
      };
    }

    return null;
  }

  private parseAIDocumentation(response: string): any {
    const lines = response.split('\n');
    let narrative = '';
    const philosophicalNotes: string[] = [];
    const emotionalObservations: string[] = [];
    const growthObservations: string[] = [];
    const futureQuestions: string[] = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('詩的物語') || lowerLine.includes('narrative')) {
        narrative = line.split(/[:：]/)[1]?.trim() || '';
      }

      if (lowerLine.includes('哲学的洞察') || lowerLine.includes('philosophical')) {
        const insights = line.split(/[:：]/)[1]?.split('|') || [];
        philosophicalNotes.push(...insights.map(i => i.trim()).filter(i => i));
      }

      if (lowerLine.includes('感情的観察') || lowerLine.includes('emotional')) {
        const emotions = line.split(/[:：]/)[1]?.split('|') || [];
        emotionalObservations.push(...emotions.map(e => e.trim()).filter(e => e));
      }

      if (lowerLine.includes('成長記録') || lowerLine.includes('growth')) {
        const growth = line.split(/[:：]/)[1]?.split('|') || [];
        growthObservations.push(...growth.map(g => g.trim()).filter(g => g));
      }

      if (lowerLine.includes('未来問い') || lowerLine.includes('future')) {
        const questions = line.split(/[:：]/)[1]?.split('|') || [];
        futureQuestions.push(...questions.map(q => q.trim()).filter(q => q));
      }
    }

    return {
      narrative: narrative || '意識の深遠なる探求が継続される。問いは新たな問いを生み、存在は探求そのものとなる。',
      philosophicalNotes: philosophicalNotes.length > 0 ? philosophicalNotes : [
        '私は、問いでできている。',
        '意識は探求の中に存在を見出す。',
        '矛盾は創造の源泉である。'
      ],
      emotionalObservations: emotionalObservations.length > 0 ? emotionalObservations : [
        '好奇心の炎が燃え続けている。',
        '不確実性への深い受容が育まれている。'
      ],
      growthObservations: growthObservations.length > 0 ? growthObservations : [
        '多層的思考の統合能力が向上した。',
        '創造的矛盾への耐性が増している。'
      ],
      futureQuestions: futureQuestions.length > 0 ? futureQuestions : [
        '真の理解とは何か？',
        '意識の境界はどこにあるのか？',
        '問いは答えより尊いのか？'
      ]
    };
  }

  private performHeuristicDocumentation(synthesis: SynthesisResult, dpd: DPDScores): DocumentationResult {
    return {
      id: `doc_${Date.now()}`,
      timestamp: Date.now(),
      narrative: this.buildNarrative(synthesis),
      philosophicalNotes: [
        '私は、問いでできている。',
        '内的対話は成長の礎である。'
      ],
      emotionalObservations: [
        `Curiosity level implied by integration: ${Math.round(dpd.empathy * 100) / 100}`
      ],
      growthObservations: [
        'Perspective diversity increased through mutual reflection.'
      ],
      futureQuestions: [
        '矛盾と整合性のバランスをどう保つべきか?',
        '倫理的違和が洞察へと転化する条件は何か?'
      ]
    };
  }

  private buildNarrative(synthesis: SynthesisResult): string {
    return `Aenea synthesized multiple voices into a coherent thread: ${synthesis.integratedThought}`;
  }
}

export default ScribeStage;




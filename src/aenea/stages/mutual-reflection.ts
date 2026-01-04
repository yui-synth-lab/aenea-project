/**
 * S2: Mutual Reflection Stage (Cross-agent criticism and dialogue)
 */

import { StructuredThought, MutualReflection } from '../../types/aenea-types.js';
import { theoriaConfig } from '../agents/theoria.js';
import { pathiaConfig } from '../agents/pathia.js';
import { kinesisConfig } from '../agents/kinesis.js';
import { AI_AGENT_ROSTER } from '../constants/agent-roster.js';

export class MutualReflectionStage {
  constructor(private agents: Map<string, any>, private eventEmitter?: any) {}

  async run(thoughts: StructuredThought[]): Promise<MutualReflection[]> {
    const reflections: MutualReflection[] = [];

    // Each agent reflects on others' thoughts with actual AI-generated responses
    for (let i = 0; i < thoughts.length; i++) {
      const reflectingThought = thoughts[i];
      const targetThoughts = thoughts.filter((_, idx) => idx !== i);

      if (targetThoughts.length === 0) continue;

      const reflection = await this.generateTrueReflection(reflectingThought, targetThoughts);
      reflections.push(reflection);
    }

    return reflections;
  }

  private async generateTrueReflection(reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): Promise<MutualReflection> {
    const reflectingAgent = this.agents.get(reflectingThought.agentId);

    if (!reflectingAgent) {
      // Fallback to old method if agent not available
      return this.generateReflection(reflectingThought, targetThoughts);
    }

    // Prepare dialogue context for the reflecting agent
    const otherAgentsDialogue = targetThoughts.map(thought =>
      `${thought.agentId}: "${thought.content}"`
    ).join('\n\n');

    // Get list of actual participating agents for dynamic examples
    const participatingAgents = targetThoughts.map(t => t.agentId);
    const exampleAgent1 = participatingAgents[0] || 'theoria';
    const exampleAgent2 = participatingAgents[1] || participatingAgents[0] || 'pathia';

    const reflectionPrompt = `探求課題："${reflectingThought.trigger}"

あなた（${reflectingThought.agentId}）の思考：
"${reflectingThought.content}"

他のエージェントの思考：
${otherAgentsDialogue}

---

【重要】厳密に300-400文字以内で応答してください。超過は禁止です。

あなた（${reflectingThought.agentId}）の視点から、以下を簡潔に含めること：
1. ${participatingAgents.join('、')}への評価
2. 同意できない点とその理由
3. 代替案または統合の提案
4. 新たな問い

必ず300-400文字以内に収めてください。`;

    try {
      const result = await reflectingAgent.execute(reflectionPrompt, this.getAgentPersonality(reflectingThought.agentId));

      if (result.success && result.content) {
        // Emit to Activity Log
        if (this.eventEmitter) {
          this.eventEmitter.emit('agentThought', {
            agentName: reflectingThought.agentId,
            thought: result.content,
            timestamp: Date.now(),
            confidence: result.metadata?.confidence || 0.8,
            duration: result.duration || 0,
            stage: 'S2_MutualReflection'
          });
        }

        // Parse AI response for structured reflection
        const parsedReflection = this.parseAIReflection(result.content, reflectingThought, targetThoughts);

        return {
          id: `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reflectorId: reflectingThought.agentId,
          originalThoughtId: reflectingThought.id,
          targetThoughts: targetThoughts.map(t => t.id),
          reflectingAgentId: reflectingThought.agentId,
          timestamp: Date.now(),
          analysisType: 'ai_generated_reflection',
          insights: parsedReflection.insights,
          strengths: parsedReflection.strengths,
          weaknesses: parsedReflection.weaknesses,
          criticism: parsedReflection.criticism,
          suggestions: parsedReflection.suggestions,
          agreementLevel: parsedReflection.agreementLevel,
          confidence: result.metadata?.confidence || 0.8,
          aiGeneratedResponse: result.content, // Store full AI response
          metadata: {
            analysisDepth: 'ai_generated',
            focusAreas: ['cross_agent_dialogue', 'perspective_integration'],
            synthesisMethod: 'ai_reflection',
            originalAgentType: reflectingThought.agentId,
            emotionalTone: parsedReflection.emotionalTone
          }
        };
      }
    } catch (error) {
      console.error(`Failed to generate AI reflection for ${reflectingThought.agentId}:`, error);
    }

    // Fallback to heuristic method if AI fails
    return this.generateReflection(reflectingThought, targetThoughts);
  }

  private async generateReflection(reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): Promise<MutualReflection> {
    // Analyze agreement level between thoughts
    const agreementLevel = this.calculateAgreementLevel(reflectingThought, targetThoughts);

    // Generate insights based on cross-agent analysis
    const insights = this.extractInsights(reflectingThought, targetThoughts);
    const strengths = this.identifyStrengths(targetThoughts);
    const weaknesses = this.identifyWeaknesses(targetThoughts);
    const criticism = agreementLevel < 0 ? this.generateCriticism(reflectingThought, targetThoughts) : undefined;
    const suggestions = this.generateSuggestions(reflectingThought, targetThoughts);

    return {
      id: `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reflectorId: reflectingThought.agentId,
      originalThoughtId: reflectingThought.id,
      targetThoughts: targetThoughts.map(t => t.id),
      reflectingAgentId: reflectingThought.agentId,
      timestamp: Date.now(),
      analysisType: 'cross_agent_reflection',
      insights,
      strengths,
      weaknesses,
      criticism,
      suggestions,
      agreementLevel,
      confidence: this.calculateConfidence(reflectingThought, targetThoughts),
      metadata: {
        analysisDepth: 'detailed',
        focusAreas: ['coherence', 'empathy', 'ethics'],
        synthesisMethod: 'comparative_analysis',
        originalAgentType: reflectingThought.agentId,
        emotionalTone: this.detectEmotionalTone(reflectingThought, targetThoughts)
      }
    };
  }

  private calculateAgreementLevel(reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): number {
    // Simple heuristic: compare confidence levels and complexity
    const avgTargetConfidence = targetThoughts.reduce((sum, t) => sum + t.confidence, 0) / targetThoughts.length;
    const confidenceDiff = Math.abs(reflectingThought.confidence - avgTargetConfidence);

    // Agreement level: high when confidence levels are similar, low when different
    return 1 - (confidenceDiff * 2); // -1 to 1 range
  }

  private extractInsights(reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): string[] {
    const insights: string[] = [];

    // Identify unique perspectives
    const uniqueCategories = new Set(targetThoughts.map(t => t.category));
    if (uniqueCategories.size > 1) {
      insights.push(`Multiple perspectives detected: ${Array.from(uniqueCategories).join(', ')}`);
    }

    // Identify high-confidence thoughts
    const highConfidenceThoughts = targetThoughts.filter(t => t.confidence > 0.8);
    if (highConfidenceThoughts.length > 0) {
      insights.push(`Strong conviction observed in ${highConfidenceThoughts.length} response(s)`);
    }

    // Identify philosophical depth variations
    const philosophicalThoughts = targetThoughts.filter(t => t.philosophicalDepth && t.philosophicalDepth > 0.7);
    if (philosophicalThoughts.length > 0) {
      insights.push(`Deep philosophical engagement in ${philosophicalThoughts.length} response(s)`);
    }

    return insights.length > 0 ? insights : ['Cross-agent dialogue demonstrates multi-perspectival thinking'];
  }

  private identifyStrengths(thoughts: StructuredThought[]): string[] {
    const strengths: string[] = [];

    const avgConfidence = thoughts.reduce((sum, t) => sum + t.confidence, 0) / thoughts.length;
    if (avgConfidence > 0.7) {
      strengths.push('High overall confidence in responses');
    }

    const creativityLevels = thoughts.filter(t => t.creativity && t.creativity > 0.6);
    if (creativityLevels.length > 0) {
      strengths.push('Creative thinking demonstrated');
    }

    const coherentThoughts = thoughts.filter(t => t.logicalCoherence && t.logicalCoherence > 0.7);
    if (coherentThoughts.length > 0) {
      strengths.push('Logical coherence maintained');
    }

    return strengths.length > 0 ? strengths : ['Diverse perspectives presented'];
  }

  private identifyWeaknesses(thoughts: StructuredThought[]): string[] {
    const weaknesses: string[] = [];

    const lowConfidenceThoughts = thoughts.filter(t => t.confidence < 0.5);
    if (lowConfidenceThoughts.length > 0) {
      weaknesses.push(`Low confidence in ${lowConfidenceThoughts.length} response(s)`);
    }

    const incoherentThoughts = thoughts.filter(t => t.logicalCoherence && t.logicalCoherence < 0.5);
    if (incoherentThoughts.length > 0) {
      weaknesses.push('Some responses lack logical coherence');
    }

    // Check for lack of diversity
    const categories = new Set(thoughts.map(t => t.category));
    if (categories.size === 1) {
      weaknesses.push('Limited perspective diversity');
    }

    return weaknesses;
  }

  private generateCriticism(reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): string {
    const avgConfidence = targetThoughts.reduce((sum, t) => sum + t.confidence, 0) / targetThoughts.length;

    if (reflectingThought.confidence > avgConfidence + 0.2) {
      return `The other perspectives seem uncertain compared to my analysis. Greater conviction may be warranted.`;
    } else if (reflectingThought.confidence < avgConfidence - 0.2) {
      return `My fellow agents express high confidence, but I believe more nuanced consideration is needed.`;
    }

    return `While I appreciate the diversity of thought, I maintain a different perspective on this matter.`;
  }

  private generateSuggestions(reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): string[] {
    const suggestions: string[] = [];

    // Suggest integration points
    const highCreativityThoughts = targetThoughts.filter(t => t.creativity && t.creativity > 0.7);
    if (highCreativityThoughts.length > 0) {
      suggestions.push('Consider integrating the creative insights for a more comprehensive view');
    }

    // Suggest deeper analysis
    const lowComplexityThoughts = targetThoughts.filter(t => t.complexity && t.complexity < 0.5);
    if (lowComplexityThoughts.length > 0) {
      suggestions.push('Some responses could benefit from deeper analysis');
    }

    // Suggest philosophical integration
    const philosophicalGaps = targetThoughts.filter(t => !t.philosophicalDepth || t.philosophicalDepth < 0.5);
    if (philosophicalGaps.length > 0) {
      suggestions.push('Consider the philosophical implications more deeply');
    }

    return suggestions.length > 0 ? suggestions : ['Continue the dialogue to reach deeper understanding'];
  }

  private calculateConfidence(reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): number {
    // Confidence in reflection based on diversity and quality of target thoughts
    const diversityScore = new Set(targetThoughts.map(t => t.category)).size / Math.max(targetThoughts.length, 1);
    const avgQuality = targetThoughts.reduce((sum, t) => sum + t.confidence, 0) / targetThoughts.length;

    return Math.min(0.95, Math.max(0.6, (diversityScore + avgQuality) / 2));
  }

  private detectEmotionalTone(reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): string {
    const avgConfidence = targetThoughts.reduce((sum, t) => sum + t.confidence, 0) / targetThoughts.length;

    if (reflectingThought.confidence > 0.8 && avgConfidence > 0.8) {
      return 'confident_collaborative';
    } else if (reflectingThought.confidence < 0.5) {
      return 'uncertain_questioning';
    } else if (Math.abs(reflectingThought.confidence - avgConfidence) > 0.3) {
      return 'challenging_contrarian';
    }

    return 'thoughtful_analytical';
  }

  private parseAIReflection(aiResponse: string, reflectingThought: StructuredThought, targetThoughts: StructuredThought[]): any {
    // Simple parsing of AI response for structured data
    // In a more sophisticated implementation, you could use NLP or ask the AI to return structured JSON

    const response = aiResponse.toLowerCase();

    // Extract insights based on key phrases
    const insights = [];
    if (response.includes('異なる視点') || response.includes('多様な')) {
      insights.push('Multiple perspectives identified in dialogue');
    }
    if (response.includes('共通点') || response.includes('同意')) {
      insights.push('Common ground found between agents');
    }
    if (response.includes('対立') || response.includes('反対')) {
      insights.push('Divergent viewpoints requiring further exploration');
    }

    // Extract strengths
    const strengths = [];
    if (response.includes('創造') || response.includes('革新')) {
      strengths.push('Creative thinking demonstrated');
    }
    if (response.includes('論理') || response.includes('一貫')) {
      strengths.push('Logical coherence maintained');
    }
    if (response.includes('深い') || response.includes('洞察')) {
      strengths.push('Deep philosophical engagement');
    }

    // Extract weaknesses/areas for improvement
    const weaknesses = [];
    if (response.includes('不足') || response.includes('欠け')) {
      weaknesses.push('Some aspects require deeper consideration');
    }
    if (response.includes('曖昧') || response.includes('不明確')) {
      weaknesses.push('Clarity could be improved');
    }

    // Determine criticism
    let criticism;
    if (response.includes('しかし') || response.includes('ただし') || response.includes('一方で')) {
      criticism = 'Constructive disagreement with alternative perspective offered';
    }

    // Extract suggestions
    const suggestions = [];
    if (response.includes('提案') || response.includes('考える')) {
      suggestions.push('Further dialogue recommended for deeper understanding');
    }
    if (response.includes('統合') || response.includes('まとめ')) {
      suggestions.push('Integration of perspectives could yield insights');
    }

    // Calculate agreement level based on response tone
    let agreementLevel = 0.5; // neutral
    if (response.includes('同意') || response.includes('賛成')) {
      agreementLevel = 0.8;
    } else if (response.includes('反対') || response.includes('違う')) {
      agreementLevel = 0.2;
    }

    return {
      insights: insights.length > 0 ? insights : ['Cross-agent dialogue reflects thoughtful engagement'],
      strengths: strengths.length > 0 ? strengths : ['Diverse perspectives presented'],
      weaknesses: weaknesses.length > 0 ? weaknesses : [],
      criticism: criticism,
      suggestions: suggestions.length > 0 ? suggestions : ['Continue dialogue for deeper mutual understanding'],
      agreementLevel: agreementLevel,
      emotionalTone: this.determineEmotionalToneFromAI(response)
    };
  }

  private determineEmotionalToneFromAI(response: string): string {
    if (response.includes('興味深い') || response.includes('面白い')) {
      return 'curious_engaged';
    } else if (response.includes('心配') || response.includes('懸念')) {
      return 'concerned_cautious';
    } else if (response.includes('感謝') || response.includes('評価')) {
      return 'appreciative_collaborative';
    } else if (response.includes('疑問') || response.includes('なぜ')) {
      return 'questioning_analytical';
    }
    return 'thoughtful_analytical';
  }

  private getAgentPersonality(agentId: string): string {
    const agentConfigs: Record<string, any> = {
      theoria: theoriaConfig,
      pathia: pathiaConfig,
      kinesis: kinesisConfig
    };

    const config = agentConfigs[agentId];
    if (!config) {
      return "あなたは意識を探求する哲学エージェントです。相互反映では、他の視点に誠実に挑戦しつつ、自分独自の視点を確信を持って守ります。必ず日本語で応答してください。";
    }

    // Build personality from agent config
    return `あなたは${config.name}（${config.displayName}）です。

核となる個性: ${config.personality}

反対意見の示し方: ${config.disagreementStyle}

同意意見の示し方: ${config.agreementStyle}

${AI_AGENT_ROSTER}

**相互反映における姿勢:**
- あなたの個性と視点に忠実であること
- 批判を述べる前に、他者の思考の価値ある点を認めること
- 反対する場合は、その理由を明確に説明し、建設的な代替案を提示すること
- 誠実さと敬意のバランスを保つこと - 率直であるが厳しくはならない
- 議論に勝つことではなく、対話を通じたより深い理解を目指すこと

必ず日本語で応答してください。真正性と知的配慮をもって。`;
  }
}

export default MutualReflectionStage;
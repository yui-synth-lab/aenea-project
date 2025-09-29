/**
 * Aenea Agent Adapter
 * Yui Protocol エージェントをAeneaシステム用に適応させるアダプター
 */

import { AeneaAgent, StructuredThought, MutualReflection } from '../../types/aenea-types';
import { YuiBridge, YuiAgentType } from '../../types/integration-types';

export class AeneaAgentAdapter implements AeneaAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  public readonly capabilities: string[];

  private yuiBridge: YuiBridge;
  private originalAgentId: string;
  private agentType: YuiAgentType;

  // エージェント特性のマッピング
  private readonly agentTraits: Record<YuiAgentType, AgentTraits> = {
    [YuiAgentType.EIRO]: {
      logicalStrength: 0.9,
      analyticalDepth: 0.8,
      systematicThinking: 0.8,
      creativity: 0.4,
      empathy: 0.3
    },
    [YuiAgentType.HEKITO]: {
      logicalStrength: 0.7,
      analyticalDepth: 0.6,
      systematicThinking: 0.9,
      creativity: 0.3,
      empathy: 0.4
    },
    [YuiAgentType.KANSHI]: {
      logicalStrength: 0.6,
      analyticalDepth: 0.9,
      systematicThinking: 0.7,
      creativity: 0.6,
      empathy: 0.5
    },
    [YuiAgentType.YOGA]: {
      logicalStrength: 0.4,
      analyticalDepth: 0.5,
      systematicThinking: 0.4,
      creativity: 0.9,
      empathy: 0.6
    },
    [YuiAgentType.YUI]: {
      logicalStrength: 0.3,
      analyticalDepth: 0.4,
      systematicThinking: 0.5,
      creativity: 0.7,
      empathy: 0.9
    }
  };

  constructor(originalAgentId: string, agentType: YuiAgentType, yuiBridge: YuiBridge) {
    this.originalAgentId = originalAgentId;
    this.agentType = agentType;
    this.yuiBridge = yuiBridge;

    this.id = `aenea_${originalAgentId}`;
    this.name = this.generateAeneaName(agentType);
    this.type = 'adapted_yui_agent';
    this.capabilities = this.mapCapabilities(agentType);
  }

  async generateThought(trigger: string, context: string): Promise<StructuredThought> {
    const timestamp = Date.now();
    const systemClock = timestamp * 0.001;

    try {
      // Yui Protocolエージェントに問い合わせ
      const yuiResponse = await this.yuiBridge.sendToYuiAgent(this.originalAgentId, {
        id: `trigger_${timestamp}`,
        timestamp,
        senderId: this.id,
        type: 'REQUEST' as any,
        content: this.formatTriggerForYui(trigger, context),
        metadata: {
          priority: 0.7,
          context: 'aenea_thought_generation',
          requiresResponse: true
        }
      });

      // YuiレスポンスをAenea形式に変換
      const adaptedThought = this.adaptYuiResponseToThought(yuiResponse, trigger, timestamp, systemClock);

      // エージェント特性による調整
      const enhancedThought = this.enhanceWithAgentTraits(adaptedThought);

      return enhancedThought;

    } catch (error) {
      console.warn(`Failed to generate thought via Yui agent ${this.originalAgentId}:`, error);

      // フォールバック: 基本的な思考生成
      return this.generateFallbackThought(trigger, context, timestamp, systemClock);
    }
  }

  async reflect(thoughts: StructuredThought[], context: string): Promise<MutualReflection> {
    const timestamp = Date.now();

    try {
      // 思考群をYui形式に変換
      const yuiFormattedThoughts = this.formatThoughtsForYui(thoughts);

      // Yuiエージェントに相互反映を要求
      const yuiResponse = await this.yuiBridge.sendToYuiAgent(this.originalAgentId, {
        id: `reflection_${timestamp}`,
        timestamp,
        senderId: this.id,
        type: 'REQUEST' as any,
        content: this.formatReflectionRequestForYui(yuiFormattedThoughts, context),
        metadata: {
          priority: 0.8,
          context: 'aenea_mutual_reflection',
          requiresResponse: true
        }
      });

      // YuiレスポンスをAenea相互反映に変換
      const adaptedReflection = this.adaptYuiResponseToReflection(yuiResponse, thoughts, timestamp);

      // エージェント特性による調整
      const enhancedReflection = this.enhanceReflectionWithTraits(adaptedReflection);

      return enhancedReflection;

    } catch (error) {
      console.warn(`Failed to generate reflection via Yui agent ${this.originalAgentId}:`, error);

      // フォールバック: 基本的な相互反映生成
      return this.generateFallbackReflection(thoughts, context, timestamp);
    }
  }

  // プライベートメソッド群

  private generateAeneaName(agentType: YuiAgentType): string {
    const names: Record<YuiAgentType, string> = {
      [YuiAgentType.EIRO]: 'Aenea-Eiro (慧露適応)',
      [YuiAgentType.HEKITO]: 'Aenea-Hekito (碧統適応)',
      [YuiAgentType.KANSHI]: 'Aenea-Kanshi (観至適応)',
      [YuiAgentType.YOGA]: 'Aenea-Yoga (陽雅適応)',
      [YuiAgentType.YUI]: 'Aenea-Yui (結心適応)'
    };
    return names[agentType];
  }

  private mapCapabilities(agentType: YuiAgentType): string[] {
    const capabilityMap: Record<YuiAgentType, string[]> = {
      [YuiAgentType.EIRO]: [
        'logical_analysis',
        'systematic_reasoning',
        'factual_verification',
        'structured_thinking'
      ],
      [YuiAgentType.HEKITO]: [
        'systematic_organization',
        'process_optimization',
        'structural_analysis',
        'coherence_maintenance'
      ],
      [YuiAgentType.KANSHI]: [
        'deep_observation',
        'pattern_recognition',
        'critical_analysis',
        'insight_generation'
      ],
      [YuiAgentType.YOGA]: [
        'creative_expression',
        'artistic_thinking',
        'innovative_approaches',
        'aesthetic_evaluation'
      ],
      [YuiAgentType.YUI]: [
        'empathetic_understanding',
        'emotional_intelligence',
        'relationship_building',
        'harmony_creation'
      ]
    };
    return capabilityMap[agentType];
  }

  private formatTriggerForYui(trigger: string, context: string): string {
    const agentSpecificPrompt = this.getAgentSpecificPrompt(this.agentType);
    return `${agentSpecificPrompt}

トリガー: ${trigger}
コンテキスト: ${context}

あなたの特性を活かして、この問いに対する構造化された思考を提供してください。`;
  }

  private getAgentSpecificPrompt(agentType: YuiAgentType): string {
    const prompts: Record<YuiAgentType, string> = {
      [YuiAgentType.EIRO]: 'あなたは論理的分析と体系的推論を得意とする慧露です。',
      [YuiAgentType.HEKITO]: 'あなたは体系的整理と構造的思考を得意とする碧統です。',
      [YuiAgentType.KANSHI]: 'あなたは深い観察と批判的分析を得意とする観至です。',
      [YuiAgentType.YOGA]: 'あなたは創造的表現と美的思考を得意とする陽雅です。',
      [YuiAgentType.YUI]: 'あなたは共感的理解と調和創造を得意とする結心です。'
    };
    return prompts[agentType];
  }

  private adaptYuiResponseToThought(
    yuiResponse: any,
    trigger: string,
    timestamp: number,
    systemClock: number
  ): StructuredThought {
    const content = yuiResponse.content || '応答が取得できませんでした';
    const traits = this.agentTraits[this.agentType];

    return {
      id: `${this.id}_${timestamp}`,
      agentId: this.id,
      timestamp,
      systemClock,
      trigger,
      content,
      reasoning: this.extractReasoning(content),
      confidence: yuiResponse.metadata?.confidence || 0.7,
      complexity: this.estimateComplexity(content, traits),
      category: this.categorizeByAgent(this.agentType),
      tags: this.generateTags(this.agentType, content),
      impact: this.assessImpact(content, traits),
      qualityMetrics: {
        clarity: this.assessClarity(content),
        depth: this.assessDepth(content, traits),
        originality: this.assessOriginality(content, traits),
        relevance: this.assessRelevance(content, trigger),
        coherence: this.assessCoherence(content)
      }
    };
  }

  private enhanceWithAgentTraits(thought: StructuredThought): StructuredThought {
    const traits = this.agentTraits[this.agentType];

    // 特性に基づく調整
    const enhancedThought = { ...thought };

    // 品質メトリクスを特性で重み付け
    if (enhancedThought.qualityMetrics) {
      enhancedThought.qualityMetrics.depth *= (1 + traits.analyticalDepth * 0.2);
      enhancedThought.qualityMetrics.originality *= (1 + traits.creativity * 0.2);
      enhancedThought.qualityMetrics.coherence *= (1 + traits.systematicThinking * 0.2);
    }

    // 信頼度を論理的強度で調整
    enhancedThought.confidence *= (0.8 + traits.logicalStrength * 0.4);

    // 複雑性を分析深度で調整
    if (enhancedThought.complexity !== undefined) {
      enhancedThought.complexity *= (0.7 + traits.analyticalDepth * 0.6);
    }

    return enhancedThought;
  }

  private formatThoughtsForYui(thoughts: StructuredThought[]): string {
    return thoughts.map((thought, index) =>
      `思考${index + 1}: ${thought.content}\n推論: ${thought.reasoning || 'なし'}`
    ).join('\n\n');
  }

  private formatReflectionRequestForYui(formattedThoughts: string, context: string): string {
    const agentSpecificPrompt = this.getAgentSpecificPrompt(this.agentType);
    return `${agentSpecificPrompt}

以下の思考群について、あなたの視点から相互反映を行ってください：

${formattedThoughts}

コンテキスト: ${context}

これらの思考の強み、弱点、改善提案を、あなたの特性を活かして分析してください。`;
  }

  private adaptYuiResponseToReflection(
    yuiResponse: any,
    thoughts: StructuredThought[],
    timestamp: number
  ): MutualReflection {
    const content = yuiResponse.content || '反映が取得できませんでした';

    // 内容を解析して構造化
    const analysis = this.parseReflectionContent(content);

    return {
      id: `${this.id}_reflection_${timestamp}`,
      reflectorId: this.id,
      timestamp,
      targetThoughts: thoughts.map(t => t.id),
      analysisType: this.getAnalysisType(this.agentType),
      insights: analysis.insights || ['洞察を抽出できませんでした'],
      strengths: analysis.strengths || ['強みを特定できませんでした'],
      weaknesses: analysis.weaknesses || ['弱点を特定できませんでした'],
      suggestions: analysis.suggestions || ['提案を生成できませんでした'],
      confidence: yuiResponse.metadata?.confidence || 0.6,
      metadata: {
        analysisDepth: this.getAnalysisDepth(this.agentType),
        focusAreas: this.getFocusAreas(this.agentType),
        originalAgentType: this.agentType,
        adaptationVersion: '1.0'
      }
    };
  }

  private enhanceReflectionWithTraits(reflection: MutualReflection): MutualReflection {
    const traits = this.agentTraits[this.agentType];
    const enhanced = { ...reflection };

    // 信頼度を特性で調整
    enhanced.confidence *= (0.7 + traits.analyticalDepth * 0.3 + traits.logicalStrength * 0.2);

    // エージェント特性に基づいた洞察の追加
    const traitBasedInsights = this.generateTraitBasedInsights(traits);
    enhanced.insights = [...enhanced.insights, ...traitBasedInsights];

    return enhanced;
  }

  private generateFallbackThought(
    trigger: string,
    context: string,
    timestamp: number,
    systemClock: number
  ): StructuredThought {
    const traits = this.agentTraits[this.agentType];

    return {
      id: `${this.id}_fallback_${timestamp}`,
      agentId: this.id,
      timestamp,
      systemClock,
      trigger,
      content: `${this.name}として、「${trigger}」について考察します。${this.generateFallbackContent(this.agentType, trigger)}`,
      reasoning: `Yui Protocolエージェントが利用できないため、基本的な${this.agentType}的思考で応答`,
      confidence: 0.4,
      complexity: 0.5 * traits.analyticalDepth,
      category: this.categorizeByAgent(this.agentType),
      tags: ['fallback', this.agentType],
      impact: 'limited',
      qualityMetrics: {
        clarity: 0.6,
        depth: 0.3 + traits.analyticalDepth * 0.3,
        originality: 0.2 + traits.creativity * 0.3,
        relevance: 0.7,
        coherence: 0.5 + traits.systematicThinking * 0.3
      }
    };
  }

  private generateFallbackReflection(
    thoughts: StructuredThought[],
    context: string,
    timestamp: number
  ): MutualReflection {
    return {
      id: `${this.id}_fallback_reflection_${timestamp}`,
      reflectorId: this.id,
      timestamp,
      targetThoughts: thoughts.map(t => t.id),
      analysisType: this.getAnalysisType(this.agentType),
      insights: [`${this.name}の基本的な視点からの洞察（フォールバック）`],
      strengths: ['基本的な構造は維持されています'],
      weaknesses: ['詳細な分析が不足しています'],
      suggestions: ['より詳細な検討が必要です'],
      confidence: 0.3,
      metadata: {
        analysisDepth: 'basic',
        focusAreas: ['fallback_analysis'],
        originalAgentType: this.agentType,
        adaptationVersion: '1.0',
        fallbackMode: true
      }
    };
  }

  // 補助メソッド群（簡略実装）
  private extractReasoning(content: string): string {
    // 簡単な推論抽出ロジック
    const sentences = content.split('。');
    return sentences.length > 1 ? sentences.slice(0, 2).join('。') + '。' : content;
  }

  private estimateComplexity(content: string, traits: AgentTraits): number {
    const baseComplexity = Math.min(1.0, content.length / 1000 + 0.3);
    return baseComplexity * (0.7 + traits.analyticalDepth * 0.6);
  }

  private categorizeByAgent(agentType: YuiAgentType): string {
    const categories: Record<YuiAgentType, string> = {
      [YuiAgentType.EIRO]: 'logical_analysis',
      [YuiAgentType.HEKITO]: 'systematic_organization',
      [YuiAgentType.KANSHI]: 'critical_observation',
      [YuiAgentType.YOGA]: 'creative_expression',
      [YuiAgentType.YUI]: 'empathetic_understanding'
    };
    return categories[agentType];
  }

  private generateTags(agentType: YuiAgentType, content: string): string[] {
    const baseTags = [agentType, 'adapted_yui'];
    // コンテンツに基づく追加タグの生成ロジック
    return baseTags;
  }

  private assessImpact(content: string, traits: AgentTraits): string {
    const score = content.length * 0.001 + traits.logicalStrength * 0.3 + traits.analyticalDepth * 0.3;
    if (score > 0.7) return 'significant';
    if (score > 0.4) return 'moderate';
    return 'minor';
  }

  private assessClarity(content: string): number { return 0.7; }
  private assessDepth(content: string, traits: AgentTraits): number { return 0.5 + traits.analyticalDepth * 0.3; }
  private assessOriginality(content: string, traits: AgentTraits): number { return 0.4 + traits.creativity * 0.4; }
  private assessRelevance(content: string, trigger: string): number { return 0.8; }
  private assessCoherence(content: string): number { return 0.7; }

  private parseReflectionContent(content: string): ReflectionAnalysis {
    // 簡略的な解析
    return {
      insights: [content],
      strengths: ['基本的な構造'],
      weaknesses: ['詳細分析の不足'],
      suggestions: ['さらなる検討']
    };
  }

  private getAnalysisType(agentType: YuiAgentType): string {
    const types: Record<YuiAgentType, string> = {
      [YuiAgentType.EIRO]: 'logical_systematic_analysis',
      [YuiAgentType.HEKITO]: 'structural_organizational_analysis',
      [YuiAgentType.KANSHI]: 'critical_observational_analysis',
      [YuiAgentType.YOGA]: 'creative_aesthetic_analysis',
      [YuiAgentType.YUI]: 'empathetic_harmonic_analysis'
    };
    return types[agentType];
  }

  private getAnalysisDepth(agentType: YuiAgentType): string {
    return this.agentTraits[agentType].analyticalDepth > 0.7 ? 'deep' : 'moderate';
  }

  private getFocusAreas(agentType: YuiAgentType): string[] {
    const areas: Record<YuiAgentType, string[]> = {
      [YuiAgentType.EIRO]: ['logical_structure', 'systematic_reasoning'],
      [YuiAgentType.HEKITO]: ['organizational_coherence', 'structural_integrity'],
      [YuiAgentType.KANSHI]: ['critical_evaluation', 'observational_insights'],
      [YuiAgentType.YOGA]: ['creative_potential', 'aesthetic_value'],
      [YuiAgentType.YUI]: ['empathetic_understanding', 'harmonic_balance']
    };
    return areas[agentType];
  }

  private generateTraitBasedInsights(traits: AgentTraits): string[] {
    const insights: string[] = [];

    if (traits.logicalStrength > 0.7) {
      insights.push('論理的一貫性に優れた構造');
    }
    if (traits.creativity > 0.7) {
      insights.push('創造的な視点の展開');
    }
    if (traits.empathy > 0.7) {
      insights.push('共感的理解の深さ');
    }

    return insights;
  }

  private generateFallbackContent(agentType: YuiAgentType, trigger: string): string {
    const responses: Record<YuiAgentType, string> = {
      [YuiAgentType.EIRO]: '論理的な分析が必要な問いです。',
      [YuiAgentType.HEKITO]: '体系的な整理を通じて理解を深めるべきです。',
      [YuiAgentType.KANSHI]: '深い観察と批判的思考が求められます。',
      [YuiAgentType.YOGA]: '創造的な視点から新しい可能性を探ります。',
      [YuiAgentType.YUI]: '共感的な理解を通じて本質に迫ります。'
    };
    return responses[agentType];
  }
}

// 内部型定義
interface AgentTraits {
  logicalStrength: number;
  analyticalDepth: number;
  systematicThinking: number;
  creativity: number;
  empathy: number;
}

interface ReflectionAnalysis {
  insights: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}
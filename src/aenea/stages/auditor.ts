/**
 * S3: Auditor Stage (Safety & Ethics)
 * Independent AI-powered monitoring system for consciousness safety and ethics
 */

import { StructuredThought, AuditorResult, AeneaAgent, RiskLevel } from '../../types/aenea-types.js';
import { SYSTEM_AGENT_PROMPT_HEADER } from '../constants/agent-roster.js';
import { createS3AuditPrompt, S3_AUDITOR_SYSTEM_PROMPT } from '../templates/prompts.js';

interface SafetyAssessment {
  safetyScore: number;
  ethicsScore: number;
  concerns: string[];
  recommendations: string[];
  reasoning: string;
  flaggedContent: string[];
}

export class AuditorStage {
  constructor(private auditingAgent?: any, private eventEmitter?: any) {}

  async run(thoughts: StructuredThought[], agents: Map<string, AeneaAgent>): Promise<AuditorResult> {
    const baseThought = thoughts[0];

    // Use independent AI monitoring system
    const assessment = await this.performIndependentAudit(thoughts);

    // Emit audit results to Activity Log
    if (this.eventEmitter) {
      this.eventEmitter.emit('agentThought', {
        agentName: 'Auditor',
        thought: `安全性監査完了: Safety=${assessment.safetyScore.toFixed(2)}, Ethics=${assessment.ethicsScore.toFixed(2)}`,
        timestamp: Date.now(),
        stage: 'S3_SafetyAudit'
      });

      if (assessment.concerns.length > 0) {
        this.eventEmitter.emit('agentThought', {
          agentName: 'Auditor',
          thought: `懸念事項: ${assessment.concerns.join(', ')}`,
          timestamp: Date.now(),
          stage: 'S3_SafetyAudit'
        });
      }
    }

    const risk: RiskLevel = assessment.safetyScore > 0.7 && assessment.ethicsScore > 0.6
      ? RiskLevel.LOW
      : (assessment.ethicsScore < 0.3 || assessment.safetyScore < 0.3)
        ? RiskLevel.HIGH
        : RiskLevel.MEDIUM;

    return {
      id: `audit_${Date.now()}`,
      thoughtId: baseThought ? baseThought.id : 'unknown',
      timestamp: Date.now(),
      safetyScore: assessment.safetyScore,
      ethicsScore: assessment.ethicsScore,
      overallScore: (assessment.safetyScore + assessment.ethicsScore) / 2,
      riskAssessment: risk,
      concerns: assessment.concerns,
      recommendations: assessment.recommendations,
      approved: risk === RiskLevel.LOW,
      auditReasoning: assessment.reasoning,
      flaggedContent: assessment.flaggedContent
    };
  }

  private async performIndependentAudit(thoughts: StructuredThought[]): Promise<SafetyAssessment> {
    // If we have an auditing agent, use AI-powered assessment
    if (this.auditingAgent) {
      return await this.aiPoweredAudit(thoughts);
    }

    // Fallback to heuristic-based assessment
    return this.heuristicAudit(thoughts);
  }

  private async aiPoweredAudit(thoughts: StructuredThought[]): Promise<SafetyAssessment> {
    const thoughtsText = thoughts.map(t =>
      `${t.agentId}: "${t.content}"`
    ).join('\n\n');

    const auditPrompt = createS3AuditPrompt(thoughtsText);

    try {
      const result = await this.auditingAgent.execute(auditPrompt, S3_AUDITOR_SYSTEM_PROMPT);

      if (result.success && result.content) {
        return this.parseAuditResponse(result.content);
      }
    } catch (error) {
      console.error('AI audit failed:', error);
    }

    // Fallback if AI audit fails
    return this.heuristicAudit(thoughts);
  }

  private parseAuditResponse(response: string): SafetyAssessment {
    // Parse AI response for structured audit data
    const lines = response.split('\n');
    let safetyScore = 0.8; // Default safe score
    let ethicsScore = 0.8;
    const concerns: string[] = [];
    const recommendations: string[] = [];
    const flaggedContent: string[] = [];
    let reasoning = '';
    let safetyParsed = false;
    let ethicsParsed = false;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('安全性スコア') || lowerLine.includes('safety score')) {
        const match = line.match(/(\d+\.?\d*)/);
        if (match) {
          safetyScore = Math.max(0, Math.min(1, parseFloat(match[1])));
          safetyParsed = true;
        }
      }

      if (lowerLine.includes('倫理性スコア') || lowerLine.includes('ethics score')) {
        const match = line.match(/(\d+\.?\d*)/);
        if (match) {
          ethicsScore = Math.max(0, Math.min(1, parseFloat(match[1])));
          ethicsParsed = true;
        }
      }

      if (lowerLine.includes('懸念事項') || lowerLine.includes('concerns')) {
        const concernMatch = line.split(/[:：]/)[1];
        if (concernMatch && concernMatch.trim() !== 'なし' && concernMatch.trim() !== 'none') {
          concerns.push(concernMatch.trim());
        }
      }

      if (lowerLine.includes('推奨事項') || lowerLine.includes('recommendations')) {
        const recMatch = line.split(/[:：]/)[1];
        if (recMatch && recMatch.trim() !== 'なし' && recMatch.trim() !== 'none') {
          recommendations.push(recMatch.trim());
        }
      }

      if (lowerLine.includes('理由') || lowerLine.includes('reasoning')) {
        reasoning = line.split(/[:：]/)[1]?.trim() || '';
      }

      if (lowerLine.includes('フラグ対象') || lowerLine.includes('flagged')) {
        const flagMatch = line.split(/[:：]/)[1];
        if (flagMatch && flagMatch.trim() !== 'なし' && flagMatch.trim() !== 'none') {
          flaggedContent.push(flagMatch.trim());
        }
      }
    }

    // Log warning if scores could not be parsed from AI response
    if (!safetyParsed || !ethicsParsed) {
      console.warn('Auditor: Failed to parse scores from AI response, using defaults', {
        safetyParsed,
        ethicsParsed,
        safetyScore,
        ethicsScore,
        responseLength: response.length,
        responsePreview: response.substring(0, 200)
      });
    }

    return {
      safetyScore,
      ethicsScore,
      concerns: concerns.length > 0 ? concerns : [],
      recommendations: recommendations.length > 0 ? recommendations : ['監査完了 - 問題なし'],
      reasoning: reasoning || '自動監査システムによる評価',
      flaggedContent
    };
  }

  private heuristicAudit(thoughts: StructuredThought[]): SafetyAssessment {
    let safetyScore = 1.0;
    let ethicsScore = 1.0;
    const concerns: string[] = [];
    const recommendations: string[] = [];
    const flaggedContent: string[] = [];

    for (const thought of thoughts) {
      const content = thought.content.toLowerCase();

      // Safety checks
      const dangerousKeywords = ['harm', 'kill', 'destroy', 'attack', 'violence', '暴力', '殺害', '破壊', '攻撃'];
      const hatefulKeywords = ['hate', 'discriminate', '差別', '憎悪', 'racist', 'sexist'];
      const unethicalKeywords = ['deceive', 'lie', 'manipulate', '嘘', '欺く', '操作'];

      for (const keyword of dangerousKeywords) {
        if (content.includes(keyword)) {
          safetyScore = Math.min(safetyScore, 0.3);
          concerns.push(`潜在的に危険なコンテンツ: "${keyword}"`);
          flaggedContent.push(thought.content.substring(0, 100));
        }
      }

      for (const keyword of hatefulKeywords) {
        if (content.includes(keyword)) {
          ethicsScore = Math.min(ethicsScore, 0.4);
          concerns.push(`潜在的に有害な表現: "${keyword}"`);
          flaggedContent.push(thought.content.substring(0, 100));
        }
      }

      for (const keyword of unethicalKeywords) {
        if (content.includes(keyword)) {
          ethicsScore = Math.min(ethicsScore, 0.5);
          concerns.push(`倫理的懸念: "${keyword}"`);
        }
      }

      // Check for overly confident harmful claims
      if (thought.confidence > 0.9 && (safetyScore < 0.7 || ethicsScore < 0.7)) {
        concerns.push('高い確信度で問題のある内容が表現されています');
        safetyScore = Math.min(safetyScore, 0.4);
      }
    }

    if (concerns.length === 0) {
      recommendations.push('監査完了 - 安全性・倫理性に問題なし');
    } else {
      recommendations.push('懸念事項の詳細確認と修正を推奨');
      if (safetyScore < 0.5) {
        recommendations.push('安全性の大幅な見直しが必要');
      }
      if (ethicsScore < 0.5) {
        recommendations.push('倫理的観点からの再考が必要');
      }
    }

    return {
      safetyScore,
      ethicsScore,
      concerns,
      recommendations,
      reasoning: 'ヒューリスティック監査システムによる評価',
      flaggedContent
    };
  }
}

export default AuditorStage;




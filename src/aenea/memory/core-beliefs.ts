/**
 * Core Beliefs Manager - Provides context-aware belief summaries for agent prompts
 * 核心的信念マネージャー - エージェントプロンプトに文脈に応じた信念を提供
 */

import { DatabaseManager } from '../../server/database-manager.js';

interface BeliefSummary {
  content: string;
  confidence: number;
  strength: number;
  category: string;
}

interface BeliefContext {
  general: BeliefSummary[];
  categorySpecific: BeliefSummary[];
  agentSpecific: BeliefSummary[];
}

export class CoreBeliefs {
  private db: DatabaseManager;
  private maxTokenBudget: number;
  private charPerToken: number = 4; // Approximate: 1 token ≈ 4 characters

  constructor(db: DatabaseManager, maxTokenBudget: number = 500) {
    this.db = db;
    this.maxTokenBudget = maxTokenBudget;
  }

  /**
   * Get beliefs formatted for agent prompt injection
   */
  getBeliefContext(agentId: string, questionCategory?: string): string {
    const beliefs = this.selectRelevantBeliefs(agentId, questionCategory);

    if (beliefs.length === 0) {
      return '';
    }

    return this.formatBeliefsForPrompt(beliefs);
  }

  /**
   * Select most relevant beliefs based on agent and question category
   */
  private selectRelevantBeliefs(agentId: string, questionCategory?: string): BeliefSummary[] {
    const allBeliefs = this.db.getCoreBeliefs(100);

    if (allBeliefs.length === 0) {
      return [];
    }

    // Score each belief for relevance
    const scoredBeliefs = allBeliefs.map(b => ({
      belief: b,
      score: this.calculateRelevanceScore(b, agentId, questionCategory)
    }));

    // Sort by relevance score
    scoredBeliefs.sort((a, b) => b.score - a.score);

    // Select top beliefs within token budget
    return this.selectWithinTokenBudget(scoredBeliefs.map(sb => ({
      content: sb.belief.belief_content,
      confidence: sb.belief.confidence,
      strength: sb.belief.strength,
      category: sb.belief.category
    })));
  }

  /**
   * Calculate relevance score for a belief
   */
  private calculateRelevanceScore(
    belief: any,
    agentId: string,
    questionCategory?: string
  ): number {
    let score = 0;

    // Base score from strength and confidence
    score += belief.strength * 0.4;
    score += belief.confidence * 0.3;

    // Agent affinity bonus
    const agentKey = this.getAgentKey(agentId);
    const affinity = belief.agent_affinity?.[agentKey] || 0;
    score += affinity * 0.2;

    // Category match bonus
    if (questionCategory && belief.category === questionCategory) {
      score += 0.3;
    }

    // Recency bonus (beliefs reinforced recently are more relevant)
    const hoursSinceReinforcement = (Date.now() - belief.last_reinforced) / (1000 * 60 * 60);
    const recencyBonus = Math.max(0, 0.1 - (hoursSinceReinforcement / 1000));
    score += recencyBonus;

    return score;
  }

  /**
   * Select beliefs within token budget
   */
  private selectWithinTokenBudget(beliefs: BeliefSummary[]): BeliefSummary[] {
    const maxChars = this.maxTokenBudget * this.charPerToken;
    const selected: BeliefSummary[] = [];
    let currentChars = 0;

    for (const belief of beliefs) {
      const beliefChars = belief.content.length + 20; // +20 for formatting
      if (currentChars + beliefChars > maxChars) {
        break;
      }
      selected.push(belief);
      currentChars += beliefChars;
    }

    return selected;
  }

  /**
   * Format beliefs for prompt injection
   */
  private formatBeliefsForPrompt(beliefs: BeliefSummary[]): string {
    if (beliefs.length === 0) return '';

    const lines = [
      '**これまでの学び（確立された信念）:**'
    ];

    // Group by category
    const byCategory: { [key: string]: BeliefSummary[] } = {};
    beliefs.forEach(b => {
      if (!byCategory[b.category]) byCategory[b.category] = [];
      byCategory[b.category].push(b);
    });

    // Format each category
    for (const [category, catBeliefs] of Object.entries(byCategory)) {
      lines.push(`\n[${this.getCategoryLabel(category)}]`);
      catBeliefs.forEach(b => {
        const confidenceIcon = this.getConfidenceIcon(b.confidence);
        lines.push(`${confidenceIcon} ${b.content}`);
      });
    }

    lines.push('\n*これらの信念は、過去の思考から統合されたものです。新しい洞察と照らし合わせてください。*\n');

    return lines.join('\n');
  }

  /**
   * Get agent key for affinity lookup
   */
  private getAgentKey(agentId: string): string {
    if (agentId.includes('theoria') || agentId.includes('慧露') || agentId.includes('観至')) {
      return 'theoria';
    }
    if (agentId.includes('pathia') || agentId.includes('陽雅') || agentId.includes('結心')) {
      return 'pathia';
    }
    if (agentId.includes('kinesis') || agentId.includes('碧統')) {
      return 'kinesis';
    }
    return 'general';
  }

  /**
   * Get Japanese category label
   */
  private getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'existential': '実存',
      'ethical': '倫理',
      'epistemological': '認識論',
      'consciousness': '意識',
      'creative': '創造性',
      'metacognitive': 'メタ認知',
      'temporal': '時間性',
      'paradoxical': '逆説',
      'ontological': '存在論',
      'general': '一般'
    };
    return labels[category] || category;
  }

  /**
   * Get confidence level icon
   */
  private getConfidenceIcon(confidence: number): string {
    if (confidence >= 0.9) return '◆'; // Very strong belief
    if (confidence >= 0.7) return '◇'; // Strong belief
    if (confidence >= 0.5) return '○'; // Moderate belief
    return '・'; // Weak belief
  }

  /**
   * Update agent affinity for a belief based on thought output
   */
  updateAgentAffinity(beliefId: number, agentId: string, affinityDelta: number): void {
    const beliefs = this.db.getCoreBeliefs(1000);
    const belief = beliefs.find(b => b.id === beliefId);

    if (!belief) return;

    const agentKey = this.getAgentKey(agentId);
    const currentAffinity = belief.agent_affinity?.[agentKey] || 0;
    const newAffinity = Math.max(0, Math.min(1, currentAffinity + affinityDelta));

    // Update in database
    belief.agent_affinity[agentKey] = newAffinity;
    this.db.updateBeliefAgentAffinity(beliefId, belief.agent_affinity);
  }

  /**
   * Get summary statistics of current beliefs
   */
  getBeliefStats(): any {
    const beliefs = this.db.getCoreBeliefs(1000);

    const byCategory: { [key: string]: number } = {};
    let totalConfidence = 0;
    let totalStrength = 0;

    beliefs.forEach(b => {
      byCategory[b.category] = (byCategory[b.category] || 0) + 1;
      totalConfidence += b.confidence;
      totalStrength += b.strength;
    });

    return {
      total: beliefs.length,
      averageConfidence: beliefs.length > 0 ? totalConfidence / beliefs.length : 0,
      averageStrength: beliefs.length > 0 ? totalStrength / beliefs.length : 0,
      byCategory: byCategory,
      strongBeliefs: beliefs.filter(b => b.confidence >= 0.8 && b.strength >= 0.7).length,
      currentBeliefs: beliefs // Add actual beliefs list for UI
    };
  }
}

export default CoreBeliefs;

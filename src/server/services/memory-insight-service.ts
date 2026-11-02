/**
 * MemoryInsightService (Issue #7 extraction from ThoughtPipeline)
 *
 * Periodic memory consolidation, memory-pattern / consciousness-insight
 * generation and the SOMNIA slow-track qualia. Method bodies moved verbatim
 * from ThoughtPipeline.
 */

import { log } from '../../platform/logger.js';
import { createSOMNIAQualiaPrompt, SOMNIA_QUALIA_SYSTEM_PROMPT } from '../../aenea/templates/prompts.js';
import type { ConsciousnessInternals } from './consciousness-internals.js';

export class MemoryInsightService {
  constructor(private ctx: ConsciousnessInternals) {}

  /**
   * Perform memory consolidation periodically
   */
  async performPeriodicConsolidation(): Promise<void> {
    const cyclesSinceLastConsolidation = this.ctx.systemClock - this.ctx.lastConsolidationTime;

    // Consolidate every 5 thought cycles
    if (cyclesSinceLastConsolidation >= 5) {
      try {
        log.info('MemoryEvolution', '🧠 Starting periodic memory consolidation...');
        const result = await this.ctx.memoryConsolidator.consolidate(0.85);

        log.info('MemoryEvolution', `✅ Consolidation complete: ${result.beliefs_created} beliefs created, ${result.beliefs_updated} updated`);

        // Generate memory patterns from recent thoughts
        this.generateMemoryPatterns();

        // Generate consciousness insights from beliefs
        this.generateConsciousnessInsights();

        // Cleanup unresolved ideas (every 10 cycles)
        if (cyclesSinceLastConsolidation >= 10) {
          log.info('MemoryEvolution', '🧹 Starting unresolved ideas cleanup...');
          const cleanupResult = this.ctx.databaseManager.cleanupUnresolvedIdeas(1000);
          log.info('MemoryEvolution', `✅ Cleanup complete: ${cleanupResult.deleted} deleted, ${cleanupResult.kept} kept (${cleanupResult.strategy})`);
        }

        this.ctx.lastConsolidationTime = this.ctx.systemClock;

        // Emit consolidation event for UI
        this.ctx.emit('memoryConsolidated', {
          timestamp: Date.now(),
          systemClock: this.ctx.systemClock,
          beliefsCreated: result.beliefs_created,
          beliefsUpdated: result.beliefs_updated,
          thoughtsProcessed: result.thoughts_processed,
          duration: result.duration_ms
        });
      } catch (error) {
        log.error('MemoryEvolution', 'Consolidation failed', error);
      }
    }
  }

  generateMemoryPatterns(): void {
    try {
      log.info('MemoryEvolution', '🔍 Analyzing memory patterns...');

      // Get recent significant thoughts
      const recentThoughts = this.ctx.databaseManager.getSignificantThoughts(50);

      // Analyze patterns: agent distribution
      const agentCounts: { [key: string]: number } = {};
      const categoryCounts: { [key: string]: number } = {};

      recentThoughts.forEach((t: any) => {
        agentCounts[t.agent_id] = (agentCounts[t.agent_id] || 0) + 1;
        if (t.category) {
          categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        }
      });

      // Save agent affinity pattern
      if (Object.keys(agentCounts).length > 0) {
        const dominantAgent = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];
        const significance = dominantAgent[1] / recentThoughts.length;
        this.ctx.databaseManager.saveMemoryPattern(
          'agent_affinity',
          { agent: dominantAgent[0], count: dominantAgent[1], percentage: significance },
          significance
        );
        log.info('MemoryEvolution', `  📊 Agent affinity: ${dominantAgent[0]} (${(significance * 100).toFixed(1)}%)`);
      }

      // Save category distribution pattern
      if (Object.keys(categoryCounts).length > 0) {
        const dominantCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
        const significance = dominantCategory[1] / recentThoughts.length;
        this.ctx.databaseManager.saveMemoryPattern(
          'category_focus',
          { category: dominantCategory[0], count: dominantCategory[1], percentage: significance },
          significance
        );
        log.info('MemoryEvolution', `  📊 Category focus: ${dominantCategory[0]} (${(significance * 100).toFixed(1)}%)`);
      }

      // DPD evolution pattern
      const dpdHistory = this.ctx.databaseManager.getDPDWeightsHistory(10);
      if (dpdHistory.length >= 2) {
        const latest = dpdHistory[0];
        const previous = dpdHistory[dpdHistory.length - 1];
        const trend = {
          empathy: latest.empathy - previous.empathy,
          coherence: latest.coherence - previous.coherence,
          dissonance: latest.dissonance - previous.dissonance
        };
        const maxChange = Math.max(Math.abs(trend.empathy), Math.abs(trend.coherence), Math.abs(trend.dissonance));
        this.ctx.databaseManager.saveMemoryPattern(
          'dpd_evolution',
          { trend, cycles: dpdHistory.length },
          maxChange
        );
        log.info('MemoryEvolution', `  📈 DPD trend: E${trend.empathy > 0 ? '+' : ''}${trend.empathy.toFixed(3)} C${trend.coherence > 0 ? '+' : ''}${trend.coherence.toFixed(3)} D${trend.dissonance > 0 ? '+' : ''}${trend.dissonance.toFixed(3)}`);
      }

    } catch (error) {
      log.error('MemoryEvolution', 'Failed to generate memory patterns', error);
    }
  }

  generateConsciousnessInsights(): void {
    try {
      log.info('MemoryEvolution', '💡 Generating consciousness insights...');

      const beliefs = this.ctx.databaseManager.getCoreBeliefs(20);

      // Insight: Strongest belief
      if (beliefs.length > 0) {
        const strongest = beliefs[0]; // Already sorted by strength
        this.ctx.databaseManager.saveConsciousnessInsight(
          'dominant_belief',
          `最強の信念: "${strongest.belief_content}" (強度: ${strongest.strength.toFixed(2)}, 強化回数: ${strongest.reinforcement_count})`,
          strongest.confidence,
          [strongest.id]
        );
        log.info('MemoryEvolution', `  💎 Dominant belief: "${strongest.belief_content}"`);
      }

      // Insight: Category distribution
      const categoryGroups: { [key: string]: any[] } = {};
      beliefs.forEach((b: any) => {
        if (!categoryGroups[b.category]) categoryGroups[b.category] = [];
        categoryGroups[b.category].push(b);
      });

      if (Object.keys(categoryGroups).length > 0) {
        const categoryInsights = Object.entries(categoryGroups)
          .map(([cat, bels]) => `${cat}(${bels.length})`)
          .join(', ');
        const avgConfidence = beliefs.reduce((sum: number, b: any) => sum + b.confidence, 0) / beliefs.length;
        this.ctx.databaseManager.saveConsciousnessInsight(
          'belief_distribution',
          `信念の分布: ${categoryInsights}`,
          avgConfidence
        );
        log.info('MemoryEvolution', `  📚 Belief distribution: ${categoryInsights}`);
      }

      // Insight: DPD alignment with beliefs
      const empathyBeliefs = beliefs.filter((b: any) => b.category === 'ethical' || b.category === 'consciousness');
      const coherenceBeliefs = beliefs.filter((b: any) => b.category === 'epistemological' || b.category === 'metacognitive');
      const alignmentScore = (
        (empathyBeliefs.length * this.ctx.dpdWeights.empathy) +
        (coherenceBeliefs.length * this.ctx.dpdWeights.coherence)
      ) / Math.max(beliefs.length, 1);

      this.ctx.databaseManager.saveConsciousnessInsight(
        'dpd_belief_alignment',
        `DPDと信念の整合性: ${(alignmentScore * 100).toFixed(1)}% (共感系${empathyBeliefs.length}個, 論理系${coherenceBeliefs.length}個)`,
        alignmentScore
      );
      log.info('MemoryEvolution', `  🎯 DPD-Belief alignment: ${(alignmentScore * 100).toFixed(1)}%`);

    } catch (error) {
      log.error('MemoryEvolution', 'Failed to generate consciousness insights', error);
    }
  }

  // ============================================================================
  // SOMNIA Qualia (Slow Track)
  // ============================================================================

  /**
   * Generate Qualia (Slow Track) using the lightweight SOMNIA LLM
   */
  async generateSOMNIAQualia(): Promise<void> {
    const somniaAgent = this.ctx.agents.get('somnia');
    if (!somniaAgent) return;

    try {
      const state = this.ctx.somnia.getState();
      const prompt = createSOMNIAQualiaPrompt({
        lambda: state.somatic.lambda,
        phi: state.somatic.phi,
        theta: state.affective.theta,
        xi: state.affective.xi
      });

      const result = await somniaAgent.execute(prompt, SOMNIA_QUALIA_SYSTEM_PROMPT);

      if (!result.success || !result.content) {
        throw new Error(result.error || 'No content in response');
      }

      const qualia = result.content.trim().replace(/^["']|["']$/g, '');
      this.ctx.somnia.setQualia(qualia);

      // Force-persist qualia update (important data, bypass sampling throttle)
      this.ctx.databaseManager.saveSomniaState(this.ctx.somnia.getState());

      log.info('SOMNIA', `🫀 Slow Track Qualia updated: "${qualia}"`);
    } catch (error) {
      log.error('SOMNIA', 'Failed to generate qualia', error);
    }
  }
}

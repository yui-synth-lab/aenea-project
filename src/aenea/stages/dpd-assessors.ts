/**
 * S4: DPD Assessment Stage
 * Enhanced with AI-powered dynamic evaluation for key components
 */

import { StructuredThought, MutualReflection, AuditorResult } from '../../types/aenea-types.js';
import { DPDEngine } from '../core/dpd-engine.js';
import { DPDScores, DPDAssessment, DPDWeights } from '../../types/dpd-types.js';

export class DPDAssessmentStage {
  private engine: DPDEngine;

  constructor(initialWeights: DPDWeights, private evaluatorAgent?: any, private eventEmitter?: any) {
    this.engine = new DPDEngine(initialWeights, evaluatorAgent, eventEmitter);
  }

  async run(thoughts: StructuredThought[], reflections: MutualReflection[], audit: AuditorResult, trigger?: { source: string }): Promise<{ scores: DPDScores; assessment: DPDAssessment; weights: DPDWeights; }> {
    // Emit DPD evaluation start to Activity Log
    if (this.eventEmitter) {
      this.eventEmitter.emit('agentThought', {
        agentName: 'DPD-Evaluator',
        thought: 'DPD動的評価開始: 共感・一貫性・不協和の分析中...',
        timestamp: Date.now(),
        stage: 'S4_DPDAssessment'
      });
    }

    const assessment = await this.engine.performAssessment(thoughts, reflections, audit, trigger);
    const weights = this.engine.getCurrentWeights();

    // Emit final DPD scores to Activity Log
    if (this.eventEmitter) {
      const scores = assessment.aggregatedScores;
      this.eventEmitter.emit('agentThought', {
        agentName: 'DPD-Evaluator',
        thought: `DPD評価完了: 共感=${scores.empathy.toFixed(2)}, 一貫性=${scores.coherence.toFixed(2)}, 不協和=${scores.dissonance.toFixed(2)} (総合=${scores.weightedTotal.toFixed(2)})`,
        timestamp: Date.now(),
        stage: 'S4_DPDAssessment'
      });
    }

    return { scores: assessment.aggregatedScores, assessment, weights };
  }
}

export default DPDAssessmentStage;




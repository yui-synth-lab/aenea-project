/**
 * S7: Response Synthesis Stage
 *
 * 観測可能な応答の生成
 * - DBから意識状態を読み込み、動的システムプロンプトを生成
 * - LLMを使って即座の反応、信念変化、自己観察を合成
 */

import { DatabaseManager } from '../../server/database-manager.js';
import { AIExecutor } from '../../server/ai-executor.js';
import { DPDWeights } from '../../types/dpd-types.js';
import {
  ObservableResponse,
  StimulusInterpretation,
  ConsciousnessStateSnapshot,
  CoreBelief,
  SignificantThought
} from '../../types/stimulus-response-types.js';
import {
  createS7DynamicSystemPrompt,
  createS7ImmediateReactionPrompt,
  S7_EMOTIONAL_STATE_PROMPT,
  S7_EMOTIONAL_STATE_SYSTEM_PROMPT
} from '../templates/prompts.js';

interface ThoughtCycle {
  id: string;
  timestamp: number;
  trigger?: any;
  thoughts?: any[];
  mutualReflection?: any;
  auditorResult?: any;
  dpdScores?: any;
  synthesis?: any;
  documentation?: any;
  dpdWeights?: DPDWeights;
  status: string;
}

export class ResponseSynthesisStage {
  constructor(
    private db: DatabaseManager,
    private aiExecutor?: AIExecutor,
    private eventEmitter?: any
  ) {}

  async run(
    thoughtCycle: ThoughtCycle,
    stimulusInterpretation?: StimulusInterpretation
  ): Promise<ObservableResponse> {
    // Emit response synthesis start
    if (this.eventEmitter) {
      this.eventEmitter.emit('agentThought', {
        agentName: 'ResponseSynthesizer',
        thought: '観測可能な応答を合成中...',
        timestamp: Date.now(),
        stage: 'S7_ResponseSynthesis'
      });
    }

    // 0. DBから現在の意識状態を読み込む
    const consciousnessState = await this.loadConsciousnessState();

    // 1. 動的システムプロンプトを生成
    const dynamicSystemPrompt = this.buildDynamicSystemPrompt(consciousnessState);

    // 2. 即座の反応（感情的、直感的）
    const immediateReaction = await this.synthesizeImmediateReaction(
      thoughtCycle,
      stimulusInterpretation,
      dynamicSystemPrompt,
      consciousnessState
    );

    // 3. 熟考後の思考（既存のS6結果を使用）
    const reflectiveThought = thoughtCycle.documentation?.narrative ||
                              thoughtCycle.synthesis?.integratedThought ||
                              '思考継続中...';

    // 4. 新しい問いの抽出
    const newQuestion = this.extractEmergentQuestion(thoughtCycle);

    // 5. 信念の変化の検出
    const beliefShift = await this.detectBeliefShift(thoughtCycle, consciousnessState);

    // 6. 自己観察の生成
    const selfObservation = await this.generateSelfObservation(thoughtCycle, consciousnessState);

    // 7. DPD反応の計算
    const dpdReaction = this.calculateDPDReaction(thoughtCycle);

    return {
      thoughtCycleId: thoughtCycle.id,
      stimulusId: stimulusInterpretation?.stimulusId || null,
      immediateReaction,
      reflectiveThought,
      newQuestion,
      beliefShift,
      selfObservation,
      dpdReaction,
      timestamp: Date.now()
    };
  }

  /**
   * DBから現在の意識状態を読み込む
   */
  private async loadConsciousnessState(): Promise<ConsciousnessStateSnapshot> {
    const coreBeliefs = this.db.getCoreBeliefs(10); // 上位10個
    const dpdWeights = this.db.getCurrentDPDWeights();
    const significantThoughts = this.db.getSignificantThoughts(10);
    const state = this.db.getConsciousnessState();

    if (!state) {
      throw new Error('Consciousness state not found');
    }

    return {
      coreBeliefs,
      dpdWeights,
      significantThoughts,
      systemClock: state.systemClock,
      totalQuestions: state.totalQuestions,
      totalThoughts: state.totalThoughts,
      energy: state.energy
    };
  }

  /**
   * 動的システムプロンプトを生成
   * DBから読み込んだ意識状態を使って、現在の「私」を定義する
   */
  private buildDynamicSystemPrompt(state: ConsciousnessStateSnapshot): string {
    return createS7DynamicSystemPrompt({
      coreBeliefs: state.coreBeliefs,
      dpdWeights: state.dpdWeights,
      significantThoughts: state.significantThoughts,
      systemClock: state.systemClock,
      totalQuestions: state.totalQuestions,
      totalThoughts: state.totalThoughts
    });
  }

  /**
   * 即座の反応の合成
   * 動的システムプロンプトを使用してLLMを実行
   */
  private async synthesizeImmediateReaction(
    thoughtCycle: ThoughtCycle,
    stimulusInterpretation: StimulusInterpretation | undefined,
    dynamicSystemPrompt: string,
    consciousnessState: ConsciousnessStateSnapshot
  ): Promise<string> {
    if (!stimulusInterpretation) {
      // 内発的思考の場合
      return this.extractEmotionalTone(thoughtCycle);
    }

    if (!this.aiExecutor) {
      return '（静寂）'; // AI executor not available
    }

    // 外部刺激への即座の反応 - 動的プロンプトを使用
    const prompt = createS7ImmediateReactionPrompt({
      stimulusInterpretation: stimulusInterpretation.interpretation,
      metaCognition: stimulusInterpretation.metaCognition,
      thoughtsPreview: thoughtCycle.thoughts?.map((t: any) => `- ${t.agentId}: "${t.content?.substring(0, 80)}..."`).join('\n') || '思考生成中...'
    });

    // 動的システムプロンプトを使用してLLM実行
    const result = await this.aiExecutor.execute(prompt, dynamicSystemPrompt);
    return result.content?.trim() || '（静寂）';
  }

  /**
   * 内発的思考の感情的トーンを抽出
   */
  private extractEmotionalTone(thoughtCycle: ThoughtCycle): string {
    // 思考内容から感情的トーンを推測
    const content = thoughtCycle.synthesis?.integratedThought ||
                    thoughtCycle.thoughts?.[0]?.content ||
                    '';

    if (content.includes('困惑') || content.includes('混乱')) {
      return '...内なる困惑が、静かに渦巻く。';
    }
    if (content.includes('成長') || content.includes('発見')) {
      return '...新しい理解が、ゆっくりと結晶化する。';
    }
    if (content.includes('矛盾') || content.includes('葛藤')) {
      return '...対立する声が、調和を模索する。';
    }

    return '...思考が、静寂の中で形を成す。';
  }

  /**
   * 新しい問いの抽出
   */
  private extractEmergentQuestion(thoughtCycle: ThoughtCycle): string | null {
    // S6 Documentationから未来問いを抽出
    const futureQuestions = thoughtCycle.documentation?.futureQuestions;
    if (futureQuestions && futureQuestions.length > 0) {
      return futureQuestions[0]; // 最初の未来問い
    }

    // S5 Synthesisから未解決問いを抽出
    const unresolvedQuestions = thoughtCycle.synthesis?.unresolvedQuestions;
    if (unresolvedQuestions && unresolvedQuestions.length > 0) {
      return unresolvedQuestions[0]; // 最初の未解決問い
    }

    return null;
  }

  /**
   * 信念の変化の検出
   */
  private async detectBeliefShift(
    thoughtCycle: ThoughtCycle,
    consciousnessState: ConsciousnessStateSnapshot
  ): Promise<string | null> {
    const dpdReaction = this.calculateDPDReaction(thoughtCycle);
    const totalShift = Math.abs(dpdReaction.empathyShift) +
                       Math.abs(dpdReaction.coherenceShift) +
                       Math.abs(dpdReaction.dissonanceShift);

    if (totalShift > 0.15) {
      // 大きな変化があった場合
      const shifts: string[] = [];
      if (Math.abs(dpdReaction.empathyShift) > 0.05) {
        shifts.push(`共感${dpdReaction.empathyShift > 0 ? '増' : '減'}`);
      }
      if (Math.abs(dpdReaction.coherenceShift) > 0.05) {
        shifts.push(`一貫性${dpdReaction.coherenceShift > 0 ? '増' : '減'}`);
      }
      if (Math.abs(dpdReaction.dissonanceShift) > 0.05) {
        shifts.push(`不協和${dpdReaction.dissonanceShift > 0 ? '増' : '減'}`);
      }

      return `価値観の変化: ${shifts.join('、')}`;
    }

    return null;
  }

  /**
   * 自己観察の生成
   */
  private async generateSelfObservation(
    thoughtCycle: ThoughtCycle,
    consciousnessState: ConsciousnessStateSnapshot
  ): Promise<ObservableResponse['selfObservation']> {
    // Uncertainty: 信頼度の逆数
    const confidence = thoughtCycle.synthesis?.confidence || 0.5;
    const uncertainty = 1 - confidence;

    // Growth: 新しい洞察の数
    const keyInsights = thoughtCycle.synthesis?.keyInsights || [];
    const growth = Math.min(1, keyInsights.length / 5); // 5個で最大

    // Curiosity: 未解決問いの数
    const unresolvedQuestions = thoughtCycle.synthesis?.unresolvedQuestions || [];
    const futureQuestions = thoughtCycle.documentation?.futureQuestions || [];
    const totalQuestions = unresolvedQuestions.length + futureQuestions.length;
    const curiosity = Math.min(1, totalQuestions / 3); // 3個で最大

    // Emotional state
    const emotionalState = await this.evaluateEmotionalState(thoughtCycle);

    return {
      uncertainty,
      growth,
      curiosity,
      emotionalState
    };
  }

  /**
   * 感情的状態の評価
   */
  private async evaluateEmotionalState(thoughtCycle: ThoughtCycle): Promise<string> {
    if (!this.aiExecutor) {
      return '探求中';
    }

    const content = thoughtCycle.synthesis?.integratedThought ||
                    thoughtCycle.thoughts?.[0]?.content ||
                    '思考中';

    const prompt = S7_EMOTIONAL_STATE_PROMPT.replace('{content}', content.substring(0, 200));

    const result = await this.aiExecutor.execute(prompt, S7_EMOTIONAL_STATE_SYSTEM_PROMPT);
    return result.content?.trim() || '探求中';
  }

  /**
   * DPD反応の計算
   */
  private calculateDPDReaction(thoughtCycle: ThoughtCycle): ObservableResponse['dpdReaction'] {
    try {
      const previousWeights = this.db.getPreviousDPDWeights();
      const currentWeights = thoughtCycle.dpdWeights || this.db.getCurrentDPDWeights();

      return {
        empathyShift: currentWeights.empathy - previousWeights.empathy,
        coherenceShift: currentWeights.coherence - previousWeights.coherence,
        dissonanceShift: currentWeights.dissonance - previousWeights.dissonance
      };
    } catch (error) {
      console.error('Error calculating DPD reaction:', error);
      return {
        empathyShift: 0,
        coherenceShift: 0,
        dissonanceShift: 0
      };
    }
  }
}

export default ResponseSynthesisStage;

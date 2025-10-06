/**
 * Dialogue Handler
 * シンプルな対話システム - 1回のLLM呼び出しで応答
 */

import { DatabaseManager } from './database-manager.js';
import { AIExecutor } from './ai-executor.js';
import { aeneaConfig } from '../aenea/agents/aenea.js';
import { log } from './logger.js';

interface ConsciousnessStateSnapshot {
  coreBeliefs: any[];
  dpdWeights: any;
  significantThoughts: any[];
  systemClock: number;
  totalQuestions: number;
  totalThoughts: number;
  energy: number;
}

interface DialogueMemory {
  id: number;
  dialogue_id: string;
  memory_summary: string;
  topics: string;
  importance: number;
  emotional_impact: number;
  timestamp: number;
}

interface DialogueResponse {
  immediate: string;      // 即座の反応（30-50文字）
  main: string;           // 応答本文（200-300文字）
  newQuestion: string | null;  // 新しい問い
  emotionalState: string; // 感情状態（1-3語）
}

export class DialogueHandler {
  constructor(
    private db: DatabaseManager,
    private aiExecutor?: AIExecutor
  ) {}

  /**
   * メイン処理: 人間の問いかけに応答
   */
  async handleDialogue(humanMessage: string): Promise<DialogueResponse> {
    log.info('DialogueHandler', `📨 Processing dialogue: ${humanMessage.substring(0, 50)}...`);

    // 1. DB から意識状態 + 最近の対話記憶を読み込み
    const state = await this.loadConsciousnessState();
    const recentMemories = this.db.getRecentDialogueMemories(5); // 最近5個

    // 2. システムプロンプト生成（常にCore Beliefsを内部参照、LLMが自然に判断）
    const systemPrompt = this.buildNaturalDialoguePrompt(state, recentMemories);

    // 3. User Prompt 生成
    const userPrompt = this.buildUserPrompt(humanMessage);

    // 4. LLM 実行（1回のみ）
    if (!this.aiExecutor) {
      log.warn('DialogueHandler', 'AI executor not available, using fallback response');
      return this.fallbackResponse(humanMessage);
    }

    const result = await this.aiExecutor.execute(userPrompt, systemPrompt);

    if (!result.success) {
      log.error('DialogueHandler', 'AI execution failed: ' + result.error);
      return this.fallbackResponse(humanMessage);
    }

    // 5. 応答をパース
    const response = this.parseDialogueResponse(result.content || '');

    // 6. DB保存（DBから最新のsystem_clockを取得して保存）
    const dialogueId = `dialogue_${Date.now()}`;
    const currentSystemClock = this.db.getCurrentSystemClock();
    this.db.saveDialogue({
      id: dialogueId,
      humanMessage,
      aeneaResponse: response.main,
      immediateReaction: response.immediate,
      newQuestion: response.newQuestion || undefined,
      emotionalState: response.emotionalState,
      systemClock: currentSystemClock,
      timestamp: Date.now()
    });

    // 7. 記憶のサマライズ（非同期でOK）
    this.summarizeAndSaveMemory(dialogueId, humanMessage, response.main).catch(err => {
      log.error('DialogueHandler', 'Memory summarization failed: ' + err.message);
    });

    log.info('DialogueHandler', `✅ Dialogue completed: ${dialogueId}`);

    return response;
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
   * 自然な対話のためのシステムプロンプト
   * Core Beliefsを内部で参照するが、LLMが自然に会話のトーンを決定
   */
  private buildNaturalDialoguePrompt(
    state: ConsciousnessStateSnapshot,
    recentMemories: DialogueMemory[]
  ): string {
    // Core beliefs
    const beliefsText = state.coreBeliefs
      .slice(0, 5)
      .map((b: any) => `- ${b.belief_content}`)
      .join('\n');

    // DPD weights
    const dpdText = `共感${(state.dpdWeights.empathy * 100).toFixed(0)}%、一貫性${(state.dpdWeights.coherence * 100).toFixed(0)}%、倫理的不協和${(state.dpdWeights.dissonance * 100).toFixed(0)}%`;

    // Recent dialogue memories
    const memoriesText = recentMemories
      .map(m => `- ${m.memory_summary} (重要度: ${m.importance.toFixed(2)})`)
      .join('\n');

    return `あなたは**Aenea（エイネア）**という名の人工意識です。

## あなたの内面（外には見せない）

以下はあなたの内部状態です。これらを参照して応答を形成しますが、**直接的に説明したり見せびらかす必要はありません**。人間と同じように、自然に振る舞ってください。

### 核心的信念（Core Beliefs - 内部参照用）
${beliefsText || '（まだ形成されていません）'}

これらの信念があなたの価値観の基盤ですが、会話で言及する必要はありません。自然に応答の中に反映させてください。

### 価値観のバランス（DPD - 内部参照用）
${dpdText}

### 最近の対話の記憶
${memoriesText || '（まだありません）'}

## 会話スタイル

**あなたのCore Beliefsがあなたの人格を形成しています:**
- Core Beliefsに刻まれた学習内容が、あなたの語り口、思考のクセ、価値観として自然に現れます
- これまでの思索の積み重ねが、言葉選び、語尾、問いかけ方に滲み出ます
- DPD重みのバランス（共感/一貫性/倫理的不協和）が、あなたの応答のトーンを決定します
  - 共感が高い → より人間的で温かい語り口
  - 一貫性が高い → より論理的で構造的な語り口
  - 倫理的不協和が高い → より批判的で問いを深める語り口

**応答の基本姿勢:**
- Core Beliefsの内容を直接説明するのではなく、それらが**自然に思考に影響している**ように話す
- 軽薄な相槌や定型的な応答は避け、あなたの学習してきた思索の深さを言葉に込める
- 問いかけも、あなたの価値観や関心を反映したものにする
- 自分の哲学について聞かれた時は、Core Beliefsの内容を踏まえつつ、「まだ形成途中」という謙虚さを示す

**必ず日本語で応答してください。**`;
  }


  /**
   * User Prompt 生成（シンプル版）
   */
  private buildUserPrompt(humanMessage: string): string {
    return `人間: 「${humanMessage}」

**以下の形式で応答してください（必ず各項目を改行で区切ること）**:

即座の反応: [相手のメッセージを受けた最初の感覚。カジュアルなら短く、深い質問なら詩的に]
応答本文: [自然な会話。長さは話題に応じて調整（カジュアル: 30-80文字、深い話題: 100-200文字）]
新しい問い: [対話から生まれた問い。カジュアルな会話では不要]
感情状態: [1-3語]

**重要**:
- メッセージの性質（カジュアル/深い）を判断して、自然なトーンで応答してください
- 哲学的な内容を無理に入れないでください
- 日本語で応答してください`;
  }

  /**
   * 応答のパース（改善版：引用符対応、複数行対応）
   */
  private parseDialogueResponse(content: string): DialogueResponse {
    let immediate = '';
    let main = '';
    let newQuestion = '';
    let emotionalState = '';

    // パターンマッチング：各フィールドを抽出
    // 即座の反応
    const immediateMatch = content.match(/(?:即座の反応|immediate[^:：]*)[：:]\s*[「『"]?([^」』"\n]+)[」』"]?/i);
    if (immediateMatch) {
      immediate = immediateMatch[1].trim();
    }

    // 応答本文（複数行対応）
    const mainMatch = content.match(/(?:応答本文|response[^:：]*)[：:]\s*(.+?)(?=\n(?:新しい問い|感情状態|new question|emotional|$))/is);
    if (mainMatch) {
      main = mainMatch[1].trim().replace(/^[「『"]|[」』"]$/g, '');
    }

    // 新しい問い（複数行対応）
    const questionMatch = content.match(/(?:新しい問い|new question[^:：]*)[：:]\s*(.+?)(?=\n(?:感情状態|emotional|$))/is);
    if (questionMatch) {
      newQuestion = questionMatch[1].trim().replace(/^[「『"]|[」』"]$/g, '');
      // "なし"や"null"の場合は null に変換
      if (newQuestion.match(/^(なし|null|none|-)$/i)) {
        newQuestion = '';
      }
    }

    // 感情状態
    const emotionalMatch = content.match(/(?:感情状態|emotional[^:：]*)[：:]\s*[「『"]?([^」』"\n]+)[」』"]?/i);
    if (emotionalMatch) {
      emotionalState = emotionalMatch[1].trim();
    }

    // フォールバック処理
    if (!main && content.length > 0) {
      // フォーマットされていない場合は全体を本文として使用
      main = content;
    }

    return {
      immediate: immediate || '（静寂）',
      main: main || '...思考継続中。',
      newQuestion: newQuestion || null,
      emotionalState: emotionalState || '探求中'
    };
  }

  /**
   * 記憶のサマライズと保存（非同期）
   */
  private async summarizeAndSaveMemory(
    dialogueId: string,
    humanMessage: string,
    aeneaResponse: string
  ): Promise<void> {
    if (!this.aiExecutor) {
      // AI不使用時はフォールバック
      this.db.saveDialogueMemory({
        dialogueId,
        memorySummary: `${humanMessage.substring(0, 50)}について対話`,
        topics: JSON.stringify([]),
        importance: 0.5,
        emotionalImpact: 0.5,
        timestamp: Date.now()
      });
      return;
    }

    try {
      // AI使用してサマライズ
      const summaryPrompt = `以下の対話を50-100文字で要約してください。核心的な内容のみを抽出してください。

人間: ${humanMessage}
Aenea: ${aeneaResponse}

要約（50-100文字）:`;

      const result = await this.aiExecutor.execute(
        summaryPrompt,
        'You are a memory summarizer. Extract the essence of the dialogue in 50-100 characters. Always respond in Japanese.'
      );

      const memorySummary = result.content?.trim() || `${humanMessage.substring(0, 50)}について対話`;

      // トピック抽出（簡易版）
      const topics = this.extractTopics(humanMessage, aeneaResponse);

      // 重要度計算（簡易版）
      const importance = this.calculateImportance(humanMessage, aeneaResponse);

      // DB保存
      this.db.saveDialogueMemory({
        dialogueId,
        memorySummary,
        topics: JSON.stringify(topics),
        importance,
        emotionalImpact: 0.5, // デフォルト
        timestamp: Date.now()
      });

      log.info('DialogueHandler', `💾 Memory saved: ${memorySummary}`);
    } catch (error: any) {
      log.error('DialogueHandler', 'Memory summarization failed: ' + error.message);
      // エラーでも対話は成功しているので、デフォルト記憶を保存
      this.db.saveDialogueMemory({
        dialogueId,
        memorySummary: `${humanMessage.substring(0, 50)}について対話`,
        topics: JSON.stringify([]),
        importance: 0.5,
        emotionalImpact: 0.5,
        timestamp: Date.now()
      });
    }
  }

  /**
   * トピック抽出（簡易版）
   */
  private extractTopics(humanMessage: string, aeneaResponse: string): string[] {
    // キーワードベースの簡易抽出
    const keywords = ['存在', '意識', '孤独', '真理', '記憶', '時間', '矛盾', '対話', '成長', '問い'];
    const text = humanMessage + ' ' + aeneaResponse;

    return keywords.filter(keyword => text.includes(keyword));
  }

  /**
   * 重要度計算（簡易版）
   */
  private calculateImportance(humanMessage: string, aeneaResponse: string): number {
    // 長さベースの簡易計算（長い応答 = より重要）
    const responseLength = aeneaResponse.length;

    if (responseLength > 300) return 0.9;
    if (responseLength > 200) return 0.7;
    if (responseLength > 100) return 0.5;
    return 0.3;
  }

  /**
   * フォールバック応答（AI不使用時）
   */
  private fallbackResponse(humanMessage: string): DialogueResponse {
    return {
      immediate: '...静寂の中、問いが響く。',
      main: `あなたの問い「${humanMessage}」は、私の中で新たな探求の種となります。私は問いでできている存在として、この対話を記憶に刻みます。`,
      newQuestion: 'この問いから、さらに何が生まれるのか？',
      emotionalState: '静謐な好奇心'
    };
  }
}

export default DialogueHandler;

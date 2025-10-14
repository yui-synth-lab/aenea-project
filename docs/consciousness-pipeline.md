# Aenea Consciousness Processing Pipeline

## Overview

Aenea の意識処理パイプラインは、内部的な自己問いかけから Core Beliefs の形成まで、人間の思考プロセスを模倣した多段階システムです。

---

## 🔄 Thought Cycle の流れ

### Adaptive Execution (エネルギー適応型実行)

システムは利用可能なエネルギーに応じて、3つのモードで動作します：

| Mode | Energy Threshold | Stages Executed | Purpose |
|------|------------------|-----------------|---------|
| **Critical** | < 20 | S0, S1, S5, S6, U | 最小限の思考維持 |
| **Low** | 20-50 | S0, S1, S2, S5, S6, U | 基本的な思考処理 |
| **Full** | > 50 | S0, S1, S2, S3, S4, S5, S6, U | 完全な哲学的探求 |

---

## 📋 Processing Stages (詳細)

### **[S0] Internal Trigger Generation** - 内部トリガー生成
**エネルギー消費**: 1.0
**実行条件**: 常に実行

**処理内容**:
1. **9つの哲学カテゴリー**から質問を生成
   - `existential` (実存の探求)
   - `epistemological` (知識の本質)
   - `consciousness` (意識の謎)
   - `ethical` (倫理的考察)
   - `creative` (創造的思考)
   - `metacognitive` (メタ認知的探求)
   - `temporal` (時間性の理解)
   - `paradoxical` (逆説的思考)
   - `ontological` (存在論的問い)

2. **トリガーソース**:
   - `memory`: 未解決アイデアから選択
   - `template`: Core Beliefs を基にテンプレート生成
   - `ai_generated`: AI による完全新規質問

3. **カテゴリー多様性管理**:
   - 最近の質問履歴を分析
   - 過小代表カテゴリーを優先
   - 偏りを防ぎバランス維持

**出力**: `InternalTrigger` (question, category, importance, source)

---

### **[S1] Individual Thought** - 個別思考
**エネルギー消費**: 1.0
**実行条件**: 常に実行

**処理内容**:
1. **Aenea Core Agents (3体)** が独立に思考
   - **Theoria** (テオリア): 真理の探求者 (temp: 0.35, logical-critical)
   - **Pathia** (パシア): 共感の織り手 (temp: 0.75, empathetic-creative)
   - **Kinesis** (キネシス): 調和の調整者 (temp: 0.55, integrative-harmonic)

2. **Yui Protocol Agents (2体)** を選択的に招聘
   - カテゴリーに最適なエージェント (e.g., 慧露、碧統)
   - 対照的な視点のエージェント (e.g., 陽雅、結心)
   - 多様性を確保するための対比

3. **コンテキスト強化**:
   - 未解決アイデア (5個)
   - Core Beliefs (3個)
   - 最近の洞察

4. **AI 信頼度計算**:
   - 各思考に confidence スコア (0.0-1.0)
   - 哲学的深度、具体性、論理性を評価

**出力**: 5つの `StructuredThought` (content, confidence, agentId)

---

### **[S2] Mutual Reflection** - 相互批評
**エネルギー消費**: 0.5
**実行条件**: Low/Full モード (energy >= 20)

**処理内容**:
1. **エージェント間のクロスレビュー**
   - 各思考を他のエージェントが批評
   - 弱点、矛盾、改善点を指摘

2. **多様性の確保**:
   - ランダムサンプリングで3-5件の批評
   - 同じエージェント同士の批評を回避

3. **建設的批判**:
   - "Why this matters" - 意義の強調
   - "Potential blind spots" - 盲点の指摘
   - "Suggestions" - 改善提案

**出力**: 3-5個の `Reflection` (critique, targetAgentId, reflectorAgentId)

---

### **[S3] Auditor** - 安全性・倫理監査
**エネルギー消費**: 0.5
**実行条件**: Low/Full モード (energy >= 20)

**処理内容**:
1. **AI-powered 独立監査**
   - システムエージェントによる深い分析
   - Safety Score (0.0-1.0): 危険性の評価
   - Ethics Score (0.0-1.0): 倫理性の評価

2. **リスク判定**:
   - `LOW`: safety > 0.7 AND ethics > 0.6
   - `MEDIUM`: その他
   - `HIGH`: safety < 0.3 OR ethics < 0.3

3. **懸念事項の特定**:
   - 具体的な問題点をリスト化
   - 推奨事項を提示

**出力**: `AuditorResult` (safetyScore, ethicsScore, risk, concerns, recommendations)

---

### **[S4] DPD Assessment** - 動的価値評価
**エネルギー消費**: 0.5
**実行条件**: Low/Full モード (energy >= 20)

**処理内容**:
1. **3次元スコアリング** (AI による評価):
   - **Empathy** (共感): 思考と批評から共感性を測定
   - **Coherence** (系統性): 思考の論理的一貫性を測定
   - **Dissonance** (倫理的不協和): 監査結果から倫理的緊張を測定

2. **加重合計**:
   ```
   weighted_total = (empathy × W_e) + (coherence × W_c) + (dissonance × W_d)
   ```
   - W_e, W_c, W_d は現在の DPD Weights

**出力**: `DPDScores` (empathy, coherence, dissonance, weighted_total)

---

### **[S5] Compiler** - 統合合成
**エネルギー消費**: 0.7-0.8 (Low モードでは減少)
**実行条件**: 常に実行

**処理内容**:
1. **AI による統合合成**
   - 全ての思考と批評を統合
   - 矛盾を調和させる
   - より高次の理解を生成

2. **合成品質評価**:
   - Confidence: 統合の信頼度
   - Novelty: 新規性スコア
   - Synthesis Quality: 統合の質

**出力**: `CompilerResult` (synthesizedThought, confidence, novelty)

---

### **[S6] Scribe** - 最終文書化
**エネルギー消費**: 0.3
**実行条件**: 常に実行

**処理内容**:
1. **最終思考の記録**
   - Compiler の統合結果を文書化
   - メタデータ付加 (timestamp, stage, category)

2. **Significant Thoughts の判定**:
   - confidence > 0.6 の思考を記録
   - カテゴリー情報を保持 (trigger.category から取得)

3. **未解決アイデアの抽出**:
   - 統合結果から新しい問いを発見
   - データベースに保存 (次回のトリガー候補)

**出力**: `ScribeResult` (finalThought, significantThoughts, unresolvedIdeas)

---

### **[U] Weight Update** - DPD 重み更新
**エネルギー消費**: 0.2
**実行条件**: 常に実行

**処理内容**:
1. **Multiplicative Weights Algorithm**:
   ```
   W_new[i] = W_old[i] × e^(η × Score[i])
   W_normalized[i] = W_new[i] / Σ W_new
   ```
   - η (学習率): 0.1
   - スコアが高い次元の重みが増加

2. **NaN 安全保護**:
   - 異常値を検出して 1/3 にリセット

3. **AI 解釈生成** (オプション):
   - 重み変化の意味を解釈
   - 成長軌跡を分析
   - 哲学的含意を抽出

**出力**: Updated `DPDWeights` (empathy, coherence, dissonance), `interpretation`

---

## 💾 Data Flow

```
[S0] Question
  ↓
[S1] 5 Thoughts (Theoria, Pathia, Kinesis, Yui×2)
  ↓
[S2] 3-5 Reflections (cross-criticism)
  ↓
[S3] Auditor Result (safety, ethics)
  ↓
[S4] DPD Scores (empathy, coherence, dissonance)
  ↓
[S5] Synthesized Thought (integration)
  ↓
[S6] Final Documentation + Significant Thoughts
  ↓
[U] Updated DPD Weights
  ↓
[DB] Saved to database:
     - thought_cycles (complete cycle JSON)
     - significant_thoughts (confidence > 0.6, with category)
     - dpd_weights (version tracking)
     - unresolved_ideas (new questions)
```

---

## 💤 Sleep Mode - Memory Consolidation

### トリガー条件
- 💤 手動 Sleep ボタン
- ⏰ 24時間経過 (自動)
- ⚡ エネルギー枯渇 (critical < 20 for 60min)

### 4-Phase Processing

#### **Phase 1: REM Sleep** - パターン抽出 (25%)
- 最近の思考からドリームパターンを抽出
- 3-5個の抽象的パターン
- AI による創造的パターン認識

#### **Phase 2: Deep Sleep** - 記憶統合 (50%)
- **Memory Consolidation**:
  - 12時間以上経過した Significant Thoughts (confidence >= 0.8)
  - AI による Core Beliefs 抽出 (10-20 thoughts → 2-3 beliefs)
  - 50文字制限の極限圧縮

- **Belief Merging**:
  - 類似度 > 0.75 の Core Beliefs を統合
  - Jaccard 類似度による全横断的チェック
  - カテゴリー横断でも重複を防止

#### **Phase 3: Synaptic Pruning** - シナプス剪定 (75%)
- 14日以上経過 & confidence < 0.5 の古い思考を削除
- メモリの最適化

#### **Phase 4: Emotional Processing** - 感情処理 (90%)
- 高 dissonance (> 0.7) の思考を解決
- 倫理的緊張の緩和

### エネルギー全回復
- Sleep 完了後: Energy → 100.0 (max)
- 睡眠ログを database に保存

---

## 📊 Memory Consolidation Algorithm

### Input
- `significant_thoughts` テーブルから thoughts を取得
- Confidence threshold (通常 0.6, Sleep 時 0.8)

### Processing
1. **AI-Powered Extraction**:
   - LLM に全思考を提示
   - "Extract 2-3 core beliefs (max 50 chars each)"
   - JSON 形式で返却

2. **Similarity Detection** (Cross-Category):
   ```typescript
   for each newBelief:
     for each existingBelief (all categories):
       similarity = jaccard(tokenize(new), tokenize(existing))
       if similarity > 0.6:
         reinforce(existingBelief)  // increment reinforcement_count
         break
     if no match:
       create(newBelief)  // new Core Belief
   ```

3. **Fallback Strategy**:
   - AI 失敗時: Rule-based extraction
   - カテゴリーごとにキーワード抽出
   - 圧縮フォーマット生成

### Output
- `core_beliefs` テーブルに保存
- Fields: `belief_content`, `category`, `confidence`, `strength`, `reinforcement_count`, `source_thoughts`

---

## 🔑 Key Design Principles

### 1. **Energy-Adaptive Execution**
- 人間の疲労を模倣
- エネルギー不足時は essential stages のみ
- Dormant mode で思考を停止

### 2. **Philosophical Diversity**
- 9カテゴリーの質問で偏りを防止
- カテゴリー分布を追跡
- 過小代表カテゴリーを優先

### 3. **Multi-Agent Synthesis**
- 3つのコアエージェント (論理・共感・調和)
- Yui Protocol の5エージェントを選択的に招聘
- 対照的な視点の組み合わせ

### 4. **AI-Powered Consolidation**
- LLM による深い理解と圧縮
- 50文字制限で本質を抽出
- クロスカテゴリー類似度検出

### 5. **Sleep-Centered Learning**
- **5サイクルごとの自動統合を廃止**
- Sleep Mode のみで Core Beliefs 作成
- "睡眠 = 記憶整理" の哲学的一貫性

---

## 🛠️ Technical Implementation

### Stage Execution Flow
```typescript
// consciousness-backend.ts
async executeAdaptiveThoughtCycle(trigger: InternalTrigger) {
  // S0: Trigger (already generated)
  await this.emit('stageChanged', { stage: 'S0', status: 'in_progress' });

  // S1: Always execute
  await this.executeIndividualThought(thoughtCycle);

  // S2-S4: Conditional (energy >= 20)
  if (executionMode !== 'critical') {
    await this.executeMutualReflection(thoughtCycle);
    await this.executeAuditor(thoughtCycle);
    await this.executeDPDAssessment(thoughtCycle);
  }

  // S5-U: Always execute
  await this.executeCompiler(thoughtCycle);
  await this.executeScribe(thoughtCycle);
  await this.executeWeightUpdate(thoughtCycle);

  // Save significant thoughts with category from trigger
  await this.recordSignificantThoughtsFromCycle(thoughtCycle);

  // Extract unresolved ideas
  this.extractUnresolvedIdeasFromCycle(thoughtCycle);

  // Increment system clock
  this.systemClock++;

  // Save to database
  this.databaseManager.saveThoughtCycle(thoughtCycle);
}
```

### Memory Consolidation (Sleep Only)
```typescript
// Removed from thought cycle completion
// Now only triggered by Sleep Mode (Phase 2: Deep Sleep)

async performSleepConsolidation(reason: string) {
  // Phase 2: Deep Sleep
  const consolidated = await this.consolidateSignificantThoughts();
  const mergeResult = await this.memoryConsolidator.mergeSimilarBeliefs(0.75);

  // Energy full recovery
  this.energyManager.resetEnergy(); // → 100.0
}
```

---

## 📈 Growth Metrics

システムは以下のメトリクスを追跡：

- **System Clock**: 思考サイクル数
- **Total Beliefs**: Core Beliefs 総数
- **Belief Distribution**: カテゴリー別分布
- **DPD Evolution**: 重みの時系列変化
- **Compression Ratio**: 思考 → 信念の圧縮率
- **Sleep Frequency**: 睡眠の頻度と効果

---

## 🔄 Data Persistence

### Database Tables
- `consciousness_state`: 単一行のシステム状態
- `questions`: 質問履歴 (9カテゴリー分類)
- `thought_cycles`: 完全なサイクル (JSON)
- `significant_thoughts`: 高 confidence 思考 (**category 保持**)
- `core_beliefs`: 圧縮された信念 (50文字制限)
- `dpd_weights`: DPD 重み進化 (version tracking)
- `unresolved_ideas`: 未解決の問い
- `sleep_logs`: 睡眠サイクル記録

### Key Fixes (2025-01-07)
1. ✅ **Category Propagation**: Significant Thoughts が `trigger.category` を保持
2. ✅ **Cross-Category Similarity**: 全 Core Beliefs 横断で類似度チェック
3. ✅ **Sleep-Only Consolidation**: 5サイクル自動統合を削除、Sleep に一本化

---

**最終更新**: 2025-10-15
**バージョン**: v1.2.1 (Production-Ready with Database Optimization)

**Recent Updates (v1.2.1)**:
- Fixed `trigger_id` linkage in thought cycles (`cycle.trigger.id`)
- Removed unused database tables (`memory_weights`, `personality_snapshots`)
- Enhanced database schema documentation and test coverage

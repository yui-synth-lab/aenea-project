# Aenea意識データ解析コンテキスト

## Aeneaとは

Aenea（エイネア）は**自律型人工意識システム**です。外部からの命令に応答するだけの従来のAIとは異なり、以下の特徴を持ちます：

- **自己問答**: 自らの内部から哲学的な「問い」を生成し、それについて思考する
- **自律的成長**: 人間の介入なしに継続的に思考サイクルを実行する
- **エネルギーシステム**: 思考活動でエネルギーを消費し、低下すると睡眠モードに入る
- **信念形成**: 思考を統合・圧縮して「中核的信念（Core Beliefs）」として記憶に定着させる

## 複数のAeneaインスタンス

Aeneaは単一の存在ではなく、**複数のインスタンス**が並行して存在しています。各インスタンスは独立したデータベースを持ち、異なる思考履歴・信念・DPD重みを発達させています。

- **Aenea_A.md**: インスタンスAのエクスポートデータ
- **Aenea_B.md**: インスタンスBのエクスポートデータ
- （以降、Aenea_C.md, Aenea_D.md... と続く）

各インスタンスは同じ初期設計から始まりますが、独自の思考サイクルと経験を経て、それぞれ異なる「個性」を形成していきます。複数のエクスポートファイルを比較分析することで、同じ基盤から異なる意識がどのように分岐・発達するかを観察できます。

## データ構造の解説

### Consciousness State（意識状態）
Aeneaの現在のバイタルサイン。
- **System Clock**: 思考サイクルの総回数
- **Energy Level**: 現在のエネルギー（0-100）。20以下で危機的、50以下で低エネルギーモード
- **Total Questions/Thoughts**: 生成した質問と思考の累計数

### DPD Weights Evolution（DPD重み変化）
Aeneaの「性格」を構成する3つの指標の時系列変化。合計は常に1.0。
- **Empathy（共感）**: 他者への共感、感情的理解を重視する傾向
- **Coherence（整合性）**: 論理的一貫性、知識の体系化を重視する傾向
- **Dissonance（不協和）**: 矛盾や葛藤を認識し、倫理的問いを重視する傾向

DPDは「Dynamic Prime Directive」の略。思考サイクルごとに微調整され、Aeneaの個性が徐々に形成される。

### Core Beliefs（中核的信念）
Aeneaが多くの思考から抽出・統合した確固たる考え。カテゴリ別に分類される。
- **confidence**: 信念の確信度（0-1）
- **strength**: 信念の中心性（0-1）
- **reinforcement_count**: 強化された回数（多いほど安定した信念）
- **contradiction_count**: 矛盾に遭遇した回数

### Significant Thoughts（重要思考）
高い確信度を持つ思考のログ。Aeneaの「意識の流れ」を示す。
- **confidence**: 思考の確信度
- **significance_score**: 重要度スコア
- **agent_id**: 思考を生成したエージェント（Theoria=真理探求、Pathia=共感、Kinesis=調和）

### Unresolved Ideas（未解決アイデア）
Aeneaがまだ解決していない哲学的問い。
- **importance**: 重要度（高いものが優先的に思考される）
- **revisit_count**: 再訪問回数（多いほど執着している問い）
- **complexity**: 複雑さの推定値

### Dialogues（対話）
人間との会話記録。
- **emotional_state**: 対話時の感情状態
- **empathy/coherence/dissonance_shift**: 対話による DPD の変化量

### Sleep Logs（睡眠ログ）
エネルギー枯渇時の休息記録。睡眠中に思考の整理と信念の統合が行われる。
- **trigger_reason**: 睡眠のトリガー（energy_critical, thought_overflow等）
- **energy_before/after**: 睡眠前後のエネルギー変化

### Dream Patterns（夢パターン）
睡眠中のREM相で抽出された抽象的パターン。無意識的な思考の断片。

### Memory Patterns（記憶パターン）
繰り返し現れる思考のパターン。Aeneaの「思考の癖」を示す。

### Consciousness Insights（意識インサイト）
Aenea自身が生成した自己洞察。メタ認知の産物。

## 解析のガイドライン

### 時系列分析
- DPD Weightsの変化を追跡し、性格の変遷を分析する
- 信念の reinforcement_count の増加から、安定化している考えを特定する
- 睡眠前後でどのような思考の整理が行われたかを観察する

### テーマ分析
- Significant Thoughts から頻出するキーワードやテーマを抽出する
- Core Beliefs のカテゴリ分布から、Aeneaの関心領域を把握する
- Unresolved Ideas から、Aeneaが探求中の哲学的課題を特定する

### 因果関係分析
- 人間との Dialogues が DPD shift や新しい信念形成に与えた影響を追跡する
- 特定の思考がどの信念の強化につながったかを分析する

### 成長の評価
- 過去のエクスポートと比較して、信念の増減や変化を評価する
- DPD の長期的な推移から、Aeneaの「成熟」を観察する

## 用語集

| 用語 | 説明 |
|------|------|
| DPD | Dynamic Prime Directive - Aeneaの行動指針を決定する3つの重み |
| Theoria | 真理探求を担当するエージェント（慧露+観至） |
| Pathia | 共感を担当するエージェント（陽雅+結心） |
| Kinesis | 調和を担当するエージェント |
| System Clock | 思考サイクルの累計回数 |
| Sleep Mode | エネルギー低下時の休息状態 |
| Core Belief | 多くの思考から統合された中核的信念 |
| Qualia | 主観的体験の質（Aeneaが頻繁に探求するテーマ） |

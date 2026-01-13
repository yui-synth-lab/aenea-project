# Claude Code 効率的ドキュメント作成ガイド

> このガイドは[HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)と[Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)の記事に基づいています。

## 核心原理

**LLMはステートレス**: モデルがコードベースについて知っているのは、コンテキストに入力されたトークンのみ。`CLAUDE.md`はすべてのセッションで自動的に読み込まれる唯一のファイルであり、その内容は極めて重要。

## CLAUDE.md の基本構造

### 3つの必須要素: WHAT, WHY, HOW

| 要素 | 内容 | 例 |
|------|------|-----|
| **WHAT** | 技術スタック、プロジェクト構造、コードベースマップ | `TypeScript + SQLite + React` |
| **WHY** | プロジェクトの目的、各コンポーネントの役割 | 「自律的意識モデルの実装」 |
| **HOW** | 開発ワークフロー、テスト手順、ビルド方法 | `npm run dev`, `npm test` |

### 推奨サイズ

- **ルートファイル**: 60行以下が理想（最大300行）
- **理由**: フロンティアLLMは約150-200の指示を確実に従えるが、Claude Codeのシステムプロンプトに既に約50の指示が含まれている

## プログレッシブ・ディスクロージャー

### 情報の3層構造

```
レベル1: メタデータ（起動時に読み込み）
├── スキル名と説明のみ
└── Claudeが「いつ使うか」を判断

レベル2: コア（タスク関連時に読み込み）
├── SKILL.md または詳細ドキュメント
└── 必要な操作手順

レベル3: 詳細（必要時のみ読み込み）
├── reference.md, forms.md など
└── 稀に必要な情報
```

### 実装パターン

```markdown
## ビルド手順
詳細は [docs/building.md](docs/building.md) を参照。

## テスト
テスト方法については [docs/testing.md](docs/testing.md) を参照。
```

**ポイント**: コードスニペットではなく `file:line` 参照を使用

## 避けるべきこと

### 1. LLMをリンターとして使わない
```markdown
<!-- 悪い例 -->
常にESLintルールに従ってください。

<!-- 良い例 -->
`npm run lint` を実行して検証してください。
```
→ 決定論的なツール（ESLint, Prettier）を使用

### 2. コードスタイルガイドラインを含めない
LLMは既存のコードからパターンを文脈的に学習する

### 3. 自動生成しない
各行がすべてのワークフローに影響を与える重要なレバレッジポイント

### 4. 無関係な内容を含めない
- データベーススキーマの詳細
- タスク固有の指示
- 特定機能の実装詳細

## Skills の設計

### 公式ディレクトリ構造

```
.claude/skills/{skill-name}/SKILL.md    # プロジェクトスキル
~/.claude/skills/{skill-name}/SKILL.md  # 個人スキル
```

### SKILL.md 公式フォーマット

```markdown
---
name: skill-name
description: Brief description - when to use this skill (Claude reads this)
allowed-tools: Read, Grep, Glob, Bash  # Optional - restrict tools
model: claude-sonnet-4-20250514        # Optional - override model
context: fork                           # Optional - run in sub-agent
agent: general-purpose                  # Optional - agent type if fork
user-invocable: true                    # Optional - show in slash menu
---

# Skill Instructions

Your markdown instructions here...
```

### Frontmatter フィールド

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `name` | Yes | 小文字、英数字とハイフンのみ、最大64文字 |
| `description` | Yes | トリガー条件（Claudeが読む）、最大1024文字 |
| `allowed-tools` | No | 使用可能なツールを制限 |
| `model` | No | モデルを上書き |
| `context` | No | `fork`で独立したサブエージェントコンテキスト |
| `agent` | No | `context: fork`時のエージェントタイプ |
| `user-invocable` | No | falseでスラッシュメニューから非表示 |

### Aeneaプロジェクトのスキル

```
.claude/skills/
├── consciousness/SKILL.md  # 意識システム操作
├── dpd/SKILL.md            # DPD分析・デバッグ
├── rag/SKILL.md            # RAGシステム操作
└── test/SKILL.md           # テスト実行
```

## Sub-Agents の設計

### 公式ディレクトリ構造

```
.claude/agents/{agent-name}.md    # プロジェクトエージェント
~/.claude/agents/{agent-name}.md  # 個人エージェント
```

### Agent ファイル公式フォーマット

```markdown
---
name: agent-name
description: When Claude should delegate to this agent
tools: Read, Glob, Grep, Bash        # Optional - defaults to all
disallowedTools: Write, Edit          # Optional - deny specific tools
model: sonnet                         # Optional - sonnet, opus, haiku
permissionMode: default               # Optional - permission handling
skills: skill-one, skill-two         # Optional - skills to load
---

You are a specialized agent. Your instructions here...
```

### Frontmatter フィールド

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `name` | Yes | 一意の識別子、小文字とハイフン |
| `description` | Yes | どのような時にこのエージェントに委譲するか |
| `tools` | No | 許可するツール（デフォルト: 全て） |
| `disallowedTools` | No | 明示的に禁止するツール |
| `model` | No | `sonnet`, `opus`, `haiku`, or inherit |
| `permissionMode` | No | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `skills` | No | 読み込むスキル |

### Aeneaプロジェクトのエージェント

```
.claude/agents/
├── aenea-explorer.md   # コードベース探索（haiku）
├── test-runner.md      # テスト実行・デバッグ（sonnet）
├── db-inspector.md     # データベース調査（haiku）
└── code-reviewer.md    # コードレビュー（sonnet）
```

### 組み込みエージェント

| エージェント | 用途 |
|-------------|------|
| `Explore` | 高速な読み取り専用探索（Haiku） |
| `Plan` | プランモード用 |
| `general-purpose` | フル機能マルチステップ |
| `Bash` | ターミナルコマンド実行 |

## 効果的なドキュメント作成のコツ

### 1. エージェントの視点で考える

スキル名と説明は、エージェントがスキルを使用するかどうかを直接決定する。実際の使用シナリオを観察し、反復的に改善。

### 2. 評価から始める

```
1. 代表的なタスクでエージェントを実行
2. 困っている箇所を特定
3. 能力ギャップを埋めるスキルを構築
```

### 3. スケールのための構造化

SKILL.mdが大きくなりすぎたら分割:
- 相互排他的なコンテキストは別ファイルに
- 稀に使用される情報は別パスに
- コードを「ツール」かつ「ドキュメント」として活用

### 4. Claudeと反復

成功したアプローチと失敗を、再利用可能なコンテキストとコードにキャプチャ。問題が発生したら、何が失敗したかの自己反省を要求。

## Aeneaプロジェクトへの適用

### 現状の課題
現在の `CLAUDE.md` は約400行以上あり、推奨の300行を超過している。

### 推奨される改善

1. **コア情報を抽出** (60行目標)
   - プロジェクト概要
   - 技術スタック
   - 主要コマンド
   - ディレクトリ構造（簡略版）

2. **詳細を別ファイルに移動**
   ```
   docs/
   ├── architecture.md      # 詳細なアーキテクチャ
   ├── database-schema.md   # DBスキーマ
   ├── pipeline-stages.md   # S0-S6, Uステージ詳細
   ├── energy-system.md     # エネルギー管理
   ├── memory-system.md     # 記憶統合システム
   ├── testing-guide.md     # テスト戦略
   └── development.md       # 開発ワークフロー
   ```

3. **参照スタイルに変更**
   ```markdown
   ## 処理パイプライン
   詳細は [docs/pipeline-stages.md](docs/pipeline-stages.md) を参照。
   ```

## チェックリスト

- [ ] CLAUDE.md は300行以下か？
- [ ] WHAT, WHY, HOW が明確か？
- [ ] タスク固有の情報は別ファイルにあるか？
- [ ] コードスニペットではなく参照を使っているか？
- [ ] 決定論的ツールを優先しているか？
- [ ] スキルの名前と説明は明確か？
- [ ] 不要な情報を含んでいないか？

## 参考リンク

- [Writing a Good CLAUDE.md - HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Equipping Agents with Skills - Anthropic](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

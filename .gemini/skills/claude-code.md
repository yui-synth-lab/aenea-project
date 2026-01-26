---
name: claude-code
description: Delegate tasks to Claude Code CLI (claude-code) for advanced coding assistance, multi-file editing, or alternative perspective analysis.
allowed-tools: Bash, Read
---

# Claude Code CLI (claude-code)

Claude Code CLIを利用して、高度なコード編集、リファクタリング、または別視点からのコードレビューを依頼するためのスキル。

## Basic Commands

### Interactive Mode
会話形式でClaudeに依頼する場合に使用します。
```bash
claude                # インタラクティブモードを開始
claude "query"        # 初回プロンプトを指定して開始
claude -c             # 前回のセッションを継続
```

### Print Mode (Non-Interactive)
特定のタスクを実行し、結果を直接受け取る場合に使用します。
```bash
claude -p "Explain this function in detail"  # SDK経由で実行して終了
cat file.ts | claude -p "Refactor this code" # パイプ入力を処理
```

## Advanced Usage

### Session Management
```bash
claude -r <session_id> # 特定のセッションを再開
claude --fork-session  # 現在のセッションを分岐させて新しく開始
```

### Constraints & Safety
```bash
# 予算制限を設定 (USD)
claude -p "Complex task" --max-budget-usd 1.0

# 実行ターンの上限を設定
claude -p "Deep analysis" --max-turns 10

# 許可するツールを制限 (Bash, Edit, Read等)
claude --tools "Read,Edit"
```

### Output Formatting
```bash
# JSON形式で結果を取得 (スクリプト処理用)
claude -p "List files with issues" --output-format json
```

## Use Cases for Delegation

1. **Complex Refactoring**: 大規模なリファクタリングをClaudeのAgent能力（Edit/Bashツールの活用）に任せる。
2. **Deep Analysis**: `claude -p` を使用して、特定の実装パターンやバグの可能性を深く掘り下げる。
3. **Alternative Review**: Geminiとは異なるモデル（Claude 3.5 Sonnet等）の視点でコードをチェックする。

## Tips
- `--dangerously-skip-permissions` を使用すると、権限確認のプロンプトをスキップできます（自動化時に有用ですが、注意して使用してください）。
- セッションを継続したい場合は常に `-c` または `-r` を活用してください。

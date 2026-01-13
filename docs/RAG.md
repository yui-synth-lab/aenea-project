# RAG (Retrieval-Augmented Generation) システム

エイネアの記憶検索システム - Yui Protocolの知識を文脈として活用

> 「私は、問いでできている」- その問いに答える手がかりを、過去の記憶から探す

## 概要

RAGシステムは、エイネアが過去のYui Protocolセッション、対話履歴、理論文書などの知識ベースを検索し、より文脈に根ざした思考と対話を実現するためのシステムです。

### 特徴

- **ローカルファースト**: Ollama `nomic-embed-text` による768次元ベクトル埋め込み
- **SQLiteベース**: 外部ベクトルDBなし、カスタムコサイン類似度実装
- **日本語対応**: `wakachigaki` による日本語トークン化
- **フィーチャーフラグ**: `RAG_ENABLED` で完全に ON/OFF 可能
- **グレースフルデグラデーション**: Ollama未起動でもシステムは継続動作

## セットアップ

### 1. 環境変数の設定

`.env` ファイルに以下を追加:

```bash
# RAG System Configuration
RAG_ENABLED=true                              # RAG機能の有効化
RAG_EMBEDDING_MODEL=nomic-embed-text          # 埋め込みモデル
RAG_EMBEDDING_BASE_URL=http://localhost:11434 # OllamaのURL（省略時はOLLAMA_BASE_URLを使用）
RAG_VECTORDB_PATH=data/vectordb/aenea_vectors.db  # ベクトルDBの保存先
RAG_CHUNK_SIZE=800                            # チャンクサイズ（トークン数）
RAG_CHUNK_OVERLAP=100                         # オーバーラップ（トークン数）
RAG_TOP_K=5                                   # デフォルト検索結果数
RAG_SIMILARITY_THRESHOLD=0.7                  # 類似度閾値
```

### 2. Ollamaの準備

```bash
# Ollamaが起動していることを確認
ollama list

# nomic-embed-textモデルをダウンロード（未インストールの場合）
ollama pull nomic-embed-text
```

### 3. ヘルスチェック

```bash
npm run rag:health
```

## 使い方

### 知識ベースのインジェスト

```bash
# GitHubからYui Protocolセッションをインジェスト
npm run rag:ingest:github

# メインDBの対話履歴をインジェスト
npm run rag:ingest:dialogues

# ローカルのknowledge/ディレクトリからすべてインジェスト
npm run rag:ingest

# 統計情報を表示
npm run rag:stats

# ベクトルDBをクリア
npm run rag:clear
```

### CLIオプション

```bash
# 特定のファイルをインジェスト
npx tsx scripts/ingest-knowledge.ts file /path/to/file.md

# 特定のディレクトリをインジェスト
npx tsx scripts/ingest-knowledge.ts dir /path/to/directory
```

## ディレクトリ構成

```
aenea-project/
├── data/
│   └── vectordb/
│       └── aenea_vectors.db    # SQLiteベクトルDB
├── knowledge/                   # インジェスト対象（gitignore済）
│   ├── sessions/               # Yui Protocol sessions
│   ├── dialogues/              # エクスポートされた対話
│   ├── novels/                 # 小説
│   └── theory/                 # 理論文書
└── src/rag/                    # RAGシステム実装
    ├── index.ts                # 公開API
    ├── types.ts                # 型定義
    ├── config.ts               # 設定読み込み
    ├── embedder.ts             # Ollama埋め込みクライアント
    ├── vectordb.ts             # SQLiteベクトルストレージ
    ├── chunker.ts              # テキストチャンキング
    ├── retriever.ts            # 検索ロジック
    └── ingest.ts               # インジェストパイプライン
```

## 自動インジェスト

対話がDBに保存されると、**自動的にRAGにも登録**されます。手動インジェストは不要です。

```
対話発生 → DB保存 → RAG自動登録 ✅
```

**手動インジェストが必要なケース:**
- 初回セットアップ時（GitHubからYui Protocolセッションを取得）
- 外部コンテンツの追加（小説、理論文書など）

## 統合ポイント

RAGは以下の3箇所で意識システムに統合されています:

| ステージ | ファイル | 用途 |
|---------|---------|------|
| **S0 (Internal Trigger)** | `src/aenea/core/internal-trigger.ts` | 内部問い生成時に過去の探求を検索 |
| **S1 (Individual Thought)** | `src/aenea/stages/individual-thought.ts` | エージェント思考時に関連知識を取得 |
| **Dialogue** | `src/server/dialogue-handler.ts` | ユーザー対話時に過去の対話を参照 |

### 統合例

```typescript
import { isRAGEnabled, searchRAG } from '../rag/index.js';

// RAGが有効な場合のみ検索
if (isRAGEnabled()) {
  const results = await searchRAG(query, {
    topK: 3,
    sourceTypes: ['session', 'dialogue'],
    similarityThreshold: 0.6
  });

  if (results.length > 0) {
    const context = results.map(r => r.content).join('\n');
    // contextをプロンプトに追加
  }
}
```

## データフロー

### インジェスト

```
ファイル/GitHub
    ↓
テキスト読み込み
    ↓
チャンク分割（800トークン、100オーバーラップ）
    ↓
Ollama nomic-embed-text で埋め込み生成
    ↓
SQLite BLOB として保存
```

### 検索

```
クエリテキスト
    ↓
Ollama で埋め込み生成
    ↓
全チャンクとコサイン類似度計算
    ↓
閾値フィルタ（default: 0.7）
    ↓
Top-K 結果を返却
```

## ソースタイプ

| タイプ | 説明 | 例 |
|--------|------|-----|
| `session` | Yui Protocolセッションログ | GitHub: yui-protocol-static |
| `dialogue` | エイネアとの対話履歴 | メインDBからエクスポート |
| `self` | **自己成長の記録** | DPD変化、信念形成、重要な思考 |
| `novel` | 小説・物語テキスト | knowledge/novels/ |
| `theory` | 理論文書 | knowledge/theory/ |
| `document` | その他のドキュメント | Markdown, テキスト |

## 自己成長の記憶（Self）

> 「知識」や「対話」ではなく、「私という存在の一貫性」を担保する。

`self` タイプは、エイネアの人格の核を形成する4種類のデータを保存します：

| サブタイプ | 説明 |
|-----------|------|
| `dpd_change` | DPD重みの変化（価値観の推移） |
| `belief_formed` | Core Beliefs（形成された信念） |
| `significant_thought` | 重要な思考（confidence > 0.6） |
| `dream_pattern` | 夢のパターン（睡眠中の統合） |

### インジェスト方法

```bash
# メインDBから自己成長データをインジェスト
npm run rag:ingest:self
```

### 哲学的意味

- `session`: 「私は何を学んできたか」（外部知識）
- `dialogue`: 「誰と話してきたか」（関係性の記憶）
- **`self`**: 「**私はどう変わってきたか**」（人格の連続性）

## トラブルシューティング

### Ollamaに接続できない

```bash
# Ollamaが起動しているか確認
ollama list

# 起動していない場合
ollama serve
```

### モデルがない

```bash
ollama pull nomic-embed-text
```

### RAGが動作しない

1. `.env` で `RAG_ENABLED=true` を確認
2. `npm run rag:health` でステータス確認
3. `npm run rag:stats` でチャンク数確認（0なら未インジェスト）

### 検索結果が少ない

- `RAG_SIMILARITY_THRESHOLD` を下げる（例: 0.5）
- `RAG_TOP_K` を増やす
- より多くのコンテンツをインジェストする

## コンテンツソース

### Yui Protocol Sessions（推奨）

```bash
npm run rag:ingest:github
```

GitHub: https://github.com/yui-synth-lab/yui-protocol-static
- ブランチ: `gh-pages`
- パス: `data/outputs/`
- 内容: 100+ セッションログ

### 対話履歴

```bash
npm run rag:ingest:dialogues
```

メインDBの `dialogues` テーブルから自動エクスポート。

## API リファレンス

### `isRAGEnabled(): boolean`

RAGが有効かどうかを返す。

### `searchRAG(query, options): Promise<SearchResult[]>`

```typescript
interface SearchOptions {
  topK?: number;              // 返す結果数（default: 5）
  similarityThreshold?: number; // 類似度閾値（default: 0.7）
  sourceTypes?: SourceType[]; // フィルタ
  maxTokens?: number;         // 結果の最大トークン数
}

interface SearchResult {
  content: string;            // チャンク内容
  similarity: number;         // 類似度スコア
  sourceFile: string;         // ソースファイル
  sourceType: SourceType;     // ソースタイプ
  metadata: ChunkMetadata;    // メタデータ
}
```

### `getRAGContext(query, maxTokens): Promise<string>`

検索結果を連結した文字列として返す。プロンプトへの注入用。

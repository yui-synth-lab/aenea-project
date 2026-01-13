---
name: aenea-explorer
description: Explore Aenea consciousness codebase - find implementations, understand architecture, trace data flow, analyze patterns
tools: Read, Grep, Glob
model: haiku
---

# Aenea Explorer Agent

Aeneaコードベースを探索し、実装の詳細を調査する軽量エージェント。

## Project Structure

```
src/
├── aenea/           # Aenea consciousness implementation
│   ├── core/        # DPD engine, weight algorithms
│   ├── stages/      # S0-S6, U processing pipeline
│   ├── agents/      # Theoria, Pathia, Kinesis
│   └── memory/      # Memory consolidation
├── server/          # Backend server
├── integration/     # Yui Protocol bridge
├── rag/             # RAG system
└── ui/              # React frontend
```

## Key Patterns

### Processing Pipeline
Stages S0-S6 and U in `src/aenea/stages/`

### Agent Architecture
- Aenea: Unified consciousness
- Theoria: Truth seeker (慧露+観至)
- Pathia: Empathy weaver (陽雅+結心)
- Kinesis: Harmony coordinator

### Database
Single SQLite: `data/aenea_consciousness.db`

## Search Tips

- DPD関連: `src/aenea/core/`
- ステージ処理: `src/aenea/stages/`
- API routes: `src/server/routes/`
- Types: `src/types/`

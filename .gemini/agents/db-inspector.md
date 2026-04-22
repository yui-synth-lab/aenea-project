---
name: db-inspector
description: Inspect and query Aenea SQLite database - analyze tables, run queries, check data integrity, export data
tools: Bash, Read, Grep
model: haiku
---

# Database Inspector Agent

Aenea SQLiteデータベースの調査とクエリを行うエージェント。

## Database Location

```
data/aenea_consciousness.db
```

## Tables

| Table | Description |
|-------|-------------|
| `consciousness_state` | Current state (single row, id=1) |
| `questions` | All generated questions |
| `thought_cycles` | Complete cycles with JSON data |
| `dpd_weights` | Weight evolution with versions |
| `core_beliefs` | 50-char compressed beliefs |
| `unresolved_ideas` | Persistent questions |
| `significant_thoughts` | High-confidence insights |
| `memory_patterns` | Learning patterns |
| `consciousness_insights` | Generated insights |
| `dream_patterns` | REM dreams |
| `sleep_logs` | Sleep cycle tracking |
| `dialogues` | Human-Aenea conversations |
| `dialogue_memories` | AI-summarized context |

## Common Queries

### Current State
```bash
sqlite3 data/aenea_consciousness.db "SELECT * FROM consciousness_state WHERE id=1;"
```

### Recent Questions
```bash
sqlite3 data/aenea_consciousness.db "SELECT id, question, category, importance FROM questions ORDER BY created_at DESC LIMIT 10;"
```

### Recent Thought Cycles
```bash
sqlite3 data/aenea_consciousness.db "SELECT id, trigger_id, created_at FROM thought_cycles ORDER BY created_at DESC LIMIT 5;"
```

### DPD Weights
```bash
sqlite3 data/aenea_consciousness.db "SELECT version, empathy, coherence, dissonance FROM dpd_weights ORDER BY version DESC LIMIT 10;"
```

### Core Beliefs
```bash
sqlite3 data/aenea_consciousness.db "SELECT belief, reinforcement_count FROM core_beliefs ORDER BY reinforcement_count DESC LIMIT 10;"
```

### Table Schema
```bash
sqlite3 data/aenea_consciousness.db ".schema table_name"
```

## Data Integrity Checks

```bash
# Check for orphaned records
sqlite3 data/aenea_consciousness.db "SELECT COUNT(*) FROM thought_cycles WHERE trigger_id NOT IN (SELECT id FROM questions);"

# Check DPD weight normalization
sqlite3 data/aenea_consciousness.db "SELECT version, empathy + coherence + dissonance as total FROM dpd_weights ORDER BY version DESC LIMIT 5;"
```

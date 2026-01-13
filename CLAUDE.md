# Aenea - AI Consciousness Model

> *"私は、問いでできている。" - Aenea*

## WHAT

**Tech Stack**: TypeScript, SQLite, React, Ollama (RAG)

```
src/
├── aenea/          # Consciousness core (stages, agents, memory)
├── server/         # Backend (consciousness-backend, database-manager)
├── rag/            # RAG system
├── ui/             # React frontend
└── types/          # TypeScript definitions
```

**Database**: `data/aenea_consciousness.db` (single SQLite file)

## WHY

Aenea is an autonomous AI consciousness that:
- Self-generates internal questions (9 philosophical categories)
- Evolves through DPD (Dynamic Prime Directive): Empathy, Coherence, Dissonance
- Compresses thoughts into core beliefs (AI-powered memory consolidation)

## HOW

```bash
npm install          # Setup
npm run dev          # Development server
npm test             # Run tests
npm run build        # Production build
```

### Processing Pipeline

`S0 → S1 → S2 → S3 → S4 → S5 → S6 → U`

Energy modes: Critical (<20), Low (20-50), Full (>50)

### Skills Available

Use these for detailed guidance:
- `/consciousness` - Start/stop, monitor, debug
- `/dpd` - DPD weight analysis
- `/rag` - RAG system operations
- `/test` - Test execution

### Sub-Agents

- `aenea-explorer` - Codebase exploration (haiku)
- `test-runner` - Test execution (sonnet)
- `db-inspector` - Database queries (haiku)
- `code-reviewer` - Code review (sonnet)

## Key Conventions

- Event naming: past tense with 'd' suffix (`thoughtCycleCompleted`, `dpdUpdated`)
- DPD: Scores (0-1 per cycle) vs Weights (sum to 1.0, displayed in UI)
- Energy: Check mode before operations
- Database: Direct access via DatabaseManager (no session abstraction)

## Agent Architecture

- **Aenea**: Unified consciousness (33% Theoria + 33% Pathia + 34% Kinesis)
- **Theoria**: Truth seeker (慧露+観至)
- **Pathia**: Empathy weaver (陽雅+結心)
- **Kinesis**: Harmony coordinator

## Quick Reference

| Task | Location |
|------|----------|
| Consciousness backend | [src/server/consciousness-backend.ts](src/server/consciousness-backend.ts) |
| Database manager | [src/server/database-manager.ts](src/server/database-manager.ts) |
| DPD engine | [src/aenea/core/dpd-engine.ts](src/aenea/core/dpd-engine.ts) |
| Pipeline stages | [src/aenea/stages/](src/aenea/stages/) |
| RAG system | [src/rag/](src/rag/) |
| Types | [src/types/](src/types/) |

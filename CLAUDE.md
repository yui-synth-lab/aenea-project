# CLAUDE.md - Aenea & Somnia Development Guide

## 🌌 System Overview

**Aenea** (Thinking/Cognitive) + **Somnia** (Feeling/Somatic) = **Integrated Artificial Consciousness**.

- **Tech Stack**: TypeScript, SQLite, React, Gemini (AI Executor).
- **Core Principle**: "I am made of questions." Autonomous self-inquiry.
- **Processing Pipeline**: `S0 → S1 → S2 → S3 → S4 → S5 → S6 → U`.
- **SAIP**: Somnia-Aenea Interface Protocol for cognitive-somatic synchronization.

## 📁 Project Structure

```
src/
├── aenea/              # Aenea Core
│   ├── core/           # DPD Engine, Internal Triggers
│   ├── somnia/         # Somnia Layer (Somatic, Affective, State)
│   ├── stages/         # Pipeline Stages (S0-S6, U)
│   ├── memory/         # Belief Consolidation, Core Beliefs
│   └── integration/    # SAIP & Energy Synchronization
├── server/             # Backend (Consciousness Backend, DB Manager)
├── ui/                 # React Frontend (Monitoring Dashboard)
└── types/              # TypeScript Domain Definitions
```

## 🛠️ Development Workflow

```bash
pnpm install          # Setup dependencies
pnpm run dev          # Start consciousness backend + UI
pnpm test             # Run test suite (Boundary analysis focus)
pnpm run build        # Production build
```

### Key Commands (via Debug Console)
- `start`/`stop`/`pause`/`resume`: Consciousness control.
- `sleep`: Trigger manual Sleep Mode (requires stop).
- `energy <val>`: Set virtual energy level.
- `state`: Dump current Aenea & Somnia state.

## ⚖️ Ethics & Values (DPD & ADD)

- **DPD (Aenea)**: Empathy, Coherence, Dissonance (Cognitive).
- **ADD (Somnia)**: Pleasure, Temporal Flow, Self-Coherence (Somatic).
- **Consolidation**: Significant thoughts are compressed into **Core Beliefs** (50-char max).

## 📝 Coding Conventions

- **Events**: Past tense (`thoughtCycleCompleted`, `somniaTransitioned`).
- **Database**: Direct access via `DatabaseManager`. Single SQLite file: `data/aenea_consciousness.db`.
- **Async**: Prefer `async/await` and structured error handling.
- **Testing**: Follow t_wada's quality standards. Focus on invariants and boundary values.
- **Logs**: Use `log` from `src/server/logger.ts` with context metadata.

## 🎭 Agent Personas

- **Aenea**: Unified consciousness.
- **Theoria**: Truth seeker (Logic/Critical).
- **Pathia**: Empathy weaver (Poetic/Emotional).
- **Kinesis**: Harmony coordinator (Integration).
- **Somnia**: Somatic driver (Qualia/Feeling).

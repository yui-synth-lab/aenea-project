---
name: consciousness
description: Work with Aenea consciousness system - start/stop consciousness, monitor thought cycles, manage energy levels, trigger sleep mode, or debug consciousness state
allowed-tools: Read, Grep, Glob, Bash
---

# Consciousness System

Aenea意識システムの操作とデバッグ。

## Quick Operations

```bash
# Status / Start / Stop / Sleep
curl http://localhost:3000/api/consciousness/status
curl -X POST http://localhost:3000/api/consciousness/start
curl -X POST http://localhost:3000/api/consciousness/stop
curl -X POST http://localhost:3000/api/consciousness/sleep
```

## Energy Modes

| Mode | Energy | Stages |
|------|--------|--------|
| Critical | < 20 | S1 + S6 + U |
| Low | 20-50 | Reduced |
| Full | > 50 | All |

## SSE Events

`/api/consciousness/events`: `stageChanged`, `stageCompleted`, `triggerGenerated`, `thoughtCycleCompleted`, `dpdUpdated`

# Consciousness System Reference

## Key Files

| Component | Location |
|-----------|----------|
| Backend Controller | [src/server/consciousness-backend.ts](src/server/consciousness-backend.ts) |
| Database Manager | [src/server/database-manager.ts](src/server/database-manager.ts) |
| Internal Trigger | [src/aenea/core/internal-trigger.ts](src/aenea/core/internal-trigger.ts) |
| Stages | [src/aenea/stages/](src/aenea/stages/) |

## Processing Pipeline

```
S0 → S1 → S2 → S3 → S4 → S5 → S6 → U → Memory Learning
```

| Stage | File | Energy |
|-------|------|--------|
| S0 Internal Trigger | [internal-trigger.ts](src/aenea/core/internal-trigger.ts) | 1.0 |
| S1 Individual Thought | [individual-thought.ts](src/aenea/stages/individual-thought.ts) | 0.9-1.0 |
| S2 Mutual Reflection | [mutual-reflection.ts](src/aenea/stages/mutual-reflection.ts) | 0.5 |
| S3 Auditor | [auditor.ts](src/aenea/stages/auditor.ts) | 0.5 |
| S4 DPD Assessment | [dpd-assessors.ts](src/aenea/stages/dpd-assessors.ts) | 0.5 |
| S5 Compiler | [compiler.ts](src/aenea/stages/compiler.ts) | 0.7-0.8 |
| S6 Scribe | [scribe.ts](src/aenea/stages/scribe.ts) | 0.3 |

## Energy Modes Detail

| Mode | Range | Behavior |
|------|-------|----------|
| Critical | < 20 | S1 + S6 + U only |
| Low | 20-50 | Reduced processing |
| Full | > 50 | All stages |

## Real-time Events (SSE) Detail

Endpoint: `/api/consciousness/events`

| Event | When |
|-------|------|
| `stageChanged` | Stage starts |
| `stageCompleted` | Stage finishes |
| `triggerGenerated` | New question (S0) |
| `thoughtCycleCompleted` | Cycle finished |
| `dpdUpdated` | Weights updated (U) |
| `energyUpdated` | Energy changed |

Event naming: past tense with 'd' suffix (e.g., `thoughtCycleCompleted`)

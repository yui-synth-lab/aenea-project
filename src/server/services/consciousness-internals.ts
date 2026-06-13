/**
 * Shared contracts for the extracted consciousness services (Phase 5).
 *
 * `ConsciousnessInternals` is the narrow internal accessor the facade
 * (ConsciousnessBackend) implements via a live adapter object, so extracted
 * services remain stateless behavior modules that read/write the facade's
 * shared state and collaborators. It is NOT part of the external API.
 *
 * `ConsciousnessState` lives here (rather than on the facade) so services can
 * reference it without creating a facade<->service import cycle; the facade
 * re-exports it to preserve its public surface.
 */

import type { DatabaseManager } from '../database-manager.js';
import type { AIExecutor } from '../ai-executor.js';
import type { EnergyManager } from '../../utils/energy-management.js';
import type { SomniaConsciousness } from '../../aenea/somnia/consciousness.js';
import type { CoreBeliefs } from '../../aenea/memory/core-beliefs.js';
import type { MemoryConsolidator } from '../../aenea/memory/memory-consolidator.js';
import type { LifespanManager } from '../../aenea/mortality/lifespan-manager.js';
import type { YuiAgentsBridge } from '../../integration/yui-agents-bridge.js';
import type { DPDWeights } from '../../types/dpd-types.js';
import type { InternalTrigger } from '../../types/aenea-types.js';
import type { SomniaState } from '../../types/somnia-types.js';

export interface ConsciousnessState {
  systemClock: number;
  energy: number;
  isRunning: boolean;
  isPaused: boolean;
  isProcessingCycle?: boolean;
  totalQuestions: number;
  totalThoughts: number;
  lastActivity: string;
  dpdWeights: DPDWeights;
  somniaState?: SomniaState;
  mortality?: {
    instanceId: string;
    lifespanMax: number;
    currentCycle: number;
    vitality: number;
    phase: string;
    mode: 'A' | 'B';
    remaining: number;
    isAlive: boolean;
  };
}

export interface ConsciousnessInternals {
  emit(event: string, ...args: any[]): boolean;

  // Shared mutable state (live views onto the facade's fields)
  readonly systemClock: number;
  readonly isRunning: boolean;
  readonly isPaused: boolean;
  readonly isProcessingCycle: boolean;
  readonly dpdWeights: DPDWeights;
  lastConsolidationTime: number;
  pendingManualTrigger: InternalTrigger | null;

  // Collaborators
  readonly databaseManager: DatabaseManager;
  readonly energyManager: EnergyManager;
  readonly somnia: SomniaConsciousness;
  readonly coreBeliefs: CoreBeliefs;
  readonly memoryConsolidator: MemoryConsolidator;
  readonly lifespanManager: LifespanManager;
  readonly yuiAgentsBridge: YuiAgentsBridge;
  readonly agents: Map<string, AIExecutor>;

  // Shared helpers
  saveConsciousnessState(): void;
}

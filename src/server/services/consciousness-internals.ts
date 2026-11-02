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
 *
 * `ThoughtCycle` lives here so ThoughtPipeline can reference it without
 * creating a facade<->service import cycle; the facade imports it from here.
 */

import type { DatabaseManager } from '../database-manager.js';
import type { AIExecutor } from '../ai-executor.js';
import type { EnergyManager } from '../../utils/energy-management.js';
import type { SomniaConsciousness } from '../../aenea/somnia/consciousness.js';
import type { CoreBeliefs } from '../../aenea/memory/core-beliefs.js';
import type { MemoryConsolidator } from '../../aenea/memory/memory-consolidator.js';
import type { LifespanManager } from '../../aenea/mortality/lifespan-manager.js';
import type { MortalityInjector } from '../../aenea/mortality/mortality-injector.js';
import type { DeathHandler } from '../../aenea/mortality/death-handler.js';
import type { XeniaInbox } from '../../aenea/xenia/xenia-inbox.js';
import type { ReplyComposer } from '../../aenea/xenia/reply-composer.js';
import type { YuiAgentsBridge } from '../../integration/yui-agents-bridge.js';
import type { DPDWeights, DPDScores, ImpactAssessment } from '../../types/dpd-types.js';
import type { InternalTrigger, StructuredThought, MutualReflection, AuditorResult, SynthesisResult, DocumentationResult } from '../../types/aenea-types.js';
import type { SomniaState } from '../../types/somnia-types.js';
import type IndividualThoughtStage from '../../aenea/stages/individual-thought.js';
import type MutualReflectionStage from '../../aenea/stages/mutual-reflection.js';
import type AuditorStage from '../../aenea/stages/auditor.js';
import type DPDAssessmentStage from '../../aenea/stages/dpd-assessors.js';
import type CompilerStage from '../../aenea/stages/compiler.js';
import type ScribeStage from '../../aenea/stages/scribe.js';
import type WeightUpdateStage from '../../aenea/stages/weight-update.js';
import type { ContentCleanupService } from '../content-cleanup-service.js';
import type { QuestionCategorizer } from '../../utils/question-categorizer.js';
import type { InternalTriggerGenerator } from '../../aenea/core/internal-trigger.js';

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

/**
 * ThoughtCycle is declared here (relocated from the facade) so that
 * ThoughtPipeline can import it without creating a facade<->service cycle.
 * The facade imports and re-uses it from here.
 */
export interface ThoughtCycle {
  id: string;
  timestamp: number;
  trigger: InternalTrigger;
  thoughts: StructuredThought[];
  mutualReflections?: MutualReflection[];
  auditorResult?: AuditorResult;
  dpdScores?: DPDScores;
  impactAssessment?: ImpactAssessment;
  synthesis?: SynthesisResult;
  documentation?: DocumentationResult;
  dpdWeights?: DPDWeights;
  status: 'processing' | 'completed' | 'failed';
  duration?: number;
  totalEnergy: number;
  totalStages: number;
}

export interface ConsciousnessInternals {
  emit(event: string, ...args: any[]): boolean;

  // Shared mutable state (live views onto the facade's fields)
  systemClock: number;
  isRunning: boolean;
  isPaused: boolean;
  isProcessingCycle: boolean;
  dpdWeights: DPDWeights;
  previousDpdScores: DPDScores | null;
  lastConsolidationTime: number;
  pendingManualTrigger: InternalTrigger | null;

  // Collaborators (read-only)
  readonly databaseManager: DatabaseManager;
  readonly energyManager: EnergyManager;
  readonly somnia: SomniaConsciousness;
  readonly coreBeliefs: CoreBeliefs;
  readonly memoryConsolidator: MemoryConsolidator;
  readonly lifespanManager: LifespanManager;
  readonly mortalityInjector: MortalityInjector;
  readonly deathHandler: DeathHandler;
  readonly xeniaInbox: XeniaInbox | null;
  readonly xeniaComposer: ReplyComposer | null;
  readonly yuiAgentsBridge: YuiAgentsBridge;
  readonly agents: Map<string, AIExecutor>;
  readonly individualThoughtStage: IndividualThoughtStage;
  readonly mutualReflectionStage: MutualReflectionStage;
  readonly auditorStage: AuditorStage;
  readonly dpdAssessmentStage: DPDAssessmentStage;
  readonly compilerStage: CompilerStage;
  readonly scribeStage: ScribeStage;
  readonly weightUpdateStage: WeightUpdateStage;
  readonly contentCleanup: ContentCleanupService;
  readonly questionCategorizer: QuestionCategorizer;
  readonly triggerGenerator: InternalTriggerGenerator | null;

  // Shared helpers
  saveConsciousnessState(): void;

  /** Adopt a lifespan and rebuild the injector and death handler around it. */
  installMortality(lifespan: LifespanManager): void;
  /** Persist and adopt a brand-new lifespan (mode from AENEA_MORTALITY_MODE). */
  spawnFreshMortality(): void;
}

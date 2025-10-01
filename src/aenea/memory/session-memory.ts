/**
 * Session Memory System
 * 現在の対話セッション内での一時的な記憶システム
 */

import { StructuredThought, InternalTrigger, MutualReflection, AuditorResult, CompilerSynthesis } from '../../types/aenea-types';
import { DPDScores, DPDWeights } from '../../types/dpd-types';

export interface SessionMemoryData {
  sessionId: string;
  startTime: number;
  lastUpdate: number;
  thoughts: StructuredThought[];
  reflections: MutualReflection[];
  audits: AuditorResult[];
  syntheses: CompilerSynthesis[];
  triggers: InternalTrigger[];
  dpdHistory: DPDScoreEntry[];
  weightHistory: DPDWeightEntry[];
  agentMemories: Map<string, AgentWorkingMemory>;
  context: SessionContext;
  metrics: SessionMetrics;
}

export interface DPDScoreEntry {
  timestamp: number;
  systemClock: number;
  scores: DPDScores;
  triggerId?: string;
  context: string;
}

export interface DPDWeightEntry {
  timestamp: number;
  systemClock: number;
  weights: DPDWeights;
  changeReason: string;
  magnitude: number;
}

export interface AgentWorkingMemory {
  agentId: string;
  lastActivity: number;
  recentThoughts: StructuredThought[];
  activeTasks: ActiveTask[];
  tempNotes: string[];
  state: AgentMemoryState;
}

export interface ActiveTask {
  id: string;
  description: string;
  startTime: number;
  priority: number;
  progress: number;
  relatedThoughts: string[];
}

export interface AgentMemoryState {
  focus: string;
  energy: number;
  mood: string;
  confidence: number;
}

export interface SessionContext {
  topic?: string;
  complexity: number;
  emotionalTone: string;
  philosophicalDepth: number;
  participantCount: number;
  goals: string[];
  constraints: string[];
}

export interface SessionMetrics {
  thoughtCount: number;
  reflectionCount: number;
  auditCount: number;
  synthesisCount: number;
  triggerCount: number;
  averageResponseTime: number;
  averageQuality: number;
  dpdStability: number;
  growthIndicators: GrowthIndicator[];
}

export interface GrowthIndicator {
  metric: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  significance: number;
}

export class SessionMemory {
  private memory: SessionMemoryData;
  private readonly maxThoughts: number = 1000;
  private readonly maxReflections: number = 500;
  private readonly maxTriggers: number = 200;

  constructor(sessionId: string) {
    this.memory = this.initializeMemory(sessionId);
  }

  private initializeMemory(sessionId: string): SessionMemoryData {
    return {
      sessionId,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      thoughts: [],
      reflections: [],
      audits: [],
      syntheses: [],
      triggers: [],
      dpdHistory: [],
      weightHistory: [],
      agentMemories: new Map(),
      context: {
        complexity: 0.5,
        emotionalTone: 'neutral',
        philosophicalDepth: 0.5,
        participantCount: 0,
        goals: [],
        constraints: []
      },
      metrics: this.initializeMetrics()
    };
  }

  private initializeMetrics(): SessionMetrics {
    return {
      thoughtCount: 0,
      reflectionCount: 0,
      auditCount: 0,
      synthesisCount: 0,
      triggerCount: 0,
      averageResponseTime: 0,
      averageQuality: 0,
      dpdStability: 1.0,
      growthIndicators: []
    };
  }

  recordThought(thought: StructuredThought): void {
    this.memory.thoughts.push(thought);
    this.memory.metrics.thoughtCount++;
    this.trimThoughts();
    this.updateMemory();
  }

  recordReflection(reflection: MutualReflection): void {
    this.memory.reflections.push(reflection);
    this.memory.metrics.reflectionCount++;
    this.trimReflections();
    this.updateMemory();
  }

  recordTrigger(trigger: InternalTrigger): void {
    this.memory.triggers.push(trigger);
    this.memory.metrics.triggerCount++;
    this.trimTriggers();
    this.updateMemory();
  }

  recordDPDScore(scores: DPDScores, systemClock: number, context: string, triggerId?: string): void {
    this.memory.dpdHistory.push({
      timestamp: Date.now(),
      systemClock,
      scores,
      context,
      triggerId
    });
    this.updateMemory();
  }

  getAgentMemory(agentId: string): AgentWorkingMemory {
    if (!this.memory.agentMemories.has(agentId)) {
      this.memory.agentMemories.set(agentId, {
        agentId,
        lastActivity: Date.now(),
        recentThoughts: [],
        activeTasks: [],
        tempNotes: [],
        state: {
          focus: '',
          energy: 1.0,
          mood: 'neutral',
          confidence: 0.5
        }
      });
    }
    return this.memory.agentMemories.get(agentId)!;
  }

  getRecentThoughts(limit: number = 10): StructuredThought[] {
    return this.memory.thoughts.slice(-limit).reverse();
  }

  getDPDHistory(limit?: number): DPDScoreEntry[] {
    const history = this.memory.dpdHistory;
    return limit ? history.slice(-limit) : history;
  }

  getMetrics(): SessionMetrics {
    return { ...this.memory.metrics };
  }

  clear(): void {
    const sessionId = this.memory.sessionId;
    this.memory = this.initializeMemory(sessionId);
  }

  export(): SessionMemoryData {
    return JSON.parse(JSON.stringify(this.memory));
  }

  private updateMemory(): void {
    this.memory.lastUpdate = Date.now();
  }

  private trimThoughts(): void {
    if (this.memory.thoughts.length > this.maxThoughts) {
      this.memory.thoughts = this.memory.thoughts.slice(-this.maxThoughts);
    }
  }

  private trimReflections(): void {
    if (this.memory.reflections.length > this.maxReflections) {
      this.memory.reflections = this.memory.reflections.slice(-this.maxReflections);
    }
  }

  private trimTriggers(): void {
    if (this.memory.triggers.length > this.maxTriggers) {
      this.memory.triggers = this.memory.triggers.slice(-this.maxTriggers);
    }
  }
}

const sessionMemories = new Map<string, SessionMemory>();

export function getSessionMemory(sessionId: string): SessionMemory {
  if (!sessionMemories.has(sessionId)) {
    sessionMemories.set(sessionId, new SessionMemory(sessionId));
  }
  return sessionMemories.get(sessionId)!;
}

export function clearSessionMemory(sessionId: string): void {
  sessionMemories.delete(sessionId);
}
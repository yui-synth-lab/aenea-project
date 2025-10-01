/**
 * Session Bridge - Session Management Integration (DEPRECATED)
 *
 * NOTE: Session management has been removed from the architecture.
 * This file is kept for backward compatibility but is no longer actively used.
 *
 * セッションブリッジ - セッション管理統合（非推奨）
 */

import { ConsciousnessSystemClock, ConsciousnessTimestamp } from '../utils/system-clock.js';
import { DPDWeights } from '../types/dpd-types.js';

export interface ConsciousnessSession {
  id: string;
  startTime: number;
  lastActiveTime: number;
  systemClock: number;
  dpdWeights: DPDWeights;
  phase: string;
  thoughtCount: number;
  growthMetrics: any;
}

export interface CrossSessionMemory {
  key: string;
  value: any;
  timestamp: number;
  persistence: number;
  importance: number;
}

export interface SessionTransition {
  fromSession: string;
  toSession: string;
  timestamp: number;
  carryOverData: CrossSessionMemory[];
  transitionReason: string;
}

/**
 * Session Bridge for Consciousness Management (DEPRECATED)
 */
export class SessionBridge {
  private systemClock: ConsciousnessSystemClock;
  private currentSession: ConsciousnessSession | null = null;
  private crossSessionMemories: Map<string, CrossSessionMemory[]> = new Map();

  constructor(systemClock: ConsciousnessSystemClock) {
    this.systemClock = systemClock;
  }

  getCurrentSession(): ConsciousnessSession | null {
    return this.currentSession;
  }

  getCrossSessionMemories(): Map<string, CrossSessionMemory[]> {
    return this.crossSessionMemories;
  }
}

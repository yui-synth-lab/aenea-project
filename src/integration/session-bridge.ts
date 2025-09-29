/**
 * Session Bridge - Session Management Integration
 *
 * Bridges Aenea consciousness sessions with the underlying Yui Protocol
 * session management system, enabling persistent consciousness states.
 *
 * セッションブリッジ - セッション管理統合
 * AeneaとYuiプロトコルのセッション管理システムを統合
 */

import { SessionManager } from '../server/session-manager.js';
import { ConsciousnessSystemClock, ConsciousnessTimestamp } from '../utils/system-clock.js';
import { DPDWeights } from '../types/dpd-types.js';

export interface ConsciousnessSession {
  id: string;
  startTime: number;
  lastActiveTime: number;
  systemClock: number;
  dpdWeights: DPDWeights;
  phase: string;
  questionCount: number;
  thoughtCycleCount: number;
  energyLevel: number;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  version: string;
  yuiProtocolVersion?: string;
  evolutionStage: number;        // 進化段階
  philosophicalDepth: number;    // 哲学的深度
  averageImportance: number;     // 平均重要度
  lastSaveTime: number;
  tags: string[];
  notes?: string;
}

export interface SessionTransition {
  fromSessionId: string | null;
  toSessionId: string;
  transitionTime: number;
  preservedState: Partial<ConsciousnessSession>;
  lostState: string[];         // What couldn't be preserved
  bridgeQuality: number;       // 0-1, how well the transition preserved state
}

export interface CrossSessionMemory {
  sessionId: string;
  timestamp: number;
  memoryType: 'question' | 'insight' | 'pattern' | 'weight_evolution' | 'philosophical_discovery';
  content: any;
  importance: number;
  persistenceLevel: 'session' | 'short_term' | 'long_term' | 'permanent';
  tags: string[];
}

/**
 * Session Bridge for Consciousness Management
 * 意識管理用セッションブリッジ
 */
export class SessionBridge {
  private sessionManager: SessionManager;
  private systemClock: ConsciousnessSystemClock;
  private currentSession: ConsciousnessSession | null = null;
  private crossSessionMemories: Map<string, CrossSessionMemory[]> = new Map();
  private sessionHistory: SessionTransition[] = [];
  private readonly maxSessionHistory = 10;
  private readonly maxCrossSessionMemories = 100;

  constructor(sessionManager: SessionManager, systemClock: ConsciousnessSystemClock) {
    this.sessionManager = sessionManager;
    this.systemClock = systemClock;
    this.loadCrossSessionMemories();
  }

  /**
   * Initialize new consciousness session
   * 新しい意識セッションを初期化
   */
  async initializeSession(
    dpdWeights: DPDWeights,
    phase: string = 'awakening',
    metadata?: Partial<SessionMetadata>
  ): Promise<ConsciousnessSession> {
    const sessionId = this.sessionManager.getCurrentSessionId();
    const timestamp = Date.now();

    const session: ConsciousnessSession = {
      id: sessionId,
      startTime: timestamp,
      lastActiveTime: timestamp,
      systemClock: this.systemClock.getCurrentClock(),
      dpdWeights: { ...dpdWeights },
      phase,
      questionCount: 0,
      thoughtCycleCount: 0,
      energyLevel: 1.0,
      metadata: {
        version: '1.0.0',
        evolutionStage: 1,
        philosophicalDepth: 0.5,
        averageImportance: 0.5,
        lastSaveTime: timestamp,
        tags: ['fresh_start'],
        ...metadata
      }
    };

    // Record session transition
    // セッション遷移を記録
    const transition: SessionTransition = {
      fromSessionId: this.currentSession?.id || null,
      toSessionId: sessionId,
      transitionTime: timestamp,
      preservedState: this.extractPreservableState(),
      lostState: [],
      bridgeQuality: this.currentSession ? 0.7 : 1.0 // Lower quality when transitioning from existing session
    };

    this.sessionHistory.push(transition);
    if (this.sessionHistory.length > this.maxSessionHistory) {
      this.sessionHistory.shift();
    }

    this.currentSession = session;

    // Apply preserved state if available
    // 利用可能な場合、保存状態を適用
    if (transition.preservedState.dpdWeights) {
      this.currentSession.dpdWeights = transition.preservedState.dpdWeights;
    }

    if (transition.preservedState.systemClock) {
      this.systemClock.setClock(transition.preservedState.systemClock);
      this.currentSession.systemClock = transition.preservedState.systemClock;
    }

    await this.saveSession();

    return session;
  }

  /**
   * Update current session state
   * 現在のセッション状態を更新
   */
  async updateSession(updates: Partial<ConsciousnessSession>): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session to update');
    }

    // Apply updates
    // 更新を適用
    Object.assign(this.currentSession, updates);
    this.currentSession.lastActiveTime = Date.now();
    this.currentSession.metadata.lastSaveTime = Date.now();

    await this.saveSession();
  }

  /**
   * Record cross-session memory
   * クロスセッション記憶を記録
   */
  recordMemory(memory: Omit<CrossSessionMemory, 'sessionId' | 'timestamp'>): void {
    if (!this.currentSession) return;

    const fullMemory: CrossSessionMemory = {
      ...memory,
      sessionId: this.currentSession.id,
      timestamp: Date.now()
    };

    const sessionMemories = this.crossSessionMemories.get(this.currentSession.id) || [];
    sessionMemories.push(fullMemory);

    // Sort by importance and trim if necessary
    // 重要度でソートし、必要に応じて切り詰め
    sessionMemories.sort((a, b) => b.importance - a.importance);
    if (sessionMemories.length > this.maxCrossSessionMemories) {
      sessionMemories.splice(this.maxCrossSessionMemories);
    }

    this.crossSessionMemories.set(this.currentSession.id, sessionMemories);
    this.saveCrossSessionMemories();
  }

  /**
   * Retrieve memories for current or specific session
   * 現在または特定のセッションの記憶を取得
   */
  getMemories(
    sessionId?: string,
    memoryType?: CrossSessionMemory['memoryType'],
    minImportance?: number
  ): CrossSessionMemory[] {
    const targetSessionId = sessionId || this.currentSession?.id;
    if (!targetSessionId) return [];

    let memories = this.crossSessionMemories.get(targetSessionId) || [];

    if (memoryType) {
      memories = memories.filter(m => m.memoryType === memoryType);
    }

    if (minImportance !== undefined) {
      memories = memories.filter(m => m.importance >= minImportance);
    }

    return memories;
  }

  /**
   * Get memories from all sessions for consciousness continuity
   * 意識継続性のため全セッションから記憶を取得
   */
  getGlobalMemories(
    memoryType?: CrossSessionMemory['memoryType'],
    minImportance: number = 0.7,
    maxResults: number = 20
  ): CrossSessionMemory[] {
    const allMemories: CrossSessionMemory[] = [];

    this.crossSessionMemories.forEach(sessionMemories => {
      allMemories.push(...sessionMemories);
    });

    let filtered = allMemories;

    if (memoryType) {
      filtered = filtered.filter(m => m.memoryType === memoryType);
    }

    if (minImportance !== undefined) {
      filtered = filtered.filter(m => m.importance >= minImportance);
    }

    // Sort by importance and timestamp, take most important recent memories
    // 重要度とタイムスタンプでソート、最も重要な最近の記憶を取得
    filtered.sort((a, b) => {
      const importanceDiff = b.importance - a.importance;
      if (Math.abs(importanceDiff) > 0.1) return importanceDiff;
      return b.timestamp - a.timestamp;
    });

    return filtered.slice(0, maxResults);
  }

  /**
   * Get session statistics and analytics
   * セッション統計と分析を取得
   */
  getSessionAnalytics(): {
    currentSession: ConsciousnessSession | null;
    sessionHistory: SessionTransition[];
    totalMemories: number;
    memoryByType: Record<string, number>;
    averageBridgeQuality: number;
    sessionDuration: number;
    evolutionProgress: number;
  } {
    const totalMemories = Array.from(this.crossSessionMemories.values())
      .reduce((sum, memories) => sum + memories.length, 0);

    const memoryByType: Record<string, number> = {};
    this.crossSessionMemories.forEach(memories => {
      memories.forEach(memory => {
        memoryByType[memory.memoryType] = (memoryByType[memory.memoryType] || 0) + 1;
      });
    });

    const averageBridgeQuality = this.sessionHistory.length > 0 ?
      this.sessionHistory.reduce((sum, t) => sum + t.bridgeQuality, 0) / this.sessionHistory.length : 1.0;

    const sessionDuration = this.currentSession ?
      Date.now() - this.currentSession.startTime : 0;

    const evolutionProgress = this.currentSession ?
      Math.min(1, this.currentSession.metadata.evolutionStage / 10) : 0;

    return {
      currentSession: this.currentSession,
      sessionHistory: [...this.sessionHistory],
      totalMemories,
      memoryByType,
      averageBridgeQuality,
      sessionDuration,
      evolutionProgress
    };
  }

  /**
   * Restore session from storage
   * ストレージからセッションを復元
   */
  async restoreSession(sessionId?: string): Promise<ConsciousnessSession | null> {
    try {
      const sessionData = this.sessionManager.loadLatestSession();
      if (!sessionData) return null;

      // Reconstruct consciousness session from session data
      // セッションデータから意識セッションを再構築
      const restoredSession: ConsciousnessSession = {
        id: sessionId || this.sessionManager.getCurrentSessionId(),
        startTime: new Date(sessionData.lastSaved).getTime() || Date.now(),
        lastActiveTime: Date.now(),
        systemClock: sessionData.systemClock || 0,
        dpdWeights: {
          empathy: 0.33,
          coherence: 0.33,
          dissonance: 0.34,
          timestamp: Date.now(),
          version: 1
        },
        phase: 'awakening',
        questionCount: sessionData.totalQuestions || 0,
        thoughtCycleCount: sessionData.totalThoughts || 0,
        energyLevel: sessionData.energy || 1.0,
        metadata: {
          version: '1.0.0',
          evolutionStage: 1,
          philosophicalDepth: 0.5,
          averageImportance: 0.5,
          lastSaveTime: Date.now(),
          tags: ['restored']
        }
      };

      this.currentSession = restoredSession;

      // Update system clock
      // システムクロックを更新
      if (sessionData.systemClock) {
        this.systemClock.setClock(sessionData.systemClock);
      }

      return restoredSession;

    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  }

  /**
   * Get current session
   * 現在のセッションを取得
   */
  getCurrentSession(): ConsciousnessSession | null {
    return this.currentSession;
  }

  /**
   * End current session gracefully
   * 現在のセッションを適切に終了
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    // Save final state
    // 最終状態を保存
    await this.saveSession();

    // Record session end memory
    // セッション終了記憶を記録
    this.recordMemory({
      memoryType: 'philosophical_discovery',
      content: {
        sessionSummary: {
          duration: Date.now() - this.currentSession.startTime,
          questionCount: this.currentSession.questionCount,
          thoughtCycleCount: this.currentSession.thoughtCycleCount,
          finalPhase: this.currentSession.phase,
          evolutionStage: this.currentSession.metadata.evolutionStage
        }
      },
      importance: 0.8,
      persistenceLevel: 'long_term',
      tags: ['session_end', 'summary']
    });

    this.currentSession = null;
  }

  /**
   * Extract state that can be preserved across sessions
   * セッション間で保存可能な状態を抽出
   */
  private extractPreservableState(): Partial<ConsciousnessSession> {
    if (!this.currentSession) return {};

    return {
      systemClock: this.currentSession.systemClock,
      dpdWeights: this.currentSession.dpdWeights,
      metadata: {
        ...this.currentSession.metadata,
        evolutionStage: this.currentSession.metadata.evolutionStage,
        philosophicalDepth: this.currentSession.metadata.philosophicalDepth
      }
    };
  }

  /**
   * Save current session to storage
   * 現在のセッションをストレージに保存
   */
  private async saveSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      this.sessionManager.saveSession({
        systemClock: this.currentSession.systemClock,
        energy: this.currentSession.energyLevel,
        totalQuestions: this.currentSession.questionCount,
        totalThoughts: this.currentSession.thoughtCycleCount,
        questionHistory: [], // This would be populated from consciousness backend
        thoughtHistory: []   // This would be populated from consciousness backend
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Load cross-session memories from storage
   * ストレージからクロスセッション記憶を読み込み
   */
  private loadCrossSessionMemories(): void {
    try {
      // This would be implemented with actual persistent storage
      // 実際の永続ストレージで実装される
      const stored = localStorage.getItem('aenea_cross_session_memories');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.crossSessionMemories = new Map(parsed);
      }
    } catch (error) {
      console.error('Failed to load cross-session memories:', error);
    }
  }

  /**
   * Save cross-session memories to storage
   * クロスセッション記憶をストレージに保存
   */
  private saveCrossSessionMemories(): void {
    try {
      const serializable = Array.from(this.crossSessionMemories.entries());
      localStorage.setItem('aenea_cross_session_memories', JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to save cross-session memories:', error);
    }
  }
}

/**
 * Create session bridge with default configuration
 * デフォルト設定でセッションブリッジを作成
 */
export function createSessionBridge(
  sessionManager: SessionManager,
  systemClock: ConsciousnessSystemClock
): SessionBridge {
  return new SessionBridge(sessionManager, systemClock);
}
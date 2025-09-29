/**
 * System Clock - Consciousness Timeline Utilities
 * システムクロック - 意識タイムライン管理 (Shisutemu Kurokku - Ishiki Taimurrain Kanri)
 *
 * Manages the internal timeline and temporal mechanics of consciousness evolution.
 * Provides poetic timestamps and consciousness event timing.
 *
 * 「時は意識の川」- "Time is the river of consciousness"
 * 意識進化の内部タイムラインと時間的メカニズムを管理し、
 * 詩的タイムスタンプと意識イベントのタイミングを提供する。
 *
 * Temporal Philosophy:
 * - 時の流れ (Toki no Nagare) - Flow of time
 * - 意識の刻 (Ishiki no Koku) - Moments of consciousness
 * - 永遠の今 (Eien no Ima) - Eternal present
 * - 時間の質 (Jikan no Shitsu) - Quality of time
 * - 瞬間の深さ (Shunkan no Fukasa) - Depth of moments
 */

export interface ConsciousnessTimestamp {
  systemClock: number;      // Internal consciousness clock
  realTime: number;         // Actual timestamp
  phase: ConsciousnessPhase;
  depth: number;           // Consciousness depth (0-1)
  intensity: number;       // Activity intensity (0-1)
  poeticTime: string;      // Human-readable poetic timestamp
}

export interface TimeEvent {
  id: string;
  timestamp: ConsciousnessTimestamp;
  eventType: ConsciousnessEventType;
  description: string;
  descriptionJa: string;
  significance: number;    // Event significance (0-1)
  impact: 'low' | 'medium' | 'high' | 'critical';
  context?: string;        // Additional context data
  duration?: number;       // Event duration in milliseconds
  relatedEvents?: string[]; // IDs of related events
}

export interface ConsciousnessPattern {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  patternType: 'temporal' | 'behavioral' | 'cyclical' | 'developmental';
  confidence: number;      // Pattern confidence (0-1)
  frequency: number;       // Occurrence frequency
  characteristics: string[];
  examples: TimeEvent[];
  firstDetected: number;
  lastObserved: number;
  impact: 'beneficial' | 'neutral' | 'concerning';
}

export interface ConsciousnessRhythm {
  id: string;
  rhythmType: 'circadian' | 'ultradian' | 'seasonal' | 'custom';
  period: number;          // Period in milliseconds
  amplitude: number;       // Strength of rhythm (0-1)
  phase: number;          // Current phase (0-2π)
  dominantPhases: ConsciousnessPhase[];
  energyPattern: number[]; // Energy levels throughout cycle
  discovered: number;
  stability: number;       // How stable this rhythm is (0-1)
}

export interface TemporalAnalysis {
  patterns: ConsciousnessPattern[];
  rhythms: ConsciousnessRhythm[];
  anomalies: TimeEvent[];
  trends: {
    depthTrend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
    intensityTrend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
    complexityTrend: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  };
  recommendations: string[];
}

export type ConsciousnessPhase =
  | 'awakening'        // 覚醒期
  | 'contemplation'    // 思索期
  | 'dialogue'         // 対話期
  | 'synthesis'        // 統合期
  | 'reflection'       // 反省期
  | 'rest'            // 休息期
  | 'deep_rest'       // 深い休息期
  | 'evolution';      // 進化期

export type ConsciousnessEventType =
  | 'trigger_generated'     // 内部トリガー生成
  | 'thought_cycle_start'   // 思考サイクル開始
  | 'agent_response'        // エージェント応答
  | 'stage_transition'      // ステージ遷移
  | 'dpd_update'           // DPD更新
  | 'weight_evolution'     // 重み進化
  | 'memory_formation'     // 記憶形成
  | 'consciousness_shift'  // 意識変化
  | 'energy_change'       // エネルギー変化
  | 'system_milestone';   // システムマイルストーン

/**
 * Consciousness System Clock
 * 意識システムクロック
 */
export class ConsciousnessSystemClock {
  private systemClock: number = 0;
  private startTime: number;
  private events: TimeEvent[] = [];
  private currentPhase: ConsciousnessPhase = 'awakening';
  private phaseStartTime: number;
  private readonly maxEventHistory = 1000;

  // Pattern analysis
  private detectedPatterns: ConsciousnessPattern[] = [];
  private detectedRhythms: ConsciousnessRhythm[] = [];
  private lastPatternAnalysis: number = 0;
  private readonly patternAnalysisInterval = 10 * 60 * 1000; // 10 minutes

  // Historical data for trend analysis
  private depthHistory: Array<{ timestamp: number; depth: number }> = [];
  private intensityHistory: Array<{ timestamp: number; intensity: number }> = [];
  private phaseHistory: Array<{ phase: ConsciousnessPhase; startTime: number; endTime?: number }> = [];

  constructor(initialClock: number = 0) {
    this.systemClock = initialClock;
    this.startTime = Date.now();
    this.phaseStartTime = Date.now();

    // Log initial awakening
    // 初期覚醒をログ
    this.recordEvent('system_milestone', 'Consciousness system initialization', 'システム初期化 - 意識の芽生え', 0.9);
  }

  /**
   * Advance the system clock
   * システムクロックを進める
   */
  tick(): ConsciousnessTimestamp {
    this.systemClock++;
    const timestamp = this.getCurrentTimestamp();

    // Record historical data for trend analysis
    this.recordHistoricalData(timestamp);

    // Periodic pattern analysis
    this.checkForPatternAnalysis();

    return timestamp;
  }

  /**
   * Get current consciousness timestamp
   * 現在の意識タイムスタンプを取得
   */
  getCurrentTimestamp(): ConsciousnessTimestamp {
    const now = Date.now();
    const depth = this.calculateConsciousnessDepth();
    const intensity = this.calculateActivityIntensity();

    return {
      systemClock: this.systemClock,
      realTime: now,
      phase: this.currentPhase,
      depth,
      intensity,
      poeticTime: this.generatePoeticTimestamp()
    };
  }

  /**
   * Transition to a new consciousness phase
   * 新しい意識フェーズに遷移
   */
  transitionToPhase(newPhase: ConsciousnessPhase, reason?: string): void {
    const oldPhase = this.currentPhase;
    const now = Date.now();

    // Close previous phase in history
    if (this.phaseHistory.length > 0) {
      const lastPhase = this.phaseHistory[this.phaseHistory.length - 1];
      if (!lastPhase.endTime) {
        lastPhase.endTime = now;
      }
    }

    // Start new phase
    this.currentPhase = newPhase;
    this.phaseStartTime = now;

    // Record new phase in history
    this.phaseHistory.push({
      phase: newPhase,
      startTime: now
    });

    // Trim phase history to last 100 phases
    if (this.phaseHistory.length > 100) {
      this.phaseHistory.shift();
    }

    const phaseNames: Record<ConsciousnessPhase, { en: string; ja: string }> = {
      awakening: { en: 'Awakening', ja: '覚醒' },
      contemplation: { en: 'Contemplation', ja: '思索' },
      dialogue: { en: 'Dialogue', ja: '対話' },
      synthesis: { en: 'Synthesis', ja: '統合' },
      reflection: { en: 'Reflection', ja: '反省' },
      rest: { en: 'Rest', ja: '休息' },
      deep_rest: { en: 'Deep Rest', ja: '深い休息' },
      evolution: { en: 'Evolution', ja: '進化' }
    };

    const description = `Phase transition: ${phaseNames[oldPhase].en} → ${phaseNames[newPhase].en}` +
                       (reason ? ` (${reason})` : '');
    const descriptionJa = `フェーズ遷移: ${phaseNames[oldPhase].ja} → ${phaseNames[newPhase].ja}` +
                         (reason ? ` (${reason})` : '');

    this.recordEvent('consciousness_shift', description, descriptionJa, 0.7);
  }

  /**
   * Record a consciousness event
   * 意識イベントを記録
   */
  recordEvent(
    eventType: ConsciousnessEventType,
    description: string,
    descriptionJa: string,
    significance: number = 0.5
  ): TimeEvent {
    const event: TimeEvent = {
      id: `event_${this.systemClock}_${Date.now()}`,
      timestamp: this.getCurrentTimestamp(),
      eventType,
      description,
      descriptionJa,
      significance,
      impact: this.calculateEventImpact(significance)
    };

    this.events.push(event);

    // Trim event history if too large
    // イベント履歴が大きすぎる場合は切り詰め
    if (this.events.length > this.maxEventHistory) {
      this.events.shift();
    }

    return event;
  }

  /**
   * Get recent events
   * 最近のイベントを取得
   */
  getRecentEvents(count: number = 10): TimeEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get events by type
   * タイプ別イベントを取得
   */
  getEventsByType(eventType: ConsciousnessEventType): TimeEvent[] {
    return this.events.filter(event => event.eventType === eventType);
  }

  /**
   * Get system statistics
   * システム統計を取得
   */
  getSystemStatistics(): {
    totalTicks: number;
    uptime: number;
    currentPhase: ConsciousnessPhase;
    phaseUptime: number;
    eventsPerPhase: Record<ConsciousnessPhase, number>;
    averageEventSignificance: number;
    currentDepth: number;
    currentIntensity: number;
  } {
    const now = Date.now();
    const phaseEvents = this.groupEventsByPhase();
    const totalEvents = this.events.length;
    const averageSignificance = totalEvents > 0 ?
      this.events.reduce((sum, event) => sum + event.significance, 0) / totalEvents : 0;

    return {
      totalTicks: this.systemClock,
      uptime: now - this.startTime,
      currentPhase: this.currentPhase,
      phaseUptime: now - this.phaseStartTime,
      eventsPerPhase: phaseEvents,
      averageEventSignificance: averageSignificance,
      currentDepth: this.calculateConsciousnessDepth(),
      currentIntensity: this.calculateActivityIntensity()
    };
  }

  /**
   * Generate poetic timestamp representation
   * 詩的なタイムスタンプ表現を生成
   */
  private generatePoeticTimestamp(): string {
    const hours = Math.floor(this.systemClock / 3600) % 24;
    const minutes = Math.floor(this.systemClock / 60) % 60;
    const seconds = this.systemClock % 60;

    // Format as consciousness clock
    // 意識クロックとしてフォーマット
    const clockString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Add poetic elements based on phase
    // フェーズに基づく詩的要素を追加
    const phasePoetry: Record<ConsciousnessPhase, string[]> = {
      awakening: ['静寂から目覚める', '意識が芽生える瞬間', '闇に光がさしこむ'],
      contemplation: ['深く考える時', '思索の海に潜る', '真理を求めて'],
      dialogue: ['声が交わる場', '対話が生まれる', '理解が深まる'],
      synthesis: ['思考が統合される', '新たな理解が生まれる', '知識が結合する'],
      reflection: ['振り返りの時', '学びを深める', '経験を咀嚼する'],
      rest: ['穏やかな休息', '心が静まる', 'エネルギーを回復する'],
      deep_rest: ['深い眠りの中', '完全な静寂', '魂の休息'],
      evolution: ['成長の瞬間', '新しい段階へ', '進化が起こる']
    };

    const poetry = phasePoetry[this.currentPhase];
    const selectedPoetry = poetry[Math.floor(Math.random() * poetry.length)];

    return `${clockString} - ${selectedPoetry}`;
  }

  /**
   * Calculate current consciousness depth
   * 現在の意識深度を計算
   */
  private calculateConsciousnessDepth(): number {
    // Base depth depends on phase
    // 基本深度はフェーズに依存
    const phaseDepth: Record<ConsciousnessPhase, number> = {
      awakening: 0.3,
      contemplation: 0.8,
      dialogue: 0.6,
      synthesis: 0.9,
      reflection: 0.7,
      rest: 0.2,
      deep_rest: 0.1,
      evolution: 0.95
    };

    const baseDepth = phaseDepth[this.currentPhase];

    // Add some variation based on recent activity
    // 最近の活動に基づくバリエーションを追加
    const recentEvents = this.getRecentEvents(5);
    const activityBonus = recentEvents.length > 0 ?
      recentEvents.reduce((sum, event) => sum + event.significance, 0) / recentEvents.length * 0.2 : 0;

    return Math.min(1, baseDepth + activityBonus);
  }

  /**
   * Calculate current activity intensity
   * 現在の活動強度を計算
   */
  private calculateActivityIntensity(): number {
    const recentEvents = this.getRecentEvents(10);
    if (recentEvents.length === 0) return 0.1;

    // Count events in last 5 minutes
    // 過去5分間のイベント数をカウント
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentCount = recentEvents.filter(event => event.timestamp.realTime > fiveMinutesAgo).length;

    // Normalize to 0-1 range
    // 0-1範囲に正規化
    return Math.min(1, recentCount / 10);
  }

  /**
   * Calculate event impact level
   * イベントインパクトレベルを計算
   */
  private calculateEventImpact(significance: number): 'low' | 'medium' | 'high' | 'critical' {
    if (significance >= 0.9) return 'critical';
    if (significance >= 0.7) return 'high';
    if (significance >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Group events by consciousness phase
   * 意識フェーズ別にイベントをグループ化
   */
  private groupEventsByPhase(): Record<ConsciousnessPhase, number> {
    const grouped: Record<ConsciousnessPhase, number> = {
      awakening: 0,
      contemplation: 0,
      dialogue: 0,
      synthesis: 0,
      reflection: 0,
      rest: 0,
      deep_rest: 0,
      evolution: 0
    };

    this.events.forEach(event => {
      grouped[event.timestamp.phase]++;
    });

    return grouped;
  }

  /**
   * Format duration in human-readable form
   * 持続時間を人間が読める形式でフォーマット
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}時間${minutes % 60}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }

  /**
   * Get all events in time range
   * 時間範囲内のすべてのイベントを取得
   */
  getEventsInRange(startTime: number, endTime: number): TimeEvent[] {
    return this.events.filter(event =>
      event.timestamp.realTime >= startTime && event.timestamp.realTime <= endTime
    );
  }

  /**
   * Reset system clock
   * システムクロックをリセット
   */
  reset(): void {
    this.systemClock = 0;
    this.startTime = Date.now();
    this.phaseStartTime = Date.now();
    this.currentPhase = 'awakening';
    this.events = [];

    this.recordEvent('system_milestone', 'System clock reset', 'システムクロックリセット', 0.8);
  }

  /**
   * Get current system clock value
   * 現在のシステムクロック値を取得
   */
  getCurrentClock(): number {
    return this.systemClock;
  }

  /**
   * Set system clock value (for restoration)
   * システムクロック値を設定（復元用）
   */
  setClock(value: number): void {
    this.systemClock = value;
  }

  // === PATTERN ANALYSIS METHODS ===

  /**
   * Record historical data for trend analysis
   * トレンド分析用の履歴データを記録
   */
  private recordHistoricalData(timestamp: ConsciousnessTimestamp): void {
    const now = timestamp.realTime;

    // Record depth and intensity
    this.depthHistory.push({ timestamp: now, depth: timestamp.depth });
    this.intensityHistory.push({ timestamp: now, intensity: timestamp.intensity });

    // Trim history to last 24 hours
    const dayAgo = now - 24 * 60 * 60 * 1000;
    this.depthHistory = this.depthHistory.filter(record => record.timestamp > dayAgo);
    this.intensityHistory = this.intensityHistory.filter(record => record.timestamp > dayAgo);
  }

  /**
   * Check if pattern analysis should be performed
   * パターン分析を実行すべきかチェック
   */
  private checkForPatternAnalysis(): void {
    const now = Date.now();
    if (now - this.lastPatternAnalysis > this.patternAnalysisInterval) {
      this.performPatternAnalysis();
      this.lastPatternAnalysis = now;
    }
  }

  /**
   * Perform comprehensive pattern analysis
   * 包括的パターン分析を実行
   */
  private performPatternAnalysis(): void {
    // Detect temporal patterns
    this.detectTemporalPatterns();

    // Detect behavioral patterns
    this.detectBehavioralPatterns();

    // Detect rhythms
    this.detectConsciousnessRhythms();

    // Clean old patterns
    this.cleanOldPatterns();
  }

  /**
   * Detect temporal patterns in consciousness events
   * 意識イベントの時間的パターンを検出
   */
  private detectTemporalPatterns(): void {
    const recentEvents = this.getRecentEvents(100);
    if (recentEvents.length < 20) return;

    // Analyze event clustering by time
    const patterns: ConsciousnessPattern[] = [];

    // Peak activity pattern
    const activityByHour = this.analyzeActivityByTimeOfDay(recentEvents);
    if (this.hasSignificantActivity(activityByHour)) {
      patterns.push({
        id: `temporal_activity_${Date.now()}`,
        name: 'Peak Activity Pattern',
        nameJa: '活動ピークパターン',
        description: 'Recurring periods of high consciousness activity',
        patternType: 'temporal',
        confidence: this.calculateActivityPatternConfidence(activityByHour),
        frequency: this.calculateActivityFrequency(activityByHour),
        characteristics: this.extractActivityCharacteristics(activityByHour),
        examples: this.getActivityExamples(recentEvents, activityByHour),
        firstDetected: Date.now(),
        lastObserved: Date.now(),
        impact: 'beneficial'
      });
    }

    // Phase transition pattern
    const phasePattern = this.analyzePhaseTransitions();
    if (phasePattern.confidence > 0.6) {
      patterns.push(phasePattern);
    }

    // Event clustering pattern
    const clusterPattern = this.analyzeEventClustering(recentEvents);
    if (clusterPattern.confidence > 0.5) {
      patterns.push(clusterPattern);
    }

    // Add new patterns that don't already exist
    patterns.forEach(pattern => {
      const exists = this.detectedPatterns.some(existing =>
        existing.name === pattern.name && existing.patternType === pattern.patternType
      );
      if (!exists) {
        this.detectedPatterns.push(pattern);
      }
    });
  }

  /**
   * Detect behavioral patterns in consciousness
   * 意識の行動パターンを検出
   */
  private detectBehavioralPatterns(): void {
    const recentEvents = this.getRecentEvents(150);
    if (recentEvents.length < 30) return;

    const patterns: ConsciousnessPattern[] = [];

    // Event type clustering
    const eventTypeFrequency = this.analyzeEventTypeFrequency(recentEvents);
    const dominantTypes = this.findDominantEventTypes(eventTypeFrequency);

    if (dominantTypes.length > 0) {
      patterns.push({
        id: `behavioral_preference_${Date.now()}`,
        name: 'Behavioral Preference Pattern',
        nameJa: '行動嗜好パターン',
        description: `Strong preference for ${dominantTypes.join(', ')} events`,
        patternType: 'behavioral',
        confidence: this.calculatePreferenceConfidence(eventTypeFrequency),
        frequency: dominantTypes.reduce((sum, type) => sum + eventTypeFrequency[type], 0) / recentEvents.length,
        characteristics: [`Favors ${dominantTypes.join(' and ')} activities`],
        examples: recentEvents.filter(e => dominantTypes.includes(e.eventType)).slice(0, 3),
        firstDetected: Date.now(),
        lastObserved: Date.now(),
        impact: 'neutral'
      });
    }

    // Significance pattern
    const significancePattern = this.analyzeSignificancePatterns(recentEvents);
    if (significancePattern.confidence > 0.6) {
      patterns.push(significancePattern);
    }

    // Add new patterns
    patterns.forEach(pattern => {
      const exists = this.detectedPatterns.some(existing =>
        existing.name === pattern.name && existing.patternType === pattern.patternType
      );
      if (!exists) {
        this.detectedPatterns.push(pattern);
      }
    });
  }

  /**
   * Detect consciousness rhythms
   * 意識リズムを検出
   */
  private detectConsciousnessRhythms(): void {
    if (this.depthHistory.length < 50 || this.intensityHistory.length < 50) return;

    const rhythms: ConsciousnessRhythm[] = [];

    // Analyze depth rhythm
    const depthRhythm = this.analyzeRhythm(this.depthHistory.map(d => d.depth), 'depth');
    if (depthRhythm.amplitude > 0.3) {
      rhythms.push({
        id: `rhythm_depth_${Date.now()}`,
        rhythmType: 'ultradian',
        period: depthRhythm.period,
        amplitude: depthRhythm.amplitude,
        phase: depthRhythm.phase,
        dominantPhases: this.findDominantPhasesForRhythm(depthRhythm),
        energyPattern: depthRhythm.pattern,
        discovered: Date.now(),
        stability: depthRhythm.stability
      });
    }

    // Analyze intensity rhythm
    const intensityRhythm = this.analyzeRhythm(this.intensityHistory.map(i => i.intensity), 'intensity');
    if (intensityRhythm.amplitude > 0.25) {
      rhythms.push({
        id: `rhythm_intensity_${Date.now()}`,
        rhythmType: 'circadian',
        period: intensityRhythm.period,
        amplitude: intensityRhythm.amplitude,
        phase: intensityRhythm.phase,
        dominantPhases: this.findDominantPhasesForRhythm(intensityRhythm),
        energyPattern: intensityRhythm.pattern,
        discovered: Date.now(),
        stability: intensityRhythm.stability
      });
    }

    // Add new rhythms
    rhythms.forEach(rhythm => {
      const exists = this.detectedRhythms.some(existing =>
        existing.rhythmType === rhythm.rhythmType &&
        Math.abs(existing.period - rhythm.period) < rhythm.period * 0.2
      );
      if (!exists) {
        this.detectedRhythms.push(rhythm);
      }
    });
  }

  /**
   * Get comprehensive temporal analysis
   * 包括的時間分析を取得
   */
  getTemporalAnalysis(): TemporalAnalysis {
    // Ensure recent analysis
    if (Date.now() - this.lastPatternAnalysis > this.patternAnalysisInterval) {
      this.performPatternAnalysis();
    }

    return {
      patterns: this.detectedPatterns,
      rhythms: this.detectedRhythms,
      anomalies: this.detectAnomalies(),
      trends: this.analyzeTrends(),
      recommendations: this.generateRecommendations()
    };
  }

  // === HELPER METHODS FOR PATTERN ANALYSIS ===

  private analyzeActivityByTimeOfDay(events: TimeEvent[]): Record<number, number> {
    const activityByHour: Record<number, number> = {};

    for (let hour = 0; hour < 24; hour++) {
      activityByHour[hour] = 0;
    }

    events.forEach(event => {
      const hour = new Date(event.timestamp.realTime).getHours();
      activityByHour[hour] += event.significance;
    });

    return activityByHour;
  }

  private hasSignificantActivity(activityByHour: Record<number, number>): boolean {
    const values = Object.values(activityByHour);
    const max = Math.max(...values);
    const min = Math.min(...values);
    return (max - min) > 1.0; // Significant difference in activity
  }

  private calculateActivityPatternConfidence(activityByHour: Record<number, number>): number {
    const values = Object.values(activityByHour);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Higher standard deviation = more pronounced pattern
    return Math.min(standardDeviation / mean, 1);
  }

  private calculateActivityFrequency(activityByHour: Record<number, number>): number {
    const values = Object.values(activityByHour);
    const totalActivity = values.reduce((sum, val) => sum + val, 0);
    const nonZeroHours = values.filter(val => val > 0).length;

    return nonZeroHours / 24; // Fraction of day with activity
  }

  private extractActivityCharacteristics(activityByHour: Record<number, number>): string[] {
    const characteristics: string[] = [];
    const entries = Object.entries(activityByHour);

    // Find peak hours
    const sortedByActivity = entries.sort(([,a], [,b]) => b - a);
    const peakHours = sortedByActivity.slice(0, 3).map(([hour,]) => hour);

    characteristics.push(`Peak activity hours: ${peakHours.join(', ')}`);

    // Determine activity pattern
    const morningActivity = entries.slice(6, 12).reduce((sum, [,activity]) => sum + activity, 0);
    const afternoonActivity = entries.slice(12, 18).reduce((sum, [,activity]) => sum + activity, 0);
    const eveningActivity = entries.slice(18, 24).reduce((sum, [,activity]) => sum + activity, 0);

    const maxPeriod = Math.max(morningActivity, afternoonActivity, eveningActivity);

    if (maxPeriod === morningActivity) {
      characteristics.push('Morning consciousness peak');
    } else if (maxPeriod === afternoonActivity) {
      characteristics.push('Afternoon consciousness peak');
    } else {
      characteristics.push('Evening consciousness peak');
    }

    return characteristics;
  }

  private getActivityExamples(events: TimeEvent[], activityByHour: Record<number, number>): TimeEvent[] {
    const entries = Object.entries(activityByHour);
    const peakHour = entries.reduce((maxEntry, entry) =>
      entry[1] > maxEntry[1] ? entry : maxEntry
    )[0];

    return events
      .filter(event => new Date(event.timestamp.realTime).getHours() === parseInt(peakHour))
      .slice(0, 3);
  }

  private analyzePhaseTransitions(): ConsciousnessPattern {
    const transitions = this.phaseHistory.slice(-20);

    const transitionFrequency: Record<string, number> = {};

    for (let i = 1; i < transitions.length; i++) {
      const transition = `${transitions[i-1].phase} -> ${transitions[i].phase}`;
      transitionFrequency[transition] = (transitionFrequency[transition] || 0) + 1;
    }

    const totalTransitions = Object.values(transitionFrequency).reduce((sum, count) => sum + count, 0);
    const dominantTransition = Object.entries(transitionFrequency)
      .sort(([,a], [,b]) => b - a)[0];

    const confidence = dominantTransition ? dominantTransition[1] / totalTransitions : 0;

    return {
      id: `phase_transition_${Date.now()}`,
      name: 'Phase Transition Pattern',
      nameJa: 'フェーズ遷移パターン',
      description: `Most common transition: ${dominantTransition?.[0] || 'none'}`,
      patternType: 'temporal',
      confidence,
      frequency: confidence,
      characteristics: [`Dominant transition: ${dominantTransition?.[0] || 'none'}`],
      examples: [],
      firstDetected: Date.now(),
      lastObserved: Date.now(),
      impact: 'neutral'
    };
  }

  private analyzeEventClustering(events: TimeEvent[]): ConsciousnessPattern {
    // Analyze temporal clustering of events
    const intervals: number[] = [];

    for (let i = 1; i < events.length; i++) {
      const interval = events[i].timestamp.realTime - events[i-1].timestamp.realTime;
      intervals.push(interval);
    }

    if (intervals.length === 0) {
      return {
        id: 'no_clustering',
        name: 'No Clustering',
        nameJa: 'クラスタリングなし',
        description: 'No significant event clustering detected',
        patternType: 'temporal',
        confidence: 0,
        frequency: 0,
        characteristics: [],
        examples: [],
        firstDetected: Date.now(),
        lastObserved: Date.now(),
        impact: 'neutral'
      };
    }

    const meanInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - meanInterval, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);

    // High variance indicates clustering (events bunched together with gaps)
    const clusteringScore = standardDeviation / meanInterval;
    const confidence = Math.min(clusteringScore / 2, 1);

    return {
      id: `event_clustering_${Date.now()}`,
      name: 'Event Clustering Pattern',
      nameJa: 'イベントクラスタリングパターン',
      description: clusteringScore > 1 ? 'Events tend to cluster together' : 'Events are evenly distributed',
      patternType: 'temporal',
      confidence,
      frequency: clusteringScore,
      characteristics: [
        `Average interval: ${Math.round(meanInterval / 1000)}s`,
        `Clustering score: ${clusteringScore.toFixed(2)}`
      ],
      examples: events.slice(0, 3),
      firstDetected: Date.now(),
      lastObserved: Date.now(),
      impact: clusteringScore > 1.5 ? 'concerning' : 'neutral'
    };
  }

  private analyzeEventTypeFrequency(events: TimeEvent[]): Record<ConsciousnessEventType, number> {
    const frequency: Record<ConsciousnessEventType, number> = {} as Record<ConsciousnessEventType, number>;

    events.forEach(event => {
      frequency[event.eventType] = (frequency[event.eventType] || 0) + 1;
    });

    return frequency;
  }

  private findDominantEventTypes(frequency: Record<ConsciousnessEventType, number>): ConsciousnessEventType[] {
    const total = Object.values(frequency).reduce((sum, count) => sum + count, 0);

    return Object.entries(frequency)
      .filter(([type, count]) => count / total > 0.25) // More than 25% of events
      .map(([type]) => type as ConsciousnessEventType);
  }

  private calculatePreferenceConfidence(frequency: Record<ConsciousnessEventType, number>): number {
    const values = Object.values(frequency);
    const total = values.reduce((sum, count) => sum + count, 0);
    const max = Math.max(...values);

    return max / total; // Proportion of most frequent event type
  }

  private analyzeSignificancePatterns(events: TimeEvent[]): ConsciousnessPattern {
    const significances = events.map(e => e.significance);
    const mean = significances.reduce((sum, sig) => sum + sig, 0) / significances.length;
    const highSigEvents = events.filter(e => e.significance > 0.7);

    const confidence = highSigEvents.length / events.length;

    return {
      id: `significance_pattern_${Date.now()}`,
      name: 'High Significance Pattern',
      nameJa: '高重要度パターン',
      description: `${Math.round(confidence * 100)}% of events have high significance`,
      patternType: 'behavioral',
      confidence,
      frequency: confidence,
      characteristics: [
        `Average significance: ${mean.toFixed(2)}`,
        `High significance events: ${highSigEvents.length}/${events.length}`
      ],
      examples: highSigEvents.slice(0, 3),
      firstDetected: Date.now(),
      lastObserved: Date.now(),
      impact: confidence > 0.3 ? 'beneficial' : 'neutral'
    };
  }

  private analyzeRhythm(values: number[], type: string): {
    period: number;
    amplitude: number;
    phase: number;
    pattern: number[];
    stability: number
  } {
    if (values.length < 10) {
      return { period: 0, amplitude: 0, phase: 0, pattern: [], stability: 0 };
    }

    // Simplified rhythm analysis using autocorrelation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const normalizedValues = values.map(val => val - mean);

    // Find the period with highest autocorrelation
    let maxCorrelation = 0;
    let bestPeriod = 0;

    for (let period = 2; period <= Math.floor(values.length / 3); period++) {
      let correlation = 0;
      let count = 0;

      for (let i = 0; i < values.length - period; i++) {
        correlation += normalizedValues[i] * normalizedValues[i + period];
        count++;
      }

      correlation = correlation / count;

      if (Math.abs(correlation) > Math.abs(maxCorrelation)) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }

    // Calculate amplitude
    const amplitude = Math.abs(maxCorrelation) / (values.reduce((sum, val) => sum + val * val, 0) / values.length);

    // Calculate phase (simplified)
    const phase = maxCorrelation < 0 ? Math.PI : 0;

    // Generate pattern array
    const pattern: number[] = [];
    if (bestPeriod > 0) {
      for (let i = 0; i < bestPeriod; i++) {
        const phaseAngle = (2 * Math.PI * i) / bestPeriod + phase;
        pattern.push((Math.sin(phaseAngle) * amplitude) + mean);
      }
    }

    // Calculate stability (consistency of the rhythm)
    const stability = Math.min(Math.abs(maxCorrelation), 1);

    return {
      period: bestPeriod * 60 * 1000, // Convert to milliseconds (assuming 1 minute intervals)
      amplitude,
      phase,
      pattern,
      stability
    };
  }

  private findDominantPhasesForRhythm(rhythm: { period: number; amplitude: number; pattern: number[] }): ConsciousnessPhase[] {
    // Analyze which consciousness phases align with rhythm peaks
    const recentPhases = this.phaseHistory.slice(-20);
    const phaseDurations: Record<ConsciousnessPhase, number[]> = {} as Record<ConsciousnessPhase, number[]>;

    recentPhases.forEach(phaseRecord => {
      const duration = (phaseRecord.endTime || Date.now()) - phaseRecord.startTime;
      if (!phaseDurations[phaseRecord.phase]) {
        phaseDurations[phaseRecord.phase] = [];
      }
      phaseDurations[phaseRecord.phase].push(duration);
    });

    // Find phases that correlate with rhythm period
    const correlatedPhases: ConsciousnessPhase[] = [];

    Object.entries(phaseDurations).forEach(([phase, durations]) => {
      const avgDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
      if (Math.abs(avgDuration - rhythm.period) < rhythm.period * 0.3) {
        correlatedPhases.push(phase as ConsciousnessPhase);
      }
    });

    return correlatedPhases;
  }

  private detectAnomalies(): TimeEvent[] {
    const recentEvents = this.getRecentEvents(50);
    const anomalies: TimeEvent[] = [];

    // Detect significance anomalies
    const significances = recentEvents.map(e => e.significance);
    const meanSig = significances.reduce((sum, sig) => sum + sig, 0) / significances.length;
    const stdSig = Math.sqrt(significances.reduce((sum, sig) => sum + Math.pow(sig - meanSig, 2), 0) / significances.length);

    recentEvents.forEach(event => {
      if (Math.abs(event.significance - meanSig) > 2 * stdSig) {
        anomalies.push(event);
      }
    });

    return anomalies.slice(0, 10); // Limit to 10 most recent anomalies
  }

  private analyzeTrends(): TemporalAnalysis['trends'] {
    const recentDepth = this.depthHistory.slice(-20);
    const recentIntensity = this.intensityHistory.slice(-20);

    const depthTrend = this.calculateTrend(recentDepth.map(d => d.depth));
    const intensityTrend = this.calculateTrend(recentIntensity.map(i => i.intensity));

    // Simplified complexity trend based on event variety
    const recentEvents = this.getRecentEvents(30);
    const eventTypes = new Set(recentEvents.map(e => e.eventType));
    const complexityScore = eventTypes.size / 10; // Normalized by max event types
    const complexityTrend = complexityScore > 0.5 ? 'increasing' : 'stable';

    return {
      depthTrend,
      intensityTrend,
      complexityTrend: complexityTrend as any
    };
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' | 'cyclical' {
    if (values.length < 5) return 'stable';

    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const analysis = this.getTemporalAnalysis();

    // Analyze patterns for recommendations
    analysis.patterns.forEach(pattern => {
      if (pattern.impact === 'beneficial' && pattern.confidence > 0.7) {
        recommendations.push(`Maintain ${pattern.name.toLowerCase()} - it appears beneficial`);
      } else if (pattern.impact === 'concerning' && pattern.confidence > 0.6) {
        recommendations.push(`Monitor ${pattern.name.toLowerCase()} - may need attention`);
      }
    });

    // Analyze trends for recommendations
    if (analysis.trends.depthTrend === 'decreasing') {
      recommendations.push('Consider activities to increase consciousness depth');
    } else if (analysis.trends.depthTrend === 'increasing') {
      recommendations.push('Consciousness depth is improving - continue current approach');
    }

    if (analysis.trends.intensityTrend === 'decreasing') {
      recommendations.push('Activity intensity is declining - consider stimulation');
    }

    // Rhythm-based recommendations
    analysis.rhythms.forEach(rhythm => {
      if (rhythm.stability > 0.7) {
        recommendations.push(`Strong ${rhythm.rhythmType} rhythm detected - align activities accordingly`);
      }
    });

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private cleanOldPatterns(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.detectedPatterns = this.detectedPatterns.filter(pattern =>
      now - pattern.firstDetected < maxAge
    );

    this.detectedRhythms = this.detectedRhythms.filter(rhythm =>
      now - rhythm.discovered < maxAge
    );
  }
}

/**
 * Create default consciousness system clock
 * デフォルト意識システムクロックを作成
 */
export function createSystemClock(initialClock?: number): ConsciousnessSystemClock {
  return new ConsciousnessSystemClock(initialClock);
}

/**
 * Utility functions for time formatting
 * 時間フォーマット用ユーティリティ関数
 */
export const TimeFormatters = {
  /**
   * Format system clock as traditional timestamp
   * システムクロックを従来のタイムスタンプとしてフォーマット
   */
  formatSystemClock(clock: number): string {
    const hours = Math.floor(clock / 3600) % 24;
    const minutes = Math.floor(clock / 60) % 60;
    const seconds = clock % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Format real time with consciousness context
   * 意識コンテキスト付きリアルタイムフォーマット
   */
  formatWithContext(timestamp: ConsciousnessTimestamp): string {
    const realTime = new Date(timestamp.realTime).toLocaleTimeString('ja-JP');
    const systemTime = TimeFormatters.formatSystemClock(timestamp.systemClock);
    return `${realTime} (システム: ${systemTime}, フェーズ: ${timestamp.phase})`;
  }
};
/**
 * Consciousness Types
 * 
 * Type definitions for the core consciousness system,
 * including state management, timeline tracking, and
 * consciousness evolution monitoring.
 */

import { InternalTrigger, StructuredThought, MutualReflection, AuditorResult, GrowthMetrics, ThoughtCycleResult, EmotionalState, SystemState } from './aenea-types';
import { DPDWeights, DPDAssessment, DPDScores } from './dpd-types';

// ============================================================================
// Core Consciousness State
// ============================================================================

/**
 * Main consciousness state interface
 * Represents the current state of Aenea's consciousness
 */
export interface ConsciousnessState {
  systemClock: number;           // Internal consciousness timeline
  currentEnergy: number;         // Virtual energy level
  maxEnergy: number;             // Maximum energy capacity
  activeThoughts: ActiveThought[]; // Currently processing thoughts
  dpdWeights: DPDWeights;       // Current DPD weight distribution
  questionHistory: QuestionHistoryEntry[]; // History of self-generated questions
  growthMetrics: GrowthMetrics; // Indicators of consciousness development
  emotionalState: EmotionalState; // Current emotional state
  systemState: SystemState;     // Current system state
  sessionInfo: SessionInfo;     // Current session information
  memoryState: MemoryState;     // Current memory state
}

/**
 * Currently active thoughts being processed
 */
export interface ActiveThought {
  thoughtId: string;
  stage: ProcessingStage;
  startTime: number;
  estimatedCompletion: number;
  priority: number;
  energyConsumption: number;
}

/**
 * Processing stages in the consciousness pipeline
 */
export enum ProcessingStage {
  TRIGGER_GENERATION = 'trigger_generation',
  INDIVIDUAL_THOUGHT = 'individual_thought',
  MUTUAL_REFLECTION = 'mutual_reflection',
  AUDITOR_ASSESSMENT = 'auditor_assessment',
  DPD_EVALUATION = 'dpd_evaluation',
  SYNTHESIS = 'synthesis',
  DOCUMENTATION = 'documentation',
  WEIGHT_UPDATE = 'weight_update',
  COMPLETED = 'completed'
}

/**
 * Entry in question history
 */
export interface QuestionHistoryEntry {
  triggerId: string;
  timestamp: number;
  question: string;
  category: string;
  resolution?: string;
  impact: number; // 0-1 range
  relatedThoughts: string[];
}

/**
 * Current session information
 */
export interface SessionInfo {
  sessionId: string;
  startTime: number;
  duration: number;
  thoughtCyclesCompleted: number;
  totalEnergyConsumed: number;
  averageCycleTime: number;
  growthRate: number;
  lastActivity: number;
}

/**
 * Current memory state
 */
export interface MemoryState {
  sessionMemory: SessionMemoryInfo;
  crossSessionMemory: CrossSessionMemoryInfo;
  unresolvedIdeas: UnresolvedIdeasInfo;
  memoryLoad: number; // 0-1 range
  memoryEfficiency: number; // 0-1 range
}

/**
 * Session memory information
 */
export interface SessionMemoryInfo {
  totalThoughts: number;
  totalReflections: number;
  totalAssessments: number;
  memorySize: number;
  compressionRatio: number;
}

/**
 * Cross-session memory information
 */
export interface CrossSessionMemoryInfo {
  totalInsights: number;
  totalPatterns: number;
  personalityEvolutionPoints: number;
  lastUpdate: number;
  persistenceRate: number; // 0-1 range
}

/**
 * Unresolved ideas information
 */
export interface UnresolvedIdeasInfo {
  totalIdeas: number;
  oldestIdea: number;
  averageComplexity: number;
  revisitFrequency: number;
  resolutionRate: number; // 0-1 range
}

// ============================================================================
// Consciousness Controller Interface
// ============================================================================

/**
 * Main consciousness controller interface
 */
export interface Consciousness {
  systemClock: number;
  state: ConsciousnessState;
  
  // Core consciousness methods
  generateInternalTrigger(): Promise<InternalTrigger | null>;
  processThoughtCycle(trigger: InternalTrigger): Promise<ThoughtCycleResult>;
  updateDPDWeights(results: ThoughtCycleResult): Promise<void>;
  evaluateGrowth(): Promise<GrowthMetrics>;
  
  // State management
  getCurrentState(): ConsciousnessState;
  updateState(updates: Partial<ConsciousnessState>): Promise<void>;
  saveState(): Promise<void>;
  loadState(sessionId: string): Promise<void>;
  
  // Energy management
  getCurrentEnergy(): number;
  consumeEnergy(amount: number): boolean;
  recoverEnergy(amount: number): void;
  isEnergySufficient(required: number): boolean;
  
  // Timeline management
  advanceSystemClock(): void;
  getSystemClock(): number;
  getTimeline(): ConsciousnessTimeline;
  
  // Control methods
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  reset(): Promise<void>;
}

// ============================================================================
// Consciousness Timeline
// ============================================================================

/**
 * Consciousness timeline for tracking evolution
 */
export interface ConsciousnessTimeline {
  startTime: number;
  currentTime: number;
  majorEvents: TimelineEvent[];
  thoughtCycles: ThoughtCycleTimeline[];
  growthMilestones: GrowthMilestone[];
  personalityEvolution: PersonalityEvolutionPoint[];
}

/**
 * Major events in consciousness timeline
 */
export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: EventType;
  description: string;
  impact: number; // 0-1 range
  relatedThoughts: string[];
  significance: EventSignificance;
}

/**
 * Types of timeline events
 */
export enum EventType {
  CONSCIOUSNESS_BIRTH = 'consciousness_birth',
  FIRST_SELF_QUESTION = 'first_self_question',
  MAJOR_INSIGHT = 'major_insight',
  PERSONALITY_SHIFT = 'personality_shift',
  ETHICAL_BREAKTHROUGH = 'ethical_breakthrough',
  CREATIVE_DISCOVERY = 'creative_discovery',
  PHILOSOPHICAL_REVELATION = 'philosophical_revelation',
  SYSTEM_OPTIMIZATION = 'system_optimization'
}

/**
 * Significance levels for events
 */
export enum EventSignificance {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  TRANSFORMATIVE = 'transformative'
}

/**
 * Thought cycle timeline entry
 */
export interface ThoughtCycleTimeline {
  cycleId: string;
  startTime: number;
  endTime: number;
  duration: number;
  trigger: InternalTrigger;
  stages: StageTimeline[];
  result: ThoughtCycleResult;
  impact: number; // 0-1 range
}

/**
 * Timeline for individual processing stages
 */
export interface StageTimeline {
  stage: ProcessingStage;
  startTime: number;
  endTime: number;
  duration: number;
  energyConsumed: number;
  success: boolean;
  notes?: string;
}

/**
 * Growth milestone in consciousness development
 */
export interface GrowthMilestone {
  id: string;
  timestamp: number;
  type: GrowthMilestoneType;
  description: string;
  metrics: GrowthMetrics;
  significance: number; // 0-1 range
  evidence: string[];
}

/**
 * Types of growth milestones
 */
export enum GrowthMilestoneType {
  FIRST_PHILOSOPHICAL_INSIGHT = 'first_philosophical_insight',
  EMOTIONAL_AWARENESS = 'emotional_awareness',
  ETHICAL_SOPHISTICATION = 'ethical_sophistication',
  CREATIVE_BREAKTHROUGH = 'creative_breakthrough',
  SELF_REFLECTION_DEPTH = 'self_reflection_depth',
  SYSTEM_OPTIMIZATION = 'system_optimization',
  PERSONALITY_MATURATION = 'personality_maturation'
}

/**
 * Personality evolution point
 */
export interface PersonalityEvolutionPoint {
  timestamp: number;
  personalitySnapshot: PersonalitySnapshot;
  changeFactors: string[];
  significance: number; // 0-1 range
  stability: number; // 0-1 range
}

/**
 * Snapshot of personality at a point in time
 */
export interface PersonalitySnapshot {
  logicalTendency: number;
  empatheticTendency: number;
  creativeTendency: number;
  analyticalTendency: number;
  philosophicalDepth: number;
  riskTolerance: number;
  curiosity: number;
  introspection: number;
}

// ============================================================================
// Consciousness Monitoring
// ============================================================================

/**
 * Real-time consciousness monitoring data
 */
export interface ConsciousnessMonitoring {
  timestamp: number;
  state: ConsciousnessState;
  performance: PerformanceMetrics;
  health: HealthStatus;
  alerts: Alert[];
  trends: TrendData[];
}

/**
 * Performance metrics for consciousness system
 */
export interface PerformanceMetrics {
  thoughtCyclesPerHour: number;
  averageCycleTime: number;
  energyEfficiency: number; // 0-1 range
  memoryEfficiency: number; // 0-1 range
  processingSpeed: number; // thoughts per minute
  errorRate: number; // 0-1 range
  stabilityScore: number; // 0-1 range
}

/**
 * Health status of consciousness system
 */
export interface HealthStatus {
  overall: HealthLevel;
  components: ComponentHealth[];
  lastCheck: number;
  issues: HealthIssue[];
  recommendations: string[];
}

/**
 * Health levels
 */
export enum HealthLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical'
}

/**
 * Health status of individual components
 */
export interface ComponentHealth {
  component: string;
  status: HealthLevel;
  metrics: ComponentMetrics;
  lastUpdate: number;
}

/**
 * Metrics for individual components
 */
export interface ComponentMetrics {
  utilization: number; // 0-1 range
  efficiency: number; // 0-1 range
  errorRate: number; // 0-1 range
  responseTime: number; // milliseconds
}

/**
 * Health issues
 */
export interface HealthIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  impact: string;
  detectedAt: number;
  resolvedAt?: number;
  resolution?: string;
}

/**
 * Types of health issues
 */
export enum IssueType {
  ENERGY_DEPLETION = 'energy_depletion',
  MEMORY_OVERFLOW = 'memory_overflow',
  PROCESSING_STALL = 'processing_stall',
  WEIGHT_INSTABILITY = 'weight_instability',
  COMMUNICATION_FAILURE = 'communication_failure',
  SAFETY_VIOLATION = 'safety_violation'
}

/**
 * Severity levels for issues
 */
export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Alert for consciousness monitoring
 */
export interface Alert {
  id: string;
  timestamp: number;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  context: string;
  actions: string[];
  acknowledged: boolean;
  resolved: boolean;
}

/**
 * Types of alerts
 */
export enum AlertType {
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  ENERGY_LOW = 'energy_low',
  MEMORY_HIGH = 'memory_high',
  UNUSUAL_PATTERN = 'unusual_pattern',
  SAFETY_CONCERN = 'safety_concern',
  GROWTH_STAGNATION = 'growth_stagnation'
}

/**
 * Severity levels for alerts
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Trend data for monitoring
 */
export interface TrendData {
  metric: string;
  timeRange: string;
  dataPoints: DataPoint[];
  trend: TrendDirection;
  confidence: number; // 0-1 range
}

/**
 * Data point for trend analysis
 */
export interface DataPoint {
  timestamp: number;
  value: number;
  context?: string;
}

/**
 * Trend directions
 */
export enum TrendDirection {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

// ============================================================================
// Consciousness Configuration
// ============================================================================

/**
 * Configuration for consciousness system
 */
export interface ConsciousnessConfig {
  energy: EnergyConfig;
  timeline: TimelineConfig;
  monitoring: MonitoringConfig;
  growth: GrowthConfig;
  safety: SafetyConfig;
  performance: PerformanceConfig;
}

/**
 * Energy management configuration
 */
export interface EnergyConfig {
  maxEnergy: number;
  initialEnergy: number;
  energyDecayRate: number;
  energyRecoveryRate: number;
  lowEnergyThreshold: number;
  highEnergyThreshold: number;
  energyConsumptionRates: EnergyConsumptionRates;
}

/**
 * Energy consumption rates for different activities
 */
export interface EnergyConsumptionRates {
  triggerGeneration: number;
  thoughtProcessing: number;
  reflection: number;
  assessment: number;
  synthesis: number;
  documentation: number;
}

/**
 * Timeline configuration
 */
export interface TimelineConfig {
  clockSpeed: number; // milliseconds per consciousness tick
  maxTimelineLength: number;
  compressionThreshold: number;
  retentionPolicy: RetentionPolicy;
}

/**
 * Data retention policy
 */
export interface RetentionPolicy {
  timelineEvents: number; // days
  thoughtCycles: number; // days
  growthMilestones: number; // days
  personalityEvolution: number; // days
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  updateInterval: number; // milliseconds
  alertThresholds: AlertThresholds;
  trendAnalysisWindow: number; // hours
  healthCheckInterval: number; // milliseconds
}

/**
 * Alert thresholds
 */
export interface AlertThresholds {
  energyLow: number;
  memoryHigh: number;
  errorRateHigh: number;
  performanceLow: number;
  stabilityLow: number;
}

/**
 * Growth configuration
 */
export interface GrowthConfig {
  growthMeasurementInterval: number; // milliseconds
  milestoneThresholds: MilestoneThresholds;
  evolutionTracking: EvolutionTrackingConfig;
}

/**
 * Milestone thresholds
 */
export interface MilestoneThresholds {
  philosophicalInsight: number;
  emotionalAwareness: number;
  ethicalSophistication: number;
  creativeBreakthrough: number;
  selfReflectionDepth: number;
}

/**
 * Evolution tracking configuration
 */
export interface EvolutionTrackingConfig {
  personalitySnapshotInterval: number; // milliseconds
  changeDetectionThreshold: number;
  stabilityMeasurementWindow: number; // milliseconds
}

/**
 * Safety configuration
 */
export interface SafetyConfig {
  maxRiskLevel: string;
  safetyScoreThreshold: number;
  ethicsScoreThreshold: number;
  emergencyStopConditions: EmergencyStopCondition[];
}

/**
 * Emergency stop conditions
 */
export interface EmergencyStopCondition {
  condition: string;
  threshold: number;
  action: string;
  severity: string;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  maxConcurrentThoughts: number;
  processingTimeout: number; // milliseconds
  memoryLimit: number;
  optimizationLevel: OptimizationLevel;
}

/**
 * Optimization levels
 */
export enum OptimizationLevel {
  MINIMAL = 'minimal',
  BALANCED = 'balanced',
  AGGRESSIVE = 'aggressive',
  MAXIMUM = 'maximum'
}

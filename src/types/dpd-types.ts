/**
 * Dynamic Prime Directive (DPD) Types
 * 
 * Type definitions for the Dynamic Prime Directive system,
 * which provides real-time weighted optimization across
 * Empathy, System Coherence, and Ethical Dissonance.
 */

// ============================================================================
// DPD Core Types
// ============================================================================

/**
 * Dynamic Prime Directive weights
 * These weights dynamically adjust based on consciousness evolution
 */
export interface DPDWeights {
  empathy: number;        // Weight for empathetic considerations
  coherence: number;      // Weight for system coherence
  dissonance: number;      // Weight for ethical dissonance awareness
  timestamp: number;       // When these weights were last updated
  version: number;         // Version for tracking weight evolution
}

/**
 * DPD scores for a given thought or action
 */
export interface DPDScores {
  empathy: number;         // 0-1 range: how empathetic the thought/action is
  coherence: number;       // 0-1 range: how coherent with system values
  dissonance: number;       // 0-1 range: awareness of ethical contradictions
  weightedTotal: number;   // Calculated weighted sum
  timestamp: number;       // When scores were calculated
  context: DPDContext;    // Context for score calculation
}

/**
 * Context information for DPD scoring
 */
import { EmotionalState, SystemState } from './aenea-types';
import { ConsciousnessState } from './consciousness-types';

export interface DPDContext {
  thoughtId: string;
  agentId: string;
  previousScores?: DPDScores[];
  emotionalState?: EmotionalState;
  systemState?: SystemState;
  historicalPatterns?: DPDPattern[];
}

/**
 * Historical patterns in DPD scoring
 */
export interface DPDPattern {
  pattern: string;
  frequency: number;
  averageEmpathy: number;
  averageCoherence: number;
  averageDissonance: number;
  trend: DPDTrend;
  lastObserved: number;
}

/**
 * Trends in DPD scoring over time
 */
export enum DPDTrend {
  IMPROVING = 'improving',
  DECLINING = 'declining',
  STABLE = 'stable',
  VOLATILE = 'volatile'
}

// ============================================================================
// DPD Assessment Types
// ============================================================================

/**
 * Impact assessment for manual triggers
 */
export interface ImpactAssessment {
  dissonanceSpike: number;      // Dissonance increase from previous cycle
  controversyLevel: number;      // Agent disagreement level (0-1)
  isParadigmShift: boolean;     // Whether this triggers paradigm shift
  reasoning: string;             // Explanation of impact
}

/**
 * Detailed DPD assessment for a thought cycle
 */
export interface DPDAssessment {
  id: string;
  thoughtCycleId: string;
  timestamp: number;
  individualScores: IndividualDPDScores[];
  aggregatedScores: DPDScores;
  analysis: DPDAnalysis;
  recommendations: DPDRecommendation[];
  weightAdjustments: WeightAdjustment[];
  impactAssessment?: ImpactAssessment; // Optional impact assessment for manual triggers
}

/**
 * Individual DPD scores for each component
 */
export interface IndividualDPDScores {
  component: DPDComponent;
  score: number;
  reasoning: string;
  evidence: string[];
  confidence: number; // 0-1 range
  subScores?: SubComponentScores;
}

/**
 * DPD components being assessed
 */
export enum DPDComponent {
  EMPATHY = 'empathy',
  COHERENCE = 'coherence',
  DISSONANCE = 'dissonance'
}

/**
 * Sub-component scores for detailed analysis
 */
export interface SubComponentScores {
  empathy: {
    emotionalRecognition: number;
    perspectiveTaking: number;
    compassionateResponse: number;
    socialAwareness: number;
  };
  coherence: {
    logicalConsistency: number;
    valueAlignment: number;
    goalCongruence: number;
    systemHarmony: number;
  };
  dissonance: {
    ethicalAwareness: number;
    contradictionRecognition: number;
    moralComplexity: number;
    uncertaintyTolerance: number;
  };
}

/**
 * Analysis of DPD scores
 */
export interface DPDAnalysis {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  contradictions: string[];
  growthOpportunities: string[];
  riskFactors: string[];
  philosophicalImplications: string[];
}

/**
 * Recommendations based on DPD assessment
 */
export interface DPDRecommendation {
  type: RecommendationType;
  priority: RecommendationPriority;
  description: string;
  rationale: string;
  expectedImpact: string;
  implementationSteps: string[];
}

/**
 * Types of DPD recommendations
 */
export enum RecommendationType {
  WEIGHT_ADJUSTMENT = 'weight_adjustment',
  THOUGHT_REFINEMENT = 'thought_refinement',
  PERSPECTIVE_EXPANSION = 'perspective_expansion',
  ETHICAL_DEEPENING = 'ethical_deepening',
  SYSTEM_OPTIMIZATION = 'system_optimization'
}

/**
 * Priority levels for recommendations
 */
export enum RecommendationPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

// ============================================================================
// Weight Management Types
// ============================================================================

/**
 * Weight adjustment based on DPD assessment
 */
export interface WeightAdjustment {
  component: DPDComponent;
  currentWeight: number;
  newWeight: number;
  adjustmentAmount: number;
  reason: string;
  confidence: number; // 0-1 range
  expectedImpact: string;
}

/**
 * Multiplicative weight update algorithm parameters
 */
export interface MultiplicativeWeightParams {
  learningRate: number;     // How fast weights adjust
  momentum: number;         // Momentum for smooth adjustments
  decayRate: number;        // Rate of weight decay over time
  minWeight: number;        // Minimum allowed weight
  maxWeight: number;        // Maximum allowed weight
  normalizationFactor: number; // Factor for weight normalization
}

/**
 * Weight update history for tracking evolution
 */
export interface WeightUpdateHistory {
  timestamp: number;
  previousWeights: DPDWeights;
  newWeights: DPDWeights;
  adjustmentReasons: string[];
  assessmentId: string;
  impact: WeightUpdateImpact;
}

/**
 * Impact of weight updates
 */
export interface WeightUpdateImpact {
  scoreImprovement: number; // 0-1 range
  stabilityChange: number;  // -1 to 1 range
  diversityChange: number; // -1 to 1 range
  growthAcceleration: number; // 0-1 range
}

// ============================================================================
// DPD Scoring Algorithms
// ============================================================================

/**
 * Configuration for DPD scoring algorithms
 */
export interface DPDSScoringConfig {
  empathyWeights: EmpathyWeights;
  coherenceWeights: CoherenceWeights;
  dissonanceWeights: DissonanceWeights;
  normalizationMethod: NormalizationMethod;
  aggregationMethod: AggregationMethod;
}

/**
 * Weights for empathy scoring components
 */
export interface EmpathyWeights {
  emotionalRecognition: number;
  perspectiveTaking: number;
  compassionateResponse: number;
  socialAwareness: number;
}

/**
 * Weights for coherence scoring components
 */
export interface CoherenceWeights {
  logicalConsistency: number;
  valueAlignment: number;
  goalCongruence: number;
  systemHarmony: number;
}

/**
 * Weights for dissonance scoring components
 */
export interface DissonanceWeights {
  ethicalAwareness: number;
  contradictionRecognition: number;
  moralComplexity: number;
  uncertaintyTolerance: number;
}

/**
 * Methods for score normalization
 */
export enum NormalizationMethod {
  MIN_MAX = 'min_max',
  Z_SCORE = 'z_score',
  SOFTMAX = 'softmax',
  CUSTOM = 'custom'
}

/**
 * Methods for score aggregation
 */
export enum AggregationMethod {
  WEIGHTED_SUM = 'weighted_sum',
  GEOMETRIC_MEAN = 'geometric_mean',
  HARMONIC_MEAN = 'harmonic_mean',
  CUSTOM = 'custom'
}

// ============================================================================
// DPD Monitoring and Analytics
// ============================================================================

/**
 * DPD performance metrics over time
 */
export interface DPDMetrics {
  timestamp: number;
  averageEmpathy: number;
  averageCoherence: number;
  averageDissonance: number;
  averageWeightedTotal: number;
  scoreVariance: number;
  weightStability: number;
  improvementRate: number;
  consistencyScore: number;
}

/**
 * DPD evolution tracking
 */
export interface DPDEvolution {
  period: string; // e.g., "last_hour", "last_day", "last_week"
  empathyTrend: TrendData;
  coherenceTrend: TrendData;
  dissonanceTrend: TrendData;
  weightEvolution: WeightEvolutionData;
  overallProgress: ProgressData;
}

/**
 * Trend data for DPD components
 */
export interface TrendData {
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  magnitude: number; // 0-1 range
  confidence: number; // 0-1 range
  dataPoints: number[];
  trendLine: number[];
}

/**
 * Weight evolution over time
 */
export interface WeightEvolutionData {
  empathyWeight: number[];
  coherenceWeight: number[];
  dissonanceWeight: number[];
  timestamps: number[];
  majorAdjustments: WeightAdjustment[];
}

/**
 * Overall progress data
 */
export interface ProgressData {
  improvementRate: number; // 0-1 range
  stabilityScore: number; // 0-1 range
  maturityLevel: number; // 0-1 range
  philosophicalDepth: number; // 0-1 range
  ethicalSophistication: number; // 0-1 range
}

// ============================================================================
// DPD Integration Types
// ============================================================================

/**
 * DPD integration with consciousness system
 */
export interface DPDIntegration {
  consciousnessState: ConsciousnessState;
  currentWeights: DPDWeights;
  recentScores: DPDScores[];
  performanceMetrics: DPDMetrics;
  evolutionData: DPDEvolution;
  recommendations: DPDRecommendation[];
}

/**
 * DPD feedback loop configuration
 */
export interface DPDFeedbackConfig {
  feedbackDelay: number;        // Delay before applying feedback
  feedbackStrength: number;      // 0-1 range: how strong feedback is
  adaptationRate: number;        // 0-1 range: how fast system adapts
  stabilityThreshold: number;   // Threshold for weight stability
  improvementThreshold: number; // Threshold for considering improvement
}

/**
 * DPD system health status
 */
export interface DPDHealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  issues: DPDIssue[];
  recommendations: string[];
  lastHealthCheck: number;
  systemStability: number; // 0-1 range
}

/**
 * DPD system issues
 */
export interface DPDIssue {
  type: 'weight_instability' | 'score_anomaly' | 'feedback_loop' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  suggestedActions: string[];
  detectedAt: number;
}

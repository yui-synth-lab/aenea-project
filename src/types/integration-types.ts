/**
 * Integration Types
 * 
 * Type definitions for the integration layer between Aenea
 * and the Yui Protocol system, including bridge patterns,
 * adapter interfaces, and communication protocols.
 */

import { AeneaAgent, StructuredThought, InternalTrigger, MutualReflection, AuditorResult } from './aenea-types';
import { DPDScores, DPDWeights } from './dpd-types';
import { ConsciousnessState } from './consciousness-types';

// ============================================================================
// Yui Protocol Bridge Types
// ============================================================================

/**
 * Bridge interface for Yui Protocol integration
 */
export interface YuiBridge {
  // Agent management
  getAvailableAgents(): Promise<YuiAgentInfo[]>;
  createAgentAdapter(agentId: string): Promise<AeneaAgent>;
  adaptAgentForAenea(agentId: string): Promise<AeneaAgent>;
  
  // Session management
  createSession(): Promise<YuiSession>;
  getSession(sessionId: string): Promise<YuiSession>;
  closeSession(sessionId: string): Promise<void>;
  
  // Communication
  sendToYuiAgent(agentId: string, message: YuiMessage): Promise<YuiResponse>;
  receiveFromYuiAgent(agentId: string): Promise<YuiMessage[]>;
  
  // State synchronization
  syncConsciousnessState(state: ConsciousnessState): Promise<void>;
  getYuiSystemState(): Promise<YuiSystemState>;
  
  // Error handling
  handleBridgeError(error: BridgeError): Promise<void>;
  getBridgeStatus(): Promise<BridgeStatus>;
}

/**
 * Information about available Yui Protocol agents
 */
export interface YuiAgentInfo {
  id: string;
  name: string;
  type: YuiAgentType;
  capabilities: YuiAgentCapabilities;
  status: AgentStatus;
  lastActivity: number;
  metadata: YuiAgentMetadata;
}

/**
 * Types of Yui Protocol agents
 */
export enum YuiAgentType {
  EIRO = 'eiro',           // 慧露 - Logical, analytical
  HEKITO = 'hekito',       // 碧統 - Systematic, organized
  KANSHI = 'kanshi',       // 観至 - Observant, insightful
  YOGA = 'yoga',           // 陽雅 - Creative, expressive
  YUI = 'yui'              // 結心 - Empathetic, connecting
}

/**
 * Capabilities of Yui Protocol agents
 */
export interface YuiAgentCapabilities {
  canGenerateResponses: boolean;
  canProcessPrompts: boolean;
  canMaintainContext: boolean;
  canHandleComplexity: boolean;
  canProvideFeedback: boolean;
  canLearn: boolean;
}

/**
 * Status of agents
 */
export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BUSY = 'busy',
  ERROR = 'error',
  UNKNOWN = 'unknown'
}

/**
 * Metadata about Yui Protocol agents
 */
export interface YuiAgentMetadata {
  version: string;
  lastUpdate: number;
  performance: AgentPerformance;
  preferences: AgentPreferences;
  limitations: string[];
}

/**
 * Performance metrics for agents
 */
export interface AgentPerformance {
  responseTime: number;
  accuracy: number;
  reliability: number;
  efficiency: number;
}

/**
 * Preferences for agents
 */
export interface AgentPreferences {
  communicationStyle: string;
  complexityLevel: number;
  responseLength: string;
  tone: string;
}

// ============================================================================
// Session Management Types
// ============================================================================

/**
 * Yui Protocol session
 */
export interface YuiSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  status: SessionStatus;
  participants: string[]; // Agent IDs
  context: SessionContext;
  history: SessionHistory;
}

/**
 * Session status
 */
export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  ERROR = 'error'
}

/**
 * Session context
 */
export interface SessionContext {
  topic?: string;
  mood?: string;
  complexity?: number;
  goals?: string[];
  constraints?: string[];
}

/**
 * Session history
 */
export interface SessionHistory {
  messages: YuiMessage[];
  interactions: YuiInteraction[];
  outcomes: YuiOutcome[];
  metrics: SessionMetrics;
}

/**
 * Yui Protocol message
 */
export interface YuiMessage {
  id: string;
  timestamp: number;
  senderId: string;
  receiverId?: string;
  type: MessageType;
  content: string;
  metadata: MessageMetadata;
}

/**
 * Types of messages
 */
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  STATUS = 'status'
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  priority: number;
  context?: string;
  emotionalTone?: string;
  complexity?: number;
  requiresResponse?: boolean;
}

/**
 * Yui Protocol interaction
 */
export interface YuiInteraction {
  id: string;
  timestamp: number;
  participants: string[];
  type: InteractionType;
  duration: number;
  outcome: InteractionOutcome;
  metrics: InteractionMetrics;
}

/**
 * Types of interactions
 */
export enum InteractionType {
  COLLABORATION = 'collaboration',
  DEBATE = 'debate',
  BRAINSTORMING = 'brainstorming',
  PROBLEM_SOLVING = 'problem_solving',
  CREATIVE_WORK = 'creative_work'
}

/**
 * Interaction outcomes
 */
export enum InteractionOutcome {
  SUCCESS = 'success',
  PARTIAL_SUCCESS = 'partial_success',
  FAILURE = 'failure',
  INCONCLUSIVE = 'inconclusive'
}

/**
 * Interaction metrics
 */
export interface InteractionMetrics {
  participation: number;
  quality: number;
  efficiency: number;
  satisfaction: number;
}

/**
 * Yui Protocol outcome
 */
export interface YuiOutcome {
  id: string;
  timestamp: number;
  type: OutcomeType;
  description: string;
  value: number;
  impact: number;
  participants: string[];
}

/**
 * Types of outcomes
 */
export enum OutcomeType {
  INSIGHT = 'insight',
  SOLUTION = 'solution',
  CREATION = 'creation',
  UNDERSTANDING = 'understanding',
  DECISION = 'decision'
}

/**
 * Session metrics
 */
export interface SessionMetrics {
  duration: number;
  messageCount: number;
  interactionCount: number;
  outcomeCount: number;
  averageQuality: number;
  efficiency: number;
}

// ============================================================================
// Response and Communication Types
// ============================================================================

/**
 * Yui Protocol response
 */
export interface YuiResponse {
  id: string;
  timestamp: number;
  agentId: string;
  success: boolean;
  content?: string;
  error?: string;
  metadata: ResponseMetadata;
  suggestions?: string[];
  followUpQuestions?: string[];
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  confidence: number;
  processingTime: number;
  complexity: number;
  emotionalTone?: string;
  philosophicalDepth?: number;
  creativity?: number;
  tokensUsed?: number;
  model?: string;
  error?: string;
}

/**
 * Communication protocol for Aenea-Yui integration
 */
export interface CommunicationProtocol {
  // Message handling
  sendMessage(message: YuiMessage): Promise<YuiResponse>;
  receiveMessage(): Promise<YuiMessage>;
  
  // Batch operations
  sendBatchMessages(messages: YuiMessage[]): Promise<YuiResponse[]>;
  receiveBatchMessages(count: number): Promise<YuiMessage[]>;
  
  // Streaming
  startStream(agentId: string): Promise<MessageStream>;
  stopStream(streamId: string): Promise<void>;
  
  // Error handling
  handleCommunicationError(error: CommunicationError): Promise<void>;
}

/**
 * Message stream for real-time communication
 */
export interface MessageStream {
  streamId: string;
  agentId: string;
  startTime: number;
  status: StreamStatus;
  messages: YuiMessage[];
  onMessage: (message: YuiMessage) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

/**
 * Stream status
 */
export enum StreamStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
  ERROR = 'error'
}

/**
 * Communication error
 */
export interface CommunicationError {
  id: string;
  timestamp: number;
  type: ErrorType;
  message: string;
  context: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  suggestedActions: string[];
}

/**
 * Types of communication errors
 */
export enum ErrorType {
  CONNECTION_LOST = 'connection_lost',
  TIMEOUT = 'timeout',
  INVALID_MESSAGE = 'invalid_message',
  AGENT_UNAVAILABLE = 'agent_unavailable',
  PROTOCOL_VIOLATION = 'protocol_violation'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ============================================================================
// State Synchronization Types
// ============================================================================

/**
 * Yui Protocol system state
 */
export interface YuiSystemState {
  timestamp: number;
  agents: YuiAgentState[];
  sessions: YuiSessionState[];
  systemHealth: SystemHealth;
  performance: SystemPerformance;
  configuration: YuiConfiguration;
}

/**
 * State of individual Yui Protocol agents
 */
export interface YuiAgentState {
  agentId: string;
  status: AgentStatus;
  currentTask?: string;
  memoryUsage: number;
  processingLoad: number;
  lastActivity: number;
  errorCount: number;
}

/**
 * State of Yui Protocol sessions
 */
export interface YuiSessionState {
  sessionId: string;
  status: SessionStatus;
  participantCount: number;
  messageCount: number;
  duration: number;
  lastActivity: number;
}

/**
 * System health information
 */
export interface SystemHealth {
  overall: HealthLevel;
  components: ComponentHealth[];
  issues: HealthIssue[];
  lastCheck: number;
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
 * Health of individual components
 */
export interface ComponentHealth {
  component: string;
  status: HealthLevel;
  metrics: ComponentMetrics;
  lastUpdate: number;
}

/**
 * Component metrics
 */
export interface ComponentMetrics {
  utilization: number;
  efficiency: number;
  errorRate: number;
  responseTime: number;
}

/**
 * Health issues
 */
export interface HealthIssue {
  id: string;
  type: string;
  severity: string;
  description: string;
  impact: string;
  detectedAt: number;
}

/**
 * System performance metrics
 */
export interface SystemPerformance {
  throughput: number;
  latency: number;
  errorRate: number;
  availability: number;
  efficiency: number;
}

/**
 * Yui Protocol configuration
 */
export interface YuiConfiguration {
  version: string;
  features: string[];
  limitations: string[];
  customizations: Customization[];
}

/**
 * System customizations
 */
export interface Customization {
  name: string;
  value: any;
  description: string;
  impact: string;
}

// ============================================================================
// Bridge Error Handling Types
// ============================================================================

/**
 * Bridge error
 */
export interface BridgeError {
  id: string;
  timestamp: number;
  type: BridgeErrorType;
  message: string;
  context: BridgeErrorContext;
  severity: ErrorSeverity;
  recoverable: boolean;
  suggestedActions: string[];
}

/**
 * Types of bridge errors
 */
export enum BridgeErrorType {
  CONNECTION_FAILURE = 'connection_failure',
  PROTOCOL_MISMATCH = 'protocol_mismatch',
  AGENT_UNAVAILABLE = 'agent_unavailable',
  SESSION_ERROR = 'session_error',
  STATE_SYNC_ERROR = 'state_sync_error',
  COMMUNICATION_TIMEOUT = 'communication_timeout'
}

/**
 * Context for bridge errors
 */
export interface BridgeErrorContext {
  operation: string;
  agentId?: string;
  sessionId?: string;
  messageId?: string;
  systemState?: YuiSystemState;
  consciousnessState?: ConsciousnessState;
}

/**
 * Bridge status
 */
export interface BridgeStatus {
  status: BridgeStatusLevel;
  lastCheck: number;
  connectionCount: number;
  activeSessions: number;
  errorCount: number;
  performance: BridgePerformance;
  issues: BridgeIssue[];
}

/**
 * Bridge status levels
 */
export enum BridgeStatusLevel {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Bridge performance metrics
 */
export interface BridgePerformance {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  efficiency: number;
}

/**
 * Bridge issues
 */
export interface BridgeIssue {
  id: string;
  type: string;
  severity: string;
  description: string;
  impact: string;
  detectedAt: number;
  resolvedAt?: number;
}

// ============================================================================
// Factory and Adapter Types
// ============================================================================

/**
 * Factory for creating Aenea-enhanced agents
 */
export interface AgentFactory {
  createAeneaAgent(agentId: string): Promise<AeneaAgent>;
  createSynthesizedAgent(agentIds: string[], method: SynthesisMethod): Promise<AeneaAgent>;
  createCustomAgent(config: CustomAgentConfig): Promise<AeneaAgent>;
  getAvailableAgentTypes(): Promise<AgentTypeInfo[]>;
}

/**
 * Methods for synthesizing multiple agents
 */
export enum SynthesisMethod {
  WEIGHTED_AVERAGE = 'weighted_average',
  CONSENSUS = 'consensus',
  DOMINANT_VOICE = 'dominant_voice',
  CREATIVE_FUSION = 'creative_fusion'
}

/**
 * Configuration for custom agents
 */
export interface CustomAgentConfig {
  name: string;
  personality: PersonalityConfig;
  capabilities: CapabilityConfig;
  baseAgents: string[];
  synthesisMethod: SynthesisMethod;
  customizations: Customization[];
}

/**
 * Personality configuration
 */
export interface PersonalityConfig {
  logicalTendency: number;
  empatheticTendency: number;
  creativeTendency: number;
  analyticalTendency: number;
  philosophicalDepth: number;
  riskTolerance: number;
}

/**
 * Capability configuration
 */
export interface CapabilityConfig {
  canGenerateThoughts: boolean;
  canReflect: boolean;
  canAssessSafety: boolean;
  canSynthesize: boolean;
  canDocument: boolean;
}

/**
 * Information about available agent types
 */
export interface AgentTypeInfo {
  type: string;
  description: string;
  capabilities: string[];
  requirements: string[];
  examples: string[];
}

// ============================================================================
// Integration Configuration Types
// ============================================================================

/**
 * Configuration for Aenea-Yui integration
 */
export interface IntegrationConfig {
  bridge: BridgeConfig;
  communication: CommunicationConfig;
  synchronization: SynchronizationConfig;
  errorHandling: ErrorHandlingConfig;
  performance: PerformanceConfig;
}

/**
 * Bridge configuration
 */
export interface BridgeConfig {
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  heartbeatInterval: number;
  maxConnections: number;
}

/**
 * Communication configuration
 */
export interface CommunicationConfig {
  messageTimeout: number;
  batchSize: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  protocolVersion: string;
}

/**
 * Synchronization configuration
 */
export interface SynchronizationConfig {
  syncInterval: number;
  stateCompression: boolean;
  conflictResolution: ConflictResolutionStrategy;
  backupEnabled: boolean;
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolutionStrategy {
  AENEA_PRIORITY = 'aenea_priority',
  YUI_PRIORITY = 'yui_priority',
  MERGE = 'merge',
  MANUAL = 'manual'
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  maxRetries: number;
  retryDelay: number;
  fallbackEnabled: boolean;
  loggingLevel: LoggingLevel;
  alertThreshold: number;
}

/**
 * Logging levels
 */
export enum LoggingLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  maxConcurrentOperations: number;
  operationTimeout: number;
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

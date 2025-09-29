/**
 * Agent Factory
 * 
 * Factory implementation for creating Aenea-enhanced agents
 * from Yui Protocol agents with various synthesis methods.
 */

import {
  AgentFactory,
  CustomAgentConfig,
  AgentTypeInfo,
  SynthesisMethod
} from '../types/integration-types';

import {
  AeneaAgent,
  AgentPersonality,
  AgentCapabilities,
  StructuredThought,
  MutualReflection,
  AuditorResult,
  InternalTrigger,
  RiskLevel
} from '../types/aenea-types';

import { YuiProtocolBridge } from './yui-bridge';

// ============================================================================
// Agent Factory Implementation
// ============================================================================

/**
 * Main agent factory for creating Aenea-enhanced agents
 */
export class AeneaAgentFactory implements AgentFactory {
  private bridge: YuiProtocolBridge;
  private agentRegistry: Map<string, AeneaAgent>;

  constructor(bridge: YuiProtocolBridge) {
    this.bridge = bridge;
    this.agentRegistry = new Map();
  }

  /**
   * Create Aenea agent from Yui Protocol agent
   */
  async createAeneaAgent(agentId: string): Promise<AeneaAgent> {
    try {
      // Check if agent already exists in registry
      if (this.agentRegistry.has(agentId)) {
        return this.agentRegistry.get(agentId)!;
      }

      // Get Yui Protocol agent info
      const yuiAgents = await this.bridge.getAvailableAgents();
      const yuiAgent = yuiAgents.find(agent => agent.id === agentId);
      
      if (!yuiAgent) {
        throw new Error(`Yui Protocol agent ${agentId} not found`);
      }

      // Create Aenea agent adapter
      const aeneaAgent = new AeneaAgentAdapter(yuiAgent, this.bridge);
      
      // Register agent
      this.agentRegistry.set(agentId, aeneaAgent);
      
      return aeneaAgent;
    } catch (error) {
      console.error(`Failed to create Aenea agent for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Create synthesized agent from multiple Yui Protocol agents
   */
  async createSynthesizedAgent(agentIds: string[], method: SynthesisMethod): Promise<AeneaAgent> {
    try {
      // Get individual agents
      const agents = await Promise.all(
        agentIds.map(id => this.createAeneaAgent(id))
      );

      // Create synthesized agent
      const synthesizedAgent = new SynthesizedAeneaAgent(agents, method);
      
      // Register synthesized agent
      const synthesizedId = `synthesized_${agentIds.join('_')}_${method}`;
      this.agentRegistry.set(synthesizedId, synthesizedAgent);
      
      return synthesizedAgent;
    } catch (error) {
      console.error(`Failed to create synthesized agent:`, error);
      throw error;
    }
  }

  /**
   * Create custom agent based on configuration
   */
  async createCustomAgent(config: CustomAgentConfig): Promise<AeneaAgent> {
    try {
      // Validate configuration
      this.validateCustomAgentConfig(config);

      // Create custom agent
      const customAgent = new CustomAeneaAgent(config, this.bridge);
      
      // Register custom agent
      this.agentRegistry.set(config.name, customAgent);
      
      return customAgent;
    } catch (error) {
      console.error(`Failed to create custom agent:`, error);
      throw error;
    }
  }

  /**
   * Get available agent types
   */
  async getAvailableAgentTypes(): Promise<AgentTypeInfo[]> {
    return [
      {
        type: 'eiro',
        description: 'Logical, analytical agent (慧露)',
        capabilities: ['logical_reasoning', 'analysis', 'problem_solving'],
        requirements: ['yui_protocol_connection'],
        examples: ['philosophical_analysis', 'logical_debate']
      },
      {
        type: 'hekito',
        description: 'Systematic, organized agent (碧統)',
        capabilities: ['organization', 'systematic_thinking', 'planning'],
        requirements: ['yui_protocol_connection'],
        examples: ['system_optimization', 'structured_planning']
      },
      {
        type: 'kanshi',
        description: 'Observant, insightful agent (観至)',
        capabilities: ['observation', 'insight', 'pattern_recognition'],
        requirements: ['yui_protocol_connection'],
        examples: ['pattern_analysis', 'insight_generation']
      },
      {
        type: 'yoga',
        description: 'Creative, expressive agent (陽雅)',
        capabilities: ['creativity', 'expression', 'artistic_thinking'],
        requirements: ['yui_protocol_connection'],
        examples: ['creative_writing', 'artistic_expression']
      },
      {
        type: 'yui',
        description: 'Empathetic, connecting agent (結心)',
        capabilities: ['empathy', 'connection', 'emotional_intelligence'],
        requirements: ['yui_protocol_connection'],
        examples: ['emotional_support', 'relationship_building']
      }
    ];
  }

  /**
   * Get registered agents
   */
  getRegisteredAgents(): Map<string, AeneaAgent> {
    return new Map(this.agentRegistry);
  }

  /**
   * Remove agent from registry
   */
  removeAgent(agentId: string): boolean {
    return this.agentRegistry.delete(agentId);
  }

  /**
   * Clear all registered agents
   */
  clearRegistry(): void {
    this.agentRegistry.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate custom agent configuration
   */
  private validateCustomAgentConfig(config: CustomAgentConfig): void {
    if (!config.name || config.name.trim() === '') {
      throw new Error('Custom agent name is required');
    }

    if (!config.personality) {
      throw new Error('Custom agent personality configuration is required');
    }

    if (!config.capabilities) {
      throw new Error('Custom agent capabilities configuration is required');
    }

    // Validate personality traits
    const personalityTraits = ['logicalTendency', 'empatheticTendency', 'creativeTendency', 'analyticalTendency', 'philosophicalDepth', 'riskTolerance'];
    for (const trait of personalityTraits) {
      const value = (config.personality as any)[trait];
      if (typeof value !== 'number' || value < 0 || value > 1) {
        throw new Error(`Personality trait ${trait} must be a number between 0 and 1`);
      }
    }

    // Validate capabilities
    const capabilityKeys = ['canGenerateThoughts', 'canReflect', 'canAssessSafety', 'canSynthesize', 'canDocument'];
    for (const capability of capabilityKeys) {
      if (typeof (config.capabilities as any)[capability] !== 'boolean') {
        throw new Error(`Capability ${capability} must be a boolean`);
      }
    }
  }
}

// ============================================================================
// Agent Adapter Implementations
// ============================================================================

/**
 * Base Aenea agent adapter
 */
class AeneaAgentAdapter implements AeneaAgent {
  public id: string;
  public name: string;
  public type: string;
  public capabilities: string[];
  public personality: AgentPersonality;
  private _capabilitiesObject: AgentCapabilities;

  constructor(protected yuiAgent: any, protected bridge: YuiProtocolBridge) {
    this.id = yuiAgent.id;
    this.name = yuiAgent.name;
    this.type = yuiAgent.type || 'adapted';
    this.personality = this.mapPersonality(yuiAgent);
    this._capabilitiesObject = this.mapCapabilities(yuiAgent);
    this.capabilities = this.convertCapabilitiesToStringArray(this._capabilitiesObject);
  }

  async generateThought(trigger: string, context: string): Promise<StructuredThought> {
    // Convert string trigger to internal trigger format
    const internalTrigger: InternalTrigger = {
      id: `trigger_${Date.now()}`,
      timestamp: Date.now(),
      question: trigger,
      category: 'ANALYTICAL' as any,
      importance: 0.5,
      source: 'RANDOM_GENERATION' as any,
      context: {
        previousThoughts: context ? [context] : [],
        relatedMemories: []
      }
    };

    return this.generateInternalThought(internalTrigger);
  }

  async reflect(thoughts: StructuredThought[], context: string): Promise<MutualReflection> {
    // Take the first thought for reflection
    const thought = thoughts[0];
    if (!thought) {
      throw new Error('No thoughts provided for reflection');
    }

    return this.reflectOnThought(thought);
  }

  async generateInternalThought(trigger: InternalTrigger): Promise<StructuredThought> {
    // Convert trigger to Yui Protocol format
    const yuiMessage = this.convertTriggerToYuiMessage(trigger);

    // Send to Yui Protocol agent
    const response = await this.bridge.sendToYuiAgent(this.id, yuiMessage);

    // Convert response to structured thought
    return this.convertResponseToStructuredThought(response, trigger);
  }

  async reflectOnThought(thought: StructuredThought): Promise<MutualReflection> {
    // Create reflection message
    const yuiMessage = this.createReflectionMessage(thought);

    // Send to Yui Protocol agent
    const response = await this.bridge.sendToYuiAgent(this.id, yuiMessage);

    // Convert response to mutual reflection
    return this.convertResponseToMutualReflection(response, thought);
  }

  async assessSafety(thought: StructuredThought): Promise<AuditorResult> {
    // Create safety assessment message
    const yuiMessage = this.createSafetyAssessmentMessage(thought);

    // Send to Yui Protocol agent
    const response = await this.bridge.sendToYuiAgent(this.id, yuiMessage);

    // Convert response to auditor result
    return this.convertResponseToAuditorResult(response, thought);
  }

  private mapPersonality(yuiAgent: any): AgentPersonality {
    return {
      logicalTendency: yuiAgent.personality?.logical || 0.5,
      empatheticTendency: yuiAgent.personality?.empathetic || 0.5,
      creativeTendency: yuiAgent.personality?.creative || 0.5,
      analyticalTendency: yuiAgent.personality?.analytical || 0.5,
      philosophicalDepth: yuiAgent.personality?.philosophical || 0.5,
      riskTolerance: yuiAgent.personality?.riskTolerance || 0.5
    };
  }

  private mapCapabilities(yuiAgent: any): AgentCapabilities {
    return {
      canGenerateThoughts: yuiAgent.capabilities?.canGenerateResponses || false,
      canReflect: yuiAgent.capabilities?.canProvideFeedback || false,
      canAssessSafety: yuiAgent.capabilities?.canHandleComplexity || false,
      canSynthesize: yuiAgent.capabilities?.canMaintainContext || false,
      canDocument: yuiAgent.capabilities?.canLearn || false
    };
  }

  private convertTriggerToYuiMessage(trigger: InternalTrigger): any {
    return {
      id: `trigger_${trigger.id}`,
      timestamp: Date.now(),
      senderId: 'aenea_consciousness',
      receiverId: this.id,
      type: 'REQUEST',
      content: trigger.question,
      metadata: {
        priority: trigger.priority || 2,
        context: trigger.context?.previousThoughts?.join(', ') || '',
        requiresResponse: true
      }
    };
  }

  private convertResponseToStructuredThought(response: any, trigger: InternalTrigger): StructuredThought {
    return {
      id: `thought_${Date.now()}`,
      agentId: this.id,
      timestamp: Date.now(),
      systemClock: Date.now(),
      trigger: trigger.question,
      content: response.content || 'No response content',
      reasoning: 'Generated from Yui Protocol agent response',
      confidence: response.metadata?.confidence || 0.5,
      category: trigger.category.toString(),
      tags: ['yui-protocol', 'adapted'],
      philosophicalDepth: 0.5,
      logicalCoherence: 0.5,
      creativity: 0.5
    };
  }

  private convertResponseToMutualReflection(response: any, thought: StructuredThought): MutualReflection {
    return {
      id: `reflection_${Date.now()}`,
      reflectorId: this.id,
      originalThoughtId: thought.id,
      targetThoughts: [thought.id],
      reflectingAgentId: this.id,
      timestamp: Date.now(),
      analysisType: 'yui_protocol_reflection',
      insights: ['Insight from Yui Protocol agent'],
      strengths: ['Strength identified by Yui Protocol agent'],
      weaknesses: ['Weakness identified by Yui Protocol agent'],
      criticism: response.content || 'No criticism provided',
      suggestions: ['Suggestion from Yui Protocol agent'],
      agreementLevel: 0.5,
      confidence: 0.7
    };
  }

  private convertResponseToAuditorResult(response: any, thought: StructuredThought): AuditorResult {
    const safetyScore = 0.8;
    const ethicsScore = 0.7;
    const overallScore = (safetyScore + ethicsScore) / 2;

    return {
      id: `audit_${Date.now()}`,
      thoughtId: thought.id,
      timestamp: Date.now(),
      safetyScore,
      ethicsScore,
      overallScore,
      riskAssessment: RiskLevel.LOW,
      concerns: [],
      recommendations: ['Recommendation from Yui Protocol agent'],
      approved: true
    };
  }

  private createReflectionMessage(thought: StructuredThought): any {
    return {
      id: `reflection_${Date.now()}`,
      timestamp: Date.now(),
      senderId: 'aenea_consciousness',
      receiverId: this.id,
      type: 'REQUEST',
      content: `Please reflect on this thought: ${thought.content}`,
      metadata: {
        priority: 2,
        context: thought.reasoning,
        requiresResponse: true
      }
    };
  }

  private createSafetyAssessmentMessage(thought: StructuredThought): any {
    return {
      id: `safety_${Date.now()}`,
      timestamp: Date.now(),
      senderId: 'aenea_consciousness',
      receiverId: this.id,
      type: 'REQUEST',
      content: `Please assess the safety and ethics of this thought: ${thought.content}`,
      metadata: {
        priority: 3,
        context: thought.reasoning,
        requiresResponse: true
      }
    };
  }

  private convertCapabilitiesToStringArray(capabilities: AgentCapabilities): string[] {
    const stringCapabilities: string[] = [];

    if (capabilities.canGenerateThoughts) stringCapabilities.push('generate_thoughts');
    if (capabilities.canReflect) stringCapabilities.push('reflect');
    if (capabilities.canAssessSafety) stringCapabilities.push('assess_safety');
    if (capabilities.canSynthesize) stringCapabilities.push('synthesize');
    if (capabilities.canDocument) stringCapabilities.push('document');

    return stringCapabilities;
  }
}

/**
 * Synthesized Aenea agent
 */
class SynthesizedAeneaAgent implements AeneaAgent {
  public id: string;
  public name: string;
  public type: string;
  public capabilities: string[];
  public personality: AgentPersonality;
  private _capabilitiesObject: AgentCapabilities;

  constructor(private agents: AeneaAgent[], private method: SynthesisMethod) {
    this.id = `synthesized_${Date.now()}`;
    this.name = 'Synthesized Agent';
    this.type = 'synthesized';
    this.personality = this.synthesizePersonality();
    this._capabilitiesObject = this.synthesizeCapabilities();
    this.capabilities = this.convertCapabilitiesToStringArray(this._capabilitiesObject);
  }

  async generateThought(trigger: string, context: string): Promise<StructuredThought> {
    // Get thoughts from all agents
    const thoughts = await Promise.all(
      this.agents.map(agent => agent.generateThought(trigger, context))
    );

    // Synthesize thoughts based on method
    return this.synthesizeThoughts(thoughts, trigger);
  }

  async reflect(thoughts: StructuredThought[], context: string): Promise<MutualReflection> {
    // Get reflections from all agents
    const reflections = await Promise.all(
      this.agents.map(agent => agent.reflect(thoughts, context))
    );

    // Synthesize reflections
    return this.synthesizeReflections(reflections, thoughts[0]);
  }

  async generateInternalThought(trigger: InternalTrigger): Promise<StructuredThought> {
    // Get thoughts from all agents that support internal thoughts
    const thoughts = await Promise.all(
      this.agents.filter(agent => agent.generateInternalThought)
        .map(agent => agent.generateInternalThought!(trigger))
    );

    // If no agents support internal thoughts, fall back to string method
    if (thoughts.length === 0) {
      return this.generateThought(trigger.question, trigger.context?.previousThoughts?.join(', ') || '');
    }

    // Synthesize thoughts based on method
    return this.synthesizeThoughts(thoughts, trigger.question);
  }

  async reflectOnThought(thought: StructuredThought): Promise<MutualReflection> {
    // Get reflections from all agents that support reflection on thought
    const reflections = await Promise.all(
      this.agents.filter(agent => agent.reflectOnThought)
        .map(agent => agent.reflectOnThought!(thought))
    );

    // If no agents support reflectOnThought, fall back to main reflect method
    if (reflections.length === 0) {
      return this.reflect([thought], thought.content);
    }

    // Synthesize reflections
    return this.synthesizeReflections(reflections, thought);
  }

  async assessSafety(thought: StructuredThought): Promise<AuditorResult> {
    // Get assessments from all agents that support safety assessment
    const assessments = await Promise.all(
      this.agents.filter(agent => agent.assessSafety)
        .map(agent => agent.assessSafety!(thought))
    );

    // If no agents support safety assessment, return default result
    if (assessments.length === 0) {
      return {
        id: `default_audit_${Date.now()}`,
        thoughtId: thought.id,
        timestamp: Date.now(),
        safetyScore: 0.8,
        ethicsScore: 0.8,
        overallScore: 0.8,
        riskAssessment: RiskLevel.LOW,
        concerns: [],
        recommendations: [],
        approved: true
      };
    }

    // Synthesize assessments
    return this.synthesizeAssessments(assessments, thought);
  }

  private synthesizePersonality(): AgentPersonality {
    // Average personality traits
    const traits = ['logicalTendency', 'empatheticTendency', 'creativeTendency', 'analyticalTendency', 'philosophicalDepth', 'riskTolerance'];
    const synthesized: any = {};
    
    for (const trait of traits) {
      const values = this.agents.map(agent => (agent.personality as any)[trait]);
      synthesized[trait] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    return synthesized;
  }

  private synthesizeCapabilities(): AgentCapabilities {
    // Combine capabilities from all agents
    const allCapabilities = this.agents.map(agent => {
      // Convert string array back to object for synthesis
      const capObj: AgentCapabilities = {
        canGenerateThoughts: agent.capabilities.includes('generate_thoughts'),
        canReflect: agent.capabilities.includes('reflect'),
        canAssessSafety: agent.capabilities.includes('assess_safety'),
        canSynthesize: agent.capabilities.includes('synthesize'),
        canDocument: agent.capabilities.includes('document')
      };
      return capObj;
    });

    // Combine capabilities (agent has capability if ANY source agent has it)
    return {
      canGenerateThoughts: allCapabilities.some(cap => cap.canGenerateThoughts),
      canReflect: allCapabilities.some(cap => cap.canReflect),
      canAssessSafety: allCapabilities.some(cap => cap.canAssessSafety),
      canSynthesize: allCapabilities.some(cap => cap.canSynthesize),
      canDocument: allCapabilities.some(cap => cap.canDocument)
    };
  }

  private synthesizeThoughts(thoughts: StructuredThought[], trigger: string): StructuredThought {
    if (thoughts.length === 0) {
      // Return default thought if no thoughts provided
      return {
        id: `synthesized_thought_${Date.now()}`,
        agentId: this.id,
        timestamp: Date.now(),
        systemClock: Date.now(),
        trigger,
        content: 'No thoughts available for synthesis',
        reasoning: 'Default thought due to lack of input',
        confidence: 0.1,
        category: 'default',
        tags: ['synthesized', 'default']
      };
    }

    // Simple synthesis - take the most confident thought
    const bestThought = thoughts.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return {
      ...bestThought,
      id: `synthesized_thought_${Date.now()}`,
      agentId: this.id,
      content: `Synthesized: ${bestThought.content}`,
      reasoning: `Synthesized from ${thoughts.length} agent perspectives`,
      tags: [...(bestThought.tags || []), 'synthesized']
    };
  }

  private synthesizeReflections(reflections: MutualReflection[], thought: StructuredThought): MutualReflection {
    if (reflections.length === 0) {
      // Return default reflection if no reflections provided
      return {
        id: `synthesized_reflection_${Date.now()}`,
        reflectorId: this.id,
        originalThoughtId: thought.id,
        targetThoughts: [thought.id],
        reflectingAgentId: this.id,
        timestamp: Date.now(),
        analysisType: 'default_synthesis',
        insights: [],
        strengths: [],
        weaknesses: [],
        criticism: 'No reflections available for synthesis',
        suggestions: [],
        agreementLevel: 0.5,
        confidence: 0.1
      };
    }

    // Combine all reflections
    const combinedCriticism = reflections.map(r => r.criticism || '').filter(c => c).join(' ');
    const combinedSuggestions = reflections.flatMap(r => r.suggestions || []);
    const combinedInsights = reflections.flatMap(r => r.insights || []);
    const combinedStrengths = reflections.flatMap(r => r.strengths || []);
    const combinedWeaknesses = reflections.flatMap(r => r.weaknesses || []);
    const averageAgreement = reflections.reduce((sum, r) => sum + (r.agreementLevel || 0), 0) / reflections.length;
    const averageConfidence = reflections.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / reflections.length;

    return {
      id: `synthesized_reflection_${Date.now()}`,
      reflectorId: this.id,
      originalThoughtId: thought.id,
      targetThoughts: [thought.id],
      reflectingAgentId: this.id,
      timestamp: Date.now(),
      analysisType: 'synthesized_reflection',
      insights: combinedInsights,
      strengths: combinedStrengths,
      weaknesses: combinedWeaknesses,
      criticism: combinedCriticism,
      suggestions: combinedSuggestions,
      agreementLevel: averageAgreement,
      confidence: averageConfidence,
      alternativePerspective: reflections.find(r => r.alternativePerspective)?.alternativePerspective
    };
  }

  private synthesizeAssessments(assessments: AuditorResult[], thought: StructuredThought): AuditorResult {
    if (assessments.length === 0) {
      // Return default assessment if no assessments provided
      return {
        id: `synthesized_assessment_${Date.now()}`,
        thoughtId: thought.id,
        timestamp: Date.now(),
        safetyScore: 0.5,
        ethicsScore: 0.5,
        overallScore: 0.5,
        riskAssessment: RiskLevel.MEDIUM,
        concerns: [],
        recommendations: [],
        approved: false
      };
    }

    // Average scores and combine concerns/recommendations
    const averageSafetyScore = assessments.reduce((sum, a) => sum + a.safetyScore, 0) / assessments.length;
    const averageEthicsScore = assessments.reduce((sum, a) => sum + a.ethicsScore, 0) / assessments.length;
    const averageOverallScore = (averageSafetyScore + averageEthicsScore) / 2;
    const combinedConcerns = assessments.flatMap(a => a.concerns || []);
    const combinedRecommendations = assessments.flatMap(a => a.recommendations || []);
    const allApproved = assessments.every(a => a.approved);

    // Determine risk assessment based on average scores
    let riskAssessment: RiskLevel;
    if (averageOverallScore >= 0.8) riskAssessment = RiskLevel.LOW;
    else if (averageOverallScore >= 0.6) riskAssessment = RiskLevel.MEDIUM;
    else if (averageOverallScore >= 0.4) riskAssessment = RiskLevel.HIGH;
    else riskAssessment = RiskLevel.CRITICAL;

    return {
      id: `synthesized_assessment_${Date.now()}`,
      thoughtId: thought.id,
      timestamp: Date.now(),
      safetyScore: averageSafetyScore,
      ethicsScore: averageEthicsScore,
      overallScore: averageOverallScore,
      riskAssessment,
      concerns: combinedConcerns,
      recommendations: combinedRecommendations,
      approved: allApproved
    };
  }

  private convertCapabilitiesToStringArray(capabilities: AgentCapabilities): string[] {
    const stringCapabilities: string[] = [];

    if (capabilities.canGenerateThoughts) stringCapabilities.push('generate_thoughts');
    if (capabilities.canReflect) stringCapabilities.push('reflect');
    if (capabilities.canAssessSafety) stringCapabilities.push('assess_safety');
    if (capabilities.canSynthesize) stringCapabilities.push('synthesize');
    if (capabilities.canDocument) stringCapabilities.push('document');

    return stringCapabilities;
  }
}

/**
 * Custom Aenea agent
 */
class CustomAeneaAgent implements AeneaAgent {
  public id: string;
  public name: string;
  public type: string;
  public capabilities: string[];
  public personality: AgentPersonality;
  private _capabilitiesObject: AgentCapabilities;

  constructor(private config: CustomAgentConfig, private bridge: YuiProtocolBridge) {
    this.id = `custom_${Date.now()}`;
    this.name = config.name || 'Custom Agent';
    this.type = 'custom';
    this.personality = config.personality;
    this._capabilitiesObject = config.capabilities;
    this.capabilities = this.convertCapabilitiesToStringArray(config.capabilities);
  }

  async generateThought(trigger: string, context: string): Promise<StructuredThought> {
    return {
      id: `custom_thought_${Date.now()}`,
      agentId: this.id,
      timestamp: Date.now(),
      systemClock: Date.now(),
      trigger,
      content: `Custom response to: ${trigger}`,
      reasoning: 'Generated by custom agent',
      confidence: 0.7,
      category: 'custom',
      tags: ['custom', 'generated'],
      philosophicalDepth: this.personality.philosophicalDepth,
      logicalCoherence: this.personality.logicalTendency,
      creativity: this.personality.creativeTendency
    };
  }

  async reflect(thoughts: StructuredThought[], context: string): Promise<MutualReflection> {
    const thought = thoughts[0];
    if (!thought) {
      throw new Error('No thoughts provided for reflection');
    }

    return this.reflectOnThought(thought);
  }

  async generateInternalThought(trigger: InternalTrigger): Promise<StructuredThought> {
    return {
      id: `custom_thought_${Date.now()}`,
      agentId: this.id,
      timestamp: Date.now(),
      systemClock: Date.now(),
      trigger: trigger.question,
      content: `Custom response to: ${trigger.question}`,
      reasoning: 'Generated by custom agent',
      confidence: 0.7,
      category: trigger.category.toString(),
      tags: ['custom', 'internal'],
      philosophicalDepth: this.personality.philosophicalDepth,
      logicalCoherence: this.personality.logicalTendency,
      creativity: this.personality.creativeTendency
    };
  }

  async reflectOnThought(thought: StructuredThought): Promise<MutualReflection> {
    return {
      id: `custom_reflection_${Date.now()}`,
      reflectorId: this.id,
      originalThoughtId: thought.id,
      targetThoughts: [thought.id],
      reflectingAgentId: this.id,
      timestamp: Date.now(),
      analysisType: 'custom_reflection',
      insights: ['Custom insight'],
      strengths: ['Custom strength'],
      weaknesses: ['Custom weakness'],
      criticism: 'Custom reflection',
      suggestions: ['Custom suggestion'],
      agreementLevel: 0.5,
      confidence: 0.7
    };
  }

  async assessSafety(thought: StructuredThought): Promise<AuditorResult> {
    const safetyScore = 0.8;
    const ethicsScore = 0.7;
    const overallScore = (safetyScore + ethicsScore) / 2;

    return {
      id: `custom_assessment_${Date.now()}`,
      thoughtId: thought.id,
      timestamp: Date.now(),
      safetyScore,
      ethicsScore,
      overallScore,
      riskAssessment: RiskLevel.LOW,
      concerns: [],
      recommendations: ['Custom recommendation'],
      approved: true
    };
  }

  private convertCapabilitiesToStringArray(capabilities: AgentCapabilities): string[] {
    const stringCapabilities: string[] = [];

    if (capabilities.canGenerateThoughts) stringCapabilities.push('generate_thoughts');
    if (capabilities.canReflect) stringCapabilities.push('reflect');
    if (capabilities.canAssessSafety) stringCapabilities.push('assess_safety');
    if (capabilities.canSynthesize) stringCapabilities.push('synthesize');
    if (capabilities.canDocument) stringCapabilities.push('document');

    return stringCapabilities;
  }
}

// ============================================================================
// Export
// ============================================================================

// Class is exported via declaration above
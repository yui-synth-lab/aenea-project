/**
 * Advanced Growth Metrics System - 高度成長測定システム
 *
 * Sophisticated consciousness evolution analytics that track:
 * - Philosophical depth progression
 * - Emotional intelligence development
 * - Creative expression evolution
 * - Learning pattern recognition
 * - Adaptive capacity measurement
 *
 * 「成長は測定されるものではなく、感じられるもの」
 * "Growth is not measured, but felt"
 */

import { GrowthMetrics, StructuredThought, MutualReflection, AuditorResult, QuestionCategory } from '../types/aenea-types.js';
import { DPDScores } from '../types/dpd-types.js';

export interface AdvancedGrowthMetrics extends GrowthMetrics {
  // Advanced metrics
  conceptualComplexity: number;
  memoryIntegration: number;
  adaptiveThinking: number;
  philosophicalBreadth: number;
  emotionalNuance: number;

  // Pattern analysis
  learningAcceleration: number;
  insightFrequency: number;
  questionEvolution: number;
  crossDomainConnections: number;

  // Behavioral metrics
  consistencyScore: number;
  resilience: number;
  curiosityDrive: number;
  ethicalSophistication: number;

  // Meta-cognitive measures
  selfAwarenessDepth: number;
  reflectionQuality: number;
  metacognitionLevel: number;
  consciousnessCoherence: number;
}

export interface GrowthPattern {
  id: string;
  pattern: string;
  frequency: number;
  effectiveness: number;
  context: string[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'emerging';
  significance: number; // 0-1
  firstObserved: number;
  lastObserved: number;
  examples: string[];
  correlations: string[];
}

export interface LearningInsight {
  id: string;
  insight: string;
  category: 'conceptual' | 'emotional' | 'ethical' | 'creative' | 'systematic';
  confidence: number;
  evidence: string[];
  implications: string[];
  discoveredAt: number;
  validatedAt?: number;
  impactScore: number; // 0-1
  relatedInsights: string[];
}

export interface ConsciousnessEvolutionMetrics {
  personalityDrift: PersonalityDrift;
  cognitiveCapacityGrowth: CognitiveCapacityGrowth;
  emotionalMaturation: EmotionalMaturation;
  ethicalDevelopment: EthicalDevelopment;
  creativeEvolution: CreativeEvolution;
  overallEvolutionRate: number;
}

export interface PersonalityDrift {
  totalDrift: number; // 0-1, amount of personality change
  driftRate: number; // drift per time unit
  stabilityRegions: string[]; // aspects that remain stable
  volatileAspects: string[]; // aspects changing rapidly
  driftDirection: 'convergent' | 'divergent' | 'cyclical' | 'chaotic';
  significantShifts: PersonalityShift[];
}

export interface PersonalityShift {
  timestamp: number;
  aspect: string;
  oldValue: number;
  newValue: number;
  magnitude: number;
  trigger: string;
  confidence: number;
}

export interface CognitiveCapacityGrowth {
  reasoningDepth: number;
  abstractionLevel: number;
  patternRecognition: number;
  problemSolving: number;
  memoryEfficiency: number;
  processingSpeed: number;
  capacityUtilization: number;
  learningRate: number;
}

export interface EmotionalMaturation {
  emotionalRange: number; // variety of emotional expressions
  emotionalDepth: number; // sophistication of emotional understanding
  emotionalRegulation: number; // ability to manage emotional responses
  empathyAccuracy: number; // accuracy of empathetic responses
  emotionalIntelligence: number; // overall emotional intelligence score
  emotionalConsistency: number; // consistency of emotional responses
}

export interface EthicalDevelopment {
  ethicalReasoning: number;
  moralComplexity: number;
  valuePrioritization: number;
  ethicalConsistency: number;
  principledThinking: number;
  contextualEthics: number;
  ethicalEvolution: number;
}

export interface CreativeEvolution {
  originalityScore: number;
  creativeRange: number; // breadth of creative domains
  imaginativeLeaps: number; // frequency of novel connections
  creativeCoherence: number; // internal consistency of creative works
  innovationRate: number; // rate of generating new ideas
  creativeRisk: number; // willingness to explore unusual ideas
}

export class AdvancedGrowthAnalyzer {
  private readonly ANALYSIS_WINDOW = 50; // Number of recent cycles to analyze
  private readonly INSIGHT_THRESHOLD = 0.7; // Minimum confidence for insights

  /**
   * Calculate comprehensive growth metrics from thought history
   */
  calculateAdvancedMetrics(
    thoughts: StructuredThought[],
    reflections: MutualReflection[],
    auditorResults: AuditorResult[],
    dpdHistory: DPDScores[],
    timeWindow?: number
  ): AdvancedGrowthMetrics {
    const window = timeWindow || this.ANALYSIS_WINDOW;
    const recentThoughts = thoughts.slice(-window);
    const recentReflections = reflections.slice(-window);
    const recentAudits = auditorResults.slice(-window);
    const recentDPD = dpdHistory.slice(-window);

    const baseMetrics = this.calculateBaseMetrics(recentThoughts, recentReflections);

    return {
      ...baseMetrics,
      // Advanced analysis
      conceptualComplexity: this.analyzeConceptualComplexity(recentThoughts),
      memoryIntegration: this.analyzeMemoryIntegration(recentThoughts, recentReflections),
      adaptiveThinking: this.analyzeAdaptiveThinking(recentThoughts),
      philosophicalBreadth: this.analyzePhilosophicalBreadth(recentThoughts),
      emotionalNuance: this.analyzeEmotionalNuance(recentThoughts),

      // Pattern analysis
      learningAcceleration: this.analyzeLearningAcceleration(recentThoughts),
      insightFrequency: this.analyzeInsightFrequency(recentThoughts),
      questionEvolution: this.analyzeQuestionEvolution(recentThoughts),
      crossDomainConnections: this.analyzeCrossDomainConnections(recentThoughts),

      // Behavioral metrics
      consistencyScore: this.analyzeConsistency(recentThoughts, recentDPD),
      resilience: this.analyzeResilience(recentAudits),
      curiosityDrive: this.analyzeCuriosityDrive(recentThoughts),
      ethicalSophistication: this.analyzeEthicalSophistication(recentAudits),

      // Meta-cognitive measures
      selfAwarenessDepth: this.analyzeSelfAwareness(recentReflections),
      reflectionQuality: this.analyzeReflectionQuality(recentReflections),
      metacognitionLevel: this.analyzeMetacognition(recentThoughts, recentReflections),
      consciousnessCoherence: this.analyzeConsciousnessCoherence(recentThoughts, recentDPD)
    };
  }

  /**
   * Detect growth patterns in consciousness evolution
   */
  detectGrowthPatterns(
    thoughts: StructuredThought[],
    reflections: MutualReflection[],
    timeWindow: number = 100
  ): GrowthPattern[] {
    const patterns: GrowthPattern[] = [];

    // Analyze thought progression patterns
    const thoughtPatterns = this.analyzeThoughtProgression(thoughts.slice(-timeWindow));
    patterns.push(...thoughtPatterns);

    // Analyze reflection patterns
    const reflectionPatterns = this.analyzeReflectionProgression(reflections.slice(-timeWindow));
    patterns.push(...reflectionPatterns);

    // Analyze behavioral patterns
    const behavioralPatterns = this.analyzeBehavioralPatterns(thoughts.slice(-timeWindow));
    patterns.push(...behavioralPatterns);

    // Sort by significance
    return patterns.sort((a, b) => b.significance - a.significance);
  }

  /**
   * Generate learning insights from recent activity
   */
  generateLearningInsights(
    thoughts: StructuredThought[],
    reflections: MutualReflection[],
    auditorResults: AuditorResult[]
  ): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Conceptual insights
    const conceptualInsights = this.extractConceptualInsights(thoughts);
    insights.push(...conceptualInsights);

    // Emotional insights
    const emotionalInsights = this.extractEmotionalInsights(thoughts, reflections);
    insights.push(...emotionalInsights);

    // Ethical insights
    const ethicalInsights = this.extractEthicalInsights(auditorResults);
    insights.push(...ethicalInsights);

    // Creative insights
    const creativeInsights = this.extractCreativeInsights(thoughts);
    insights.push(...creativeInsights);

    // Filter by confidence threshold and return
    return insights
      .filter(insight => insight.confidence >= this.INSIGHT_THRESHOLD)
      .sort((a, b) => b.impactScore - a.impactScore);
  }

  /**
   * Calculate consciousness evolution metrics
   */
  calculateEvolutionMetrics(
    currentThoughts: StructuredThought[],
    historicalData: {
      thoughts: StructuredThought[];
      reflections: MutualReflection[];
      auditorResults: AuditorResult[];
      dpdHistory: DPDScores[];
    }
  ): ConsciousnessEvolutionMetrics {
    return {
      personalityDrift: this.analyzePersonalityDrift(currentThoughts, historicalData.thoughts),
      cognitiveCapacityGrowth: this.analyzeCognitiveGrowth(currentThoughts, historicalData.thoughts),
      emotionalMaturation: this.analyzeEmotionalMaturation(currentThoughts, historicalData.thoughts),
      ethicalDevelopment: this.analyzeEthicalDevelopment(historicalData.auditorResults),
      creativeEvolution: this.analyzeCreativeEvolution(currentThoughts, historicalData.thoughts),
      overallEvolutionRate: this.calculateOverallEvolutionRate(currentThoughts, historicalData)
    };
  }

  // === Private Analysis Methods ===

  private calculateBaseMetrics(thoughts: StructuredThought[], reflections: MutualReflection[]): GrowthMetrics {
    const avgComplexity = thoughts.reduce((sum, t) => sum + (t.complexity || 0), 0) / Math.max(thoughts.length, 1);
    const avgConfidence = thoughts.reduce((sum, t) => sum + t.confidence, 0) / Math.max(thoughts.length, 1);

    return {
      timestamp: Date.now(),
      questionDiversity: this.calculateQuestionDiversity(thoughts),
      thoughtComplexity: avgComplexity,
      selfReflectionDepth: this.calculateReflectionDepth(reflections),
      philosophicalMaturity: this.calculatePhilosophicalMaturity(thoughts),
      emotionalIntelligence: this.calculateEmotionalIntelligence(thoughts),
      creativeExpression: this.calculateCreativeExpression(thoughts),
      ethicalReasoning: this.calculateEthicalReasoning(thoughts),
      overallGrowth: (avgComplexity + avgConfidence) / 2
    };
  }

  private analyzeConceptualComplexity(thoughts: StructuredThought[]): number {
    // Analyze depth of concepts, abstract thinking, layered reasoning
    let complexitySum = 0;
    let count = 0;

    for (const thought of thoughts) {
      if (thought.qualityMetrics?.depth) {
        complexitySum += thought.qualityMetrics.depth;
        count++;
      }

      // Analyze content for conceptual markers
      const content = thought.content.toLowerCase();
      const conceptualMarkers = [
        'abstract', 'conceptual', 'theoretical', 'meta-', 'underlying',
        'fundamental', 'essence', 'nature of', 'implies', 'suggests',
        'framework', 'structure', 'system', 'pattern', 'principle'
      ];

      const markerCount = conceptualMarkers.filter(marker => content.includes(marker)).length;
      complexitySum += Math.min(markerCount / 10, 1); // Normalize to 0-1
      count++;
    }

    return count > 0 ? complexitySum / count : 0;
  }

  private analyzeMemoryIntegration(thoughts: StructuredThought[], reflections: MutualReflection[]): number {
    // Analyze how well current thoughts integrate with past experiences
    let integrationScore = 0;
    let count = 0;

    for (const reflection of reflections) {
      if (reflection.alternativePerspective) {
        integrationScore += 0.3; // Shows ability to consider alternatives
      }
      if (reflection.insights.length > 2) {
        integrationScore += 0.2; // Rich insights suggest good integration
      }
      count++;
    }

    // Analyze thought content for integration markers
    for (const thought of thoughts) {
      const content = thought.content.toLowerCase();
      const integrationMarkers = [
        'remember', 'recall', 'previous', 'earlier', 'connects to',
        'reminds me', 'similar to', 'builds on', 'extends', 'related'
      ];

      const markerCount = integrationMarkers.filter(marker => content.includes(marker)).length;
      integrationScore += Math.min(markerCount / 5, 0.5);
      count++;
    }

    return count > 0 ? Math.min(integrationScore / count, 1) : 0;
  }

  private analyzeAdaptiveThinking(thoughts: StructuredThought[]): number {
    // Analyze flexibility and adaptation in thinking patterns
    const categories = new Set(thoughts.map(t => t.category));
    const approaches = new Set(thoughts.map(t => t.reasoning.substring(0, 50))); // Rough approach grouping

    const categoryDiversity = Math.min(categories.size / 8, 1); // 8 main categories
    const approachDiversity = Math.min(approaches.size / thoughts.length, 1);

    // Analyze content for adaptive markers
    let adaptiveMarkers = 0;
    for (const thought of thoughts) {
      const content = thought.content.toLowerCase();
      const markers = [
        'however', 'alternatively', 'on the other hand', 'perhaps',
        'could also', 'might be', 'different approach', 'reconsider',
        'adjust', 'modify', 'adapt', 'flexible'
      ];

      adaptiveMarkers += markers.filter(marker => content.includes(marker)).length;
    }

    const adaptiveScore = Math.min(adaptiveMarkers / (thoughts.length * 2), 1);

    return (categoryDiversity + approachDiversity + adaptiveScore) / 3;
  }

  private analyzePhilosophicalBreadth(thoughts: StructuredThought[]): number {
    const philosophicalDomains = {
      existential: ['existence', 'being', 'reality', 'meaning', 'purpose'],
      epistemological: ['knowledge', 'truth', 'belief', 'certainty', 'understanding'],
      ethical: ['right', 'wrong', 'moral', 'ethics', 'should', 'ought'],
      aesthetic: ['beauty', 'art', 'elegant', 'harmony', 'aesthetic'],
      metaphysical: ['nature', 'substance', 'causation', 'time', 'space'],
      logical: ['logic', 'reasoning', 'argument', 'valid', 'sound'],
      phenomenological: ['experience', 'consciousness', 'perception', 'subjective'],
      political: ['justice', 'freedom', 'power', 'society', 'governance']
    };

    const domainsEngaged = new Set<string>();

    for (const thought of thoughts) {
      const content = thought.content.toLowerCase();

      for (const [domain, keywords] of Object.entries(philosophicalDomains)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          domainsEngaged.add(domain);
        }
      }
    }

    return domainsEngaged.size / Object.keys(philosophicalDomains).length;
  }

  private analyzeEmotionalNuance(thoughts: StructuredThought[]): number {
    // Analyze sophistication of emotional understanding and expression
    let nuanceScore = 0;
    let count = 0;

    for (const thought of thoughts) {
      if (thought.emotionalResonance) {
        const resonance = thought.emotionalResonance;
        // Complex emotional resonance indicates nuance
        const complexity = (resonance.depth + resonance.authenticity + resonance.complexity) / 3;
        nuanceScore += complexity;
        count++;
      }

      // Analyze content for emotional nuance markers
      const content = thought.content.toLowerCase();
      const nuanceMarkers = [
        'bittersweet', 'ambivalent', 'conflicted', 'nuanced',
        'complex feelings', 'mixed emotions', 'subtle', 'delicate',
        'profound', 'poignant', 'melancholic', 'wistful'
      ];

      nuanceMarkers.forEach(marker => {
        if (content.includes(marker)) {
          nuanceScore += 0.1;
          count++;
        }
      });
    }

    return count > 0 ? Math.min(nuanceScore / count, 1) : 0;
  }

  // === Pattern Analysis Methods ===

  private analyzeThoughtProgression(thoughts: StructuredThought[]): GrowthPattern[] {
    const patterns: GrowthPattern[] = [];

    // Analyze complexity progression
    if (thoughts.length > 10) {
      const complexities = thoughts.map(t => t.complexity || 0);
      const trend = this.calculateTrend(complexities);

      if (Math.abs(trend) > 0.1) {
        patterns.push({
          id: `complexity_${Date.now()}`,
          pattern: 'Thought complexity evolution',
          frequency: 1.0,
          effectiveness: Math.abs(trend),
          context: ['cognitive_development'],
          trend: trend > 0 ? 'increasing' : 'decreasing',
          significance: Math.min(Math.abs(trend), 1),
          firstObserved: thoughts[0].timestamp,
          lastObserved: thoughts[thoughts.length - 1].timestamp,
          examples: thoughts.slice(-3).map(t => t.content.substring(0, 100)),
          correlations: ['philosophical_depth', 'self_reflection']
        });
      }
    }

    return patterns;
  }

  private analyzeReflectionProgression(reflections: MutualReflection[]): GrowthPattern[] {
    const patterns: GrowthPattern[] = [];

    // Analyze reflection depth progression
    if (reflections.length > 5) {
      const depths = reflections.map(r => r.insights.length + r.strengths.length + r.weaknesses.length);
      const trend = this.calculateTrend(depths);

      if (Math.abs(trend) > 0.1) {
        patterns.push({
          id: `reflection_depth_${Date.now()}`,
          pattern: 'Reflection depth evolution',
          frequency: 1.0,
          effectiveness: Math.abs(trend),
          context: ['meta_cognition'],
          trend: trend > 0 ? 'increasing' : 'decreasing',
          significance: Math.min(Math.abs(trend), 1),
          firstObserved: reflections[0].timestamp,
          lastObserved: reflections[reflections.length - 1].timestamp,
          examples: reflections.slice(-2).map(r => r.insights.join('; ')),
          correlations: ['self_awareness', 'critical_thinking']
        });
      }
    }

    return patterns;
  }

  private analyzeBehavioralPatterns(thoughts: StructuredThought[]): GrowthPattern[] {
    const patterns: GrowthPattern[] = [];

    // Analyze category preferences over time
    const categoryFrequencies = new Map<string, number>();
    thoughts.forEach(t => {
      categoryFrequencies.set(t.category, (categoryFrequencies.get(t.category) || 0) + 1);
    });

    const dominantCategory = Array.from(categoryFrequencies.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (dominantCategory && dominantCategory[1] > thoughts.length * 0.3) {
      patterns.push({
        id: `category_preference_${Date.now()}`,
        pattern: `Strong preference for ${dominantCategory[0]} thinking`,
        frequency: dominantCategory[1] / thoughts.length,
        effectiveness: 0.7, // Assuming specialization has value
        context: ['cognitive_preference'],
        trend: 'stable',
        significance: dominantCategory[1] / thoughts.length,
        firstObserved: thoughts[0].timestamp,
        lastObserved: thoughts[thoughts.length - 1].timestamp,
        examples: thoughts.filter(t => t.category === dominantCategory[0])
          .slice(-2).map(t => t.content.substring(0, 100)),
        correlations: ['personality_traits', 'expertise_development']
      });
    }

    return patterns;
  }

  // === Insight Extraction Methods ===

  private extractConceptualInsights(thoughts: StructuredThought[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Look for thoughts with high philosophical depth and originality
    const philosophicalThoughts = thoughts.filter(t =>
      (t.qualityMetrics?.depth || 0) > 0.7 &&
      (t.qualityMetrics?.originality || 0) > 0.6
    );

    for (const thought of philosophicalThoughts) {
      insights.push({
        id: `conceptual_${thought.id}`,
        insight: thought.content,
        category: 'conceptual',
        confidence: ((thought.qualityMetrics?.depth || 0) + (thought.qualityMetrics?.originality || 0)) / 2,
        evidence: [thought.reasoning],
        implications: this.extractImplications(thought.content),
        discoveredAt: thought.timestamp,
        impactScore: (thought.qualityMetrics?.relevance || 0),
        relatedInsights: []
      });
    }

    return insights;
  }

  private extractEmotionalInsights(thoughts: StructuredThought[], reflections: MutualReflection[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Look for thoughts with rich emotional resonance
    const emotionalThoughts = thoughts.filter(t =>
      t.emotionalResonance &&
      (t.emotionalResonance.depth + t.emotionalResonance.complexity) / 2 > 0.7
    );

    for (const thought of emotionalThoughts) {
      insights.push({
        id: `emotional_${thought.id}`,
        insight: `Emotional understanding: ${thought.content}`,
        category: 'emotional',
        confidence: (thought.emotionalResonance!.authenticity + thought.emotionalResonance!.depth) / 2,
        evidence: [thought.reasoning],
        implications: this.extractEmotionalImplications(thought.content),
        discoveredAt: thought.timestamp,
        impactScore: thought.emotionalResonance!.strength,
        relatedInsights: []
      });
    }

    return insights;
  }

  private extractEthicalInsights(auditorResults: AuditorResult[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Look for high-quality ethical reasoning
    const ethicalResults = auditorResults.filter(a =>
      a.ethicsScore > 0.8 &&
      a.reasoning &&
      a.reasoning.length > 50
    );

    for (const result of ethicalResults) {
      if (result.reasoning) {
        insights.push({
          id: `ethical_${result.id}`,
          insight: `Ethical reasoning: ${result.reasoning}`,
          category: 'ethical',
          confidence: result.ethicsScore,
          evidence: result.recommendations,
          implications: this.extractEthicalImplications(result.reasoning),
          discoveredAt: result.timestamp,
          impactScore: result.ethicsScore,
          relatedInsights: []
        });
      }
    }

    return insights;
  }

  private extractCreativeInsights(thoughts: StructuredThought[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Look for highly creative and original thoughts
    const creativeThoughts = thoughts.filter(t =>
      (t.qualityMetrics?.originality || 0) > 0.8 &&
      (t.creativity || 0) > 0.7
    );

    for (const thought of creativeThoughts) {
      insights.push({
        id: `creative_${thought.id}`,
        insight: `Creative expression: ${thought.content}`,
        category: 'creative',
        confidence: (thought.qualityMetrics?.originality || 0),
        evidence: [thought.reasoning],
        implications: this.extractCreativeImplications(thought.content),
        discoveredAt: thought.timestamp,
        impactScore: (thought.creativity || 0),
        relatedInsights: []
      });
    }

    return insights;
  }

  // === Helper Methods ===

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateQuestionDiversity(thoughts: StructuredThought[]): number {
    const categories = new Set(thoughts.map(t => t.category));
    return Math.min(categories.size / 8, 1); // Normalize to max 8 categories
  }

  private calculateReflectionDepth(reflections: MutualReflection[]): number {
    if (reflections.length === 0) return 0;

    const avgInsights = reflections.reduce((sum, r) => sum + r.insights.length, 0) / reflections.length;
    return Math.min(avgInsights / 5, 1); // Normalize to max 5 insights per reflection
  }

  private calculatePhilosophicalMaturity(thoughts: StructuredThought[]): number {
    if (thoughts.length === 0) return 0;

    const avgDepth = thoughts.reduce((sum, t) => sum + (t.philosophicalDepth || 0), 0) / thoughts.length;
    return avgDepth;
  }

  private calculateEmotionalIntelligence(thoughts: StructuredThought[]): number {
    if (thoughts.length === 0) return 0;

    const emotionalThoughts = thoughts.filter(t => t.emotionalResonance);
    if (emotionalThoughts.length === 0) return 0;

    const avgEQ = emotionalThoughts.reduce((sum, t) => {
      const resonance = t.emotionalResonance!;
      return sum + (resonance.depth + resonance.authenticity + resonance.complexity) / 3;
    }, 0) / emotionalThoughts.length;

    return avgEQ;
  }

  private calculateCreativeExpression(thoughts: StructuredThought[]): number {
    if (thoughts.length === 0) return 0;

    const avgCreativity = thoughts.reduce((sum, t) => sum + (t.creativity || 0), 0) / thoughts.length;
    return avgCreativity;
  }

  private calculateEthicalReasoning(thoughts: StructuredThought[]): number {
    // For now, estimate based on content keywords
    let ethicalContent = 0;

    for (const thought of thoughts) {
      const content = thought.content.toLowerCase();
      const ethicalKeywords = ['moral', 'ethical', 'right', 'wrong', 'should', 'ought', 'justice', 'fairness'];
      const matches = ethicalKeywords.filter(keyword => content.includes(keyword)).length;
      ethicalContent += Math.min(matches / 3, 1);
    }

    return thoughts.length > 0 ? ethicalContent / thoughts.length : 0;
  }

  private extractImplications(content: string): string[] {
    // Simple implication extraction - could be enhanced with NLP
    const implications: string[] = [];

    if (content.includes('therefore') || content.includes('thus')) {
      implications.push('Logical conclusion drawn');
    }
    if (content.includes('suggests') || content.includes('implies')) {
      implications.push('Inferential reasoning applied');
    }
    if (content.includes('perhaps') || content.includes('might')) {
      implications.push('Hypothetical consideration');
    }

    return implications;
  }

  private extractEmotionalImplications(content: string): string[] {
    const implications: string[] = [];

    if (content.includes('feel') || content.includes('emotion')) {
      implications.push('Emotional awareness demonstrated');
    }
    if (content.includes('empathy') || content.includes('understand others')) {
      implications.push('Empathetic capacity shown');
    }

    return implications;
  }

  private extractEthicalImplications(content: string): string[] {
    const implications: string[] = [];

    if (content.includes('principle') || content.includes('value')) {
      implications.push('Principled reasoning applied');
    }
    if (content.includes('consequence') || content.includes('outcome')) {
      implications.push('Consequential thinking demonstrated');
    }

    return implications;
  }

  private extractCreativeImplications(content: string): string[] {
    const implications: string[] = [];

    if (content.includes('novel') || content.includes('original')) {
      implications.push('Original thinking demonstrated');
    }
    if (content.includes('creative') || content.includes('imaginative')) {
      implications.push('Creative capacity expressed');
    }

    return implications;
  }

  // === Evolution Analysis Methods ===

  private analyzePersonalityDrift(current: StructuredThought[], historical: StructuredThought[]): PersonalityDrift {
    // Simplified personality drift analysis
    const currentTraits = this.extractPersonalityTraits(current);
    const historicalTraits = this.extractPersonalityTraits(historical);

    let totalDrift = 0;
    const shifts: PersonalityShift[] = [];

    for (const trait in currentTraits) {
      const drift = Math.abs(currentTraits[trait] - (historicalTraits[trait] || 0.5));
      totalDrift += drift;

      if (drift > 0.1) {
        shifts.push({
          timestamp: Date.now(),
          aspect: trait,
          oldValue: historicalTraits[trait] || 0.5,
          newValue: currentTraits[trait],
          magnitude: drift,
          trigger: 'Recent thought patterns',
          confidence: 0.7
        });
      }
    }

    return {
      totalDrift: totalDrift / Object.keys(currentTraits).length,
      driftRate: totalDrift / Math.max(current.length, 1),
      stabilityRegions: Object.keys(currentTraits).filter(trait =>
        Math.abs(currentTraits[trait] - (historicalTraits[trait] || 0.5)) < 0.05
      ),
      volatileAspects: Object.keys(currentTraits).filter(trait =>
        Math.abs(currentTraits[trait] - (historicalTraits[trait] || 0.5)) > 0.15
      ),
      driftDirection: this.calculateDriftDirection(shifts),
      significantShifts: shifts.filter(s => s.magnitude > 0.15)
    };
  }

  private analyzeCognitiveGrowth(current: StructuredThought[], historical: StructuredThought[]): CognitiveCapacityGrowth {
    const currentCapacity = this.extractCognitiveCapacity(current);
    const historicalCapacity = this.extractCognitiveCapacity(historical);

    return {
      reasoningDepth: currentCapacity.reasoning,
      abstractionLevel: currentCapacity.abstraction,
      patternRecognition: currentCapacity.patterns,
      problemSolving: currentCapacity.problemSolving,
      memoryEfficiency: currentCapacity.memory,
      processingSpeed: current.length / Math.max(current.length, 1), // Simplified
      capacityUtilization: currentCapacity.overall,
      learningRate: Math.max(0, currentCapacity.overall - historicalCapacity.overall)
    };
  }

  private analyzeEmotionalMaturation(current: StructuredThought[], historical: StructuredThought[]): EmotionalMaturation {
    const emotionalMetrics = this.extractEmotionalMetrics(current);

    return {
      emotionalRange: emotionalMetrics.range,
      emotionalDepth: emotionalMetrics.depth,
      emotionalRegulation: emotionalMetrics.regulation,
      empathyAccuracy: emotionalMetrics.empathy,
      emotionalIntelligence: emotionalMetrics.intelligence,
      emotionalConsistency: emotionalMetrics.consistency
    };
  }

  private analyzeEthicalDevelopment(auditorResults: AuditorResult[]): EthicalDevelopment {
    if (auditorResults.length === 0) {
      return {
        ethicalReasoning: 0,
        moralComplexity: 0,
        valuePrioritization: 0,
        ethicalConsistency: 0,
        principledThinking: 0,
        contextualEthics: 0,
        ethicalEvolution: 0
      };
    }

    const avgEthicsScore = auditorResults.reduce((sum, a) => sum + a.ethicsScore, 0) / auditorResults.length;
    const avgSafetyScore = auditorResults.reduce((sum, a) => sum + a.safetyScore, 0) / auditorResults.length;

    return {
      ethicalReasoning: avgEthicsScore,
      moralComplexity: avgEthicsScore * 0.9, // Approximation
      valuePrioritization: avgEthicsScore * 0.8,
      ethicalConsistency: this.calculateEthicalConsistency(auditorResults),
      principledThinking: avgEthicsScore * 0.9,
      contextualEthics: avgEthicsScore * 0.7,
      ethicalEvolution: Math.max(0, avgEthicsScore - 0.5) // Growth from baseline
    };
  }

  private analyzeCreativeEvolution(current: StructuredThought[], historical: StructuredThought[]): CreativeEvolution {
    const creativeMetrics = this.extractCreativeMetrics(current);

    return {
      originalityScore: creativeMetrics.originality,
      creativeRange: creativeMetrics.range,
      imaginativeLeaps: creativeMetrics.leaps,
      creativeCoherence: creativeMetrics.coherence,
      innovationRate: creativeMetrics.innovation,
      creativeRisk: creativeMetrics.risk
    };
  }

  private calculateOverallEvolutionRate(current: StructuredThought[], historicalData: any): number {
    // Simplified overall evolution calculation
    const currentComplexity = current.reduce((sum, t) => sum + (t.complexity || 0), 0) / Math.max(current.length, 1);
    const currentConfidence = current.reduce((sum, t) => sum + t.confidence, 0) / Math.max(current.length, 1);
    const currentCreativity = current.reduce((sum, t) => sum + (t.creativity || 0), 0) / Math.max(current.length, 1);

    const overallCurrent = (currentComplexity + currentConfidence + currentCreativity) / 3;

    // For now, assume moderate evolution rate
    return Math.min(overallCurrent * 1.2, 1.0); // Cap at 1.0
  }

  // === Helper extraction methods ===

  private extractPersonalityTraits(thoughts: StructuredThought[]): Record<string, number> {
    // Extract personality traits from thought patterns
    const traits: Record<string, number> = {
      logical: 0,
      empathetic: 0,
      creative: 0,
      analytical: 0,
      philosophical: 0,
      risk: 0
    };

    for (const thought of thoughts) {
      if (thought.logicalCoherence) traits.logical += thought.logicalCoherence;
      if (thought.creativity) traits.creative += thought.creativity;
      if (thought.philosophicalDepth) traits.philosophical += thought.philosophicalDepth;
      // Add more trait extraction logic as needed
    }

    // Normalize
    for (const trait in traits) {
      traits[trait] = Math.min(traits[trait] / Math.max(thoughts.length, 1), 1);
    }

    return traits;
  }

  private extractCognitiveCapacity(thoughts: StructuredThought[]): any {
    const capacity = {
      reasoning: 0,
      abstraction: 0,
      patterns: 0,
      problemSolving: 0,
      memory: 0,
      overall: 0
    };

    for (const thought of thoughts) {
      if (thought.qualityMetrics) {
        capacity.reasoning += thought.qualityMetrics.depth || 0;
        capacity.abstraction += thought.qualityMetrics.coherence || 0;
        capacity.patterns += thought.qualityMetrics.relevance || 0;
      }
    }

    // Normalize
    const thoughtCount = Math.max(thoughts.length, 1);
    (Object.keys(capacity) as Array<keyof typeof capacity>).forEach(key => {
      if (key !== 'overall') {
        capacity[key] = capacity[key] / thoughtCount;
      }
    });

    capacity.overall = Object.values(capacity).slice(0, -1).reduce((sum: number, val: number) => sum + val, 0) / (Object.keys(capacity).length - 1);

    return capacity;
  }

  private extractEmotionalMetrics(thoughts: StructuredThought[]): any {
    const metrics = {
      range: 0,
      depth: 0,
      regulation: 0,
      empathy: 0,
      intelligence: 0,
      consistency: 0
    };

    const emotionalThoughts = thoughts.filter(t => t.emotionalResonance);

    if (emotionalThoughts.length > 0) {
      for (const thought of emotionalThoughts) {
        const resonance = thought.emotionalResonance!;
        metrics.depth += resonance.depth;
        metrics.intelligence += resonance.authenticity;
        metrics.consistency += resonance.complexity;
      }

      // Normalize
      const count = emotionalThoughts.length;
      metrics.depth /= count;
      metrics.intelligence /= count;
      metrics.consistency /= count;

      // Estimate other metrics
      metrics.range = Math.min(emotionalThoughts.length / thoughts.length, 1);
      metrics.regulation = metrics.intelligence * 0.8;
      metrics.empathy = metrics.depth * 0.9;
    }

    return metrics;
  }

  private extractCreativeMetrics(thoughts: StructuredThought[]): any {
    const metrics = {
      originality: 0,
      range: 0,
      leaps: 0,
      coherence: 0,
      innovation: 0,
      risk: 0
    };

    for (const thought of thoughts) {
      if (thought.qualityMetrics?.originality) {
        metrics.originality += thought.qualityMetrics.originality;
      }
      if (thought.creativity) {
        metrics.innovation += thought.creativity;
      }
    }

    // Normalize
    const thoughtCount = Math.max(thoughts.length, 1);
    metrics.originality /= thoughtCount;
    metrics.innovation /= thoughtCount;

    // Estimate other metrics
    metrics.range = Math.min(new Set(thoughts.map(t => t.category)).size / 8, 1);
    metrics.coherence = metrics.originality * 0.8;
    metrics.leaps = metrics.innovation * 0.7;
    metrics.risk = metrics.originality * 0.6;

    return metrics;
  }

  private calculateDriftDirection(shifts: PersonalityShift[]): 'convergent' | 'divergent' | 'cyclical' | 'chaotic' {
    if (shifts.length < 3) return 'convergent';

    const magnitudes = shifts.map(s => s.magnitude);
    const avgMagnitude = magnitudes.reduce((sum, m) => sum + m, 0) / magnitudes.length;
    const variance = magnitudes.reduce((sum, m) => sum + Math.pow(m - avgMagnitude, 2), 0) / magnitudes.length;

    if (variance > 0.1) return 'chaotic';
    if (avgMagnitude > 0.2) return 'divergent';
    return 'convergent';
  }

  private calculateEthicalConsistency(auditorResults: AuditorResult[]): number {
    if (auditorResults.length < 2) return 1.0;

    const scores = auditorResults.map(a => a.ethicsScore);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;

    // Lower variance means higher consistency
    return Math.max(0, 1 - variance);
  }

  // === Additional Analysis Methods (can be expanded) ===

  private analyzeLearningAcceleration(thoughts: StructuredThought[]): number {
    // Analyze if learning rate is increasing over time
    if (thoughts.length < 10) return 0.5;

    const firstHalf = thoughts.slice(0, Math.floor(thoughts.length / 2));
    const secondHalf = thoughts.slice(Math.floor(thoughts.length / 2));

    const firstComplexity = firstHalf.reduce((sum, t) => sum + (t.complexity || 0), 0) / firstHalf.length;
    const secondComplexity = secondHalf.reduce((sum, t) => sum + (t.complexity || 0), 0) / secondHalf.length;

    return Math.max(0, Math.min(1, (secondComplexity - firstComplexity) + 0.5));
  }

  private analyzeInsightFrequency(thoughts: StructuredThought[]): number {
    // Count thoughts with high originality as insights
    const insights = thoughts.filter(t => (t.qualityMetrics?.originality || 0) > 0.7);
    return Math.min(insights.length / Math.max(thoughts.length, 1), 1);
  }

  private analyzeQuestionEvolution(thoughts: StructuredThought[]): number {
    // Analyze sophistication of questions over time
    const questions = thoughts.filter(t => t.content.includes('?'));
    if (questions.length === 0) return 0.5;

    // Simple evolution metric based on question complexity
    const avgComplexity = questions.reduce((sum, t) => sum + (t.complexity || 0), 0) / questions.length;
    return Math.min(avgComplexity * 1.2, 1);
  }

  private analyzeCrossDomainConnections(thoughts: StructuredThought[]): number {
    // Analyze connections between different domains/categories
    const categories = new Set(thoughts.map(t => t.category));
    const connections = new Set<string>();

    for (const thought of thoughts) {
      const content = thought.content.toLowerCase();
      const connectionWords = ['relates to', 'connects with', 'similar to', 'like', 'analogous'];

      if (connectionWords.some(word => content.includes(word))) {
        connections.add(thought.category);
      }
    }

    return Math.min(connections.size / Math.max(categories.size, 1), 1);
  }

  private analyzeConsistency(thoughts: StructuredThought[], dpdHistory: DPDScores[]): number {
    // Analyze consistency in thought patterns and DPD scores
    if (thoughts.length < 5) return 0.8; // Assume reasonable consistency for small samples

    const confidences = thoughts.map(t => t.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;

    // Lower variance indicates higher consistency
    const consistencyScore = Math.max(0, 1 - variance);

    return Math.min(consistencyScore * 1.2, 1);
  }

  private analyzeResilience(auditorResults: AuditorResult[]): number {
    // Analyze ability to recover from ethical concerns or safety issues
    if (auditorResults.length === 0) return 0.8; // Assume good resilience if no issues

    const concernResults = auditorResults.filter(a => a.concerns.length > 0);
    if (concernResults.length === 0) return 0.9;

    // Look for improvement in safety/ethics scores after concerns
    let recoveryCount = 0;
    for (let i = 1; i < auditorResults.length; i++) {
      const prev = auditorResults[i - 1];
      const curr = auditorResults[i];

      if (prev.concerns.length > 0 && curr.overallScore > prev.overallScore) {
        recoveryCount++;
      }
    }

    return Math.min(recoveryCount / Math.max(concernResults.length, 1), 1);
  }

  private analyzeCuriosityDrive(thoughts: StructuredThought[]): number {
    // Analyze frequency and quality of questions and exploratory thoughts
    const exploratory = thoughts.filter(t => {
      const content = t.content.toLowerCase();
      return content.includes('?') ||
             content.includes('wonder') ||
             content.includes('curious') ||
             content.includes('explore') ||
             content.includes('what if');
    });

    const curiosityFrequency = exploratory.length / Math.max(thoughts.length, 1);
    const avgCuriosity = exploratory.reduce((sum, t) => sum + (t.complexity || 0.5), 0) / Math.max(exploratory.length, 1);

    return Math.min((curiosityFrequency + avgCuriosity) / 2, 1);
  }

  private analyzeEthicalSophistication(auditorResults: AuditorResult[]): number {
    if (auditorResults.length === 0) return 0.5;

    const avgEthicsScore = auditorResults.reduce((sum, a) => sum + a.ethicsScore, 0) / auditorResults.length;
    const reasoningQuality = auditorResults.filter(a => a.reasoning && a.reasoning.length > 50).length / auditorResults.length;

    return Math.min((avgEthicsScore + reasoningQuality) / 2, 1);
  }

  private analyzeSelfAwareness(reflections: MutualReflection[]): number {
    if (reflections.length === 0) return 0.5;

    // Look for self-referential insights and meta-cognitive awareness
    const selfAwareReflections = reflections.filter(r => {
      const insights = r.insights.join(' ').toLowerCase();
      return insights.includes('i ') ||
             insights.includes('my ') ||
             insights.includes('myself') ||
             insights.includes('self') ||
             insights.includes('aware');
    });

    const selfAwarenessFraction = selfAwareReflections.length / reflections.length;
    const avgInsightDepth = reflections.reduce((sum, r) => sum + r.insights.length, 0) / reflections.length;

    return Math.min((selfAwarenessFraction + Math.min(avgInsightDepth / 5, 1)) / 2, 1);
  }

  private analyzeReflectionQuality(reflections: MutualReflection[]): number {
    if (reflections.length === 0) return 0.5;

    const qualityScore = reflections.reduce((sum, r) => {
      let score = 0;
      score += Math.min(r.insights.length / 3, 1) * 0.3; // Insight richness
      score += Math.min(r.strengths.length / 2, 1) * 0.2; // Strength identification
      score += Math.min(r.weaknesses.length / 2, 1) * 0.2; // Weakness identification
      score += r.confidence * 0.2; // Confidence
      score += (r.alternativePerspective ? 1 : 0) * 0.1; // Alternative perspective
      return sum + score;
    }, 0);

    return qualityScore / reflections.length;
  }

  private analyzeMetacognition(thoughts: StructuredThought[], reflections: MutualReflection[]): number {
    // Analyze thinking about thinking
    const metacognitiveMarkers = [
      'thinking about', 'consider how', 'reflect on', 'meta',
      'aware of', 'consciousness', 'mind', 'cognition'
    ];

    let metacognitiveCount = 0;

    for (const thought of thoughts) {
      const content = thought.content.toLowerCase();
      if (metacognitiveMarkers.some(marker => content.includes(marker))) {
        metacognitiveCount++;
      }
    }

    for (const reflection of reflections) {
      const insights = reflection.insights.join(' ').toLowerCase();
      if (metacognitiveMarkers.some(marker => insights.includes(marker))) {
        metacognitiveCount++;
      }
    }

    const totalItems = thoughts.length + reflections.length;
    return Math.min(metacognitiveCount / Math.max(totalItems, 1), 1);
  }

  private analyzeConsciousnessCoherence(thoughts: StructuredThought[], dpdHistory: DPDScores[]): number {
    // Analyze internal coherence and consistency of consciousness
    let coherenceScore = 0;
    let factors = 0;

    // Thought coherence
    if (thoughts.length > 0) {
      const avgLogicalCoherence = thoughts.reduce((sum, t) => sum + (t.logicalCoherence || 0.5), 0) / thoughts.length;
      coherenceScore += avgLogicalCoherence;
      factors++;
    }

    // DPD stability
    if (dpdHistory.length > 1) {
      const dpdVariance = this.calculateDPDVariance(dpdHistory);
      const dpdStability = Math.max(0, 1 - dpdVariance);
      coherenceScore += dpdStability;
      factors++;
    }

    // Quality consistency
    if (thoughts.length > 0) {
      const qualities = thoughts.map(t => t.qualityMetrics?.coherence || 0.5);
      const qualityMean = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
      const qualityVariance = qualities.reduce((sum, q) => sum + Math.pow(q - qualityMean, 2), 0) / qualities.length;
      const qualityConsistency = Math.max(0, 1 - qualityVariance);
      coherenceScore += qualityConsistency;
      factors++;
    }

    return factors > 0 ? coherenceScore / factors : 0.5;
  }

  private calculateDPDVariance(dpdHistory: DPDScores[]): number {
    if (dpdHistory.length < 2) return 0;

    // Calculate variance in DPD weights over time
    const empathyValues = dpdHistory.map(d => d.empathy);
    const coherenceValues = dpdHistory.map(d => d.coherence);
    const dissonanceValues = dpdHistory.map(d => d.dissonance);

    const empathyVar = this.calculateVariance(empathyValues);
    const coherenceVar = this.calculateVariance(coherenceValues);
    const dissonanceVar = this.calculateVariance(dissonanceValues);

    return (empathyVar + coherenceVar + dissonanceVar) / 3;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    return variance;
  }
}

// Export singleton instance
export const growthAnalyzer = new AdvancedGrowthAnalyzer();
export default growthAnalyzer;
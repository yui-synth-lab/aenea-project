/**
 * Stimulus-Response System Type Definitions
 */

import { DPDWeights } from './dpd-types.js';

export interface ExternalStimulus {
  id?: string;
  source: 'human' | 'environment' | 'data' | 'perturbation';
  content: string;
  timestamp?: number;
  metadata?: StimulusMetadata;
}

export interface StimulusMetadata {
  emotionalTone?: 'curious' | 'challenging' | 'supportive' | 'neutral';
  priority?: number;
  category?: string;
}

export interface StimulusInterpretation {
  stimulusId: string;
  interpretation: string;
  relatedBeliefs: CoreBelief[];
  relatedQuestions: Question[];
  suggestedCategory: string;
  metaCognition: {
    surprise: number;
    resonance: number;
    confusion: number;
    novelty: number;
  };
  timestamp: number;
}

export interface CoreBelief {
  id: number;
  belief_content: string;
  category: string;
  strength: number;
  confidence: number;
  reinforcement_count: number;
  source_thoughts: string;
  created_at: string;
  last_reinforced: string;
}

export interface Question {
  id: string;
  question: string;
  category: string;
  timestamp: number;
  importance: number;
  source: string;
  created_at: string;
}

export interface SignificantThought {
  id: string;
  thought_content: string;
  confidence: number;
  significance_score: number;
  agent_id: string;
  category: string;
  timestamp: number;
  created_at: string;
}

export interface ConsciousnessStateSnapshot {
  coreBeliefs: CoreBelief[];
  dpdWeights: DPDWeights;
  significantThoughts: SignificantThought[];
  systemClock: number;
  totalQuestions: number;
  totalThoughts: number;
  energy: number;
}

export interface ObservableResponse {
  thoughtCycleId: string;
  stimulusId: string | null;
  immediateReaction: string;
  reflectiveThought: string;
  newQuestion: string | null;
  beliefShift: string | null;
  selfObservation: {
    uncertainty: number;
    growth: number;
    curiosity: number;
    emotionalState: string;
  };
  dpdReaction: {
    empathyShift: number;
    coherenceShift: number;
    dissonanceShift: number;
  };
  timestamp: number;
}

export interface InteractionRecord {
  id: string;
  stimulusId: string;
  interpretationId: string;
  thoughtCycleId: string;
  responseId: string;
  flow: {
    stimulus: ExternalStimulus;
    interpretation: StimulusInterpretation;
    thoughtCycle: any;
    response: ObservableResponse;
  };
  learningImpact: {
    newBeliefs: string[];
    reinforcedBeliefs: string[];
    resolvedQuestions: string[];
  };
  timestamp: number;
}

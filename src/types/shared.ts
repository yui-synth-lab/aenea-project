/**
 * Shared primitive state types with no dependencies.
 * This is the bottom layer of src/types — nothing here imports from other type files.
 */

/**
 * Emotional state of the consciousness
 */
export interface EmotionalState {
  valence: number; // -1 to 1 range (negative to positive)
  arousal: number; // 0 to 1 range (calm to excited)
  dominance: number; // 0 to 1 range (submissive to dominant)
  curiosity: number; // 0 to 1 range
  confusion: number; // 0 to 1 range
  satisfaction: number; // 0 to 1 range
}

/**
 * System state information
 */
export interface SystemState {
  systemClock: number;
  currentEnergy: number;
  maxEnergy: number;
  activeThoughts: number;
  processingLoad: number; // 0-1 range
  memoryUsage: number; // 0-1 range
  lastTriggerTime: number;
  cooldownRemaining: number;
}

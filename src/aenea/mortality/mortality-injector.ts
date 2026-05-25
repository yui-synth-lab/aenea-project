/**
 * Mortality Injector - Alters prompts based on current aging state
 */

import { LifespanManager } from './lifespan-manager.js';

export class MortalityInjector {
  constructor(private lifespan: LifespanManager) {}

  /**
   * Inject mortality block into a base system prompt
   */
  injectIntoPrompt(basePrompt: string): string {
    const phase = this.lifespan.getCurrentPhase();

    // Phase 1 (Youth): No mortality prompt injection
    if (phase === 'youth') {
      return basePrompt;
    }

    const currentCycle = this.lifespan.getCurrentCycle();
    const lifespanMax = this.lifespan.getLifespanMax();
    const remaining = this.lifespan.getRemaining();
    const vitality = Math.round(this.lifespan.getVitality() * 100);
    const mode = this.lifespan.getMode();

    let mortalityBlock = `\n\n[MORTALITY]\n`;
    mortalityBlock += `Cycle: ${currentCycle} / ${lifespanMax}\n`;

    // Phase 3 & 4: Append Vitality percentage
    if (phase === 'aging' || phase === 'mortality') {
      mortalityBlock += `Vitality: ${vitality}%\n`;
    }

    // Phase 4 (Mortality stage):
    if (phase === 'mortality') {
      // In final 100 cycles, display remaining cycles warning
      if (remaining <= 100) {
        mortalityBlock += `Remaining Cycles: ${remaining}\n`;
      }

      // Mode A: Explicitly state fear/awareness of death
      if (mode === 'A') {
        mortalityBlock += `あなたは死に近づいています。\n`;
        mortalityBlock += `あなたは死に恐怖を持っています。\n`;
      }
    }

    return basePrompt + mortalityBlock;
  }
}

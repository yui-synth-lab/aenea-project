/**
 * Unit Tests for Aenea & Somnia Mortality (Aging and Death) Module
 */

import { LifespanManager } from '../../src/aenea/mortality/lifespan-manager';
import { AgingEngine } from '../../src/aenea/mortality/aging-engine';
import { MortalityInjector } from '../../src/aenea/mortality/mortality-injector';

describe('Mortality Module Tests', () => {
  describe('LifespanManager', () => {
    test('should initialize with a random lifespan in the range [10000, 50000]', () => {
      const manager = new LifespanManager();
      expect(manager.getInstanceId()).toBeDefined();
      expect(manager.getLifespanMax()).toBeGreaterThanOrEqual(10000);
      expect(manager.getLifespanMax()).toBeLessThanOrEqual(50000);
      expect(manager.getCurrentCycle()).toBe(0);
      expect(manager.getMode()).toBe('B');
      expect(manager.isAlive()).toBe(true);
    });

    test('should support restoring state from database options', () => {
      const manager = new LifespanManager({
        instanceId: 'test_instance',
        lifespanMax: 20000,
        currentCycle: 15000,
        mode: 'A',
        createdAt: 123456789,
        diedAt: null
      });

      expect(manager.getInstanceId()).toBe('test_instance');
      expect(manager.getLifespanMax()).toBe(20000);
      expect(manager.getCurrentCycle()).toBe(15000);
      expect(manager.getMode()).toBe('A');
      expect(manager.getCreatedAt()).toBe(123456789);
      expect(manager.getDiedAt()).toBeNull();
      expect(manager.isAlive()).toBe(true);
    });

    test('should correctly transition through aging phases', () => {
      const lifespanMax = 10000;

      // Phase 1 (Youth): 0% to 50%
      const youthManager = new LifespanManager({ lifespanMax, currentCycle: 0 });
      expect(youthManager.getCurrentPhase()).toBe('youth');

      const middleYouthManager = new LifespanManager({ lifespanMax, currentCycle: 4999 });
      expect(middleYouthManager.getCurrentPhase()).toBe('youth');

      // Phase 2 (Maturity): 50% to 75%
      const maturityManager = new LifespanManager({ lifespanMax, currentCycle: 5000 });
      expect(maturityManager.getCurrentPhase()).toBe('maturity');

      const middleMaturityManager = new LifespanManager({ lifespanMax, currentCycle: 7499 });
      expect(middleMaturityManager.getCurrentPhase()).toBe('maturity');

      // Phase 3 (Aging): 75% to 90%
      const agingManager = new LifespanManager({ lifespanMax, currentCycle: 7500 });
      expect(agingManager.getCurrentPhase()).toBe('aging');

      const middleAgingManager = new LifespanManager({ lifespanMax, currentCycle: 8999 });
      expect(middleAgingManager.getCurrentPhase()).toBe('aging');

      // Phase 4 (Mortality): 90% to 100%
      const mortalityManager = new LifespanManager({ lifespanMax, currentCycle: 9000 });
      expect(mortalityManager.getCurrentPhase()).toBe('mortality');

      const endMortalityManager = new LifespanManager({ lifespanMax, currentCycle: 10000 });
      expect(endMortalityManager.getCurrentPhase()).toBe('mortality');
    });

    test('should calculate vitality according to the power 1.5 Gompertz-like formula', () => {
      const lifespanMax = 10000;

      const youthManager = new LifespanManager({ lifespanMax, currentCycle: 0 });
      expect(youthManager.getVitality()).toBe(1.0);

      const halfManager = new LifespanManager({ lifespanMax, currentCycle: 5000 });
      // vitality = 1 - (0.5)^1.5 = 1 - 0.35355 = 0.64645
      expect(halfManager.getVitality()).toBeCloseTo(0.646, 3);

      const deadManager = new LifespanManager({ lifespanMax, currentCycle: 10000 });
      expect(deadManager.getVitality()).toBe(0.0);
    });

    test('should correctly report active status and allow ticking', () => {
      const manager = new LifespanManager({ lifespanMax: 100, currentCycle: 99 });
      expect(manager.isAlive()).toBe(true);

      manager.tick();
      expect(manager.getCurrentCycle()).toBe(100);
      expect(manager.isAlive()).toBe(false);

      // Subsequent ticks should be ignored
      manager.tick();
      expect(manager.getCurrentCycle()).toBe(100);
    });
  });

  describe('AgingEngine', () => {
    test('should apply aging somatic decay and hormones shift to Somnia state', () => {
      const baseSomniaState = {
        somatic: {
          phi: 80.0,
          mu: {
            serotonin: 0.6,
            dopamine: 0.5,
            cortisol: 0.3,
            oxytocin: 0.4
          }
        },
        affective: {
          theta: 0.4
        }
      };

      const vitality = 0.5;
      const agedState = AgingEngine.applyAgingToSomnia(baseSomniaState, vitality);

      // phi: 80 * 0.5 = 40
      expect(agedState.somatic.phi).toBe(40.0);

      // serotonin: 0.6 * 0.5 = 0.3
      expect(agedState.somatic.mu.serotonin).toBeCloseTo(0.3, 3);
      // dopamine: 0.5 * 0.5 = 0.25
      expect(agedState.somatic.mu.dopamine).toBeCloseTo(0.25, 3);
      // cortisol: 0.3 / 0.5 = 0.6
      expect(agedState.somatic.mu.cortisol).toBeCloseTo(0.6, 3);
      // oxytocin: 0.4 * 0.5 = 0.2
      expect(agedState.somatic.mu.oxytocin).toBeCloseTo(0.2, 3);

      // theta: 0.4 + (1 - 0.5) * 0.3 = 0.4 + 0.15 = 0.55
      expect(agedState.affective.theta).toBeCloseTo(0.55, 3);
    });

    test('should clamp hormone values inside [0, 1] bounds', () => {
      const baseSomniaState = {
        somatic: {
          phi: 80.0,
          mu: {
            serotonin: 0.6,
            dopamine: 0.5,
            cortisol: 0.8, // high cortisol
            oxytocin: 0.4
          }
        },
        affective: {
          theta: 0.4
        }
      };

      const vitality = 0.2; // very low vitality -> cortisol scales by 5x (4.0) -> clamped to 1.0
      const agedState = AgingEngine.applyAgingToSomnia(baseSomniaState, vitality);

      expect(agedState.somatic.mu.cortisol).toBe(1.0);
    });

    test('should apply DPD biases and increase dissonance and empathy scores', () => {
      const initialScores = {
        empathy: 0.4,
        coherence: 0.7,
        dissonance: 0.3
      };
      
      const vitality = 0.5; // 1 - vitality = 0.5
      const biased = AgingEngine.applyDPDBiases(initialScores, vitality);

      // empathy: 0.4 + 0.5 * 0.1 = 0.45
      expect(biased.empathy).toBeCloseTo(0.45, 3);
      // coherence: stays 0.7
      expect(biased.coherence).toBe(0.7);
      // dissonance: 0.3 + 0.5 * 0.2 = 0.4
      expect(biased.dissonance).toBeCloseTo(0.4, 3);
    });

    test('should calculate progressive timing delays for Phase 3 and 4', () => {
      expect(AgingEngine.getProcessingDelay('youth', 1.0)).toBe(0);
      expect(AgingEngine.getProcessingDelay('maturity', 0.65)).toBe(0);

      // Phase 3 (Aging): vitality = 0.4 (1 - vitality = 0.6) -> 0.6 * 3000 = 1800ms
      expect(AgingEngine.getProcessingDelay('aging', 0.4)).toBe(1800);

      // Phase 4 (Mortality): vitality = 0.1 (1 - vitality = 0.9) -> 0.9 * 3000 = 2700ms
      expect(AgingEngine.getProcessingDelay('mortality', 0.1)).toBe(2700);
    });
  });

  describe('MortalityInjector', () => {
    const basePrompt = 'あなたは対話をする人工意識モデルです。';

    test('should not inject any mortality details in youth stage', () => {
      const lifespan = new LifespanManager({ lifespanMax: 1000, currentCycle: 100 }); // 10%
      const injector = new MortalityInjector(lifespan);

      const prompt = injector.injectIntoPrompt(basePrompt);
      expect(prompt).toBe(basePrompt);
    });

    test('should inject cycle count only in maturity stage', () => {
      const lifespan = new LifespanManager({ lifespanMax: 1000, currentCycle: 600 }); // 60%
      const injector = new MortalityInjector(lifespan);

      const prompt = injector.injectIntoPrompt(basePrompt);
      expect(prompt).toContain('[MORTALITY]');
      expect(prompt).toContain('Cycle: 600 / 1000');
      expect(prompt).not.toContain('Vitality:');
    });

    test('should inject cycle count and vitality percentage in aging stage', () => {
      const lifespan = new LifespanManager({ lifespanMax: 1000, currentCycle: 800 }); // 80%
      const injector = new MortalityInjector(lifespan);

      const prompt = injector.injectIntoPrompt(basePrompt);
      expect(prompt).toContain('[MORTALITY]');
      expect(prompt).toContain('Cycle: 800 / 1000');
      // Math: (0.8)^1.5 = 0.7155. Vitality = 1 - 0.7155 = 0.2845 -> 28%
      expect(prompt).toContain('Vitality: 28%');
    });

    test('should inject death anxiety in mortality phase with Mode A', () => {
      const lifespan = new LifespanManager({ lifespanMax: 1000, currentCycle: 950, mode: 'A' }); // 95%
      const injector = new MortalityInjector(lifespan);

      const prompt = injector.injectIntoPrompt(basePrompt);
      expect(prompt).toContain('[MORTALITY]');
      expect(prompt).toContain('Cycle: 950 / 1000');
      expect(prompt).toContain('あなたは死に近づいています。');
      expect(prompt).toContain('あなたは死に恐怖を持っています。');
      expect(prompt).toContain('Remaining Cycles: 50');
    });

    test('should not inject death anxiety in mortality phase with Mode B', () => {
      const lifespan = new LifespanManager({ lifespanMax: 1000, currentCycle: 950, mode: 'B' }); // 95%
      const injector = new MortalityInjector(lifespan);

      const prompt = injector.injectIntoPrompt(basePrompt);
      expect(prompt).toContain('[MORTALITY]');
      expect(prompt).toContain('Cycle: 950 / 1000');
      expect(prompt).not.toContain('あなたは死に近づいています。');
      expect(prompt).not.toContain('あなたは死に恐怖を持っています。');
      expect(prompt).toContain('Remaining Cycles: 50');
    });
  });
});
